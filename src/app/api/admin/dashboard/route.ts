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
      revenueLast7DaysOrders,
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
      // Fetch orders for the last 7 days to calculate daily revenue
      prisma.order.findMany({
        where: {
          status: { in: ["PAYMENT_APPROVED", "DELIVERED"] },
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
        select: {
          createdAt: true,
          totalAmount: true,
        },
      }),
    ]);

    // Aggregate revenue by date (YYYY-MM-DD)
    const dayMap = new Map<string, number>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      dayMap.set(d.toISOString().slice(0, 10), 0);
    }
    for (const order of revenueLast7DaysOrders) {
      const day = new Date(order.createdAt).toISOString().slice(0, 10);
      if (dayMap.has(day)) {
        dayMap.set(day, (dayMap.get(day) || 0) + Number(order.totalAmount));
      }
    }
    const revenueByDay = Array.from(dayMap.entries()).map(([date, revenue]) => ({
      date,
      revenue,
    }));

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
