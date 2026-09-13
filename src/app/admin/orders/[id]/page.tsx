"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import {
  CheckCircle, XCircle, Clock, Mail, MailX, User, MapPin,
  Package, CreditCard, ChevronRight, Loader2, RefreshCw, Copy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import OrderStatusBadge from "@/components/store/order-status-badge";

const REJECTION_REASONS = [
  "Invalid UTR / Reference ID",
  "Payment amount does not match",
  "Screenshot is unclear or unreadable",
  "Payment not received in our account",
  "Duplicate payment reference submitted",
  "Other (please specify below)",
];

export default function AdminOrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [resending, setResending] = useState(false);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectCustom, setRejectCustom] = useState("");

  const fetchOrder = async () => {
    const res = await fetch(`/api/admin/orders/${orderId}`);
    const data = await res.json();
    setOrder(data.order);
    setLoading(false);
  };

  useEffect(() => { fetchOrder(); }, [orderId]);

  const handleApprove = async () => {
    setApproving(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        if (!data.emailSent) toast.warning(`Email delivery failed: ${data.emailError}. Use Resend Email.`);
        setShowApproveConfirm(false);
        fetchOrder();
      } else {
        toast.error(data.error || "Approval failed");
      }
    } catch { toast.error("Something went wrong"); }
    finally { setApproving(false); }
  };

  const handleReject = async () => {
    const reason = rejectReason === "Other (please specify below)" ? rejectCustom : rejectReason;
    if (!reason.trim()) { toast.error("Please provide a rejection reason"); return; }
    setRejecting(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", reason: reason.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setShowRejectDialog(false);
        fetchOrder();
      } else {
        toast.error(data.error || "Rejection failed");
      }
    } catch { toast.error("Something went wrong"); }
    finally { setRejecting(false); }
  };

  const handleResendEmail = async () => {
    setResending(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/resend-email`, { method: "POST" });
      const data = await res.json();
      if (data.success) toast.success("Delivery email resent!");
      else toast.error(data.message || "Failed to resend");
      fetchOrder();
    } catch { toast.error("Something went wrong"); }
    finally { setResending(false); }
  };

  if (loading) return <div className="space-y-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}</div>;
  if (!order) return <div className="text-center py-20 text-slate-500">Order not found. <Link href="/admin/orders" className="text-blue-600 hover:underline">Back to orders</Link></div>;

  const isVerifiable = ["PAYMENT_SUBMITTED", "UNDER_REVIEW"].includes(order.status);
  const isApproved = ["PAYMENT_APPROVED", "DELIVERED"].includes(order.status);
  const isRejected = order.status === "PAYMENT_REJECTED";

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/orders" className="text-sm text-slate-500 hover:text-blue-600 flex items-center gap-1 mb-1">← Back to Orders</Link>
          <h1 className="text-2xl font-bold text-slate-900">{order.orderNumber}</h1>
          <p className="text-slate-500 text-sm">{new Date(order.createdAt).toLocaleString("en-IN")}</p>
        </div>
        <div className="flex items-center gap-3">
          <OrderStatusBadge status={order.status} />
          <span className="text-xl font-bold text-slate-900">₹{Number(order.totalAmount).toLocaleString("en-IN")}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Details */}
        <div className="lg:col-span-2 space-y-5">
          {/* Customer */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-2"><User className="h-4 w-4" />Customer</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Name</span><span className="font-medium">{order.user.name}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">User ID</span><span className="font-mono">{order.user.userId}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Email</span>
                <div className="flex items-center gap-1">
                  <span>{order.user.email}</span>
                  <button onClick={() => { navigator.clipboard.writeText(order.user.email); toast.success("Copied!"); }}><Copy className="h-3 w-3 text-slate-400 hover:text-blue-600" /></button>
                </div>
              </div>
              {order.user.phone && <div className="flex justify-between"><span className="text-slate-500">Phone</span><span>{order.user.phone}</span></div>}
              <div className="flex justify-between"><span className="text-slate-500">Customer since</span><span>{new Date(order.user.createdAt).toLocaleDateString("en-IN")}</span></div>
            </CardContent>
          </Card>

          {/* Billing */}
          {order.billingFullName && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-2"><MapPin className="h-4 w-4" />Billing Address</CardTitle></CardHeader>
              <CardContent className="text-sm text-slate-700 space-y-0.5">
                <p className="font-medium">{order.billingFullName}</p>
                <p>{order.billingAddressLine1}</p>
                {order.billingAddressLine2 && <p>{order.billingAddressLine2}</p>}
                <p>{order.billingCity}, {order.billingState} {order.billingPostalCode}</p>
                <p>{order.billingCountry}</p>
              </CardContent>
            </Card>
          )}

          {/* Products */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-2"><Package className="h-4 w-4" />Products Ordered</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {order.items.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-center border-b pb-3 last:border-0 last:pb-0">
                    <div>
                      <div className="font-medium text-sm">{item.productNameSnapshot}</div>
                      {item.categorySnapshot && <div className="text-xs text-slate-400">{item.categorySnapshot}</div>}
                    </div>
                    <div className="text-right text-sm">
                      {item.discountPriceSnapshot && <div className="line-through text-slate-400 text-xs">₹{Number(item.unitPriceSnapshot).toLocaleString("en-IN")}</div>}
                      <div className="font-semibold">₹{Number(item.finalPriceSnapshot).toLocaleString("en-IN")}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t flex justify-between">
                {order.discount > 0 && <div className="text-sm text-green-600">Discount: -₹{Number(order.discount).toLocaleString("en-IN")}</div>}
                <div className="font-bold ml-auto">Total: ₹{Number(order.totalAmount).toLocaleString("en-IN")}</div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Details */}
          {order.payment && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-2"><CreditCard className="h-4 w-4" />Payment Verification</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-slate-500 mb-1">Expected Amount</div>
                    <div className="font-bold text-lg text-blue-700">₹{Number(order.payment.expectedAmount).toLocaleString("en-IN")}</div>
                  </div>
                  <div>
                    <div className="text-slate-500 mb-1">UTR / Reference ID</div>
                    <div className="flex items-center gap-2 font-mono font-semibold">
                      {order.payment.utrReference}
                      <button onClick={() => { navigator.clipboard.writeText(order.payment.utrReference); toast.success("UTR copied!"); }}>
                        <Copy className="h-3 w-3 text-slate-400 hover:text-blue-600" />
                      </button>
                    </div>
                  </div>
                </div>

                {order.payment.submittedAt && (
                  <div className="text-sm text-slate-500">Submitted: {new Date(order.payment.submittedAt).toLocaleString("en-IN")}</div>
                )}

                {order.payment.screenshotUrl && (
                  <div>
                    <div className="text-sm text-slate-500 mb-2">Payment Screenshot</div>
                    <a href={order.payment.screenshotUrl} target="_blank" rel="noopener noreferrer" className="block w-full max-w-sm">
                      <Image
                        src={order.payment.screenshotUrl}
                        alt="Payment screenshot"
                        width={400}
                        height={300}
                        className="rounded-lg border object-contain w-full hover:opacity-90 transition-opacity cursor-zoom-in"
                      />
                      <p className="text-xs text-blue-600 mt-1 hover:underline">Click to open full size</p>
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Actions */}
        <div className="space-y-5">
          {/* Verification Actions */}
          {isVerifiable && !showApproveConfirm && !showRejectDialog && (
            <Card className="border-blue-100">
              <CardHeader><CardTitle className="text-base">Verify Payment</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-slate-500">Manually verify the payment in your UPI/bank app before approving.</p>
                <Button onClick={() => setShowApproveConfirm(true)} className="w-full bg-green-600 hover:bg-green-700">
                  <CheckCircle className="h-4 w-4 mr-2" /> Approve Payment
                </Button>
                <Button onClick={() => setShowRejectDialog(true)} variant="outline" className="w-full border-red-200 text-red-600 hover:bg-red-50">
                  <XCircle className="h-4 w-4 mr-2" /> Reject Payment
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Approve Confirm */}
          {showApproveConfirm && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-5 space-y-4">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-green-900 text-sm">Confirm Approval</p>
                    <p className="text-xs text-green-700 mt-1">
                      Have you manually verified this payment of <strong>₹{Number(order.totalAmount).toLocaleString("en-IN")}</strong> in your UPI/bank app? Approving will send the download link to the customer.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleApprove} disabled={approving} className="flex-1 bg-green-600 hover:bg-green-700" size="sm">
                    {approving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null} Yes, Approve
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowApproveConfirm(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reject Dialog */}
          {showRejectDialog && (
            <Card className="border-red-500/20 bg-red-500/10">
              <CardContent className="pt-5 space-y-4">
                <p className="font-semibold text-red-900 dark:text-red-300 text-sm">Reject Payment</p>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Rejection Reason</label>
                  <Select value={rejectReason} onValueChange={(v: string | null) => setRejectReason(v ?? "")}>
                    <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Select reason..." /></SelectTrigger>
                    <SelectContent>
                      {REJECTION_REASONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {rejectReason === "Other (please specify below)" && (
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Custom Reason</label>
                    <Input value={rejectCustom} onChange={e => setRejectCustom(e.target.value)} placeholder="Specify reason..." className="bg-background border-border" />
                  </div>
                )}
                <div className="flex gap-2">
                  <Button onClick={handleReject} disabled={rejecting || !rejectReason} className="flex-1 bg-red-600 hover:bg-red-700 text-white" size="sm">
                    {rejecting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null} Reject
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowRejectDialog(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Approved State */}
          {isApproved && (
            <Card className="border-green-200">
              <CardContent className="pt-5 space-y-3">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-semibold text-sm">Payment Approved</span>
                </div>
                {order.approvedBy && (
                  <p className="text-xs text-slate-500">Approved by {order.approvedBy.name} at {new Date(order.paymentApprovedAt).toLocaleString("en-IN")}</p>
                )}
                {order.deliveryEmailStatus === "failed" && (
                  <div className="bg-red-50 border border-red-200 rounded p-2 text-xs text-red-700">
                    <MailX className="h-3 w-3 inline mr-1" /> Email delivery failed: {order.deliveryEmailError}
                  </div>
                )}
                {order.deliveryEmailSentAt && (
                  <p className="text-xs text-green-600"><Mail className="h-3 w-3 inline mr-1" /> Email sent {new Date(order.deliveryEmailSentAt).toLocaleString("en-IN")}</p>
                )}
                <Button onClick={handleResendEmail} disabled={resending} variant="outline" className="w-full" size="sm">
                  {resending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                  Resend Delivery Email
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Rejected State */}
          {isRejected && (
            <Card className="border-red-200">
              <CardContent className="pt-5">
                <div className="flex items-start gap-2 text-red-700">
                  <XCircle className="h-5 w-5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-sm">Payment Rejected</div>
                    <div className="text-xs text-red-600 mt-1">{order.rejectionReason}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Activity Timeline */}
          <Card>
            <CardHeader><CardTitle className="text-sm font-semibold text-slate-500">Activity</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3 text-xs">
                <div className="flex gap-2"><Clock className="h-3.5 w-3.5 text-slate-400 mt-0.5" /><div><div className="font-medium">Order Created</div><div className="text-slate-400">{new Date(order.createdAt).toLocaleString("en-IN")}</div></div></div>
                {order.paymentSubmittedAt && <div className="flex gap-2"><CheckCircle className="h-3.5 w-3.5 text-blue-400 mt-0.5" /><div><div className="font-medium">Payment Submitted</div><div className="text-slate-400">{new Date(order.paymentSubmittedAt).toLocaleString("en-IN")}</div></div></div>}
                {order.paymentApprovedAt && <div className="flex gap-2"><CheckCircle className="h-3.5 w-3.5 text-green-500 mt-0.5" /><div><div className="font-medium">Payment Approved</div><div className="text-slate-400">{new Date(order.paymentApprovedAt).toLocaleString("en-IN")}</div></div></div>}
                {order.paymentRejectedAt && <div className="flex gap-2"><XCircle className="h-3.5 w-3.5 text-red-500 mt-0.5" /><div><div className="font-medium">Payment Rejected</div><div className="text-slate-400">{new Date(order.paymentRejectedAt).toLocaleString("en-IN")}</div></div></div>}
                {order.deliveryEmailSentAt && <div className="flex gap-2"><Mail className="h-3.5 w-3.5 text-green-500 mt-0.5" /><div><div className="font-medium">Delivery Email Sent</div><div className="text-slate-400">{new Date(order.deliveryEmailSentAt).toLocaleString("en-IN")}</div></div></div>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
