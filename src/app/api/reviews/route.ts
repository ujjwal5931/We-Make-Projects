import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const reviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  title: z.string().min(1, "Review title required").max(100),
  comment: z.string().min(10, "Review must be at least 10 characters").max(2000),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = reviewSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 });
    }

    const { productId, rating, title, comment } = validation.data;

    // Check purchase eligibility
    const eligibleOrder = await prisma.order.findFirst({
      where: {
        userId: session.user.id,
        status: { in: ["PAYMENT_APPROVED", "DELIVERED"] },
        items: { some: { productId } },
      },
      select: { id: true },
    });

    if (!eligibleOrder) {
      return NextResponse.json(
        { error: "Only verified buyers can review this product" },
        { status: 403 }
      );
    }

    // Check existing review
    const existingReview = await prisma.review.findFirst({
      where: { userId: session.user.id, productId },
    });

    let review;
    if (existingReview) {
      // Update existing review
      review = await prisma.review.update({
        where: { id: existingReview.id },
        data: { rating, title, comment },
      });
    } else {
      // Create new review
      review = await prisma.review.create({
        data: {
          productId,
          userId: session.user.id,
          orderId: eligibleOrder.id,
          rating,
          title,
          comment,
        },
      });
    }

    return NextResponse.json({ success: true, review });
  } catch (error: any) {
    console.error("POST /api/reviews error:", error);
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}

// Check if user is eligible to review a product
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ eligible: false, reason: "not_logged_in" });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    if (!productId) {
      return NextResponse.json({ eligible: false });
    }

    const eligibleOrder = await prisma.order.findFirst({
      where: {
        userId: session.user.id,
        status: { in: ["PAYMENT_APPROVED", "DELIVERED"] },
        items: { some: { productId } },
      },
    });

    const existingReview = eligibleOrder
      ? await prisma.review.findFirst({
          where: { userId: session.user.id, productId },
        })
      : null;

    return NextResponse.json({
      eligible: !!eligibleOrder,
      reason: eligibleOrder ? "eligible" : "not_purchased",
      existingReview,
    });
  } catch {
    return NextResponse.json({ eligible: false });
  }
}
