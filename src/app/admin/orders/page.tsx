"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import OrderStatusBadge from "@/components/store/order-status-badge";

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "PENDING_PAYMENT", label: "Pending Payment" },
  { value: "PAYMENT_SUBMITTED", label: "Payment Submitted" },
  { value: "UNDER_REVIEW", label: "Under Review" },
  { value: "PAYMENT_APPROVED", label: "Payment Approved" },
  { value: "PAYMENT_REJECTED", label: "Payment Rejected" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (search) params.set("search", search);
      if (status) params.set("status", status);
      const res = await fetch(`/api/admin/orders?${params}`);
      const data = await res.json();
      setOrders(data.orders || []);
      setPagination(data.pagination || { total: 0, totalPages: 1 });
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, [page, status]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
          <p className="text-slate-500 text-sm">{pagination.total} total orders</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input placeholder="Search by order #, customer, email, UTR..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && fetchOrders()} className="pl-9" />
        </div>
        <Select value={status} onValueChange={(v: string | null) => { setStatus(v ?? ""); setPage(1); }}>
          <SelectTrigger className="w-52"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={fetchOrders} variant="outline">Search</Button>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({length: 5}).map((_,i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                {["Order #", "Customer", "Products", "Amount", "UTR", "Status", "Date", ""].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-muted/40 transition-colors">
                  <td className="px-4 py-3 font-mono font-semibold text-sm text-foreground">{order.orderNumber}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{order.user.name}</div>
                    <div className="text-xs text-muted-foreground">{order.user.email}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs max-w-xs">
                    <span className="line-clamp-2">{order.items.map((i: any) => i.productNameSnapshot).join(", ")}</span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-foreground">₹{Number(order.totalAmount).toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{order.payment?.utrReference || "—"}</td>
                  <td className="px-4 py-3"><OrderStatusBadge status={order.status} /></td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(order.createdAt).toLocaleDateString("en-IN")}</td>
                  <td className="px-4 py-3">
                    <Button asChild variant="ghost" size="sm"><Link href={`/admin/orders/${order.id}`}><Eye className="h-3.5 w-3.5 mr-1" />View</Link></Button>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr><td colSpan={8} className="text-center py-12 text-muted-foreground">No orders found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <span className="flex items-center text-sm text-slate-600 px-4">Page {page} of {pagination.totalPages}</span>
          <Button variant="outline" disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
