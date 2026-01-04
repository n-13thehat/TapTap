"use client";

import { useEffect, useMemo, useState } from "react";
import { computeTodayVibe, type AstroProfile } from "@/lib/astro";

export default function VibePill() {
  const [profile, setProfile] = useState<AstroProfile | null>(null);
  const [weight, setWeight] = useState<number>(0.5);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("taptap.astro.profile");
      const w = localStorage.getItem("taptap.astro.weight");
      if (raw) setProfile(JSON.parse(raw));
      if (w) setWeight(Math.min(1, Math.max(0, Number(w))));
    } catch {}
  }, []);

  const vibe = useMemo(() => computeTodayVibe(profile, weight), [profile, weight]);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/80 hover:bg-white/10"
        aria-label="Today's Vibe"
      >
        <span className="h-2 w-2 rounded-full bg-teal-400" />
        Today: {vibe.mode}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-[260px] rounded-lg border border-white/10 bg-black/80 p-2 text-xs text-white/80">
          <div className="mb-1 text-teal-300 font-semibold">Today's Vibe: {vibe.mode}</div>
          <ul className="list-disc pl-5 space-y-1">
            {vibe.tips.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
          <div className="mt-2 text-[10px] text-white/50">Astro can be disabled in Settings.</div>
        </div>
      )}
    </div>
  );
}

