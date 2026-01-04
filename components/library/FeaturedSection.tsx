"use client";

import React from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  Star,
  Verified,
  Music,
  Album,
  User,
  Heart,
  Share2,
  Download,
  Shuffle,
  Plus
} from 'lucide-react';
import { useFeaturedContent } from '@/hooks/useFeaturedContent';
import { usePlayerStore, type Track as PlayerTrack } from '@/stores/player';
import TrackList from '@/components/library/TrackList';
import { DEFAULT_COVER, type Track as LibraryTrack } from '@/app/library/types';

type FeaturedSectionProps = {
  onPlayTrack?: (track: LibraryTrack) => void;
};

export default function FeaturedSection({ onPlayTrack }: FeaturedSectionProps) {
  const {
    tracks,
    playlists,
    featuredArtist,
    featuredAlbum,
    loading,
    error,
    refresh
  } = useFeaturedContent();

  const { setQueueList, playTrack } = usePlayerStore();

  const toPlayerTrack = (track: any): PlayerTrack => ({
    id: track.id,
    title: track.title,
    artist: track.artist,
    album_id: track.album_id ?? track.albumId ?? null,
    audio_url: track.audio_url || track.audioUrl || track.url || '',
    cover_art: track.cover_art || track.cover || track.coverArt || track.album?.coverUrl || null,
    duration: track.duration ?? (track.durationMs ? track.durationMs / 1000 : null),
  });

  const toLibraryTrack = (track: any): LibraryTrack => ({
    id: track.id,
    title: track.title,
    artist: track.artist || '',
    album: track.album?.title || track.album || featuredAlbum?.title || 'Music For The Future - Vx9',
    duration: track.duration ?? (track.durationMs ? track.durationMs / 1000 : 180),
    cover: track.cover_art || track.cover || track.coverArt || track.album?.coverUrl || DEFAULT_COVER,
    audioUrl: track.audio_url || track.audioUrl || track.url || null,
    saved: true,
    createdAt: new Date().toISOString(),
  });

  const handlePlayAll = () => {
    if (tracks.length === 0) return;
    const queue = tracks.map(toPlayerTrack).filter(t => t.audio_url);
    if (!queue.length) return;
    setQueueList(queue);
    playTrack(queue[0]);
    onPlayTrack?.(toLibraryTrack(queue[0]));
  };

  const handleShuffle = () => {
    if (tracks.length === 0) return;
    const shuffled = [...tracks].sort(() => Math.random() - 0.5);
    const queue = shuffled.map(toPlayerTrack).filter(t => t.audio_url);
    if (!queue.length) return;
    setQueueList(queue);
    playTrack(queue[0]);
    onPlayTrack?.(toLibraryTrack(queue[0]));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-white/10 rounded w-64 mb-4"></div>
          <div className="h-32 bg-white/10 rounded mb-6"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-white/10 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
          <Music className="h-8 w-8 text-red-400" />
        </div>
        <h3 className="text-lg font-medium text-white mb-2">Failed to load featured content</h3>
        <p className="text-white/60 mb-4">{error}</p>
        <button
          onClick={refresh}
          className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Featured Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-500/20 via-blue-500/20 to-purple-500/20 border border-white/10"
      >
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative p-8">
          <div className="flex items-center gap-2 mb-4">
            <Star className="h-5 w-5 text-yellow-400 fill-current" />
            <span className="text-yellow-400 font-medium">Featured Collection</span>
            <span className="bg-green-500/20 text-green-300 px-2 py-1 rounded text-xs font-medium">FREE</span>
          </div>
          
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center">
              <Music className="h-12 w-12 text-white" />
            </div>
            
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-2">
                {featuredAlbum?.title || 'Music For The Future -vx9'}
              </h1>
              
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-white/60" />
                  <span className="text-white/80">{featuredArtist?.name || 'VX'}</span>
                  {featuredArtist?.verified && (
                    <Verified className="h-4 w-4 text-blue-400 fill-current" />
                  )}
                </div>
                <span className="text-white/40">•</span>
                <span className="text-white/60">{tracks.length} tracks</span>
              </div>
              
              <p className="text-white/70 mb-6 max-w-2xl">
                {featuredAlbum?.description || 'A groundbreaking collection that defines tomorrow\'s sound. Experience the future of music, free for all TapTap Matrix users.'}
              </p>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePlayAll}
                  disabled={tracks.length === 0}
                  className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  <Play className="h-5 w-5" />
                  Play All
                </button>
                
                <button
                  onClick={handleShuffle}
                  disabled={tracks.length === 0}
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  <Shuffle className="h-5 w-5" />
                  Shuffle
                </button>
                
                <button className="p-3 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
                  <Heart className="h-5 w-5" />
                </button>
                
                <button className="p-3 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
                  <Share2 className="h-5 w-5" />
                </button>
                
                <button className="p-3 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Track List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Tracks</h2>
          <div className="text-sm text-white/60">
            {tracks.length} tracks • All free
          </div>
        </div>

        <TrackList
          tracks={tracks.map(toPlayerTrack)}
          loading={loading}
          showArtist={true}
          showAlbum={false}
          showDuration={true}
          onPlayTrack={(t) => onPlayTrack?.(toLibraryTrack(t))}
        />
      </motion.div>

      {/* Featured Artist Info */}
      {featuredArtist && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/5 border border-white/10 rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-white">{featuredArtist.name}</h3>
                {featuredArtist.verified && (
                  <Verified className="h-5 w-5 text-blue-400 fill-current" />
                )}
              </div>
              <p className="text-sm text-white/60">Featured Artist</p>
            </div>
          </div>
          
          <p className="text-white/70 mb-4">{featuredArtist.bio}</p>
          
          <div className="flex items-center gap-4 text-sm text-white/60">
            <span>{featuredArtist.trackCount} tracks</span>
            <span>•</span>
            <span>Verified artist</span>
            <span>•</span>
            <span>Free content</span>
          </div>
        </motion.div>
      )}
    </div>
  );
}
