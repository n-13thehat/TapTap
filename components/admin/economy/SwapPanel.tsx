"use client";

import { useState } from "react";
import { ArrowRightLeft, Search } from "lucide-react";

type Quote = {
  inputMint: string;
  outputMint: string;
  inAmount?: string;
  outAmount?: string;
  priceImpactPct?: string;
  slippageBps?: number;
  routePlan?: any[];
};

export default function SwapPanel() {
  const [form, setForm] = useState({ amount: "", slippageBps: "50", inputMint: "", outputMint: "" });
  const [quote, setQuote] = useState<Quote | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function doQuote() {
    if (!form.amount) return setNote("Enter amount.");
    setBusy(true);
    setNote("Fetching quote…");
    setQuote(null);
    try {
      const params = new URLSearchParams({ amount: form.amount, slippageBps: form.slippageBps });
      if (form.inputMint) params.set("inputMint", form.inputMint);
      if (form.outputMint) params.set("outputMint", form.outputMint);
      const res = await fetch(`/api/admin/bank/swap/quote?${params.toString()}`, { cache: "no-store" });
      const j = await res.json();
      if (!res.ok) {
        setNote(j?.error || "Quote failed");
        return;
      }
      const q = j.quote || {};
      setQuote({
        inputMint: j.inputMint,
        outputMint: j.outputMint,
        inAmount: q.inAmount,
        outAmount: q.outAmount,
        priceImpactPct: q.priceImpactPct,
        slippageBps: j.slippageBps,
        routePlan: q.routePlan,
      });
      setNote(null);
    } catch (e: any) {
      setNote(e?.message || "Quote failed");
    } finally {
      setBusy(false);
    }
  }

  async function doExecute() {
    if (!quote) return setNote("Get a quote first.");
    if (!confirm(`Execute swap?\n  in: ${quote.inAmount} (${quote.inputMint.slice(0, 8)}…)\n  out: ${quote.outAmount} (${quote.outputMint.slice(0, 8)}…)\n  impact: ${quote.priceImpactPct ?? "?"}%`)) return;
    setBusy(true);
    setNote("Executing swap…");
    try {
      const res = await fetch("/api/admin/bank/swap/execute", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          amount: Number(form.amount),
          slippageBps: Number(form.slippageBps) || 50,
          inputMint: form.inputMint || undefined,
          outputMint: form.outputMint || undefined,
          confirm: true,
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        setNote(`✗ ${j?.error || "Swap failed"}`);
        return;
      }
      setNote(`✓ swap submitted — sig ${String(j.signature || "").slice(0, 16)}…`);
    } catch (e: any) {
      setNote(`✗ ${e?.message || "Swap failed"}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-2 mb-3">
        <ArrowRightLeft className="h-5 w-5 text-purple-300" />
        <h2 className="text-lg font-semibold">TAP / SOL Swap (Jupiter)</h2>
        <span className="rounded bg-purple-500/20 px-2 py-0.5 text-[10px] uppercase tracking-wide text-purple-200">treasury signs</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <input className={input} placeholder="Amount (raw atomic units)" type="number" min="1" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
        <input className={input} placeholder="Slippage (bps)" type="number" min="1" value={form.slippageBps} onChange={(e) => setForm({ ...form, slippageBps: e.target.value })} />
        <input className={input} placeholder="Input mint (default TAP)" value={form.inputMint} onChange={(e) => setForm({ ...form, inputMint: e.target.value })} />
        <input className={input} placeholder="Output mint (default wSOL)" value={form.outputMint} onChange={(e) => setForm({ ...form, outputMint: e.target.value })} />
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button disabled={busy} onClick={doQuote} className="inline-flex items-center gap-2 rounded-lg bg-purple-700 px-3 py-2 text-sm font-semibold hover:bg-purple-800 disabled:opacity-50">
          <Search className="h-4 w-4" /> Get Quote
        </button>
        <button disabled={busy || !quote} onClick={doExecute} className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold hover:bg-emerald-800 disabled:opacity-50">
          <ArrowRightLeft className="h-4 w-4" /> Execute
        </button>
      </div>

      {quote && (
        <div className="mt-3 rounded-lg border border-white/10 bg-black/30 p-3 text-xs space-y-1">
          <div className="flex justify-between"><span className="text-white/50">In</span><code className="text-white/80">{quote.inAmount} ({quote.inputMint.slice(0, 12)}…)</code></div>
          <div className="flex justify-between"><span className="text-white/50">Out</span><code className="text-emerald-200">{quote.outAmount} ({quote.outputMint.slice(0, 12)}…)</code></div>
          <div className="flex justify-between"><span className="text-white/50">Slippage</span><span>{quote.slippageBps} bps</span></div>
          <div className="flex justify-between"><span className="text-white/50">Price impact</span><span>{quote.priceImpactPct ?? "?"}%</span></div>
          {quote.routePlan && <div className="flex justify-between"><span className="text-white/50">Route hops</span><span>{quote.routePlan.length}</span></div>}
        </div>
      )}

      {note && <div className="mt-3 rounded bg-black/30 px-3 py-2 text-xs text-white/80 break-words">{note}</div>}
    </section>
  );
}

const input = "w-full rounded border border-white/20 bg-black/40 px-3 py-2 text-sm";
