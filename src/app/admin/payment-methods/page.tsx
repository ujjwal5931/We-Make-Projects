"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Plus, QrCode, Pencil, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminPaymentMethodsPage() {
  const [qrs, setQrs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", upiId: "", accountName: "" });
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetch_ = async () => {
    const res = await fetch("/api/admin/payment-methods");
    const data = await res.json();
    setQrs(data.qrs || []);
    setLoading(false);
  };

  useEffect(() => { fetch_(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.upiId || !form.accountName) { toast.error("All fields required"); return; }
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (editing) fd.append("id", editing.id);
      if (qrFile) fd.append("qrImage", qrFile);
      const res = await fetch("/api/admin/payment-methods", { method: editing ? "PATCH" : "POST", body: fd });
      const data = await res.json();
      if (data.success || data.qr) { toast.success(editing ? "Updated!" : "Created!"); setShowForm(false); setEditing(null); setForm({ name: "", upiId: "", accountName: "" }); setQrFile(null); fetch_(); }
      else toast.error(data.error || "Failed");
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this payment method?")) return;
    const res = await fetch(`/api/admin/payment-methods?id=${id}`, { method: "DELETE" });
    if ((await res.json()).success) { toast.success("Deleted"); fetch_(); }
    else toast.error("Failed to delete");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Payment Methods</h1>
        <Button onClick={() => { setEditing(null); setForm({ name: "", upiId: "", accountName: "" }); setShowForm(true); }} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" /> Add Payment QR
        </Button>
      </div>

      {showForm && (
        <Card className="border-border bg-card">
          <CardContent className="pt-5">
            <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
              <h3 className="font-semibold text-foreground">{editing ? "Edit Payment Method" : "New Payment QR"}</h3>
              <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. We Make Projects Main" required /></div>
              <div><Label>UPI ID *</Label><Input value={form.upiId} onChange={e => setForm(f => ({ ...f, upiId: e.target.value }))} placeholder="name@upi" required /></div>
              <div><Label>Account Name *</Label><Input value={form.accountName} onChange={e => setForm(f => ({ ...f, accountName: e.target.value }))} placeholder="Display name for customers" required /></div>
              <div>
                <Label>QR Code Image</Label>
                <label className="flex items-center gap-3 cursor-pointer border border-border rounded-lg p-3 hover:bg-muted mt-1">
                  <Upload className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{qrFile ? qrFile.name : "Upload QR image"}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={e => setQrFile(e.target.files?.[0] || null)} />
                </label>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white">{submitting ? "Saving..." : editing ? "Update" : "Create"}</Button>
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditing(null); }}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[1,2,3].map(i => <Skeleton key={i} className="h-64" />)}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {qrs.map(qr => (
            <Card key={qr.id} className={qr.isActive ? "border-border" : "border-border opacity-60"}>
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="font-semibold text-foreground">{qr.name}</div>
                    <div className="text-sm text-muted-foreground font-mono">{qr.upiId}</div>
                  </div>
                  <Badge variant={qr.isActive ? "default" : "secondary"} className={qr.isActive ? "bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300" : ""}>
                    {qr.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                {qr.qrImageUrl ? (
                  <div className="flex justify-center mb-4">
                    <Image src={qr.qrImageUrl} alt="QR" width={120} height={120} className="rounded-lg border border-border bg-white p-1" />
                  </div>
                ) : (
                  <div className="flex justify-center mb-4 h-24 items-center bg-muted rounded-lg">
                    <QrCode className="h-12 w-12 text-muted-foreground/30" />
                  </div>
                )}
                <div className="text-xs text-muted-foreground mb-4">Used by {qr._count?.productQRs || 0} products</div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setEditing(qr); setForm({ name: qr.name, upiId: qr.upiId, accountName: qr.accountName }); setShowForm(true); }}><Pencil className="h-3.5 w-3.5 mr-1" />Edit</Button>
                  <Button variant="outline" size="sm" className="text-red-400 hover:text-red-600" onClick={() => handleDelete(qr.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {qrs.length === 0 && (
            <div className="col-span-3 text-center py-20 text-muted-foreground">
              <QrCode className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No payment methods. Add your UPI QR code to start receiving payments.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
