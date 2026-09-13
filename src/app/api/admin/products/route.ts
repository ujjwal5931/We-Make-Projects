import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import slugify from "slugify";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || (session.user as any).role !== "ADMIN") return null;
  return session;
}

const productSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  shortDescription: z.string().optional(),
  price: z.coerce.number().positive(),
  discountPrice: z.coerce.number().positive().optional().nullable(),
  categoryId: z.string().min(1),
  fileType: z.string().optional(),
  fileSize: z.string().optional(),
  numberOfPages: z.coerce.number().int().positive().optional().nullable(),
  previewUrl: z.string().url().optional().or(z.literal("")),
  features: z.string().optional(), // JSON string
  requirements: z.string().optional(),
  whatsIncluded: z.string().optional(),
  tags: z.string().optional(),
  isActive: z.string().optional(),
  isFeatured: z.string().optional(),
  paymentQRId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdmin();
    if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";

    const where: any = search
      ? {
          OR: [
            { name: { contains: search } },
            { category: { name: { contains: search } } },
          ],
        }
      : {};

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: true,
          paymentQR: { include: { qr: true } },
          _count: { select: { reviews: true, orderItems: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      products: products.map((p) => ({
        ...p,
        price: Number(p.price),
        discountPrice: p.discountPrice ? Number(p.discountPrice) : null,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
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

    const validation = productSchema.safeParse(raw);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Discount validation
    if (data.discountPrice && data.discountPrice >= data.price) {
      return NextResponse.json(
        { error: "Discount price must be less than original price" },
        { status: 400 }
      );
    }

    // Generate slug
    let slug = slugify(data.name, { lower: true, strict: true });
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (existing) slug = `${slug}-${Date.now()}`;

    // Handle thumbnail upload
    let thumbnailUrl: string | null = null;
    const thumbnailFile = formData.get("thumbnail") as File | null;
    if (thumbnailFile && thumbnailFile.size > 0) {
      const ext = thumbnailFile.name.split(".").pop();
      const filename = `${slug}-thumb-${Date.now()}.${ext}`;
      const uploadDir = path.join(process.cwd(), "public", "uploads", "products");
      await mkdir(uploadDir, { recursive: true });
      const buffer = Buffer.from(await thumbnailFile.arrayBuffer());
      await writeFile(path.join(uploadDir, filename), buffer);
      thumbnailUrl = `/uploads/products/${filename}`;
    }

    // Handle digital file upload
    let digitalFileKey: string | null = null;
    const digitalFile = formData.get("digitalFile") as File | null;
    if (digitalFile && digitalFile.size > 0) {
      const ext = digitalFile.name.split(".").pop();
      const filename = `${slug}-file-${Date.now()}.${ext}`;
      const uploadDir = path.join(process.cwd(), "uploads", "products");
      await mkdir(uploadDir, { recursive: true });
      const buffer = Buffer.from(await digitalFile.arrayBuffer());
      await writeFile(path.join(uploadDir, filename), buffer);
      digitalFileKey = filename;
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

    const product = await prisma.product.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        shortDescription: data.shortDescription,
        price: data.price,
        discountPrice: data.discountPrice || null,
        thumbnail: thumbnailUrl,
        categoryId: data.categoryId,
        fileType: data.fileType,
        fileSize: data.fileSize,
        numberOfPages: data.numberOfPages || null,
        previewUrl: data.previewUrl || null,
        features: parseArrayToJson(data.features),
        requirements: parseArrayToJson(data.requirements),
        whatsIncluded: parseArrayToJson(data.whatsIncluded),
        tags: parseArrayToJson(data.tags),
        isActive: data.isActive !== "false",
        isFeatured: data.isFeatured === "true",
        digitalFileKey,
        digitalFileProvider: digitalFileKey ? "local" : null,
        ...(data.paymentQRId
          ? {
              paymentQR: {
                create: { qrId: data.paymentQRId },
              },
            }
          : {}),
      },
    });

    // Handle additional images
    const imageFiles = formData.getAll("images") as File[];
    for (let i = 0; i < imageFiles.length; i++) {
      const imgFile = imageFiles[i];
      if (!imgFile || imgFile.size === 0) continue;
      const ext = imgFile.name.split(".").pop();
      const filename = `${slug}-img-${i}-${Date.now()}.${ext}`;
      const uploadDir = path.join(process.cwd(), "public", "uploads", "products");
      await mkdir(uploadDir, { recursive: true });
      const buffer = Buffer.from(await imgFile.arrayBuffer());
      await writeFile(path.join(uploadDir, filename), buffer);
      await prisma.productImage.create({
        data: { productId: product.id, imageUrl: `/uploads/products/${filename}`, sortOrder: i },
      });
    }

    await prisma.adminAuditLog.create({
      data: {
        adminId: (session.user as any).id,
        action: "PRODUCT_CREATED",
        entityType: "Product",
        entityId: product.id,
        metadata: JSON.stringify({ name: product.name }),
      },
    });

    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    console.error("POST /api/admin/products error:", error);
    return NextResponse.json({ error: error.message || "Failed to create product" }, { status: 500 });
  }
}
