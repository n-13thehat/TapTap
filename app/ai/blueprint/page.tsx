"use client";

import * as React from "react";

import { useRouter } from "next/navigation";
import { Bot, Sparkles, PenTool, Music4, Hash, Wand2, Search, Settings, Bell, Send, Share2, Copy, FileAudio, FileText, ImagePlus, TerminalSquare } from "lucide-react";

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
          <Pill>Muse Workspace</Pill>
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
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-rose-500/10 to-teal-400/10">
      <div className="absolute inset-0 opacity-20 mix-blend-screen">
        <div className="h-full w-full bg-[radial-gradient(circle_at_20%_10%,#00ffd166,transparent_35%),radial-gradient(circle_at_70%_60%,#00b8ff66,transparent_40%)]" />
      </div>
      <div className="relative z-10 p-6 md:p-10">
        <div className="mb-3 flex items-center gap-2">
          <Badge>AI</Badge>
          <Pill>Muse Workspace</Pill>
        </div>
        <h1 className="bg-gradient-to-r from-teal-200 via-white to-teal-100 bg-clip-text text-2xl font-bold tracking-tight text-transparent md:text-4xl">
          AI — Muse Workspace
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-white/80">Creative co‑pilot for titles, cover art, hashtags, and mastering suggestions.</p>
      </div>
    </div>
  );
}

function Tools() {
  return (
    <section>
      <SectionHeader icon={Bot} title="Tools" subtitle="Creation assistance" />
      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <div className="mb-2 text-xs text-white/60">Titles & Captions</div>
          <div className="text-sm text-white">Suggest punchy titles and context‑aware descriptions.</div>
        </Card>
        <Card>
          <div className="mb-2 text-xs text-white/60">Cover Art</div>
          <div className="text-sm text-white">Generate or refine cover art with stylistic prompts.</div>
        </Card>
        <Card>
          <div className="mb-2 text-xs text-white/60">Hashtags</div>
          <div className="text-sm text-white">Recommend hashtags tailored to scenes and culture.</div>
        </Card>
        <Card>
          <div className="mb-2 text-xs text-white/60">Mastering</div>
          <div className="text-sm text-white">Suggest mastering improvements and level checks.</div>
        </Card>
      </div>
    </section>
  );
}

function TerminalSnippet({ title, code }: { title: string; code: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[linear-gradient(180deg,rgba(0,0,0,0.6),rgba(0,0,0,0.8))] p-0">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <div className="flex items-center gap-2 text-xs text-teal-200">
          <TerminalSquare className="h-4 w-4" /> {title}
        </div>
        <button className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-white/70 hover:bg-white/10">
          <Copy className="mr-1 inline h-3 w-3" /> Copy
        </button>
      </div>
      <pre className="overflow-auto p-3 text-[11px] leading-relaxed">
        <code>
          {code}
        </code>
      </pre>
    </div>
  );
}

function ChatPane() {
  const [messages, setMessages] = React.useState<Array<{ role: "user" | "muse"; text: string }>>([
    { role: "muse", text: "Welcome to Muse Workspace. What are we making today?" },
    { role: "user", text: "Let’s write a chorus inspired by neon rain." },
  ]);
  const [input, setInput] = React.useState("");
  function send() {
    if (!input.trim()) return;
    setMessages((m) => [...m, { role: "user", text: input.trim() }, { role: "muse", text: "Drafting ideas…" }]);
    setInput("");
  }
  return (
    <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-black/40">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2 text-xs text-white/70">
        <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-teal-300" /> Muse Chat</div>
        <div className="flex items-center gap-2"><PenTool className="h-3.5 w-3.5 text-white/60" /> Creative Studio Terminal</div>
      </div>
      <div className="flex-1 space-y-3 overflow-auto p-3">
        {messages.map((m, i) => (
          <div key={i} className={"max-w-[85%] rounded-lg border px-3 py-2 text-sm " + (m.role === "muse" ? "ml-0 border-teal-400/20 bg-teal-400/10 text-teal-50" : "ml-auto border-white/10 bg-white/5 text-white/90")}>{m.text}</div>
        ))}
      </div>
      <div className="flex items-center gap-2 border-t border-white/10 p-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask Muse…" className="flex-1 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none" />
        <button onClick={send} className="inline-flex items-center gap-2 rounded-md border border-teal-400/30 bg-teal-400/10 px-3 py-2 text-xs text-teal-200 hover:bg-teal-400/20"><Send className="h-3.5 w-3.5" /> Send</button>
      </div>
    </div>
  );
}

type OutputTab = "lyrics" | "prompts" | "art";

function OutputPane() {
  const [tab, setTab] = React.useState<OutputTab>("lyrics");
  const router = useRouter();
  return (
    <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-black/30">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <div className="flex items-center gap-2 text-xs text-white/70">
          <button onClick={() => setTab("lyrics")} className={(tab === "lyrics" ? "text-teal-300" : "text-white/60") + " inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-white/5"}><FileText className="h-3.5 w-3.5" /> Lyrics</button>
          <button onClick={() => setTab("prompts")} className={(tab === "prompts" ? "text-teal-300" : "text-white/60") + " inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-white/5"}><Hash className="h-3.5 w-3.5" /> Prompts</button>
          <button onClick={() => setTab("art")} className={(tab === "art" ? "text-teal-300" : "text-white/60") + " inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-white/5"}><ImagePlus className="h-3.5 w-3.5" /> Art</button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/social")}
            className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-white/80 hover:bg-white/10"
            title="Share generated assets to Social"
          >
            <Share2 className="h-3.5 w-3.5" /> Share to Social
          </button>
          <button
            onClick={() => router.push("/upload")}
            className="inline-flex items-center gap-2 rounded-md border border-teal-400/30 bg-teal-400/10 px-2 py-1 text-[11px] text-teal-200 hover:bg-teal-400/20"
            title="Send generated assets to Upload"
          >
            <FileAudio className="h-3.5 w-3.5" /> Send to Upload
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-3">
        {tab === "lyrics" && (
          <div className="space-y-3">
            <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm leading-relaxed text-white/90">
              Neon falls in quiet code — a city wide awake;<br />
              Every beat a secret road, every step a data lake.<br />
              I’m tuned into your frequency, your signal breaks the gray —<br />
              In the matrix of our memory, we’re finding our own way.
            </div>
            <TerminalSnippet title="Syntax‑colored Muse Plan" code={`muse.generate({\n  theme: 'neon-rain',\n  tempo: 92,\n  palette: ['teal','indigo','rose'],\n  outputs: ['lyrics','cover','hashtags']\n})`} />
          </div>
        )}
        {tab === "prompts" && (
          <div className="space-y-3 text-sm text-white/90">
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">Cover art prompt: “Matrix rain over chrome skyline, soft neon rim light, grain, 90s CD era.”</div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">Hashtags: #NeoSoul #MatrixWave #TapCoin #VX9</div>
          </div>
        )}
        {tab === "art" && (
          <div className="space-y-3">
            <div className="aspect-video w-full overflow-hidden rounded-lg border border-white/10 bg-gradient-to-br from-teal-500/10 to-fuchsia-400/10" />
            <div className="text-xs text-white/60">Preview of generated cover art (placeholder).</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AIBlueprintPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <TopHUD />
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-6">
        <Hero />
        <Tools />
        <section>
          <SectionHeader icon={Wand2} title="Studio Layout" subtitle="Dual-column: Chat (Muse) + Output" />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="min-h-[420px]"><ChatPane /></div>
            <div className="min-h-[420px]"><OutputPane /></div>
          </div>
        </section>
      </div>
    </main>
  );
}
