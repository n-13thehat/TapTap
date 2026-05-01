"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, Terminal } from "lucide-react";
import {
  CATEGORY_LABELS,
  filterNav,
  groupByCategory,
  type NavItem,
  type ViewerCapabilities,
} from "@/config/navigation";

interface AppShellSidebarProps {
  items: NavItem[];
  viewer: ViewerCapabilities;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  variant?: "default" | "admin";
  brandLabel?: string;
  brandHref?: string;
}

export function AppShellSidebar({
  items,
  viewer,
  collapsed,
  onToggleCollapsed,
  variant = "default",
  brandLabel = "TapTap Matrix",
  brandHref = "/home",
}: AppShellSidebarProps) {
  const pathname = usePathname();
  const visible = filterNav(items, viewer);
  const groups = groupByCategory(visible);

  const accent = variant === "admin" ? "red" : "teal";
  const ringColor = accent === "red" ? "ring-red-400/30" : "ring-teal-400/30";
  const tintBg = accent === "red" ? "bg-red-500/20" : "bg-teal-500/20";
  const tintText = accent === "red" ? "text-red-300" : "text-teal-300";
  const activeBg = accent === "red" ? "bg-red-500/15 text-red-200" : "bg-teal-500/15 text-teal-200";
  const borderColor = accent === "red" ? "border-red-500/20" : "border-white/10";

  return (
    <aside
      className={`hidden md:flex sticky top-0 h-dvh flex-col border-r ${borderColor} bg-black/70 backdrop-blur-md transition-[width] duration-200 ${
        collapsed ? "w-16" : "w-64"
      }`}
      aria-label="Primary navigation"
    >
      <div className={`flex items-center gap-2 border-b ${borderColor} px-3 py-3`}>
        <Link href={brandHref} className="flex items-center gap-2 min-w-0">
          <div className={`h-8 w-8 shrink-0 rounded-md ${tintBg} ring-1 ${ringColor} flex items-center justify-center`}>
            <Terminal className={`h-4 w-4 ${tintText}`} />
          </div>
          {!collapsed && (
            <span className={`truncate font-semibold ${tintText}`}>{brandLabel}</span>
          )}
        </Link>
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="ml-auto rounded-md p-1.5 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {groups.map(({ category, items: catItems }) => (
          <div key={category} className="mb-4 last:mb-0">
            {!collapsed && (
              <h3 className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-wider text-white/40">
                {CATEGORY_LABELS[category]}
              </h3>
            )}
            <ul className="space-y-0.5">
              {catItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname?.startsWith(item.href + "/"));
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      className={`group flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors ${
                        isActive
                          ? activeBg
                          : "text-white/70 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {!collapsed && (
                        <>
                          <span className="truncate">{item.label}</span>
                          {item.badge && (
                            <span className={`ml-auto rounded-full ${tintBg} ${tintText} px-1.5 py-0.5 text-[9px] font-bold tracking-wider`}>
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
