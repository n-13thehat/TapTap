"use client";

import { useState } from 'react';
import { SurfTrack, TapPassStatus } from '@/lib/surf/types';
import { usePlayerStore } from '@/stores/player';
import { 
  Play, 
  Pause, 
  Heart, 
  SkipForward, 
  ExternalLink,
  Crown,
  Sparkles,
  TrendingUp,
  Clock,
  Zap
} from 'lucide-react';

interface SurfFeedGridProps {
  tracks: SurfTrack[];
  onSave: (trackId: string) => void;
  onSkip: (trackId: string, reason?: string) => void;
  tapPassStatus: TapPassStatus;
}

interface SurfTrackCardProps {
  track: SurfTrack;
  isPlaying: boolean;
  onPlay: () => void;
  onSave: () => void;
  onSkip: (reason?: string) => void;
  canAccess: boolean;
}

function SurfTrackCard({ track, isPlaying, onPlay, onSave, onSkip, canAccess }: SurfTrackCardProps) {
  const [showSkipMenu, setShowSkipMenu] = useState(false);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'youtube': return '🎥';
      case 'spotify': return '🎵';
      case 'soundcloud': return '☁️';
      case 'apple_music': return '🍎';
      case 'taptap': return '🎯';
      default: return '🎶';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const skipReasons = [
    { id: 'not_interested', label: 'Not interested' },
    { id: 'wrong_genre', label: 'Wrong genre' },
    { id: 'poor_quality', label: 'Poor quality' },
    { id: 'already_know', label: 'Already know this' },
    { id: 'too_long', label: 'Too long' },
    { id: 'too_short', label: 'Too short' },
  ];

  return (
    <div className={`bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-all group relative ${
      !canAccess ? 'opacity-60' : ''
    }`}>
      {/* Access Indicators */}
      <div className="absolute top-2 right-2 flex gap-1">
        {track.requires_tappass && (
          <div className="bg-yellow-600/20 text-yellow-300 p-1 rounded">
            <Crown size={12} />
          </div>
        )}
        {track.beta_unlock_required && (
          <div className="bg-purple-600/20 text-purple-300 p-1 rounded">
            <Sparkles size={12} />
          </div>
        )}
        {track.is_shadow && (
          <div className="bg-blue-600/20 text-blue-300 p-1 rounded text-xs px-2">
            Shadow
          </div>
        )}
      </div>

      {/* Cover Art */}
      <div className="relative aspect-square bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg mb-3 overflow-hidden">
        {track.cover_image ? (
          <img 
            src={track.cover_image} 
            alt={track.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">
            {getSourceIcon(track.source)}
          </div>
        )}
        
        {/* Play Overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button
            onClick={onPlay}
            disabled={!canAccess}
            className="w-12 h-12 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-full flex items-center justify-center transition-colors"
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
        </div>

        {/* Source Badge */}
        <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
          {track.source}
        </div>
      </div>

      {/* Track Info */}
      <div className="space-y-2">
        <h3 className="font-medium text-white truncate">{track.title}</h3>
        <p className="text-sm text-white/60 truncate">{track.artist}</p>
        
        <div className="flex items-center justify-between text-xs">
          <span className="text-white/40">{track.genre || 'Unknown'}</span>
          <span className="text-white/40">{formatDuration(track.duration)}</span>
        </div>

        {/* Scores */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center">
            <div className={`font-bold ${getScoreColor(track.discovery_score)}`}>
              {track.discovery_score}
            </div>
            <div className="text-white/40">Discovery</div>
          </div>
          <div className="text-center">
            <div className={`font-bold ${getScoreColor(track.trending_score)}`}>
              {track.trending_score}
            </div>
            <div className="text-white/40">Trending</div>
          </div>
          <div className="text-center">
            <div className={`font-bold ${getScoreColor(track.freshness_score)}`}>
              {track.freshness_score}
            </div>
            <div className="text-white/40">Fresh</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={onSave}
            disabled={!canAccess}
            className="flex items-center gap-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-3 py-1 rounded text-sm transition-colors"
          >
            <Heart size={14} />
            Save
          </button>

          <div className="relative">
            <button
              onClick={() => setShowSkipMenu(!showSkipMenu)}
              className="flex items-center gap-1 bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm transition-colors"
            >
              <SkipForward size={14} />
              Skip
            </button>

            {showSkipMenu && (
              <div className="absolute bottom-full right-0 mb-1 bg-black/90 border border-white/20 rounded-lg py-1 z-10 min-w-32">
                {skipReasons.map((reason) => (
                  <button
                    key={reason.id}
                    onClick={() => {
                      onSkip(reason.id);
                      setShowSkipMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-white/80 hover:bg-white/10"
                  >
                    {reason.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {track.original_url && (
            <a
              href={track.original_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 text-white/40 hover:text-white/60 transition-colors"
            >
              <ExternalLink size={14} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SurfFeedGrid({ tracks, onSave, onSkip, tapPassStatus }: SurfFeedGridProps) {
  const { current, isPlaying, playTrack } = usePlayerStore();

  const handlePlay = (track: SurfTrack) => {
    // Convert SurfTrack to Track for player
    const playerTrack = {
      id: track.id,
      title: track.title,
      artist: track.artist,
      audio_url: track.audio_url,
      duration: track.duration,
      cover_image: track.cover_image,
      genre: track.genre,
    };

    playTrack(playerTrack);
  };

  const canAccessTrack = (track: SurfTrack) => {
    if (track.requires_tappass && !tapPassStatus.has_tappass) {
      return false;
    }
    if (track.beta_unlock_required && !tapPassStatus.beta_access) {
      return false;
    }
    return true;
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {tracks.map((track) => {
        const isCurrentlyPlaying = current?.id === track.id && isPlaying;
        const canAccess = canAccessTrack(track);

        return (
          <SurfTrackCard
            key={track.id}
            track={track}
            isPlaying={isCurrentlyPlaying}
            onPlay={() => handlePlay(track)}
            onSave={() => onSave(track.id)}
            onSkip={(reason) => onSkip(track.id, reason)}
            canAccess={canAccess}
          />
        );
      })}
    </div>
  );
}
