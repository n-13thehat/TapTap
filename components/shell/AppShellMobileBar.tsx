"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal, X } from "lucide-react";
import {
  CATEGORY_LABELS,
  filterNav,
  groupByCategory,
  MAIN_TABS,
  type NavItem,
  type ViewerCapabilities,
} from "@/config/navigation";

interface AppShellMobileBarProps {
  items: NavItem[];
  viewer: ViewerCapabilities;
  variant?: "default" | "admin";
  open: boolean;
  onOpenChange: (next: boolean) => void;
}

export function AppShellMobileBar({
  items,
  viewer,
  variant = "default",
  open,
  onOpenChange,
}: AppShellMobileBarProps) {
  const pathname = usePathname();
  const visible = filterNav(items, viewer);
  const grouped = groupByCategory(visible);
  const tabs = filterNav(MAIN_TABS, viewer).slice(0, 4);

  const accent = variant === "admin" ? "text-red-300" : "text-teal-300";
  const activeBg = variant === "admin" ? "bg-red-500/15" : "bg-teal-500/15";

  return (
    <>
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 flex items-stretch border-t border-white/10 bg-black/90 backdrop-blur-md pb-[env(safe-area-inset-bottom)]"
        aria-label="Bottom navigation"
      >
        {tabs.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname?.startsWith(item.href + "/"));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] ${
                isActive ? `${accent} ${activeBg}` : "text-white/60"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => onOpenChange(true)}
          className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] text-white/60"
          aria-label="Open more navigation"
        >
          <MoreHorizontal className="h-5 w-5" />
          <span>More</span>
        </button>
      </nav>

      {open && (
        <div
          className="md:hidden fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <h2 className={`text-sm font-semibold ${accent}`}>Navigation</h2>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-md p-2 text-white/70 hover:bg-white/10 hover:text-white"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-4">
            {grouped.map(({ category, items: catItems }) => (
              <div key={category} className="mb-5 last:mb-0">
                <h3 className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-wider text-white/40">
                  {CATEGORY_LABELS[category]}
                </h3>
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
                          onClick={() => onOpenChange(false)}
                          className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${
                            isActive
                              ? `${activeBg} ${accent}`
                              : "text-white/80 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          <span className="truncate">{item.label}</span>
                          {item.badge && (
                            <span className={`ml-auto rounded-full bg-teal-500/20 ${accent} px-1.5 py-0.5 text-[9px] font-bold tracking-wider`}>
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
