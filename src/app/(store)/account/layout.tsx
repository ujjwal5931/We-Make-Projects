"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, ShoppingBag, LogOut, LayoutDashboard } from "lucide-react";

const navItems = [
  { href: "/account", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/account/orders", label: "My Orders", icon: ShoppingBag },
  { href: "/account/profile", label: "Profile", icon: User },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-muted/40 text-foreground transition-colors duration-150">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <aside className="md:w-56 flex-shrink-0">
            <div className="bg-card text-card-foreground rounded-xl border border-border p-4 shadow-sm">
              <div className="mb-4 p-3 bg-muted/70 rounded-lg">
                <div className="font-semibold text-foreground text-sm truncate">{session?.user?.name}</div>
                <div className="text-xs text-muted-foreground truncate">{session?.user?.email}</div>
              </div>
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                        active
                          ? "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 w-full text-left transition-colors"
                >
                  <LogOut className="h-4 w-4" /> Sign Out
                </button>
              </nav>
            </div>
          </aside>
          {/* Main */}
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
