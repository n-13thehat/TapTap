"use client";

import Link from "next/link";
import {
  Library,
  Users,
  Swords,
  ShoppingCart,
  Radio,
  Music,
  Palette,
  ScanLine,
  Cpu,
  Bot,
  Waves,
  Sparkles,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";

interface Pillar {
  href: string;
  label: string;
  blurb: string;
  icon: LucideIcon;
  badge?: string;
  accent?: "teal" | "cyan" | "emerald" | "violet" | "amber";
}

const PILLARS: Pillar[] = [
  {
    href: "/library",
    label: "Library",
    blurb: "Your music vault — sync, save, organize and replay everything you collect across the matrix.",
    icon: Library,
    accent: "teal",
  },
  {
    href: "/social",
    label: "Social",
    blurb: "A real-time feed for crews, drops, reactions and the conversations behind every track.",
    icon: Users,
    accent: "cyan",
  },
  {
    href: "/battles",
    label: "Battles",
    blurb: "Producer vs. producer, rapper vs. rapper. Vote, stake, climb the leagues.",
    icon: Swords,
    accent: "amber",
  },
  {
    href: "/marketplace",
    label: "Marketplace",
    blurb: "On-chain music, merch and collectibles with transparent splits and creator-first economics.",
    icon: ShoppingCart,
    accent: "emerald",
  },
  {
    href: "/live",
    label: "Live",
    blurb: "Stream sets, listening rooms and watch parties. Tip in tokens, gift in art.",
    icon: Radio,
    accent: "violet",
  },
  {
    href: "/stemstation",
    label: "STEMSTATION",
    blurb: "Rhythm gaming wired to real catalog stems. Score songs you actually love.",
    icon: Music,
    accent: "cyan",
  },
  {
    href: "/art",
    label: "Visual Art",
    blurb: "Bind paintings, prints, sculptures or video to TapTap chips. Tap to unlock the process, story and meaning.",
    icon: Palette,
    badge: "NEW",
    accent: "violet",
  },
  {
    href: "/trap",
    label: "The Trap",
    blurb: "Order NFC chips for any creator product. Encode tracks, art or merch and ship.",
    icon: ScanLine,
    badge: "NEW",
    accent: "teal",
  },
  {
    href: "/admin/encoder",
    label: "Encoder System",
    blurb: "Manufacturer console for batch generation, UID binding and tap-event fraud detection.",
    icon: Cpu,
    badge: "NEW",
    accent: "emerald",
  },
  {
    href: "/ai",
    label: "AI Agents",
    blurb: "Hope, Muse and Treasure — assistants for discovery, creation and curation.",
    icon: Bot,
    accent: "amber",
  },
  {
    href: "/surf",
    label: "Surf",
    blurb: "Lean back and ride the waves — algorithmic radio tuned to your vibe and the network.",
    icon: Waves,
    accent: "cyan",
  },
  {
    href: "/astro",
    label: "Astro",
    blurb: "An astrology layer over your listening: today's vibe, lunar drops, planetary playlists.",
    icon: Sparkles,
    accent: "violet",
  },
];

const ACCENT_RING: Record<NonNullable<Pillar["accent"]>, string> = {
  teal: "border-teal-500/30 hover:border-teal-300/60 hover:shadow-[0_0_28px_rgba(45,212,191,0.25)]",
  cyan: "border-cyan-500/30 hover:border-cyan-300/60 hover:shadow-[0_0_28px_rgba(34,211,238,0.25)]",
  emerald: "border-emerald-500/30 hover:border-emerald-300/60 hover:shadow-[0_0_28px_rgba(52,211,153,0.25)]",
  violet: "border-violet-500/30 hover:border-violet-300/60 hover:shadow-[0_0_28px_rgba(167,139,250,0.25)]",
  amber: "border-amber-500/30 hover:border-amber-300/60 hover:shadow-[0_0_28px_rgba(251,191,36,0.25)]",
};

const ACCENT_TEXT: Record<NonNullable<Pillar["accent"]>, string> = {
  teal: "text-teal-300",
  cyan: "text-cyan-300",
  emerald: "text-emerald-300",
  violet: "text-violet-300",
  amber: "text-amber-300",
};

export default function PillarsSection() {
  return (
    <section
      id="pillars"
      className="border-t border-teal-500/20 bg-black/85 px-4 py-12 sm:px-6 lg:px-8 lg:py-16"
    >
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-8 flex flex-col gap-2 text-center sm:text-left">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.3em] text-teal-300">
            The matrix runs on these pillars
          </span>
          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Twelve surfaces, one mainframe.
          </h2>
          <p className="max-w-2xl text-sm text-teal-100/75 sm:text-[15px]">
            From day-zero music tools to the new physical chip layer (Encoder + Trap + Visual
            Art), every TapTap surface is wired into the same identity, wallet and event bus.
          </p>
        </div>

        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PILLARS.map((p) => {
            const Icon = p.icon;
            const accent = p.accent ?? "teal";
            return (
              <li key={p.href}>
                <Link
                  href={p.href}
                  className={`group flex h-full flex-col gap-3 rounded-2xl border bg-black/70 p-5 backdrop-blur transition ${ACCENT_RING[accent]}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`rounded-md bg-white/5 p-2 ring-1 ring-white/10`}>
                      <Icon className={`h-4 w-4 ${ACCENT_TEXT[accent]}`} />
                    </div>
                    <div className="font-semibold text-white">{p.label}</div>
                    {p.badge && (
                      <span className={`ml-auto rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] font-bold tracking-wider ${ACCENT_TEXT[accent]}`}>
                        {p.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/65 leading-relaxed">{p.blurb}</p>
                  <div className={`mt-auto flex items-center gap-1 text-[11px] ${ACCENT_TEXT[accent]} opacity-70 group-hover:opacity-100`}>
                    Open <ArrowRight className="h-3 w-3" />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
