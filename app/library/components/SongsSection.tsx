import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Music2, Filter, Grid3X3, List, Play, Shuffle } from 'lucide-react';
import { Track } from '../types';
import { Header } from './Header';
import { EmptyState } from './EmptyState';
import { TrackRow } from './TrackRow';

interface SongsSectionProps {
  query: string;
  tracks: Track[];
  onPlay: (t: Track) => void;
  onSave: (t: Track) => void;
  onAddToPlaylist: (t: Track) => void;
  onAttachLyrics: (t: Track) => void;
}

export function SongsSection({
  query,
  tracks,
  onPlay,
  onSave,
  onAddToPlaylist,
  onAttachLyrics,
}: SongsSectionProps) {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [sortBy, setSortBy] = useState<'recent' | 'title' | 'artist'>('recent');

  if (!tracks.length) {
    return (
      <EmptyState
        title="No tracks found"
        description="Save a track, upload release demos, or import purchases to seed your TapTap library."
        action={{ label: "Upload Track", href: "/creator/upload" }}
      />
    );
  }

  return (
    <section className="space-y-6">
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-light text-white mb-1">My Music</h2>
          <p className="text-white/60 text-sm">{tracks.length} tracks in your library</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Play All Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => tracks.length > 0 && onPlay(tracks[0])}
            className="flex items-center gap-2 px-6 py-3 bg-teal-500 hover:bg-teal-400 text-white rounded-full font-medium transition-colors"
          >
            <Play className="w-4 h-4" />
            Play All
          </motion.button>

          {/* Shuffle Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
          >
            <Shuffle className="w-4 h-4" />
            Shuffle
          </motion.button>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-white/5 rounded-full p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-full transition-colors ${
                viewMode === 'list' ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-full transition-colors ${
                viewMode === 'grid' ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
          </div>

          {/* Filter Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-3 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <Filter className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* Track List */}
      <div className="space-y-1">
        {/* Table Header */}
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 items-center px-4 py-2 text-xs font-medium text-white/40 uppercase tracking-wider border-b border-white/5">
          <div className="w-8">#</div>
          <div>Title</div>
          <div></div>
          <div>Duration</div>
          <div className="text-right">Quality</div>
        </div>

        {/* Track Rows */}
        <motion.div
          className="space-y-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ staggerChildren: 0.02 }}
        >
          {tracks.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
            >
              <TrackRow
                t={t}
                index={i}
                onPlay={onPlay}
                onSave={onSave}
                onAddToPlaylist={onAddToPlaylist}
                onAttachLyrics={onAttachLyrics}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
