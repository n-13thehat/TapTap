"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { computeTodayVibe, type AstroProfile } from "@/lib/astro";
import { recordEvent } from "@/lib/events";

export default function AstroPage() {
  const [enabled, setEnabled] = useState<boolean>(true);
  const [profile, setProfile] = useState<AstroProfile>({});
  const [weight, setWeight] = useState<number>(0.5);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("taptap.astro.profile");
      const w = localStorage.getItem("taptap.astro.weight");
      if (raw) setProfile(JSON.parse(raw));
      if (w) setWeight(Math.min(1, Math.max(0, Number(w))));
      const en = localStorage.getItem("taptap.astro.enabled");
      setEnabled(en === null ? true : en === "1");
    } catch {}
  }, []);

  const vibe = useMemo(() => computeTodayVibe(enabled ? profile : null, weight), [enabled, profile, weight]);

  const save = useCallback(async () => {
    setSaving(true);
    try {
      localStorage.setItem("taptap.astro.profile", JSON.stringify(profile));
      localStorage.setItem("taptap.astro.weight", String(weight));
      localStorage.setItem("taptap.astro.enabled", enabled ? "1" : "0");
      await fetch("/api/astro/profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(profile) });
      recordEvent("ASTRO_PROFILE_SET", { enabled });
    } finally { setSaving(false); }
  }, [enabled, profile, weight]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-black to-[#031a1a] text-white">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-black/70 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-md bg-teal-500/20 ring-1 ring-teal-400/30" />
            <div className="text-lg font-semibold text-teal-300">Astro Vibes</div>
          </div>
          <Link href="/settings" className="text-sm text-white/80 underline">Settings</Link>
        </div>
      </header>
      <section className="mx-auto max-w-6xl p-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="mb-2 text-sm font-semibold text-white">Opt-in</div>
          <p className="text-xs text-white/70 mb-2">Astro uses your birth date/time and city to suggest subtle daily vibes. Data stays client-side unless you choose to sync. You can disable at any time.</p>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={enabled} onChange={(e)=>setEnabled(e.target.checked)} />
            Enable Astro personalization
          </label>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="mb-2 text-sm font-semibold text-white">Onboarding</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <label className="flex flex-col gap-1">Birth date<input className="rounded bg-black/40 border border-white/10 px-2 py-1" type="date" value={profile.birthDate || ""} onChange={(e)=>setProfile(p=>({ ...p, birthDate: e.target.value }))} /></label>
            <label className="flex flex-col gap-1">Time (optional)<input className="rounded bg-black/40 border border-white/10 px-2 py-1" placeholder="HH:MM" value={profile.birthTime || ""} onChange={(e)=>setProfile(p=>({ ...p, birthTime: e.target.value }))} /></label>
            <label className="col-span-2 flex flex-col gap-1">City (optional)<input className="rounded bg-black/40 border border-white/10 px-2 py-1" placeholder="City" value={profile.location || ""} onChange={(e)=>setProfile(p=>({ ...p, location: e.target.value }))} /></label>
          </div>
          <div className="mt-2 text-[11px] text-white/60">Don’t know exact time? Approximate is OK.</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="mb-2 text-sm font-semibold text-white">Vibe Weights</div>
          <p className="text-xs text-white/60 mb-2">Blend Astro with behavior. 0 = behavior-only, 1 = Astro-dominant.</p>
          <input type="range" min={0} max={1} step={0.05} value={weight} onChange={(e)=>setWeight(Number(e.target.value))} className="w-full" />
          <div className="text-xs text-white/70">Weight: {Math.round(weight*100)}%</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="mb-2 text-sm font-semibold text-white">Today’s Vibe</div>
          <div className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/10 px-2 py-1 text-xs text-white/80">
            <span className="h-2 w-2 rounded-full bg-teal-400" /> {vibe.mode}
          </div>
          <ul className="mt-2 list-disc pl-5 text-xs text-white/70 space-y-1">
            {vibe.tips.map((t,i)=>(<li key={i}>{t}</li>))}
          </ul>
        </div>
      </section>
      <div className="mx-auto max-w-6xl p-4">
        <button onClick={save} disabled={saving} className="rounded-md border border-teal-400/30 bg-teal-500/10 px-3 py-1.5 text-sm text-teal-200 hover:bg-teal-500/20 disabled:opacity-50">
          {saving ? "Saving..." : "Save Preferences"}
        </button>
        <button onClick={()=>{ localStorage.removeItem("taptap.astro.profile"); localStorage.removeItem("taptap.astro.weight"); localStorage.setItem("taptap.astro.enabled","0"); setEnabled(false); }} className="ml-2 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/80 hover:bg-white/10">Disable</button>
      </div>
    </main>
  );
}

