"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, Bell, LogIn, User as UserIcon } from "lucide-react";
import { signOut } from "next-auth/react";
import type { ViewerCapabilities } from "@/config/navigation";

interface AppShellHeaderProps {
  viewer: ViewerCapabilities;
  userName?: string | null;
  variant?: "default" | "admin";
  onOpenMobileNav: () => void;
  onOpenSearch?: () => void;
  routeLabel?: string;
  /** Optional extra content inserted before the user menu. */
  auxRight?: React.ReactNode;
}

const ROUTE_LABELS: Record<string, string> = {
  "/home": "Home",
  "/social": "Social",
  "/library": "Library",
  "/trap": "The Trap",
  "/art": "Visual Art",
  "/creator": "Creator Hub",
  "/upload": "Upload",
  "/posterize": "Posterize",
  "/stemstation": "STEMSTATION",
  "/battles": "Battles",
  "/surf": "Surf",
  "/live": "Live",
  "/dm": "Messages",
  "/marketplace": "Marketplace",
  "/explore": "Explore",
  "/astro": "Astro",
  "/ai": "AI",
  "/mainframe": "Mainframe",
  "/wallet": "Wallet",
  "/dashboard": "Dashboard",
  "/settings": "Settings",
  "/admin": "Admin",
  "/admin/encoder": "Encoder",
};

function deriveRouteLabel(pathname: string | null): string {
  if (!pathname) return "";
  if (ROUTE_LABELS[pathname]) return ROUTE_LABELS[pathname];
  // Match longest prefix
  const prefixes = Object.keys(ROUTE_LABELS).sort((a, b) => b.length - a.length);
  for (const p of prefixes) {
    if (pathname.startsWith(p + "/")) return ROUTE_LABELS[p];
  }
  return "";
}

export function AppShellHeader({
  viewer,
  userName,
  variant = "default",
  onOpenMobileNav,
  onOpenSearch,
  routeLabel,
  auxRight,
}: AppShellHeaderProps) {
  const pathname = usePathname();
  const label = routeLabel ?? deriveRouteLabel(pathname);
  const accentText = variant === "admin" ? "text-red-300" : "text-teal-300";
  const borderColor = variant === "admin" ? "border-red-500/20" : "border-white/10";

  return (
    <header
      className={`sticky top-0 z-30 flex h-14 items-center gap-3 border-b ${borderColor} bg-black/70 px-3 backdrop-blur-md md:px-5`}
    >
      <button
        type="button"
        onClick={onOpenMobileNav}
        className="md:hidden rounded-md p-2 text-white/70 hover:bg-white/10 hover:text-white"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {label && (
        <h1 className={`text-sm font-semibold tracking-wide ${accentText} truncate`}>
          {label}
        </h1>
      )}

      <div className="ml-auto flex items-center gap-2">
        {onOpenSearch && (
          <button
            type="button"
            onClick={onOpenSearch}
            className="hidden sm:inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60 hover:bg-white/10 hover:text-white transition-colors"
            aria-label="Open search"
          >
            <Search className="h-3.5 w-3.5" />
            <span>Search</span>
            <kbd className="ml-2 rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-mono">
              ⌘K
            </kbd>
          </button>
        )}

        {auxRight}

        {viewer.isAuthenticated && !auxRight && (
          <Link
            href="/notifications"
            className="rounded-md p-2 text-white/70 hover:bg-white/10 hover:text-white"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
          </Link>
        )}

        {viewer.isAuthenticated ? (
          <div className="relative group">
            <button
              type="button"
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-white/80 hover:bg-white/10 hover:text-white"
              aria-label="User menu"
            >
              <UserIcon className="h-4 w-4" />
              <span className="hidden sm:inline truncate max-w-[120px]">
                {userName || "Account"}
              </span>
            </button>
            <div className="absolute right-0 top-full mt-1 hidden group-hover:block group-focus-within:block min-w-[160px] rounded-md border border-white/10 bg-black/95 p-1 shadow-lg backdrop-blur-md">
              <Link href="/dashboard" className="block rounded px-3 py-2 text-xs text-white/80 hover:bg-white/10">Dashboard</Link>
              <Link href="/settings" className="block rounded px-3 py-2 text-xs text-white/80 hover:bg-white/10">Settings</Link>
              {viewer.isAdmin && (
                <Link href="/admin" className="block rounded px-3 py-2 text-xs text-red-300 hover:bg-red-500/10">Admin</Link>
              )}
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="block w-full rounded px-3 py-2 text-left text-xs text-white/60 hover:bg-white/10 hover:text-white"
              >
                Sign out
              </button>
            </div>
          </div>
        ) : (
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-md bg-teal-500/20 px-3 py-1.5 text-xs font-semibold text-teal-200 ring-1 ring-teal-400/30 hover:bg-teal-500/30 transition-colors"
          >
            <LogIn className="h-3.5 w-3.5" /> Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
