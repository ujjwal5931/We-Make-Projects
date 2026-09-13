"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, Lock, ShieldCheck, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    billingFullName: "",
    billingAddressLine1: "",
    billingAddressLine2: "",
    billingCity: "",
    billingState: "",
    billingPostalCode: "",
    billingCountry: "India",
  });

  // Password change state
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    fetch("/api/account/profile")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          setUser(d.user);
          setForm({
            name: d.user.name || "",
            phone: d.user.phone || "",
            billingFullName: d.user.billingAddress?.fullName || "",
            billingAddressLine1: d.user.billingAddress?.addressLine1 || "",
            billingAddressLine2: d.user.billingAddress?.addressLine2 || "",
            billingCity: d.user.billingAddress?.city || "",
            billingState: d.user.billingAddress?.state || "",
            billingPostalCode: d.user.billingAddress?.postalCode || "",
            billingCountry: d.user.billingAddress?.country || "India",
          });
        }
        setLoading(false);
      });
  }, []);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Profile updated successfully!");
      } else {
        toast.error(data.error || "Failed to save profile");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwords.currentPassword) {
      toast.error("Please enter your current password");
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
        toast.success("Password updated successfully!");
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

  if (loading) return <div className="text-center py-12 text-slate-400">Loading...</div>;

  if (!user) {
    return (
      <div className="text-center py-16 bg-card text-card-foreground rounded-xl border border-border p-8 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground mb-2">Session Expired</h2>
        <p className="text-muted-foreground text-sm mb-6">Please log in to view and manage your profile.</p>
        <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
          <a href="/login?from=/account/profile">Log In to Your Account</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Profile & Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your personal details, billing address, and account security</p>
      </div>

      {/* ── Personal Info ────────────────────────────────────────────── */}
      <form onSubmit={handleSaveProfile} className="space-y-8">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-foreground">
              <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>User ID (read-only)</Label>
                <Input value={user?.userId || ""} readOnly className="bg-muted text-foreground font-mono mt-1" />
              </div>
              <div>
                <Label>Email Address (read-only)</Label>
                <Input value={user?.email || ""} readOnly className="bg-muted text-foreground mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Full Name</Label>
                <Input value={form.name} onChange={(e) => set("name", e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Phone Number</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  placeholder="+91 9999999999"
                  className="mt-1"
                />
              </div>
            </div>
            <div className="text-xs text-slate-400">
              Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN") : "—"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Default Billing Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Full Name</Label>
              <Input
                value={form.billingFullName}
                onChange={(e) => set("billingFullName", e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Address Line 1</Label>
              <Input
                value={form.billingAddressLine1}
                onChange={(e) => set("billingAddressLine1", e.target.value)}
                placeholder="House / Flat No., Street"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Address Line 2 (Optional)</Label>
              <Input
                value={form.billingAddressLine2}
                onChange={(e) => set("billingAddressLine2", e.target.value)}
                placeholder="Area, Landmark"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>City</Label>
                <Input value={form.billingCity} onChange={(e) => set("billingCity", e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>State</Label>
                <Input value={form.billingState} onChange={(e) => set("billingState", e.target.value)} className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Postal Code</Label>
                <Input
                  value={form.billingPostalCode}
                  onChange={(e) => set("billingPostalCode", e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Country</Label>
                <Input
                  value={form.billingCountry}
                  onChange={(e) => set("billingCountry", e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving Profile...
            </>
          ) : (
            "Save Profile & Address"
          )}
        </Button>
      </form>

      {/* ── Change Password Section ───────────────────────────────────── */}
      <form onSubmit={handleChangePassword}>
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-foreground">
              <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              Change Password
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Ensure your account is using a long, random password to stay secure. Minimum 8 characters.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Current Password</Label>
              <Input
                type="password"
                value={passwords.currentPassword}
                onChange={(e) => setPasswords((p) => ({ ...p, currentPassword: e.target.value }))}
                placeholder="Enter your existing password"
                className="mt-1 max-w-md"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
              <div>
                <Label>New Password (min. 8 characters)</Label>
                <Input
                  type="password"
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords((p) => ({ ...p, newPassword: e.target.value }))}
                  placeholder="Enter new password"
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
              className="border-border hover:bg-muted text-foreground mt-2"
            >
              {changingPassword ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating Password...
                </>
              ) : (
                "Update Password"
              )}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
