"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Command,
  BarChart3,
  Map,
  Coins,
  Upload,
  Wand2,
  ShieldCheck,
  CheckCircle2,
  Music4,
  Image as ImageIcon,
  Hash,
  Gauge,
  Search,
  Settings,
  Bell,
  Sparkles,
} from "lucide-react";

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/70">
      <Sparkles className="h-3 w-3 text-teal-300" />
      {children}
    </span>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">{children}</span>;
}

function SectionHeader({ icon: Icon, title, subtitle }: { icon: React.ComponentType<any>; title: string; subtitle?: string }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <div className="rounded-lg border border-white/10 bg-white/5 p-2">
        <Icon className="h-5 w-5 text-teal-300" />
      </div>
      <div>
        <div className="text-base font-semibold tracking-wide text-white">{title}</div>
        {subtitle ? <div className="text-xs text-white/60">{subtitle}</div> : null}
      </div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">{children}</div>;
}

function TopHUD() {
  return (
    <div className="sticky top-0 z-40 border-b border-white/10 bg-black/70 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2 text-xs text-white/70">
          <Badge>TapTap ZION</Badge>
          <Pill>Creator Blueprint</Pill>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2 py-1">
            <Search className="h-4 w-4 text-white/60" />
            <input placeholder="Search spec" className="w-[220px] bg-transparent text-xs text-white placeholder:text-white/40 focus:outline-none" />
          </div>
          <button className="rounded-lg border border-white/10 bg-white/5 p-2 text-white/70 hover:bg-white/10"><Bell className="h-4 w-4" /></button>
          <button className="rounded-lg border border-white/10 bg-white/5 p-2 text-white/70 hover:bg-white/10"><Settings className="h-4 w-4" /></button>
        </div>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-500/10 to-lime-400/10">
      <div className="absolute inset-0 opacity-20 mix-blend-screen">
        <div className="h-full w-full bg-[radial-gradient(circle_at_20%_10%,#00ffd166,transparent_35%),radial-gradient(circle_at_70%_60%,#00b8ff66,transparent_40%)]" />
      </div>
      <div className="relative z-10 p-6 md:p-10">
        <div className="mb-3 flex items-center gap-2">
          <Badge>Creator</Badge>
          <Pill>Own Your Masters</Pill>
          <Pill>Mint Your Legacy</Pill>
        </div>
        <h1 className="bg-gradient-to-r from-teal-200 via-white to-teal-100 bg-clip-text text-2xl font-bold tracking-tight text-transparent md:text-4xl">
          Creator — The Cockpit for Earnings, Uploads, and Minting
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-white/80">
          Competitor DNA: SoundCloud Creator × Apple Music for Artists. Purpose: Analytics, uploads, minting, and management.
        </p>
      </div>
    </div>
  );
}

function Sections() {
  return (
    <section>
      <SectionHeader icon={Command} title="Sections" subtitle="TapTap UX concepts" />
      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <div className="mb-2 text-xs text-white/60">Dashboard</div>
          <div className="text-sm text-white">SoundCloud simplicity meets Apple‑level polish. Panels for earnings, tips, streams, followers.</div>
        </Card>
        <Card>
          <div className="mb-2 text-xs text-white/60">Analytics</div>
          <div className="text-sm text-white">Apple Music‑style charts + geo maps; TapCoin transaction overlay.</div>
        </Card>
        <Card>
          <div className="mb-2 text-xs text-white/60">Uploads</div>
          <div className="text-sm text-white">Guided flow: Upload → Metadata → Pricing → NFT Mint → Publish.</div>
        </Card>
        <Card>
          <div className="mb-2 text-xs text-white/60">AI Muse Assistant</div>
          <div className="text-sm text-white">Built‑in co‑pilot suggesting titles, cover art, hashtags, or audio mastering improvements.</div>
        </Card>
        <Card>
          <div className="mb-2 text-xs text-white/60">Creator Request</div>
          <div className="text-sm text-white">Form to apply for verified creator status or physical unit minting eligibility.</div>
        </Card>
        <Card>
          <div className="mb-2 text-xs text-white/60">Revenue Transparency</div>
          <div className="text-sm text-white">Earnings breakdown with clear TapTax visualization (6% Treasury / 3% Burn on non‑tips).</div>
        </Card>
      </div>
    </section>
  );
}

export default function CreatorBlueprintPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <TopHUD />
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-6">
        <Hero />
        <Sections />
        <section>
          <SectionHeader icon={Gauge} title="Notes" subtitle="Non-destructive blueprint page under /creator/blueprint" />
          <div className="text-xs text-white/70">This page scaffolds UX and is safe to iterate without affecting the primary /creator route.</div>
        </section>
      </div>
    </main>
  );
}

