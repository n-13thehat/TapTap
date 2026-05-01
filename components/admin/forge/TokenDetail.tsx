"use client";

import { useEffect, useState } from "react";
import { Eye, RefreshCw, Coins, History, AlertTriangle, GitBranch } from "lucide-react";
import type { TokenDetail } from "./types";
import { CHAIN_LABEL, CHAIN_TONE, KIND_TONE, STATUS_TONE, shortAddr } from "./types";
import TokenActions from "./TokenActions";

interface Props {
  tokenId: string;
  onChanged: () => void;
}

export default function TokenDetailView({ tokenId, onChanged }: Props) {
  const [data, setData] = useState<TokenDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/bank/tokens/${tokenId}`, { cache: "no-store" });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Failed");
      setData(j.token);
    } catch (e: any) {
      setError(e?.message || "Failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, [tokenId]);

  if (error) {
    return (
      <section className="rounded-xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-200">
        <div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> {error}</div>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-white/50">
        Loading token…
      </section>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <Eye className="h-5 w-5 text-cyan-300" />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xl font-bold text-white">{data.symbol}</span>
                <span className="text-white/70">{data.name}</span>
                <span className={`rounded px-2 py-0.5 text-[10px] uppercase tracking-wide border ${KIND_TONE[data.kind]}`}>{data.kind}</span>
                <span className={`rounded px-2 py-0.5 text-[10px] uppercase tracking-wide border ${STATUS_TONE[data.status] ?? STATUS_TONE.DRAFT}`}>{data.status}</span>
              </div>
              {data.parent && (
                <div className="mt-1 text-[11px] text-white/50 inline-flex items-center gap-1">
                  <GitBranch className="h-3 w-3" /> child of <span className="font-mono">{data.parent.symbol}</span>
                </div>
              )}
              {data.description && <div className="mt-1 text-xs text-white/60 max-w-xl">{data.description}</div>}
            </div>
          </div>
          <button onClick={() => { refresh(); onChanged(); }} disabled={loading} className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10 disabled:opacity-50">
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>

        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
          <Mini label="Decimals" value={String(data.decimals)} />
          <Mini label="Supply cap" value={data.supplyCap ?? "∞"} />
          <Mini label="Holder cap" value={data.holderCap ? String(data.holderCap) : "∞"} />
          <Mini label="Freeze on deploy" value={data.freezeOnDeploy ? "yes" : "no"} />
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Coins className="h-5 w-5 text-amber-300" />
          <h3 className="text-sm font-semibold">Deployments</h3>
        </div>
        {data.deployments.length === 0 ? (
          <div className="rounded border border-white/10 bg-black/30 p-4 text-center text-xs text-white/50">
            No on-chain deployments yet. Use the Deploy panel below.
          </div>
        ) : (
          <div className="space-y-2">
            {data.deployments.map((d) => (
              <div key={d.id} className="rounded border border-white/10 bg-black/30 p-3 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`rounded px-1.5 py-0.5 text-[10px] uppercase tracking-wide border ${CHAIN_TONE[d.chain]}`}>{CHAIN_LABEL[d.chain]}</span>
                    <span className={`rounded px-1.5 py-0.5 text-[10px] uppercase tracking-wide border ${STATUS_TONE[d.status] ?? ""}`}>{d.status}</span>
                  </div>
                  <div className="text-[10px] text-white/40">{d.deployedAt ? new Date(d.deployedAt).toLocaleString() : "—"}</div>
                </div>
                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-1 font-mono text-[11px] text-white/70">
                  <Kv k="mint" v={d.mintAddress} />
                  <Kv k="mintAuth" v={d.mintAuthorityPubkey} muted={!d.mintAuthorityCipher && d.mintAuthorityCipher !== undefined} />
                  <Kv k="freezeAuth" v={d.freezeAuthorityPubkey ?? "—"} />
                  <Kv k="supplyMinted" v={d.supplyMinted} />
                  {d.txCreate && <Kv k="txCreate" v={d.txCreate} />}
                  {d.txFreeze && <Kv k="txFreeze" v={d.txFreeze} />}
                </div>
                {d.notes && <div className="mt-1 text-[10px] text-white/40 italic">{d.notes}</div>}
              </div>
            ))}
          </div>
        )}
      </section>

      <TokenActions token={data} onChanged={() => { refresh(); onChanged(); }} />

      <section className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center gap-2 mb-3">
          <History className="h-5 w-5 text-white/60" />
          <h3 className="text-sm font-semibold">Recent audit events</h3>
        </div>
        {data.recentAuditEvents.length === 0 ? (
          <div className="text-xs text-white/40">No events yet.</div>
        ) : (
          <ul className="space-y-1 text-[11px]">
            {data.recentAuditEvents.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-2 rounded border border-white/10 bg-black/30 px-2 py-1">
                <span className="font-mono text-white/80">{e.action}</span>
                <span className="text-white/40">{new Date(e.createdAt).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-white/10 bg-black/30 px-2 py-1.5">
      <div className="text-[10px] uppercase tracking-wide text-white/40">{label}</div>
      <div className="font-mono text-white/90 truncate">{value}</div>
    </div>
  );
}

function Kv({ k, v, muted }: { k: string; v: string; muted?: boolean }) {
  return (
    <div className={`flex items-center gap-2 ${muted ? "opacity-50" : ""}`}>
      <span className="text-white/40">{k}</span>
      <span className="truncate" title={v}>{shortAddr(v, 6, 6)}</span>
    </div>
  );
}
