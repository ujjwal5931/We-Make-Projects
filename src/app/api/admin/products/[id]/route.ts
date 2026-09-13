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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      images: { orderBy: { sortOrder: "asc" } },
      paymentQR: { include: { qr: true } },
    },
  });

  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    product: {
      ...product,
      price: Number(product.price),
      discountPrice: product.discountPrice ? Number(product.discountPrice) : null,
    },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const formData = await req.formData();
    const raw: Record<string, string> = {};
    for (const [key, value] of formData.entries()) {
      if (typeof value === "string") raw[key] = value;
    }

    const parseArrayToJson = (val?: string) => {
      if (!val) return JSON.stringify([]);
      try {
        const parsed = JSON.parse(val);
        return JSON.stringify(Array.isArray(parsed) ? parsed : [val]);
      } catch {
        const items = val.includes("\n")
          ? val.split("\n").map(s => s.trim()).filter(Boolean)
          : val.split(",").map(s => s.trim()).filter(Boolean);
        return JSON.stringify(items);
      }
    };

    const updateData: any = {};

    if (raw.name !== undefined) updateData.name = raw.name;
    if (raw.description !== undefined) updateData.description = raw.description;
    if (raw.shortDescription !== undefined) updateData.shortDescription = raw.shortDescription;
    if (raw.price !== undefined) updateData.price = parseFloat(raw.price);
    if (raw.discountPrice !== undefined) {
      updateData.discountPrice = raw.discountPrice ? parseFloat(raw.discountPrice) : null;
    }
    if (raw.categoryId !== undefined) updateData.categoryId = raw.categoryId;
    if (raw.fileType !== undefined) updateData.fileType = raw.fileType;
    if (raw.fileSize !== undefined) updateData.fileSize = raw.fileSize;
    if (raw.numberOfPages !== undefined) updateData.numberOfPages = raw.numberOfPages ? parseInt(raw.numberOfPages) : null;
    if (raw.previewUrl !== undefined) updateData.previewUrl = raw.previewUrl || null;
    if (raw.isActive !== undefined) updateData.isActive = raw.isActive !== "false";
    if (raw.isFeatured !== undefined) updateData.isFeatured = raw.isFeatured === "true";
    if (raw.features !== undefined) updateData.features = parseArrayToJson(raw.features);
    if (raw.requirements !== undefined) updateData.requirements = parseArrayToJson(raw.requirements);
    if (raw.whatsIncluded !== undefined) updateData.whatsIncluded = parseArrayToJson(raw.whatsIncluded);
    if (raw.tags !== undefined) updateData.tags = parseArrayToJson(raw.tags);

    // Discount validation
    const newPrice = updateData.price ?? Number(product.price);
    const newDiscount = updateData.discountPrice;
    if (newDiscount && newDiscount >= newPrice) {
      return NextResponse.json({ error: "Discount price must be less than original price" }, { status: 400 });
    }

    // Handle new thumbnail
    const thumbnailFile = formData.get("thumbnail") as File | null;
    if (thumbnailFile && thumbnailFile.size > 0) {
      const ext = thumbnailFile.name.split(".").pop();
      const filename = `${product.slug}-thumb-${Date.now()}.${ext}`;
      const uploadDir = path.join(process.cwd(), "public", "uploads", "products");
      await mkdir(uploadDir, { recursive: true });
      const buffer = Buffer.from(await thumbnailFile.arrayBuffer());
      await writeFile(path.join(uploadDir, filename), buffer);
      updateData.thumbnail = `/uploads/products/${filename}`;
    }

    // Handle new digital file
    const digitalFile = formData.get("digitalFile") as File | null;
    if (digitalFile && digitalFile.size > 0) {
      const ext = digitalFile.name.split(".").pop();
      const filename = `${product.slug}-file-${Date.now()}.${ext}`;
      const uploadDir = path.join(process.cwd(), "uploads", "products");
      await mkdir(uploadDir, { recursive: true });
      const buffer = Buffer.from(await digitalFile.arrayBuffer());
      await writeFile(path.join(uploadDir, filename), buffer);
      updateData.digitalFileKey = filename;
      updateData.digitalFileProvider = "local";
    }

    const updated = await prisma.product.update({ where: { id }, data: updateData });

    // Update QR assignment
    if (raw.paymentQRId !== undefined) {
      if (raw.paymentQRId) {
        await prisma.productPaymentQR.upsert({
          where: { productId: id },
          create: { productId: id, qrId: raw.paymentQRId },
          update: { qrId: raw.paymentQRId },
        });
      } else {
        await prisma.productPaymentQR.deleteMany({ where: { productId: id } });
      }
    }

    await prisma.adminAuditLog.create({
      data: {
        adminId: (session.user as any).id,
        action: "PRODUCT_UPDATED",
        entityType: "Product",
        entityId: id,
        metadata: JSON.stringify({ name: updated.name }),
      },
    });

    return NextResponse.json({ success: true, product: updated });
  } catch (error: any) {
    console.error("PATCH /api/admin/products/[id] error:", error);
    return NextResponse.json({ error: error.message || "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;

    // Soft delete — just deactivate
    await prisma.product.update({ where: { id }, data: { isActive: false } });

    await prisma.adminAuditLog.create({
      data: {
        adminId: (session.user as any).id,
        action: "PRODUCT_DELETED",
        entityType: "Product",
        entityId: id,
      },
    });

    return NextResponse.json({ success: true, message: "Product deactivated" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
