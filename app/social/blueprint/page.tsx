"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Activity,
  MessageSquareText,
  Mic2,
  Image as ImageIcon,
  Music4,
  Waves,
  Sparkles,
  ShieldCheck,
  ThumbsUp,
  Repeat2,
  Coins,
  Search,
  Bell,
  Wand2,
  Settings,
  Stars,
  Share2,
  Zap,
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
          <Pill>Social Blueprint</Pill>
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
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-teal-500/10 to-cyan-400/10">
      <div className="absolute inset-0 opacity-20 mix-blend-screen">
        <div className="h-full w-full bg-[radial-gradient(circle_at_20%_10%,#00ffd166,transparent_35%),radial-gradient(circle_at_70%_60%,#00b8ff66,transparent_40%)]" />
      </div>
      <div className="relative z-10 p-6 md:p-10">
        <div className="mb-3 flex items-center gap-2">
          <Badge>Social</Badge>
          <Pill>Culture Stream</Pill>
          <Pill>Empathy × AI Integrity</Pill>
        </div>
        <h1 className="bg-gradient-to-r from-teal-200 via-white to-teal-100 bg-clip-text text-2xl font-bold tracking-tight text-transparent md:text-4xl">
          Social — Sonic Conversation, Alive with Voice
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-white/80">
          Competitor DNA: X (Twitter) × Threads × TikTok comments. Purpose: Culture stream for expression, voice, and connection.
        </p>
      </div>
    </div>
  );
}

function CompetitorDNA() {
  return (
    <section>
      <SectionHeader icon={Activity} title="Competitor DNA" subtitle="X × Threads × TikTok comments" />
      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <div className="mb-2 text-xs text-white/60">Purpose</div>
          <div className="text-sm text-white">Culture stream for expression, voice, and connection.</div>
        </Card>
        <Card>
          <div className="mb-2 text-xs text-white/60">TapTap Ethos</div>
          <div className="text-sm text-white">Social meets sonic conversation — powered by empathy and AI integrity.</div>
        </Card>
      </div>
    </section>
  );
}

function FeatureGrid() {
  return (
    <section>
      <SectionHeader icon={Stars} title="TapTap Innovation" subtitle="Features and interactions" />
      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <div className="mb-2 flex items-center gap-2 text-xs text-white/60"><Activity className="h-4 w-4 text-teal-300" />Feed</div>
          <div className="text-sm text-white">Scroll-based feed like X, supporting text, images, battle clips, and audio posts.</div>
        </Card>
        <Card>
          <div className="mb-2 flex items-center gap-2 text-xs text-white/60"><Mic2 className="h-4 w-4 text-teal-300" />Voice Memo Comments</div>
          <div className="text-sm text-white">Record or attach short voice comments directly under any post. Player UI matches TapCoin glow aesthetic.</div>
        </Card>
        <Card>
          <div className="mb-2 flex items-center gap-2 text-xs text-white/60"><ShieldCheck className="h-4 w-4 text-teal-300" />AI Moderation Agent</div>
          <div className="text-sm text-white">Real-time voice transcription + sentiment filter — automatically removes hate speech, slurs, and targeted harassment.</div>
        </Card>
        <Card>
          <div className="mb-2 flex items-center gap-2 text-xs text-white/60"><MessageSquareText className="h-4 w-4 text-teal-300" />Composer</div>
          <div className="text-sm text-white">Minimal matrix-glow text field; drag-and-drop media or voice note.</div>
        </Card>
        <Card>
          <div className="mb-2 flex items-center gap-2 text-xs text-white/60"><ThumbsUp className="h-4 w-4 text-teal-300" />Engagement</div>
          <div className="text-sm text-white">Like, Comment, Repost, and Tip with TapCoin. Tipping = top-tier engagement metric (no tax).</div>
        </Card>
        <Card>
          <div className="mb-2 flex items-center gap-2 text-xs text-white/60"><Wand2 className="h-4 w-4 text-teal-300" />Feed Personalization</div>
          <div className="text-sm text-white">Curated by AstroMode alignment + engagement graph.</div>
        </Card>
      </div>
    </section>
  );
}

export default function SocialBlueprintPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <TopHUD />
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-6">
        <Hero />
        <CompetitorDNA />
        <FeatureGrid />
        <section>
          <SectionHeader icon={Zap} title="Notes" subtitle="Non-destructive blueprint page under /social/blueprint" />
          <div className="text-xs text-white/70">This page scaffolds UX and is safe to iterate without affecting the primary /social route.</div>
        </section>
      </div>
    </main>
  );
}

