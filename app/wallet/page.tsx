"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  ArrowRightLeft,
  BellRing,
  Coins,
  ExternalLink,
  HandCoins,
  Landmark,
  QrCode,
  Search,
  Send,
  Shield,
  ShieldCheck,
  Sparkles,
  Wallet2,
  Zap,
} from "lucide-react";

type Bill = { name: string; value: number; color: string };
type TxKind = "tip_sent" | "tip_received" | "airdrop" | "market_buy" | "market_sell" | "swap" | "deposit" | "withdraw";

type Tx = {
  id: string;
  kind: TxKind;
  label: string;
  tap: number;
  sol?: number;
  usd?: number;
  counterparty?: string;
  status: "completed" | "pending" | "failed";
  ts: string;
  tax?: { burn: number; reserve: number; receiver: number; pct: number; waived?: boolean };
};

const BILLS: Bill[] = [
  { name: "Rhodium", value: 10000, color: "text-indigo-200" },
  { name: "Diamond", value: 5000, color: "text-amber-200" },
  { name: "Platinum", value: 1000, color: "text-sky-200" },
  { name: "Gold", value: 500, color: "text-yellow-200" },
  { name: "Silver", value: 100, color: "text-gray-200" },
  { name: "Bronze", value: 50, color: "text-orange-200" },
];

const TXS: Tx[] = [
  { id: "tx1", kind: "tip_received", label: "Tip from @fan", tap: 50, status: "completed", ts: "2m ago" },
  { id: "tx2", kind: "market_sell", label: "Poster sold: Neon Orbit", tap: 910, status: "completed", ts: "30m ago", tax: { burn: 30, reserve: 60, receiver: 910, pct: 9 } },
  { id: "tx3", kind: "market_buy", label: "Bought Flux Bundle", tap: -1000, status: "completed", ts: "1h ago", tax: { burn: 30, reserve: 60, receiver: 910, pct: 9 } },
  { id: "tx4", kind: "swap", label: "Swap TAP → SOL", tap: -200, sol: 0.8, status: "completed", ts: "3h ago" },
  { id: "tx5", kind: "airdrop", label: "Airdrop from @creator", tap: 100, status: "completed", ts: "1d ago" },
  { id: "tx6", kind: "deposit", label: "Beta grant", tap: 1000, status: "completed", ts: "2d ago" },
  { id: "tx7", kind: "withdraw", label: "Withdraw to Venmo", tap: -500, usd: -12.5, status: "pending", ts: "2d ago" },
];

const AGENT_MSGS = [
  { agent: "Vault", body: "+75 TAP today (tips + sales). Balance packed into 1 Platinum + 1 Silver.", tone: "text-emerald-300" },
  { agent: "Flux", body: "Your poster sale hit normal vortex: 3% burn, 6% reserve, 91% to you.", tone: "text-amber-300" },
  { agent: "Serenity", body: "Fans tipped 1 Platinum bill today. Want to thank them on Social?", tone: "text-cyan-300" },
  { agent: "Broker", body: "Two posters you follow are in a 0% tax window. Prime time to buy.", tone: "text-indigo-300" },
];

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">{children}</span>;
}

function BillStack({ tap }: { tap: number }) {
  const bills = useMemo(() => {
    const out: { name: string; count: number; color: string }[] = [];
    let remaining = tap;
    for (const b of BILLS) {
      const count = Math.floor(remaining / b.value);
      if (count > 0) out.push({ name: b.name, count, color: b.color });
      remaining -= count * b.value;
    }
    return out;
  }, [tap]);

  if (!bills.length) return <span className="text-xs text-white/60">No bills</span>;
  return (
    <div className="flex flex-wrap gap-2 text-xs">
      {bills.map((b) => (
        <span key={b.name} className={`rounded-full border border-white/10 bg-white/5 px-2 py-1 ${b.color}`}>
          {b.count} × {b.name}
        </span>
      ))}
    </div>
  );
}

function BalanceCard({ title, value, subtitle, icon: Icon }: { title: string; value: string; subtitle: string; icon: any }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-2 text-sm text-white/70">
        <Icon className="h-4 w-4 text-emerald-300" />
        {title}
      </div>
      <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
      <div className="text-xs text-white/60">{subtitle}</div>
    </div>
  );
}

function ActionBar() {
  const actions = [
    { label: "Receive / Deposit", icon: QrCode },
    { label: "Send", icon: Send },
    { label: "Convert Bills", icon: HandCoins },
    { label: "Swap TAP ↔ SOL", icon: ArrowRightLeft },
    { label: "Withdraw (Venmo)", icon: Landmark },
    { label: "View Tokenomics", icon: Shield },
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((a) => (
        <button key={a.label} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:border-emerald-400/40 hover:bg-emerald-500/10">
          <a.icon className="h-4 w-4" />
          {a.label}
        </button>
      ))}
    </div>
  );
}

function TxRow({ tx }: { tx: Tx }) {
  const icon =
    tx.kind === "tip_sent" || tx.kind === "tip_received" ? <HandCoins className="h-4 w-4 text-emerald-300" /> :
    tx.kind === "airdrop" ? <Sparkles className="h-4 w-4 text-cyan-300" /> :
    tx.kind === "market_buy" || tx.kind === "market_sell" ? <ShoppingIcon /> :
    tx.kind === "swap" ? <ArrowRightLeft className="h-4 w-4 text-amber-300" /> :
    tx.kind === "withdraw" ? <ExternalLink className="h-4 w-4 text-white/60" /> :
    <Wallet2 className="h-4 w-4 text-white/60" />;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/40 p-3 text-sm text-white/80">
      {icon}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-white">{tx.label}</span>
          {tx.counterparty && <Pill>{tx.counterparty}</Pill>}
        </div>
        <div className="text-xs text-white/60">{tx.ts}</div>
        {tx.tax && (
          <div className="mt-1 text-[11px] text-white/60">
            Vortex: {tx.tax.pct}% — Burn {tx.tax.burn} TAP · Reserve {tx.tax.reserve} TAP · Receiver {tx.tax.receiver} TAP {tx.tax.waived ? "(0% window)" : ""}
          </div>
        )}
      </div>
      <div className="text-right text-sm font-mono">
        <div className={tx.tap >= 0 ? "text-emerald-300" : "text-amber-300"}>
          {tx.tap >= 0 ? "+" : ""}{tx.tap} TAP
        </div>
        {tx.sol !== undefined && <div className="text-xs text-white/60">{tx.sol > 0 ? "+" : ""}{tx.sol} SOL</div>}
        {tx.usd !== undefined && <div className="text-xs text-white/60">{tx.usd > 0 ? "+" : ""}${Math.abs(tx.usd).toFixed(2)}</div>}
        <span className="text-[11px] uppercase text-white/50">{tx.status}</span>
      </div>
    </div>
  );
}

function ShoppingIcon() {
  return <Wallet2 className="h-4 w-4 text-emerald-300" />;
}

function AgentPanel() {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        <BellRing className="h-4 w-4 text-cyan-300" />
        Agent DMs
      </div>
      <div className="space-y-2">
        {AGENT_MSGS.map((m, i) => (
          <div key={i} className="rounded-lg border border-white/10 bg-black/40 p-2 text-xs text-white/80">
            <div className={`font-semibold ${m.tone}`}>{m.agent}</div>
            <div>{m.body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Filters({ active, onChange }: { active: string; onChange: (f: string) => void }) {
  const filters = ["all", "earnings", "spending", "swaps", "withdrawals"];
  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((f) => (
        <button
          key={f}
          onClick={() => onChange(f)}
          className={`rounded-full border px-3 py-1 text-xs ${active === f ? "border-emerald-400/50 bg-emerald-500/10 text-white" : "border-white/10 bg-white/5 text-white/70"}`}
        >
          {f[0].toUpperCase() + f.slice(1)}
        </button>
      ))}
    </div>
  );
}

export default function WalletPage() {
  const [viewBills, setViewBills] = useState(true);
  const [filter, setFilter] = useState("all");
  const tapBalance = 13500; // example: 13,500 TAP
  const solBalance = 1.2;
  const stx = tapBalance / 100;

  const filteredTxs = useMemo(() => {
    if (filter === "all") return TXS;
    if (filter === "earnings") return TXS.filter((t) => t.tap > 0);
    if (filter === "spending") return TXS.filter((t) => t.tap < 0);
    if (filter === "swaps") return TXS.filter((t) => t.kind === "swap");
    if (filter === "withdrawals") return TXS.filter((t) => t.kind === "withdraw");
    return TXS;
  }, [filter]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-black text-white">
      <div className="border-b border-white/10 bg-black/70 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-4 space-y-3">
          <div className="flex items-center gap-3">
            <Wallet2 className="h-6 w-6 text-emerald-300" />
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-white/50">TapTap Wallet</div>
              <div className="text-2xl font-bold text-white">TAP, Statix Bills, SOL bridge</div>
            </div>
          </div>
          <div className="text-sm text-white/70">
            TAP/Tors balance with Statix Bills view. Social actions (tips/airdrops) = 0% vortex extraction; commerce (Marketplace, swaps) = 3% burn, 6% Reserve, 91% receiver.
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        <div className="grid gap-3 md:grid-cols-3">
          <BalanceCard title="TAP (Tors)" value={`${tapBalance.toLocaleString()} TAP`} subtitle={`≈ ${stx.toFixed(2)} STX`} icon={Coins} />
          <BalanceCard title="SOL (bridge)" value={`${solBalance.toFixed(2)} SOL`} subtitle="For swaps & withdrawals" icon={Landmark} />
          <BalanceCard title="Bills view" value={viewBills ? "On" : "Raw only"} subtitle="Bronze → Rhodium breakdown" icon={ShieldCheck} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ActionBar />
          <button
            onClick={() => setViewBills((v) => !v)}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:border-emerald-400/40 hover:bg-emerald-500/10"
          >
            Toggle Bills
          </button>
        </div>

        {viewBills && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Sparkles className="h-4 w-4 text-emerald-300" /> Bills breakdown
            </div>
            <BillStack tap={tapBalance} />
            <div className="text-xs text-white/60">1 STX = 100 TAP. Bills auto-pack; use “Convert Bills” to break or consolidate.</div>
          </div>
        )}

        <div className="grid gap-3 lg:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Activity className="h-4 w-4 text-emerald-300" /> Transactions
              </div>
              <Filters active={filter} onChange={setFilter} />
            </div>
            <div className="space-y-2">
              {filteredTxs.map((t) => (
                <TxRow key={t.id} tx={t} />
              ))}
              {!filteredTxs.length && (
                <div className="rounded-lg border border-dashed border-white/15 bg-white/5 p-4 text-sm text-white/70">
                  No transactions yet. Earn TAP via tips/airdrops or try a purchase in Marketplace.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <AgentPanel />
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Zap className="h-4 w-4 text-amber-300" />
                Tokenomics snapshot
              </div>
              <div className="text-xs text-white/70">
                Commerce vortex: 3% burn (Flux), 6% Trap Reserve, 91% receiver. Social actions (tips, likes, airdrops) = 0% extraction. Rare windows drop effective tax to 0% on eligible buys.
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-white/60">
                <Pill>0% tax windows</Pill>
                <Pill>Reserve inflow</Pill>
                <Pill>Burn pool</Pill>
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <HandCoins className="h-4 w-4 text-emerald-300" />
                Beta grant
              </div>
              <div className="text-xs text-white/70">
                If you’re a beta user, you’ll see your 1000 TAP (10 STX, 1 Platinum) allocation here. Vault will DM when it lands.
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
