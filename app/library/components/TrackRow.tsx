import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Heart, MoreHorizontal, Plus, Download } from 'lucide-react';
import { formatTime } from '../utils';
import { Track } from '../types';

interface TrackRowProps {
  t: Track;
  index: number;
  onPlay: (t: Track) => void;
  onSave: (t: Track) => void;
  onAddToPlaylist: (t: Track) => void;
  onAttachLyrics: (t: Track) => void;
}

export function TrackRow({
  t,
  index,
  onPlay,
  onSave,
  onAddToPlaylist,
  onAttachLyrics,
}: TrackRowProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = () => {
    setIsPlaying(!isPlaying);
    onPlay(t);
  };

  return (
    <motion.div
      className="group grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 items-center px-4 py-3 rounded-lg hover:bg-white/5 transition-all duration-200"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ x: 4 }}
    >
      {/* Track Number / Play Button */}
      <div className="w-8 flex items-center justify-center">
        {isHovered ? (
          <motion.button
            onClick={handlePlay}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:bg-white/90 transition-colors"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </motion.button>
        ) : (
          <span className="text-white/40 text-sm font-medium">{index + 1}</span>
        )}
      </div>

      {/* Track Info */}
      <div className="flex items-center gap-4 min-w-0">
        <motion.img
          src={t.cover}
          alt={`${t.title} cover`}
          className="w-12 h-12 rounded-lg object-cover shadow-md"
          whileHover={{ scale: 1.05 }}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPlay(t)}
              className="text-white font-medium hover:underline truncate text-left"
            >
              {t.title}
            </button>
            {t.audioUrl && (
              <span className="px-2 py-0.5 text-xs bg-teal-500/20 text-teal-300 rounded-full">
                HiFi
              </span>
            )}
          </div>
          <div className="text-white/60 text-sm truncate">
            {t.artist} • {t.album}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            onSave(t);
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className={`p-2 rounded-full transition-colors ${
            t.saved
              ? "text-teal-400 bg-teal-500/20"
              : "text-white/60 hover:text-white hover:bg-white/10"
          }`}
        >
          <Heart className="w-4 h-4" fill={t.saved ? "currentColor" : "none"} />
        </motion.button>

        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            onAddToPlaylist(t);
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-colors"
        >
          <Plus className="w-4 h-4" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-colors"
        >
          <MoreHorizontal className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Duration */}
      <div className="text-white/60 text-sm font-medium">
        {formatTime(t.duration)}
      </div>

      {/* Quality Indicator */}
      <div className="text-right">
        {t.audioUrl ? (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-teal-400" />
            <span className="text-xs text-teal-300 font-medium">Lossless</span>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-orange-400" />
            <span className="text-xs text-orange-300 font-medium">Preview</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
