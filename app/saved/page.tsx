"use client";

import {
  Bookmark,
  Music2,
  Play,
  Sparkles,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const SAVED = [
  { id: "s1", title: "Digital Dreams", by: "Trinity", type: "track", plays: "42.1k", saved: "2d ago" },
  { id: "s2", title: "Neon Drift", by: "Neo", type: "clip", plays: "18.7k", saved: "3d ago" },
  { id: "s3", title: "Poster — Aurora", by: "Seraph", type: "poster", plays: "Minted", saved: "1w ago" },
  { id: "s4", title: "Crew thread: #matrixwave", by: "Matrix Wave", type: "thread", plays: "128 replies", saved: "1w ago" },
];

export default function SavedPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-black text-white">
      <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/50">
              <Bookmark className="h-4 w-4 text-emerald-300" />
              Saved
            </div>
            <h1 className="text-2xl font-bold text-white">Saved posts & drops</h1>
            <p className="text-sm text-white/60">Everything you bookmarked across feed, reels, and crews.</p>
          </div>
          <Badge variant="outline" className="border-white/20 text-white/70">
            Private
          </Badge>
        </header>

        <section className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2 text-white font-semibold">
              <Sparkles className="h-4 w-4 text-amber-300" />
              Your latest saves
            </div>
            <Button size="sm" variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10">
              Manage
            </Button>
          </div>
          <Separator className="bg-white/10" />
          <div className="divide-y divide-white/5">
            {SAVED.map((item) => (
              <div key={item.id} className="flex items-center justify-between px-4 py-3 gap-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border border-white/10">
                    <AvatarImage src={`/api/cover/${item.id}`} alt={item.title} />
                    <AvatarFallback className="bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 text-white">
                      {item.title.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-white font-semibold">{item.title}</div>
                    <div className="text-xs text-white/60">{item.by} · {item.saved}</div>
                    <div className="text-xs text-white/50 flex items-center gap-1">
                      {item.type === "track" && <Music2 className="h-3 w-3" />}
                      {item.type === "clip" && <Play className="h-3 w-3" />}
                      {item.type === "poster" && <Sparkles className="h-3 w-3" />}
                      {item.type === "thread" && <Bookmark className="h-3 w-3" />}
                      <span className="capitalize">{item.type}</span> · {item.plays}
                    </div>
                  </div>
                </div>
                <Button size="sm" variant="secondary" className="bg-emerald-500/20 border-emerald-400/40 text-emerald-50">
                  Open
                </Button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
