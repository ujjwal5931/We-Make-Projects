"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import ProductCard from "@/components/store/product-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent } from "@/components/ui/card";

const CATEGORIES = [
  { name: "All Categories", slug: "" },
  { name: "SolidWorks CAD Files", slug: "solidworks-cad-files" },
  { name: "ANSYS Simulation Files", slug: "ansys-simulation-files" },
  { name: "Engineering Notes", slug: "engineering-notes" },
  { name: "Software Installation Files", slug: "software-installation-files" },
  { name: "Other Digital Products", slug: "other-digital-products" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "popular", label: "Most Popular" },
  { value: "rating", label: "Highest Rated" },
];

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [products, setProducts] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [sort, setSort] = useState(searchParams.get("sort") || "newest");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1"));
  const [showFilters, setShowFilters] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (category) params.set("category", category);
      if (sort) params.set("sort", sort);
      if (minPrice) params.set("minPrice", minPrice);
      if (maxPrice) params.set("maxPrice", maxPrice);
      params.set("page", String(page));
      params.set("limit", "12");

      const res = await fetch(`/api/products?${params}`);
      const data = await res.json();
      setProducts(data.products || []);
      setPagination(data.pagination || { page: 1, total: 0, totalPages: 1 });
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [search, category, sort, minPrice, maxPrice, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const updateURL = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v) params.set(k, v); else params.delete(k);
    });
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    updateURL({ search, category, sort, minPrice, maxPrice });
  };

  const clearFilter = (key: string) => {
    if (key === "search") setSearch("");
    if (key === "category") setCategory("");
    if (key === "minPrice") setMinPrice("");
    if (key === "maxPrice") setMaxPrice("");
    setPage(1);
  };

  const activeFilters = [
    ...(search ? [{ key: "search", label: `Search: "${search}"` }] : []),
    ...(category ? [{ key: "category", label: CATEGORIES.find(c => c.slug === category)?.name || category }] : []),
    ...(minPrice ? [{ key: "minPrice", label: `Min ₹${minPrice}` }] : []),
    ...(maxPrice ? [{ key: "maxPrice", label: `Max ₹${maxPrice}` }] : []),
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-foreground">All Products</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {loading ? "Loading..." : `${pagination.total} products found`}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Search & Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <form onSubmit={handleSearch} className="flex flex-1 gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products, categories, file types..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button type="submit">Search</Button>
          </form>
          <div className="flex gap-2">
            <Select value={sort} onValueChange={(v: string | null) => { const val = v ?? ""; setSort(val); setPage(1); updateURL({ sort: val }); }}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
              <SlidersHorizontal className="h-4 w-4 mr-2" /> Filters
            </Button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Category</label>
                  <Select value={category} onValueChange={(v: string | null) => { setCategory(v ?? ""); setPage(1); }}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Min Price (₹)</label>
                  <Input type="number" placeholder="0" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Max Price (₹)</label>
                  <Input type="number" placeholder="Any" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button size="sm" onClick={() => { setPage(1); fetchProducts(); }}>Apply Filters</Button>
                <Button size="sm" variant="ghost" onClick={() => { setCategory(""); setMinPrice(""); setMaxPrice(""); }}>Clear All</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {activeFilters.map((f) => (
              <Badge key={f.key} variant="secondary" className="gap-1 pr-1">
                {f.label}
                <button onClick={() => clearFilter(f.key)} className="ml-1 hover:text-red-500">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Category quick links */}
        <div className="flex flex-wrap gap-2 mb-6">
          {CATEGORIES.map((c) => (
            <button
              key={c.slug}
              onClick={() => { setCategory(c.slug); setPage(1); }}
              className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                category === c.slug
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-card text-muted-foreground border-border hover:border-blue-500/50 hover:text-foreground"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-card rounded-lg border border-border p-4 space-y-3">
                <Skeleton className="h-48 w-full rounded" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-8 w-full" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            title="No products found"
            description="Try a different keyword or category. We're adding new products regularly!"
            action={{ label: "Clear Filters", onClick: () => { setSearch(""); setCategory(""); setMinPrice(""); setMaxPrice(""); setPage(1); } }}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-10">
            <Button variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              Previous
            </Button>
            <span className="text-sm text-muted-foreground px-4">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button variant="outline" disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}>
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background"><div className="container mx-auto px-4 py-8 space-y-4">{Array.from({length:6}).map((_,i)=><Skeleton key={i} className="h-48 rounded-xl"/>)}</div></div>}>
      <ProductsContent />
    </Suspense>
  );
}
