"use client";

import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  BadgeCheck,
  BellRing,
  CheckCircle2,
  Coins,
  Flame,
  Layers,
  Music2,
  Palette,
  Percent,
  Plus,
  Radio,
  Settings,
  Sparkles,
  TrendingUp,
  Zap,
  Upload,
  BarChart3,
  Users,
  Calendar,
  Eye,
  Heart,
  Play,
  Download,
  Share2,
  Edit3,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import { RouteFeatureGate } from "@/components/RouteFeatureGate";

type Tab = "content" | "monetization" | "analytics" | "campaigns" | "settings";

type Metric = { label: string; value: string; delta?: string; icon: any };
type AgentPing = { agent: string; body: string; tone: string };

const TIERS = [
  { level: 0, label: "Listener", perms: ["Tip in TAP", "Buy on Marketplace"] },
  { level: 1, label: "Emerging", perms: ["Tips + simple airdrops", "List small poster / track sets"] },
  { level: 2, label: "Growing", perms: ["Targeted airdrops", "Bundles", "Surf/creator feed boost"] },
  { level: 3, label: "Established", perms: ["Bigger editions", "Advanced drops"] },
  { level: 4, label: "Flagship", perms: ["Full console", "Scheduled drops", "Priority placement"] },
];

const METRICS: Metric[] = [
  { label: "TAP earned (7d)", value: "120 TAP", delta: "+24 TAP", icon: Coins },
  { label: "Followers", value: "4,820", delta: "+320", icon: Sparkles },
  { label: "Tip sessions", value: "58", delta: "+12", icon: Zap },
  { label: "Sales (Marketplace)", value: "18", delta: "+5", icon: TrendingUp },
  { label: "Total Plays", value: "12.4K", delta: "+2.1K", icon: Play },
  { label: "Saves", value: "892", delta: "+156", icon: Heart },
  { label: "Downloads", value: "234", delta: "+45", icon: Download },
  { label: "Engagement Rate", value: "8.2%", delta: "+1.3%", icon: Activity },
];

const AGENT_PINGS: AgentPing[] = [
  { agent: "Serenity", body: "Your post announcing ‘Midnight Horizon’ is 3x above baseline. Pin it?", tone: "text-emerald-300" },
  { agent: "Vault", body: "+75 TAP today (tips + 2 sales). Want to withdraw or swap to SOL?", tone: "text-cyan-300" },
  { agent: "Broker", body: "Bid outbid on ‘Neon Orbit (1/10)’. Counter or accept the next offer?", tone: "text-amber-300" },
  { agent: "Flux", body: "0% tax window live for posters for 18 minutes. Perfect time to call fans.", tone: "text-indigo-300" },
];

const TODO_ITEMS = [
  { title: "Request creator access", desc: "Apply to join as Tier 1+ with your alias and links." },
  { title: "Upload first track", desc: "Add ‘Music For The Future’ to seed your Library and Social." },
  { title: "Create a poster unit", desc: "Posterize your cover art and prep it for Marketplace." },
  { title: "Schedule a drop", desc: "Pick supply, price, and window—Broker will DM updates." },
];

const CONTENT_ROWS = [
  {
    id: "1",
    title: "Music For The Future",
    type: "Album",
    status: "Published",
    actions: ["Share", "Attach to Drop"],
    plays: 8420,
    saves: 234,
    revenue: "45.20 TAP",
    uploadDate: "2024-11-20",
    cover: "/api/placeholder/80/80"
  },
  {
    id: "2",
    title: "Neon Orbit Poster",
    type: "Poster",
    status: "Draft",
    actions: ["List", "Posterize"],
    plays: 0,
    saves: 0,
    revenue: "0 TAP",
    uploadDate: "2024-11-22",
    cover: "/api/placeholder/80/80"
  },
  {
    id: "3",
    title: "Flux Bundle",
    type: "Bundle",
    status: "Scheduled Drop",
    actions: ["Edit", "Promote"],
    plays: 1250,
    saves: 89,
    revenue: "12.50 TAP",
    uploadDate: "2024-11-21",
    cover: "/api/placeholder/80/80"
  },
  {
    id: "4",
    title: "Midnight Horizon",
    type: "Track",
    status: "Published",
    actions: ["Edit", "Promote", "Analytics"],
    plays: 3420,
    saves: 156,
    revenue: "28.90 TAP",
    uploadDate: "2024-11-18",
    cover: "/api/placeholder/80/80"
  },
];

const MONETIZATION_ROWS = [
  { title: "Tips", body: "Per-post tip totals, top supporters, thank-you replies." },
  { title: "Airdrops", body: "Followers, tippers, collectors; budget and schedule." },
  { title: "Marketplace", body: "Listings, auctions, bundles, tokenomics splits." },
];

const ANALYTICS_ROWS = [
  { title: "Audience", body: "Followers over time; top surfaces: Social, Surf, Marketplace." },
  { title: "Engagement", body: "Posts performance, tips per post, saves and plays." },
  { title: "Revenue", body: "TAP from tips, airdrops (inbound), Marketplace sales; rarity boosts." },
];

const CAMPAIGNS_ROWS = [
  { title: "Active drops", body: "Flux Bundle — live, 2h left · Supply 20/100." },
  { title: "Airdrop queue", body: "Top tippers · 500 TAP budget · Pending send." },
  { title: "Promos", body: "Auto-share to Social with Vortex-aware timing." },
];

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">{children}</span>;
}

function StatCard({ metric, index }: { metric: Metric; index: number }) {
  return (
    <motion.div
      className="rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition-all duration-300"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -2, scale: 1.02 }}
    >
      <div className="flex items-center gap-2 text-sm text-white/70">
        <metric.icon className="h-4 w-4 text-emerald-300" />
        {metric.label}
      </div>
      <div className="mt-1 text-xl font-semibold text-white">{metric.value}</div>
      {metric.delta && (
        <div className={`text-xs ${metric.delta.startsWith('+') ? 'text-emerald-300' : 'text-red-300'}`}>
          {metric.delta}
        </div>
      )}
    </motion.div>
  );
}

export default function CreatorPage() {
  return (
    <RouteFeatureGate
      flag="creatorHub"
      title="Creator tools are currently gated"
      description="Enable the creatorHub flag in the feature service to access this area."
    >
      <CreatorPageContent />
    </RouteFeatureGate>
  );
}

function TierLadder({ currentTier }: { currentTier: number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        <Layers className="h-4 w-4 text-emerald-300" />
        Creator Tiers
      </div>
      <div className="space-y-2">
        {TIERS.map((t) => (
          <div
            key={t.level}
            className={`rounded-lg border px-3 py-2 text-sm ${
              t.level === currentTier ? "border-emerald-400/50 bg-emerald-500/10" : "border-white/10 bg-white/5"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-white">Tier {t.level} — {t.label}</div>
              {t.level === currentTier && <span className="text-xs text-emerald-200">current</span>}
            </div>
            <div className="mt-1 text-xs text-white/60">{t.perms.join(" · ")}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AgentInbox() {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        <BellRing className="h-4 w-4 text-cyan-300" />
        AI Crew (DMs)
      </div>
      <div className="space-y-2">
        {AGENT_PINGS.map((m, i) => (
          <div key={i} className="rounded-lg border border-white/10 bg-black/40 p-2 text-xs text-white/80">
            <div className={`font-semibold ${m.tone}`}>{m.agent}</div>
            <div>{m.body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Tasks() {
  return (
    <div className="rounded-xl border border-dashed border-white/15 bg-white/5 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        <CheckCircle2 className="h-4 w-4 text-emerald-300" /> Onboarding
      </div>
      <div className="mt-2 grid gap-2 md:grid-cols-2">
        {TODO_ITEMS.map((t) => (
          <div key={t.title} className="rounded-lg border border-white/10 bg-black/40 p-3 text-sm text-white/80">
            <div className="font-semibold text-white">{t.title}</div>
            <div className="text-xs text-white/60">{t.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DataList({ title, rows, icon: Icon }: { title: string; rows: { title: string; body: string }[]; icon: any }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        <Icon className="h-4 w-4 text-emerald-300" />
        {title}
      </div>
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.title} className="rounded-lg border border-white/10 bg-black/40 p-2 text-sm text-white/80">
            <div className="font-semibold text-white">{r.title}</div>
            <div className="text-xs text-white/60">{r.body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContentTable() {
  const [selectedContent, setSelectedContent] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-lg font-semibold text-white">
          <Radio className="h-5 w-5 text-emerald-300" />
          Content & Assets
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white/5 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'list' ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'grid' ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white'
              }`}
            >
              <Layers className="h-4 w-4" />
            </button>
          </div>
          <motion.button
            className="flex items-center gap-2 rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-100 hover:bg-emerald-500/20 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="h-4 w-4" /> Upload New
          </motion.button>
        </div>
      </div>

      {/* Content Grid/List */}
      <AnimatePresence mode="wait">
        {viewMode === 'list' ? (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {/* Table Header */}
            <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-4 py-2 text-xs font-medium text-white/40 uppercase tracking-wider border-b border-white/10">
              <div></div>
              <div>Content</div>
              <div>Plays</div>
              <div>Saves</div>
              <div>Revenue</div>
              <div>Actions</div>
            </div>

            {CONTENT_ROWS.map((row, index) => (
              <motion.div
                key={row.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 items-center p-4 rounded-lg border border-white/10 bg-black/40 hover:bg-black/60 transition-all duration-200"
              >
                <img src={row.cover} alt={row.title} className="w-12 h-12 rounded-lg object-cover" />

                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-white truncate">{row.title}</span>
                    <Pill>{row.type}</Pill>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/60">
                    <span className={`px-2 py-1 rounded-full ${
                      row.status === 'Published' ? 'bg-emerald-500/20 text-emerald-300' :
                      row.status === 'Draft' ? 'bg-yellow-500/20 text-yellow-300' :
                      'bg-blue-500/20 text-blue-300'
                    }`}>
                      {row.status}
                    </span>
                    <span>{row.uploadDate}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-white font-medium">{row.plays.toLocaleString()}</div>
                  <div className="text-xs text-white/60">plays</div>
                </div>

                <div className="text-right">
                  <div className="text-white font-medium">{row.saves}</div>
                  <div className="text-xs text-white/60">saves</div>
                </div>

                <div className="text-right">
                  <div className="text-emerald-300 font-medium">{row.revenue}</div>
                  <div className="text-xs text-white/60">earned</div>
                </div>

                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                  >
                    <Edit3 className="h-4 w-4" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {CONTENT_ROWS.map((row, index) => (
              <motion.div
                key={row.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="rounded-lg border border-white/10 bg-black/40 p-4 hover:bg-black/60 transition-all duration-200"
              >
                <img src={row.cover} alt={row.title} className="w-full aspect-square rounded-lg object-cover mb-3" />
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white truncate">{row.title}</span>
                    <Pill>{row.type}</Pill>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center">
                      <div className="text-white font-medium">{row.plays.toLocaleString()}</div>
                      <div className="text-white/60">plays</div>
                    </div>
                    <div className="text-center">
                      <div className="text-white font-medium">{row.saves}</div>
                      <div className="text-white/60">saves</div>
                    </div>
                    <div className="text-center">
                      <div className="text-emerald-300 font-medium">{row.revenue}</div>
                      <div className="text-white/60">earned</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      row.status === 'Published' ? 'bg-emerald-500/20 text-emerald-300' :
                      row.status === 'Draft' ? 'bg-yellow-500/20 text-yellow-300' :
                      'bg-blue-500/20 text-blue-300'
                    }`}>
                      {row.status}
                    </span>
                    <div className="flex gap-1">
                      <button className="p-1 text-white/60 hover:text-white hover:bg-white/10 rounded transition-colors">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="p-1 text-white/60 hover:text-white hover:bg-white/10 rounded transition-colors">
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button className="p-1 text-white/60 hover:text-white hover:bg-white/10 rounded transition-colors">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CreatorPageContent() {
  const [tab, setTab] = useState<Tab>("content");
  const tier = 1; // stubbed current tier; wire to auth/profile when available

  const tabContent = useMemo(() => {
    if (tab === "content") return <ContentTable />;
    if (tab === "monetization") return <DataList title="Monetization" rows={MONETIZATION_ROWS} icon={Coins} />;
    if (tab === "analytics") return <DataList title="Analytics" rows={ANALYTICS_ROWS} icon={Activity} />;
    if (tab === "campaigns") return <DataList title="Campaigns" rows={CAMPAIGNS_ROWS} icon={Flame} />;
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Settings className="h-4 w-4 text-emerald-300" />
          Settings
        </div>
        <div className="text-xs text-white/60">Configure royalties, payout preferences, and defaults.</div>
      </div>
    );
  }, [tab]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-black text-white">
      <div className="border-b border-white/10 bg-black/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-5">
          <div className="flex items-center gap-3">
            <BadgeCheck className="h-6 w-6 text-emerald-300" />
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-white/50">TapTap Creator</div>
              <div className="text-2xl font-bold text-white">Home · Studio Dashboard</div>
            </div>
          </div>
          <div className="text-sm text-white/70">
            Manage uploads, posters, bundles, drops, airdrops, and tokenomics in one cockpit. Tiered access from 0 → 4; DM-first agent crew keeps you updated.
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-100 hover:bg-emerald-500/20">
              Become a creator
            </button>
            <Pill>Tier {tier}</Pill>
            <Pill>Music · Posters · Bundles</Pill>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {METRICS.map((m, index) => (
            <StatCard key={m.label} metric={m} index={index} />
          ))}
        </div>

        <TierLadder currentTier={tier} />

        <div className="flex flex-wrap items-center gap-2">
          {(["content", "monetization", "analytics", "campaigns", "settings"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full border px-3 py-1 text-sm ${
                tab === t ? "border-emerald-400/50 bg-emerald-500/10 text-white" : "border-white/10 bg-white/5 text-white/70"
              }`}
            >
              {t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {tabContent}

        <Tasks />

        <div className="grid gap-3 lg:grid-cols-2">
          <AgentInbox />
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Percent className="h-4 w-4 text-emerald-300" />
              Tokenomics snapshot
            </div>
            <div className="text-xs text-white/70">
              Sales: Creator 82% · Trap Reserve 13% · Platform 5% · Tax varies (0% during Vortex windows). Tips: 100% to creator.
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-white/70">
              <Pill>0% tax windows</Pill>
              <Pill>Royalties on secondary</Pill>
              <Pill>Trap Reserve inflow</Pill>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
