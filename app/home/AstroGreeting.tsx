"use client";
import React, { useEffect, useState } from "react";

type ProfilePayload = { displayName: string; mood: string; greeting: string; tagline?: string };

export default function AstroGreeting() {
  const [p, setP] = useState<ProfilePayload | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/user/profile", { cache: "no-store" });
        if (!r.ok) throw new Error(String(r.status));
        const j = (await r.json()) as ProfilePayload;
        if (!cancelled) setP(j);
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, []);
  if (!p) return null;
  const tone = toneForMood(p.mood);
  return (
    <div className={`mb-4 rounded-2xl border px-4 py-3 text-sm ${tone.border} ${tone.bg}`}>
      <div className="font-semibold text-white/90">{p.greeting}</div>
      {p.tagline ? <div className="text-white/60">{p.tagline}</div> : null}
    </div>
  );
}

function toneForMood(m: string) {
  switch (m) {
    case "flow": return { bg: "bg-cyan-500/10", border: "border-cyan-400/30" };
    case "focus": return { bg: "bg-indigo-500/10", border: "border-indigo-400/30" };
    case "fire": return { bg: "bg-rose-500/10", border: "border-rose-400/30" };
    case "earth": return { bg: "bg-emerald-500/10", border: "border-emerald-400/30" };
    case "air": return { bg: "bg-sky-500/10", border: "border-sky-400/30" };
    case "water": return { bg: "bg-blue-500/10", border: "border-blue-400/30" };
    default: return { bg: "bg-white/5", border: "border-white/10" };
  }
}

