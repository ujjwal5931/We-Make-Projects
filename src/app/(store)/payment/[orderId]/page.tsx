"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { Upload, QrCode, CheckCircle2, AlertCircle, Loader2, Copy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function PaymentPage() {
  const params = useParams();
  const orderId = params.orderId as string;
  const router = useRouter();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [utr, setUtr] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/orders/${orderId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.order) {
          if (["PAYMENT_APPROVED", "DELIVERED"].includes(data.order.status)) {
            router.replace(`/account/orders/${orderId}`);
            return;
          }
          setOrder(data.order);
        }
      })
      .finally(() => setLoading(false));
  }, [orderId, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      toast.error("Invalid file type. Please upload JPG, PNG, or WEBP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large. Maximum size is 5MB.");
      return;
    }
    setScreenshot(file);
    const reader = new FileReader();
    reader.onload = (e) => setScreenshotPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!utr.trim()) { toast.error("Please enter your UTR/Reference ID"); return; }
    if (!confirmed) { toast.error("Please confirm that you have completed the payment"); return; }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("utrReference", utr.trim());
      formData.append("confirmed", "true");
      if (screenshot) formData.append("screenshot", screenshot);

      const res = await fetch(`/api/payment/${orderId}/submit`, { method: "POST", body: formData });
      const data = await res.json();

      if (data.success) {
        toast.success("Payment details submitted! Our team will verify shortly.");
        setTimeout(() => router.push(`/account/orders/${orderId}`), 2000);
      } else {
        toast.error(data.error || "Submission failed");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Group items by QR code
  const getPaymentGroups = () => {
    if (!order) return [];
    const groups: Record<string, { qr: any; items: any[]; amount: number }> = {};
    for (const item of order.items) {
      const qrData = item.product?.paymentQR?.qr;
      const key = qrData?.id || "no-qr";
      if (!groups[key]) {
        groups[key] = { qr: qrData || null, items: [], amount: 0 };
      }
      groups[key].items.push(item);
      groups[key].amount += Number(item.finalPriceSnapshot);
    }
    return Object.values(groups);
  };

  const canSubmit = utr.trim().length > 0 && confirmed;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-10">
          <Skeleton className="h-8 w-48 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground">Order Not Found</h2>
          <p className="text-muted-foreground mt-2">This order doesn't exist or you don't have access.</p>
          <Button asChild className="mt-4"><Link href="/account/orders">My Orders</Link></Button>
        </div>
      </div>
    );
  }

  const paymentGroups = getPaymentGroups();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-10 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Complete Payment</h1>
          <p className="text-muted-foreground mt-1">Order #{order.orderNumber}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: QR & Instructions */}
          <div className="space-y-4">
            {/* Order Summary */}
            <Card>
              <CardHeader><CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Order Summary</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {order.items.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground line-clamp-1 flex-1">{item.productNameSnapshot}</span>
                    <span className="font-medium ml-2">₹{Number(item.finalPriceSnapshot).toLocaleString("en-IN")}</span>
                  </div>
                ))}
                <Separator className="my-2" />
                <div className="flex justify-between font-bold">
                  <span>Total Payable</span>
                  <span className="text-blue-600 dark:text-blue-400">₹{Number(order.totalAmount).toLocaleString("en-IN")}</span>
                </div>
              </CardContent>
            </Card>

            {/* Payment Groups */}
            {paymentGroups.map((group, idx) => (
              <Card key={idx} className="border-border">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                    {paymentGroups.length > 1 ? `Payment ${idx + 1}` : "Payment Details"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {group.qr ? (
                    <div className="text-center">
                      <div className="relative w-48 h-48 mx-auto mb-3 border border-border rounded-xl overflow-hidden bg-white p-2">
                        <Image src={group.qr.qrImageUrl} alt="UPI QR Code" fill className="object-contain" />
                      </div>
                      <div className="bg-muted rounded-lg p-3 text-sm space-y-1">
                        <div className="font-semibold text-foreground">{group.qr.accountName}</div>
                        <div className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400">
                          <span className="font-mono">{group.qr.upiId}</span>
                          <button onClick={() => { navigator.clipboard.writeText(group.qr.upiId); toast.success("UPI ID copied!"); }}>
                            <Copy className="h-3.5 w-3.5 text-muted-foreground hover:text-blue-600" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-3 font-bold text-lg text-foreground">
                        Amount: ₹{group.amount.toLocaleString("en-IN")}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        For: {group.items.map((i: any) => i.productNameSnapshot).join(", ")}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 text-sm text-amber-800 dark:text-amber-300">
                      <QrCode className="h-8 w-8 text-amber-500 dark:text-amber-400 mx-auto mb-2" />
                      <p className="text-center">No QR code assigned. Please contact support for payment details.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {/* Instructions */}
            <Card className="bg-blue-50/60 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/50">
              <CardContent className="p-4">
                <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2 text-sm">Payment Instructions</h3>
                <ol className="text-xs text-blue-800 dark:text-blue-300 space-y-1.5 list-decimal list-inside leading-relaxed">
                  <li>Scan the QR code using any UPI app (Google Pay, PhonePe, Paytm, etc.)</li>
                  <li>Pay the EXACT amount shown above</li>
                  <li>Take a screenshot of the payment confirmation screen</li>
                  <li>Note down the UTR/Transaction Reference ID from your UPI app</li>
                  <li>Upload the screenshot and enter UTR below</li>
                  <li>Submit — our team will verify within 1–4 hours</li>
                </ol>
              </CardContent>
            </Card>
          </div>

          {/* Right: Submission Form */}
          <div>
            <form onSubmit={handleSubmit}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Submit Payment Details</CardTitle>
                  <p className="text-xs text-muted-foreground">After paying, fill in the details below</p>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Screenshot Upload */}
                  <div>
                    <Label className="mb-2 block">Payment Screenshot <span className="text-red-500">*</span></Label>
                    {screenshotPreview ? (
                      <div className="relative">
                        <img src={screenshotPreview} alt="Screenshot preview" className="w-full rounded-lg border border-border max-h-48 object-contain bg-muted" />
                        <button
                          type="button"
                          onClick={() => { setScreenshot(null); setScreenshotPreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-muted/50 transition-colors"
                      >
                        <Upload className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                        <p className="text-sm text-foreground">Click to upload payment screenshot</p>
                        <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WEBP up to 5MB</p>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>

                  {/* UTR Input */}
                  <div>
                    <Label htmlFor="utr" className="mb-2 block">
                      UTR / Transaction Reference ID <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="utr"
                      value={utr}
                      onChange={(e) => setUtr(e.target.value)}
                      placeholder="e.g. 426112345678"
                      maxLength={50}
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">Find this in your UPI app's transaction details</p>
                  </div>

                  {/* Confirmation */}
                  <div className="flex items-start gap-3 bg-muted rounded-lg p-3">
                    <Checkbox
                      id="confirm"
                      checked={confirmed}
                      onCheckedChange={(v) => setConfirmed(v === true)}
                      className="mt-0.5"
                    />
                    <label htmlFor="confirm" className="text-sm text-foreground cursor-pointer leading-relaxed">
                      I confirm that I have completed the UPI payment for this order (₹{Number(order.totalAmount).toLocaleString("en-IN")}) and the information provided is accurate.
                    </label>
                  </div>

                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                    <p className="text-xs text-amber-800 dark:text-amber-300">
                      ⚠️ <strong>Do not click Submit multiple times.</strong> Submission does not automatically confirm payment. Our team will manually verify your payment within 1–4 hours.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 h-11 text-white"
                    disabled={!canSubmit || submitting}
                  >
                    {submitting ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
                    ) : (
                      <><CheckCircle2 className="mr-2 h-4 w-4" /> Submit Payment Details</>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </form>

            <div className="mt-4 text-center">
              <Link href={`/account/orders/${orderId}`} className="text-sm text-muted-foreground hover:text-foreground">
                ← Back to Order
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
