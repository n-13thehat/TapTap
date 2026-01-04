import React, { useMemo } from 'react';
import { User as UserIcon } from 'lucide-react';
import { Artist } from '../types';
import { Header } from './Header';
import { EmptyState } from './EmptyState';

interface ArtistCardProps {
  a: Artist;
}

function ArtistCard({ a }: ArtistCardProps) {
  return (
    <div className="group overflow-hidden rounded-xl border border-white/10 bg-white/5 text-left">
      <div className="relative">
        <img src={a.avatar} className="h-44 w-full object-cover transition group-hover:scale-[1.02]" alt={a.name} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0" />
        <div className="absolute right-2 top-2 grid place-items-center rounded-full bg-black/50 p-2 text-white/90 backdrop-blur">
          <UserIcon className="h-4 w-4" />
        </div>
      </div>
      <div className="space-y-1 p-3">
        <div className="truncate text-sm font-medium text-white">{a.name}</div>
        <div className="truncate text-xs text-white/60">{a.tracks} tracks • {a.followers} followers</div>
      </div>
    </div>
  );
}

interface ArtistsSectionProps {
  artists: Artist[];
  query?: string;
}

export function ArtistsSection({ artists, query }: ArtistsSectionProps) {
  const filteredArtists = useMemo(() => {
    if (!query) return artists;
    const q = query.toLowerCase();
    return artists.filter((a) => a.name.toLowerCase().includes(q));
  }, [query, artists]);

  if (!filteredArtists.length) {
    return (
      <EmptyState
        title="No artists to show"
        description="Follow creators to build up your favorites list and get notified when they drop new music."
        action={{ label: 'Discover Artists', href: '/surf' }}
      />
    );
  }

  return (
    <section className="space-y-3">
      <Header icon={<UserIcon className="h-4 w-4 text-teal-300" />} title="Artists" subtitle={`${filteredArtists.length} featured`} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {filteredArtists.map((a) => (
          <ArtistCard key={a.id} a={a} />
        ))}
      </div>
    </section>
  );
}
