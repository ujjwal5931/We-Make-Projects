"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { TrendingUp, ShoppingBag, Clock, CheckCircle, XCircle, Package, Users, Star, ArrowRight, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import OrderStatusBadge from "@/components/store/order-status-badge";

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          setError(d.error);
          setData(null);
        } else {
          setData(d);
          setError(null);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load dashboard data");
        setLoading(false);
      });
  }, []);

  if (!loading && (error || !data?.stats)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8 text-red-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">
          {error === "Forbidden" ? "Admin Access Required" : "Dashboard Unavailable"}
        </h2>
        <p className="text-slate-500 max-w-sm mb-6 text-sm">
          {error === "Forbidden"
            ? "You must be logged in as an administrator to view the dashboard."
            : error || "Unable to retrieve store metrics."}
        </p>
        <Button asChild className="bg-blue-600 hover:bg-blue-700">
          <Link href="/admin/login">Log In as Admin</Link>
        </Button>
      </div>
    );
  }

  const stats = [
    {
      label: "Total Revenue",
      value: data?.stats?.totalRevenue != null ? `₹${Number(data.stats.totalRevenue).toLocaleString("en-IN")}` : "—",
      icon: TrendingUp,
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-50 dark:bg-green-950/40",
    },
    {
      label: "Total Orders",
      value: data?.stats?.totalOrders ?? "—",
      icon: ShoppingBag,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/40",
    },
    {
      label: "Pending Payments",
      value: data?.stats?.pendingPayments ?? "—",
      icon: Clock,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/40",
      alert: true,
    },
    {
      label: "Approved Orders",
      value: data?.stats?.approvedOrders ?? "—",
      icon: CheckCircle,
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-50 dark:bg-green-950/40",
    },
    {
      label: "Rejected Orders",
      value: data?.stats?.rejectedOrders ?? "—",
      icon: XCircle,
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-50 dark:bg-red-950/40",
    },
    {
      label: "Total Products",
      value: data?.stats?.totalProducts ?? "—",
      icon: Package,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-50 dark:bg-purple-950/40",
    },
    {
      label: "Total Customers",
      value: data?.stats?.totalCustomers ?? "—",
      icon: Users,
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-50 dark:bg-indigo-950/40",
    },
    {
      label: "Total Reviews",
      value: data?.stats?.totalReviews ?? "—",
      icon: Star,
      color: "text-yellow-600 dark:text-yellow-400",
      bg: "bg-yellow-50 dark:bg-yellow-950/40",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <span className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString("en-IN", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </span>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card
            key={stat.label}
            className={
              stat.alert && (data?.stats?.pendingPayments ?? 0) > 0
                ? "border-amber-300 shadow-amber-100 shadow"
                : ""
            }
          >
            <CardContent className="p-5">
              {loading ? (
                <Skeleton className="h-12" />
              ) : (
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                    <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
                    {stat.alert && (data?.stats?.pendingPayments ?? 0) > 0 && (
                      <Badge className="mt-2 bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 text-xs">
                        Needs Review
                      </Badge>
                    )}
                  </div>
                  <div className={`${stat.bg} p-2 rounded-lg`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Revenue (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-48" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data?.revenueByDay || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" opacity={0.3} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="currentColor" className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} stroke="currentColor" className="text-muted-foreground" />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)', borderRadius: '0.5rem' }}
                    formatter={(v: any) => [`₹${Number(v).toLocaleString("en-IN")}`, "Revenue"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={{ fill: "#2563eb" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Orders by Status</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-48" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={(data?.ordersByStatus || []).map((s: any) => ({
                    status: s.status.replace("PAYMENT_", "").replace("_", " "),
                    count: s._count.status,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" opacity={0.3} />
                  <XAxis dataKey="status" tick={{ fontSize: 10 }} stroke="currentColor" className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 11 }} stroke="currentColor" className="text-muted-foreground" />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)', borderRadius: '0.5rem' }}
                  />
                  <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Orders</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/orders">
              View All <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {(data?.recentOrders || []).map((order: any) => (
                <div key={order.id} className="py-3 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-foreground">{order.orderNumber}</span>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {order.user?.name} · {order.user?.email}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-sm text-foreground">
                      ₹{Number(order.totalAmount).toLocaleString("en-IN")}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString("en-IN")}
                    </div>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/orders/${order.id}`}>View</Link>
                  </Button>
                </div>
              ))}
              {(!data?.recentOrders || data.recentOrders.length === 0) && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No orders recorded yet
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
