"use client";

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  X,
  List,
  Grid,
  Filter
} from 'lucide-react';

interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  cover?: string;
  audioUrl: string;
  duration?: number;
}

interface QueueManagerProps {
  queue: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  onPlay: (track: Track) => void;
  onPause: () => void;
  onRemove: (trackId: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onClear: () => void;
  onShuffle: () => void;
  onClose?: () => void;
  className?: string;
}

export default function QueueManager({
  queue,
  currentTrack,
  isPlaying,
  onPlay,
  onPause,
  onRemove,
  onReorder,
  onClear,
  onShuffle,
  onClose,
  className = ''
}: QueueManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Filter queue based on search
  const filteredQueue = queue.filter(track =>
    track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    track.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
    track.album?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Format duration
  const formatDuration = useCallback((seconds?: number) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Calculate total duration
  const totalDuration = queue.reduce((total, track) => total + (track.duration || 0), 0);

  // Drag handlers
  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      onReorder(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, [draggedIndex, onReorder]);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

  return (
    <div className={`bg-black/95 backdrop-blur-md border border-white/10 rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <List className="h-5 w-5 text-teal-400" />
            <h2 className="text-lg font-semibold text-white">Queue</h2>
            <span className="text-sm text-white/60">
              {queue.length} tracks • {formatDuration(totalDuration)}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
              className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              {viewMode === 'list' ? <Grid className="h-4 w-4" /> : <List className="h-4 w-4" />}
            </button>
            
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <input
            type="text"
            placeholder="Search queue..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-teal-400/50"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onShuffle}
            className="flex items-center gap-2 px-3 py-1.5 bg-teal-500/20 text-teal-300 rounded-lg hover:bg-teal-500/30 transition-colors text-sm"
          >
            <Shuffle className="h-3 w-3" />
            Shuffle
          </button>
          
          <button
            onClick={onClear}
            className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors text-sm"
          >
            <Trash2 className="h-3 w-3" />
            Clear
          </button>
        </div>
      </div>

      {/* Queue List */}
      <div className="max-h-96 overflow-y-auto">
        {filteredQueue.length > 0 ? (
          <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-2 p-2' : 'space-y-1 p-2'}>
            {filteredQueue.map((track, index) => {
              const isCurrentTrack = currentTrack?.id === track.id;
              const isDragging = draggedIndex === index;
              const isDragOver = dragOverIndex === index;
              
              return (
                <motion.div
                  key={track.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`
                    group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all
                    ${isCurrentTrack 
                      ? 'bg-teal-500/20 border border-teal-400/30' 
                      : 'hover:bg-white/5'
                    }
                    ${isDragging ? 'opacity-50 scale-95' : ''}
                    ${isDragOver ? 'bg-white/10' : ''}
                  `}
                >
                  {/* Track Number / Play Button */}
                  <div className="w-8 flex items-center justify-center">
                    {isCurrentTrack && isPlaying ? (
                      <button
                        onClick={onPause}
                        className="p-1 rounded text-teal-400 hover:text-teal-300"
                      >
                        <Pause className="h-3 w-3" />
                      </button>
                    ) : (
                      <button
                        onClick={() => onPlay(track)}
                        className="p-1 rounded text-white/60 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Play className="h-3 w-3" />
                      </button>
                    )}
                    <span className="text-xs text-white/40 group-hover:hidden">
                      {index + 1}
                    </span>
                  </div>

                  {/* Cover */}
                  <img
                    src={track.cover || '/default-cover.jpg'}
                    alt={track.title}
                    className="w-10 h-10 rounded object-cover"
                  />

                  {/* Track Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-medium truncate ${
                      isCurrentTrack ? 'text-teal-300' : 'text-white'
                    }`}>
                      {track.title}
                    </h4>
                    <p className="text-sm text-white/60 truncate">
                      {track.artist}
                      {track.album && ` • ${track.album}`}
                    </p>
                  </div>

                  {/* Duration */}
                  <span className="text-xs text-white/40">
                    {formatDuration(track.duration)}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1 rounded text-white/60 hover:text-white">
                      <Heart className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => onRemove(track.id)}
                      className="p-1 rounded text-white/60 hover:text-red-400"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                    <button className="p-1 rounded text-white/60 hover:text-white">
                      <MoreHorizontal className="h-3 w-3" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-white/60">
            {searchQuery ? (
              <>
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No tracks found</p>
                <p className="text-sm">Try adjusting your search</p>
              </>
            ) : (
              <>
                <Music className="h-12 w-12 mx-auto mb-4 opacity-50" />
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
