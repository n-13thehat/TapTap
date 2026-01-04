import React from 'react';
import { Search, Settings, Download, Heart, Filter, Grid3X3, List, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';

interface TopbarProps {
  query: string;
  onQuery: (v: string) => void;
}

export function Topbar({ query, onQuery }: TopbarProps) {
  return (
    <div className="sticky top-0 z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left: Logo and Navigation */}
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-sm" />
            </div>
            <div>
              <div className="text-lg font-light text-white">TapTap</div>
              <div className="text-xs text-white/60 -mt-1">Library</div>
            </div>
          </div>

          {/* Tidal-style Navigation Pills */}
          <nav className="hidden md:flex items-center gap-1">
            <button className="px-4 py-2 text-sm font-medium text-white bg-white/10 rounded-full">
              My Music
            </button>
            <button className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 rounded-full transition-colors">
              Discover
            </button>
            <button className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 rounded-full transition-colors">
              Playlists
            </button>
          </nav>
        </div>

        {/* Center: Search */}
        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              value={query}
              onChange={(e) => onQuery(e.target.value)}
              placeholder="Search artists, albums, tracks..."
              className="w-full h-11 pl-12 pr-4 bg-white/5 border border-white/10 rounded-full text-white placeholder:text-white/40 focus:outline-none focus:border-teal-400/50 focus:bg-white/10 transition-all"
            />
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <Heart className="w-5 h-5" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <Download className="w-5 h-5" />
          </motion.button>

          <div className="w-px h-6 bg-white/10" />

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <Settings className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
