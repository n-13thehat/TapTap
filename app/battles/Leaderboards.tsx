"use client";
import React from "react";

export default function Leaderboards({ leagues, battlers }: { leagues: Array<{ name: string; score: number }>; battlers: Array<{ name: string; score: number }> }) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
        <div className="mb-2 text-sm font-semibold text-teal-300">Leagues</div>
        <ul className="space-y-1 text-sm text-white/80">
          {leagues.map((l) => (
            <li key={l.name} className="flex items-center justify-between"><span>{l.name}</span><span className="font-mono text-white/60">{l.score}</span></li>
          ))}
        </ul>
      </div>
      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
        <div className="mb-2 text-sm font-semibold text-teal-300">Battlers</div>
        <ul className="space-y-1 text-sm text-white/80">
          {battlers.map((b) => (
            <li key={b.name} className="flex items-center justify-between"><span>{b.name}</span><span className="font-mono text-white/60">{b.score}</span></li>
          ))}
        </ul>
      </div>
    </div>
  );
}

