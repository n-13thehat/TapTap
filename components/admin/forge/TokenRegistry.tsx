"use client";

import { GitBranch, Coins, Layers } from "lucide-react";
import type { TokenSummary, TokenKind } from "./types";
import { CHAIN_LABEL, CHAIN_TONE, KIND_TONE, STATUS_TONE, shortAddr } from "./types";

interface Props {
  tokens: TokenSummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const KIND_ORDER: TokenKind[] = ["ROOT", "LAYER", "PARTNER", "EXPERIMENTAL"];

export default function TokenRegistry({ tokens, selectedId, onSelect }: Props) {
  // Group: top-level under each ROOT, then orphan kinds
  const byParent = new Map<string | null, TokenSummary[]>();
  for (const t of tokens) {
    const k = t.parentTokenId ?? null;
    if (!byParent.has(k)) byParent.set(k, []);
    byParent.get(k)!.push(t);
  }

  const tops = (byParent.get(null) ?? []).slice().sort((a, b) => {
    const ki = KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind);
    return ki !== 0 ? ki : a.symbol.localeCompare(b.symbol);
  });

  return (
    <section className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-fuchsia-300" />
          <h2 className="text-lg font-semibold">Token registry</h2>
          <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white/60">
            {tokens.length} tokens
          </span>
        </div>
      </div>

      {tops.length === 0 ? (
        <div className="rounded border border-white/10 bg-black/30 p-6 text-center text-xs text-white/50">
          No tokens yet. Forge a draft above to get started.
        </div>
      ) : (
        <ul className="space-y-2">
          {tops.map((t) => (
            <Row key={t.id} token={t} children={byParent.get(t.id) ?? []} byParent={byParent} depth={0} selectedId={selectedId} onSelect={onSelect} />
          ))}
        </ul>
      )}
    </section>
  );
}

interface RowProps {
  token: TokenSummary;
  children: TokenSummary[];
  byParent: Map<string | null, TokenSummary[]>;
  depth: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function Row({ token, children, byParent, depth, selectedId, onSelect }: RowProps) {
  const selected = selectedId === token.id;
  const grandkids = (id: string) => byParent.get(id) ?? [];
  return (
    <>
      <li>
        <button
          onClick={() => onSelect(token.id)}
          className={`w-full text-left rounded-lg border p-3 transition-colors ${
            selected
              ? "border-emerald-400/50 bg-emerald-400/10"
              : "border-white/10 bg-black/30 hover:border-white/20 hover:bg-white/5"
          }`}
          style={{ marginLeft: depth * 16 }}
        >
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 min-w-0">
              {depth > 0 && <GitBranch className="h-3 w-3 text-white/40 shrink-0" />}
              <Coins className="h-4 w-4 text-amber-300 shrink-0" />
              <span className="font-mono font-semibold text-white truncate">{token.symbol}</span>
              <span className="text-xs text-white/60 truncate">{token.name}</span>
            </div>
            <div className="flex flex-wrap items-center gap-1">
              <span className={`rounded px-1.5 py-0.5 text-[10px] uppercase tracking-wide border ${KIND_TONE[token.kind]}`}>{token.kind}</span>
              <span className={`rounded px-1.5 py-0.5 text-[10px] uppercase tracking-wide border ${STATUS_TONE[token.status] ?? STATUS_TONE.DRAFT}`}>{token.status}</span>
              {token._count?.children ? (
                <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-white/60">{token._count.children} children</span>
              ) : null}
            </div>
          </div>

          {token.deployments.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {token.deployments.map((d) => (
                <span
                  key={d.id}
                  className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] ${CHAIN_TONE[d.chain]}`}
                  title={d.mintAddress}
                >
                  {CHAIN_LABEL[d.chain]} · {shortAddr(d.mintAddress)} ·{" "}
                  <span className={`rounded px-1 ${STATUS_TONE[d.status] ?? ""}`}>{d.status}</span>
                </span>
              ))}
            </div>
          )}

          {token.supplyCap && (
            <div className="mt-1 text-[10px] text-white/40">
              cap {token.supplyCap} · decimals {token.decimals}
              {token.holderCap ? ` · holders ≤ ${token.holderCap}` : ""}
            </div>
          )}
        </button>
      </li>

      {children.map((c) => (
        <Row
          key={c.id}
          token={c}
          children={grandkids(c.id)}
          byParent={byParent}
          depth={depth + 1}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      ))}
    </>
  );
}
