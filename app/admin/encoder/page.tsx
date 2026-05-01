"use client";

import { useEffect, useState } from "react";
import { Cpu, Plus, RefreshCw, KeyRound } from "lucide-react";

type Sku = { id: string; code: string; name: string };
type Batch = {
  id: string;
  size: number;
  status: string;
  createdAt: string;
  sku: { code: string; name: string };
  _count: { chips: number };
};

export default function AdminEncoderPage() {
  const [skus, setSkus] = useState<Sku[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [skuId, setSkuId] = useState("");
  const [size, setSize] = useState(100);
  const [busy, setBusy] = useState(false);
  const [bind, setBind] = useState({ ttid: "", uid: "", payloadType: "", payloadId: "" });
  const [message, setMessage] = useState<string | null>(null);

  async function refresh() {
    const [a, b] = await Promise.all([
      fetch("/api/admin/skus").then((r) => (r.ok ? r.json() : { skus: [] })),
      fetch("/api/encoder/batches").then((r) => (r.ok ? r.json() : { batches: [] })),
    ]);
    setSkus(a.skus || []);
    setBatches(b.batches || []);
  }

  useEffect(() => { refresh(); }, []);

  async function createBatch() {
    if (!skuId || size <= 0) return setMessage("Pick SKU and size > 0.");
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/encoder/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skuId, size }),
      });
      const json = await res.json();
      if (!res.ok) setMessage(`Failed: ${json?.error}`);
      else { setMessage(`Created batch with ${json.ttidCount} TTIDs.`); await refresh(); }
    } finally {
      setBusy(false);
    }
  }

  async function bindChip() {
    if (!bind.ttid || !bind.uid) return setMessage("ttid and uid required.");
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/encoder/bind", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ttid: bind.ttid,
          uid: bind.uid,
          payloadType: bind.payloadType || undefined,
          payloadId: bind.payloadId || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) setMessage(`Bind failed: ${json?.error}`);
      else { setMessage(`Bound ${bind.ttid} → uid ${bind.uid}.`); setBind({ ttid: "", uid: "", payloadType: "", payloadId: "" }); }
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white px-6 py-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex items-center gap-3">
          <Cpu className="h-6 w-6 text-emerald-300" />
          <div>
            <div className="text-sm uppercase tracking-[0.2em] text-emerald-200">Admin</div>
            <h1 className="text-3xl font-bold">Encoder</h1>
            <p className="text-white/60">Generate TTID batches, bind UIDs at write time.</p>
          </div>
          <button onClick={refresh} className="ml-auto rounded border border-white/20 p-2"><RefreshCw className="h-4 w-4" /></button>
        </header>

        <section className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
          <h2 className="font-semibold flex items-center gap-2"><Plus className="h-4 w-4" /> New Batch</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <select className="rounded border border-white/20 bg-black/40 px-2 py-2 text-sm" value={skuId} onChange={(e) => setSkuId(e.target.value)}>
              <option value="">— pick SKU —</option>
              {skus.map((s) => <option key={s.id} value={s.id}>{s.code} · {s.name}</option>)}
            </select>
            <input type="number" min={1} max={5000} className="rounded border border-white/20 bg-black/40 px-2 py-2 text-sm" value={size} onChange={(e) => setSize(Number(e.target.value))} />
            <button disabled={busy} onClick={createBatch} className="rounded bg-emerald-600 px-3 py-2 text-sm font-semibold disabled:opacity-50">Generate TTIDs</button>
          </div>
        </section>

        <section className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
          <h2 className="font-semibold flex items-center gap-2"><KeyRound className="h-4 w-4" /> Bind UID</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <input className="rounded border border-white/20 bg-black/40 px-2 py-2 text-sm" placeholder="ttid (tt_…)" value={bind.ttid} onChange={(e) => setBind({ ...bind, ttid: e.target.value })} />
            <input className="rounded border border-white/20 bg-black/40 px-2 py-2 text-sm" placeholder="chip uid (hex)" value={bind.uid} onChange={(e) => setBind({ ...bind, uid: e.target.value })} />
            <input className="rounded border border-white/20 bg-black/40 px-2 py-2 text-sm" placeholder="payload type (TRACK…)" value={bind.payloadType} onChange={(e) => setBind({ ...bind, payloadType: e.target.value })} />
            <input className="rounded border border-white/20 bg-black/40 px-2 py-2 text-sm" placeholder="payload id" value={bind.payloadId} onChange={(e) => setBind({ ...bind, payloadId: e.target.value })} />
          </div>
          <button disabled={busy} onClick={bindChip} className="rounded bg-teal-600 px-3 py-2 text-sm font-semibold disabled:opacity-50">Bind</button>
        </section>

        <section className="rounded-xl border border-white/10 bg-white/5 p-4">
          <h2 className="font-semibold mb-3">Recent Batches</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-white/50 text-left">
                <tr><th className="py-1">SKU</th><th>Size</th><th>Chips</th><th>Status</th><th>Created</th></tr>
              </thead>
              <tbody>
                {batches.length === 0 ? (
                  <tr><td colSpan={5} className="py-3 text-white/50">No batches yet.</td></tr>
                ) : batches.map((b) => (
                  <tr key={b.id} className="border-t border-white/5">
                    <td className="py-1">{b.sku.code}</td>
                    <td>{b.size}</td>
                    <td>{b._count.chips}</td>
                    <td>{b.status}</td>
                    <td>{new Date(b.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {message ? <div className="rounded border border-white/10 bg-white/5 px-4 py-2 text-sm">{message}</div> : null}
      </div>
    </main>
  );
}
