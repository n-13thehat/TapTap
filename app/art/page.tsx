import Link from "next/link";
import { Palette, ScanLine, Sparkles } from "lucide-react";

export const metadata = {
  title: "Visual Art · TapTap",
  description: "Bind paintings, prints, sculptures and video to TapTap chips. Tap to unlock the story behind the art.",
};

export default function VisualArtComingSoonPage() {
  return (
    <main className="min-h-[calc(100vh-4rem)] bg-black text-white px-6 py-12">
      <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1">
          <Sparkles className="h-3.5 w-3.5 text-violet-300" />
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-violet-200">
            Coming Soon
          </span>
        </div>

        <div className="mb-6 rounded-2xl border border-violet-500/30 bg-violet-500/5 p-5 shadow-[0_0_40px_rgba(167,139,250,0.15)]">
          <Palette className="h-10 w-10 text-violet-300" />
        </div>

        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Visual Art System
        </h1>

        <p className="mt-4 max-w-xl text-base text-white/70 sm:text-lg">
          Bind paintings, prints, sculptures and video pieces to TapTap chips.
          Anyone who taps the physical work unlocks the process, story and
          provenance behind it.
        </p>

        <p className="mt-3 text-sm text-white/50">
          The creator-facing binding flow is in active development. Public
          unlock pages for already-bound pieces are live at{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5 text-[12px] font-mono text-violet-200">
            /art/&lt;ttid&gt;
          </code>
          .
        </p>

        <div className="mt-10 grid w-full gap-3 sm:grid-cols-2">
          <Link
            href="/trap"
            className="group flex flex-col gap-2 rounded-xl border border-teal-500/30 bg-black/60 p-5 text-left transition hover:border-teal-300/60 hover:shadow-[0_0_28px_rgba(45,212,191,0.2)]"
          >
            <div className="flex items-center gap-2">
              <ScanLine className="h-4 w-4 text-teal-300" />
              <span className="font-semibold">Order chips first</span>
            </div>
            <span className="text-xs text-white/60">
              Head to The Trap to order NFC chips you can bind to your work
              when the editor ships.
            </span>
          </Link>

          <Link
            href="/dashboard"
            className="group flex flex-col gap-2 rounded-xl border border-white/10 bg-black/60 p-5 text-left transition hover:border-white/30"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-white/80" />
              <span className="font-semibold">Back to dashboard</span>
            </div>
            <span className="text-xs text-white/60">
              We&apos;ll surface the visual art editor on your dashboard the
              moment it launches.
            </span>
          </Link>
        </div>
      </div>
    </main>
  );
}
