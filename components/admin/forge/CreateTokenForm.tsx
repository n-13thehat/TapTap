"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import type { TokenKind, TokenSummary } from "./types";

interface Props {
  parents: TokenSummary[];
  onCreated: (token: TokenSummary) => void;
}

const KINDS: TokenKind[] = ["ROOT", "LAYER", "PARTNER", "EXPERIMENTAL"];

export default function CreateTokenForm({ parents, onCreated }: Props) {
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [description, setDescription] = useState("");
  const [kind, setKind] = useState<TokenKind>("LAYER");
  const [parentTokenId, setParentTokenId] = useState("");
  const [decimals, setDecimals] = useState("0");
  const [supplyCap, setSupplyCap] = useState("");
  const [holderCap, setHolderCap] = useState("");
  const [freezeOnDeploy, setFreezeOnDeploy] = useState(false);
  const [metadataUri, setMetadataUri] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setName(""); setSymbol(""); setDescription(""); setKind("LAYER");
    setParentTokenId(""); setDecimals("0"); setSupplyCap(""); setHolderCap("");
    setFreezeOnDeploy(false); setMetadataUri(""); setError(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        name: name.trim(),
        symbol: symbol.trim().toUpperCase(),
        kind,
        decimals: Number(decimals),
        freezeOnDeploy,
      };
      if (description.trim()) body.description = description.trim();
      if (parentTokenId) body.parentTokenId = parentTokenId;
      if (supplyCap.trim()) body.supplyCap = supplyCap.trim();
      if (holderCap.trim()) body.holderCap = Number(holderCap);
      if (metadataUri.trim()) body.metadataUri = metadataUri.trim();

      const res = await fetch("/api/admin/bank/tokens", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Create failed");
      onCreated(j.token);
      reset();
    } catch (e: any) {
      setError(e?.message || "Create failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Plus className="h-5 w-5 text-emerald-300" />
        <h2 className="text-lg font-semibold">Forge a new token</h2>
      </div>

      <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <Field label="Name">
          <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={64} className={inputCls} placeholder="TapGame" />
        </Field>
        <Field label="Symbol (A-Z 0-9)">
          <input value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} required maxLength={16} pattern="[A-Z0-9]+" className={inputCls + " font-mono uppercase"} placeholder="TAPGAME" />
        </Field>

        <Field label="Kind">
          <select value={kind} onChange={(e) => setKind(e.target.value as TokenKind)} className={inputCls}>
            {KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </Field>
        <Field label="Parent token (optional)">
          <select value={parentTokenId} onChange={(e) => setParentTokenId(e.target.value)} className={inputCls}>
            <option value="">— none (top level) —</option>
            {parents.filter((p) => p.kind !== "EXPERIMENTAL").map((p) => (
              <option key={p.id} value={p.id}>{p.symbol} · {p.name} ({p.kind})</option>
            ))}
          </select>
        </Field>

        <Field label="Decimals (0-9)">
          <input type="number" min={0} max={9} value={decimals} onChange={(e) => setDecimals(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Supply cap (base units, optional)">
          <input value={supplyCap} onChange={(e) => setSupplyCap(e.target.value.replace(/[^0-9]/g, ""))} className={inputCls + " font-mono"} placeholder="e.g. 1000000000" />
        </Field>

        <Field label="Holder cap (optional)">
          <input type="number" min={1} value={holderCap} onChange={(e) => setHolderCap(e.target.value)} className={inputCls} placeholder="0 = unlimited" />
        </Field>
        <Field label="Metadata URI (optional)">
          <input type="url" maxLength={500} value={metadataUri} onChange={(e) => setMetadataUri(e.target.value)} className={inputCls} placeholder="https://…" />
        </Field>

        <Field label="Description (optional)" full>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} rows={2} className={inputCls} />
        </Field>

        <label className="md:col-span-2 inline-flex items-center gap-2 text-xs text-white/70">
          <input type="checkbox" checked={freezeOnDeploy} onChange={(e) => setFreezeOnDeploy(e.target.checked)} />
          Set freeze authority on deploy (can revoke later)
        </label>

        {error && (
          <div className="md:col-span-2 rounded border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-xs text-rose-200">{error}</div>
        )}

        <div className="md:col-span-2 flex justify-end gap-2 pt-1">
          <button type="button" onClick={reset} className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-xs text-white/70 hover:bg-white/10">Reset</button>
          <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Create draft
          </button>
        </div>
      </form>
    </section>
  );
}

const inputCls = "w-full rounded border border-white/20 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-emerald-400 focus:outline-none";

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={`flex flex-col gap-1 ${full ? "md:col-span-2" : ""}`}>
      <span className="text-[11px] uppercase tracking-wide text-white/50">{label}</span>
      {children}
    </label>
  );
}
