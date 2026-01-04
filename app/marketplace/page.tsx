"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import {
  Activity,
  BadgeCheck,
  BellRing,
  Box,
  CheckCircle2,
  Coins,
  Flame,
  Hammer,
  Layers,
  Loader2,
  Music,
  Percent,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Tag,
  Zap,
  Disc,
  Search,
  Play,
  Pause,
  Plus,
  Heart,
} from "lucide-react";
import { CartDrawer, CartProvider, useCart } from "./CartContext";
import type { DeezerGenre } from "@/lib/deezer/client";
import { useExchangeRate } from "@/hooks/useExchangeRate";

type AssetType = "poster" | "music" | "bundle";
type ListingKind = "listing" | "drop" | "auction";

type Listing = {
  id: string;
  title: string;
  creator: string;
  creatorTier: number;
  type: AssetType;
  kind: ListingKind;
  priceTap: number;
  usd?: number;
  edition: string;
  remaining: string;
  statusNote?: string;
  image: string;
  rareZeroTax?: boolean;
  topBid?: number;
  endsIn?: string;
  includes?: string[];
  description?: string;
  splits: { creator: number; reserve: number; platform: number; tax?: number };
  tapGame?: boolean;
};

type DeezerListing = {
  id: string;
  type: "track" | "album";
  title: string;
  artistName: string;
  artistId: string;
  priceTap: number;
  coverUrl?: string;
  deezerUrl?: string;
  previewUrl?: string;
  genreId?: string;
  royaltyKey: string;
};

type DeezerArtistSearch = { id: number; name: string; picture?: string; picture_medium?: string; link?: string };

const DEEZER_TRACK_TAP_PRICE = 100;
const DEEZER_ALBUM_TAP_PRICE = 1000;

const LISTINGS: Listing[] = [
  {
    id: "lst_poster_neon",
    title: "Neon Orbit (Poster Unit)",
    creator: "Trinity",
    creatorTier: 4,
    type: "poster",
    kind: "listing",
    priceTap: 40,
    edition: "12 / 50",
    remaining: "38 left",
    statusNote: "Poster · Collector’s cut",
    image: "/branding/cropped_tap_logo.png",
    rareZeroTax: true,
    splits: { creator: 85, reserve: 10, platform: 5, tax: 0 },
  },
  {
    id: "lst_music_mftf",
    title: "Music For The Future (Album)",
    creator: "TapTap Collective",
    creatorTier: 3,
    type: "music",
    kind: "listing",
    priceTap: 15,
    edition: "Open",
    remaining: "Instant delivery",
    statusNote: "Album · Includes TapGame stems",
    image: "/branding/cropped_tap_logo.png",
    tapGame: true,
    splits: { creator: 80, reserve: 15, platform: 5, tax: 2 },
  },
  {
    id: "lst_bundle_flux",
    title: "Flux Bundle (Poster + Track + Perks)",
    creator: "Seraph",
    creatorTier: 3,
    type: "bundle",
    kind: "drop",
    priceTap: 55,
    edition: "20 / 100",
    remaining: "Drop live · 2h left",
    statusNote: "Bundle · Early access + tip window",
    image: "/branding/cropped_tap_logo.png",
    rareZeroTax: false,
    includes: ["Poster unit", "Exclusive track", "Early STEMStation map"],
    splits: { creator: 82, reserve: 13, platform: 5, tax: 0 },
  },
  {
    id: "lst_poster_midnight",
    title: "Midnight Horizon (1/1 Auction)",
    creator: "Neo",
    creatorTier: 2,
    type: "poster",
    kind: "auction",
    priceTap: 60,
    topBid: 72,
    edition: "1 / 1",
    remaining: "Auction · ends in 3h",
    statusNote: "Bids active",
    image: "/branding/cropped_tap_logo.png",
    rareZeroTax: false,
    splits: { creator: 88, reserve: 7, platform: 5, tax: 2 },
  },
  {
    id: "lst_music_pack",
    title: "STEMStation Pack (EP)",
    creator: "Pulse",
    creatorTier: 2,
    type: "music",
    kind: "drop",
    priceTap: 22,
    edition: "140 / 300",
    remaining: "Drop · 1d left",
    statusNote: "Game-ready stems",
    image: "/branding/cropped_tap_logo.png",
    tapGame: true,
    splits: { creator: 80, reserve: 15, platform: 5, tax: 1 },
  },
  {
    id: "lst_user_draft",
    title: "Your Draft Listing",
    creator: "You",
    creatorTier: 2,
    type: "poster",
    kind: "listing",
    priceTap: 18,
    edition: "0 / 25",
    remaining: "Not published",
    statusNote: "Publish from Creator Tools",
    image: "/branding/cropped_tap_logo.png",
    rareZeroTax: false,
    splits: { creator: 85, reserve: 10, platform: 5, tax: 2 },
  },
];

type Section = "explore" | "drops" | "activity" | "listings" | "creator" | "analytics";

function SectionTabs({ active, onChange }: { active: Section; onChange: (s: Section) => void }) {
  const tabs: { key: Section; label: string; icon: any }[] = [
    { key: "explore", label: "Explore", icon: Sparkles },
    { key: "drops", label: "Drops", icon: Flame },
    { key: "activity", label: "My Activity", icon: Activity },
    { key: "listings", label: "My Listings", icon: ShoppingBag },
    { key: "creator", label: "Creator Tools", icon: Box },
    { key: "analytics", label: "Analytics", icon: Percent },
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`flex items-center gap-2 rounded-full border px-3 py-1 text-sm transition ${
            active === t.key
              ? "border-emerald-400/60 bg-emerald-500/10 text-white"
              : "border-white/10 bg-white/5 text-white/70 hover:border-white/30"
          }`}
        >
          <t.icon className="h-4 w-4" />
          {t.label}
        </button>
      ))}
    </div>
  );
}

function Filters({
  search,
  setSearch,
  type,
  setType,
  sort,
  setSort,
}: {
  search: string;
  setSearch: (s: string) => void;
  type: AssetType | "all";
  setType: (t: AssetType | "all") => void;
  sort: "trending" | "newest" | "priceLow" | "ending";
  setSort: (s: "trending" | "newest" | "priceLow" | "ending") => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/40 px-3">
        <Tag className="h-4 w-4 text-white/50" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search assets, creators, collections"
          className="h-9 bg-transparent text-sm text-white outline-none placeholder:text-white/40"
        />
      </div>
      <div className="flex items-center gap-2 text-sm text-white/70">
        <span className="text-white/60">Type</span>
        {(["all", "poster", "music", "bundle"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`rounded-full border px-3 py-1 ${
              type === t ? "border-emerald-400/50 bg-emerald-500/10 text-white" : "border-white/10 bg-white/5 text-white/70"
            }`}
          >
            {t === "all" ? "All" : t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      <div className="ml-auto flex items-center gap-2 text-sm text-white/70">
        <span className="text-white/60">Sort</span>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as any)}
          className="rounded-md border border-white/10 bg-black px-2 py-1 text-white/80"
        >
          <option value="trending">Trending</option>
          <option value="newest">Newest</option>
          <option value="priceLow">Lowest price</option>
          <option value="ending">Ending soon</option>
        </select>
      </div>
    </div>
  );
}

function PriceTag({ tap, usd }: { tap: number; usd?: number }) {
  const { convertTapToUsd } = useExchangeRate();
  const displayUsd = usd !== undefined ? usd : convertTapToUsd(tap);

  return (
    <div className="flex items-center gap-2 text-sm text-white">
      <Coins className="h-4 w-4 text-amber-300" />
      <span className="font-semibold">{tap.toFixed(2)} TAP</span>
      <span className="text-xs text-white/60">≈ ${displayUsd.toFixed(2)}</span>
    </div>
  );
}

function TierBadge({ tier }: { tier: number }) {
  const palette = ["bg-zinc-800", "bg-emerald-500/20", "bg-cyan-500/20", "bg-indigo-500/20", "bg-amber-500/20"];
  const color = palette[Math.min(tier, palette.length - 1)];
  return (
    <span className={`rounded-full border border-white/10 px-2 py-0.5 text-[11px] font-semibold text-white/80 ${color}`}>
      Tier {tier}
    </span>
  );
}

function mapSearchTrackToListing(track: any): DeezerListing {
  const artistId = String(track?.artist?.id ?? "unknown");
  const cover = track?.album?.cover_medium || track?.album?.cover || track?.album?.cover_small;
  return {
    id: `deezer:track:${track.id}`,
    type: "track",
    title: track.title || "Untitled",
    artistName: track.artist?.name || "Unknown Artist",
    artistId,
    priceTap: DEEZER_TRACK_TAP_PRICE,
    coverUrl: cover,
    deezerUrl: track.link,
    previewUrl: track.preview,
    royaltyKey: `deezer:${artistId}`,
  };
}

function mapSearchAlbumToListing(album: any): DeezerListing {
  const artistId = String(album?.artist?.id ?? "unknown");
  const cover = album?.cover_medium || album?.cover || album?.cover_small;
  return {
    id: `deezer:album:${album.id}`,
    type: "album",
    title: album.title || "Untitled",
    artistName: album.artist?.name || "Unknown Artist",
    artistId,
    priceTap: DEEZER_ALBUM_TAP_PRICE,
    coverUrl: cover,
    deezerUrl: album.link,
    royaltyKey: `deezer:${artistId}`,
  };
}

function ArtistCard({ artist }: { artist: DeezerArtistSearch }) {
  const img = artist.picture_medium || artist.picture || "/branding/cropped_tap_logo.png";
  return (
    <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/30 p-2">
      <div className="relative h-12 w-12 overflow-hidden rounded-full border border-white/10 bg-black/40">
        <Image src={img} alt={artist.name} fill className="object-cover" />
      </div>
      <div className="flex-1">
        <div className="text-sm font-semibold text-white">{artist.name}</div>
        <div className="text-[11px] text-white/60">Artist</div>
      </div>
      {artist.link && (
        <a
          href={artist.link}
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 hover:border-white/30 hover:text-white"
        >
          View
        </a>
      )}
    </div>
  );
}

function DeezerCard({
  listing,
  onBuy,
  buying,
  onTogglePreview,
  isPreviewing,
  onOpenDetails,
}: {
  listing: DeezerListing;
  onBuy: (l: DeezerListing) => void;
  buying: boolean;
  onTogglePreview?: (l: DeezerListing) => void;
  isPreviewing?: boolean;
  onOpenDetails?: (l: DeezerListing) => void;
}) {
  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-xl border border-white/10 bg-white/5 p-3 shadow-inner transition hover:-translate-y-0.5 hover:border-emerald-400/40 hover:bg-white/10">
      <div className="relative mb-3 aspect-square w-full overflow-hidden rounded-lg border border-white/10 bg-black/40">
        <Image src={listing.coverUrl || "/branding/cropped_tap_logo.png"} alt={listing.title} fill className="object-cover transition duration-300 group-hover:scale-[1.02]" />
        <span className="absolute left-2 top-2 rounded-full bg-emerald-500/90 px-2 py-1 text-[11px] font-semibold text-black">
          {listing.type === "track" ? "Single" : "Album"}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/50">
          {listing.type === "track" ? <Music className="h-3.5 w-3.5 text-emerald-300" /> : <Disc className="h-3.5 w-3.5 text-emerald-300" />}
          {listing.type}
        </div>
        <div className="text-sm font-semibold text-white line-clamp-2">{listing.title}</div>
        <div className="flex items-center gap-2 text-xs text-white/60">
          <BadgeCheck className="h-4 w-4 text-emerald-300" />
          <span className="truncate">{listing.artistName}</span>
        </div>
        <PriceTag tap={listing.priceTap} />
        <div className="text-[11px] text-emerald-200">
          Escrowed until artist claims · Royalty key {listing.royaltyKey}
        </div>
        <div className="mt-auto flex items-center gap-2">
          {listing.previewUrl && (
            <button
              onClick={() => onTogglePreview?.(listing)}
              className="rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white/80 transition hover:border-white/30"
            >
              <span className="flex items-center gap-2">
                {isPreviewing ? <Pause className="h-4 w-4 text-emerald-300" /> : <Play className="h-4 w-4 text-emerald-300" />}
                {isPreviewing ? "Pause" : "Preview"}
              </span>
            </button>
          )}
          {/* Save removed from card per UX request; available in detail modal */}
          {onOpenDetails && (
            <button
              onClick={() => onOpenDetails(listing)}
              className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/80 transition hover:border-white/30 hover:text-white"
            >
              Details
            </button>
          )}
          <button
            onClick={() => onBuy(listing)}
            disabled={buying}
            className="flex-1 rounded-lg border border-emerald-400/60 bg-emerald-500/10 px-3 py-1.5 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:border-white/20 disabled:bg-white/10 disabled:text-white/40"
          >
            {buying ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Escrowing...
              </span>
            ) : (
              "Buy + Escrow"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeezerRail({
  onBuy,
  buyingId,
  onTogglePreview,
  previewingId,
  onOpenDetails,
}: {
  onBuy: (listing: DeezerListing) => Promise<void>;
  buyingId: string | null;
  onTogglePreview: (listing: DeezerListing) => void;
  previewingId: string | null;
  onOpenDetails: (listing: DeezerListing) => void;
}) {
  const [genres, setGenres] = useState<DeezerGenre[]>([]);
  const [activeGenre, setActiveGenre] = useState<string>("");
  const [listings, setListings] = useState<DeezerListing[]>([]);
  const [loadingGenres, setLoadingGenres] = useState<boolean>(true);
  const [loadingListings, setLoadingListings] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingGenres(true);
    fetch("/api/deezer/genres")
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error || "Unable to load genres");
        return (json.genres || []) as DeezerGenre[];
      })
      .then((data) => {
        if (cancelled) return;
        const filtered = (data || []).filter((g) => g.id !== 0).slice(0, 8);
        setGenres(filtered);
        if (filtered[0]?.id) setActiveGenre(String(filtered[0].id));
      })
      .catch((err: any) => {
        if (!cancelled) setError(err?.message || "Unable to load genres");
      })
      .finally(() => {
        if (!cancelled) setLoadingGenres(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!activeGenre) return;
    let cancelled = false;
    setLoadingListings(true);
    setError(null);
    fetch(`/api/marketplace/deezer/listings?genreId=${activeGenre}`)
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error || "Unable to load listings");
        return (json.listings || []) as DeezerListing[];
      })
      .then((data) => {
        if (!cancelled) setListings(data);
      })
      .catch((err: any) => {
        if (!cancelled) setError(err?.message || "Unable to load listings");
      })
      .finally(() => {
        if (!cancelled) setLoadingListings(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeGenre]);

  const isLoading = loadingGenres || loadingListings;

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-950/60 via-black to-slate-950 p-4 shadow-xl">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">Streaming Picks</div>
          <div className="text-lg font-semibold text-white">Top 10 artists</div>
          <div className="text-sm text-white/70">Singles 100 TAP · Albums 1000 TAP.</div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {loadingGenres && (
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading genres...
          </div>
        )}
        {genres.map((g) => (
          <button
            key={g.id}
            onClick={() => setActiveGenre(String(g.id))}
            className={`rounded-full border px-3 py-1 text-sm transition ${
              String(g.id) === activeGenre
                ? "border-emerald-400/60 bg-emerald-500/10 text-white"
                : "border-white/10 bg-white/5 text-white/70 hover:border-white/30"
            }`}
          >
            {g.name}
          </button>
        ))}
      </div>

      {error && <div className="mt-3 rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">{error}</div>}

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading &&
          Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="h-52 rounded-xl border border-white/10 bg-white/5" />
          ))}
        {!isLoading && listings.length === 0 && (
          <div className="col-span-full rounded-xl border border-white/10 bg-white/5 p-4 text-center text-sm text-white/60">
            No items found for this genre yet.
          </div>
        )}
        {!isLoading &&
          listings.slice(0, 9).map((listing) => (
            <DeezerCard
              key={listing.id}
              listing={listing}
              onBuy={onBuy}
              buying={buyingId === listing.id}
              onTogglePreview={onTogglePreview}
              isPreviewing={previewingId === listing.id}
              onOpenDetails={onOpenDetails}
            />
          ))}
      </div>
    </div>
  );
}

function DeezerSearchResults({
  query,
  onBuy,
  buyingId,
  onTogglePreview,
  previewingId,
  onOpenDetails,
}: {
  query: string;
  onBuy: (listing: DeezerListing) => Promise<void>;
  buyingId: string | null;
  onTogglePreview: (listing: DeezerListing) => void;
  previewingId: string | null;
  onOpenDetails: (listing: DeezerListing) => void;
}) {
  const [tracks, setTracks] = useState<DeezerListing[]>([]);
  const [albums, setAlbums] = useState<DeezerListing[]>([]);
  const [artists, setArtists] = useState<DeezerArtistSearch[]>([]);
  const [genres, setGenres] = useState<DeezerGenre[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load genres once for quick filter badges
  useEffect(() => {
    fetch("/api/deezer/genres")
      .then((r) => r.json())
      .then((json) => setGenres(json?.genres || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setTracks([]);
      setAlbums([]);
      setArtists([]);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/deezer/search?q=${encodeURIComponent(term)}&type=all&limit=6`)
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error || "Search failed");
        return json;
      })
      .then((json) => {
        if (cancelled) return;
        const trackListings = (json.tracks || []).map(mapSearchTrackToListing);
        const albumListings = (json.albums || []).map(mapSearchAlbumToListing);
        setTracks(trackListings);
        setAlbums(albumListings);
        setArtists(json.artists || []);
      })
      .catch((err: any) => {
        if (!cancelled) setError(err?.message || "Search failed");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [query]);

  const matchedGenres = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (term.length < 2) return [];
    return genres.filter((g) => g.name?.toLowerCase().includes(term)).slice(0, 6);
  }, [genres, query]);

  if (query.trim().length < 2) return null;

  return (
    <div className="space-y-3 rounded-2xl border border-white/10 bg-black/40 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        <Search className="h-4 w-4 text-emerald-300" /> Streaming search results for “{query}”
      </div>
      {error && <div className="rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">{error}</div>}
      {matchedGenres.length > 0 && (
        <div className="flex flex-wrap gap-2 text-xs text-white/70">
          {matchedGenres.map((g) => (
            <span key={g.id} className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
              {g.name}
            </span>
          ))}
        </div>
      )}
      {loading && (
        <div className="flex items-center gap-2 text-sm text-white/70">
          <Loader2 className="h-4 w-4 animate-spin" /> Searching catalog...
        </div>
      )}
      {!loading && (tracks.length > 0 || albums.length > 0) && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[...tracks, ...albums].map((listing) => (
            <DeezerCard
              key={listing.id}
              listing={listing}
              onBuy={onBuy}
              buying={buyingId === listing.id}
              onTogglePreview={onTogglePreview}
              isPreviewing={previewingId === listing.id}
              onOpenDetails={onOpenDetails}
            />
          ))}
        </div>
      )}
      {!loading && artists.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs uppercase tracking-[0.2em] text-white/50">Artists</div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {artists.slice(0, 6).map((a: DeezerArtistSearch) => (
              <ArtistCard key={a.id} artist={a} />
            ))}
          </div>
        </div>
      )}
      {!loading && !error && tracks.length === 0 && albums.length === 0 && artists.length === 0 && (
        <div className="text-sm text-white/60">No matches yet. Try another keyword.</div>
      )}
    </div>
  );
}

function ListingCard({ item, onSelect }: { item: Listing; onSelect: (l: Listing) => void }) {
  const rare = item.rareZeroTax;
  return (
    <button
      onClick={() => onSelect(item)}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-white/10 bg-white/5 text-left transition hover:-translate-y-1 hover:border-emerald-400/40 hover:bg-white/10"
    >
      <div className="relative aspect-square w-full bg-black/40">
        {item.kind === "drop" && (
          <span className="absolute left-2 top-2 rounded-full bg-emerald-500/90 px-2 py-1 text-[11px] font-semibold text-black">Drop</span>
        )}
        {item.kind === "auction" && (
          <span className="absolute left-2 top-2 rounded-full bg-amber-400/90 px-2 py-1 text-[11px] font-semibold text-black">Auction</span>
        )}
        {rare && (
          <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-teal-500/90 px-2 py-1 text-[11px] font-semibold text-black">
            <Zap className="h-3 w-3" />
            0% tax
          </span>
        )}
        <Image src={item.image} alt={item.title} fill className="object-cover" />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-center justify-between gap-2 text-xs text-white/60">
          <span className="uppercase tracking-[0.18em] text-white/40">{item.type}</span>
          <TierBadge tier={item.creatorTier} />
        </div>
        <div className="truncate text-sm font-semibold text-white">{item.title}</div>
        <div className="flex items-center gap-2 text-xs text-white/60">
          <BadgeCheck className="h-4 w-4 text-emerald-300" />
          <span className="truncate">{item.creator}</span>
        </div>
        <PriceTag tap={item.topBid ?? item.priceTap} usd={item.usd} />
        <div className="text-xs text-white/60">
          {item.edition} · {item.remaining}
        </div>
        {item.statusNote && <div className="text-xs text-white/50 line-clamp-2">{item.statusNote}</div>}
      </div>
    </button>
  );
}

function DetailPanel({ item, onClose }: { item: Listing | null; onClose: () => void }) {
  const { add, setOpen } = useCart();
  if (!item) return null;
  const totalTax = item.splits.tax ?? 0;
  const netCreator = (item.splits.creator / 100) * item.priceTap;
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm">
      <div className="absolute right-0 top-0 h-full w-full max-w-3xl overflow-y-auto border-l border-white/10 bg-black p-6 shadow-2xl">
        <div className="flex items-start gap-4">
          <div className="relative h-48 w-48 overflow-hidden rounded-xl border border-white/10 bg-black/40">
            <Image src={item.image} alt={item.title} fill className="object-cover" />
            {item.rareZeroTax && (
              <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-teal-500/90 px-2 py-1 text-[11px] font-semibold text-black">
                <Zap className="h-3 w-3" /> Vortex window
              </span>
            )}
          </div>
          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-[0.2em] text-white/40">{item.type}</div>
                <div className="text-2xl font-semibold text-white">{item.title}</div>
                <div className="flex items-center gap-2 text-sm text-white/70">
                  <BadgeCheck className="h-4 w-4 text-emerald-300" />
                  {item.creator}
                  <TierBadge tier={item.creatorTier} />
                </div>
              </div>
              <button onClick={onClose} className="rounded-md border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/70 hover:bg-white/10">
                Close
              </button>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-2">
              <div className="flex items-center gap-2">
                {item.kind === "auction" ? <Hammer className="h-4 w-4 text-amber-300" /> : <ShoppingBag className="h-4 w-4 text-emerald-300" />}
                <div className="text-white font-semibold">{item.kind === "auction" ? "Auction" : "Buy now"}</div>
                {item.rareZeroTax && <span className="text-xs text-teal-200">(0% tax active)</span>}
              </div>
              <PriceTag tap={item.topBid ?? item.priceTap} usd={item.usd} />
              <div className="text-xs text-white/60">{item.edition} · {item.remaining}</div>
              {item.endsIn && <div className="text-xs text-amber-300">Ends in {item.endsIn}</div>}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    add({ id: item.id, title: item.title, priceCents: Math.round((item.priceTap || 0) * 100) });
                    setOpen(true);
                  }}
                  className="rounded-lg border border-emerald-400/50 bg-emerald-500/10 px-3 py-1.5 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/20"
                >
                  {item.kind === "auction" ? "Place bid" : "Buy now"}
                </button>
                <button className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/80 hover:bg-white/10">
                  Make offer
                </button>
                <button className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/80 hover:bg-white/10">
                  Watchlist
                </button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="text-sm font-semibold text-white">Tokenomics</div>
                <div className="mt-2 grid gap-2 text-xs text-white/70">
                  <div className="flex items-center justify-between">
                    <span>Creator</span>
                    <span>{item.splits.creator}% ({netCreator.toFixed(2)} TAP)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Trap Reserve</span>
                    <span>{item.splits.reserve}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Platform</span>
                    <span>{item.splits.platform}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Tax</span>
                    <span>{totalTax}% {item.rareZeroTax ? "(waived now)" : ""}</span>
                  </div>
                </div>
                <div className="mt-2 rounded-lg border border-white/10 bg-black/30 p-2 text-[11px] text-white/60">
                  On purchase: creator proceeds stream to wallet; Reserve receives stability contribution; platform fee settles instantly.
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-2">
                <div className="text-sm font-semibold text-white">Included</div>
                <ul className="text-xs text-white/70 space-y-1">
                  {(item.includes ?? ["Unlock in Library", "Share to Social", "Vault + Broker DMs for transfers"]).map((x, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
                      {x}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AgentDMs() {
  const messages = [
    {
      agent: "Broker",
      body: "New offer: 30 TAP for Neon Orbit. Accept · Counter · View",
      tone: "text-emerald-300",
    },
    {
      agent: "Vault",
      body: "+40 TAP from sale of Flux Bundle. Balance 145 TAP.",
      tone: "text-cyan-300",
    },
    {
      agent: "Flux",
      body: "0% tax window is LIVE for posters for 20 minutes.",
      tone: "text-amber-300",
    },
    {
      agent: "Serenity",
      body: "Drop sold 50%. Want to post to Social?",
      tone: "text-indigo-300",
    },
  ];
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        <BellRing className="h-4 w-4 text-cyan-300" /> Agent DMs
      </div>
      <div className="space-y-2">
        {messages.map((m, i) => (
          <div key={i} className="rounded-lg border border-white/10 bg-black/40 p-2 text-xs text-white/80">
            <div className={`font-semibold ${m.tone}`}>{m.agent}</div>
            <div>{m.body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivityFeed() {
  const items = [
    { label: "Bought Neon Orbit", tap: -40, agent: "Vault", time: "2m ago" },
    { label: "Outbid on Midnight Horizon", tap: 0, agent: "Broker", time: "18m ago" },
    { label: "Drop reminder: Flux Bundle ends soon", tap: 0, agent: "Serenity", time: "1h ago" },
  ];
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        <Activity className="h-4 w-4 text-emerald-300" /> My Activity
      </div>
      <div className="space-y-2">
        {items.map((x, i) => (
          <div key={i} className="flex items-center justify-between rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white/80">
            <span>{x.label}</span>
            <div className="flex items-center gap-3 text-xs text-white/60">
              {x.tap !== 0 && <span className={x.tap > 0 ? "text-emerald-300" : "text-amber-300"}>{x.tap > 0 ? "+" : ""}{x.tap} TAP</span>}
              <span>{x.agent}</span>
              <span>{x.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalyticsPanel() {
  const cards = [
    { label: "24h Volume", value: "4,820 TAP", icon: Coins, tone: "text-amber-300" },
    { label: "Reserve inflow", value: "480 TAP", icon: ShieldCheck, tone: "text-cyan-300" },
    { label: "0% windows hit", value: "3", icon: Zap, tone: "text-emerald-300" },
    { label: "Creator earnings", value: "3,100 TAP", icon: BadgeCheck, tone: "text-indigo-300" },
  ];
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {cards.map((c) => (
        <div key={c.label} className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="flex items-center gap-2 text-sm text-white/70">
            <c.icon className={`h-4 w-4 ${c.tone}`} />
            {c.label}
          </div>
          <div className="mt-1 text-xl font-semibold text-white">{c.value}</div>
          <div className="text-xs text-white/50">Live pull from TapTap Marketplace ledger (placeholder).</div>
        </div>
      ))}
    </div>
  );
}

function CreatorTools() {
  const items = [
    { title: "Create listing", desc: "List a poster, track, album, or bundle", action: "Start" },
    { title: "Launch drop", desc: "Schedule and price a limited release", action: "Launch" },
    { title: "Set royalties", desc: "Configure creator royalty on secondary sales", action: "Configure" },
  ];
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {items.map((i) => (
        <div key={i.title} className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
          <div className="text-white font-semibold">{i.title}</div>
          <div className="text-xs text-white/60">{i.desc}</div>
          <button className="rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-200 hover:bg-emerald-500/20">
            {i.action}
          </button>
        </div>
      ))}
    </div>
  );
}

function ExploreSection({
  listings,
  onSelect,
}: {
  listings: Listing[];
  onSelect: (l: Listing) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {listings.map((l) => (
        <ListingCard key={l.id} item={l} onSelect={onSelect} />
      ))}
      {listings.length === 0 && (
        <div className="col-span-full rounded-xl border border-dashed border-white/15 bg-white/5 p-6 text-center text-sm text-white/70">
          Nothing matches. Try different filters or check Drops.
        </div>
      )}
    </div>
  );
}

function MarketplaceShell() {
  const [section, setSection] = useState<Section>("explore");
  const [type, setType] = useState<AssetType | "all">("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"trending" | "newest" | "priceLow" | "ending">("trending");
  const [selected, setSelected] = useState<Listing | null>(null);
  const { rate: tapUsdRate, loading: rateLoading, error: rateError } = useExchangeRate();
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [detailListing, setDetailListing] = useState<DeezerListing | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const tapGameOnly = useMemo(() => {
    const param =
      searchParams?.get("tapgame") ||
      searchParams?.get("stemstation") ||
      searchParams?.get("STEMSTATION");
    if (!param) return false;
    const normalized = param.toLowerCase();
    return normalized === "1" || normalized === "true";
  }, [searchParams]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    let arr = LISTINGS;
    if (tapGameOnly) arr = arr.filter((l) => l.tapGame);
    if (section === "drops") arr = arr.filter((l) => l.kind === "drop");
    if (section === "listings") arr = arr.filter((l) => l.creator === "You");
    if (section === "explore") arr = arr;
    if (type !== "all") arr = arr.filter((l) => l.type === type);
    if (needle) arr = arr.filter((l) => `${l.title} ${l.creator}`.toLowerCase().includes(needle));
    if (sort === "priceLow") arr = [...arr].sort((a, b) => (a.priceTap || 0) - (b.priceTap || 0));
    if (sort === "ending") arr = [...arr].sort((a, b) => (a.endsIn || "").localeCompare(b.endsIn || ""));
    if (sort === "newest") arr = arr;
    return arr;
  }, [section, type, search, sort, tapGameOnly]);

  // Load saved Deezer items for current user
  useEffect(() => {
    const loadSaved = async () => {
      try {
        const res = await fetch("/api/library/tracks?provider=deezer&limit=500");
        const json = await res.json().catch(() => ({}));
        const ids = new Set<string>();
        (json?.items || []).forEach((it: any) => {
          const id = String(it?.id || "");
          if (id.startsWith("deezer:")) ids.add(id);
        });
        setSavedIds(ids);
      } catch {
        // ignore
      }
    };
    if (session?.user) loadSaved();
  }, [session]);

  const openDetails = (listing: DeezerListing) => {
    setDetailListing(listing);
  };

  const closeDetails = () => setDetailListing(null);

  const buyDeezer = async (listing: DeezerListing) => {
    setBuyingId(listing.id);
    try {
      const res = await fetch("/api/marketplace/deezer/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: listing.id }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) throw new Error(json.error || "Purchase failed");
      alert(`Escrowed ${json.netTap || listing.priceTap} TAP for ${listing.artistName}. Artist can claim once verified.`);
    } catch (err: any) {
      alert(err?.message || "Purchase failed");
    } finally {
      setBuyingId(null);
    }
  };

  const togglePreview = (listing: DeezerListing) => {
    if (!listing.previewUrl) return;
    // Pause currently playing preview
    if (previewingId === listing.id) {
      audioRef.current?.pause();
      audioRef.current = null;
      setPreviewingId(null);
      return;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    const audio = new Audio(listing.previewUrl);
    audioRef.current = audio;
    setPreviewingId(listing.id);
    audio.play().catch(() => setPreviewingId(null));
    audio.onended = () => {
      setPreviewingId(null);
      audioRef.current = null;
    };
  };

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  const toggleSave = async (listing: DeezerListing) => {
    const isSaved = savedIds.has(listing.id);
    setSavingId(listing.id);
    try {
      const res = await fetch("/api/library/tracks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: isSaved ? "unsave" : "save",
          provider: "deezer",
          externalId: listing.id,
          title: listing.title,
          artist: listing.artistName,
          album: listing.type === "album" ? listing.title : "",
          coverUrl: listing.coverUrl,
          audioUrl: listing.previewUrl,
          deezerUrl: listing.deezerUrl,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) throw new Error(json.error || "Save failed");
      setSavedIds((prev) => {
        const next = new Set(Array.from(prev));
        if (isSaved) next.delete(listing.id);
        else next.add(listing.id);
        return next;
      });
    } catch (err: any) {
      alert(err?.message || "Save failed");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-black text-white">
      <div className="border-b border-white/10 bg-black/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4">
          <div className="flex items-center gap-3">
            <Layers className="h-6 w-6 text-emerald-300" />
            <div>
              <div className="text-sm uppercase tracking-[0.2em] text-white/50">TapTap Marketplace</div>
              <div className="text-2xl font-bold text-white">Look out for sales and Easter Eggs!</div>
            </div>
          </div>
          <div className="text-sm text-white/70">
            Buy posters, tracks, albums, and bundles. See splits to creators, Trap Reserve, platform, and live 0% vortex windows. Notifications arrive as DMs from Broker, Vault, Flux, and Serenity.
          </div>
          <div className="flex items-center gap-2 text-xs text-white/60">
            <Coins className="h-3 w-3 text-amber-300" />
            <span>
              TAP/USD: {rateLoading ? "Loading..." : rateError ? "Error" : `$${tapUsdRate.toFixed(4)}`}
            </span>
            {rateError && (
              <span className="text-red-400" title={rateError}>⚠️</span>
            )}
          </div>
          {tapGameOnly && (
            <div className="flex items-center gap-2 text-xs text-emerald-200">
              STEMSTATION view enabled – showing TapGame-ready items only.
            </div>
          )}
          <SectionTabs active={section} onChange={setSection} />
          <Filters search={search} setSearch={setSearch} type={type} setType={setType} sort={sort} setSort={setSort} />
        </div>
      </div>

      {detailListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur">
          <div className="relative w-[520px] max-w-[95vw] rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 via-black to-slate-950 p-5 shadow-2xl">
            <button
              onClick={closeDetails}
              className="absolute right-3 top-3 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/70 hover:border-white/30 hover:text-white"
            >
              Close
            </button>
            <div className="flex gap-4">
              <div className="relative h-32 w-32 overflow-hidden rounded-xl border border-white/10 bg-black/40">
                <Image
                  src={detailListing.coverUrl || "/branding/cropped_tap_logo.png"}
                  alt={detailListing.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1 space-y-2">
                <div className="text-xs uppercase tracking-[0.18em] text-emerald-200">
                  {detailListing.type === "track" ? "Single" : "Album"}
                </div>
                <div className="text-lg font-semibold text-white leading-tight">{detailListing.title}</div>
                <div className="flex items-center gap-2 text-sm text-white/70">
                  <BadgeCheck className="h-4 w-4 text-emerald-300" />
                  <span>{detailListing.artistName}</span>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-white/70">
                  <span>Release date: {new Date().toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
                  <span className="text-white/50">•</span>
                  <span>{detailListing.type === "track" ? "Single" : "Album"} · Streaming ready</span>
                </div>
                <PriceTag tap={detailListing.priceTap} />
                <div className="text-xs text-white/60">Royalty key {detailListing.royaltyKey}</div>
              </div>
            </div>
            <div className="mt-4 space-y-3 text-sm text-white/80">
              <div className="flex flex-wrap gap-2">
                {detailListing.previewUrl && (
                  <button
                    onClick={() => onTogglePreview(detailListing)}
                    className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white hover:border-white/30"
                  >
                    {previewingId === detailListing.id ? <Pause className="h-4 w-4 text-emerald-300" /> : <Play className="h-4 w-4 text-emerald-300" />}
                    {previewingId === detailListing.id ? "Pause Preview" : "Play Preview"}
                  </button>
                )}
                <button
                  onClick={() => toggleSave(detailListing)}
                  disabled={savingId === detailListing.id}
                  className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white hover:border-white/30 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingId === detailListing.id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                    </>
                  ) : savedIds.has(detailListing.id) ? (
                    <>
                      <Heart className="h-4 w-4 text-pink-300" /> Remove from Library
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 text-emerald-300" /> Add to Library
                    </>
                  )}
                </button>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="mb-2 text-xs uppercase tracking-[0.18em] text-white/50">
                  {detailListing.type === "album" ? "Album Tracklist" : "Single"}
                </div>
                <div className="space-y-2">
                  {(detailListing.type === "album"
                    ? Array.from({ length: 6 }).map((_, idx) => ({
                        id: `${detailListing.id}-track-${idx + 1}`,
                        title: `${detailListing.title} — Track ${idx + 1}`,
                        artist: detailListing.artistName,
                        duration: `3:${(idx + 2).toString().padStart(2, "0")}`,
                        previewUrl: idx === 0 ? detailListing.previewUrl : undefined,
                      }))
                    : [
                        {
                          id: detailListing.id,
                          title: detailListing.title,
                          artist: detailListing.artistName,
                          duration: "0:30",
                          previewUrl: detailListing.previewUrl,
                        },
                      ]
                  ).map((track, idx) => (
                    <div
                      key={track.id}
                      className="flex items-center justify-between rounded-lg border border-white/10 bg-black/40 px-3 py-2 hover:border-emerald-300/40"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-white/50 w-4 text-right">{idx + 1}</span>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-white line-clamp-1">{track.title}</span>
                          <span className="text-xs text-white/60 line-clamp-1">{track.artist}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-white/60">{track.duration}</span>
                        {track.previewUrl ? (
                          <button
                            onClick={() => onTogglePreview(detailListing)}
                            className="rounded-full border border-emerald-400/60 bg-emerald-500/10 p-2 text-white hover:bg-emerald-500/20"
                          >
                            {previewingId === detailListing.id ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </button>
                        ) : (
                          <span className="text-[11px] text-white/50">No preview</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {detailListing.previewUrl && (
                <div className="text-xs text-white/60">
                  30s preview available. Full playback unlocks after purchase/claim.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        <DeezerRail
          onBuy={buyDeezer}
          buyingId={buyingId}
          onTogglePreview={togglePreview}
          previewingId={previewingId}
          onOpenDetails={openDetails}
        />
        {search.trim().length >= 2 && (
          <DeezerSearchResults
            query={search}
            onBuy={buyDeezer}
            buyingId={buyingId}
            onTogglePreview={togglePreview}
            previewingId={previewingId}
            onOpenDetails={openDetails}
          />
        )}
        {section === "explore" && <ExploreSection listings={filtered} onSelect={setSelected} />}
        {section === "drops" && <ExploreSection listings={filtered} onSelect={setSelected} />}
        {section === "activity" && <ActivityFeed />}
        {section === "listings" && (
          <div className="space-y-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
              You have no active listings yet. Creator tiers can list assets here and Broker will DM you when they sell.
            </div>
            <CreatorTools />
          </div>
        )}
        {section === "creator" && <CreatorTools />}
        {section === "analytics" && <AnalyticsPanel />}

        <AgentDMs />
      </div>

      <DetailPanel item={selected} onClose={() => setSelected(null)} />
      <CartDrawer />
    </div>
  );
}

export default function MarketplacePage() {
  return (
    <CartProvider>
      <MarketplaceShell />
    </CartProvider>
  );
}
