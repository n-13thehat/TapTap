"use client";
import type React from "react";
import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { Search, Command, Zap, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import Sidebar from "./Sidebar";
import { NotificationBell } from "./NotificationBell";
import VibePill from "@/components/VibePill";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";
import { useMatrixRain } from "@/providers/MatrixRainProvider";

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const search = useSearchParams();
  const isEmbed = (search?.get("embed") ?? "") === "1";
  const onHome = pathname === "/home";
  const showGlobalSidebar = !onHome && !isEmbed;

  const { openSearch } = useGlobalSearch();

  const { mode, setMode } = useMatrixRain();

  const label = pathname === "/" ? "Home" : pathname?.slice(1) || "";

  return (
    <div className="flex h-dvh min-h-screen matrix-layout">
      {/* Matrix Grid Overlay */}
      <div className="fixed inset-0 pointer-events-none z-0 matrix-grid opacity-10" />

      {/* Animated Sidebar */}
      <AnimatePresence>
        {showGlobalSidebar && (
          <motion.div
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="matrix-sidebar-container"
          >
            <Sidebar />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col relative z-10">
        {/* Enhanced Matrix Header */}
        <motion.header
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="sticky top-0 z-30 matrix-header"
        >
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
            <div className="flex items-center gap-3">
              <Link href="/" className="inline-flex items-center gap-3 group">
                <motion.div
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative h-8 w-8 overflow-hidden rounded-xl matrix-logo-container"
                >
                  <div className="absolute inset-0 matrix-logo-glow" />
                  <Image
                    src="/branding/tap-logo.png"
                    alt="TapTap"
                    width={32}
                    height={32}
                    className="h-full w-full object-contain relative z-10"
                    priority
                  />
                </motion.div>
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="hidden font-mono text-sm font-bold uppercase tracking-[0.2em] matrix-title sm:inline"
                >
                  {label}
                </motion.span>
              </Link>
            </div>

            <div className="flex items-center gap-3">
              {/* Background Mode Toggle */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setMode(mode === "rain" ? "galaxy" : "rain")}
                className="matrix-mode-toggle"
                title={`Switch to ${mode === "rain" ? "Galaxy" : "Code Rain"} mode`}
              >
                {mode === "rain" ? (
                  <Activity className="h-4 w-4" />
                ) : (
                  <Zap className="h-4 w-4" />
                )}
              </motion.button>

              {/* Enhanced Search Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={openSearch}
                className="matrix-search-button"
                title="Search (Cmd+K)"
              >
                <Search className="h-4 w-4" />
                <span className="hidden sm:inline">Search</span>
                <div className="ml-2 hidden items-center gap-1 text-xs matrix-kbd sm:flex">
                  <Command className="h-3 w-3" />
                  <span>K</span>
                </div>
              </motion.button>

              <VibePill />
              <NotificationBell />
            </div>
          </div>
        </motion.header>

        {/* Enhanced Main Content */}
        <motion.main
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="min-w-0 flex-1 overflow-y-auto matrix-main"
        >
          <div className="matrix-content-wrapper">
            {children}
          </div>
        </motion.main>
      </div>

      {/* Matrix Scan Lines Effect */}
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
