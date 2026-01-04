import React from 'react';
import { ListMusic } from 'lucide-react';
import { Playlist } from '../types';
import { timeAgo } from '../utils';
import { Header } from './Header';
import { EmptyState } from './EmptyState';

interface PlaylistCardProps {
  p: Playlist;
  onOpen: (playlist: Playlist) => void;
}

function PlaylistCard({ p, onOpen }: PlaylistCardProps) {
  return (
    <button onClick={() => onOpen(p)} className="group overflow-hidden rounded-xl border border-white/10 bg-white/5 text-left">
      <div className="relative">
        <img src={p.cover} className="h-44 w-full object-cover transition group-hover:scale-[1.02]" alt={p.title} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0" />
        <div className="absolute right-2 top-2 rounded-full bg-black/50 p-2 text-white/90 backdrop-blur">
          <ListMusic className="h-4 w-4" />
        </div>
      </div>
      <div className="space-y-1 p-3">
        <div className="truncate text-sm font-medium text-white">{p.title}</div>
        <div className="truncate text-xs text-white/60">{p.tracks} tracks • updated {timeAgo(p.updatedAt)}</div>
      </div>
    </button>
  );
}

interface PlaylistsSectionProps {
  playlists: Playlist[];
  onOpen: (playlist: Playlist) => void;
}

export function PlaylistsSection({ playlists, onOpen }: PlaylistsSectionProps) {
  if (!playlists.length) {
    return (
      <EmptyState
        title="No playlists yet"
        description="Create a playlist to group tracks your way and share it with TapTap travelers."
        action={{ label: 'Create playlist', href: '/creator/upload' }}
      />
    );
  }

  return (
    <section className="space-y-3">
      <Header icon={<ListMusic className="h-4 w-4 text-teal-300" />} title="Playlists" subtitle={`${playlists.length} collections`} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {playlists.map((p) => (
          <PlaylistCard key={p.id} p={p} onOpen={onOpen} />
        ))}
      </div>
    </section>
  );
}
