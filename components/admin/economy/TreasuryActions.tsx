"use client";

import { useState } from "react";
import { Coins, Send, Flame } from "lucide-react";

type Result = { ok?: boolean; error?: string; signature?: string; message?: string };

async function postJson(url: string, body: any): Promise<Result> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = await res.json().catch(() => null);
    if (!res.ok) return { error: j?.error || `HTTP ${res.status}` };
    return j as Result;
  } catch (e: any) {
    return { error: e?.message || "Request failed" };
  }
}

export default function TreasuryActions() {
  const [mint, setMint] = useState({ address: "", amount: "" });
  const [tx, setTx] = useState({ kind: "TAP" as "TAP" | "SOL", to: "", amount: "" });
  const [bn, setBn] = useState({ amount: "" });
  const [out, setOut] = useState<Record<string, string>>({});

  async function doMint() {
    if (!mint.address || !mint.amount) return setOut({ ...out, mint: "Enter address and amount" });
    setOut({ ...out, mint: "Minting…" });
    const r = await postJson("/api/admin/solana/mint-tap", { address: mint.address, amount: Number(mint.amount) });
    setOut({ ...out, mint: r.error ? `✗ ${r.error}` : `✓ minted ${mint.amount} TAP to ${mint.address.slice(0, 6)}…` });
  }

  async function doTransfer() {
    if (!tx.to || !tx.amount) return setOut({ ...out, transfer: "Enter destination and amount" });
    setOut({ ...out, transfer: "Sending…" });
    const r = await postJson("/api/admin/bank/transfer", {
      kind: tx.kind,
      toAddress: tx.to,
      amount: Number(tx.amount),
    });
    setOut({ ...out, transfer: r.error ? `✗ ${r.error}` : `✓ ${tx.kind} sent — sig ${r.signature?.slice(0, 12)}…` });
  }

  async function doBurn() {
    if (!bn.amount) return setOut({ ...out, burn: "Enter amount" });
    if (!confirm(`Burn ${bn.amount} TAP from treasury on-chain? This is irreversible.`)) return;
    setOut({ ...out, burn: "Burning…" });
    const r = await postJson("/api/admin/bank/burn", { amount: Number(bn.amount) });
    setOut({ ...out, burn: r.error ? `✗ ${r.error}` : `✓ burned — sig ${r.signature?.slice(0, 12)}…` });
  }

  return (
    <section className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Coins className="h-5 w-5 text-yellow-300" />
        <h2 className="text-lg font-semibold">Treasury Actions</h2>
        <span className="rounded bg-red-500/20 px-2 py-0.5 text-[10px] uppercase tracking-wide text-red-200">on-chain</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Block title="Mint TAP" icon={<Coins className="h-4 w-4 text-emerald-300" />}>
          <input className={input} placeholder="Recipient address" value={mint.address} onChange={(e) => setMint({ ...mint, address: e.target.value })} />
          <input className={input} placeholder="Amount" type="number" min="1" value={mint.amount} onChange={(e) => setMint({ ...mint, amount: e.target.value })} />
          <button onClick={doMint} className={btn("emerald")}><Coins className="h-4 w-4" /> Mint</button>
          <Note text={out.mint} />
        </Block>

        <Block title="Transfer from Treasury" icon={<Send className="h-4 w-4 text-cyan-300" />}>
          <select className={input} value={tx.kind} onChange={(e) => setTx({ ...tx, kind: e.target.value as any })}>
            <option value="TAP">TAP</option>
            <option value="SOL">SOL</option>
          </select>
          <input className={input} placeholder="Destination address" value={tx.to} onChange={(e) => setTx({ ...tx, to: e.target.value })} />
          <input className={input} placeholder="Amount" type="number" min="0" step="any" value={tx.amount} onChange={(e) => setTx({ ...tx, amount: e.target.value })} />
          <button onClick={doTransfer} className={btn("cyan")}><Send className="h-4 w-4" /> Send</button>
          <Note text={out.transfer} />
        </Block>

        <Block title="Burn TAP (on-chain)" icon={<Flame className="h-4 w-4 text-orange-300" />}>
          <input className={input} placeholder="Amount" type="number" min="1" value={bn.amount} onChange={(e) => setBn({ amount: e.target.value })} />
          <button onClick={doBurn} className={btn("orange")}><Flame className="h-4 w-4" /> Burn</button>
          <Note text={out.burn} />
          <p className="text-[10px] text-white/40">Reduces total supply on-chain. Irreversible.</p>
        </Block>
      </div>
    </section>
  );
}

const input = "w-full rounded border border-white/20 bg-black/40 px-3 py-2 text-sm";
const btn = (c: string) => `inline-flex items-center gap-2 rounded-lg bg-${c}-700 px-3 py-2 text-sm font-semibold hover:bg-${c}-800`;

function Block({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/30 p-3 space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium">{icon}<span>{title}</span></div>
      {children}
    </div>
  );
}

function Note({ text }: { text?: string }) {
  if (!text) return null;
  return <div className="rounded bg-black/40 px-2 py-1 text-[11px] text-white/70 break-words">{text}</div>;
}
