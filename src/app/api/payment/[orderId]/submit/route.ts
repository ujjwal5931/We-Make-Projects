import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { z } from "zod";
import { sendEmail, paymentSubmittedEmail } from "@/lib/email";

const paymentSchema = z.object({
  utrReference: z
    .string()
    .min(1, "UTR/Reference ID is required")
    .max(100, "UTR too long")
    .transform((v) => v.trim()),
  confirmed: z.boolean().refine((v) => v === true, "Please confirm payment"),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId } = await params;

    // Verify order ownership and status
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (
      order.status !== "PENDING_PAYMENT" &&
      order.status !== "PAYMENT_REJECTED"
    ) {
      return NextResponse.json(
        { error: "Payment details cannot be submitted for this order status" },
        { status: 400 }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const utrRaw = formData.get("utrReference") as string;
    const confirmedRaw = formData.get("confirmed") as string;
    const screenshotFile = formData.get("screenshot") as File | null;

    const validation = paymentSchema.safeParse({
      utrReference: utrRaw,
      confirmed: confirmedRaw === "true",
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { utrReference } = validation.data;

    // Duplicate UTR check
    const existingUTR = await prisma.payment.findFirst({
      where: { utrReference },
    });

    if (existingUTR && existingUTR.orderId !== orderId) {
      return NextResponse.json(
        {
          error:
            "This payment reference has already been submitted. Please verify your payment details.",
        },
        { status: 409 }
      );
    }

    // Screenshot upload
    let screenshotUrl: string | null = null;

    if (screenshotFile) {
      // Validate file type
      const allowedTypes = (
        process.env.ALLOWED_SCREENSHOT_TYPES ||
        "image/jpeg,image/jpg,image/png,image/webp"
      ).split(",");

      if (!allowedTypes.includes(screenshotFile.type)) {
        return NextResponse.json(
          { error: "Invalid file type. Allowed: JPG, PNG, WEBP" },
          { status: 400 }
        );
      }

      // Validate file size
      const maxSizeMB = parseInt(process.env.MAX_SCREENSHOT_SIZE_MB || "5");
      if (screenshotFile.size > maxSizeMB * 1024 * 1024) {
        return NextResponse.json(
          { error: `Screenshot too large. Max size: ${maxSizeMB}MB` },
          { status: 400 }
        );
      }

      // Save file
      const ext = screenshotFile.name.split(".").pop();
      const filename = `${orderId}-${Date.now()}.${ext}`;
      const uploadDir = path.join(process.cwd(), "uploads", "screenshots");

      await mkdir(uploadDir, { recursive: true });
      const buffer = Buffer.from(await screenshotFile.arrayBuffer());
      await writeFile(path.join(uploadDir, filename), buffer);

      screenshotUrl = `/api/uploads/screenshots/${filename}`;
    }

    // Upsert payment record
    await prisma.payment.upsert({
      where: { orderId },
      create: {
        orderId,
        expectedAmount: order.totalAmount,
        utrReference,
        screenshotUrl,
        status: "SUBMITTED",
        submittedAt: new Date(),
      },
      update: {
        utrReference,
        screenshotUrl: screenshotUrl || undefined,
        status: "SUBMITTED",
        submittedAt: new Date(),
        rejectionReason: null,
      },
    });

    // Update order status
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "PAYMENT_SUBMITTED",
        paymentSubmittedAt: new Date(),
      },
    });

    // Notify customer
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (user) {
      const emailData = paymentSubmittedEmail({
        customerName: user.name,
        orderNumber: order.orderNumber,
        utrReference,
      });
      sendEmail({ to: user.email, ...emailData }).catch(console.error);
    }

    return NextResponse.json({
      success: true,
      message: "Payment details submitted. Our team will verify shortly.",
    });
  } catch (error) {
    console.error("POST /api/payment/[orderId]/submit error:", error);
    return NextResponse.json(
      { error: "Failed to submit payment. Please try again." },
      { status: 500 }
    );
  }
}
