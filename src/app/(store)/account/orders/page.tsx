"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Package, ExternalLink, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import OrderStatusBadge from "@/components/store/order-status-badge";

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/orders").then(r => r.json()).then(d => { setOrders(d.orders || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="space-y-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>;
  }

  if (orders.length === 0) {
    return <EmptyState title="No orders yet" description="Start shopping to see your orders here." action={{ label: "Browse Products", href: "/products" }} />;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-foreground">My Orders</h1>
      {orders.map((order) => (
        <Card key={order.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono font-bold text-foreground">{order.orderNumber}</span>
                  <OrderStatusBadge status={order.status} />
                </div>
                <div className="text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {order.items.map((i: any) => i.productNameSnapshot).join(", ")}
                </div>
              </div>
              <div className="flex flex-col sm:items-end gap-2">
                <span className="font-bold text-foreground text-lg">₹{Number(order.totalAmount).toLocaleString("en-IN")}</span>
                <div className="flex gap-2">
                  {order.status === "PENDING_PAYMENT" || order.status === "PAYMENT_REJECTED" ? (
                    <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Link href={`/payment/${order.id}`}>Complete Payment</Link>
                    </Button>
                  ) : null}
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/account/orders/${order.id}`}>View Details <ExternalLink className="ml-1 h-3 w-3" /></Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
