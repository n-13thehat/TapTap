import React from 'react';
import { Sparkles } from 'lucide-react';
import { Track } from '../types';
import { Header } from './Header';
import { EmptyState } from './EmptyState';
import { TrackRow } from './TrackRow';

interface RecommendationsSectionProps {
  recommendations: Track[];
  onPlay: (track: Track) => void;
  onSave: (track: Track) => void;
  onAddToPlaylist: (track: Track) => void;
  onAttachLyrics: (track: Track) => void;
}

export function RecommendationsSection({
  recommendations,
  onPlay,
  onSave,
  onAddToPlaylist,
  onAttachLyrics,
}: RecommendationsSectionProps) {
  if (!recommendations.length) {
    return (
      <EmptyState
        title="No recommendations yet"
        description="Listen to more tracks to help our AI learn your taste and suggest new music."
        action={{ label: "Discover Music", href: "/surf" }}
      />
    );
  }

  return (
    <section className="space-y-3">
      <Header 
        icon={<Sparkles className="h-4 w-4 text-teal-300" />} 
        title="Recommended for You" 
        subtitle={`${recommendations.length} AI-curated tracks`} 
      />
      
      <div className="rounded-xl border border-white/10 bg-white/5 p-2 space-y-2">
        {recommendations.slice(0, 10).map((track, index) => (
          <TrackRow
            key={track.id}
            t={track}
            index={index}
            onPlay={onPlay}
            onSave={onSave}
            onAddToPlaylist={onAddToPlaylist}
            onAttachLyrics={onAttachLyrics}
          />
        ))}
        
        {recommendations.length > 10 && (
          <div className="text-center py-3">
            <button className="text-sm text-teal-300 hover:text-teal-200">
              Show {recommendations.length - 10} more recommendations
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
