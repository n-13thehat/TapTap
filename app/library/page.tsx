"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlbumsSection,
  ArtistsSection,
  GameSection,
  MainframeSection,
  PlayerBar,
  PlaylistDrawer,
  PlaylistsSection,
  PostersSection,
  RecommendationsSection,
  SettingsSection,
  Sidebar,
  SongsSection,
  SurfSection,
  Topbar,
  TradesSection,
} from "./components";
import { SectionKey, LibraryPayload, Track, Playlist, EMPTY_LIBRARY_PAYLOAD } from "./types";
import { DEFAULT_COVER } from "./types";
import FeaturedSection from "@/components/library/FeaturedSection";
import { useFeaturedContent } from "@/hooks/useFeaturedContent";
import DiscoveryEngine from "@/components/discovery/DiscoveryEngine";

const FALLBACK_LIBRARY: LibraryPayload = EMPTY_LIBRARY_PAYLOAD;
const DEFAULT_ALBUM_SLUG = encodeURIComponent("Music For The Future -vx9");
const DEFAULT_ASSET_BASE = `/api/library/albums/${DEFAULT_ALBUM_SLUG}`;

function buildLocalDefaultLibrary(): LibraryPayload {
  const cover = `${DEFAULT_ASSET_BASE}/${encodeURIComponent("cover (1).jpg")}`;
  const files = [
    "2Horns.mp3",
    "Lost (Stay Frosty).mp3",
    "MHMH.mp3",
    "deep end.mp3",
    "life is worth the wait 2.0.mp3",
  ];
  const tracks = files.map((name, idx) => ({
    id: `default-track-${idx}`,
    title: name.replace(/\.mp3$/i, ""),
    artist: "VX9",
    album: "Music For The Future - Vx9",
    duration: 180,
    cover,
    audioUrl: `${DEFAULT_ASSET_BASE}/${encodeURIComponent(name)}`,
    saved: true,
    createdAt: new Date().toISOString(),
  }));

  return {
    ...EMPTY_LIBRARY_PAYLOAD,
    tracks,
    albums: [
      {
        id: "default-album-mftf",
        title: "Music For The Future - Vx9",
        artist: "VX9",
        cover,
        tracks: tracks.length,
        releaseDate: new Date().toISOString(),
      },
    ],
    artists: [
      { id: "default-artist-vx9", name: "VX9", avatar: cover, tracks: tracks.length, followers: 0 },
    ],
    recommendations: tracks.slice(0, 3),
  };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function LibraryPage() {
  const [collapsed, setCollapsed] = useState(false);
  const [selected, setSelected] = useState<SectionKey>("featured");
  const [query, setQuery] = useState("");
  const [current, setCurrent] = useState<Track | null>(null);
  const [playing, setPlaying] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activePlaylist, setActivePlaylist] = useState<Playlist | null>(null);
  const [libraryData, setLibraryData] = useState<LibraryPayload>(EMPTY_LIBRARY_PAYLOAD);
  const hasContent =
    (libraryData.tracks?.length ?? 0) > 0 ||
    (libraryData.playlists?.length ?? 0) > 0 ||
    (libraryData.albums?.length ?? 0) > 0;

  useEffect(() => {
    // Try to hydrate from API; otherwise stay empty and prompt user actions.
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/library", { cache: "no-store" });
        if (!cancelled && res.ok) {
          const json = await res.json();
          const next = { ...FALLBACK_LIBRARY, ...json };
          if ((next.tracks?.length || 0) === 0) {
            setLibraryData(buildLocalDefaultLibrary());
          } else {
            setLibraryData(next);
          }
          return;
        }
      } catch {
        // ignore; leave empty
      }
      if (!cancelled) {
        setLibraryData(buildLocalDefaultLibrary());
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const data = libraryData ?? FALLBACK_LIBRARY;

  const filteredTracks = useMemo(() => {
    if (!query.trim()) return data.tracks;
    const needle = query.trim().toLowerCase();
    return data.tracks.filter((t) => `${t.title} ${t.artist} ${t.album ?? ""}`.toLowerCase().includes(needle));
  }, [data.tracks, query]);

  const filteredAlbums = useMemo(() => {
    if (!query.trim()) return data.albums;
    const needle = query.trim().toLowerCase();
    return data.albums.filter((a) => `${a.title} ${a.artist}`.toLowerCase().includes(needle));
  }, [data.albums, query]);

  const filteredArtists = useMemo(() => {
    if (!query.trim()) return data.artists;
    const needle = query.trim().toLowerCase();
    return data.artists.filter((a) => a.name.toLowerCase().includes(needle));
  }, [data.artists, query]);

  const filteredPlaylists = useMemo(() => {
    if (!query.trim()) return data.playlists;
    const needle = query.trim().toLowerCase();
    return data.playlists.filter((p) => p.title.toLowerCase().includes(needle));
  }, [data.playlists, query]);

  const handlePlay = (t: Track) => {
    setCurrent(t);
    setPlaying(true);
  };

  const handleSave = (t: Track) => {
    setLibraryData((prev) => ({
      ...prev,
      tracks: prev.tracks.map((track) => (track.id === t.id ? { ...track, saved: !track.saved } : track)),
    }));
  };

  const handleAddToPlaylist = (t: Track) => {
    setActivePlaylist({
      id: "quick-add",
      title: `Added “${t.title}”`,
      cover: t.cover ?? DEFAULT_COVER,
      tracks: 1,
      updatedAt: new Date().toISOString(),
    });
    setDrawerOpen(true);
  };

  const handleAttachLyrics = () => {
    // Placeholder hook: in a real flow this would open a lyrics sheet/viewer.
  };

  const section = (() => {
    switch (selected) {
      case "featured":
        return <FeaturedSection onPlayTrack={handlePlay} />;
      case "songs":
        return (
          <SongsSection
            query={query}
            tracks={filteredTracks}
            onPlay={handlePlay}
            onSave={handleSave}
            onAddToPlaylist={handleAddToPlaylist}
            onAttachLyrics={handleAttachLyrics}
          />
        );
      case "playlists":
        return <PlaylistsSection playlists={filteredPlaylists} onOpen={(p) => { setActivePlaylist(p); setDrawerOpen(true); }} />;
      case "artists":
        return <ArtistsSection artists={filteredArtists} />;
      case "albums":
        return <AlbumsSection albums={filteredAlbums} />;
      case "posters":
        return <PostersSection posters={data.posters} />;
      case "trades":
        return <TradesSection trades={data.trades} />;
      case "mainframe":
        return <MainframeSection />;
      case "surf":
        return <SurfSection />;
      case "game":
        return <GameSection />;
      case "settings":
        return <SettingsSection />;
      default:
        return (
          <div className="space-y-8">
            <FeaturedSection onPlayTrack={handlePlay} />
            <DiscoveryEngine />
            {data.recommendations.length > 0 && (
              <RecommendationsSection recommendations={data.recommendations} />
            )}
          </div>
        );
    }
  })();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-black to-slate-900 text-white">
      {/* Tidal-style Header */}
      <Topbar query={query} onQuery={setQuery} />

      <div className="flex h-[calc(100vh-140px)]">
        {/* Tidal-style Sidebar */}
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((v) => !v)}
          selected={selected}
          onSelect={setSelected}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-8">
            {/* Tidal-style Welcome Banner */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-800/50 via-slate-700/30 to-slate-800/50 p-8 backdrop-blur-sm border border-white/5"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 via-transparent to-cyan-500/5" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                    <span className="text-xs font-medium text-teal-300 uppercase tracking-wider">Your Library</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="px-2 py-1 text-xs bg-white/5 rounded-full border border-white/10 text-white/60">HiFi</span>
                    <span className="px-2 py-1 text-xs bg-white/5 rounded-full border border-white/10 text-white/60">Lossless</span>
                    <span className="px-2 py-1 text-xs bg-teal-500/10 rounded-full border border-teal-400/20 text-teal-300">Premium</span>
                  </div>
                </div>
                <h1 className="text-2xl font-light text-white mb-2">
                  Your TapTap Library
                </h1>
                <p className="text-white/70 text-sm leading-relaxed max-w-2xl">
                  Experience your personal music vault with lossless quality, exclusive content, and seamless integration across TapTap's ecosystem.
                </p>
              </div>
            </motion.div>

            {!hasContent && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-sm font-semibold text-white">Your library is empty</div>
                  <div className="text-xs text-white/60">Upload a track or be the first to add one from Surf.</div>
                </div>
                <div className="flex gap-2">
                  <a
                    href="/upload"
                    className="rounded-md bg-teal-600 px-3 py-2 text-sm font-semibold text-black hover:bg-teal-500"
                  >
                    Upload a track
                  </a>
                  <a
                    href="/surf"
                    className="rounded-md border border-white/10 bg-white/10 px-3 py-2 text-sm text-white/80 hover:bg-white/20"
                  >
                    Add via Surf
                  </a>
                </div>
              </div>
            )}

            {/* Content Section with Tidal-style Transitions */}
            <AnimatePresence mode="wait">
              <motion.div
                key={selected}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                {section}
              </motion.div>
            </AnimatePresence>

            {/* Recommendations at bottom */}
            {selected !== "settings" && data.recommendations.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <RecommendationsSection recommendations={data.recommendations} />
              </motion.div>
            )}
          </div>
        </main>
      </div>

      {/* Tidal-style Player Bar */}
      <PlayerBar current={current} playing={playing} onToggle={() => setPlaying((p) => !p)} />

      {/* Playlist Drawer */}
      <PlaylistDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} playlist={activePlaylist} />
    </div>
  );
}
