"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { createClient } from "@supabase/supabase-js";
import { motion } from "framer-motion";
import { ArrowLeft, Check, ChevronRight, Upload, Image as Img, Hash, DollarSign, Users } from "lucide-react";
import Link from "next/link";
import {
  DEFAULT_ALBUM_STORAGE_DASHBOARD_URL,
  DEFAULT_STEMSTATION_ALBUM,
} from "@/lib/defaultAlbumConfig";
import { isTapGameEnabled } from "@/lib/featureFlagUtils";

const supabase = createClient(
  String(process.env.NEXT_PUBLIC_SUPABASE_URL),
  String(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
);

type Step = 1|2|3|4; // 1=Audio, 2=Metadata, 3=Cover, 4=Pricing+Splits
type STEMSTATIONDifficulty = "Easy" | "Medium" | "Hard" | "Expert";
const STEMSTATION_DIFFICULTIES: STEMSTATIONDifficulty[] = ["Easy", "Medium", "Hard", "Expert"];
const STEMSTATION_KEYS = ["D", "F", "J", "K"];
const STEMSTATION_BPM_MIN = 60;
const STEMSTATION_BPM_MAX = 220;

export default function UploadPage() {
  const [step, setStep] = useState<Step>(1);
  const [busy, setBusy] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // form state
  const [audioFile, setAudioFile] = useState<File|null>(null);
  const [audioUrl, setAudioUrl] = useState<string|null>(null);

  const [title, setTitle] = useState("");
  const [primaryArtist, setPrimaryArtist] = useState<string>(""); // stageName or artistId
  const [explicit, setExplicit] = useState(false);

  const [coverFile, setCoverFile] = useState<File|null>(null);
  const [coverUrl, setCoverUrl] = useState<string|null>(null);

  const [priceCents, setPriceCents] = useState<number>(0);
  const [splits, setSplits] = useState<Array<{addressOrUser:string; percent:number}>>([]);
  const [STEMSTATIONEnabled, setSTEMSTATIONEnabled] = useState(false);
  const [STEMSTATIONBpm, setSTEMSTATIONBpm] = useState(128);
  const [STEMSTATIONDifficulty, setSTEMSTATIONDifficulty] = useState<STEMSTATIONDifficulty>("Hard");
  const [STEMSTATIONPrice, setSTEMSTATIONPrice] = useState<number>(495);
  const [STEMSTATIONDescription, setSTEMSTATIONDescription] = useState("Interactive STEMSTATION chart for guitar-hero style play.");
  const tapGameAvailable = useMemo(() => isTapGameEnabled(), []);
  const STEMSTATIONSeed = useMemo(
    () => buildChartSeed((title || audioFile?.name || "untitled").toLowerCase(), STEMSTATIONBpm, STEMSTATIONDifficulty),
    [title, audioFile?.name, STEMSTATIONBpm, STEMSTATIONDifficulty]
  );
  const STEMSTATIONDisabledReason = !tapGameAvailable
    ? "TapGame/STEMSTATION is currently disabled by feature flag."
    : !audioUrl
    ? "Upload audio to enable STEMSTATION"
    : null;
  const STEMSTATIONPriceDisplay = useMemo(() => `$${((Math.max(0, STEMSTATIONPrice) || 0) / 100).toFixed(2)}`, [STEMSTATIONPrice]);

  useEffect(() => {
    let dead=false;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if(!dead) setUserId(user?.id ?? null);
      } catch {}
    })();
    return ()=>{dead=true}
  },[]);

  useEffect(() => {
    if (!audioFile) return;
    const guess = guessBpmFromName(audioFile.name);
    if (guess) setSTEMSTATIONBpm(guess);
  }, [audioFile]);

  async function uploadToBucket(kind: "tracks"|"covers", f: File): Promise<string> {
    const ext = (f.name.split(".").pop() || (kind==="tracks"?"mp3":"png")).toLowerCase();
    const key = `${kind}/${crypto.randomUUID()}.${ext}`;
    const { data, error } = await supabase.storage.from(kind).upload(key, f, { upsert: false, cacheControl: "3600", contentType: f.type || undefined });
    if (error) throw new Error(error.message);
    // public URL (ensure bucket is public)
    const { data: pub } = supabase.storage.from(kind).getPublicUrl(key);
    return pub.publicUrl;
  }

  async function onSaveDraft() {
    if (!userId) return alert("Sign in first.");
    if (!audioUrl) return alert("Upload audio first.");
    setBusy(true);
    try {
      const res = await fetch("/api/creator/uploads", {
        method: "POST",
        headers: { "content-type":"application/json" },
      body: JSON.stringify({
        title: title || audioFile?.name || "Untitled",
        audioUrl,
        coverUrl,
        priceCents: Number.isFinite(priceCents) ? priceCents : 0,
        explicit,
        splits,
        STEMSTATION: STEMSTATIONEnabled
          ? {
              enabled: true,
              bpm: STEMSTATIONBpm,
              difficulty: STEMSTATIONDifficulty,
              priceCents: Number.isFinite(STEMSTATIONPrice) ? Math.max(0, STEMSTATIONPrice) : 0,
              description: STEMSTATIONDescription || "Interactive STEMSTATION chart",
              chartSeed: STEMSTATIONSeed,
            }
          : null,
      })
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Save failed");
      alert("Draft saved. You can publish from Creator Studio when ready.");
      window.location.href = "/creator";
    } catch (e:any) {
      alert(e?.message || "Save failed");
    } finally { setBusy(false); }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-black to-[#041a1a] text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-black/70 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link href="/creator" className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <div className="text-sm text-white/70">UnitedMasters-style upload</div>
        </div>
      </header>

      <section className="mx-auto max-w-4xl space-y-4 px-4 py-6">
        {/* Steps header */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="flex items-center gap-2 text-xs text-white/70">
            <StepPill n={1} cur={step} label="Audio" />
            <ChevronRight className="h-3 w-3 opacity-60" />
            <StepPill n={2} cur={step} label="Metadata" />
            <ChevronRight className="h-3 w-3 opacity-60" />
            <StepPill n={3} cur={step} label="Cover" />
            <ChevronRight className="h-3 w-3 opacity-60" />
            <StepPill n={4} cur={step} label="Pricing & Splits" />
          </div>
        </div>

        {/* Step 1: Audio */}
        {step === 1 && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="mb-2 text-sm font-semibold">Upload audio</div>
            <input type="file" accept="audio/*" onChange={(e)=>setAudioFile(e.currentTarget.files?.[0]||null)} className="mb-3 block w-full text-xs text-white"/>
            <button
              onClick={async ()=>{
                if(!audioFile) return alert("Choose a file");
                try {
                  setBusy(true);
                  const url = await uploadToBucket("tracks", audioFile);
                  setAudioUrl(url);
                } catch(e:any){ alert(e?.message || "Audio upload failed"); }
                finally { setBusy(false); }
              }}
              className="rounded bg-teal-600 px-3 py-1.5 text-sm font-semibold text-black hover:bg-teal-500 disabled:opacity-60"
              disabled={!audioFile || busy}
            >
              <Upload className="mr-1 inline-block h-4 w-4" /> Save to Storage
            </button>
            {audioUrl && <div className="mt-2 text-xs text-emerald-300 break-all">Uploaded: {audioUrl}</div>}
          </div>
        )}

        {/* Step 2: Metadata */}
        {step === 2 && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="mb-2 text-sm font-semibold">Metadata</div>
            <input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Title" className="mb-2 w-full rounded border border-white/10 bg-black/40 px-2 py-1 text-sm outline-none"/>
            <input value={primaryArtist} onChange={(e)=>setPrimaryArtist(e.target.value)} placeholder="Primary Artist (stage name or ID)" className="mb-2 w-full rounded border border-white/10 bg-black/40 px-2 py-1 text-sm outline-none"/>
            <label className="inline-flex items-center gap-2 text-sm text-white/80">
              <input type="checkbox" checked={explicit} onChange={(e)=>setExplicit(e.currentTarget.checked)} /> Explicit
            </label>
          </div>
        )}

        {/* Step 3: Cover */}
        {step === 3 && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="mb-2 text-sm font-semibold">Cover Art</div>
            <input type="file" accept="image/*" onChange={(e)=>setCoverFile(e.currentTarget.files?.[0]||null)} className="mb-3 block w-full text-xs text-white"/>
            <button
              onClick={async ()=>{
                if(!coverFile) return alert("Choose an image");
                try {
                  setBusy(true);
                  const url = await uploadToBucket("covers", coverFile);
                  setCoverUrl(url);
                } catch(e:any){ alert(e?.message || "Cover upload failed"); }
                finally { setBusy(false); }
              }}
              className="rounded bg-teal-600 px-3 py-1.5 text-sm font-semibold text-black hover:bg-teal-500 disabled:opacity-60"
              disabled={!coverFile || busy}
            >
              <Img className="mr-1 inline-block h-4 w-4" /> Save Cover
            </button>
            {coverUrl && <div className="mt-2 text-xs text-emerald-300 break-all">Uploaded: {coverUrl}</div>}
          </div>
        )}

        {/* Step 4: Pricing & Splits */}
        {step === 4 && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="mb-3 text-sm font-semibold">Pricing & Splits</div>
            <div className="mb-3 grid gap-3 md:grid-cols-2">
              <div>
                <div className="mb-1 text-xs text-white/60">Price (USD cents)</div>
                <input type="number" min={0} step={1} value={priceCents} onChange={(e)=>setPriceCents(Number(e.target.value||0))}
                  className="w-full rounded border border-white/10 bg-black/40 px-2 py-1 text-sm outline-none" />
              </div>
              <div>
                <div className="mb-1 text-xs text-white/60">Splits</div>
                <SplitEditor splits={splits} setSplits={setSplits} />
              </div>
            </div>
            <div className="text-xs text-white/60">
              Revenue routing is enforced on-chain/off-chain based on TapTap policy (Treasury/Burn excluded from artist splits).
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-pink-500/40 bg-gradient-to-br from-pink-500/10 via-[#120018]/80 to-purple-900/20 p-4 shadow-[0_10px_35px_rgba(0,0,0,0.35)]">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <div className="text-sm font-semibold text-pink-200 tracking-[0.2em]">STEMSTATION Merch</div>
              <p className="text-xs text-white/80">
                Turn your song into a BPM-synced TapTap / Guitar Hero style chart. Players unlock it as creator merch in the Marketplace and play it from the Library{" "}
                <span className="text-pink-200">Game</span> tab.
              </p>
              {!tapGameAvailable && (
                <p className="text-xs text-amber-200">
                  TapGame flag is off. Enable the <code className="text-white">tapGame</code> feature flag to ship STEMSTATION charts.
                </p>
              )}
              <div className="rounded border border-white/10 bg-white/5 p-3 text-xs text-white/70 space-y-2">
                <div className="flex items-center justify-between">
                  <span>Preview charts</span>
                  <div className="flex gap-2">
                    <a
                      href="/stemstation"
                      className="rounded bg-white/10 px-2 py-1 hover:bg-white/15 text-white"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open game
                    </a>
                    <a
                      href="/api/stemstation/chart?trackId=local:0:2Horns.mp3"
                      className="rounded bg-white/10 px-2 py-1 hover:bg-white/15 text-white"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Sample chart JSON
                    </a>
                  </div>
                </div>
                <div>
                  Generate local charts from MIDI or audio with:
                  <pre className="mt-1 rounded bg-black/40 px-2 py-1 text-[10px] text-white/80 overflow-x-auto">
                    pnpm dlx tsx tools/midi-to-chart.ts your.mid your-track expert 0
                    {"\n"}pnpm dlx tsx tools/generate-local-charts.ts
                  </pre>
                </div>
              </div>
                                              <p className="text-[11px] text-white/60">
                  The default battle deck ships with <span className="text-white/90">{DEFAULT_STEMSTATION_ALBUM}</span>; enabling STEMSTATION lets your release sit beside the
                  "Music for the Future" charts and pulls the default stems from the shared Supabase bucket at
                  <a
                    className="underline text-teal-200"
                    target="_blank"
                    rel="noreferrer"
                    href={DEFAULT_ALBUM_STORAGE_DASHBOARD_URL}
                  >
                    Default Album Music For The Future
                  </a>.
                </p>
            </div>
            <div className="text-right">
              <label className="inline-flex items-center gap-2 text-sm text-white/80">
                <input
                  type="checkbox"
                  disabled={!!STEMSTATIONDisabledReason}
                  checked={STEMSTATIONEnabled}
                  onChange={(e)=>setSTEMSTATIONEnabled(e.currentTarget.checked)}
                  className="h-4 w-4 rounded border-white/30 bg-black/50 disabled:cursor-not-allowed"
                />
                Offer as STEMSTATION game
              </label>
              {STEMSTATIONDisabledReason && <div className="mt-1 text-[11px] text-white/60">{STEMSTATIONDisabledReason}</div>}
            </div>
          </div>
          <STEMSTATIONPreview bpm={STEMSTATIONBpm} difficulty={STEMSTATIONDifficulty} seed={STEMSTATIONSeed} dimmed={!STEMSTATIONEnabled} />
          {STEMSTATIONEnabled && (
            <>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="flex flex-col gap-1 text-xs text-white/70">
                  <div className="flex items-center justify-between">
                    <span>STEMSTATION BPM</span>
                    <span className="text-white/90 font-semibold">{STEMSTATIONBpm} bpm</span>
                  </div>
                  <input
                    type="range"
                    min={STEMSTATION_BPM_MIN}
                    max={STEMSTATION_BPM_MAX}
                    value={STEMSTATIONBpm}
                    onChange={(e)=>setSTEMSTATIONBpm(Number(e.currentTarget.value||0))}
                    className="w-full accent-pink-400"
                  />
                </div>
                <div className="flex flex-col gap-1 text-xs text-white/70">
                  <span>Difficulty</span>
                  <div className="flex flex-wrap gap-2">
                    {STEMSTATION_DIFFICULTIES.map((level)=>(
                      <button
                        type="button"
                        key={level}
                        onClick={()=>setSTEMSTATIONDifficulty(level)}
                        className={`flex-1 rounded-full border px-2 py-1 text-[11px] ${
                          STEMSTATIONDifficulty===level
                            ? "border-pink-300 bg-pink-500/30 text-white shadow-[0_0_15px_rgba(255,105,180,0.4)]"
                            : "border-white/20 bg-black/40 text-white/70 hover:border-pink-200/40"
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="flex flex-col gap-1 text-xs text-white/70">
                  Add-on price (cents)
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      value={STEMSTATIONPrice}
                      onChange={(e)=>setSTEMSTATIONPrice(Number(e.currentTarget.value||0))}
                      className="w-full rounded border border-white/10 bg-black/40 px-2 py-1 text-sm outline-none pr-16"
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-[11px] text-white/70">
                      {STEMSTATIONPriceDisplay}
                    </span>
                  </div>
                </label>
              </div>
              <div className="mt-3 flex flex-col gap-2">
                <textarea
                  value={STEMSTATIONDescription}
                  onChange={(e)=>setSTEMSTATIONDescription(e.currentTarget.value)}
                  placeholder="Describe the STEMSTATION experience (BPM peaks, crowd cues, lore)"
                  className="h-20 w-full rounded border border-white/10 bg-black/40 px-2 py-1 text-sm text-white outline-none"
                />
                <p className="text-[11px] text-white/70">
                  Auto-listed in the <Link href="/marketplace?STEMSTATION=1" className="text-teal-300 underline">STEMSTATION marketplace</Link>; the `STEMSTATION:{'{trackId}'}` tag ties purchases to your track metadata.
                </p>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-between">
          <button disabled={step===1} onClick={()=>setStep((s)=> (s>1?(s-1 as Step):s))}
            className="rounded border border-white/10 px-3 py-1.5 text-sm hover:bg-white/10">Back</button>
          <div className="flex items-center gap-2">
            {step<4 && (
              <button disabled={step===1 && !audioUrl}
                onClick={()=>setStep((s)=> (s<4?(s+1 as Step):s))}
                className="rounded bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20 disabled:opacity-50">
                Next
              </button>
            )}
            <button onClick={onSaveDraft} disabled={!audioUrl || busy}
              className="inline-flex items-center gap-2 rounded bg-teal-600 px-3 py-1.5 text-sm font-semibold text-black hover:bg-teal-500 disabled:opacity-60">
              <Check className="h-4 w-4" /> Save Draft
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

function StepPill({ n, cur, label }:{ n:Step; cur:Step; label:string }) {
  const active = n === cur;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] ${active?"border-teal-400/40 bg-teal-400/10 text-teal-200":"border-white/10 bg-white/5 text-white/70"}`}>
      <Hash className="h-3 w-3" /> {label}
    </span>
  );
}

type PreviewNote = { id: string; lane: number; delay: number };

function STEMSTATIONPreview({ bpm, difficulty, seed, dimmed }: { bpm: number; difficulty: STEMSTATIONDifficulty; seed: number; dimmed?: boolean }) {
  const notes = useMemo(() => generatePreviewChart(seed, difficulty), [seed, difficulty]);
  const travelSeconds = useMemo(() => {
    const normalized = 2 - Math.min(1.2, (bpm - STEMSTATION_BPM_MIN) / 160);
    return Number(normalized.toFixed(2));
  }, [bpm]);

  return (
    <div className={`mt-4 rounded-2xl border border-white/15 bg-black/40 p-3 transition ${dimmed ? "opacity-60" : ""}`}>
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 4 }).map((_, laneIdx) => (
          <div key={laneIdx} className="relative h-28 overflow-hidden rounded-lg border border-white/10 bg-gradient-to-b from-white/5 to-black/60">
            {notes.filter((note) => note.lane === laneIdx).map((note) => (
              <motion.span
                key={note.id}
                className="absolute left-1/2 h-2 w-8 -translate-x-1/2 rounded-full bg-gradient-to-r from-pink-400 to-cyan-300 shadow-[0_0_12px_rgba(59,222,255,0.45)]"
                initial={{ y: -16, opacity: 0 }}
                animate={{ y: 140, opacity: 1 }}
                transition={{ duration: travelSeconds, delay: note.delay, repeat: Infinity, ease: "linear" }}
              />
            ))}
            <span className="pointer-events-none absolute inset-x-0 bottom-1 text-center text-[11px] font-semibold text-white/80">
              {STEMSTATION_KEYS[laneIdx]}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] text-white/70">
        <span>{difficulty} chart preview Â· Seed {String(seed).slice(-4)}</span>
        <span>{bpm} BPM</span>
      </div>
    </div>
  );
}

function SplitEditor({ splits, setSplits }:{ splits:Array<{addressOrUser:string;percent:number}>, setSplits: any }) {
  const [addr, setAddr] = useState("");
  const [pct, setPct] = useState<number>(0);
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <input value={addr} onChange={e=>setAddr(e.target.value)} placeholder="User ID or Wallet Address"
          className="flex-1 rounded border border-white/10 bg-black/40 px-2 py-1 text-sm outline-none"/>
        <input value={pct} type="number" min={0} max={100} step={1} onChange={e=>setPct(Number(e.target.value||0))}
          className="w-24 rounded border border-white/10 bg-black/40 px-2 py-1 text-sm outline-none"/>
        <button onClick={()=>{ if(addr && pct>0){ setSplits([...splits,{addressOrUser:addr, percent:pct}]); setAddr(""); setPct(0); } }}
          className="rounded border border-white/10 px-3 py-1 text-sm hover:bg-white/10">Add</button>
      </div>
      <div className="space-y-1">
        {splits.map((s, i)=>(
          <div key={i} className="flex items-center justify-between rounded border border-white/10 bg-black/40 px-2 py-1 text-xs">
            <span className="truncate">{s.addressOrUser}</span>
            <span>{s.percent}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function generatePreviewChart(seed: number, difficulty: STEMSTATIONDifficulty): PreviewNote[] {
  const lengthMap: Record<STEMSTATIONDifficulty, number> = { Easy: 12, Medium: 16, Hard: 20, Expert: 24 };
  const total = lengthMap[difficulty] || 16;
  const rand = seededRandom(seed);
  return Array.from({ length: total }).map((_, idx) => ({
    id: `${seed}-${idx}`,
    lane: Math.floor(rand() * 4),
    delay: idx * 0.18 + rand() * 0.12,
  }));
}

function seededRandom(seed: number) {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function guessBpmFromName(name?: string | null) {
  if (!name) return null;
  const bpmMatch = name.match(/(\d{2,3})\s*(?:bpm)/i) || name.match(/(\d{2,3})(?=[^\d]|$)/);
  if (!bpmMatch) return null;
  const raw = Number(bpmMatch[1]);
  if (!Number.isFinite(raw)) return null;
  if (raw >= STEMSTATION_BPM_MIN && raw <= STEMSTATION_BPM_MAX) return raw;
  if (raw > STEMSTATION_BPM_MAX && raw / 2 >= STEMSTATION_BPM_MIN) return Math.min(STEMSTATION_BPM_MAX, Math.round(raw / 2));
  return Math.max(STEMSTATION_BPM_MIN, Math.min(STEMSTATION_BPM_MAX, raw));
}

function buildChartSeed(source: string, bpm: number, difficulty: string) {
  const payload = `${source}|${bpm}|${difficulty}`;
  let hash = 0;
  for (let i = 0; i < payload.length; i++) {
    hash = (hash << 5) - hash + payload.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}
