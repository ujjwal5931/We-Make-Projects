import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { sendEmail, orderPlacedEmail } from "@/lib/email";

const checkoutSchema = z.object({
  billingFullName: z.string().min(1, "Full name is required"),
  billingAddressLine1: z.string().min(1, "Address is required"),
  billingAddressLine2: z.string().optional(),
  billingCity: z.string().min(1, "City is required"),
  billingState: z.string().min(1, "State is required"),
  billingPostalCode: z.string().min(1, "Postal code is required"),
  billingCountry: z.string().default("India"),
  phone: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string(),
      })
    )
    .optional(),
});

function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 900000) + 100000;
  return `WMP-${year}-${random}`;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = checkoutSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const billing = validation.data;

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        cart: {
          include: {
            items: {
              include: {
                product: {
                  include: {
                    category: true,
                    paymentQR: { include: { qr: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Determine products to purchase:
    // 1) From client-provided items (Zustand cart)
    // 2) Fallback to database cart items
    let activeProducts: any[] = [];

    if (billing.items && billing.items.length > 0) {
      const productIds = billing.items.map((i) => i.productId);
      const dbProducts = await prisma.product.findMany({
        where: { id: { in: productIds }, isActive: true },
        include: {
          category: true,
          paymentQR: { include: { qr: true } },
        },
      });
      activeProducts = dbProducts;
    } else if (user.cart?.items?.length) {
      activeProducts = user.cart.items
        .filter((item) => item.product.isActive)
        .map((item) => item.product);
    }

    if (activeProducts.length === 0) {
      return NextResponse.json(
        { error: "Your cart is empty or the products are unavailable." },
        { status: 400 }
      );
    }

    // Calculate totals securely from server database prices
    const subtotal = activeProducts.reduce(
      (sum, p) => sum + Number(p.price),
      0
    );
    const discount = activeProducts.reduce((sum, p) => {
      const dp = p.discountPrice ? Number(p.discountPrice) : null;
      const price = Number(p.price);
      return sum + (dp !== null ? price - dp : 0);
    }, 0);
    const totalAmount = subtotal - discount;

    // Generate unique order number (retry if collision)
    let orderNumber = generateOrderNumber();
    let attempts = 0;
    while (attempts < 5) {
      const existing = await prisma.order.findUnique({ where: { orderNumber } });
      if (!existing) break;
      orderNumber = generateOrderNumber();
      attempts++;
    }

    // Save/update billing address
    const billingData = {
      fullName: billing.billingFullName,
      addressLine1: billing.billingAddressLine1,
      addressLine2: billing.billingAddressLine2 || null,
      city: billing.billingCity,
      state: billing.billingState,
      postalCode: billing.billingPostalCode,
      country: billing.billingCountry || "India",
    };

    await prisma.billingAddress.upsert({
      where: { userId: user.id },
      create: { userId: user.id, ...billingData },
      update: billingData,
    });

    // Create order with items
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: user.id,
        subtotal,
        discount,
        totalAmount,
        status: "PENDING_PAYMENT",
        customerNameSnapshot: user.name,
        customerEmailSnapshot: user.email,
        customerPhoneSnapshot: billing.phone || user.phone || null,
        billingFullName: billing.billingFullName,
        billingAddressLine1: billing.billingAddressLine1,
        billingAddressLine2: billing.billingAddressLine2 || null,
        billingCity: billing.billingCity,
        billingState: billing.billingState,
        billingPostalCode: billing.billingPostalCode,
        billingCountry: billing.billingCountry || "India",
        items: {
          create: activeProducts.map((product) => ({
            productId: product.id,
            productNameSnapshot: product.name,
            productSlugSnapshot: product.slug,
            unitPriceSnapshot: Number(product.price),
            discountPriceSnapshot: product.discountPrice
              ? Number(product.discountPrice)
              : null,
            finalPriceSnapshot: product.discountPrice
              ? Number(product.discountPrice)
              : Number(product.price),
            quantity: 1,
            categorySnapshot: product.category?.name || "General",
          })),
        },
      },
      include: { items: true },
    });

    // Clear database cart if existed
    if (user.cart?.id) {
      await prisma.cartItem.deleteMany({ where: { cartId: user.cart.id } });
    }

    // Send order placed email (non-blocking)
    const emailData = orderPlacedEmail({
      customerName: user.name,
      orderNumber: order.orderNumber,
      totalAmount: `₹${totalAmount.toFixed(2)}`,
      products: activeProducts.map((p) => ({
        name: p.name,
        price: `₹${(p.discountPrice ? Number(p.discountPrice) : Number(p.price)).toFixed(2)}`,
      })),
    });
    sendEmail({ to: user.email, ...emailData }).catch(console.error);

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
    });
  } catch (error) {
    console.error("POST /api/checkout error:", error);
    return NextResponse.json(
      { error: "Checkout failed. Please try again." },
      { status: 500 }
    );
  }
}
