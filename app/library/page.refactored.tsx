"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useAgentBus } from '@/lib/eventBus';
import { usePlayerStore } from '@/lib/stores/playerStore';
import {
  Sidebar,
  Topbar,
  PlayerBar,
  SongsSection,
  GameSection,
  AlbumsSection,
  ArtistsSection,
  PlaylistsSection,
  PostersSection,
  TradesSection,
  MainframeSection,
  SurfSection,
  SettingsSection,
  RecommendationsSection,
  PlaylistDrawer,
} from './components';
import {
  Track,
  Album,
  Artist,
  Playlist,
  Poster,
  Trade,
  LibraryPayload,
  SectionKey,
  EMPTY_LIBRARY_PAYLOAD,
} from './types';

export default function LibraryPage() {
  // State management
  const [collapsed, setCollapsed] = useState(false);
  const [selected, setSelected] = useState<SectionKey>("songs");
  const [query, setQuery] = useState("");
  const [current, setCurrent] = useState<Track | null>(null);
  const [playing, setPlaying] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activePlaylist, setActivePlaylist] = useState<Playlist | null>(null);
  const [libraryData, setLibraryData] = useState<LibraryPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Hooks
  const agentBus = useAgentBus();
  const { setQueueList, playTrack: playInStore } = usePlayerStore();

  // Data with fallback
  const data = libraryData ?? EMPTY_LIBRARY_PAYLOAD;

  // Filtered data based on search query
  const filteredTracks = useMemo(() => {
    if (!query.trim()) return data.tracks;
    const needle = query.trim().toLowerCase();
    return data.tracks.filter((t) => 
      `${t.title} ${t.artist} ${t.album}`.toLowerCase().includes(needle)
    );
  }, [data.tracks, query]);

  const filteredAlbums = useMemo(() => {
    if (!query.trim()) return data.albums;
    const needle = query.trim().toLowerCase();
    return data.albums.filter((a) => 
      `${a.title} ${a.artist}`.toLowerCase().includes(needle)
    );
  }, [data.albums, query]);

  const filteredArtists = useMemo(() => {
    if (!query.trim()) return data.artists;
    const needle = query.trim().toLowerCase();
    return data.artists.filter((a) => 
      a.name.toLowerCase().includes(needle)
    );
  }, [data.artists, query]);

  const filteredPlaylists = useMemo(() => {
    if (!query.trim()) return data.playlists;
    const needle = query.trim().toLowerCase();
    return data.playlists.filter((p) => 
      p.title.toLowerCase().includes(needle)
    );
  }, [data.playlists, query]);

  // Load library data
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const res = await fetch("/api/library");
        if (!res.ok) {
          throw new Error((await res.json()).error || "Failed to load library");
        }
        const json = await res.json();
        if (!cancelled) {
          setLibraryData(json);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || "Library fetch failed");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  // Event handlers
  const handlePlayTrack = (track: Track) => {
    setCurrent(track);
    setPlaying(true);
    playInStore(track);
    agentBus.emit("track.played", { trackId: track.id, title: track.title });
  };

  const handleSaveTrack = async (track: Track) => {
    try {
      const method = track.saved ? "DELETE" : "POST";
      const res = await fetch(`/api/library/tracks/${track.id}/save`, { method });
      if (!res.ok) throw new Error("Save failed");
      
      // Update local state
      setLibraryData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          tracks: prev.tracks.map(t => 
            t.id === track.id ? { ...t, saved: !t.saved } : t
          )
        };
      });

      agentBus.emit(track.saved ? "track.unsaved" : "track.saved", { 
        trackId: track.id 
      });
    } catch (error) {
      console.error("Failed to save track:", error);
    }
  };

  const handleAddToPlaylist = (track: Track) => {
    // TODO: Implement playlist selection modal
    console.log("Add to playlist:", track.title);
  };

  const handleAttachLyrics = (track: Track) => {
    // TODO: Implement lyrics attachment
    console.log("Attach lyrics:", track.title);
  };

  const handlePlayAlbum = (album: Album) => {
    console.log("Play album:", album.title);
    // TODO: Load album tracks and play
  };

  const handleOpenPlaylist = (playlist: Playlist) => {
    setActivePlaylist(playlist);
    setDrawerOpen(true);
  };

  const handleTogglePlayback = () => {
    setPlaying(prev => !prev);
  };

  // Render section based on selection
  const renderSection = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="text-lg font-semibold text-white">Loading library...</div>
            <div className="text-sm text-white/60">Fetching your music collection</div>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="text-lg font-semibold text-red-400">Error loading library</div>
            <div className="text-sm text-white/60">{error}</div>
            <button
              onClick={() => setRefreshKey(prev => prev + 1)}
              className="mt-4 rounded-lg bg-teal-500/20 px-4 py-2 text-teal-200 hover:bg-teal-500/30"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    switch (selected) {
      case "songs":
        return (
          <SongsSection
            query={query}
            tracks={filteredTracks}
            onPlay={handlePlayTrack}
            onSave={handleSaveTrack}
            onAddToPlaylist={handleAddToPlaylist}
            onAttachLyrics={handleAttachLyrics}
          />
        );
      case "game":
        return <GameSection />;
      case "albums":
        return (
          <AlbumsSection
            albums={filteredAlbums}
            onPlay={handlePlayAlbum}
          />
        );
      case "artists":
        return (
          <ArtistsSection
            artists={filteredArtists}
            query={query}
          />
        );
      case "playlists":
        return (
          <PlaylistsSection
            playlists={filteredPlaylists}
            onOpen={handleOpenPlaylist}
          />
        );
      case "posters":
        return <PostersSection posters={data.posters} />;
      case "trades":
        return <TradesSection trades={data.trades} />;
      case "mainframe":
        return <MainframeSection />;
      case "surf":
        return <SurfSection />;
      case "settings":
        return <SettingsSection />;
      default:
        return (
          <RecommendationsSection
            recommendations={data.recommendations}
            onPlay={handlePlayTrack}
            onSave={handleSaveTrack}
            onAddToPlaylist={handleAddToPlaylist}
            onAttachLyrics={handleAttachLyrics}
          />
        );
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-black to-slate-800">
      {/* Sidebar */}
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(prev => !prev)}
        selected={selected}
        onSelect={setSelected}
      />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <Topbar query={query} onQuery={setQuery} />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl space-y-6 p-4">
            {renderSection()}
          </div>
        </main>

        {/* Player Bar */}
        <PlayerBar
          current={current}
          onToggle={handleTogglePlayback}
          playing={playing}
        />
      </div>

      {/* Playlist Drawer */}
      <PlaylistDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        playlist={activePlaylist}
      />
    </div>
  );
}
