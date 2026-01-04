"use client";
import React, { useMemo, useState } from "react";

type Msg = { id: string; user: string; text: string; at: number };

export default function EngagePanel() {
  const [msg, setMsg] = useState("");
  const [items, setItems] = useState<Msg[]>([]);
  const [score, setScore] = useState<{ a: number; b: number }>({ a: 0, b: 0 });

  function send() {
    if (!msg.trim()) return;
    const m: Msg = { id: Math.random().toString(36).slice(2), user: "you", text: msg.trim(), at: Date.now() };
    setItems((it) => [m, ...it]);
    setMsg("");
  }

  const heatmap = useMemo(() => {
    // naive aggregation of emoji score
    let fire = 0, clap = 0, boo = 0;
    for (const m of items) {
      if (/🔥|💥|⚡/u.test(m.text)) fire++;
      if (/👏|💯|🙌/u.test(m.text)) clap++;
      if (/👎|💤|🤡/u.test(m.text)) boo++;
    }
    return { fire, clap, boo };
  }, [items]);

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
        <div className="mb-2 text-sm text-white/70">Live Chat</div>
        <div className="flex gap-2">
          <input value={msg} onChange={(e) => setMsg(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') send(); }} placeholder="Cheer, comment, drop emoji (🔥 👏 👎)" className="flex-1 rounded border border-white/10 bg-black/40 px-2 py-1 text-sm outline-none"/>
          <button onClick={send} className="rounded bg-teal-600 px-3 py-1 text-sm font-semibold text-black hover:bg-teal-500">Send</button>
        </div>
        <div className="mt-2 max-h-64 overflow-auto space-y-1">
          {items.map((m) => (
            <div key={m.id} className="text-xs text-white/80"><span className="text-white/50">{new Date(m.at).toLocaleTimeString()} ·</span> <span className="text-teal-300">{m.user}</span> {m.text}</div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
        <div className="mb-2 text-sm text-white/70">Scoreboard</div>
        <div className="flex items-center gap-3">
          <button onClick={() => setScore((s) => ({ ...s, a: s.a + 1 }))} className="rounded bg-emerald-600 px-2 py-1 text-xs text-black">A +1</button>
          <div className="text-white/80">A: <span className="font-semibold">{score.a}</span></div>
          <button onClick={() => setScore((s) => ({ ...s, b: s.b + 1 }))} className="rounded bg-indigo-600 px-2 py-1 text-xs text-black">B +1</button>
          <div className="text-white/80">B: <span className="font-semibold">{score.b}</span></div>
          <button onClick={() => setScore({ a: 0, b: 0 })} className="ml-auto rounded border border-white/10 px-2 py-1 text-xs hover:bg-white/10">Reset</button>
        </div>
        <div className="mt-2 text-xs text-white/60">ScoreBoard AI (emoji heat): 🔥 {heatmap.fire} · 👏 {heatmap.clap} · 👎 {heatmap.boo}</div>
      </div>
    </div>
  );
}

