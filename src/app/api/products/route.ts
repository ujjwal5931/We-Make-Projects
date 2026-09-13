import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const minPrice = parseFloat(searchParams.get("minPrice") || "0");
    const maxPrice = parseFloat(searchParams.get("maxPrice") || "999999");
    const sort = searchParams.get("sort") || "newest";
    const featured = searchParams.get("featured") === "true";

    const skip = (page - 1) * limit;

    const where: any = {
      isActive: true,
      ...(featured ? { isFeatured: true } : {}),
      ...(category ? { category: { slug: category } } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { description: { contains: search } },
              { shortDescription: { contains: search } },
              { tags: { contains: search } },
              { category: { name: { contains: search } } },
            ],
          }
        : {}),
      AND: [
        {
          OR: [
            { discountPrice: { gte: minPrice, lte: maxPrice } },
            {
              AND: [
                { discountPrice: null },
                { price: { gte: minPrice, lte: maxPrice } },
              ],
            },
          ],
        },
      ],
    };

    const orderBy: any =
      sort === "price_asc"
        ? [{ discountPrice: "asc" }, { price: "asc" }]
        : sort === "price_desc"
        ? [{ discountPrice: "desc" }, { price: "desc" }]
        : sort === "popular"
        ? { salesCount: "desc" }
        : sort === "rating"
        ? { reviews: { _count: "desc" } }
        : { createdAt: "desc" }; // newest

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          category: true,
          images: { orderBy: { sortOrder: "asc" }, take: 1 },
          _count: { select: { reviews: { where: { isVisible: true } } } },
          reviews: {
            where: { isVisible: true },
            select: { rating: true },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    const productsWithRating = products.map((p) => {
      const avgRating =
        p.reviews.length > 0
          ? p.reviews.reduce((sum, r) => sum + r.rating, 0) / p.reviews.length
          : 0;
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        shortDescription: p.shortDescription,
        price: Number(p.price),
        discountPrice: p.discountPrice ? Number(p.discountPrice) : null,
        thumbnail: p.thumbnail,
        category: p.category,
        fileType: p.fileType,
        fileSize: p.fileSize,
        isFeatured: p.isFeatured,
        reviewCount: p._count.reviews,
        rating: Math.round(avgRating * 10) / 10,
        createdAt: p.createdAt,
      };
    });

    return NextResponse.json({
      products: productsWithRating,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/products error:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}
