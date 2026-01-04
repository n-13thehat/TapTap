"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Home as HomeIcon,
  Flame,
  Library as LibraryIcon,
  Mic2,
  ShoppingCart,
  Swords,
  Waves,
  Radio,
  MessageSquareText,
  Compass,
  Disc,
  Wallet as WalletIcon,
  Settings,
  Gamepad2,
  LogIn,
  UserPlus,
  User,
} from "lucide-react";

import { dynamicVisual } from "@/lib/utils/dynamic-imports";

// Enhanced dynamic imports with proper error handling
const MatrixRain = dynamicVisual(() => import("@/components/MatrixRain"));
const GalaxyScene = dynamicVisual(() => import("@/components/GalaxyScene"));

type NavKey =
  | "home"
  | "social"
  | "library"
  | "creator"
  | "battles"
  | "marketplace"
  | "surf"
  | "live"
  | "messages"
  | "explore"
  | "mainframe"
  | "wallet"
  | "settings"
  | "stemstation";

type NavItem = {
  key: NavKey;
  label: string;
  href: string; // iframe target (about:blank for home)
  icon: React.ComponentType<{ className?: string }>;
};

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

const NAV: NavItem[] = [
  { key: "home", label: "Access", href: "/featured-embed", icon: HomeIcon },
  { key: "social", label: "Social", href: "/social?embed=1", icon: Flame },
  { key: "library", label: "Library", href: "/library?embed=1", icon: LibraryIcon },
  { key: "creator", label: "Creator", href: "/creator?embed=1", icon: Mic2 },
  { key: "battles", label: "Battles", href: "/battles?embed=1", icon: Swords },
  { key: "marketplace", label: "Marketplace", href: "/marketplace?embed=1", icon: ShoppingCart },
  { key: "surf", label: "Surf", href: "/surf?embed=1", icon: Waves },
  { key: "live", label: "Live", href: "/live?embed=1", icon: Radio },
  { key: "messages", label: "Messages", href: "/dm?embed=1", icon: MessageSquareText },
  { key: "explore", label: "Explore", href: "/explore?embed=1", icon: Compass },
  { key: "mainframe", label: "Mainframe", href: "/mainframe?embed=1", icon: Disc },
  { key: "wallet", label: "Wallet", href: "/wallet?embed=1", icon: WalletIcon },
  { key: "settings", label: "Settings", href: "/settings?embed=1", icon: Settings },
  { key: "stemstation", label: "StemStation", href: "/stemstation?embed=1", icon: Gamepad2 },
];

export default function HomePageClient() {
  const [tab, setTab] = useState<NavKey>("home");
  const [frameSrc, setFrameSrc] = useState<string>("about:blank");
  const router = useRouter();

  useEffect(() => {
    const item = NAV.find((n) => n.key === tab);
    if (!item) {
      setFrameSrc("/featured-embed");
      return;
    }
    setFrameSrc(item.href);
  }, [tab]);

  const handleContinueAsGuest = () => {
    setTab("stemstation");
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      {/* Galactic matrix background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <GalaxyScene />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-[#020910] to-black opacity-80" />
        <div className="absolute inset-0 mix-blend-screen opacity-75">
          <MatrixRain speed={1.1} glow="strong" trail={1.35} />
        </div>
      </div>

      {/* Foreground shell */}
      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Top bar */}
        <header className="border-b border-teal-500/25 bg-black/80 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <div className="relative h-8 w-8 overflow-hidden rounded-xl border border-teal-400/60 bg-black/80 shadow-[0_0_28px_rgba(45,212,191,0.7)]">
                <Image
                  src="/branding/tap-logo.png"
                  alt="TapTap"
                  width={32}
                  height={32}
                  className="h-full w-full object-contain"
                  priority
                />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.3em] text-teal-200/90">
                  TapTap Access
                </span>
                <span className="text-[10px] text-teal-100/80">
                  Sign in, sign up, or jack in as guest.
                </span>
              </div>
            </div>

            <div className="hidden items-center gap-3 text-[11px] sm:flex">
              <Link
                href="/"
                className="rounded-full border border-teal-400/60 px-3 py-1.5 text-[11px] font-medium text-teal-100 hover:bg-teal-500/10"
              >
                Back to landing
              </Link>
            </div>
          </div>
        </header>

        {/* Main grid: sidebar + surface */}
        <div className="mx-auto flex w-full max-w-6xl flex-1 gap-4 px-4 py-4 sm:px-6 lg:px-8">
          {/* Sidebar */}
          <aside className="hidden w-64 shrink-0 flex-col rounded-2xl border border-teal-500/30 bg-black/70 p-3 backdrop-blur md:flex">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-200/80">
                Matrix Shell
              </div>
              <span className="rounded-full bg-teal-500/20 px-2 py-0.5 text-[9px] font-mono uppercase tracking-[0.18em] text-teal-100 ring-1 ring-teal-400/40">
                ZION build
              </span>
            </div>
            <nav className="flex-1 space-y-1 overflow-auto">
              {NAV.map((item) => {
                const Icon = item.icon;
                const active = tab === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setTab(item.key)}
                    className={`group flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition
                      ${
                        active
                          ? "border-teal-400/60 bg-teal-500/15 text-teal-50 shadow-[0_0_24px_rgba(45,212,191,0.7)]"
                          : "border-teal-500/20 bg-black/60 text-teal-100/80 hover:border-teal-300/60 hover:bg-black/80"
                      }`}
                  >
                    <Icon
                      className={`h-4 w-4 ${
                        active ? "text-teal-300" : "text-teal-100/70 group-hover:text-teal-50"
                      }`}
                    />
                    <span className="truncate text-xs sm:text-sm">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Surface */}
          <section className="flex flex-1 flex-col">
            {tab === "home" ? (
              <AuthPanel onContinueAsGuest={handleContinueAsGuest} routerPush={router.push} />
            ) : (
              <IframeSurface key={tab} src={frameSrc} />
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function AuthPanel({
  onContinueAsGuest,
  routerPush,
}: {
  onContinueAsGuest: () => void;
  routerPush: (href: string) => void;
}) {
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
      if (!response.ok) {
        throw new Error(payload.error ?? "Import failed");
      }
      setBandcampStatus(payload as BandcampImportStatus);
    } catch (error) {
      setBandcampError(error instanceof Error ? error.message : "Import failed");
    } finally {
      setBandcampLoading(false);
    }
  };

  return (
    <div className="relative flex h-full items-center justify-center">
      <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-teal-500/40 bg-black/80 p-6 shadow-[0_0_80px_rgba(45,212,191,0.8)] backdrop-blur">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.25),transparent_55%),radial-gradient(circle_at_bottom,_rgba(6,182,212,0.22),transparent_55%)] opacity-90" />
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
              Use your TapTap account to sync library, social graph, battles and marketplace, or
              jack in as a guest to explore the StemStation and matrix surfaces.
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
              <div className="font-mono uppercase tracking-[0.2em] text-teal-200/90">
                Bandcamp bridge
              </div>
              <button
                type="button"
                onClick={() => setShowBandcampSection((current) => !current)}
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
                  onChange={(event) => setBandcampUrl(event.target.value)}
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
                <div className="grid gap-1">
                  {bandcampStatus.mintedTracks.map((track) => (
                    <div key={track.marketplaceId} className="flex items-center justify-between text-[10px]">
                      <span className="text-teal-100">{track.title}</span>
                      <span className="text-teal-300">Minted as {track.marketplaceId}</span>
                    </div>
                  ))}
                  {bandcampStatus.mintedMerch.map((merch) => (
                    <div key={merch.marketplaceId} className="flex items-center justify-between text-[10px]">
                      <span className="text-teal-100">{merch.title}</span>
                      <span className="text-teal-300">Minted as {merch.marketplaceId}</span>
                    </div>
                  ))}
                </div>
                <div className="text-[10px] text-teal-200/80">
                  Uploaded items now live in the marketplace queue for review.
                </div>
              </div>
            )}

            {bandcampError && (
              <p className="text-[10px] text-rose-300">{bandcampError}</p>
            )}
          </div>

          <div className="space-y-2 rounded-2xl border border-teal-500/40 bg-black/70 p-3 text-xs text-teal-100/80">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-teal-500/20 text-teal-200 ring-1 ring-teal-400/60">
                  <User className="h-3.5 w-3.5" />
                </span>
                <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-200/85">
                  Continue as guest
                </div>
              </div>
              <a
                href="/social"
                className="rounded-full border border-teal-400/70 bg-black/80 px-3 py-1 text-[11px] font-semibold text-teal-100 shadow-[0_0_24px_rgba(45,212,191,0.7)] transition hover:border-teal-300 hover:bg-teal-500/10 no-underline"
              >
                Enter matrix as guest
              </a>
            </div>
            <p>
              Guest sessions can explore embedded surfaces like StemStation and the matrix views,
              but won&apos;t persist library or battle history until you create a TapTap account.
            </p>
          </div>

          <p className="text-[11px] text-teal-100/70">
            By proceeding you agree to operate responsibly inside the TapTap mainframe. Avoid
            sharing keys, secrets, or personal data directly in chats or embeds.
          </p>
        </div>
      </div>
    </div>
  );
}

function IframeSurface({ src, ...props }: { src: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className="relative h-[calc(100vh-5.5rem)] w-full overflow-hidden rounded-2xl border border-teal-500/35 bg-black/80 shadow-[0_0_60px_rgba(45,212,191,0.75)] backdrop-blur">
      {src === "about:blank" ? (
        <div className="flex h-full items-center justify-center text-xs text-teal-100/70">
          Select a surface from the left to load it inside the matrix iframe.
        </div>
      ) : (
        <iframe
          title="TapTap matrix surface"
          src={src}
          className="h-full w-full border-0"
          allow="clipboard-write; fullscreen; autoplay"
        />
      )}
      <div className="pointer-events-none absolute inset-0 rounded-2xl border border-teal-400/15" />
    </div>
  );
}
