"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  Shuffle,
  Clock,
  Zap,
  Heart,
  Brain,
  Sparkles,
  TrendingUp,
  Music,
  ChevronRight
} from 'lucide-react';
import { Track } from '@/stores/unifiedPlayer';
import { SmartPlaylistService, SmartPlaylist } from '@/lib/services/smartPlaylistService';
import { useMusicLibrary } from '@/hooks/useMusicLibrary';
import { usePlayerStore, type Track as PlayerTrack } from '@/stores/player';

interface DiscoveryEngineProps {
  className?: string;
}

export default function DiscoveryEngine({ className = '' }: DiscoveryEngineProps) {
  const [smartPlaylists, setSmartPlaylists] = useState<SmartPlaylist[]>([]);
  const [currentTimeOfDay, setCurrentTimeOfDay] = useState<string>('');
  const [recommendedActivity, setRecommendedActivity] = useState<string>('');
  
  const { tracks, loading } = useMusicLibrary();
  const { setQueueList, playTrack } = usePlayerStore();

  const toPlayerTrack = (track: Track): PlayerTrack => ({
    id: (track as any).id,
    title: (track as any).title,
    artist: (track as any).artist,
    album_id: (track as any).album_id ?? null,
    audio_url: (track as any).audio_url || (track as any).audioUrl || '',
    cover_art: (track as any).cover_art || (track as any).cover || (track as any).coverArt || (track as any).album?.coverUrl || null,
    duration: (track as any).duration ?? null,
  });

  useEffect(() => {
    if (tracks.length > 0) {
      // Generate smart playlists
      const playlists = SmartPlaylistService.generateAllSmartPlaylists(tracks);
      setSmartPlaylists(playlists);

      // Determine current time of day
      const hour = new Date().getHours();
      if (hour < 12) setCurrentTimeOfDay('morning');
      else if (hour < 17) setCurrentTimeOfDay('afternoon');
      else if (hour < 21) setCurrentTimeOfDay('evening');
      else setCurrentTimeOfDay('night');

      // Recommend activity based on time
      if (hour >= 9 && hour <= 17) setRecommendedActivity('work');
      else if (hour >= 18 && hour <= 20) setRecommendedActivity('relax');
      else setRecommendedActivity('creative');
    }
  }, [tracks]);

  const playPlaylist = (playlist: SmartPlaylist) => {
    if (playlist.tracks.length === 0) return;
    const queue = playlist.tracks.map(toPlayerTrack).filter(t => t.audio_url);
    if (!queue.length) return;
    setQueueList(queue);
    playTrack(queue[0]);
  };

  const getTimeBasedRecommendation = () => {
    return smartPlaylists.find(p => p.id.includes(currentTimeOfDay));
  };

  const getActivityRecommendation = () => {
    return smartPlaylists.find(p => p.id.includes(recommendedActivity));
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-white/5 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  const timeRecommendation = getTimeBasedRecommendation();
  const activityRecommendation = getActivityRecommendation();
  const featuredPlaylists = smartPlaylists.filter(p => 
    ['complete-journey', 'daily-discovery', 'hidden-gems'].includes(p.id)
  );

  return (
    <div className={`space-y-8 ${className}`}>
      {/* AI Recommendations Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-500/20 to-blue-500/20 border border-teal-400/30 rounded-full px-4 py-2 mb-4">
          <Brain className="h-4 w-4 text-teal-300" />
          <span className="text-teal-300 font-medium">AI Music Discovery</span>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Discover Your Perfect Sound</h2>
        <p className="text-white/70">AI-powered playlists that adapt to your mood, time, and activity</p>
      </motion.div>

      {/* Smart Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Time-based Recommendation */}
        {timeRecommendation && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative overflow-hidden rounded-xl bg-gradient-to-br from-white/5 to-white/10 border border-white/10 p-6"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${timeRecommendation.color} opacity-10`}></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-2xl">{timeRecommendation.icon}</div>
                <div>
                  <h3 className="font-semibold text-white">Perfect for Right Now</h3>
                  <p className="text-sm text-white/60">Based on current time</p>
                </div>
              </div>
              
              <h4 className="text-lg font-medium text-white mb-2">{timeRecommendation.title}</h4>
              <p className="text-white/70 text-sm mb-4">{timeRecommendation.description}</p>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => playPlaylist(timeRecommendation)}
                  className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Play className="h-4 w-4" />
                  Play Now
                </button>
                <span className="text-xs text-white/50">{timeRecommendation.tracks.length} tracks</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Activity-based Recommendation */}
        {activityRecommendation && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative overflow-hidden rounded-xl bg-gradient-to-br from-white/5 to-white/10 border border-white/10 p-6"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${activityRecommendation.color} opacity-10`}></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-2xl">{activityRecommendation.icon}</div>
                <div>
                  <h3 className="font-semibold text-white">Recommended Activity</h3>
                  <p className="text-sm text-white/60">AI suggestion</p>
                </div>
              </div>
              
              <h4 className="text-lg font-medium text-white mb-2">{activityRecommendation.title}</h4>
              <p className="text-white/70 text-sm mb-4">{activityRecommendation.description}</p>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => playPlaylist(activityRecommendation)}
                  className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Play className="h-4 w-4" />
                  Play Now
                </button>
                <span className="text-xs text-white/50">{activityRecommendation.tracks.length} tracks</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Featured Discovery Playlists */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="text-xl font-semibold text-white mb-6">Featured Collections</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {featuredPlaylists.map((playlist, index) => (
            <motion.div
              key={playlist.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-white/5 to-white/10 border border-white/10 p-4 hover:from-white/10 hover:to-white/15 transition-all cursor-pointer"
              onClick={() => playPlaylist(playlist)}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${playlist.color} opacity-5 group-hover:opacity-10 transition-opacity`}></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xl">{playlist.icon}</div>
                  <ChevronRight className="h-4 w-4 text-white/40 group-hover:text-white/70 transition-colors" />
                </div>
                
                <h4 className="font-medium text-white mb-2">{playlist.title}</h4>
                <p className="text-white/60 text-sm mb-3 line-clamp-2">{playlist.description}</p>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/50">{playlist.tracks.length} tracks</span>
                  <div className="flex items-center gap-1">
                    <Play className="h-3 w-3 text-teal-400" />
                    <span className="text-xs text-teal-400">Play</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* All Smart Playlists */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h3 className="text-xl font-semibold text-white mb-6">All Smart Playlists</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {smartPlaylists.filter(p => !featuredPlaylists.includes(p)).map((playlist, index) => (
            <motion.div
              key={playlist.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05 * index }}
              className="group relative overflow-hidden rounded-lg bg-white/5 border border-white/10 p-4 hover:bg-white/10 transition-all cursor-pointer"
              onClick={() => playPlaylist(playlist)}
            >
              <div className="flex items-center gap-3">
                <div className="text-lg">{playlist.icon}</div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-white truncate">{playlist.title}</h4>
                  <p className="text-white/60 text-sm truncate">{playlist.tracks.length} tracks</p>
                </div>
                <Play className="h-4 w-4 text-white/40 group-hover:text-teal-400 transition-colors" />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
