"use client";

import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  Flame,
  Hash,
  Search,
  Sparkles,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

type Crew = {
  id: string;
  name: string;
  tag: string;
  members: string;
  active: string;
  vibe: string;
  description: string;
};

type Thread = {
  id: string;
  title: string;
  crew: string;
  tag: string;
  comments: number;
  sparkline: string;
};

const CREWS: Crew[] = [
  {
    id: "matrixwave",
    name: "Matrix Wave",
    tag: "#matrixwave",
    members: "12.4k",
    active: "412 live",
    vibe: "Synthwave · neon",
    description: "Producers sharing cyberpunk melodies and neon visuals.",
  },
  {
    id: "tapdrop",
    name: "TapDrop",
    tag: "#tapdrop",
    members: "8.9k",
    active: "221 live",
    vibe: "Airdrops · releases",
    description: "First to know about TapTap drops, swaps, and unlocks.",
  },
  {
    id: "stemstation",
    name: "STEMStation",
    tag: "#stemstation",
    members: "5.1k",
    active: "130 live",
    vibe: "Gamers · highlights",
    description: "Share replays, request remixes, and squad up for runs.",
  },
  {
    id: "posterverse",
    name: "PosterVerse",
    tag: "#posterverse",
    members: "3.6k",
    active: "98 live",
    vibe: "Posters · art",
    description: "Reddit-style threads for rare poster drops and collabs.",
  },
  {
    id: "zero-tax",
    name: "0% Windows",
    tag: "#zerotax",
    members: "2.7k",
    active: "44 live",
    vibe: "Tokenomics · alpha",
    description: "Crew alerts for zero-tax windows and treasury calls.",
  },
  {
    id: "wallmakers",
    name: "Wall Makers",
    tag: "#wallmakers",
    members: "4.4k",
    active: "180 live",
    vibe: "Creators · reels",
    description: "Cross-post your wall updates and TikTok-style reels.",
  },
];

const THREADS: Thread[] = [
  { id: "t1", title: "Share your best neon lead presets", crew: "Matrix Wave", tag: "#matrixwave", comments: 128, sparkline: "⬈⬈⬉⬈⬈" },
  { id: "t2", title: "0% window live for the next 30 minutes", crew: "0% Windows", tag: "#zerotax", comments: 74, sparkline: "⬈⬈⬈⬈" },
  { id: "t3", title: "Drop your latest short — boost train rolling", crew: "Wall Makers", tag: "#wallmakers", comments: 93, sparkline: "⬈⬉⬈⬉⬈" },
  { id: "t4", title: "Looking for cover art collaborator", crew: "PosterVerse", tag: "#posterverse", comments: 56, sparkline: "⬈⬈⬊⬈" },
];

const TAGS = ["#matrixwave", "#tapdrop", "#zerotax", "#wallmakers", "#posterverse", "#stemstation", "#crews", "#discover"];

function CrewCard({ crew }: { crew: Crew }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3 shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-white">{crew.name}</span>
            <Badge variant="outline" className="border-emerald-400/30 text-emerald-200 bg-emerald-500/10">
              {crew.active}
            </Badge>
          </div>
          <div className="text-xs text-white/60">{crew.vibe}</div>
        </div>
        <Badge variant="secondary" className="bg-white/10 text-white border-white/10">
          {crew.tag}
        </Badge>
      </div>

      <p className="text-sm text-white/70 leading-relaxed">{crew.description}</p>

      <div className="flex items-center justify-between text-xs text-white/60">
        <span>{crew.members} members</span>
        <Button size="sm" variant="secondary" className="bg-emerald-500/20 border-emerald-400/40 text-emerald-50">
          Join crew
        </Button>
      </div>
    </div>
  );
}

export default function CrewsPage() {
  const [query, setQuery] = useState("");

  const filteredCrews = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return CREWS;
    return CREWS.filter((crew) => crew.name.toLowerCase().includes(needle) || crew.tag.toLowerCase().includes(needle));
  }, [query]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-black text-white">
      <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        <header className="rounded-2xl border border-cyan-400/20 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-black p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/50">
                <Users className="h-4 w-4 text-emerald-300" />
                Crews
              </div>
              <h1 className="text-3xl font-bold text-white">Hashtag Crews · Community threads</h1>
              <p className="text-sm text-white/70 mt-1">
                Reddit-style discussions where people with the same interests rally around hashtags.
              </p>
            </div>
            <Button className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Create crew
            </Button>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-white/60">
            <span className="flex items-center gap-1">
              <Flame className="h-3 w-3 text-amber-300" />
              Trending crews: {CREWS[0].tag}, {CREWS[1].tag}, {CREWS[2].tag}
            </span>
            <span className="flex items-center gap-1">
              <Hash className="h-3 w-3 text-cyan-300" />
              Hashtag first — match by interest
            </span>
          </div>
        </header>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-white/60" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search crews or hashtags"
                className="bg-black/40 border-white/10 text-white placeholder:text-white/40"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {TAGS.map((tag) => (
                <Badge key={tag} variant="outline" className="border-white/15 text-white/70 bg-white/5">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {filteredCrews.map((crew) => (
              <CrewCard key={crew.id} crew={crew} />
            ))}
          </div>
        </div>

        <section className="rounded-2xl border border-white/10 bg-black/60 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-semibold">
              <Hash className="h-4 w-4 text-cyan-300" />
              Trending threads
            </div>
            <Button size="sm" variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10">
              View all
            </Button>
          </div>
          <div className="space-y-3">
            {THREADS.map((thread) => (
              <div key={thread.id} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-white font-semibold">
                      {thread.title}
                      <Badge variant="secondary" className="bg-white/10 text-white border-white/10">
                        {thread.tag}
                      </Badge>
                    </div>
                    <div className="text-xs text-white/60">
                      {thread.crew} · {thread.comments} comments · {thread.sparkline}
                    </div>
                  </div>
                  <Button size="sm" variant="secondary" className="bg-emerald-500/20 border-emerald-400/40 text-emerald-50 flex items-center gap-1">
                    Jump in
                    <ArrowUpRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <Separator className="bg-white/10" />
          <div className="flex items-center gap-2 text-xs text-white/60">
            <Users className="h-4 w-4 text-emerald-300" />
            Crews are discoverable in Social and via hashtags across posts.
          </div>
        </section>
      </div>
    </main>
  );
}
