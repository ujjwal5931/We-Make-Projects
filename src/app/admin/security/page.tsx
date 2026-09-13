"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  ShieldCheck, Lock, KeyRound, Eye, EyeOff, Loader2,
  CheckCircle2, AlertCircle, UserCheck
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminSecurityPage() {
  const { data: session } = useSession();
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage("");

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

    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwords),
      });
      const data = await res.json();

      if (data.success) {
        setSuccessMessage("Admin password updated successfully! Please use this new password on your next login.");
        toast.success("Admin password changed successfully!");
        setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        toast.error(data.error || "Failed to update password");
      }
    } catch {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <ShieldCheck className="h-7 w-7 text-blue-600" />
          Admin Security & Password
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage administrator account credentials and access security for We Make Projects.
        </p>
      </div>

      {/* Admin Session Info Card */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
            <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            Authenticated Administrator Profile
          </CardTitle>
          <CardDescription>
            You are logged into the control panel with full administrative privileges.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1 text-sm">
            <div className="bg-muted rounded-lg p-3 border border-border">
              <span className="text-xs text-muted-foreground font-medium block">Username / ID</span>
              <span className="font-semibold text-foreground font-mono text-xs">
                {(session?.user as any)?.userId || session?.user?.name || "admin"}
              </span>
            </div>
            <div className="bg-muted rounded-lg p-3 border border-border">
              <span className="text-xs text-muted-foreground font-medium block">Role</span>
              <span className="inline-flex items-center px-2 py-0.5 mt-0.5 rounded text-xs font-semibold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300">
                {(session?.user as any)?.role || "ADMIN"}
              </span>
            </div>
            <div className="bg-muted rounded-lg p-3 border border-border">
              <span className="text-xs text-muted-foreground font-medium block">Email</span>
              <span className="font-semibold text-foreground text-xs">
                {session?.user?.email || "admin@wemakeprojects.com"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Success Alert if changed */}
      {successMessage && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-start gap-3 text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-sm">Success</p>
            <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Change Password Card */}
      <Card className="border-border shadow-sm bg-card">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
            <KeyRound className="h-4 w-4 text-amber-600" />
            Change Admin Password
          </CardTitle>
          <CardDescription>
            Enter your current password followed by your desired new password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
            {/* Current Password */}
            <div>
              <Label htmlFor="adminCurrentPassword">Current Password</Label>
              <div className="relative mt-1">
                <Input
                  id="adminCurrentPassword"
                  type={showCurrent ? "text" : "password"}
                  value={passwords.currentPassword}
                  onChange={(e) => setPasswords((p) => ({ ...p, currentPassword: e.target.value }))}
                  placeholder="Enter your current admin password"
                  className="pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <Label htmlFor="adminNewPassword">New Password</Label>
              <div className="relative mt-1">
                <Input
                  id="adminNewPassword"
                  type={showNew ? "text" : "password"}
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords((p) => ({ ...p, newPassword: e.target.value }))}
                  placeholder="Minimum 8 characters"
                  className="pr-10"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Must be at least 8 characters long.
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <Label htmlFor="adminConfirmPassword">Confirm New Password</Label>
              <div className="relative mt-1">
                <Input
                  id="adminConfirmPassword"
                  type={showConfirm ? "text" : "password"}
                  value={passwords.confirmPassword}
                  onChange={(e) => setPasswords((p) => ({ ...p, confirmPassword: e.target.value }))}
                  placeholder="Re-enter your new password"
                  className="pr-10"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwords.confirmPassword && passwords.newPassword !== passwords.confirmPassword && (
                <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> Passwords do not match
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white min-w-[180px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating Password...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Update Admin Password
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Security Best Practices */}
      <Card className="border-border bg-muted/40">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground text-sm">Security Best Practices</p>
              <p>• Avoid using predictable passwords or sharing administrator credentials.</p>
              <p>• All password updates are hashed using industry-standard bcrypt encryption.</p>
              <p>• In case you ever get locked out, credentials can be re-seeded from the terminal via <code className="bg-muted text-foreground px-1 py-0.5 rounded text-[11px] border border-border">npx prisma db seed</code>.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
