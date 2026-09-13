"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, Search, Edit, Trash2, ToggleLeft, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "15" });
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/products?${params}`);
      const data = await res.json();
      setProducts(data.products || []);
      setPagination(data.pagination || { total: 0, totalPages: 1 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, [page, search]);

  const handleToggle = async (id: string, current: boolean) => {
    const fd = new FormData();
    fd.append("isActive", current ? "false" : "true");
    const res = await fetch(`/api/admin/products/${id}`, { method: "PATCH", body: fd });
    if ((await res.json()).success) { toast.success("Updated"); fetchProducts(); }
    else toast.error("Failed to update");
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Deactivate "${name}"? It will be hidden from the store but historical orders will remain.`)) return;
    const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    if ((await res.json()).success) { toast.success("Product deactivated"); fetchProducts(); }
    else toast.error("Failed");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Products</h1>
          <p className="text-slate-500 text-sm">{pagination.total} products total</p>
        </div>
        <Button asChild className="bg-blue-600 hover:bg-blue-700">
          <Link href="/admin/products/new"><Plus className="h-4 w-4 mr-2" /> Add Product</Link>
        </Button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({length: 5}).map((_,i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      ) : products.length === 0 ? (
        <Card><CardContent className="py-20 text-center text-slate-400"><Package className="h-12 w-12 mx-auto mb-3 opacity-30" /><p>No products found</p></CardContent></Card>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 py-3">Product</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 py-3">Category</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 py-3">Price</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-muted/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-muted rounded overflow-hidden flex-shrink-0">
                        {p.thumbnail ? <Image src={p.thumbnail} alt="" width={40} height={40} className="object-cover w-full h-full" /> : <Package className="h-5 w-5 text-muted-foreground/40 m-auto" />}
                      </div>
                      <div>
                        <div className="font-medium text-foreground text-sm line-clamp-1">{p.name}</div>
                        <div className="text-xs text-muted-foreground">{p.fileType || "Digital file"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{p.category?.name}</td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-semibold text-foreground">₹{p.discountPrice ? Number(p.discountPrice).toLocaleString("en-IN") : Number(p.price).toLocaleString("en-IN")}</div>
                    {p.discountPrice && <div className="text-xs text-muted-foreground line-through">₹{Number(p.price).toLocaleString("en-IN")}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={p.isActive ? "default" : "secondary"} className={p.isActive ? "bg-green-100 text-green-700 border-green-200" : ""}>
                      {p.isActive ? "Active" : "Inactive"}
                    </Badge>
                    {p.isFeatured && <Badge className="ml-1 bg-blue-100 text-blue-700 border-blue-200">Featured</Badge>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Button asChild variant="ghost" size="sm"><Link href={`/admin/products/${p.id}/edit`}><Edit className="h-3.5 w-3.5" /></Link></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleToggle(p.id, p.isActive)} title={p.isActive ? "Deactivate" : "Activate"}>
                        <ToggleLeft className={`h-3.5 w-3.5 ${p.isActive ? "text-green-600" : "text-gray-400"}`} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id, p.name)} className="text-red-400 hover:text-red-600">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
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
