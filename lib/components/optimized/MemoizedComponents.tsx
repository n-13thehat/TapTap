/**
 * Memoized components for performance optimization
 */

import React, { memo, useMemo } from 'react';
import { useStableCallback } from '@/lib/hooks/useOptimizedCallback';
import type { TrackWithArtist } from '@/types/api';

// ============================================================================
// Track Components
// ============================================================================

export interface TrackItemProps {
  track: TrackWithArtist;
  index: number;
  isPlaying?: boolean;
  isSelected?: boolean;
  onPlay?: (track: TrackWithArtist) => void;
  onSelect?: (track: TrackWithArtist) => void;
  onLike?: (track: TrackWithArtist) => void;
  onSave?: (track: TrackWithArtist) => void;
  showArtist?: boolean;
  showAlbum?: boolean;
  showDuration?: boolean;
  className?: string;
}

const TrackItem = memo<TrackItemProps>(({
  track,
  index,
  isPlaying = false,
  isSelected = false,
  onPlay,
  onSelect,
  onLike,
  onSave,
  showArtist = true,
  showAlbum = true,
  showDuration = true,
  className,
}) => {
  const handlePlay = useStableCallback(() => {
    onPlay?.(track);
  }, [onPlay, track]);

  const handleSelect = useStableCallback(() => {
    onSelect?.(track);
  }, [onSelect, track]);

  const handleLike = useStableCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onLike?.(track);
  }, [onLike, track]);

  const handleSave = useStableCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onSave?.(track);
  }, [onSave, track]);

  const duration = useMemo(() => {
    if (!track.durationMs) return '--:--';
    const minutes = Math.floor(track.durationMs / 60000);
    const seconds = Math.floor((track.durationMs % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [track.durationMs]);

  return (
    <div
      className={`group flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer ${
        isSelected ? 'bg-white/10' : ''
      } ${isPlaying ? 'bg-teal-500/10' : ''} ${className || ''}`}
      onClick={handleSelect}
      onDoubleClick={handlePlay}
    >
      {/* Index/Play Button */}
      <div className="w-8 text-center">
        {isPlaying ? (
          <div className="w-4 h-4 mx-auto">
            <div className="flex items-center justify-center space-x-1">
              <div className="w-1 h-3 bg-teal-400 animate-pulse" />
              <div className="w-1 h-2 bg-teal-400 animate-pulse" style={{ animationDelay: '0.1s' }} />
              <div className="w-1 h-4 bg-teal-400 animate-pulse" style={{ animationDelay: '0.2s' }} />
            </div>
          </div>
        ) : (
          <span className="text-sm text-white/60 group-hover:hidden">{index + 1}</span>
        )}
        <button
          onClick={handlePlay}
          className="hidden group-hover:block w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"
        >
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Track Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium truncate ${isPlaying ? 'text-teal-300' : 'text-white'}`}>
            {track.title}
          </span>
          {track.meta?.explicit && (
            <span className="text-xs px-1 py-0.5 bg-white/20 rounded text-white/80">E</span>
          )}
        </div>
        {showArtist && (
          <div className="text-xs text-white/60 truncate">
            {track.artist.stageName}
            {showAlbum && track.album && ` • ${track.album.title}`}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleLike}
          className="p-1 rounded hover:bg-white/10"
          title="Like"
        >
          <svg className="w-4 h-4 text-white/60 hover:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
        <button
          onClick={handleSave}
          className="p-1 rounded hover:bg-white/10"
          title="Save to library"
        >
          <svg className="w-4 h-4 text-white/60 hover:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
      </div>

      {/* Duration */}
      {showDuration && (
        <div className="text-xs text-white/60 w-12 text-right">
          {duration}
        </div>
      )}
    </div>
  );
});

TrackItem.displayName = 'TrackItem';

// ============================================================================
// Album Components
// ============================================================================

export interface AlbumCardProps {
  album: {
    id: string;
    title: string;
    artist: { stageName: string };
    coverUrl?: string;
    releaseAt?: Date;
    stats?: { totalTracks: number };
  };
  size?: 'sm' | 'md' | 'lg';
  onClick?: (album: any) => void;
  onPlay?: (album: any) => void;
  className?: string;
}

const AlbumCard = memo<AlbumCardProps>(({
  album,
  size = 'md',
  onClick,
  onPlay,
  className,
}) => {
  const handleClick = useStableCallback(() => {
    onClick?.(album);
  }, [onClick, album]);

  const handlePlay = useStableCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onPlay?.(album);
  }, [onPlay, album]);

  const sizeClasses = {
    sm: 'w-32',
    md: 'w-40',
    lg: 'w-48',
  };

  const releaseYear = useMemo(() => {
    return album.releaseAt ? new Date(album.releaseAt).getFullYear() : null;
  }, [album.releaseAt]);

  return (
    <div
      className={`group cursor-pointer ${sizeClasses[size]} ${className || ''}`}
      onClick={handleClick}
    >
      <div className="relative aspect-square mb-3 overflow-hidden rounded-lg bg-white/5">
        <img
          src={album.coverUrl || '/default-album.png'}
          alt={album.title}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
        <button
          onClick={handlePlay}
          className="absolute bottom-2 right-2 w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-teal-400"
        >
          <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      <div>
        <h3 className="text-sm font-medium text-white truncate mb-1">{album.title}</h3>
        <p className="text-xs text-white/60 truncate">
          {album.artist.stageName}
          {releaseYear && ` • ${releaseYear}`}
          {album.stats?.totalTracks && ` • ${album.stats.totalTracks} tracks`}
        </p>
      </div>
    </div>
  );
});

AlbumCard.displayName = 'AlbumCard';

// ============================================================================
// Artist Components
// ============================================================================

export interface ArtistCardProps {
  artist: {
    id: string;
    stageName: string;
    user?: { avatarUrl?: string };
    stats?: { followers: number; tracks: number };
  };
  size?: 'sm' | 'md' | 'lg';
  onClick?: (artist: any) => void;
  onFollow?: (artist: any) => void;
  isFollowing?: boolean;
  className?: string;
}

const ArtistCard = memo<ArtistCardProps>(({
  artist,
  size = 'md',
  onClick,
  onFollow,
  isFollowing = false,
  className,
}) => {
  const handleClick = useStableCallback(() => {
    onClick?.(artist);
  }, [onClick, artist]);

  const handleFollow = useStableCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onFollow?.(artist);
  }, [onFollow, artist]);

  const sizeClasses = {
    sm: 'w-32',
    md: 'w-40',
    lg: 'w-48',
  };

  const avatarSizeClasses = {
    sm: 'w-20 h-20',
    md: 'w-24 h-24',
    lg: 'w-28 h-28',
  };

  const followersText = useMemo(() => {
    if (!artist.stats?.followers) return null;
    const count = artist.stats.followers;
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  }, [artist.stats?.followers]);

  return (
    <div
      className={`group cursor-pointer text-center ${sizeClasses[size]} ${className || ''}`}
      onClick={handleClick}
    >
      <div className={`relative mx-auto mb-3 ${avatarSizeClasses[size]} overflow-hidden rounded-full bg-white/5`}>
        <img
          src={artist.user?.avatarUrl || '/default-avatar.png'}
          alt={artist.stageName}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
      </div>
      <div>
        <h3 className="text-sm font-medium text-white truncate mb-1">{artist.stageName}</h3>
        <p className="text-xs text-white/60 mb-2">
          {followersText && `${followersText} followers`}
          {artist.stats?.tracks && ` • ${artist.stats.tracks} tracks`}
        </p>
        <button
          onClick={handleFollow}
          className={`px-4 py-1 text-xs rounded-full border transition-colors ${
            isFollowing
              ? 'border-white/20 bg-white/10 text-white hover:bg-white/20'
              : 'border-teal-400/40 bg-teal-400/10 text-teal-300 hover:bg-teal-400/20'
          }`}
        >
          {isFollowing ? 'Following' : 'Follow'}
        </button>
      </div>
    </div>
  );
});

ArtistCard.displayName = 'ArtistCard';

// ============================================================================
// Exports
// ============================================================================

export { TrackItem, AlbumCard, ArtistCard };
