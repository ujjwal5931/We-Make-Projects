"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Clock, XCircle, Download, AlertTriangle, Mail, Package, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import OrderStatusBadge from "@/components/store/order-status-badge";

const timelineSteps = [
  { key: "created", label: "Order Placed", icon: Package },
  { key: "submitted", label: "Payment Submitted", icon: Clock },
  { key: "reviewing", label: "Under Review", icon: Clock },
  { key: "approved", label: "Payment Approved", icon: CheckCircle },
  { key: "delivered", label: "Product Delivered", icon: Download },
];

function getTimelineStatus(order: any) {
  const s = order.status;
  return {
    created: { done: true, time: order.createdAt },
    submitted: { done: ["PAYMENT_SUBMITTED","UNDER_REVIEW","PAYMENT_APPROVED","PAYMENT_REJECTED","DELIVERED"].includes(s), time: order.paymentSubmittedAt },
    reviewing: { done: ["UNDER_REVIEW","PAYMENT_APPROVED","PAYMENT_REJECTED","DELIVERED"].includes(s), time: null },
    approved: { done: ["PAYMENT_APPROVED","DELIVERED"].includes(s), time: order.paymentApprovedAt, rejected: s === "PAYMENT_REJECTED" },
    delivered: { done: s === "DELIVERED", time: order.deliveryEmailSentAt },
  };
}

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.orderId as string;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/orders/${orderId}`).then(r => r.json()).then(d => { setOrder(d.order); setLoading(false); }).catch(() => setLoading(false));
  }, [orderId]);

  if (loading) return <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}</div>;
  if (!order) return <div className="text-center py-12"><p className="text-muted-foreground">Order not found.</p><Button asChild className="mt-4"><Link href="/account/orders">Back to Orders</Link></Button></div>;

  const timeline = getTimelineStatus(order);
  const isApproved = ["PAYMENT_APPROVED", "DELIVERED"].includes(order.status);
  const isRejected = order.status === "PAYMENT_REJECTED";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/account/orders" className="text-sm text-muted-foreground hover:text-foreground">← Back to Orders</Link>
          <h1 className="text-2xl font-bold text-foreground mt-1">{order.orderNumber}</h1>
          <p className="text-muted-foreground text-sm">{new Date(order.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {/* Status Alerts */}
      {isRejected && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <div className="flex gap-3">
            <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900 dark:text-red-300">Payment Rejected</h3>
              <p className="text-sm text-red-700 dark:text-red-400 mt-1"><strong>Reason:</strong> {order.rejectionReason || "Not specified"}</p>
              <p className="text-sm text-red-600 dark:text-red-400 mt-2">Please resubmit with correct payment details or contact support.</p>
              <Button asChild size="sm" className="mt-3 bg-red-600 hover:bg-red-700 text-white">
                <Link href={`/payment/${order.id}`}>Resubmit Payment</Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      {isApproved && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
          <div className="flex gap-3">
            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-green-900 dark:text-green-300">Payment Approved — Download Your Products</h3>
              <p className="text-sm text-green-700 dark:text-green-400 mt-1 flex items-center gap-1">
                <Mail className="h-3 w-3" /> Download links have also been sent to your email.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(order.downloadTokens || []).map((token: any) => (
                  <Button key={token.id} asChild size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                    <a href={`/api/download/${token.token}`} download>
                      <Download className="h-3.5 w-3.5 mr-1.5" /> Download {token.product?.name || "Product"}
                    </a>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Timeline */}
      <Card>
        <CardHeader><CardTitle className="text-base">Order Timeline</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            {timelineSteps.map((step, i) => {
              const status = timeline[step.key as keyof typeof timeline];
              const isRejectedStep = step.key === "approved" && isRejected;
              return (
                <div key={step.key} className="flex items-start gap-4">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isRejectedStep ? "bg-red-500/20 text-red-500" : status.done ? "bg-green-500/20 text-green-500" : "bg-muted text-muted-foreground"}`}>
                    {isRejectedStep ? <XCircle className="h-4 w-4" /> : status.done ? <CheckCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 pt-0.5">
                    <p className={`text-sm font-medium ${status.done ? "text-foreground" : "text-muted-foreground"}`}>
                      {isRejectedStep ? "Payment Rejected" : step.label}
                    </p>
                    {(status as any).time && <p className="text-xs text-muted-foreground mt-0.5">{new Date((status as any).time).toLocaleString("en-IN")}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Products */}
      <Card>
        <CardHeader><CardTitle className="text-base">Products Ordered</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {order.items.map((item: any) => (
              <div key={item.id} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                <div>
                  <div className="font-medium text-foreground text-sm">{item.productNameSnapshot}</div>
                  {item.categorySnapshot && <div className="text-xs text-muted-foreground">{item.categorySnapshot}</div>}
                </div>
                <div className="text-right">
                  {item.discountPriceSnapshot && <div className="text-xs text-muted-foreground line-through">₹{Number(item.unitPriceSnapshot).toLocaleString("en-IN")}</div>}
                  <div className="font-semibold text-foreground text-sm">₹{Number(item.finalPriceSnapshot).toLocaleString("en-IN")}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-border flex justify-between font-bold text-foreground">
            <span>Total</span>
            <span>₹{Number(order.totalAmount).toLocaleString("en-IN")}</span>
          </div>
        </CardContent>
      </Card>

      {/* Payment Info */}
      {order.payment && (
        <Card>
          <CardHeader><CardTitle className="text-base">Payment Information</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">UTR / Reference ID</span><span className="font-mono font-medium">{order.payment.utrReference}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Screenshot</span><Badge variant={order.payment.screenshotUrl ? "default" : "secondary"}>{order.payment.screenshotUrl ? "Uploaded" : "Not uploaded"}</Badge></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Submitted</span><span>{order.payment.submittedAt ? new Date(order.payment.submittedAt).toLocaleString("en-IN") : "—"}</span></div>
          </CardContent>
        </Card>
      )}

      {/* Billing */}
      {order.billingFullName && (
        <Card>
          <CardHeader><CardTitle className="text-base">Billing Address</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-0.5">
            <p className="font-medium text-foreground">{order.billingFullName}</p>
            <p>{order.billingAddressLine1}</p>
            {order.billingAddressLine2 && <p>{order.billingAddressLine2}</p>}
            <p>{order.billingCity}, {order.billingState} {order.billingPostalCode}</p>
            <p>{order.billingCountry}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
