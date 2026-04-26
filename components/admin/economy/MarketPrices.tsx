"use client";

import { useEffect, useState } from "react";
import { TrendingUp, RefreshCw } from "lucide-react";

type Prices = {
  sol: { usd: number | null; source: string | null; fetchedAt: number | null };
  tap: { usd: number | null; source: string; fetchedAt: number | null };
  pair: { tapPerSol: number | null; solPerTap: number | null };
};

export default function MarketPrices() {
  const [data, setData] = useState<Prices | null>(null);
  const [loading, setLoading] = useState(true);
  const [tapInput, setTapInput] = useState("");
  const [note, setNote] = useState<string | null>(null);

  async function loadPrices() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/market/prices", { cache: "no-store" });
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }

  async function refreshSol() {
    setNote("Fetching CoinGecko…");
    const res = await fetch("/api/admin/market/solprice?refresh=1", { cache: "no-store" });
    const j = await res.json().catch(() => null);
    if (!res.ok) {
      setNote(j?.error || "SOL refresh failed");
      return;
    }
    setNote(`SOL refreshed: $${j.usd} (${j.source})`);
    await loadPrices();
  }

  async function saveTap() {
    const usd = Number(tapInput);
    if (!Number.isFinite(usd) || usd < 0) {
      setNote("Enter a valid TAP price.");
      return;
    }
    setNote("Saving TAP price…");
    const res = await fetch("/api/admin/market/tapprice", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ usd }),
    });
    const j = await res.json().catch(() => null);
    if (!res.ok) {
      setNote(j?.error || "TAP save failed");
      return;
    }
    setNote(`TAP price set to $${usd}`);
    setTapInput("");
    await loadPrices();
  }

  useEffect(() => {
    loadPrices();
  }, []);

  return (
    <section className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-cyan-300" />
          <h2 className="text-lg font-semibold">Market Prices</h2>
        </div>
        <button onClick={loadPrices} className="inline-flex items-center gap-1 rounded border border-white/15 bg-white/5 px-2 py-1 text-xs hover:bg-white/10">
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} /> Reload
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-lg border border-white/10 bg-black/30 p-3">
          <div className="text-xs text-white/50">SOL / USD</div>
          <div className="mt-1 text-lg font-semibold">{data?.sol.usd != null ? `$${data.sol.usd.toFixed(2)}` : "—"}</div>
          <div className="text-[10px] text-white/40 mt-1">{data?.sol.source || "no data"}</div>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/30 p-3">
          <div className="text-xs text-white/50">TAP / USD</div>
          <div className="mt-1 text-lg font-semibold">{data?.tap.usd != null ? `$${data.tap.usd.toFixed(4)}` : "—"}</div>
          <div className="text-[10px] text-white/40 mt-1">manual</div>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/30 p-3">
          <div className="text-xs text-white/50">TAP / SOL</div>
          <div className="mt-1 text-lg font-semibold">{data?.pair.tapPerSol != null ? data.pair.tapPerSol.toFixed(2) : "—"}</div>
          <div className="text-[10px] text-white/40 mt-1">tokens per SOL</div>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/30 p-3">
          <div className="text-xs text-white/50">SOL / TAP</div>
          <div className="mt-1 text-lg font-semibold">{data?.pair.solPerTap != null ? data.pair.solPerTap.toFixed(8) : "—"}</div>
          <div className="text-[10px] text-white/40 mt-1">SOL per TAP</div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <button onClick={refreshSol} className="rounded-lg bg-cyan-700 px-3 py-2 text-sm font-semibold hover:bg-cyan-800">
          Refresh SOL from CoinGecko
        </button>
        <div className="flex items-center gap-2">
          <input
            type="number"
            step="0.0001"
            min="0"
            placeholder="TAP USD price"
            value={tapInput}
            onChange={(e) => setTapInput(e.target.value)}
            className="flex-1 rounded border border-white/20 bg-black/40 px-3 py-2 text-sm"
          />
          <button onClick={saveTap} className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold hover:bg-emerald-800">
            Set TAP
          </button>
        </div>
      </div>

      {note && <div className="mt-3 rounded bg-black/30 px-3 py-2 text-xs text-white/70">{note}</div>}
    </section>
  );
}
