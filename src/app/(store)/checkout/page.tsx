"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Package, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCartStore } from "@/store/cart-store";

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { items, total, clearCart } = useCartStore();

  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [form, setForm] = useState({
    phone: "",
    billingFullName: "",
    billingAddressLine1: "",
    billingAddressLine2: "",
    billingCity: "",
    billingState: "",
    billingPostalCode: "",
    billingCountry: "India",
  });

  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetch("/api/account/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          setForm((f) => ({
            ...f,
            phone: data.user.phone || "",
            billingFullName: data.user.billingAddress?.fullName || data.user.name || "",
            billingAddressLine1: data.user.billingAddress?.addressLine1 || "",
            billingAddressLine2: data.user.billingAddress?.addressLine2 || "",
            billingCity: data.user.billingAddress?.city || "",
            billingState: data.user.billingAddress?.state || "",
            billingPostalCode: data.user.billingAddress?.postalCode || "",
            billingCountry: data.user.billingAddress?.country || "India",
          }));
        }
        setProfileLoaded(true);
      })
      .catch(() => setProfileLoaded(true));
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (items.length === 0 && !isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card text-card-foreground p-8 rounded-xl border border-border max-w-md w-full text-center shadow-sm">
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground text-sm mb-6">Add items to your cart before proceeding to checkout.</p>
          <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 text-white">
            <Link href="/products">Browse Products</Link>
          </Button>
        </div>
      </div>
    );
  }

  const subtotal = items.reduce((s, i) => s + i.price, 0);
  const discount = items.reduce((s, i) => s + (i.discountPrice !== null ? i.price - (i.discountPrice ?? 0) : 0), 0);
  const cartTotal = total();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.billingFullName || !form.billingAddressLine1 || !form.billingCity || !form.billingState || !form.billingPostalCode) {
      toast.error("Please fill in all required fields");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...form,
        items: items.map((i) => ({ productId: i.productId })),
      };
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setIsSuccess(true);
        clearCart();
        toast.success("Order placed! Proceeding to payment...");
        window.location.href = `/payment/${data.orderId}`;
      } else {
        toast.error(data.error || "Checkout failed");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-foreground mb-8">Checkout</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Billing Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Contact */}
              <Card>
                <CardHeader><CardTitle className="text-base">Contact Information</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Full Name</Label>
                      <Input value={session?.user?.name || ""} readOnly className="bg-muted text-foreground" />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input value={session?.user?.email || ""} readOnly className="bg-muted text-foreground" />
                    </div>
                  </div>
                  <div>
                    <Label>Phone Number</Label>
                    <Input name="phone" value={form.phone} onChange={handleChange} placeholder="+91 9999999999" />
                  </div>
                </CardContent>
              </Card>

              {/* Billing Address */}
              <Card>
                <CardHeader><CardTitle className="text-base">Billing Address</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Full Name <span className="text-red-500">*</span></Label>
                    <Input name="billingFullName" value={form.billingFullName} onChange={handleChange} required />
                  </div>
                  <div>
                    <Label>Address Line 1 <span className="text-red-500">*</span></Label>
                    <Input name="billingAddressLine1" value={form.billingAddressLine1} onChange={handleChange} required placeholder="House/Flat No., Street Name" />
                  </div>
                  <div>
                    <Label>Address Line 2</Label>
                    <Input name="billingAddressLine2" value={form.billingAddressLine2} onChange={handleChange} placeholder="Apartment, Area (optional)" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>City <span className="text-red-500">*</span></Label>
                      <Input name="billingCity" value={form.billingCity} onChange={handleChange} required />
                    </div>
                    <div>
                      <Label>State <span className="text-red-500">*</span></Label>
                      <Input name="billingState" value={form.billingState} onChange={handleChange} required />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Postal Code <span className="text-red-500">*</span></Label>
                      <Input name="billingPostalCode" value={form.billingPostalCode} onChange={handleChange} required />
                    </div>
                    <div>
                      <Label>Country</Label>
                      <Input name="billingCountry" value={form.billingCountry} onChange={handleChange} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right: Order Summary */}
            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-base">Order Summary</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {items.map((item) => (
                    <div key={item.productId} className="flex justify-between text-sm">
                      <span className="text-muted-foreground line-clamp-2 flex-1 mr-2">{item.name}</span>
                      <span className="font-medium whitespace-nowrap">₹{(item.discountPrice ?? item.price).toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                  <Separator />
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                      <span>Discount</span>
                      <span>-₹{discount.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-base text-foreground">
                    <span>Total</span>
                    <span>₹{cartTotal.toLocaleString("en-IN")}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Notice */}
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                <div className="flex gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                    <strong>Manual Payment Verification:</strong> After placing your order, you'll need to complete a UPI payment. Your digital product will be delivered after our team manually verifies the payment (1–4 hours).
                  </p>
                </div>
              </div>

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-base text-white" disabled={loading}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Placing Order...</> : "Place Order"}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                By placing this order, you agree to our{" "}
                <a href="/terms" className="text-blue-600 dark:text-blue-400 hover:underline">Terms & Conditions</a>
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
