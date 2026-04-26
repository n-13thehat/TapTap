"use client";

import { useState } from "react";
import Link from "next/link";
import { Database, Music, Waves, Download, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

type RunResult = { ok?: boolean; error?: string; [k: string]: any } | null;

async function postJson(url: string): Promise<RunResult> {
  try {
    const res = await fetch(url, { method: "POST" });
    return (await res.json()) as RunResult;
  } catch (e: any) {
    return { error: e?.message || "Network error" };
  }
}

const ACTIONS = [
  {
    key: "backfill",
    title: "Backfill Default Album",
    description: "Add the starter album to every existing user's library.",
    icon: Music,
    url: "/api/admin/backfill-default-album",
    color: "purple",
  },
  {
    key: "audioMeta",
    title: "Generate Audio Metadata",
    description: "Probe default-album tracks for duration and create placeholder waveforms.",
    icon: Database,
    url: "/api/admin/generate-audio-meta",
    color: "blue",
  },
  {
    key: "waveforms",
    title: "Queue Waveforms (External)",
    description: "POST tracks needing real waveforms to AUDIO_WAVEFORM_WEBHOOK_URL (or list-only if unset).",
    icon: Waves,
    url: "/api/admin/queue-waveforms?limit=50",
    color: "cyan",
  },
] as const;

const EXPORTS = [
  { label: "Waveforms queued (default album)", href: "/api/admin/export/waveforms-queued?limit=1000" },
  { label: "Audio metadata queued (all tracks)", href: "/api/admin/export/audio-meta-queued?limit=1000" },
  { label: "Audio meta errors (all tracks)", href: "/api/admin/export/generate-audio-meta-all-errors" },
  { label: "Audio meta errors (default album only)", href: "/api/admin/export/generate-audio-meta-errors" },
] as const;

export default function AdminToolsPage() {
  const [running, setRunning] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, RunResult>>({});

  const run = (key: string, url: string) => async () => {
    setRunning(key);
    const r = await postJson(url);
    setResults((prev) => ({ ...prev, [key]: r }));
    setRunning(null);
  };

  return (
    <main className="min-h-screen bg-black text-white px-6 py-6">
      <div className="mx-auto max-w-7xl space-y-8">
        <header>
          <div className="text-sm uppercase tracking-[0.2em] text-teal-200">TapTap Matrix</div>
          <h1 className="text-4xl font-bold text-white">System Tools</h1>
          <p className="text-white/60">Database operations, audio pipeline, and CSV exports.</p>
        </header>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">Audio Pipeline</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {ACTIONS.map((a) => {
              const Icon = a.icon;
              const isRunning = running === a.key;
              const result = results[a.key];
              const ok = result && !("error" in result) && result.ok !== false;
              return (
                <div key={a.key} className={`rounded-xl border border-${a.color}-400/30 bg-${a.color}-400/5 p-4`}>
                  <div className={`mb-3 inline-flex rounded-lg bg-${a.color}-400/20 p-2 text-${a.color}-300`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-white">{a.title}</h3>
                  <p className="text-sm text-white/70 mb-3">{a.description}</p>
                  <button
                    onClick={run(a.key, a.url)}
                    disabled={isRunning}
                    className={`flex items-center gap-2 rounded-lg border border-${a.color}-400/40 bg-${a.color}-400/10 px-3 py-2 text-sm font-medium text-white hover:bg-${a.color}-400/20 disabled:opacity-50`}
                  >
                    {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    {isRunning ? "Running..." : "Run"}
                  </button>
                  {result && (
                    <div className="mt-3 rounded-lg border border-white/10 bg-white/5 p-2 text-xs">
                      <div className={`flex items-center gap-1 mb-1 ${ok ? "text-green-300" : "text-red-300"}`}>
                        {ok ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                        {ok ? "Success" : "Error"}
                      </div>
                      <pre className="overflow-x-auto whitespace-pre-wrap text-white/70">{JSON.stringify(result, null, 2)}</pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">CSV Exports</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {EXPORTS.map((e) => (
              <Link
                key={e.href}
                href={e.href}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 hover:border-teal-400/40 hover:bg-teal-400/5 transition-colors"
              >
                <div className="rounded-lg bg-teal-400/20 p-2 text-teal-300">
                  <Download className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-medium text-white">{e.label}</div>
                  <div className="text-xs text-white/50 font-mono">{e.href}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
