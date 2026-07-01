"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, GraduationCap, LayoutDashboard, LogOut, Shield, UserRound } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

const baseNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/plans", label: "Plans", icon: GraduationCap },
  { href: "/profile", label: "Profile", icon: UserRound }
];

const adminNavItem = { href: "/admin", label: "Admin", icon: Shield };

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isMarketing = pathname === "/" || pathname === "/login" || pathname === "/signup";
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (isMarketing) return;
    api<{ role: string }>("/auth/me")
      .then((user) => setIsAdmin(user.role === "ADMIN"))
      .catch(() => setIsAdmin(false));
  }, [isMarketing]);

  const nav = isAdmin ? [...baseNav, adminNavItem] : baseNav;

  async function logout() {
    await api("/auth/logout", { method: "POST" }).catch(() => undefined);
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 font-bold text-ink">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-white">
              <BookOpen size={18} />
            </span>
            AeroPath Academy
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {nav.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted hover:bg-surface hover:text-ink",
                    pathname.startsWith(item.href) && "bg-surface text-ink"
                  )}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-2">
            {isMarketing ? (
              <>
                <Link className="hidden rounded-md px-3 py-2 text-sm font-semibold text-ink hover:bg-surface sm:inline-flex" href="/login">
                  Login
                </Link>
                <Link className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-primaryHover" href="/signup">
                  Get Started
                </Link>
              </>
            ) : (
              <button className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-muted hover:bg-surface" onClick={logout}>
                <LogOut size={16} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}
          </div>
        </div>
        {!isMarketing && (
          <nav className="flex gap-1 overflow-x-auto border-t border-line px-3 py-2 md:hidden">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className="whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-muted hover:bg-surface">
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </header>
      {children}
    </div>
  );
}
