import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || (session.user as any).role !== "ADMIN") return null;
  return session;
}

const qrSchema = z.object({
  name: z.string().min(1, "Name required"),
  upiId: z.string().min(1, "UPI ID required"),
  accountName: z.string().min(1, "Account name required"),
  isActive: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdmin();
    if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const qrs = await prisma.paymentQR.findMany({
      include: { _count: { select: { productQRs: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ qrs });
  } catch {
    return NextResponse.json({ error: "Failed to fetch QR codes" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin();
    if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const formData = await request.formData();
    const raw: Record<string, string> = {};
    for (const [key, value] of formData.entries()) {
      if (typeof value === "string") raw[key] = value;
    }

    const validation = qrSchema.safeParse(raw);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 });
    }

    const { name, upiId, accountName, isActive } = validation.data;

    // Upload QR image
    let qrImageUrl = "";
    const qrFile = formData.get("qrImage") as File | null;
    if (qrFile && qrFile.size > 0) {
      const ext = qrFile.name.split(".").pop();
      const filename = `qr-${Date.now()}.${ext}`;
      const uploadDir = path.join(process.cwd(), "public", "uploads", "qr");
      await mkdir(uploadDir, { recursive: true });
      const buffer = Buffer.from(await qrFile.arrayBuffer());
      await writeFile(path.join(uploadDir, filename), buffer);
      qrImageUrl = `/uploads/qr/${filename}`;
    }

    const qr = await prisma.paymentQR.create({
      data: { name, upiId, accountName, qrImageUrl, isActive: isActive !== "false" },
    });

    await prisma.adminAuditLog.create({
      data: { adminId: (session.user as any).id, action: "QR_CREATED", entityType: "PaymentQR", entityId: qr.id, metadata: JSON.stringify({ name }) },
    });

    return NextResponse.json({ success: true, qr });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create QR" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAdmin();
    if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const formData = await request.formData();
    const id = formData.get("id") as string;
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const updateData: any = {};
    const name = formData.get("name") as string;
    const upiId = formData.get("upiId") as string;
    const accountName = formData.get("accountName") as string;
    const isActive = formData.get("isActive") as string;

    if (name) updateData.name = name;
    if (upiId) updateData.upiId = upiId;
    if (accountName) updateData.accountName = accountName;
    if (isActive !== null) updateData.isActive = isActive !== "false";

    const qrFile = formData.get("qrImage") as File | null;
    if (qrFile && qrFile.size > 0) {
      const ext = qrFile.name.split(".").pop();
      const filename = `qr-${Date.now()}.${ext}`;
      const uploadDir = path.join(process.cwd(), "public", "uploads", "qr");
      await mkdir(uploadDir, { recursive: true });
      const buffer = Buffer.from(await qrFile.arrayBuffer());
      await writeFile(path.join(uploadDir, filename), buffer);
      updateData.qrImageUrl = `/uploads/qr/${filename}`;
    }

    const qr = await prisma.paymentQR.update({ where: { id }, data: updateData });
    return NextResponse.json({ success: true, qr });
  } catch {
    return NextResponse.json({ error: "Failed to update QR" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAdmin();
    if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await prisma.paymentQR.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete QR" }, { status: 500 });
  }
}
