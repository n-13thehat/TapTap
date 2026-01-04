import React from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { Poster } from '../types';
import { timeAgo } from '../utils';
import { Header } from './Header';
import { EmptyState } from './EmptyState';

interface PosterCardProps {
  poster: Poster;
}

function PosterCard({ poster }: PosterCardProps) {
  return (
    <div className="group overflow-hidden rounded-xl border border-white/10 bg-white/5">
      <div className="relative">
        <img 
          src={poster.image} 
          className="h-44 w-full object-cover transition group-hover:scale-[1.02]" 
          alt={poster.title} 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0" />
        <div className="absolute right-2 top-2 rounded-full bg-black/50 p-2 text-white/90 backdrop-blur">
          <ImageIcon className="h-4 w-4" />
        </div>
        <div className="absolute bottom-2 left-2 right-2">
          <div className="text-xs font-medium text-white">{poster.title}</div>
          <div className="text-xs text-white/60">{poster.edition}</div>
        </div>
      </div>
      <div className="p-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-white/60">TX: {poster.tx.slice(0, 8)}...</span>
          <span className="text-white/40">{timeAgo(poster.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}

interface PostersSectionProps {
  posters: Poster[];
}

export function PostersSection({ posters }: PostersSectionProps) {
  if (!posters.length) {
    return (
      <EmptyState
        title="No posters collected"
        description="Collect limited edition posters from your favorite artists and events."
        action={{ label: "Browse Marketplace", href: "/marketplace" }}
      />
    );
  }

  return (
    <section className="space-y-3">
      <Header 
        icon={<ImageIcon className="h-4 w-4 text-teal-300" />} 
        title="Posters" 
        subtitle={`${posters.length} collected`} 
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {posters.map((poster) => (
          <PosterCard key={poster.id} poster={poster} />
        ))}
      </div>
    </section>
  );
}
