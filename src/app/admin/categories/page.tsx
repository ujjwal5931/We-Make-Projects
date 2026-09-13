"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", description: "" });
  const [editing, setEditing] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);

  const fetch_ = async () => {
    const res = await fetch("/api/admin/categories");
    const data = await res.json();
    setCategories(data.categories || []);
    setLoading(false);
  };

  useEffect(() => { fetch_(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    const method = editing ? "PATCH" : "POST";
    const body = editing ? { id: editing.id, ...form, isActive: editing.isActive } : { ...form, isActive: true };
    const res = await fetch("/api/admin/categories", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    if (data.success || data.category) { toast.success(editing ? "Updated!" : "Created!"); setForm({ name: "", description: "" }); setEditing(null); setShowForm(false); fetch_(); }
    else toast.error(data.error || "Failed");
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete category "${name}"?`)) return;
    const res = await fetch(`/api/admin/categories?id=${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) { toast.success("Deleted"); fetch_(); }
    else toast.error(data.error || "Cannot delete");
  };

  const handleToggle = async (cat: any) => {
    const res = await fetch("/api/admin/categories", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: cat.id, isActive: !cat.isActive }) });
    if ((await res.json()).success) { toast.success("Updated"); fetch_(); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Categories</h1>
        <Button onClick={() => { setEditing(null); setForm({ name: "", description: "" }); setShowForm(true); }} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" /> Add Category
        </Button>
      </div>

      {showForm && (
        <Card className="border-blue-100">
          <CardContent className="pt-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <h3 className="font-semibold">{editing ? "Edit Category" : "New Category"}</h3>
              <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. SolidWorks CAD Files" required /></div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} /></div>
              <div className="flex gap-2">
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">{editing ? "Update" : "Create"}</Button>
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditing(null); }}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-16" />)}</div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>{["Category Name", "Slug", "Products", "Status", "Actions"].map(h => <th key={h} className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 py-3">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-border">
              {categories.map(cat => (
                <tr key={cat.id} className="hover:bg-muted/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{cat.name}</div>
                    {cat.description && <div className="text-xs text-muted-foreground line-clamp-1">{cat.description}</div>}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{cat.slug}</td>
                  <td className="px-4 py-3"><Badge variant="secondary">{cat._count?.products || 0} products</Badge></td>
                  <td className="px-4 py-3"><Switch checked={cat.isActive} onCheckedChange={() => handleToggle(cat)} /></td>
                  <td className="px-4 py-3 flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => { setEditing(cat); setForm({ name: cat.name, description: cat.description || "" }); setShowForm(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-600" onClick={() => handleDelete(cat.id, cat.name)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
