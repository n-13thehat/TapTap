"use client";

import { useEffect, useMemo, useState } from "react";
import { Package, ShoppingCart, Plus, Minus, Send, Cpu } from "lucide-react";

type Sku = {
  id: string;
  code: string;
  name: string;
  chipType: string;
  formFactor: string;
  retailCents: number;
};

type CartLine = {
  skuId: string;
  quantity: number;
  payloadType?: string;
  payloadId?: string;
};

const PAYLOAD_TYPES = ["TRACK", "ALBUM", "PLAYLIST", "VISUAL_ART", "EXTERNAL_URL", "CUSTOM"] as const;

function dollars(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function CreatorTrapPage() {
  const [skus, setSkus] = useState<Sku[]>([]);
  const [cart, setCart] = useState<Record<string, CartLine>>({});
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/trap/skus");
        if (res.ok) {
          const json = (await res.json()) as { skus: Sku[] };
          setSkus(json.skus || []);
        }
      } catch {}
    })();
  }, []);

  const lines = Object.values(cart).filter((l) => l.quantity > 0);
  const total = useMemo(
    () =>
      lines.reduce((sum, l) => {
        const sku = skus.find((s) => s.id === l.skuId);
        return sum + (sku ? sku.retailCents * l.quantity : 0);
      }, 0),
    [lines, skus]
  );

  function setQty(skuId: string, delta: number) {
    setCart((c) => {
      const cur = c[skuId] ?? { skuId, quantity: 0 };
      const next = Math.max(0, cur.quantity + delta);
      return { ...c, [skuId]: { ...cur, quantity: next } };
    });
  }

  function setLineField(skuId: string, key: "payloadType" | "payloadId", value: string) {
    setCart((c) => {
      const cur = c[skuId] ?? { skuId, quantity: 0 };
      return { ...c, [skuId]: { ...cur, [key]: value || undefined } };
    });
  }

  async function placeOrder() {
    if (lines.length === 0) return setMessage("Add at least one item.");
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/trap/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: lines, notes: notes || null }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMessage(`Order failed: ${json?.error || res.statusText}`);
        return;
      }
      setMessage(`Order placed (${json.order.id}). Total ${dollars(json.order.totalCents)}.`);
      setCart({});
      setNotes("");
    } catch (e: any) {
      setMessage(`Order failed: ${e?.message || e}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white px-6 py-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex items-center gap-3">
          <Cpu className="h-6 w-6 text-emerald-300" />
          <div>
            <div className="text-sm uppercase tracking-[0.2em] text-emerald-200">Creator</div>
            <h1 className="text-3xl font-bold">The Trap</h1>
            <p className="text-white/60">Order physical TapTap chips, attach your content, and ship.</p>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {skus.length === 0 ? (
            <div className="text-white/60 col-span-2">No active SKUs available yet.</div>
          ) : (
            skus.map((s) => {
              const line = cart[s.id] ?? { skuId: s.id, quantity: 0 };
              return (
                <div key={s.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-emerald-300" />
                      <div>
                        <div className="font-semibold">{s.name}</div>
                        <div className="text-xs text-white/50">{s.code} · {s.chipType} · {s.formFactor}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold">{dollars(s.retailCents)}</div>
                      <div className="text-[10px] uppercase tracking-wider text-white/40">per unit</div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <button onClick={() => setQty(s.id, -1)} className="rounded border border-white/20 p-1"><Minus className="h-4 w-4" /></button>
                    <span className="w-10 text-center font-mono">{line.quantity}</span>
                    <button onClick={() => setQty(s.id, 1)} className="rounded border border-white/20 p-1"><Plus className="h-4 w-4" /></button>
                  </div>
                  {line.quantity > 0 ? (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <select
                        className="rounded border border-white/20 bg-black/40 px-2 py-1 text-xs"
                        value={line.payloadType || ""}
                        onChange={(e) => setLineField(s.id, "payloadType", e.target.value)}
                      >
                        <option value="">— payload type —</option>
                        {PAYLOAD_TYPES.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                      <input
                        className="rounded border border-white/20 bg-black/40 px-2 py-1 text-xs"
                        placeholder="payload id (track/album/art id)"
                        value={line.payloadId || ""}
                        onChange={(e) => setLineField(s.id, "payloadId", e.target.value)}
                      />
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </section>

        <section className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-emerald-300" />
            <h2 className="text-lg font-semibold">Order Summary</h2>
            <span className="ml-auto text-xl font-bold">{dollars(total)}</span>
          </div>
          <textarea
            className="w-full rounded border border-white/20 bg-black/40 px-3 py-2 text-sm"
            placeholder="Notes for the encoder team (optional)"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <button
            disabled={submitting || lines.length === 0}
            onClick={placeOrder}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {submitting ? "Submitting…" : "Place Order"}
          </button>
          {message ? <div className="text-sm text-white/80">{message}</div> : null}
        </section>
      </div>
    </main>
  );
}
