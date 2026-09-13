"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [qrs, setQrs] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "", description: "", shortDescription: "", price: "", discountPrice: "",
    categoryId: "", fileType: "", fileSize: "", numberOfPages: "", previewUrl: "",
    features: "", requirements: "", whatsIncluded: "", tags: "",
    isActive: "true", isFeatured: "false", paymentQRId: "",
  });
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [digitalFile, setDigitalFile] = useState<File | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/categories").then(r => r.json()),
      fetch("/api/admin/payment-methods").then(r => r.json()),
    ]).then(([catData, qrData]) => {
      setCategories(catData.categories || []);
      setQrs((qrData.qrs || []).filter((q: any) => q.isActive));
    });
  }, []);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleThumbChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbnail(file);
    const reader = new FileReader();
    reader.onload = (e) => setThumbnailPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.description || !form.price || !form.categoryId) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (form.discountPrice && parseFloat(form.discountPrice) >= parseFloat(form.price)) {
      toast.error("Discount price must be less than original price");
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
      if (thumbnail) fd.append("thumbnail", thumbnail);
      if (digitalFile) fd.append("digitalFile", digitalFile);

      const res = await fetch("/api/admin/products", { method: "POST", body: fd });
      const data = await res.json();
      if (data.success) { toast.success("Product created!"); router.push("/admin/products"); }
      else toast.error(data.error || "Failed to create product");
    } catch { toast.error("Something went wrong"); }
    finally { setSubmitting(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">New Product</h1>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700">
            {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating...</> : "Create Product"}
          </Button>
        </div>
      </div>

      {/* Basic Info */}
      <Card>
        <CardHeader><CardTitle className="text-base">Basic Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Product Name <span className="text-red-500">*</span></Label>
            <Input value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Mechanical Gear Assembly — SolidWorks" required />
          </div>
          <div>
            <Label>Short Description</Label>
            <Input value={form.shortDescription} onChange={e => set("shortDescription", e.target.value)} placeholder="Brief one-line description" />
          </div>
          <div>
            <Label>Full Description <span className="text-red-500">*</span></Label>
            <Textarea value={form.description} onChange={e => set("description", e.target.value)} rows={5} placeholder="Detailed product description..." required />
          </div>
          <div>
            <Label>Category <span className="text-red-500">*</span></Label>
            <Select value={form.categoryId} onValueChange={(v: string | null) => set("categoryId", v ?? "")}>
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card>
        <CardHeader><CardTitle className="text-base">Pricing</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <Label>Original Price (₹) <span className="text-red-500">*</span></Label>
            <Input type="number" min="0" step="0.01" value={form.price} onChange={e => set("price", e.target.value)} placeholder="999" required />
          </div>
          <div>
            <Label>Discount Price (₹)</Label>
            <Input type="number" min="0" step="0.01" value={form.discountPrice} onChange={e => set("discountPrice", e.target.value)} placeholder="Optional" />
            {form.price && form.discountPrice && parseFloat(form.discountPrice) < parseFloat(form.price) && (
              <p className="text-xs text-green-600 mt-1">Save {Math.round((1 - parseFloat(form.discountPrice)/parseFloat(form.price)) * 100)}%</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* File Details */}
      <Card>
        <CardHeader><CardTitle className="text-base">Product Details</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div><Label>File Type</Label><Input value={form.fileType} onChange={e => set("fileType", e.target.value)} placeholder=".SLDASM / .SLDPRT" /></div>
          <div><Label>File Size</Label><Input value={form.fileSize} onChange={e => set("fileSize", e.target.value)} placeholder="45 MB" /></div>
          <div><Label>Number of Pages</Label><Input type="number" value={form.numberOfPages} onChange={e => set("numberOfPages", e.target.value)} placeholder="Optional" /></div>
          <div><Label>Preview URL</Label><Input type="url" value={form.previewUrl} onChange={e => set("previewUrl", e.target.value)} placeholder="https://..." /></div>
        </CardContent>
      </Card>

      {/* Specifications */}
      <Card>
        <CardHeader><CardTitle className="text-base">Specifications</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: "features", label: "Features (one per line)" },
            { key: "requirements", label: "Requirements (one per line)" },
            { key: "whatsIncluded", label: "What's Included (one per line)" },
          ].map(({ key, label }) => (
            <div key={key}>
              <Label>{label}</Label>
              <Textarea value={(form as any)[key]} onChange={e => set(key, e.target.value)} rows={3} placeholder={`Enter each item on a new line...`} />
            </div>
          ))}
          <div>
            <Label>Tags (comma-separated)</Label>
            <Input value={form.tags} onChange={e => set("tags", e.target.value)} placeholder="solidworks, gear, assembly, mechanical" />
          </div>
        </CardContent>
      </Card>

      {/* Media */}
      <Card>
        <CardHeader><CardTitle className="text-base">Product Thumbnail</CardTitle></CardHeader>
        <CardContent>
          {thumbnailPreview ? (
            <div className="relative w-40 h-40">
              <img src={thumbnailPreview} className="w-full h-full object-contain border rounded-lg" alt="Thumbnail" />
              <button type="button" onClick={() => { setThumbnail(null); setThumbnailPreview(null); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"><X className="h-3 w-3" /></button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-40 h-40 border-2 border-dashed rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
              <Upload className="h-8 w-8 text-slate-300 mb-2" />
              <span className="text-xs text-slate-500">Upload Thumbnail</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleThumbChange} />
            </label>
          )}
        </CardContent>
      </Card>

      {/* Digital File */}
      <Card className="border-amber-100">
        <CardHeader><CardTitle className="text-base">Digital Product File</CardTitle></CardHeader>
        <CardContent>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mb-4 text-xs text-amber-800 dark:text-amber-300">
            🔒 This file will ONLY be accessible to customers who purchase and get their payment approved. It is stored securely outside the public directory.
          </div>
          <label className="flex items-center gap-3 cursor-pointer border border-border rounded-lg p-4 hover:bg-muted transition-colors">
            <Upload className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="text-sm font-medium text-foreground">{digitalFile ? digitalFile.name : "Upload digital file"}</div>
              <div className="text-xs text-muted-foreground">ZIP, PDF, SLDASM, WBPJ, etc.</div>
            </div>
            <input type="file" className="hidden" onChange={e => setDigitalFile(e.target.files?.[0] || null)} />
          </label>
        </CardContent>
      </Card>

      {/* Payment QR */}
      <Card>
        <CardHeader><CardTitle className="text-base">Payment QR Code</CardTitle></CardHeader>
        <CardContent>
          <Select value={form.paymentQRId} onValueChange={(v: string | null) => set("paymentQRId", v ?? "")}>
            <SelectTrigger><SelectValue placeholder="Select payment QR" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              {qrs.map(q => <SelectItem key={q.id} value={q.id}>{q.name} — {q.upiId}</SelectItem>)}
            </SelectContent>
          </Select>
          <p className="text-xs text-slate-400 mt-2">The QR code shown to customers during payment for this product.</p>
        </CardContent>
      </Card>

      {/* Settings */}
      <Card>
        <CardHeader><CardTitle className="text-base">Settings</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div><div className="text-sm font-medium">Active</div><div className="text-xs text-slate-400">Show this product in the store</div></div>
            <Switch checked={form.isActive === "true"} onCheckedChange={v => set("isActive", v ? "true" : "false")} />
          </div>
          <div className="flex items-center justify-between">
            <div><div className="text-sm font-medium">Featured</div><div className="text-xs text-slate-400">Show on home page featured section</div></div>
            <Switch checked={form.isFeatured === "true"} onCheckedChange={v => set("isFeatured", v ? "true" : "false")} />
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
