"use client";
import React, { useEffect, useState } from "react";

export default function WalletSnapshot() {
  const [tap, setTap] = useState<number | null>(null);
  const [addr, setAddr] = useState<string | null>(null);
  useEffect(() => {
    let done = false;
    (async () => {
      try {
        const r = await fetch("/api/wallet/snapshot", { cache: "no-store" });
        if (!r.ok) throw new Error("snapshot failed");
        const j = await r.json();
        if (!done) { setTap(Number(j.tap || 0)); setAddr(j.solanaAddress || null); }
      } catch { /* ignore */ }
    })();
    return () => { done = true; };
  }, []);
  if (tap == null && !addr) return null;
  return (
    <div className="mb-4 grid grid-cols-2 gap-2 text-xs md:grid-cols-3">
      <div className="rounded-xl border border-teal-400/30 bg-teal-500/10 p-3">
        <div className="text-white/60">TapCoin</div>
        <div className="text-xl font-bold text-white">{tap ?? 0}</div>
      </div>
      <div className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 p-3 col-span-1 md:col-span-2">
        <div className="text-white/60">Solana</div>
        <div className="truncate text-white/80">{addr ?? "No wallet linked"}</div>
      </div>
    </div>
  );
}

