"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ShoppingBag, Clock, CheckCircle, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import OrderStatusBadge from "@/components/store/order-status-badge";

export default function AccountPage() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/orders").then(r => r.json()).then(d => { setOrders(d.orders || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const pending = orders.filter(o => ["PAYMENT_SUBMITTED", "UNDER_REVIEW", "PENDING_PAYMENT"].includes(o.status)).length;
  const approved = orders.filter(o => ["PAYMENT_APPROVED", "DELIVERED"].includes(o.status)).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Welcome back, {session?.user?.name?.split(" ")[0]}! 👋</h1>
        <p className="text-muted-foreground mt-1">Here's an overview of your account</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Orders", value: orders.length, icon: ShoppingBag, color: "text-blue-600 dark:text-blue-400" },
          { label: "Pending/Review", value: pending, icon: Clock, color: "text-amber-600 dark:text-amber-400" },
          { label: "Approved Orders", value: approved, icon: CheckCircle, color: "text-green-600 dark:text-green-400" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`${stat.color}`}><stat.icon className="h-8 w-8 opacity-80" /></div>
              <div>
                <div className="text-2xl font-bold text-foreground">{loading ? "—" : stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Orders</CardTitle>
          <Button asChild variant="ghost" size="sm"><Link href="/account/orders">View All</Link></Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12" />)}</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">No orders yet.</p>
              <Button asChild size="sm" className="mt-3"><Link href="/products">Browse Products</Link></Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {orders.slice(0, 3).map((order) => (
                <div key={order.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-mono text-sm font-semibold text-foreground">{order.orderNumber}</div>
                    <div className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString("en-IN")}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-foreground">₹{Number(order.totalAmount).toLocaleString("en-IN")}</span>
                    <OrderStatusBadge status={order.status} />
                    <Button asChild variant="ghost" size="sm"><Link href={`/account/orders/${order.id}`}>View</Link></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
