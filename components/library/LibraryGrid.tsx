"use client";

import { useState } from 'react';
import { Track } from '@/types/track';
import { LibraryFilter, SortOption } from '@/lib/library/types';
import { useLibrary } from '@/hooks/useLibrary';
import { usePlayerStore } from '@/stores/player';
import type { Track as PlayerTrack } from '@/stores/player';
import { 
  Play, 
  Pause, 
  Heart, 
  MoreHorizontal, 
  Plus, 
  Share, 
  Download,
  Clock,
  Calendar,
  PlayCircle
} from 'lucide-react';

interface LibraryGridProps {
  tracks: Track[];
  viewMode: 'grid' | 'list';
  filter: LibraryFilter;
  sort: SortOption;
}

interface TrackCardProps {
  track: Track;
  viewMode: 'grid' | 'list';
  isPlaying: boolean;
  onPlay: () => void;
  onToggleFavorite: () => void;
  isFavorite: boolean;
  playCount: number;
  addedAt: number;
}

function TrackCard({ 
  track, 
  viewMode, 
  isPlaying, 
  onPlay, 
  onToggleFavorite, 
  isFavorite,
  playCount,
  addedAt 
}: TrackCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const getArtistName = () => {
    if (!track.artist) return 'Unknown Artist';
    return typeof track.artist === 'string' ? track.artist : track.artist.stageName;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  if (viewMode === 'list') {
    return (
      <div className="flex items-center gap-4 p-3 hover:bg-white/5 rounded-lg group transition-colors">
        {/* Play Button */}
        <button
          onClick={onPlay}
          className="w-10 h-10 bg-purple-600 hover:bg-purple-700 rounded-full flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </button>

        {/* Track Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-white truncate">{track.title}</h3>
          <p className="text-sm text-white/60 truncate">{getArtistName()}</p>
        </div>

        {/* Genre */}
        <div className="hidden md:block w-24">
          <span className="text-sm text-white/60">{track.genre || 'Unknown'}</span>
        </div>

        {/* Play Count */}
        <div className="hidden lg:block w-16 text-center">
          <span className="text-sm text-white/60">{playCount}</span>
        </div>

        {/* Duration */}
        <div className="w-16 text-center">
          <span className="text-sm text-white/60">{formatDuration(track.duration || 0)}</span>
        </div>

        {/* Added Date */}
        <div className="hidden xl:block w-24 text-center">
          <span className="text-sm text-white/60">{formatDate(addedAt)}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleFavorite}
            className={`p-2 rounded-lg transition-colors ${
              isFavorite 
                ? 'text-red-400 hover:text-red-300' 
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-white/40 hover:text-white/60 rounded-lg transition-colors"
            >
              <MoreHorizontal size={16} />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-1 bg-black/90 border border-white/20 rounded-lg py-1 z-10 min-w-32">
                <button className="w-full px-3 py-2 text-left text-sm text-white/80 hover:bg-white/10 flex items-center gap-2">
                  <Plus size={14} />
                  Add to Playlist
                </button>
                <button className="w-full px-3 py-2 text-left text-sm text-white/80 hover:bg-white/10 flex items-center gap-2">
                  <Share size={14} />
                  Share
                </button>
                <button className="w-full px-3 py-2 text-left text-sm text-white/80 hover:bg-white/10 flex items-center gap-2">
                  <Download size={14} />
                  Download
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors group">
      {/* Cover Art */}
      <div className="relative aspect-square bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg mb-3 overflow-hidden">
        {track.cover_image ? (
          <img 
            src={track.cover_image} 
            alt={track.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <PlayCircle size={48} className="text-white/40" />
          </div>
        )}
        
        {/* Play Overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button
            onClick={onPlay}
            className="w-12 h-12 bg-purple-600 hover:bg-purple-700 rounded-full flex items-center justify-center transition-colors"
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
        </div>

        {/* Favorite Button */}
        <button
          onClick={onToggleFavorite}
          className={`absolute top-2 right-2 p-1.5 rounded-full transition-colors ${
            isFavorite 
              ? 'bg-red-600 text-white' 
              : 'bg-black/50 text-white/60 hover:text-white'
          }`}
        >
          <Heart size={14} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Track Info */}
      <div className="space-y-1">
        <h3 className="font-medium text-white truncate">{track.title}</h3>
        <p className="text-sm text-white/60 truncate">{getArtistName()}</p>
        
        <div className="flex items-center justify-between text-xs text-white/40">
          <span>{track.genre || 'Unknown'}</span>
          <span>{formatDuration(track.duration || 0)}</span>
        </div>

        {playCount > 0 && (
          <div className="flex items-center gap-1 text-xs text-white/40">
            <PlayCircle size={12} />
            <span>{playCount} plays</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LibraryGrid({ tracks, viewMode, filter, sort }: LibraryGridProps) {
  const { toggleFavorite, incrementPlayCount } = useLibrary();
  const { current, isPlaying, playTrack } = usePlayerStore();

  const handlePlay = async (track: Track) => {
    if (!track.audio_url) {
      console.warn('Track is missing audio_url, cannot play:', track.id);
      return;
    }

    const playerTrack: PlayerTrack = {
      id: track.id,
      title: track.title,
      artist: typeof track.artist === 'string' ? track.artist : track.artist?.stageName || null,
      album_id: null,
      audio_url: track.audio_url,
      cover_art: track.cover_art ?? null,
      duration: track.duration ?? null,
    };

    playTrack(playerTrack);
    await incrementPlayCount(track.id);
  };

  const handleToggleFavorite = async (trackId: string) => {
    await toggleFavorite(trackId);
  };

  // Mock data for library items (would come from library manager)
  const getLibraryItemData = (trackId: string) => ({
    isFavorite: Math.random() > 0.7,
    playCount: Math.floor(Math.random() * 50),
    addedAt: Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000, // Random date in last 30 days
  });

  if (tracks.length === 0) {
    return (
      <div className="text-center py-12">
        <PlayCircle size={64} className="mx-auto mb-4 text-white/20" />
        <h3 className="text-xl font-semibold text-white mb-2">No tracks found</h3>
        <p className="text-white/60 mb-4">
          {Object.keys(filter).length > 0 
            ? 'Try adjusting your filters to see more tracks.'
            : 'Start building your library by saving tracks you love.'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* List Header */}
      {viewMode === 'list' && (
        <div className="flex items-center gap-4 px-3 py-2 text-sm text-white/60 border-b border-white/10">
          <div className="w-10"></div> {/* Play button space */}
          <div className="flex-1">Track</div>
          <div className="hidden md:block w-24">Genre</div>
          <div className="hidden lg:block w-16 text-center">Plays</div>
          <div className="w-16 text-center">
            <Clock size={14} className="mx-auto" />
          </div>
          <div className="hidden xl:block w-24 text-center">
            <Calendar size={14} className="mx-auto" />
          </div>
          <div className="w-20"></div> {/* Actions space */}
        </div>
      )}

      {/* Tracks */}
      <div className={
        viewMode === 'grid' 
          ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4'
          : 'space-y-1'
      }>
        {tracks.map((track) => {
          const libraryData = getLibraryItemData(track.id);
          const isCurrentlyPlaying = current?.id === track.id && isPlaying;

          return (
            <TrackCard
              key={track.id}
              track={track}
              viewMode={viewMode}
              isPlaying={isCurrentlyPlaying}
              onPlay={() => handlePlay(track)}
              onToggleFavorite={() => handleToggleFavorite(track.id)}
              isFavorite={libraryData.isFavorite}
              playCount={libraryData.playCount}
              addedAt={libraryData.addedAt}
            />
          );
        })}
      </div>

      {/* Load More */}
      {tracks.length >= 50 && (
        <div className="text-center py-8">
          <button className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-lg transition-colors">
            Load More Tracks
          </button>
        </div>
      )}
    </div>
  );
}
