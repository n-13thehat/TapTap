"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  X, 
  Play, 
  Plus, 
  ExternalLink,
  Music,
  User,
  Album,
  ShoppingBag,
  Command
} from 'lucide-react';
import { usePlayerStore } from '@/stores/player';

interface SearchResult {
  type: string;
  id: string;
  title: string;
  href?: string;
  audio_url?: string;
  artist?: string;
}

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { playTrack, addToQueue, addNext } = usePlayerStore();

  // Search function with debouncing
  const searchItems = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      setResults(data.items || []);
      setSelectedIndex(0);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchItems(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, searchItems]);

  // Handle actions on search results
  const handleAction = useCallback((item: SearchResult, action: 'play' | 'queue' | 'next' | 'open') => {
    switch (action) {
      case 'play':
        if (item.type === 'Tracks' && item.audio_url) {
          playTrack({
            id: item.id,
            title: item.title,
            artist: item.artist,
            audio_url: item.audio_url
          });
        }
        break;
      case 'queue':
        if (item.type === 'Tracks' && item.audio_url) {
          addToQueue({
            id: item.id,
            title: item.title,
            artist: item.artist,
            audio_url: item.audio_url
          });
        }
        break;
      case 'next':
        if (item.type === 'Tracks' && item.audio_url) {
          addNext({
            id: item.id,
            title: item.title,
            artist: item.artist,
            audio_url: item.audio_url
          });
        }
        break;
      case 'open':
        if (item.href) {
          window.location.href = item.href;
        }
        break;
    }
    onClose();
  }, [playTrack, addToQueue, addNext, onClose]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (results[selectedIndex]) {
            handleAction(results[selectedIndex], 'open');
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleAction, isOpen, onClose, results, selectedIndex]);

  // Get icon for result type
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Tracks': return <Music className="h-4 w-4" />;
      case 'Artists': return <User className="h-4 w-4" />;
      case 'Albums': return <Album className="h-4 w-4" />;
      case 'Products': return <ShoppingBag className="h-4 w-4" />;
      default: return <Search className="h-4 w-4" />;
    }
  };

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          className="mx-auto mt-20 max-w-2xl rounded-xl border border-white/10 bg-black/90 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Input */}
          <div className="flex items-center gap-3 border-b border-white/10 p-4">
            <Search className="h-5 w-5 text-white/40" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tracks, artists, albums, users..."
              className="flex-1 bg-transparent text-white placeholder-white/40 outline-none"
              autoFocus
            />
            <div className="flex items-center gap-2 text-xs text-white/40">
              <Command className="h-3 w-3" />
              <span>K</span>
            </div>
            <button
              onClick={onClose}
              className="rounded-md p-1 text-white/40 hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center p-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
              </div>
            )}

            {!loading && query && results.length === 0 && (
              <div className="p-8 text-center text-white/60">
                No results found for "{query}"
              </div>
            )}

            {!loading && results.length > 0 && (
              <div className="p-2">
                {results.map((item, index) => (
                  <motion.div
                    key={`${item.type}-${item.id}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`group flex items-center gap-3 rounded-lg p-3 transition-colors ${
                      index === selectedIndex
                        ? 'bg-white/10 text-white'
                        : 'text-white/80 hover:bg-white/5'
                    }`}
                    onClick={() => handleAction(item, 'open')}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white/10">
                      {getTypeIcon(item.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{item.title}</div>
                      <div className="text-xs text-white/40">{item.type}</div>
                    </div>

                    {/* Action buttons for tracks */}
                    {item.type === 'Tracks' && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAction(item, 'play');
                          }}
                          className="rounded-md p-1.5 text-white/60 hover:bg-white/10 hover:text-white"
                          title="Play now"
                        >
                          <Play className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAction(item, 'next');
                          }}
                          className="rounded-md p-1.5 text-white/60 hover:bg-white/10 hover:text-white"
                          title="Play next"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    )}

                    <ExternalLink className="h-3 w-3 text-white/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </motion.div>
                ))}
              </div>
            )}

            {!loading && !query && (
              <div className="p-8 text-center text-white/60">
                <Search className="mx-auto h-12 w-12 mb-4 text-white/20" />
                <div className="text-lg font-medium mb-2">Search TapTap</div>
                <div className="text-sm">Find tracks, artists, albums, users, and products</div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
