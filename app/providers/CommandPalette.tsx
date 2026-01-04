"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";

type Result = { type: string; id: string; title: string; href?: string };

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const router = useRouter();

  const onKey = useCallback((e: KeyboardEvent) => {
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === "k") {
      e.preventDefault();
      setOpen((o) => !o);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onKey]);

  useEffect(() => {
    let abort = false;
    async function run() {
      if (!q) { setResults([]); return; }
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { cache: "no-store" });
        const json = await r.json();
        if (!abort) setResults(Array.isArray(json?.items) ? json.items : []);
      } catch { if (!abort) setResults([]); }
    }
    run();
    return () => { abort = true; };
  }, [q]);

  const grouped = useMemo(() => {
    const g: Record<string, Result[]> = {};
    for (const r of results) {
      g[r.type] = g[r.type] || [];
      g[r.type].push(r);
    }
    return g;
  }, [results]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)}>
      <div className="mx-auto mt-24 max-w-2xl rounded-xl border border-white/10 bg-black/85 p-2" onClick={(e)=>e.stopPropagation()}>
        <div className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-2 py-1.5">
          <Search className="h-4 w-4 text-white/70" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search tracks, artists, albums, users, products, live..."
            className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-white/50"
          />
          <kbd className="text-[10px] text-white/50">Ctrl/⌘+K</kbd>
        </div>
        <div className="mt-2 max-h-[50vh] overflow-y-auto text-sm">
          {Object.keys(grouped).length === 0 ? (
            <div className="py-8 text-center text-white/60">No results yet</div>
          ) : (
            Object.entries(grouped).map(([k, arr]) => (
              <div key={k} className="mb-3">
                <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-teal-300/80">{k}</div>
                {arr.map((r) => (
                  <button
                    key={`${r.type}:${r.id}`}
                    onClick={() => { setOpen(false); if (r.href) router.push(r.href); }}
                    className="w-full text-left px-2 py-1.5 rounded-md hover:bg-white/5 text-white/80"
                  >
                    {r.title}
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

