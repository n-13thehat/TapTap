"use client";

import React, { useEffect, useMemo, lazy, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";

import { PageContainer } from "@/components/ui/StandardizedComponents";
import { usePlayerStore } from "@/stores/player";

// Lazy load heavy visual components
const HeroExperience = lazy(() => import("@/app/home/HeroExperience"));
const MatrixRain = lazy(() => import("@/components/MatrixRain"));
const GalaxyScene = lazy(() => import("@/components/GalaxyScene"));
// Import PDF as string URL
const TapTapWhitepaper = "/app/components/TapTap_Whitepaper.pdf";
import { getDefaultAlbumPublicUrl } from "@/lib/defaultAlbumConfig";

type Props = {
  counts: any;
};

export default function LandingShell({ counts }: Props) {
  return (
    <PageContainer showMatrix={false} className="overflow-hidden">
      {/* Deep space + matrix stack */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <Suspense fallback={<div className="absolute inset-0 bg-gradient-to-b from-black via-[#020910] to-black" />}>
          <GalaxyScene />
        </Suspense>
        <div className="absolute inset-0 bg-gradient-to-b from-black via-[#020910] to-black opacity-80" />
        <div className="absolute inset-0 mix-blend-screen opacity-75">
          <Suspense fallback={null}>
            <MatrixRain speed={1.1} glow="strong" trail={1.4} />
          </Suspense>
        </div>
      </div>

      {/* Intro overlay */}
      <IntroMatrixOverlay />

      {/* Foreground */}
      <div className="relative z-10 flex min-h-screen flex-col animate-in fade-in duration-700">
        {/* NAVBAR */}
        <header className="sticky top-0 z-20 border-b border-teal-500/20 bg-black/70 backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <div className="relative h-9 w-9 overflow-hidden rounded-xl border border-teal-400/60 bg-black/80 shadow-[0_0_40px_rgba(45,212,191,0.55)]">
                <Image
                  src="/branding/tap-logo.png"
                  alt="TapTap"
                  width={36}
                  height={36}
                  className="h-full w-full object-contain"
                  priority
                />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.35em] text-teal-200/90">
                  TapTap Matrix
                </span>
                <span className="text-[11px] text-teal-200/70">
                  Galactic music & culture mainframe
                </span>
                <span className="mt-1 inline-flex w-fit items-center gap-1 rounded-full border border-teal-500/40 bg-black/80 px-2 py-0.5 text-[9px] font-mono uppercase tracking-[0.25em] text-teal-300/80">
                  <span className="h-1 w-1 rounded-full bg-teal-400" />
                  <span>ZION build</span>
                </span>
              </div>
            </div>

            <nav className="hidden items-center gap-6 text-[11px] font-medium text-teal-100/80 sm:flex">
              <Link href="#hero" className="font-mono text-[11px] transition hover:text-teal-300">
                Overview
              </Link>
              <Link href="#whitepaper" className="font-mono text-[11px] transition hover:text-teal-300">
                Whitepaper
              </Link>
              <Link href="#about" className="font-mono text-[11px] transition hover:text-teal-300">
                On-chain rails
              </Link>
              <Link href="/home" className="font-mono text-[11px] transition hover:text-teal-300">
                Home Hub
              </Link>
            </nav>

            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="hidden rounded-full border border-teal-400/60 px-3 py-1.5 text-[11px] font-medium text-teal-100 shadow-sm transition hover:bg-teal-500/10 sm:inline-flex"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-teal-400 px-3.5 py-1.5 text-xs font-semibold text-black shadow-[0_0_32px_rgba(45,212,191,0.85)] transition hover:bg-teal-300"
              >
                Enter TapTap
              </Link>
            </div>
          </div>
        </header>

        {/* HERO */}
        <section
          id="hero"
          className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 lg:px-8 lg:py-16"
        >
          <div className="mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center">
            {/* Left: copy + CTAs */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/60 bg-black/70 px-3 py-1 text-[11px] font-medium text-teal-200 shadow-[0_0_28px_rgba(45,212,191,0.75)]">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-400 shadow-[0_0_12px_rgba(45,212,191,0.95)]" />
                <span className="font-mono uppercase tracking-[0.28em]">
                  Mainframe build • Matrix-native
                </span>
              </div>

              <div className="space-y-4">
                <h1 className="text-balance font-mono text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
                  A{" "}
                  <span className="bg-gradient-to-r from-teal-300 via-emerald-300 to-cyan-300 bg-clip-text text-transparent">
                    galactic matrix
                  </span>{" "}
                  for music, culture & on-chain drops.
                </h1>
                <p className="max-w-xl text-sm leading-relaxed text-teal-100/80 sm:text-[15px]">
                  TapTap unifies library, social, battles, marketplace and
                  live experiences into one teal-and-black mainframe - wired to
                  Web3 rails and designed for artists, curators and the fans who
                  orbit them.
                </p>
              </div>

              {/* CTA row including whitepaper */}
              <div className="space-y-4">
                <div className="flex flex-wrap gap-3 text-xs sm:text-[13px]">
                  <Link
                    href="/signup"
                    className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400 px-4 py-2.5 text-xs font-semibold text-black shadow-[0_0_40px_rgba(45,212,191,0.9)] transition hover:brightness-110"
                  >
                    Start in the matrix
                  </Link>
                  <Link
                    href="/home"
                    className="inline-flex items-center justify-center rounded-full border border-teal-400/70 bg-black/70 px-4 py-2.5 text-[11px] font-semibold text-teal-100 shadow-[0_0_28px_rgba(45,212,191,0.7)] transition hover:border-teal-300 hover:bg-teal-500/10"
                  >
                    Open Home hub
                  </Link>
                  <a
                    href={TapTapWhitepaper as unknown as string}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-full border border-teal-300/70 bg-black/70 px-4 py-2.5 text-[11px] font-semibold text-teal-100 shadow-[0_0_26px_rgba(45,212,191,0.6)] transition hover:border-teal-200 hover:bg-teal-500/10"
                  >
                    View TapTap whitepaper
                  </a>
                </div>
                <p className="text-[11px] text-teal-100/70">
                  Designed for keyboard-first navigation, low-latency playback
                  and iframe-ready surfaces so you can dock TapTap anywhere in
                  your stack.
                </p>
              </div>

              {/* Quick bullets */}
              <div className="grid gap-3 text-[11px] text-teal-50/80 sm:grid-cols-3 sm:text-xs">
                <div className="rounded-xl border border-teal-500/30 bg-black/80 p-3 backdrop-blur">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-teal-300">
                    Unified mainframe
                  </div>
                  <p className="mt-1.5 text-[11px]">
                    One teal-and-black cockpit for drops, battles, social and
                    collector tooling.
                  </p>
                </div>
                <div className="rounded-xl border border-emerald-500/30 bg-black/80 p-3 backdrop-blur">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
                    Matrix-native embeds
                  </div>
                  <p className="mt-1.5 text-[11px]">
                    Any major TapTap surface can run as a matrix iframe inside
                    your own products.
                  </p>
                </div>
                <div className="rounded-xl border border-cyan-500/30 bg-black/80 p-3 backdrop-blur">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
                    Built for artists
                  </div>
                  <p className="mt-1.5 text-[11px]">
                    Transparent splits, programmable assets and tools tuned for
                    producers, writers and curators.
                  </p>
                </div>
              </div>
            </div>

            {/* Right: live stats / experience */}
            <div className="rounded-3xl border border-teal-500/40 bg-black/80 p-4 shadow-[0_0_90px_rgba(45,212,191,0.75)] backdrop-blur-xl sm:p-5 lg:p-6">
              <HeroExperience initialCounts={counts} />
              <p className="mt-4 text-[11px] text-teal-100/70">
                Live matrix of artists, battles, collections and listeners.
                Stats pulse as the TapTap mainframe grows.
              </p>
            </div>
          </div>
        </section>

        {/* Scroll hint */}
        <div className="flex items-center justify-center pb-6">
          <Link
            href="#about"
            className="inline-flex flex-col items-center gap-1 text-[11px] text-teal-100/80 hover:text-teal-300"
          >
            <span>Scroll to explore the rails</span>
            <span className="animate-bounce text-xs">⌄</span>
          </Link>
        </div>

        {/* WHITEPAPER SECTION */}
        <section
          id="whitepaper"
          className="border-t border-teal-500/20 bg-black/80 px-4 py-10 sm:px-6 lg:px-8 lg:py-14"
        >
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 lg:flex-row">
            <div className="max-w-xl space-y-4">
              <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                The TapTap Whitepaper.
              </h2>
              <p className="text-sm leading-relaxed text-teal-100/80 sm:text-[15px]">
                Dive into the protocol, economics and design philosophy behind
                the TapTap mainframe — including how matrix iframes, StemStation
                and creator rails plug into the broader ecosystem.
              </p>
              <div className="mt-4 flex flex-wrap gap-3 text-xs">
                <a
                  href={TapTapWhitepaper as unknown as string}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-full bg-teal-400 px-4 py-2 text-xs font-semibold text-black shadow-[0_0_32px_rgba(45,212,191,0.8)] transition hover:bg-teal-300"
                >
                  Open PDF
                </a>
                <a
                  href={TapTapWhitepaper as unknown as string}
                  download
                  className="inline-flex items-center justify-center rounded-full border border-teal-300/70 bg-black/80 px-4 py-2 text-[11px] font-semibold text-teal-100 shadow-[0_0_24px_rgba(45,212,191,0.5)] transition hover:border-teal-200 hover:bg-teal-500/10"
                >
                  Download whitepaper
                </a>
              </div>
            </div>

            <div className="flex-1">
              <div className="relative h-64 w-full overflow-hidden rounded-2xl border border-teal-500/30 bg-gradient-to-br from-black via-[#021820] to-black shadow-[0_0_70px_rgba(45,212,191,0.75)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.18),transparent_55%),radial-gradient(circle_at_bottom,_rgba(6,182,212,0.16),transparent_55%)] opacity-90" />
                <div className="relative z-10 flex h-full flex-col justify-between p-5">
                  <div className="flex items-center gap-3">
                    <div className="relative h-8 w-8 overflow-hidden rounded-lg border border-teal-400/60 bg-black/80">
                      <Image
                        src="/branding/tap-logo.png"
                        alt="TapTap"
                        width={32}
                        height={32}
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-200/90">
                        ZION • Technical brief
                      </div>
                      <div className="text-[11px] text-teal-100/80">
                        Excerpt from the TapTap whitepaper
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-teal-50/85">
                    <p>
                      • Matrix-native iframe surfaces for library, social,
                      battles, marketplace and StemStation.
                    </p>
                    <p>
                      • Modular contracts for ownership, royalties and
                      battle-driven curation.
                    </p>
                    <p>
                      • A teal-and-black UI system tuned for deep focus and
                      low-latency feedback.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 text-[10px]">
                    <span className="rounded-full border border-teal-400/50 bg-black/80 px-2 py-0.5 text-teal-100">
                      Matrix rails
                    </span>
                    <span className="rounded-full border border-emerald-400/50 bg-black/80 px-2 py-0.5 text-emerald-100">
                      On-chain economics
                    </span>
                    <span className="rounded-full border border-cyan-400/50 bg-black/80 px-2 py-0.5 text-cyan-100">
                      StemStation
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ABOUT / WEB3 BENEFITS */}
        <section
          id="about"
          className="border-t border-teal-500/20 bg-black/90 px-4 py-12 sm:px-6 lg:px-8 lg:py-16"
        >
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 lg:flex-row">
            <div className="max-w-xl space-y-4">
              <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Why TapTap lives on-chain.
              </h2>
              <p className="text-sm leading-relaxed text-teal-100/85 sm:text-[15px]">
                TapTap is wired into Web3 so every track, stem and battle is
                more than a stream — it&apos;s a programmable asset that can
                move, split and compound across the whole matrix.
              </p>

              <ul className="mt-4 space-y-3 text-sm text-teal-50/90 sm:text-[15px]">
                <li className="flex gap-3">
                  <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal-400 shadow-[0_0_16px_rgba(45,212,191,0.9)]" />
                  <span>
                    <strong className="font-semibold text-white">
                      True ownership for artists and collectors.
                    </strong>{" "}
                    Tracks, stems and posters exist as NFTs you control —
                    transferable, provable and composable with the broader
                    on-chain ecosystem.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.9)]" />
                  <span>
                    <strong className="font-semibold text-white">
                      Transparent revenue and splits.
                    </strong>{" "}
                    Every mint, battle and marketplace sale flows through
                    auditable contracts — no opaque dashboards or hidden cuts.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-cyan-400 shadow-[0_0_16px_rgba(6,182,212,0.9)]" />
                  <span>
                    <strong className="font-semibold text-white">
                      Composable social graph.
                    </strong>{" "}
                    Identity, reputation and collector history can travel across
                    L2s, ecosystems and future TapTap surfaces.
                  </span>
                </li>
              </ul>
            </div>

            {/* Right rail: feature grid */}
            <div className="grid flex-1 gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-teal-400/40 bg-gradient-to-br from-teal-500/15 via-black/95 to-black p-4 shadow-[0_0_40px_rgba(45,212,191,0.7)]">
                <h3 className="text-sm font-semibold text-teal-200">
                  Social × Library × Marketplace
                </h3>
                <p className="mt-2 text-xs text-teal-50/90">
                  A single cockpit where drops, feeds, messages, battles and
                  merch stay in sync.
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-400/40 bg-gradient-to-br from-emerald-500/15 via-black/95 to-black p-4 shadow-[0_0_40px_rgba(52,211,153,0.7)]">
                <h3 className="text-sm font-semibold text-emerald-200">
                  Matrix-ready iframes
                </h3>
                <p className="mt-2 text-xs text-teal-50/90">
                  Library, social, marketplace, battles and StemStation can all
                  run as embedded matrix panels.
                </p>
              </div>
              <div className="rounded-2xl border border-cyan-400/40 bg-gradient-to-br from-cyan-500/15 via-black/95 to-black p-4 shadow-[0_0_40px_rgba(6,182,212,0.7)]">
                <h3 className="text-sm font-semibold text-cyan-200">
                  Battle-native from day one
                </h3>
                <p className="mt-2 text-xs text-teal-50/90">
                  Voting, wagers and live reactions are woven into the mainframe
                  instead of bolted on.
                </p>
              </div>
              <div className="rounded-2xl border border-teal-400/40 bg-gradient-to-br from-[#0f172a] via-black to-black p-4 shadow-[0_0_40px_rgba(45,212,191,0.7)]">
                <h3 className="text-sm font-semibold text-teal-200">
                  Futureproof rails
                </h3>
                <p className="mt-2 text-xs text-teal-50/90">
                  Modular contracts, L2-first design and embedded AI assistants
                  so you can keep shipping as the ecosystem shifts.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER CTA */}
        <footer className="border-t border-teal-500/20 bg-black/95 px-4 py-6 text-[11px] text-teal-100/80 sm:px-6 lg:px-8">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 sm:flex-row">
            <p>
              Built for architects, producers, writers, curators and the fans
              who orbit them.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/home"
                className="rounded-full border border-teal-400/70 bg-black/80 px-3 py-1.5 text-xs font-semibold text-teal-100 shadow-[0_0_24px_rgba(45,212,191,0.7)] transition hover:border-teal-300 hover:bg-teal-500/10"
              >
                Open Home hub
              </Link>
              <a
                href={TapTapWhitepaper as unknown as string}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-teal-100/80 underline-offset-2 hover:text-teal-300 hover:underline"
              >
                Whitepaper
              </a>
            </div>
          </div>
        </footer>
      </div>
    </PageContainer>
  );
}

function IntroMatrixOverlay() {
  const [done, setDone] = React.useState(false);
  const [mounted, setMounted] = React.useState(true);
  const queue = usePlayerStore((state) => state.queue);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const addToQueue = usePlayerStore((state) => state.addToQueue);
  const playTrack = usePlayerStore((state) => state.playTrack);
  const introSoundUrl = useMemo(
    () => getDefaultAlbumPublicUrl("life is worth the wait 2.0.mp3"),
    []
  );

  useEffect(() => {
    // Respect existing playback; only play intro if nothing is playing
    if (!introSoundUrl || queue.length > 0 || isPlaying) {
      setDone(true);
      setMounted(false);
      return;
    }

    const introTrack = {
      id: "intro-sfx",
      title: "TapTap Intro",
      artist: "TapTap",
      audio_url: introSoundUrl,
      cover_art: "/branding/tap-logo.png",
      duration: 8,
    };

    addToQueue(introTrack as any);
    playTrack(introTrack as any);

    const t1 = setTimeout(() => setDone(true), 2600);
    const t2 = setTimeout(() => setMounted(false), 3600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [addToQueue, isPlaying, playTrack, queue.length, introSoundUrl]);

  if (!mounted) return null;

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-40 flex items-center justify-center bg-black/95 transition-opacity duration-800 ${
        done ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="absolute inset-0">
        <MatrixRain speed={1.35} glow="strong" trail={1.1} />
      </div>
      <div className="relative z-10 flex flex-col items-center gap-3 text-center">
        <span className="font-mono text-[11px] uppercase tracking-[0.38em] text-teal-300/80">
          welcome
        </span>
        <div className="font-mono text-2xl tracking-[0.3em] text-teal-100 sm:text-3xl">
          ENTERING&nbsp;TAPTAP
        </div>
        <span className="font-mono text-[10px] text-teal-300/70">
          // initializing galactic matrix mainframe...
        </span>
      </div>
      <div className="pointer-events-none absolute inset-0 border border-teal-500/30" />
    </div>
  );
}
