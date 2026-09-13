import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || (session.user as any).role !== "ADMIN") return null;
  return session;
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdmin();
    if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const [customers, total] = await Promise.all([
      prisma.user.findMany({
        where: { role: "CUSTOMER" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true, userId: true, name: true, email: true, phone: true,
          isActive: true, createdAt: true,
          _count: { select: { orders: true } },
          orders: {
            select: { totalAmount: true, status: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where: { role: "CUSTOMER" } }),
    ]);

    const customersWithStats = customers.map((c) => ({
      ...c,
      totalSpent: c.orders
        .filter((o) => o.status === "PAYMENT_APPROVED" || o.status === "DELIVERED")
        .reduce((sum, o) => sum + Number(o.totalAmount), 0),
      orderCount: c._count.orders,
      orders: undefined,
    }));

    return NextResponse.json({
      customers: customersWithStats,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
  }
}
