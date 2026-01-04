"use client";

import * as React from "react";
import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Radio,
  Music4,
  Cpu,
  Flame,
  Droplets,
  Leaf,
  Wind,
  Wand2,
  ShieldCheck,
  ArrowRight,
  Play,
  Pause,
  Waves,
  Gauge,
  Stars,
  LayoutGrid,
  AudioLines,
  GitBranch,
  Receipt,
  Wallet2,
  Bell,
  Search,
  Settings,
  BookOpenText,
  Headphones,
  Activity,
  Command,
  Zap,
} from "lucide-react";

// TapTap ZION — UX / UI Experience Blueprint
// “The Matrix of Music” — 2025
// Global, cinematic changelog/blueprint page that documents core visual identity,
// interaction systems, and feature DNA. This file is intentionally verbose to
// serve as an in-repo living spec and design scaffold that can be trimmed as the
// product matures. Structured in small, reusable blocks to keep it manageable.

type Elemental = "Fire" | "Water" | "Earth" | "Air";

const ELEMENTS: Elemental[] = ["Fire", "Water", "Earth", "Air"];

const elementPalette: Record<Elemental, { from: string; to: string; glow: string }> = {
  Fire: { from: "from-rose-500/30", to: "to-amber-400/20", glow: "shadow-[0_0_40px_#ff4d4d66]" },
  Water: { from: "from-cyan-400/30", to: "to-blue-500/20", glow: "shadow-[0_0_40px_#00e5ff66]" },
  Earth: { from: "from-emerald-400/30", to: "to-lime-500/20", glow: "shadow-[0_0_40px_#26ff8a66]" },
  Air: { from: "from-indigo-400/30", to: "to-fuchsia-500/20", glow: "shadow-[0_0_40px_#a78bfa66]" },
};

function useAstroMode(): Elemental {
  // Placeholder adaptive mode: rotates across elements on interval.
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((v) => (v + 1) % ELEMENTS.length), 8000);
    return () => clearInterval(t);
  }, []);
  return ELEMENTS[idx];
}

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ComponentType<any>;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <div className="rounded-lg border border-white/10 bg-white/5 p-2">
        <Icon className="h-5 w-5 text-teal-300" />
      </div>
      <div>
        <div className="text-base font-semibold tracking-wide text-white">{title}</div>
        {subtitle ? (
          <div className="text-xs text-white/60">{subtitle}</div>
        ) : null}
      </div>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/70">
      <Sparkles className="h-3 w-3 text-teal-300" />
      {children}
    </span>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">{children}</span>
  );
}

function Divider() {
  return <div className="my-6 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />;
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
      {children}
    </div>
  );
}

function GlowFrame({ children, ...props }: { children: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10" {...props}>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/5 to-transparent" />
      <div className="relative">{children}</div>
    </div>
  );
}

function Row({ icon: Icon, label, desc }: { icon: React.ComponentType<any>; label: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-black/30 p-3">
      <div className="rounded-md border border-white/10 bg-white/5 p-2">
        <Icon className="h-4 w-4 text-teal-300" />
      </div>
      <div>
        <div className="text-sm font-semibold text-white">{label}</div>
        <div className="text-xs text-white/60">{desc}</div>
      </div>
    </div>
  );
}

function KeyValue({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid grid-cols-3 gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
      <div className="text-xs font-medium text-white/70">{k}</div>
      <div className="col-span-2 text-xs text-white">{v}</div>
    </div>
  );
}

function AudioChip({ label, active }: { label: string; active?: boolean }) {
  return (
    <div
      className={
        "flex items-center gap-2 rounded-full border px-3 py-1 text-xs " +
        (active ? "border-teal-400/40 bg-teal-400/10 text-teal-200" : "border-white/10 bg-white/5 text-white/70")
      }
    >
      <Waves className={"h-3.5 w-3.5 " + (active ? "text-teal-300" : "text-white/60")} />
      {label}
    </div>
  );
}

function TopHUD() {
  return (
    <div className="sticky top-0 z-40 border-b border-white/10 bg-black/70 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2 text-xs text-white/70">
          <Badge>TapTap ZION</Badge>
          <Pill>Blueprint 2025</Pill>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2 py-1">
            <Search className="h-4 w-4 text-white/60" />
            <input
              placeholder="Search patterns, tokens, releases"
              className="w-[200px] bg-transparent text-xs text-white placeholder:text-white/40 focus:outline-none md:w-[280px]"
            />
          </div>
          <button className="rounded-lg border border-white/10 bg-white/5 p-2 text-white/70 hover:bg-white/10">
            <Bell className="h-4 w-4" />
          </button>
          <button className="rounded-lg border border-white/10 bg-white/5 p-2 text-white/70 hover:bg-white/10">
            <Wallet2 className="h-4 w-4" />
          </button>
          <button className="rounded-lg border border-white/10 bg-white/5 p-2 text-white/70 hover:bg-white/10">
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function GlobalSidebar() {
  const items = [
    { key: "home", label: "Home", icon: Stars, href: "/home" },
    { key: "social", label: "Social", icon: Activity, href: "/social" },
    { key: "library", label: "Library", icon: BookOpenText, href: "/library" },
    { key: "creator", label: "Creator", icon: Command, href: "/creator" },
    { key: "marketplace", label: "Marketplace", icon: Receipt, href: "/marketplace" },
    { key: "battles", label: "Battles", icon: Gauge, href: "/battles" },
    { key: "surf", label: "Surf", icon: Waves, href: "/surf" },
    { key: "live", label: "Live", icon: Radio, href: "/live" },
    { key: "wallet", label: "Wallet", icon: Wallet2, href: "/wallet" },
    { key: "settings", label: "Settings", icon: Settings, href: "/settings" },
  ];
  return (
    <div className="sticky top-12 h-[calc(100vh-48px)] w-[62px] shrink-0 overflow-auto border-r border-white/10 bg-black/50 px-1 py-3">
      <div className="flex flex-col gap-2">
        {items.map((it) => (
          <a
            key={it.key}
            href={it.href}
            className="group relative flex items-center justify-center rounded-lg border border-white/10 bg-white/5 p-2 hover:border-teal-400/30 hover:bg-white/10"
            title={it.label}
          >
            <it.icon className="h-5 w-5 text-white group-hover:text-teal-300" />
            <span className="pointer-events-none absolute left-[58px] hidden rounded-md border border-white/10 bg-black/90 px-2 py-1 text-[10px] text-white/80 group-hover:block">
              {it.label}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}

function Hero({ element }: { element: Elemental }) {
  const pal = elementPalette[element];
  return (
    <GlowFrame>
      <div
        className={
          `relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${pal.from} ${pal.to} ${pal.glow}`
        }
      >
        <div className="absolute inset-0 opacity-20 mix-blend-screen">
          <div className="h-full w-full bg-[radial-gradient(circle_at_20%_10%,#00ffd166,transparent_35%),radial-gradient(circle_at_70%_60%,#00b8ff66,transparent_40%)]" />
        </div>
        <div className="relative z-10 p-6 md:p-10">
          <div className="mb-3 flex items-center gap-2">
            <Badge>Matrix of Music</Badge>
            <Pill>Release 2025</Pill>
            <Pill>Blueprint</Pill>
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="bg-gradient-to-r from-teal-200 via-white to-teal-100 bg-clip-text text-2xl font-bold tracking-tight text-transparent md:text-4xl">
                TapTap ZION — UX / UI Experience Blueprint
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-white/80">
                A living changelog that captures the evolving language of the TapTap
                Mainframe — visual identity, interaction patterns, and feature DNA.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <AudioChip label="Ambient hums" active />
              <AudioChip label="Click tones" />
              <AudioChip label="Chimes" />
            </div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <Card>
              <div className="mb-2 text-xs uppercase tracking-wide text-white/60">Aesthetic</div>
              <div className="flex items-center gap-2 text-sm text-white">
                <Stars className="h-4 w-4 text-teal-300" />
                Matrix digital rain × streetwear × audio‑reactive light
              </div>
            </Card>
            <Card>
              <div className="mb-2 text-xs uppercase tracking-wide text-white/60">Typeface</div>
              <div className="flex items-center gap-2 text-sm text-white">
                <BookOpenText className="h-4 w-4 text-teal-300" />
                JetBrains Mono (logic) + Inter (UI)
              </div>
            </Card>
            <Card>
              <div className="mb-2 text-xs uppercase tracking-wide text-white/60">Theme Engine</div>
              <div className="flex items-center gap-2 text-sm text-white">
                <Wand2 className="h-4 w-4 text-teal-300" />
                Adaptive AstroMode — palettes shift by element
              </div>
            </Card>
          </div>
        </div>
      </div>
    </GlowFrame>
  );
}

function VisualIdentity() {
  return (
    <section>
      <SectionHeader
        icon={Sparkles}
        title="Global Design Language"
        subtitle="Visual identity, tone, and behavior"
      />
      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <div className="mb-2 text-xs text-white/60">Aesthetic</div>
          <div className="text-sm text-white">
            Matrix digital rain blends with streetwear sensibilities and audio‑reactive light.
            Surfaces breathe, neon seams pulse, and micro‑motion tracks TapCoin flow.
          </div>
        </Card>
        <Card>
          <div className="mb-2 text-xs text-white/60">Tone</div>
          <div className="text-sm text-white">
            Futuristic yet soulful. Every action is alive — buttons hum, panels glow,
            and transitions feel like stepping through data portals.
          </div>
        </Card>
        <Card>
          <div className="mb-2 text-xs text-white/60">Type</div>
          <div className="flex items-center gap-2 text-sm text-white">
            <BookOpenText className="h-4 w-4 text-teal-300" /> JetBrains Mono (system logic)
            <ArrowRight className="h-4 w-4 text-white/40" /> Inter (UI clarity)
          </div>
        </Card>
        <Card>
          <div className="mb-2 text-xs text-white/60">Sound Design</div>
          <div className="flex flex-wrap gap-2">
            <AudioChip label="Ambient hums" />
            <AudioChip label="Click tones" />
            <AudioChip label="Rank‑based chimes" />
          </div>
        </Card>
      </div>
    </section>
  );
}

function InteractionSystem() {
  return (
    <section>
      <SectionHeader
        icon={Cpu}
        title="Interaction System"
        subtitle="Navigation, HUD, transitions, and accessibility"
      />
      <div className="grid gap-3 lg:grid-cols-3">
        <div className="space-y-3">
          <Row icon={LayoutGrid} label="Global Sidebar" desc="Icon‑driven nav. Expands on hover. Glowing borders for active route." />
          <Row icon={Headphones} label="Top HUD" desc="Search, audio player, wallet quick‑access, notifications, AI Muse prompt." />
          <Row icon={Stars} label="Transitions" desc="Cinematic route transitions — walk through portals of data." />
          <Row icon={ShieldCheck} label="Accessibility" desc="Keyboard complete, reduced motion, haptic affordances." />
        </div>
        <div className="space-y-3">
          <KeyValue k="Theme Engine" v="Adaptive AstroMode (Fire / Water / Earth / Air)" />
          <KeyValue k="TapCoin Flow" v="Subtle micro‑motion on balances, swaps, and perks" />
          <KeyValue k="Rank Effects" v="Sound palette evolves as user rank rises" />
          <KeyValue k="Controls" v="Hold Shift for power actions; Alt to invert themes" />
        </div>
        <GlowFrame>
          <div className="relative h-full min-h-[220px] overflow-hidden bg-black/60">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,#00ffd166,transparent_35%),radial-gradient(circle_at_70%_70%,#00b8ff66,transparent_40%)] opacity-20" />
            <div className="relative p-4">
              <div className="mb-2 text-xs text-white/60">Preview</div>
              <div className="flex items-center gap-2">
                <button className="rounded-lg border border-white/10 bg-white/5 p-2 text-white/80 hover:bg-white/10">
                  <Play className="h-4 w-4" />
                </button>
                <button className="rounded-lg border border-white/10 bg-white/5 p-2 text-white/80 hover:bg-white/10">
                  <Pause className="h-4 w-4" />
                </button>
                <div className="grow rounded-full bg-gradient-to-r from-teal-300/30 via-white/20 to-transparent p-1">
                  <div className="h-2 w-1/2 rounded-full bg-teal-300/40" />
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-[10px] text-white/70">
                <div className="rounded-md border border-white/10 bg-white/5 p-2">HUD</div>
                <div className="rounded-md border border-white/10 bg-white/5 p-2">Sidebar</div>
                <div className="rounded-md border border-white/10 bg-white/5 p-2">Portal FX</div>
              </div>
            </div>
          </div>
        </GlowFrame>
      </div>
    </section>
  );
}

function LibraryDNA() {
  return (
    <section>
      <SectionHeader
        icon={AudioLines}
        title="Library — Competitor DNA"
        subtitle="Tidal × Spotify with TapTap ownership layers"
      />
      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <div className="mb-2 text-xs text-white/60">Purpose</div>
          <div className="text-sm text-white">
            The vault of what you own, love, and have created. Fidelity first; ownership verified.
          </div>
        </Card>
        <Card>
          <div className="mb-2 text-xs text-white/60">Interface</div>
          <div className="text-sm text-white">
            Tidal’s visual fidelity meets Spotify’s intuitive organization — blur‑glass panels
            with sharp neon dividers.
          </div>
        </Card>
        <Card>
          <div className="mb-2 text-xs text-white/60">Collections</div>
          <div className="text-sm text-white">
            Tabs for Owned, Saved, Purchased, and Resale. “My Masters” showcases NFT‑verified ownership.
          </div>
        </Card>
        <Card>
          <div className="mb-2 text-xs text-white/60">Playback</div>
          <div className="text-sm text-white">
            Floating waveform player reacts in real‑time, synchronized with Matrix rain pulses.
          </div>
        </Card>
        <Card>
          <div className="mb-2 text-xs text-white/60">Resale Flow</div>
          <div className="text-sm text-white">
            One‑tap resale triggers TapTax preview (6% Treasury / 3% Burn) — fully transparent.
          </div>
        </Card>
        <Card>
          <div className="mb-2 text-xs text-white/60">Ownership Verification</div>
          <div className="text-sm text-white">
            Tap once for blockchain proof or a shareable certificate link.
          </div>
        </Card>
      </div>
      <Divider />
      <GlowFrame>
        <div className="relative overflow-hidden bg-black/60 p-4">
          <div className="absolute inset-0 opacity-20">
            <div className="h-full w-full bg-[radial-gradient(circle_at_10%_10%,#00ffd166,transparent_35%),radial-gradient(circle_at_80%_60%,#00b8ff66,transparent_40%)]" />
          </div>
          <div className="relative z-10 grid gap-3 md:grid-cols-3">
            <div className="space-y-2">
              <div className="text-xs text-white/60">Quick Taps</div>
              <Row icon={Zap} label="Resale" desc="Preview TapTax and list instantly" />
              <Row icon={ShieldCheck} label="Verify" desc="View chain provenance and master rights" />
              <Row icon={GitBranch} label="Masters" desc="Showcase original series and splits" />
            </div>
            <div className="space-y-2">
              <div className="text-xs text-white/60">Collections</div>
              <Row icon={Stars} label="Owned" desc="Assets you hold fully or fractionally" />
              <Row icon={BookOpenText} label="Saved" desc="Favorites and long‑term crates" />
              <Row icon={Receipt} label="Purchased" desc="Recent market activity" />
            </div>
            <div className="space-y-2">
              <div className="text-xs text-white/60">Playback</div>
              <Row icon={Headphones} label="Waveform Player" desc="Float over content with reactive rain pulses" />
              <Row icon={Waves} label="Visualizer" desc="Ambient geometry driven by audio energy" />
            </div>
          </div>
        </div>
      </GlowFrame>
    </section>
  );
}

function ElementShowcase() {
  const cards = [
    { key: "Fire", icon: Flame, desc: "High‑energy, vibrant neon seams" },
    { key: "Water", icon: Droplets, desc: "Smooth gradients, flowing motion" },
    { key: "Earth", icon: Leaf, desc: "Grounded, confident tactility" },
    { key: "Air", icon: Wind, desc: "Lightweight, airy transitions" },
  ] as const;
  return (
    <section>
      <SectionHeader icon={Wand2} title="AstroMode Palettes" subtitle="Adaptive elements for mood and identity" />
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <GlowFrame key={c.key}>
            <div className="relative overflow-hidden p-4">
              <div className="absolute inset-0 opacity-20">
                <div className="h-full w-full bg-[conic-gradient(from_90deg,transparent,rgba(255,255,255,0.1))]" />
              </div>
              <div className="relative z-10">
                <div className="mb-2 flex items-center gap-2">
                  <c.icon className="h-4 w-4 text-teal-300" />
                  <div className="text-sm font-semibold text-white">{c.key}</div>
                </div>
                <div className="text-xs text-white/70">{c.desc}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Pill>Buttons</Pill>
                  <Pill>Panels</Pill>
                  <Pill>Visualizers</Pill>
                  <Pill>HUD</Pill>
                </div>
              </div>
            </div>
          </GlowFrame>
        ))}
      </div>
    </section>
  );
}

function ReleaseRow({
  version,
  date,
  notes,
}: {
  version: string;
  date: string;
  notes: string[];
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="mb-1 flex items-center justify-between">
        <div className="text-sm font-semibold text-white">{version}</div>
        <div className="text-xs text-white/60">{date}</div>
      </div>
      <ul className="list-disc space-y-1 pl-5 text-xs text-white/80">
        {notes.map((n, i) => (
          <li key={i}>{n}</li>
        ))}
      </ul>
    </div>
  );
}

function Releases() {
  const data = [
    {
      version: "v2025.01 — ZION Blueprint",
      date: "2025‑01‑10",
      notes: [
        "Introduced AstroMode adaptive theme engine",
        "Established Global Sidebar + Top HUD patterns",
        "Added Library DNA: ownership‑first flows and TapTax preview",
        "Cinematic route transitions and portal metaphors",
      ],
    },
    {
      version: "v2025.02 — Audio Reactivity",
      date: "2025‑02‑14",
      notes: [
        "Waveform player emits synchronized Matrix rain pulses",
        "Rank‑based chime palette and sound badges",
        "Wallet quick‑actions in HUD with micro‑motion",
      ],
    },
  ];
  return (
    <section>
      <SectionHeader icon={GitBranch} title="Releases" subtitle="Living changelog of experience evolutions" />
      <div className="grid gap-3 md:grid-cols-2">
        {data.map((r) => (
          <ReleaseRow key={r.version} version={r.version} date={r.date} notes={r.notes} />
        ))}
      </div>
    </section>
  );
}

export default function ChangelogPage() {
  const element = useAstroMode();
  const pal = elementPalette[element];
  const ElementIcon = useMemo(() => {
    switch (element) {
      case "Fire":
        return Flame;
      case "Water":
        return Droplets;
      case "Earth":
        return Leaf;
      default:
        return Wind;
    }
  }, [element]);

  return (
    <main className="relative min-h-screen bg-black text-white">
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-b ${pal.from} ${pal.to} opacity-20`} />
      <TopHUD />
      <div className="mx-auto flex max-w-7xl gap-4 px-4 py-6">
        <GlobalSidebar />

        <div className="relative z-10 w-full space-y-8">
          <Hero element={element} />

          <div className="flex items-center gap-2 text-xs text-white/70">
            <Pill>Element</Pill>
            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2 py-1">
              <ElementIcon className="h-4 w-4 text-teal-300" />
              <span>{element}</span>
            </div>
          </div>

          <VisualIdentity />
          <InteractionSystem />
          <ElementShowcase />
          <LibraryDNA />
          <Releases />

          <footer className="mt-6 border-t border-white/10 py-6 text-center text-xs text-white/60">
            TapTap Mainframe — The Matrix of Music. Blueprint is a living document.
          </footer>
        </div>
      </div>
    </main>
  );
}

