import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendEmail, paymentApprovedEmail, paymentRejectedEmail } from "@/lib/email";
import { z } from "zod";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || (session.user as any).role !== "ADMIN") {
    return null;
  }
  return session;
}

const approveSchema = z.object({ action: z.literal("approve") });
const rejectSchema = z.object({
  action: z.literal("reject"),
  reason: z.string().min(1, "Rejection reason is required").max(500),
});
const actionSchema = z.discriminatedUnion("action", [approveSchema, rejectSchema]);

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
    const body = await request.json();
    const validation = actionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, digitalFileKey: true } },
          },
        },
        payment: true,
        user: { select: { email: true, name: true } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (
      order.status !== "PAYMENT_SUBMITTED" &&
      order.status !== "UNDER_REVIEW"
    ) {
      return NextResponse.json(
        { error: "Order is not in a verifiable state" },
        { status: 400 }
      );
    }

    const now = new Date();
    const adminId = (session.user as any).id as string;

    if (validation.data.action === "approve") {
      // Update payment and order
      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { orderId },
          data: {
            status: "VERIFIED",
            verifiedAt: now,
            verifiedByAdminId: adminId,
          },
        });

        await tx.order.update({
          where: { id: orderId },
          data: {
            status: "PAYMENT_APPROVED",
            paymentApprovedAt: now,
            approvedByAdminId: adminId,
          },
        });

        // Generate download tokens for each product
        for (const item of order.items) {
          if (!item.productId) continue;
          await tx.downloadToken.create({
            data: {
              orderId,
              productId: item.productId,
              isActive: true,
            },
          });
        }

        // Admin audit log
        await tx.adminAuditLog.create({
          data: {
            adminId,
            action: "ORDER_PAYMENT_APPROVED",
            entityType: "Order",
            entityId: orderId,
            metadata: JSON.stringify({ orderNumber: order.orderNumber }),
          },
        });
      });

      // Send delivery email
      const freshTokens = await prisma.downloadToken.findMany({
        where: { orderId, isActive: true },
        include: { product: { select: { name: true } } },
      });

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const emailData = paymentApprovedEmail({
        customerName: order.user.name,
        orderNumber: order.orderNumber,
        totalAmount: `₹${Number(order.totalAmount).toFixed(2)}`,
        products: freshTokens.map((t) => ({
          name: t.product.name,
          downloadUrl: `${appUrl}/api/download/${t.token}`,
        })),
      });

      const emailResult = await sendEmail({ to: order.user.email, ...emailData });

      // Update email delivery status
      await prisma.order.update({
        where: { id: orderId },
        data: {
          deliveryEmailSentAt: emailResult.success ? now : null,
          deliveryEmailStatus: emailResult.success ? "sent" : "failed",
          deliveryEmailError: emailResult.success ? null : emailResult.error,
          status: emailResult.success ? "DELIVERED" : "PAYMENT_APPROVED",
        },
      });

      return NextResponse.json({
        success: true,
        message: "Payment approved successfully.",
        emailSent: emailResult.success,
        emailError: emailResult.success ? null : emailResult.error,
      });
    }

    // REJECT
    if (validation.data.action === "reject") {
      const { reason } = validation.data;

      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { orderId },
          data: {
            status: "REJECTED",
            rejectionReason: reason,
          },
        });

        await tx.order.update({
          where: { id: orderId },
          data: {
            status: "PAYMENT_REJECTED",
            paymentRejectedAt: now,
            rejectionReason: reason,
          },
        });

        // Deactivate any existing download tokens
        await tx.downloadToken.updateMany({
          where: { orderId },
          data: { isActive: false },
        });

        await tx.adminAuditLog.create({
          data: {
            adminId,
            action: "ORDER_PAYMENT_REJECTED",
            entityType: "Order",
            entityId: orderId,
            metadata: JSON.stringify({ orderNumber: order.orderNumber, reason }),
          },
        });
      });

      // Send rejection email
      const emailData = paymentRejectedEmail({
        customerName: order.user.name,
        orderNumber: order.orderNumber,
        rejectionReason: reason,
      });
      sendEmail({ to: order.user.email, ...emailData }).catch(console.error);

      return NextResponse.json({
        success: true,
        message: "Payment rejected. Customer has been notified.",
      });
    }
  } catch (error) {
    console.error("POST /api/admin/orders/[orderId]/verify error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
