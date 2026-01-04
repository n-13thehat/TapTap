"use client";

import React, { useState, useCallback, useMemo } from 'react';
import { 
  useEnhancedPlayerStore, 
  useQueue, 
  useCurrentTrack, 
  usePlaybackModes,
  Track 
} from '@/stores/enhancedPlayer';
import { 
  Play, 
  Pause, 
  MoreHorizontal, 
  Trash2, 
  Heart, 
  Share2, 
  Download, 
  Plus,
  Shuffle,
  ArrowUp,
  ArrowDown,
  Clock,
  Music,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  List,
  Grid,
  Star,
  Repeat,
  SkipForward,
  Volume2,
  Info,
  Edit,
  Copy,
  ExternalLink,
  Zap,
  TrendingUp,
  Users,
  Radio
} from 'lucide-react';

interface AdvancedQueueProps {
  className?: string;
  onClose?: () => void;
}

type SortOption = 'title' | 'artist' | 'album' | 'duration' | 'dateAdded' | 'playCount' | 'rating';
type ViewMode = 'list' | 'grid' | 'compact';

export default function AdvancedQueue({ className = '', onClose }: AdvancedQueueProps) {
  const queue = useQueue();
  const currentTrack = useCurrentTrack();
  const playbackModes = usePlaybackModes();
  
  const {
    skipToTrack,
    removeFromQueue,
    reorderQueue,
    addToQueue,
    clearQueue,
    shuffleQueue,
    play,
    pause
  } = useEnhancedPlayerStore();

  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('dateAdded');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedTracks, setSelectedTracks] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [draggedTrack, setDraggedTrack] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [showTrackInfo, setShowTrackInfo] = useState<string | null>(null);

  // Filter and sort tracks
  const filteredAndSortedTracks = useMemo(() => {
    let tracks = [...queue.tracks];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      tracks = tracks.filter(track => 
        track.title.toLowerCase().includes(query) ||
        track.artist.toLowerCase().includes(query) ||
        track.album?.toLowerCase().includes(query) ||
        track.genre?.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    tracks.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'artist':
          aValue = a.artist.toLowerCase();
          bValue = b.artist.toLowerCase();
          break;
        case 'album':
          aValue = (a.album || '').toLowerCase();
          bValue = (b.album || '').toLowerCase();
          break;
        case 'duration':
          aValue = a.duration;
          bValue = b.duration;
          break;
        case 'dateAdded':
          // Use index as proxy for date added
          aValue = queue.tracks.indexOf(a);
          bValue = queue.tracks.indexOf(b);
          break;
        case 'playCount':
          aValue = a.metadata?.playCount || 0;
          bValue = b.metadata?.playCount || 0;
          break;
        case 'rating':
          aValue = a.metadata?.rating || 0;
          bValue = b.metadata?.rating || 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return tracks;
  }, [queue.tracks, searchQuery, sortBy, sortDirection]);

  // Calculate queue statistics
  const queueStats = useMemo(() => {
    const totalDuration = queue.tracks.reduce((sum, track) => sum + track.duration, 0);
    const totalTracks = queue.tracks.length;
    const currentPosition = queue.currentIndex + 1;
    const remainingTracks = totalTracks - queue.currentIndex;
    const remainingDuration = queue.tracks
      .slice(queue.currentIndex + 1)
      .reduce((sum, track) => sum + track.duration, 0);

    return {
      totalDuration,
      totalTracks,
      currentPosition,
      remainingTracks,
      remainingDuration,
    };
  }, [queue]);

  // Format time helper
  const formatTime = useCallback((seconds: number) => {
    if (!seconds || !isFinite(seconds)) return '0:00';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Drag and drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDraggedTrack(index);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedTrack !== null && draggedTrack !== dropIndex) {
      reorderQueue(draggedTrack, dropIndex);
    }
    
    setDraggedTrack(null);
    setDragOverIndex(null);
  }, [draggedTrack, reorderQueue]);

  // Selection handlers
  const toggleTrackSelection = useCallback((trackId: string) => {
    setSelectedTracks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(trackId)) {
        newSet.delete(trackId);
      } else {
        newSet.add(trackId);
      }
      return newSet;
    });
  }, []);

  const selectAllTracks = useCallback(() => {
    setSelectedTracks(new Set(filteredAndSortedTracks.map(track => track.id)));
  }, [filteredAndSortedTracks]);

  const clearSelection = useCallback(() => {
    setSelectedTracks(new Set());
  }, []);

  // Bulk actions
  const removeSelectedTracks = useCallback(() => {
    selectedTracks.forEach(trackId => {
      const index = queue.tracks.findIndex(track => track.id === trackId);
      if (index !== -1) {
        removeFromQueue(index);
      }
    });
    clearSelection();
  }, [selectedTracks, queue.tracks, removeFromQueue, clearSelection]);

  // Render track item
  const renderTrackItem = useCallback((track: Track, index: number) => {
    const isCurrentTrack = currentTrack?.id === track.id;
    const isSelected = selectedTracks.has(track.id);
    const originalIndex = queue.tracks.findIndex(t => t.id === track.id);
    const isDraggedOver = dragOverIndex === index;

    return (
      <div
        key={track.id}
        draggable
        onDragStart={(e) => handleDragStart(e, originalIndex)}
        onDragOver={(e) => handleDragOver(e, originalIndex)}
        onDrop={(e) => handleDrop(e, originalIndex)}
        className={`group relative transition-all duration-200 ${
          isCurrentTrack 
            ? 'bg-green-600/20 border border-green-600/30' 
            : isSelected
            ? 'bg-blue-600/20 border border-blue-600/30'
            : 'hover:bg-white/5 border border-transparent'
        } ${isDraggedOver ? 'border-green-400' : ''} rounded-lg`}
      >
        {viewMode === 'list' && (
          <div className="flex items-center gap-3 p-3">
            {/* Selection checkbox */}
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => toggleTrackSelection(track.id)}
              className="w-4 h-4 rounded border-white/20 bg-white/10 text-green-600"
            />

            {/* Track number / Play button */}
            <div className="w-8 flex items-center justify-center">
              {isCurrentTrack ? (
                <button
                  onClick={() => currentTrack ? pause() : play()}
                  className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center"
                >
                  <Play size={12} className="text-white" />
                </button>
              ) : (
                <button
                  onClick={() => skipToTrack(originalIndex)}
                  className="text-white/40 group-hover:text-white transition-colors text-sm"
                >
                  {originalIndex + 1}
                </button>
              )}
            </div>

            {/* Cover art */}
            {track.cover_url && (
              <img 
                src={track.cover_url} 
                alt={track.title}
                className="w-12 h-12 rounded object-cover"
              />
            )}

            {/* Track info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div className={`font-medium truncate ${isCurrentTrack ? 'text-green-400' : 'text-white'}`}>
                  {track.title}
                </div>
                {track.metadata?.isExplicit && (
                  <span className="text-xs bg-white/20 px-1 rounded text-white/60">E</span>
                )}
              </div>
              <div className="text-white/60 text-sm truncate">{track.artist}</div>
              {track.album && (
                <div className="text-white/40 text-xs truncate">{track.album}</div>
              )}
            </div>

            {/* Track metadata */}
            <div className="flex items-center gap-4 text-white/60 text-sm">
              {track.metadata?.playCount && (
                <div className="flex items-center gap-1">
                  <Play size={12} />
                  <span>{track.metadata.playCount}</span>
                </div>
              )}
              
              {track.metadata?.rating && (
                <div className="flex items-center gap-1">
                  <Star size={12} className="text-yellow-400" />
                  <span>{track.metadata.rating}</span>
                </div>
              )}
              
              <span>{formatTime(track.duration)}</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => setShowTrackInfo(showTrackInfo === track.id ? null : track.id)}
                className="p-1 rounded hover:bg-white/10 transition-colors"
                title="Track info"
              >
                <Info size={14} />
              </button>
              
              <button
                className="p-1 rounded hover:bg-white/10 transition-colors"
                title="Add to favorites"
              >
                <Heart size={14} />
              </button>
              
              <button
                className="p-1 rounded hover:bg-white/10 transition-colors"
                title="Share track"
              >
                <Share2 size={14} />
              </button>
              
              <button
                onClick={() => removeFromQueue(originalIndex)}
                className="p-1 rounded hover:bg-white/10 transition-colors text-red-400"
                title="Remove from queue"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        )}

        {viewMode === 'grid' && (
          <div className="p-4 text-center">
            <div className="relative mb-3">
              {track.cover_url ? (
                <img 
                  src={track.cover_url} 
                  alt={track.title}
                  className="w-full aspect-square rounded-lg object-cover"
                />
              ) : (
                <div className="w-full aspect-square bg-white/10 rounded-lg flex items-center justify-center">
                  <Music size={32} className="text-white/30" />
                </div>
              )}
              
              <button
                onClick={() => skipToTrack(originalIndex)}
                className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Play size={24} className="text-white" />
              </button>
            </div>
            
            <div className={`font-medium truncate mb-1 ${isCurrentTrack ? 'text-green-400' : 'text-white'}`}>
              {track.title}
            </div>
            <div className="text-white/60 text-sm truncate">{track.artist}</div>
            <div className="text-white/40 text-xs mt-1">{formatTime(track.duration)}</div>
          </div>
        )}

        {viewMode === 'compact' && (
          <div className="flex items-center gap-2 p-2">
            <button
              onClick={() => skipToTrack(originalIndex)}
              className="w-6 h-6 flex items-center justify-center"
            >
              {isCurrentTrack ? (
                <div className="w-2 h-2 bg-green-400 rounded-full" />
              ) : (
                <Play size={12} className="text-white/60 group-hover:text-white" />
              )}
            </button>
            
            <div className="flex-1 min-w-0">
              <div className={`text-sm truncate ${isCurrentTrack ? 'text-green-400' : 'text-white'}`}>
                {track.title} - {track.artist}
              </div>
            </div>
            
            <div className="text-white/60 text-xs">{formatTime(track.duration)}</div>
          </div>
        )}

        {/* Track info panel */}
        {showTrackInfo === track.id && (
          <div className="absolute top-full left-0 right-0 z-10 bg-black/90 backdrop-blur-sm border border-white/10 rounded-lg p-4 mt-1">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-white/60 mb-1">Title</div>
                <div className="text-white">{track.title}</div>
              </div>
              <div>
                <div className="text-white/60 mb-1">Artist</div>
                <div className="text-white">{track.artist}</div>
              </div>
              {track.album && (
                <div>
                  <div className="text-white/60 mb-1">Album</div>
                  <div className="text-white">{track.album}</div>
                </div>
              )}
              <div>
                <div className="text-white/60 mb-1">Duration</div>
                <div className="text-white">{formatTime(track.duration)}</div>
              </div>
              {track.genre && (
                <div>
                  <div className="text-white/60 mb-1">Genre</div>
                  <div className="text-white">{track.genre}</div>
                </div>
              )}
              {track.year && (
                <div>
                  <div className="text-white/60 mb-1">Year</div>
                  <div className="text-white">{track.year}</div>
                </div>
              )}
              {track.bpm && (
                <div>
                  <div className="text-white/60 mb-1">BPM</div>
                  <div className="text-white">{track.bpm}</div>
                </div>
              )}
              {track.key && (
                <div>
                  <div className="text-white/60 mb-1">Key</div>
                  <div className="text-white">{track.key}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }, [
    currentTrack, selectedTracks, queue.tracks, dragOverIndex, viewMode, showTrackInfo,
    handleDragStart, handleDragOver, handleDrop, toggleTrackSelection, skipToTrack,
    removeFromQueue, formatTime, play, pause
  ]);

  return (
    <div className={`bg-black/90 backdrop-blur-md border border-white/10 rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <List size={20} className="text-green-400" />
            Queue
          </h2>
          
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              ×
            </button>
          )}
        </div>

        {/* Queue stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
          <div className="text-center">
            <div className="text-white font-medium">{queueStats.totalTracks}</div>
            <div className="text-white/60">Tracks</div>
          </div>
          <div className="text-center">
            <div className="text-white font-medium">{formatTime(queueStats.totalDuration)}</div>
            <div className="text-white/60">Total Time</div>
          </div>
          <div className="text-center">
            <div className="text-white font-medium">{queueStats.currentPosition}</div>
            <div className="text-white/60">Current</div>
          </div>
          <div className="text-center">
            <div className="text-white font-medium">{formatTime(queueStats.remainingDuration)}</div>
            <div className="text-white/60">Remaining</div>
          </div>
        </div>

        {/* Search and filters */}
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search tracks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-green-400"
            />
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg transition-colors ${
              showFilters ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            <Filter size={16} />
          </button>
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div className="bg-white/5 rounded-lg p-4 mb-4 space-y-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-white/80 text-sm">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="bg-white/10 border border-white/20 rounded px-3 py-1 text-white text-sm"
                >
                  <option value="dateAdded">Date Added</option>
                  <option value="title">Title</option>
                  <option value="artist">Artist</option>
                  <option value="album">Album</option>
                  <option value="duration">Duration</option>
                  <option value="playCount">Play Count</option>
                  <option value="rating">Rating</option>
                </select>
              </div>
              
              <button
                onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                className="p-1 rounded text-white/60 hover:text-white transition-colors"
              >
                {sortDirection === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />}
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-white/80 text-sm">View:</label>
              <div className="flex items-center gap-1 bg-white/10 rounded-lg p-1">
                {(['list', 'grid', 'compact'] as ViewMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`p-1 rounded transition-colors ${
                      viewMode === mode ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    {mode === 'list' && <List size={14} />}
                    {mode === 'grid' && <Grid size={14} />}
                    {mode === 'compact' && <MoreHorizontal size={14} />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {selectedTracks.size > 0 ? (
              <>
                <span className="text-white/60 text-sm">{selectedTracks.size} selected</span>
                <button
                  onClick={removeSelectedTracks}
                  className="px-3 py-1 bg-red-600/20 text-red-400 rounded-lg text-sm hover:bg-red-600/30 transition-colors"
                >
                  Remove Selected
                </button>
                <button
                  onClick={clearSelection}
                  className="px-3 py-1 bg-white/10 text-white/60 rounded-lg text-sm hover:bg-white/20 transition-colors"
                >
                  Clear Selection
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={selectAllTracks}
                  className="px-3 py-1 bg-white/10 text-white/60 rounded-lg text-sm hover:bg-white/20 transition-colors"
                >
                  Select All
                </button>
                <button
                  onClick={shuffleQueue}
                  className="px-3 py-1 bg-white/10 text-white/60 rounded-lg text-sm hover:bg-white/20 transition-colors flex items-center gap-1"
                >
                  <Shuffle size={12} />
                  Shuffle
                </button>
                <button
                  onClick={clearQueue}
                  className="px-3 py-1 bg-red-600/20 text-red-400 rounded-lg text-sm hover:bg-red-600/30 transition-colors"
                >
                  Clear Queue
                </button>
              </>
            )}
          </div>
          
          <div className="text-white/60 text-sm">
            {filteredAndSortedTracks.length} of {queue.tracks.length} tracks
          </div>
        </div>
      </div>

      {/* Track list */}
      <div className="max-h-96 overflow-y-auto">
        {filteredAndSortedTracks.length > 0 ? (
          <div className={`p-2 ${viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2' : 'space-y-1'}`}>
            {filteredAndSortedTracks.map((track, index) => renderTrackItem(track, index))}
          </div>
        ) : (
          <div className="text-center py-12 text-white/60">
            {searchQuery ? (
              <>
                <Search size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No tracks found</p>
                <p className="text-sm">Try adjusting your search or filters</p>
              </>
            ) : (
              <>
                <List size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Queue is empty</p>
                <p className="text-sm">Add some tracks to get started</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
