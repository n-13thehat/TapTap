"use client";

import { useEffect, useMemo, useState } from "react";
import { Shield, Flame, Waves, Send, RadioTower, Cpu, Wallet2, KeyRound, CreditCard } from "lucide-react";

type TrapSummary = {
  kpis: {
    grossVolume: string;
    taxCollected: string;
    toTreasury: string;
    burned: string;
    tipsVolume: string;
  };
  trap: { userId: string | null; wallet: string | null; balance: string };
};

function formatNum(v: string | number) {
  const n = typeof v === "number" ? v : Number(v || 0);
  if (!Number.isFinite(n)) return "0";
  return n.toLocaleString();
}

export default function TrapPage() {
  const [data, setData] = useState<TrapSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [airdrop, setAirdrop] = useState({ to: "", amount: "" });
  const [nfc, setNfc] = useState({ payload: "" });
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/treasury/summary");
        if (res.ok) {
          const json = (await res.json()) as TrapSummary;
          setData(json);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const trapBalance = useMemo(() => formatNum(data?.trap?.balance || 0), [data]);

  async function triggerAirdrop() {
    if (!airdrop.to || !airdrop.amount) return setNote("Enter destination and amount.");
    setNote("Sending airdrop...");
    try {
      const res = await fetch("/api/treasure/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: airdrop.to, amount: Number(airdrop.amount), reason: "AIRDROP" }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setNote(`Airdrop failed: ${err?.error || res.statusText}`);
        return;
      }
      setNote("Airdrop queued via Treasure.");
    } catch (e: any) {
      setNote(`Airdrop failed: ${e?.message || e}`);
    }
  }

  async function writeNfc() {
    if (!nfc.payload) return setNote("Enter NFC payload.");
    setNote("Writing NFC (browser will prompt for NFC access)...");
    try {
      // Web NFC is only available on supporting devices/browsers.
      // This is a lightweight helper to encode the payload as text.
      const anyNav = navigator as any;
      if (!anyNav?.nfc) {
        setNote("Web NFC not supported in this browser.");
        return;
      }
      const ndef = new anyNav.nfc.NDEFReader();
      await ndef.write({ records: [{ recordType: "text", data: nfc.payload }] });
      setNote("NFC write complete.");
    } catch (e: any) {
      setNote(`NFC write failed: ${e?.message || e}`);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white px-6 py-6">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-emerald-300" />
            <div>
              <div className="text-sm uppercase tracking-[0.2em] text-emerald-200">Admin</div>
              <h1 className="text-3xl font-bold text-white">The Trap</h1>
              <p className="text-white/60">Treasury view, vortex tax, airdrops, NFC writer.</p>
            </div>
          </div>
          <div className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-100">
            TAP_MINT: {process.env.NEXT_PUBLIC_TAP_MINT || process.env.TAP_MINT_ADDRESS || "devnet"}
          </div>
        </header>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Card icon={<Wallet2 className="h-5 w-5 text-emerald-300" />} title="Trap Balance" value={`${trapBalance} TAP`}>
            <p className="text-xs text-white/50">From TapTax Treasury credits.</p>
          </Card>
          <Card icon={<Flame className="h-5 w-5 text-orange-300" />} title="Burned (3%)" value={formatNum(data?.kpis.burned || 0)} />
          <Card icon={<Waves className="h-5 w-5 text-cyan-300" />} title="Tax Collected (9%)" value={formatNum(data?.kpis.taxCollected || 0)} />
          <Card icon={<Send className="h-5 w-5 text-pink-300" />} title="Tips (0% tax)" value={formatNum(data?.kpis.tipsVolume || 0)} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Airdrop control */}
          <section className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <RadioTower className="h-5 w-5 text-emerald-300" />
              <h2 className="text-lg font-semibold">Airdrop Control</h2>
              <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] uppercase tracking-wide text-emerald-200">TapTax exempt</span>
            </div>
            <div className="space-y-3">
              <input
                className="w-full rounded border border-white/20 bg-black/40 px-3 py-2 text-sm"
                placeholder="Recipient wallet"
                value={airdrop.to}
                onChange={(e) => setAirdrop((s) => ({ ...s, to: e.target.value }))}
              />
              <input
                className="w-full rounded border border-white/20 bg-black/40 px-3 py-2 text-sm"
                placeholder="Amount (TAP)"
                value={airdrop.amount}
                onChange={(e) => setAirdrop((s) => ({ ...s, amount: e.target.value }))}
              />
              <button
                onClick={triggerAirdrop}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold hover:bg-emerald-700"
              >
                <Send className="h-4 w-4" />
                Send Airdrop via Treasure
              </button>
              <p className="text-xs text-white/60">
                Uses `/api/treasure/send` (reason=AIRDROP). Ensure the TapTax treasury wallet is funded and auth is ADMIN-gated.
              </p>
            </div>
          </section>

          {/* NFC writer */}
          <section className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Cpu className="h-5 w-5 text-emerald-300" />
              <h2 className="text-lg font-semibold">Write Physical TAP (NFC)</h2>
              <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white/70">Web NFC</span>
            </div>
            <div className="space-y-3">
              <textarea
                className="w-full rounded border border-white/20 bg-black/40 px-3 py-2 text-sm"
                placeholder="Payload (e.g., TAP URI, redemption code, wallet link)"
                rows={3}
                value={nfc.payload}
                onChange={(e) => setNfc({ payload: e.target.value })}
              />
              <button
                onClick={writeNfc}
                className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold hover:bg-teal-700"
              >
                <KeyRound className="h-4 w-4" />
                Write NFC
              </button>
              <p className="text-xs text-white/60">
                Requires a Web NFC-capable device/browser. Encodes text payload to the NFC tag for physical TAPs.
              </p>
            </div>
          </section>
        </div>

        <section className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="h-5 w-5 text-emerald-300" />
            <h2 className="text-lg font-semibold">Venmo / Offramp Notes</h2>
          </div>
          <ul className="space-y-2 text-sm text-white/70">
            <li>Use marketplace buy with `paymentMethod: "venmo"` to generate approval URLs.</li>
            <li>TapTax treasury address: {data?.trap.wallet || "set TREASURY_WALLET_ADDRESS"} (env).</li>
            <li>Trap balance reflects TapTax (6%) credits to treasury; ensure `TREASURY_USER_ID` is set for accurate accounting.</li>
            <li>For on-chain swaps, set `TAP_PRICE_USD`/`SOL_PRICE_USD` and keep TAP mint envs configured.</li>
          </ul>
        </section>

        {note ? (
          <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">{note}</div>
        ) : null}

        {loading && <div className="text-white/60 text-sm">Loading trap metrics…</div>}
      </div>
    </main>
  );
}

function Card({ icon, title, value, children }: { icon: React.ReactNode; title: string; value: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-2 text-sm text-white/60">
        {icon}
        <span>{title}</span>
      </div>
      <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
      {children}
    </div>
  );
}
