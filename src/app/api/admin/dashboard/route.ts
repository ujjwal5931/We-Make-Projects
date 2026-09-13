import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || (session.user as any).role !== "ADMIN") return null;
  return session;
}

// Admin dashboard stats
export async function GET(request: NextRequest) {
  try {
    const session = await requireAdmin();
    if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const [
      totalOrders,
      pendingPayments,
      approvedOrders,
      rejectedOrders,
      totalProducts,
      totalCustomers,
      totalReviews,
      revenueResult,
      recentOrders,
      ordersByStatus,
      revenueByDay,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: { in: ["PAYMENT_SUBMITTED", "UNDER_REVIEW"] } } }),
      prisma.order.count({ where: { status: { in: ["PAYMENT_APPROVED", "DELIVERED"] } } }),
      prisma.order.count({ where: { status: "PAYMENT_REJECTED" } }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.review.count({ where: { isVisible: true } }),
      prisma.order.aggregate({
        where: { status: { in: ["PAYMENT_APPROVED", "DELIVERED"] } },
        _sum: { totalAmount: true },
      }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true, email: true } },
          items: { select: { productNameSnapshot: true } },
        },
      }),
      prisma.order.groupBy({
        by: ["status"],
        _count: { status: true },
      }),
      // Revenue last 7 days — SQLite compatible
      prisma.$queryRaw<{ date: string; revenue: number }[]>`
        SELECT 
          strftime('%Y-%m-%d', createdAt) as date,
          CAST(SUM(totalAmount) AS REAL) as revenue
        FROM orders
        WHERE status IN ('PAYMENT_APPROVED', 'DELIVERED')
          AND createdAt >= datetime('now', '-7 days')
        GROUP BY strftime('%Y-%m-%d', createdAt)
        ORDER BY date ASC
      `,
    ]);

    return NextResponse.json({
      stats: {
        totalRevenue: Number(revenueResult._sum.totalAmount || 0),
        totalOrders,
        pendingPayments,
        approvedOrders,
        rejectedOrders,
        totalProducts,
        totalCustomers,
        totalReviews,
      },
      recentOrders,
      ordersByStatus,
      revenueByDay,
    });
  } catch (error) {
    console.error("GET /api/admin/dashboard error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
