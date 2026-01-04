"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  BellRing,
  CheckCircle2,
  HandCoins,
  Layers,
  MessageCircle,
  Search,
  Send,
  Sparkles,
  Ticket,
  Wallet2,
  Wand2,
  Zap,
} from "lucide-react";

type Thread = {
  id: string;
  name: string;
  role: "agent" | "user" | "system";
  badge?: string;
  preview: string;
  time: string;
  unread?: boolean;
};

type Message = {
  id: string;
  from: string;
  senderType: "agent" | "me" | "user";
  body: string;
  ts: string;
  actions?: { label: string }[];
  card?: {
    title: string;
    lines: string[];
    note?: string;
  };
};

const THREADS: Thread[] = [
  { id: "serenity", name: "Serenity (Social)", role: "agent", badge: "Agent", preview: "@fan tipped 1 Platinum on your post · Thank them?", time: "2m", unread: true },
  { id: "vault", name: "Vault (Wallet)", role: "agent", badge: "Agent", preview: "+9,100 TAP from Stage tickets (0% on tips)", time: "8m", unread: true },
  { id: "flux", name: "Flux (Tokenomics)", role: "agent", badge: "Agent", preview: "Commerce 3/6/91 applied on last sale", time: "18m" },
  { id: "broker", name: "Broker (Marketplace)", role: "agent", badge: "Agent", preview: "Offer: 30 TAP for Neon Orbit · Accept or Counter", time: "20m" },
  { id: "maestro", name: "Maestro (Live)", role: "agent", badge: "Agent", preview: "Stage show set to Silver gate · 37 tickets sold", time: "1h" },
  { id: "orion", name: "Orion (Surf)", role: "agent", badge: "Agent", preview: "Want a new Surf session: chill + underpriced posters?", time: "2h" },
  { id: "pulse", name: "Pulse (STEMStation)", role: "agent", badge: "Agent", preview: "Unlocked 3 new tracks for game mode", time: "6h" },
  { id: "fan1", name: "@fan_supporter", role: "user", preview: "Loved your drop! Any replay link?", time: "3h", unread: true },
  { id: "system", name: "TapTap System", role: "system", preview: "Maintenance window completed", time: "1d" },
];

const MESSAGES: Record<string, Message[]> = {
  serenity: [
    {
      id: "m1",
      from: "Serenity",
      senderType: "agent",
      body: "Your post “Midnight Horizon” is trending 3x above baseline. Want to pin it or send a thank-you?",
      ts: "2m ago",
      actions: [{ label: "View post" }, { label: "Pin post" }, { label: "Thank top tippers" }],
    },
    {
      id: "m2",
      from: "Serenity",
      senderType: "agent",
      body: "@fan tipped you 1 Platinum (1000 TAP). Tips are social — 0% vortex extraction.",
      ts: "10m ago",
      card: {
        title: "Tip received",
        lines: ["Amount: 1000 TAP (1 Platinum)", "Tax: 0% (social)", "Post: Midnight Horizon"],
      },
      actions: [{ label: "Open wallet" }, { label: "DM thank-you" }, { label: "Share to Social" }],
    },
  ],
  vault: [
    {
      id: "v1",
      from: "Vault",
      senderType: "agent",
      body: "+9,100 TAP from Stage tickets (1 Platinum gate × 100 tickets). Commerce vortex applied: 3% burn, 6% Reserve, 91% to you.",
      ts: "8m ago",
      card: {
        title: "Stage ticket settlement",
        lines: ["Gross: 10,000 TAP", "Burn: 300 TAP · Reserve: 600 TAP", "You: 9,100 TAP"],
        note: "Tips during show remain 0% vortex.",
      },
      actions: [{ label: "Open wallet" }, { label: "View show recap" }, { label: "Share recap" }],
    },
  ],
  broker: [
    {
      id: "b1",
      from: "Broker",
      senderType: "agent",
      body: "New offer: 30 TAP for ‘Neon Orbit’.",
      ts: "20m ago",
      actions: [{ label: "Accept" }, { label: "Counter" }, { label: "View listing" }],
    },
  ],
  maestro: [
    {
      id: "ma1",
      from: "Maestro",
      senderType: "agent",
      body: "Your Stage show starts in 30 minutes. Gate: 1 Silver (100 TAP). Tickets sold: 37.",
      ts: "1h ago",
      actions: [{ label: "Open Stage dashboard" }, { label: "Post teaser" }],
    },
  ],
  fan1: [
    {
      id: "f1",
      from: "@fan_supporter",
      senderType: "user",
      body: "Loved your drop! Any replay link?",
      ts: "3h ago",
      actions: [{ label: "Reply" }, { label: "Send replay" }],
    },
  ],
};

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">{children}</span>;
}

function ThreadRow({ t, active, onSelect }: { t: Thread; active: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left rounded-lg border px-3 py-2 transition ${
        active ? "border-emerald-400/40 bg-emerald-500/10" : "border-white/10 bg-white/5 hover:border-white/20"
      }`}
    >
      <div className="flex items-center justify-between text-sm">
        <span className="text-white font-semibold truncate">{t.name}</span>
        <span className="text-[11px] text-white/50">{t.time}</span>
      </div>
      <div className="flex items-center gap-2 text-xs text-white/60">
        {t.badge && <Pill>{t.badge}</Pill>}
        <span className="truncate">{t.preview}</span>
        {t.unread && <span className="h-2 w-2 rounded-full bg-emerald-400" />}
      </div>
    </button>
  );
}

function MessageBubble({ m }: { m: Message }) {
  const isMe = m.senderType === "me";
  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-xl rounded-lg border px-3 py-2 text-sm shadow ${isMe ? "border-emerald-400/30 bg-emerald-500/10 text-white" : "border-white/10 bg-white/5 text-white/80"}`}>
        <div className="text-[11px] uppercase tracking-wide text-white/50">{m.from} · {m.ts}</div>
        <div className="mt-1 text-white">{m.body}</div>
        {m.card && (
          <div className="mt-2 rounded-lg border border-white/15 bg-black/30 p-2 text-xs text-white/70">
            <div className="font-semibold text-white">{m.card.title}</div>
            {m.card.lines.map((l) => (
              <div key={l}>{l}</div>
            ))}
            {m.card.note && <div className="mt-1 text-white/50">{m.card.note}</div>}
          </div>
        )}
        {m.actions && (
          <div className="mt-2 flex flex-wrap gap-2">
            {m.actions.map((a) => (
              <button key={a.label} className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/80 hover:border-emerald-400/40 hover:bg-emerald-500/10">
                {a.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MessagesPage() {
  const [activeId, setActiveId] = useState<string>("serenity");
  const [query, setQuery] = useState("");

  const threads = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return THREADS.filter((t) => !needle || t.name.toLowerCase().includes(needle) || t.preview.toLowerCase().includes(needle));
  }, [query]);

  const messages = MESSAGES[activeId] ?? [];

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-black text-white">
      <div className="border-b border-white/10 bg-black/70 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-4 space-y-2">
          <div className="flex items-center gap-3">
            <MessageCircle className="h-6 w-6 text-emerald-300" />
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-white/50">TapTap DMs</div>
              <div className="text-2xl font-bold text-white">Notification Center · Control Panel</div>
            </div>
          </div>
          <div className="text-sm text-white/70">Everything is a DM: Agents (Serenity, Vault, Flux, Broker, Orion, Maestro, Pulse), users, and system threads. Actions are built into messages.</div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-white/60">
            <Pill>Agents pinned</Pill>
            <Pill>0% social tips</Pill>
            <Pill>Commerce 3/6/91</Pill>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6 grid gap-4 lg:grid-cols-[320px,1fr]">
        <aside className="space-y-3">
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3">
            <Search className="h-4 w-4 text-white/50" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search threads or keywords"
              className="h-9 w-full bg-transparent text-sm text-white outline-none placeholder:text-white/40"
            />
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-2 space-y-2">
            {threads.map((t) => (
              <ThreadRow key={t.id} t={t} active={t.id === activeId} onSelect={() => setActiveId(t.id)} />
            ))}
            {!threads.length && (
              <div className="rounded-lg border border-dashed border-white/15 bg-black/30 p-3 text-sm text-white/70">No threads match.</div>
            )}
          </div>
        </aside>

        <section className="rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Sparkles className="h-4 w-4 text-emerald-300" />
            {THREADS.find((t) => t.id === activeId)?.name ?? "Thread"}
          </div>
          <div className="h-[520px] overflow-y-auto space-y-3 pr-2">
            {messages.map((m) => (
              <MessageBubble key={m.id} m={m} />
            ))}
            {!messages.length && (
              <div className="text-sm text-white/60">No messages yet. Agents will DM you when events fire.</div>
            )}
          </div>
          <div className="rounded-lg border border-white/10 bg-black/40 p-3 space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs text-white/60">
              <Pill>Ask an agent</Pill>
              <Pill>Attach post/track/listing</Pill>
              <Pill>Mute thread</Pill>
            </div>
            <div className="flex items-center gap-2">
              <input
                placeholder="Reply or ask… e.g., “Show my earnings this week”"
                className="h-10 flex-1 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-white/40 outline-none"
              />
              <button className="rounded-md border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100 hover:bg-emerald-500/20">
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
