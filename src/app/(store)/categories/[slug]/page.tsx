"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronRight, PackageOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import ProductCard from "@/components/store/product-card";

export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [products, setProducts] = useState<any[]>([]);
  const [category, setCategory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, page: 1 });
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/products?categorySlug=${slug}&page=${page}&limit=12`)
      .then(r => r.json())
      .then(d => {
        setProducts(d.products || []);
        setCategory(d.category || null);
        setPagination(d.pagination || { total: 0, totalPages: 1, page: 1 });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug, page]);

  const categoryName = category?.name || slug.split("-").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Breadcrumb */}
      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400">Home</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link href="/products" className="hover:text-blue-600 dark:hover:text-blue-400">Products</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-foreground font-medium">{categoryName}</span>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-10">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl md:text-3xl font-bold mb-1">{categoryName}</h1>
          {!loading && <p className="text-blue-200 text-sm">{pagination.total} products</p>}
          {category?.description && <p className="text-blue-100 mt-2 max-w-2xl text-sm">{category.description}</p>}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <PackageOpen className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold text-foreground">No products yet</h3>
            <p className="text-muted-foreground mt-1">Products in this category will appear here.</p>
            <Link href="/products" className="mt-4 inline-block text-blue-600 dark:text-blue-400 hover:underline text-sm">Browse all products →</Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
            {pagination.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-10">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-4 py-2 border border-border rounded-lg text-sm text-foreground hover:bg-muted disabled:opacity-50">Previous</button>
                <span className="flex items-center text-sm px-4 text-muted-foreground">Page {page} of {pagination.totalPages}</span>
                <button disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)} className="px-4 py-2 border border-border rounded-lg text-sm text-foreground hover:bg-muted disabled:opacity-50">Next</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
