"use client";
import { useState, useEffect } from "react";
import { Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import Link from "next/link";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  const fetch_ = async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/reviews?page=${page}&limit=20`);
    const data = await res.json();
    setReviews(data.reviews || []);
    setPagination(data.pagination || { total: 0, totalPages: 1 });
    setLoading(false);
  };

  useEffect(() => { fetch_(); }, [page]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this review?")) return;
    const res = await fetch(`/api/admin/reviews?id=${id}`, { method: "DELETE" });
    if ((await res.json()).success) { toast.success("Review deleted"); fetch_(); }
    else toast.error("Failed to delete");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reviews</h1>
        <p className="text-slate-500 text-sm">{pagination.total} total reviews</p>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({length:5}).map((_,i) => <Skeleton key={i} className="h-20" />)}</div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>{["Product", "Reviewer", "Rating", "Review", "Date", "Actions"].map(h => <th key={h} className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 py-3">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-border">
              {reviews.map(r => (
                <tr key={r.id} className="hover:bg-muted/40 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/products/${r.product.slug}`} className="font-medium text-blue-600 dark:text-blue-400 hover:underline text-sm line-clamp-1">{r.product.name}</Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{r.user.name}</div>
                    <div className="text-xs text-muted-foreground font-mono">{r.user.userId}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {Array.from({length:r.rating}).map((_,i)=><Star key={i} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400"/>)}
                      <span className="ml-1 text-xs text-muted-foreground">{r.rating}/5</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <div className="font-medium text-xs">{r.title}</div>
                    <div className="text-slate-500 text-xs line-clamp-2">{r.comment}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">{new Date(r.createdAt).toLocaleDateString("en-IN")}</td>
                  <td className="px-4 py-3">
                    <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-600" onClick={() => handleDelete(r.id)}><Trash2 className="h-3.5 w-3.5"/></Button>
                  </td>
                </tr>
              ))}
              {reviews.length === 0 && <tr><td colSpan={6} className="text-center py-12 text-slate-400">No reviews yet</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <span className="flex items-center text-sm px-4">Page {page} of {pagination.totalPages}</span>
          <Button variant="outline" disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
