"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { Upload, Loader2, X, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [qrs, setQrs] = useState<any[]>([]);

  const [form, setForm] = useState({
    name: "",
    description: "",
    shortDescription: "",
    price: "",
    discountPrice: "",
    categoryId: "",
    fileType: "",
    fileSize: "",
    numberOfPages: "",
    previewUrl: "",
    features: "",
    requirements: "",
    whatsIncluded: "",
    tags: "",
    isActive: "true",
    isFeatured: "false",
    paymentQRId: "",
  });

  const [existingThumbnail, setExistingThumbnail] = useState<string | null>(null);
  const [existingDigitalFileName, setExistingDigitalFileName] = useState<string | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [digitalFile, setDigitalFile] = useState<File | null>(null);

  useEffect(() => {
    if (!id) return;

    Promise.all([
      fetch("/api/admin/categories").then((r) => r.json()),
      fetch("/api/admin/payment-methods").then((r) => r.json()),
      fetch(`/api/admin/products/${id}`).then((r) => r.json()),
    ])
      .then(([catData, qrData, productData]) => {
        setCategories(catData.categories || []);
        setQrs((qrData.qrs || []).filter((q: any) => q.isActive));

        if (productData.error || !productData.product) {
          toast.error(productData.error || "Product not found");
          router.push("/admin/products");
          return;
        }

        const p = productData.product;
        const featuresText = Array.isArray(p.features)
          ? p.features.join("\n")
          : typeof p.features === "string"
          ? (() => {
              try {
                const parsed = JSON.parse(p.features);
                return Array.isArray(parsed) ? parsed.join("\n") : p.features;
              } catch {
                return p.features;
              }
            })()
          : "";

        const reqsText = Array.isArray(p.requirements)
          ? p.requirements.join("\n")
          : typeof p.requirements === "string"
          ? (() => {
              try {
                const parsed = JSON.parse(p.requirements);
                return Array.isArray(parsed) ? parsed.join("\n") : p.requirements;
              } catch {
                return p.requirements;
              }
            })()
          : "";

        const incText = Array.isArray(p.whatsIncluded)
          ? p.whatsIncluded.join("\n")
          : typeof p.whatsIncluded === "string"
          ? (() => {
              try {
                const parsed = JSON.parse(p.whatsIncluded);
                return Array.isArray(parsed) ? parsed.join("\n") : p.whatsIncluded;
              } catch {
                return p.whatsIncluded;
              }
            })()
          : "";

        const tagsText = Array.isArray(p.tags)
          ? p.tags.join(", ")
          : typeof p.tags === "string"
          ? (() => {
              try {
                const parsed = JSON.parse(p.tags);
                return Array.isArray(parsed) ? parsed.join(", ") : p.tags;
              } catch {
                return p.tags;
              }
            })()
          : "";

        setForm({
          name: p.name || "",
          description: p.description || "",
          shortDescription: p.shortDescription || "",
          price: p.price != null ? String(p.price) : "",
          discountPrice: p.discountPrice != null ? String(p.discountPrice) : "",
          categoryId: p.categoryId || "",
          fileType: p.fileType || "",
          fileSize: p.fileSize || "",
          numberOfPages: p.numberOfPages != null ? String(p.numberOfPages) : "",
          previewUrl: p.previewUrl || "",
          features: featuresText,
          requirements: reqsText,
          whatsIncluded: incText,
          tags: tagsText,
          isActive: p.isActive ? "true" : "false",
          isFeatured: p.isFeatured ? "true" : "false",
          paymentQRId: p.paymentQR?.qrId || "",
        });

        if (p.thumbnail) {
          setExistingThumbnail(p.thumbnail);
          setThumbnailPreview(p.thumbnail);
        }
        if (p.digitalFileKey) {
          setExistingDigitalFileName(p.digitalFileKey);
        }
      })
      .catch((err) => {
        console.error("Failed to load product edit data:", err);
        toast.error("Failed to load product details");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id, router]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleThumbChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbnail(file);
    const reader = new FileReader();
    reader.onload = (e) => setThumbnailPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleClearThumbnail = () => {
    setThumbnail(null);
    setThumbnailPreview(null);
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
      Object.entries(form).forEach(([k, v]) => {
        if (v !== undefined) fd.append(k, v);
      });

      if (thumbnail) {
        fd.append("thumbnail", thumbnail);
      }
      if (digitalFile) {
        fd.append("digitalFile", digitalFile);
      }

      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        body: fd,
      });
      const data = await res.json();

      if (data.success) {
        toast.success("Product updated successfully!");
        router.push("/admin/products");
      } else {
        toast.error(data.error || "Failed to update product");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading product details...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button type="button" variant="ghost" size="icon" asChild>
            <Link href="/admin/products">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Edit Product</h1>
            <p className="text-xs text-muted-foreground">Update product specifications, files, and pricing</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting} className="bg-primary text-primary-foreground hover:bg-primary/90">
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </div>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">
              Product Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Mechanical Gear Assembly — SolidWorks"
              required
            />
          </div>
          <div>
            <Label htmlFor="shortDescription">Short Description</Label>
            <Input
              id="shortDescription"
              value={form.shortDescription}
              onChange={(e) => set("shortDescription", e.target.value)}
              placeholder="Brief one-line description"
            />
          </div>
          <div>
            <Label htmlFor="description">
              Full Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={5}
              placeholder="Detailed product description..."
              required
            />
          </div>
          <div>
            <Label>
              Category <span className="text-red-500">*</span>
            </Label>
            <Select value={form.categoryId} onValueChange={(v: string | null) => set("categoryId", v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Pricing</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="price">
              Original Price (₹) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) => set("price", e.target.value)}
              placeholder="999"
              required
            />
          </div>
          <div>
            <Label htmlFor="discountPrice">Discount Price (₹)</Label>
            <Input
              id="discountPrice"
              type="number"
              min="0"
              step="0.01"
              value={form.discountPrice}
              onChange={(e) => set("discountPrice", e.target.value)}
              placeholder="Optional"
            />
            {form.price && form.discountPrice && parseFloat(form.discountPrice) < parseFloat(form.price) && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                Save {Math.round((1 - parseFloat(form.discountPrice) / parseFloat(form.price)) * 100)}%
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* File Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Product Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="fileType">File Type</Label>
            <Input
              id="fileType"
              value={form.fileType}
              onChange={(e) => set("fileType", e.target.value)}
              placeholder=".SLDASM / .SLDPRT / .PDF"
            />
          </div>
          <div>
            <Label htmlFor="fileSize">File Size</Label>
            <Input
              id="fileSize"
              value={form.fileSize}
              onChange={(e) => set("fileSize", e.target.value)}
              placeholder="45 MB"
            />
          </div>
          <div>
            <Label htmlFor="numberOfPages">Number of Pages</Label>
            <Input
              id="numberOfPages"
              type="number"
              value={form.numberOfPages}
              onChange={(e) => set("numberOfPages", e.target.value)}
              placeholder="Optional"
            />
          </div>
          <div>
            <Label htmlFor="previewUrl">Preview URL</Label>
            <Input
              id="previewUrl"
              type="url"
              value={form.previewUrl}
              onChange={(e) => set("previewUrl", e.target.value)}
              placeholder="https://..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Specifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Specifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="features">Features (one per line)</Label>
            <Textarea
              id="features"
              value={form.features}
              onChange={(e) => set("features", e.target.value)}
              rows={3}
              placeholder="Enter each feature on a new line..."
            />
          </div>
          <div>
            <Label htmlFor="requirements">Requirements (one per line)</Label>
            <Textarea
              id="requirements"
              value={form.requirements}
              onChange={(e) => set("requirements", e.target.value)}
              rows={3}
              placeholder="Enter each requirement on a new line..."
            />
          </div>
          <div>
            <Label htmlFor="whatsIncluded">What&apos;s Included (one per line)</Label>
            <Textarea
              id="whatsIncluded"
              value={form.whatsIncluded}
              onChange={(e) => set("whatsIncluded", e.target.value)}
              rows={3}
              placeholder="Enter each item on a new line..."
            />
          </div>
          <div>
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={form.tags}
              onChange={(e) => set("tags", e.target.value)}
              placeholder="solidworks, gear, assembly, mechanical"
            />
          </div>
        </CardContent>
      </Card>

      {/* Media */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Product Thumbnail</CardTitle>
        </CardHeader>
        <CardContent>
          {thumbnailPreview ? (
            <div className="relative w-44 h-44 rounded-lg overflow-hidden border border-border bg-muted">
              <img src={thumbnailPreview} className="w-full h-full object-contain" alt="Thumbnail" />
              <button
                type="button"
                onClick={handleClearThumbnail}
                className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow hover:opacity-90"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-44 h-44 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors">
              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
              <span className="text-xs font-medium text-muted-foreground">Upload New Thumbnail</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleThumbChange} />
            </label>
          )}
          {thumbnail && (
            <p className="text-xs text-primary mt-2">New file selected: {thumbnail.name}</p>
          )}
        </CardContent>
      </Card>

      {/* Digital File */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Digital Product File</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-800 dark:text-amber-300">
            🔒 This file will ONLY be accessible to customers who purchase and get their payment approved. It is stored securely outside the public directory.
          </div>
          {existingDigitalFileName && !digitalFile && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted p-2.5 rounded-md border border-border">
              <span className="font-semibold text-foreground">Current File:</span> {existingDigitalFileName}
            </div>
          )}
          <label className="flex items-center gap-3 cursor-pointer border border-border rounded-lg p-4 hover:bg-muted transition-colors">
            <Upload className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="text-sm font-medium text-foreground">
                {digitalFile ? digitalFile.name : existingDigitalFileName ? "Replace current digital file" : "Upload digital file"}
              </div>
              <div className="text-xs text-muted-foreground">ZIP, PDF, SLDASM, WBPJ, etc. (Leave untouched to keep current file)</div>
            </div>
            <input type="file" className="hidden" onChange={(e) => setDigitalFile(e.target.files?.[0] || null)} />
          </label>
        </CardContent>
      </Card>

      {/* Payment QR */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Payment QR Code</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={form.paymentQRId} onValueChange={(v: string | null) => set("paymentQRId", v ?? "")}>
            <SelectTrigger>
              <SelectValue placeholder="Select payment QR" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              {qrs.map((q) => (
                <SelectItem key={q.id} value={q.id}>
                  {q.name} — {q.upiId}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-2">
            The QR code shown to customers during payment for this product.
          </p>
        </CardContent>
      </Card>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-foreground">Active</div>
              <div className="text-xs text-muted-foreground">Show this product in the store</div>
            </div>
            <Switch
              checked={form.isActive === "true"}
              onCheckedChange={(v) => set("isActive", v ? "true" : "false")}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-foreground">Featured</div>
              <div className="text-xs text-muted-foreground">Show on home page featured section</div>
            </div>
            <Switch
              checked={form.isFeatured === "true"}
              onCheckedChange={(v) => set("isFeatured", v ? "true" : "false")}
            />
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
