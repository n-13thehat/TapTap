"use client";
import type React from "react";
import { Suspense } from "react";
import { Zap, Activity } from "lucide-react";

import AppShell from "@/components/shell/AppShell";
import { NotificationBell } from "./NotificationBell";
import VibePill from "@/components/VibePill";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";
import { useMatrixRain } from "@/providers/MatrixRainProvider";

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { openSearch } = useGlobalSearch();
  const { mode, setMode } = useMatrixRain();

  const headerAux = (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setMode(mode === "rain" ? "galaxy" : "rain")}
        className="rounded-md p-2 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
        aria-label={`Switch to ${mode === "rain" ? "Galaxy" : "Code Rain"} mode`}
        title={`Switch to ${mode === "rain" ? "Galaxy" : "Code Rain"} mode`}
      >
        {mode === "rain" ? <Activity className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
      </button>
      <VibePill />
      <NotificationBell />
    </div>
  );

  return (
    <div className="matrix-layout">
      <div className="fixed inset-0 pointer-events-none z-0 matrix-grid opacity-10" />
      <AppShell headerAux={headerAux} onOpenSearch={openSearch}>
        {children}
      </AppShell>
      <div className="fixed inset-0 pointer-events-none z-5 matrix-scanlines" />
    </div>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black matrix-loading" />}>
      <LayoutContent>{children}</LayoutContent>
    </Suspense>
  );
}
