"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { Trash2, ShoppingBag, ArrowRight, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart-store";
import PriceDisplay from "@/components/store/price-display";
import { EmptyState } from "@/components/ui/empty-state";
import { Separator } from "@/components/ui/separator";

export default function CartPage() {
  const { data: session } = useSession();
  const { items, removeItem, clearCart, total } = useCartStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  const discount = items.reduce((sum, item) => sum + (item.discountPrice !== null ? item.price - (item.discountPrice ?? 0) : 0), 0);
  const cartTotal = total();

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground text-sm">Loading cart...</div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <EmptyState
          title="Your cart is empty"
          description="Browse our catalog and add engineering resources to your cart."
          action={{ label: "Browse Products", href: "/products" }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-foreground mb-8">Your Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item.productId} className="bg-card rounded-xl border border-border p-5 flex gap-4">
                <div className="relative w-20 h-20 flex-shrink-0 bg-muted rounded-lg overflow-hidden">
                  {item.thumbnail ? (
                    <Image src={item.thumbnail} alt={item.name} fill className="object-contain p-1" />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Package className="h-8 w-8 text-muted-foreground/40" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/products/${item.slug}`} className="font-semibold text-foreground hover:text-blue-600 dark:hover:text-blue-400 line-clamp-2 block">
                    {item.name}
                  </Link>
                  <div className="mt-2">
                    <PriceDisplay price={item.price} discountPrice={item.discountPrice} size="sm" />
                  </div>
                </div>
                <button onClick={() => removeItem(item.productId)} className="flex-shrink-0 text-muted-foreground hover:text-red-500 transition-colors p-1">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}

            <div className="flex justify-end">
              <button onClick={clearCart} className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1">
                <Trash2 className="h-3.5 w-3.5" /> Clear Cart
              </button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-card rounded-xl border border-border p-6 h-fit">
            <h2 className="font-bold text-lg text-foreground mb-4">Order Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal ({items.length} items)</span>
                <span>₹{subtotal.toLocaleString("en-IN")}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600 dark:text-green-400">
                  <span>Discount</span>
                  <span>-₹{discount.toLocaleString("en-IN")}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-base text-foreground">
                <span>Total</span>
                <span>₹{cartTotal.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div className="mt-6">
              {session?.user ? (
                <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 h-11 text-white">
                  <Link href="/checkout">
                    Proceed to Checkout <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-800 dark:text-amber-300">
                    Please log in to proceed with checkout.
                  </div>
                  <Button asChild className="w-full">
                    <Link href="/login?from=/checkout">Login to Checkout</Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/register">Create Account</Link>
                  </Button>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-border text-xs text-muted-foreground space-y-1">
              <p>🔒 Secure UPI payment</p>
              <p>📧 Digital delivery via email</p>
              <p>✅ Manual payment verification</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
