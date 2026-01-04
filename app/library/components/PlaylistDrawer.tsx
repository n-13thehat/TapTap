import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Playlist } from '../types';
import { timeAgo } from '../utils';

interface PlaylistDrawerProps {
  open: boolean;
  onClose: () => void;
  playlist: Playlist | null;
}

export function PlaylistDrawer({ open, onClose, playlist }: PlaylistDrawerProps) {
  return (
    <AnimatePresence>
      {open && playlist && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur"
          onClick={onClose}
        >
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 24, stiffness: 220 }}
            className="absolute right-0 top-0 h-full w-full max-w-lg overflow-y-auto border-l border-white/10 bg-black"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <img src={playlist.cover} className="h-48 w-full object-cover" alt={playlist.title} />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/0" />
              <button 
                onClick={onClose} 
                className="absolute right-3 top-3 rounded-md bg-black/60 p-2 text-white/80 backdrop-blur hover:bg-black/80"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="absolute bottom-3 left-3 right-3">
                <div className="text-lg font-semibold text-white">{playlist.title}</div>
                <div className="text-xs text-white/70">
                  {playlist.tracks} tracks • updated {timeAgo(playlist.updatedAt)}
                </div>
                {playlist.description && (
                  <div className="mt-2 text-sm text-white/80">{playlist.description}</div>
                )}
              </div>
            </div>
            
            <div className="space-y-3 p-4">
              <div className="text-sm text-white/70">
                Playlist preview coming soon (contains {playlist.tracks} tracks).
              </div>
              
              {/* Placeholder for future track list */}
              <div className="space-y-2">
                {Array.from({ length: Math.min(playlist.tracks, 5) }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg bg-white/5 p-3">
                    <div className="h-10 w-10 rounded bg-white/10" />
                    <div className="flex-1">
                      <div className="h-4 w-3/4 rounded bg-white/10" />
                      <div className="mt-1 h-3 w-1/2 rounded bg-white/5" />
                    </div>
                    <div className="h-3 w-8 rounded bg-white/5" />
                  </div>
                ))}
                {playlist.tracks > 5 && (
                  <div className="text-center text-xs text-white/50">
                    +{playlist.tracks - 5} more tracks
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
