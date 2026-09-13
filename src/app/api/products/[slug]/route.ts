import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function parseArray(val: any): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return [val];
    }
  }
  return [];
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const product = await prisma.product.findUnique({
      where: { slug, isActive: true },
      include: {
        category: true,
        images: { orderBy: { sortOrder: "asc" } },
        paymentQR: { include: { qr: true } },
        reviews: {
          where: { isVisible: true },
          include: {
            user: { select: { name: true, userId: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        _count: { select: { reviews: { where: { isVisible: true } } } },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Calculate average rating
    const avgRating =
      product.reviews.length > 0
        ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
        : 0;

    // Rating distribution
    const ratingDistribution = [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: product.reviews.filter((r) => r.rating === star).length,
    }));

    // Related products
    const related = await prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: product.id },
        isActive: true,
      },
      take: 4,
      include: {
        category: true,
        reviews: { select: { rating: true } },
        _count: { select: { reviews: true } },
      },
    });

    const relatedWithRating = related.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      thumbnail: p.thumbnail,
      price: Number(p.price),
      discountPrice: p.discountPrice ? Number(p.discountPrice) : null,
      category: p.category,
      rating:
        p.reviews.length > 0
          ? Math.round((p.reviews.reduce((s, r) => s + r.rating, 0) / p.reviews.length) * 10) / 10
          : 0,
      reviewCount: p._count.reviews,
    }));

    return NextResponse.json({
      product: {
        ...product,
        features: parseArray(product.features),
        requirements: parseArray(product.requirements),
        whatsIncluded: parseArray(product.whatsIncluded),
        tags: parseArray(product.tags),
        price: Number(product.price),
        discountPrice: product.discountPrice ? Number(product.discountPrice) : null,
        // Don't expose private file fields
        digitalFileKey: undefined,
        digitalFileProvider: undefined,
        rating: Math.round(avgRating * 10) / 10,
        ratingDistribution,
      },
      related: relatedWithRating,
    });
  } catch (error) {
    console.error("GET /api/products/[slug] error:", error);
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}
