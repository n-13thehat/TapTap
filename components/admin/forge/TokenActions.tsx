"use client";

import { useMemo, useState } from "react";
import { Rocket, Coins, ShieldOff, ArrowUpRight, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { TokenDetail, ChainId } from "./types";
import { CHAIN_LABEL, expectedConfirm } from "./types";

interface Props {
  token: TokenDetail;
  onChanged: () => void;
}

const ALL_CHAINS: ChainId[] = ["SOLANA_DEVNET", "SOLANA_TESTNET", "SOLANA_MAINNET"];

export default function TokenActions({ token, onChanged }: Props) {
  return (
    <section className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Rocket className="h-5 w-5 text-emerald-300" />
        <h3 className="text-sm font-semibold">Lifecycle actions</h3>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <DeployPanel token={token} onChanged={onChanged} />
        <MintPanel token={token} onChanged={onChanged} />
        <RevokePanel token={token} onChanged={onChanged} />
        <PromotePanel token={token} onChanged={onChanged} />
      </div>
    </section>
  );
}

function Panel({ icon, title, tone, children }: { icon: React.ReactNode; title: string; tone: string; children: React.ReactNode }) {
  return (
    <div className={`rounded-lg border p-3 ${tone}`}>
      <div className="flex items-center gap-2 mb-2 text-sm font-semibold">{icon}{title}</div>
      <div className="space-y-2 text-xs">{children}</div>
    </div>
  );
}

function Status({ ok, msg }: { ok: boolean | null; msg: string | null }) {
  if (!msg) return null;
  return (
    <div className={`flex items-start gap-1 rounded px-2 py-1 text-[11px] ${ok ? "bg-emerald-400/10 text-emerald-200" : "bg-rose-400/10 text-rose-200"}`}>
      {ok ? <CheckCircle2 className="h-3 w-3 mt-0.5" /> : <AlertTriangle className="h-3 w-3 mt-0.5" />}
      <span className="break-all">{msg}</span>
    </div>
  );
}

const inputCls = "w-full rounded border border-white/20 bg-black/40 px-2 py-1.5 text-xs text-white placeholder:text-white/30 focus:border-emerald-400 focus:outline-none";
const btnCls = "inline-flex items-center gap-1 rounded bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50";
const dangerBtnCls = "inline-flex items-center gap-1 rounded bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50";

function ConfirmInput({ chain, action, symbol, value, onChange }: { chain: ChainId; action: string; symbol: string; value: string; onChange: (v: string) => void }) {
  if (chain !== "SOLANA_MAINNET") return null;
  const expected = expectedConfirm(action, symbol);
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-wide text-rose-200">Mainnet confirm — type exactly</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={expected} className={inputCls + " font-mono"} />
      <span className="text-[10px] text-white/40 font-mono break-all">{expected}</span>
    </label>
  );
}

function chainsWithDeploy(token: TokenDetail): ChainId[] {
  return token.deployments.filter((d) => d.status === "DEPLOYED").map((d) => d.chain);
}

function chainsWithoutDeploy(token: TokenDetail): ChainId[] {
  const have = new Set(token.deployments.map((d) => d.chain));
  return ALL_CHAINS.filter((c) => !have.has(c));
}

function DeployPanel({ token, onChanged }: Props) {
  const available = chainsWithoutDeploy(token);
  const [chain, setChain] = useState<ChainId>(available[0] ?? "SOLANA_DEVNET");
  const [notes, setNotes] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  async function submit() {
    setBusy(true); setResult(null);
    try {
      const body: any = { chain };
      if (notes.trim()) body.notes = notes.trim();
      if (chain === "SOLANA_MAINNET") body.confirm = confirm;
      const res = await fetch(`/api/admin/bank/tokens/${token.id}/deploy`, {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Deploy failed");
      setResult({ ok: true, msg: `Deployed: ${j.deployment.mintAddress}` });
      setNotes(""); setConfirm("");
      onChanged();
    } catch (e: any) {
      setResult({ ok: false, msg: e?.message || "Deploy failed" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel icon={<Rocket className="h-4 w-4 text-emerald-300" />} title="Deploy" tone="border-emerald-400/20 bg-emerald-400/5">
      {available.length === 0 ? (
        <div className="text-white/50">All chains already have a deployment. Use Promote to create on a different chain.</div>
      ) : (
        <>
          <select value={chain} onChange={(e) => setChain(e.target.value as ChainId)} className={inputCls}>
            {available.map((c) => <option key={c} value={c}>{CHAIN_LABEL[c]}</option>)}
          </select>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="notes (optional)" maxLength={500} className={inputCls} />
          <ConfirmInput chain={chain} action="DEPLOY" symbol={token.symbol} value={confirm} onChange={setConfirm} />
          <Status ok={result?.ok ?? null} msg={result?.msg ?? null} />
          <button onClick={submit} disabled={busy} className={btnCls}>
            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Rocket className="h-3 w-3" />}
            Deploy on {CHAIN_LABEL[chain]}
          </button>
        </>
      )}
    </Panel>
  );
}

function MintPanel({ token, onChanged }: Props) {
  const deployed = chainsWithDeploy(token);
  const [chain, setChain] = useState<ChainId>(deployed[0] ?? "SOLANA_DEVNET");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const dep = useMemo(() => token.deployments.find((d) => d.chain === chain), [token, chain]);

  async function submit() {
    setBusy(true); setResult(null);
    try {
      const body: any = { chain, recipient: recipient.trim(), amount: amount.trim() };
      if (chain === "SOLANA_MAINNET") body.confirm = confirm;
      const res = await fetch(`/api/admin/bank/tokens/${token.id}/mint`, {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Mint failed");
      setResult({ ok: true, msg: `Minted ${j.amount} → ${j.ata.slice(0, 8)}… (sig ${j.signature.slice(0, 8)}…)` });
      setRecipient(""); setAmount(""); setConfirm("");
      onChanged();
    } catch (e: any) {
      setResult({ ok: false, msg: e?.message || "Mint failed" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel icon={<Coins className="h-4 w-4 text-amber-300" />} title="Mint" tone="border-amber-400/20 bg-amber-400/5">
      {deployed.length === 0 ? (
        <div className="text-white/50">No active deployments. Deploy first.</div>
      ) : (
        <>
          <select value={chain} onChange={(e) => setChain(e.target.value as ChainId)} className={inputCls}>
            {deployed.map((c) => <option key={c} value={c}>{CHAIN_LABEL[c]}</option>)}
          </select>
          <input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="recipient Solana address" className={inputCls + " font-mono"} />
          <input value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))} placeholder="amount (base units)" className={inputCls + " font-mono"} />
          {dep && <div className="text-[10px] text-white/40 font-mono">supplyMinted: {dep.supplyMinted}{token.supplyCap ? ` / ${token.supplyCap}` : ""}</div>}
          <ConfirmInput chain={chain} action="MINT" symbol={token.symbol} value={confirm} onChange={setConfirm} />
          <Status ok={result?.ok ?? null} msg={result?.msg ?? null} />
          <button onClick={submit} disabled={busy || !recipient || !amount} className={btnCls.replace("emerald", "amber") + " text-black"}>
            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Coins className="h-3 w-3" />}
            Mint
          </button>
        </>
      )}
    </Panel>
  );
}

function RevokePanel({ token, onChanged }: Props) {
  const deployed = chainsWithDeploy(token);
  const [chain, setChain] = useState<ChainId>(deployed[0] ?? "SOLANA_DEVNET");
  const [authority, setAuthority] = useState<"MINT" | "FREEZE">("MINT");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  async function submit() {
    if (!window.confirm(`Revoke ${authority} authority on ${CHAIN_LABEL[chain]}? This is permanent.`)) return;
    setBusy(true); setResult(null);
    try {
      const body: any = { chain, authority };
      if (chain === "SOLANA_MAINNET") body.confirm = confirm;
      const res = await fetch(`/api/admin/bank/tokens/${token.id}/revoke-authority`, {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Revoke failed");
      setResult({ ok: true, msg: `Revoked ${authority} (sig ${j.signature.slice(0, 8)}…)` });
      setConfirm("");
      onChanged();
    } catch (e: any) {
      setResult({ ok: false, msg: e?.message || "Revoke failed" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel icon={<ShieldOff className="h-4 w-4 text-rose-300" />} title="Revoke authority" tone="border-rose-400/20 bg-rose-400/5">
      {deployed.length === 0 ? (
        <div className="text-white/50">No active deployments.</div>
      ) : (
        <>
          <select value={chain} onChange={(e) => setChain(e.target.value as ChainId)} className={inputCls}>
            {deployed.map((c) => <option key={c} value={c}>{CHAIN_LABEL[c]}</option>)}
          </select>
          <select value={authority} onChange={(e) => setAuthority(e.target.value as "MINT" | "FREEZE")} className={inputCls}>
            <option value="MINT">MINT (also freezes deployment)</option>
            <option value="FREEZE">FREEZE</option>
          </select>
          <ConfirmInput
            chain={chain}
            action={authority === "MINT" ? "REVOKE_MINT" : "REVOKE_FREEZE"}
            symbol={token.symbol}
            value={confirm}
            onChange={setConfirm}
          />
          <Status ok={result?.ok ?? null} msg={result?.msg ?? null} />
          <button onClick={submit} disabled={busy} className={dangerBtnCls}>
            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <ShieldOff className="h-3 w-3" />}
            Revoke {authority}
          </button>
        </>
      )}
    </Panel>
  );
}

function PromotePanel({ token, onChanged }: Props) {
  const sources = chainsWithDeploy(token);
  const [fromChain, setFromChain] = useState<ChainId>(sources[0] ?? "SOLANA_DEVNET");
  const targetsFor = (from: ChainId): ChainId[] => {
    if (from === "SOLANA_DEVNET") return ["SOLANA_TESTNET", "SOLANA_MAINNET"];
    if (from === "SOLANA_TESTNET") return ["SOLANA_MAINNET"];
    return [];
  };
  const have = new Set(token.deployments.map((d) => d.chain));
  const validTargets = targetsFor(fromChain).filter((c) => !have.has(c));
  const [toChain, setToChain] = useState<ChainId>(validTargets[0] ?? "SOLANA_MAINNET");
  const [notes, setNotes] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  async function submit() {
    setBusy(true); setResult(null);
    try {
      const body: any = { fromChain, toChain };
      if (notes.trim()) body.notes = notes.trim();
      if (toChain === "SOLANA_MAINNET") body.confirm = confirm;
      const res = await fetch(`/api/admin/bank/tokens/${token.id}/promote`, {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Promote failed");
      setResult({ ok: true, msg: `Promoted to ${CHAIN_LABEL[toChain]}: ${j.deployment.mintAddress}` });
      setNotes(""); setConfirm("");
      onChanged();
    } catch (e: any) {
      setResult({ ok: false, msg: e?.message || "Promote failed" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel icon={<ArrowUpRight className="h-4 w-4 text-cyan-300" />} title="Promote to next chain" tone="border-cyan-400/20 bg-cyan-400/5">
      {sources.length === 0 || validTargets.length === 0 ? (
        <div className="text-white/50">{sources.length === 0 ? "Deploy on Devnet first." : "No promotion targets available."}</div>
      ) : (
        <>
          <select value={fromChain} onChange={(e) => { setFromChain(e.target.value as ChainId); }} className={inputCls}>
            {sources.map((c) => <option key={c} value={c}>From {CHAIN_LABEL[c]}</option>)}
          </select>
          <select value={toChain} onChange={(e) => setToChain(e.target.value as ChainId)} className={inputCls}>
            {validTargets.map((c) => <option key={c} value={c}>To {CHAIN_LABEL[c]}</option>)}
          </select>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="notes (optional)" maxLength={500} className={inputCls} />
          <ConfirmInput chain={toChain} action="PROMOTE" symbol={token.symbol} value={confirm} onChange={setConfirm} />
          <Status ok={result?.ok ?? null} msg={result?.msg ?? null} />
          <button onClick={submit} disabled={busy} className={btnCls.replace("emerald", "cyan")}>
            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <ArrowUpRight className="h-3 w-3" />}
            Promote
          </button>
        </>
      )}
    </Panel>
  );
}
