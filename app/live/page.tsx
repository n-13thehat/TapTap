"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  BellRing,
  Calendar,
  Flame,
  HandCoins,
  Layers,
  Mic2,
  Music2,
  Play,
  Sparkles,
  Ticket,
  Users,
  Wand2,
  Zap,
} from "lucide-react";
import { RouteFeatureGate } from "@/components/RouteFeatureGate";

type Mode = "connect" | "stage";
type GateType = "free" | "ticket";

type Show = {
  id: string;
  title: string;
  host: string;
  start: string;
  mode: Mode;
  gate: GateType;
  priceTap?: number;
  bill?: string;
  badge?: string;
  tips?: number;
};

const CONNECT: Show[] = [
  { id: "c1", title: "Late Night Hang", host: "Trinity", start: "Live · 2.4k", mode: "connect", gate: "free", badge: "Free", tips: 210 },
  { id: "c2", title: "Freestyle Q&A", host: "Neo", start: "Live · 1.1k", mode: "connect", gate: "free", badge: "Free", tips: 120 },
];

const STAGE: Show[] = [
  { id: "s1", title: "Midnight Session", host: "TapTap Collective", start: "Starts in 22m", mode: "stage", gate: "ticket", priceTap: 100, bill: "Silver (100 TAP)", badge: "Ticketed" },
  { id: "s2", title: "Battle Royale", host: "Seraph", start: "Live now", mode: "stage", gate: "ticket", priceTap: 500, bill: "Gold (500 TAP)", badge: "Ticketed" },
  { id: "s3", title: "Open Stage", host: "Pulse", start: "Tomorrow 8 PM", mode: "stage", gate: "free", bill: "Free", badge: "Free" },
];

const AGENT_MSGS = [
  { agent: "Maestro", body: "Your Stage show is set at 1 Silver (100 TAP). Want a Social promo?", tone: "text-emerald-300" },
  { agent: "Vault", body: "+9,100 TAP from tickets (1 Platinum each). Tips remain fee-free.", tone: "text-cyan-300" },
  { agent: "Flux", body: "Commerce: 3% burn, 6% Reserve, 91% creator. Tips: 0% extraction.", tone: "text-amber-300" },
  { agent: "Serenity", body: "Fans tipped 320 TAP in your Connect stream. Want to thank them?", tone: "text-indigo-300" },
];

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">{children}</span>;
}

function ShowCard({ show }: { show: Show }) {
  const ticketText = show.gate === "free" ? "Free entry" : `Ticket: ${show.bill}`;
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2 hover:-translate-y-1 hover:border-emerald-400/40 hover:bg-white/10 transition">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="text-sm font-semibold text-white">{show.title}</div>
          <div className="text-xs text-white/60">{show.host} · {show.start}</div>
        </div>
        <Pill>{show.badge}</Pill>
      </div>
      <div className="text-xs text-white/60">
        {show.mode === "stage" ? "Stage · performance" : "Connect · hangout"}
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs text-white/70">
        <Ticket className="h-4 w-4 text-amber-300" />
        <span>{ticketText}</span>
        {show.gate === "ticket" && <span className="text-white/50">(Vortex 3/6/91 auto-applied)</span>}
      </div>
      <div className="flex items-center gap-2">
        <button className="rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-100 hover:bg-emerald-500/20">
          {show.start.includes("Live") ? "Join" : "Remind me"}
        </button>
        {show.gate === "ticket" && (
          <button className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/80 hover:bg-white/10">
            Buy ticket
          </button>
        )}
        {show.tips !== undefined && (
          <span className="text-xs text-white/60">Tips: {show.tips} TAP (0%)</span>
        )}
      </div>
    </div>
  );
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

export default function LivePage() {
  const [mode, setMode] = useState<Mode>("connect");
  const shows = useMemo(() => (mode === "connect" ? CONNECT : STAGE), [mode]);

  return (
    <RouteFeatureGate
      flag="liveStage"
      title="Live is currently gated"
      description="Enable the liveStage flag in the feature service to open this page."
    >
      <main className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-black text-white">
      <div className="border-b border-white/10 bg-black/70 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-4 space-y-3">
          <div className="flex items-center gap-3">
            <Layers className="h-6 w-6 text-emerald-300" />
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-white/50">TapTap Live</div>
              <div className="text-2xl font-bold text-white">Connect vs Stage</div>
            </div>
          </div>
          <div className="text-sm text-white/70">
            Creator-controlled gating: Connect hangs (free, tips 0% vortex) and Stage shows (tickets in TAP/Bills with 3% burn / 6% Reserve / 91% creator). Tips in Stage stay 0% vortex.
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => setMode("connect")} className={`rounded-full border px-3 py-1 text-sm ${mode === "connect" ? "border-emerald-400/50 bg-emerald-500/10 text-white" : "border-white/10 bg-white/5 text-white/70"}`}>
              Live Connect
            </button>
            <button onClick={() => setMode("stage")} className={`rounded-full border px-3 py-1 text-sm ${mode === "stage" ? "border-emerald-400/50 bg-emerald-500/10 text-white" : "border-white/10 bg-white/5 text-white/70"}`}>
              Live Stage
            </button>
            <button className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/80 hover:border-emerald-400/40 hover:bg-emerald-500/10">
              Go Live
            </button>
            <Pill>Tickets = commerce</Pill>
            <Pill>Tips = social</Pill>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-white">{mode === "connect" ? "Connect streams" : "Stage shows"}</div>
              <div className="text-xs text-white/60">{mode === "connect" ? "Swipe-in hangs, tips 0% vortex" : "Tickets apply 3/6/91; tips stay 0%"}</div>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/60">
              <Calendar className="h-4 w-4" />
              Upcoming + live
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {shows.map((s) => (
              <ShowCard key={s.id} show={s} />
            ))}
          </div>
        </section>

        <div className="grid gap-3 lg:grid-cols-2">
          <AgentPanel />
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Ticket className="h-4 w-4 text-amber-300" />
              Gating options
            </div>
            <div className="text-xs text-white/70">
              Stage shows can be free or ticketed in TAP or bills: Bronze 50, Silver 100, Gold 500, Platinum 1000, Diamond 5000, Rhodium 10000. Commerce uses 3% burn / 6% Trap Reserve / 91% creator. Tips and hearts remain 0% vortex.
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-white/60">
              <Pill>Free</Pill>
              <Pill>Silver (100 TAP)</Pill>
              <Pill>Gold (500 TAP)</Pill>
              <Pill>Platinum (1000 TAP)</Pill>
              <Pill>Rhodium (10000 TAP)</Pill>
            </div>
          </div>
        </div>
      </div>
      </main>
    </RouteFeatureGate>
  );
}
