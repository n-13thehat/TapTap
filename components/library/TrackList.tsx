"use client";

import React from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  Pause,
  Heart,
  MoreHorizontal,
  Clock,
  Plus,
  Download,
  Share2,
  Loader2
} from 'lucide-react';
import { Track } from '@/stores/unifiedPlayer';
import { usePlayerStore } from '@/stores/player';
import { useMusicLibrary } from '@/hooks/useMusicLibrary';

interface TrackListProps {
  tracks?: Track[];
  loading?: boolean;
  onPlayTrack?: (track: Track) => void;
  showArtist?: boolean;
  showAlbum?: boolean;
  showDuration?: boolean;
  className?: string;
}

export default function TrackList({
  tracks: propTracks,
  loading: propLoading,
  onPlayTrack,
  showArtist = true,
  showAlbum = true,
  showDuration = true,
  className = ''
}: TrackListProps) {
  const { current, isPlaying, play, pause } = usePlayerStore();
  const { tracks: libraryTracks, loading: libraryLoading, playTrack } = useMusicLibrary({
    autoLoad: !propTracks
  });

  // Use provided tracks or library tracks
  const tracks = propTracks || libraryTracks;
  const loading = propLoading ?? libraryLoading;

  const handlePlayTrack = (track: Track) => {
    if (onPlayTrack) {
      onPlayTrack(track);
    } else {
      playTrack(track, tracks);
    }
  };

  const handleTogglePlayback = (track: Track) => {
    if (current?.id === track.id) {
      if (isPlaying) {
        pause();
      } else {
        play();
      }
    } else {
      handlePlayTrack(track);
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className={`space-y-2 ${className}`}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-white/5 animate-pulse">
            <div className="w-10 h-10 bg-white/10 rounded"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-white/10 rounded w-3/4"></div>
              <div className="h-3 bg-white/10 rounded w-1/2"></div>
            </div>
            <div className="w-12 h-4 bg-white/10 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
          <Play className="h-8 w-8 text-white/40" />
        </div>
        <h3 className="text-lg font-medium text-white mb-2">No tracks found</h3>
        <p className="text-white/60">Upload some music to get started</p>
      </div>
    );
  }

    return (
      <div className={`space-y-1 ${className}`}>
        {tracks.map((track, index) => {
          const isCurrentTrack = current?.id === track.id;
          const isCurrentlyPlaying = isCurrentTrack && isPlaying;
          const artwork =
            (track as any).cover_art ||
            (track as any).cover ||
            (track as any).coverArt ||
            (track as any).album?.coverUrl ||
            '/default-cover.jpg';

          return (
            <motion.div
            key={track.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`
              group flex items-center gap-4 p-3 rounded-lg transition-all cursor-pointer
              ${isCurrentTrack 
                ? 'bg-teal-500/20 border border-teal-400/30' 
                : 'hover:bg-white/5'
              }
            `}
            >
              {/* Play Button / Track Number */}
              <div className="w-10 flex items-center justify-center">
                <button
                  onClick={() => handleTogglePlayback(track)}
                className={`
                  p-2 rounded-full transition-all
                  ${isCurrentTrack 
                    ? 'bg-teal-500 text-white' 
                    : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white opacity-0 group-hover:opacity-100'
                  }
                `}
              >
                {isCurrentlyPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4 ml-0.5" />
                )}
              </button>
              <span className={`text-sm text-white/40 group-hover:hidden ${isCurrentTrack ? 'hidden' : ''}`}>
                {index + 1}
              </span>
            </div>

            {/* Track Cover */}
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/10 flex-shrink-0">
              <img
                src={artwork}
                alt={track.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/default-cover.jpg';
                }}
              />
            </div>

            {/* Track Info */}
            <div className="flex-1 min-w-0">
              <h4 className={`font-medium truncate ${
                isCurrentTrack ? 'text-teal-300' : 'text-white'
              }`}>
                {track.title}
              </h4>
              <div className="flex items-center gap-2 text-sm text-white/60">
                {showArtist && (
                  <>
                    <span className="truncate">{track.artist}</span>
                    {showAlbum && track.album && (
                      <>
                        <span>•</span>
                        <span className="truncate">{track.album}</span>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Duration */}
            {showDuration && (
              <div className="text-sm text-white/40 w-12 text-right">
                {formatDuration(track.duration)}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors">
                <Heart className="h-4 w-4" />
              </button>
              <button className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors">
                <Plus className="h-4 w-4" />
              </button>
              <button className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors">
                <Share2 className="h-4 w-4" />
              </button>
              <button className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
