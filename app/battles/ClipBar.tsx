"use client";
import React, { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export default function ClipBar({
  getCurrentTime,
  getSourceUrl,
  onCreateClip,
}: {
  getCurrentTime: () => number;
  getSourceUrl?: () => string | null;
  onCreateClip?: (clip: { start: number; end: number; title: string }) => void;
}) {
  const [start, setStart] = useState<number | null>(null);
  const [end, setEnd] = useState<number | null>(null);
  const [title, setTitle] = useState<string>("");
  const [durationSec, setDurationSec] = useState<number>(15);
  const [mintCount, setMintCount] = useState<number>(10);
  const [priceCents, setPriceCents] = useState<number>(0);
  const [pending, setPending] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  function markStart() {
    const s = Math.max(0, Math.floor(getCurrentTime()));
    setStart(s);
    if (end != null && end > s) setDurationSec(end - s);
  }
  function markEnd() {
    const e = Math.max(0, Math.floor(getCurrentTime()));
    setEnd(e);
    if (start != null && e > start) setDurationSec(e - start);
  }
  async function createPosterize() {
    try {
      setPending(true);
      if (durationSec <= 0 && start != null && end != null && end > start) {
        setDurationSec(end - start);
      }
      const body = {
        title: title || (start != null && end != null ? `Clip ${start}-${end}` : "Posterize Clip"),
        durationSec: Math.max(1, Math.floor(durationSec || 1)),
        mintCount: Math.max(1, Math.floor(mintCount || 1)),
        priceCents: Math.max(0, Math.floor(priceCents || 0)),
        sourceUrl: getSourceUrl ? getSourceUrl() : null,
        start: start ?? null,
        end: end ?? null,
      };
      const res = await fetch("/api/posterize/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Posterize failed");
      onCreateClip?.({ start: start ?? 0, end: end ?? (start ?? 0) + durationSec, title: body.title! });
      toast({ title: "Posterize created", description: `Product ${j.productId}` });
      try {
        const url = new URL(window.location.href);
        const base = url.origin + "/marketplace?posterize=1#" + j.productId;
        router.push(base);
      } catch {}
      setStart(null); setEnd(null); setTitle(""); setDurationSec(15); setMintCount(10); setPriceCents(0);
    } catch (e: any) {
      toast({ title: "Posterize failed", description: e?.message || "Error", variant: "destructive" } as any);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-2 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/80">
      <div className="mb-2 font-medium text-teal-300">Posterize (Clip → NFT)</div>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <button onClick={markStart} className="rounded bg-teal-600 px-2 py-1 text-xs font-semibold text-black hover:bg-teal-500">Mark Start</button>
        <button onClick={markEnd} className="rounded bg-teal-600 px-2 py-1 text-xs font-semibold text-black hover:bg-teal-500">Mark End</button>
        <div className="text-xs text-white/60">{start != null ? `Start: ${start}s` : "Start: –"} · {end != null ? `End: ${end}s` : "End: –"}</div>
      </div>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="rounded border border-white/10 bg-black/40 px-2 py-1 text-xs outline-none"/>
        <input type="number" min={1} max={120} value={durationSec} onChange={(e) => setDurationSec(Number(e.target.value || 0))} placeholder="Duration (sec)" className="rounded border border-white/10 bg-black/40 px-2 py-1 text-xs outline-none"/>
        <input type="number" min={1} max={9999} value={mintCount} onChange={(e) => setMintCount(Number(e.target.value || 0))} placeholder="Mint Count" className="rounded border border-white/10 bg-black/40 px-2 py-1 text-xs outline-none"/>
        <input type="number" min={0} step={1} value={priceCents} onChange={(e) => setPriceCents(Number(e.target.value || 0))} placeholder="Price (cents)" className="rounded border border-white/10 bg-black/40 px-2 py-1 text-xs outline-none"/>
      </div>
      <div className="mt-2 flex items-center justify-end">
        <button onClick={createPosterize} disabled={pending} className="rounded border border-white/10 bg-white/10 px-3 py-1 text-xs hover:bg-white/20 disabled:opacity-60">{pending ? 'Minting…' : 'Create Posterize'}</button>
      </div>
    </div>
  );
}
