import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendEmail, paymentApprovedEmail } from "@/lib/email";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || (session.user as any).role !== "ADMIN") return null;
  return session;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { orderId } = await params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { name: true, email: true } },
        downloadTokens: {
          where: { isActive: true },
          include: { product: { select: { name: true } } },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (
      order.status !== "PAYMENT_APPROVED" &&
      order.status !== "DELIVERED"
    ) {
      return NextResponse.json(
        { error: "Can only resend email for approved orders" },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const emailData = paymentApprovedEmail({
      customerName: order.user.name,
      orderNumber: order.orderNumber,
      totalAmount: `₹${Number(order.totalAmount).toFixed(2)}`,
      products: order.downloadTokens.map((t) => ({
        name: t.product.name,
        downloadUrl: `${appUrl}/api/download/${t.token}`,
      })),
    });

    const emailResult = await sendEmail({ to: order.user.email, ...emailData });

    if (emailResult.success) {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          deliveryEmailSentAt: new Date(),
          deliveryEmailStatus: "sent",
          deliveryEmailError: null,
        },
      });

      await prisma.adminAuditLog.create({
        data: {
          adminId: (session.user as any).id,
          action: "DELIVERY_EMAIL_RESENT",
          entityType: "Order",
          entityId: orderId,
          metadata: JSON.stringify({ orderNumber: order.orderNumber }),
        },
      });
    }

    return NextResponse.json({
      success: emailResult.success,
      message: emailResult.success
        ? "Delivery email resent successfully."
        : `Email failed: ${emailResult.error}`,
    });
  } catch (error) {
    console.error("POST /api/admin/orders/[orderId]/resend-email error:", error);
    return NextResponse.json({ error: "Failed to resend email" }, { status: 500 });
  }
}
