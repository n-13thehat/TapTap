"use client";

import { useState } from "react";
import Image from "next/image";
import { LogIn, UserPlus, User } from "lucide-react";

type MintedListing = {
  title: string;
  price: number;
  type: "track" | "merch";
  marketplaceId: string;
};

type BandcampImportStatus = {
  slug: string;
  message: string;
  mintedTracks: MintedListing[];
  mintedMerch: MintedListing[];
};

export default function HomeAuthPanel() {
  const [bandcampUrl, setBandcampUrl] = useState("");
  const [showBandcampSection, setShowBandcampSection] = useState(false);
  const [bandcampStatus, setBandcampStatus] = useState<BandcampImportStatus | null>(null);
  const [bandcampLoading, setBandcampLoading] = useState(false);
  const [bandcampError, setBandcampError] = useState<string | null>(null);

  const handleBandcampImport = async () => {
    if (!bandcampUrl.trim()) return;
    setBandcampLoading(true);
    setBandcampError(null);
    setBandcampStatus(null);
    try {
      const response = await fetch("/api/bandcamp/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: bandcampUrl.trim() }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Import failed");
      setBandcampStatus(payload as BandcampImportStatus);
    } catch (error) {
      setBandcampError(error instanceof Error ? error.message : "Import failed");
    } finally {
      setBandcampLoading(false);
    }
  };

  return (
    <div className="relative w-full overflow-hidden rounded-3xl border border-teal-500/40 bg-black/80 p-6 shadow-[0_0_60px_rgba(45,212,191,0.45)] backdrop-blur">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.20),transparent_55%),radial-gradient(circle_at_bottom,_rgba(6,182,212,0.18),transparent_55%)] opacity-90" />
      <div className="relative z-10 space-y-5">
        <div className="flex items-center gap-3">
          <div className="relative h-9 w-9 overflow-hidden rounded-2xl border border-teal-400/70 bg-black/80">
            <Image
              src="/branding/tap-logo.png"
              alt="TapTap"
              width={36}
              height={36}
              className="h-full w-full object-contain"
            />
          </div>
          <div>
            <div className="font-mono text-xs font-semibold uppercase tracking-[0.25em] text-teal-200/90">
              Sign-in shell
            </div>
            <div className="text-[11px] text-teal-100/75">
              Choose your path into the galactic matrix.
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="font-mono text-xl font-semibold tracking-tight text-white sm:text-2xl">
            Authenticate into TapTap&apos;s teal-and-black mainframe.
          </h1>
          <p className="text-sm text-teal-100/80">
            Use your TapTap account to sync library, social graph, battles, marketplace, and
            the new physical chip layer (The Trap, Visual Art, Encoder), or jack in as a guest.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <a
            href="/login"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-teal-400/70 bg-black/80 px-4 py-2.5 text-sm font-semibold text-teal-100 shadow-[0_0_30px_rgba(45,212,191,0.7)] transition hover:border-teal-300 hover:bg-teal-500/10 no-underline"
          >
            <LogIn className="h-4 w-4" />
            <span>Sign in</span>
          </a>
          <a
            href="/signup"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400 px-4 py-2.5 text-sm font-semibold text-black shadow-[0_0_40px_rgba(45,212,191,0.9)] transition hover:brightness-110 no-underline"
          >
            <UserPlus className="h-4 w-4" />
            <span>Create account</span>
          </a>
        </div>

        <div className="space-y-3 rounded-2xl border border-cyan-500/40 bg-black/70 p-4 text-xs text-teal-100">
          <div className="flex items-center justify-between">
            <div className="font-mono uppercase tracking-[0.2em] text-teal-200/90">Bandcamp bridge</div>
            <button
              type="button"
              onClick={() => setShowBandcampSection((c) => !c)}
              className="rounded-full border border-teal-400/60 px-3 py-1 text-[11px] font-semibold text-teal-100 transition hover:border-teal-200"
            >
              {showBandcampSection ? "Hide" : "Sign in with Bandcamp"}
            </button>
          </div>
          {showBandcampSection && (
            <div className="space-y-2 pt-2">
              <label className="text-[10px] text-teal-200/80">Bandcamp artist URL</label>
              <input
                value={bandcampUrl}
                onChange={(e) => setBandcampUrl(e.target.value)}
                placeholder="https://artistname.bandcamp.com"
                className="w-full rounded-xl border border-teal-500/40 bg-black/60 px-3 py-2 text-sm text-teal-100 placeholder:text-teal-400"
              />
              <button
                type="button"
                onClick={handleBandcampImport}
                disabled={bandcampLoading}
                className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 px-3 py-2 text-sm font-semibold text-black shadow-[0_0_30px_rgba(45,212,191,0.7)] transition disabled:opacity-60"
              >
                {bandcampLoading ? "Importing catalog..." : "Mint Bandcamp catalog"}
              </button>
            </div>
          )}
          {bandcampStatus && (
            <div className="space-y-1 border-t border-teal-500/30 pt-3 text-[11px] text-teal-100/80">
              <div className="text-[10px] text-teal-300">{bandcampStatus.message}</div>
              {bandcampStatus.mintedTracks.map((t) => (
                <div key={t.marketplaceId} className="flex items-center justify-between text-[10px]">
                  <span className="text-teal-100">{t.title}</span>
                  <span className="text-teal-300">Minted as {t.marketplaceId}</span>
                </div>
              ))}
            </div>
          )}
          {bandcampError && <p className="text-[10px] text-rose-300">{bandcampError}</p>}
        </div>

        <a
          href="/social"
          className="inline-flex items-center gap-2 rounded-full border border-teal-400/70 bg-black/80 px-3 py-1.5 text-[11px] font-semibold text-teal-100 shadow-[0_0_24px_rgba(45,212,191,0.6)] transition hover:border-teal-300 hover:bg-teal-500/10 no-underline"
        >
          <User className="h-3.5 w-3.5" />
          <span>Continue as guest</span>
        </a>
      </div>
    </div>
  );
}
