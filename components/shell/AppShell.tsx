"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  ADMIN_NAV,
  MAIN_NAV,
  type NavItem,
  type ViewerCapabilities,
} from "@/config/navigation";
import { AppShellSidebar } from "./AppShellSidebar";
import { AppShellHeader } from "./AppShellHeader";
import { AppShellMobileBar } from "./AppShellMobileBar";

export type AppShellVariant = "default" | "admin" | "dashboard" | "bare";

interface AppShellProps {
  children: React.ReactNode;
  variant?: AppShellVariant;
  /** Override the nav items entirely (defaults to MAIN_NAV or ADMIN_NAV by variant). */
  navItems?: NavItem[];
  /** Override what the brand link points at. */
  brandHref?: string;
  brandLabel?: string;
  /** Extra content rendered in the header before the user menu (e.g. notifications, vibe pill). */
  headerAux?: React.ReactNode;
  /** Handler invoked when the user clicks the search button. */
  onOpenSearch?: () => void;
}

// Routes that should never get the shell, even if a layout passes through.
const BARE_ROUTE_PREFIXES = [
  "/login",
  "/signup",
  "/onboarding",
  "/landing",
  "/featured-embed",
];

function isBareRoute(pathname: string | null, isEmbed: boolean): boolean {
  if (isEmbed) return true;
  if (!pathname) return false;
  if (pathname === "/") return true;
  return BARE_ROUTE_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

export default function AppShell({
  children,
  variant = "default",
  navItems,
  brandHref,
  brandLabel,
  headerAux,
  onOpenSearch,
}: AppShellProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isEmbed = searchParams?.get("embed") === "1";
  const { user, isAuthenticated, isCreator, isAdmin } = useAuth();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Persist collapsed state across route changes.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("taptap.shell.collapsed");
    if (stored === "1") setCollapsed(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("taptap.shell.collapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  // Close the mobile sheet on route change.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const viewer: ViewerCapabilities = useMemo(
    () => ({ isAuthenticated, isCreator, isAdmin }),
    [isAuthenticated, isCreator, isAdmin]
  );

  // Bare passthrough for landing, embed, login, etc.
  const explicitlyBare = variant === "bare" || isBareRoute(pathname, isEmbed);

  // Auto-promote to admin variant when inside /admin/* so nested layouts
  // can simply render <AppShell> as a passthrough without duplicating chrome.
  const isAdminRoute = pathname?.startsWith("/admin") ?? false;
  const effectiveVariant: AppShellVariant = explicitlyBare
    ? "bare"
    : isAdminRoute && variant !== "admin"
      ? "admin"
      : variant;

  if (effectiveVariant === "bare") {
    return <>{children}</>;
  }

  const sidebarVariant: "default" | "admin" =
    effectiveVariant === "admin" ? "admin" : "default";
  const items =
    navItems ?? (effectiveVariant === "admin" ? ADMIN_NAV : MAIN_NAV);
  const resolvedBrandHref =
    brandHref ?? (effectiveVariant === "admin" ? "/admin" : "/home");
  const resolvedBrandLabel =
    brandLabel ??
    (effectiveVariant === "admin" ? "TapTap Admin" : "TapTap Matrix");

  const userName =
    (user as any)?.name || (user as any)?.username || (user as any)?.email || null;

  return (
    <div className="flex min-h-dvh bg-black text-white">
      <AppShellSidebar
        items={items}
        viewer={viewer}
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((c) => !c)}
        variant={sidebarVariant}
        brandHref={resolvedBrandHref}
        brandLabel={resolvedBrandLabel}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <AppShellHeader
          viewer={viewer}
          userName={userName}
          variant={sidebarVariant}
          onOpenMobileNav={() => setMobileOpen(true)}
          onOpenSearch={onOpenSearch}
          auxRight={headerAux}
        />

        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">{children}</main>
      </div>

      <AppShellMobileBar
        items={items}
        viewer={viewer}
        variant={sidebarVariant}
        open={mobileOpen}
        onOpenChange={setMobileOpen}
      />
    </div>
  );
}
