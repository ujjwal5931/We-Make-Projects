"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { Loader2, Lock, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Admin password change state
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => {
        setSettings(d.settings || {});
        setLoading(false);
      });
  }, []);

  const set = (k: string, v: string) => setSettings((s) => ({ ...s, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if ((await res.json()).success) toast.success("Settings saved!");
      else toast.error("Failed to save");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwords.currentPassword) {
      toast.error("Please enter your current admin password");
      return;
    }
    if (passwords.newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    setChangingPassword(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwords),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Admin password changed successfully!");
        setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        toast.error(data.error || "Failed to update password");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) return <div className="text-center py-20 text-slate-400">Loading settings...</div>;

  const fields = [
    { key: "store_name", label: "Store Name", type: "text" },
    { key: "contact_email", label: "Contact Email", type: "email" },
    { key: "support_phone", label: "Support Phone / WhatsApp", type: "text" },
    { key: "currency", label: "Currency Code", type: "text" },
    { key: "store_description", label: "Store Tagline / Description", type: "textarea" },
    { key: "max_screenshot_size_mb", label: "Max Screenshot Size (MB)", type: "number" },
  ];

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Store Settings</h1>
          <p className="text-slate-500 text-sm mt-1">Configure marketplace parameters and operational settings</p>
        </div>
        <Link
          href="/admin/security"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors"
        >
          <ShieldCheck className="h-4 w-4 text-blue-600" />
          Security & Password
          <ArrowRight className="h-3.5 w-3.5 ml-0.5" />
        </Link>
      </div>

      {/* ── Admin Security & Password ───────────────────────────────── */}
      <form onSubmit={handleChangePassword}>
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lock className="h-4 w-4 text-amber-600" />
              Change Admin Password
            </CardTitle>
            <CardDescription>
              Update your administrator login password. Minimum 8 characters required.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Current Password</Label>
              <Input
                type="password"
                value={passwords.currentPassword}
                onChange={(e) => setPasswords((p) => ({ ...p, currentPassword: e.target.value }))}
                placeholder="Enter current admin password"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>New Password</Label>
                <Input
                  type="password"
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords((p) => ({ ...p, newPassword: e.target.value }))}
                  placeholder="At least 8 characters"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Confirm New Password</Label>
                <Input
                  type="password"
                  value={passwords.confirmPassword}
                  onChange={(e) => setPasswords((p) => ({ ...p, confirmPassword: e.target.value }))}
                  placeholder="Re-enter new password"
                  className="mt-1"
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={changingPassword}
              variant="outline"
              className="border-slate-300 hover:bg-slate-100 text-slate-800 mt-2"
            >
              {changingPassword ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating Password...
                </>
              ) : (
                "Update Admin Password"
              )}
            </Button>
          </CardContent>
        </Card>
      </form>

      {/* ── General Store Settings ──────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Store Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {fields.map((f) => (
            <div key={f.key}>
              <Label className="mb-1 block">{f.label}</Label>
              {f.type === "textarea" ? (
                <Textarea value={settings[f.key] || ""} onChange={(e) => set(f.key, e.target.value)} rows={3} />
              ) : (
                <Input type={f.type} value={settings[f.key] || ""} onChange={(e) => set(f.key, e.target.value)} />
              )}
            </div>
          ))}
          <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 mt-2">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Store Settings"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
