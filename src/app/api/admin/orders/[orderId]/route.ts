import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { orderId } = await params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          include: { billingAddress: true },
        },
        items: {
          include: {
            product: {
              select: { id: true, name: true, thumbnail: true },
            },
          },
        },
        payment: {
          include: { paymentQR: true },
        },
        downloadTokens: {
          include: { product: { select: { name: true } } },
        },
        approvedBy: {
          select: { name: true, userId: true },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("GET /api/admin/orders/[orderId] error:", error);
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}
