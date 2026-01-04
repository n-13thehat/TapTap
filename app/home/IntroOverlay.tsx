"use client";
import React, { useEffect, useState } from "react";

export default function IntroOverlay() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    try {
      const key = "zion:intro:shown";
      if (!sessionStorage.getItem(key)) {
        setShow(true);
        const t = setTimeout(() => { setShow(false); sessionStorage.setItem(key, "1"); }, 1400);
        return () => clearTimeout(t);
      }
    } catch {}
  }, []);
  if (!show) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-[60] grid place-items-center bg-black/80">
      <div className="relative h-24 w-24 animate-pulse rounded-2xl bg-[radial-gradient(circle_at_60%_30%,rgba(0,255,200,.3),transparent_60%),radial-gradient(circle_at_40%_70%,rgba(0,180,255,.25),transparent_55%)] shadow-[0_0_80px_#00ffd188]">
        <div className="absolute inset-0 animate-[spin_2s_linear_infinite] rounded-2xl border border-teal-400/30" />
      </div>
      <div className="mt-6 text-sm text-teal-200">Matrix initializing…</div>
    </div>
  );
}

