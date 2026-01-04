"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, PanInfo } from 'framer-motion';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Repeat,
  Shuffle,
  Heart,
  MoreHorizontal,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useUnifiedPlayer } from '@/stores/unifiedPlayer';
import { PWAService } from '@/lib/services/pwaService';

interface MobileAudioPlayerProps {
  className?: string;
}

export default function MobileAudioPlayer({ className = '' }: MobileAudioPlayerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isShuffled,
    repeatMode,
    queue,
    currentIndex,
    play,
    pause,
    next,
    previous,
    seek,
    setVolume,
    toggleShuffle,
    toggleRepeat
  } = useUnifiedPlayer();

  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMobile(PWAService.isMobileDevice());
    
    // Update media session when track changes
    if (currentTrack) {
      PWAService.updateMediaSession({
        title: currentTrack.title,
        artist: currentTrack.artist || 'Unknown Artist',
        album: currentTrack.album || 'Music For The Future'
      });
    }
  }, [currentTrack]);

  // Handle media session actions
  useEffect(() => {
    const handleMediaSessionAction = (event: CustomEvent) => {
      const { action } = event.detail;
      
      switch (action) {
        case 'play':
          play();
          break;
        case 'pause':
          pause();
          break;
        case 'previoustrack':
          previous();
          break;
        case 'nexttrack':
          next();
          break;
        case 'seekbackward':
          seek(Math.max(0, currentTime - 10));
          break;
        case 'seekforward':
          seek(Math.min(duration, currentTime + 10));
          break;
      }
    };

    window.addEventListener('pwa:mediaSessionAction', handleMediaSessionAction as EventListener);
    
    return () => {
      window.removeEventListener('pwa:mediaSessionAction', handleMediaSessionAction as EventListener);
    };
  }, [play, pause, next, previous, seek, currentTime, duration]);

  const handleProgressClick = (event: React.MouseEvent) => {
    if (progressRef.current && duration > 0) {
      const rect = progressRef.current.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const percentage = clickX / rect.width;
      const newTime = percentage * duration;
      seek(newTime);
    }
  };

  const handleSwipeGesture = (info: PanInfo) => {
    const { offset, velocity } = info;
    
    // Horizontal swipes for track control
    if (Math.abs(offset.x) > Math.abs(offset.y)) {
      if (offset.x > 50 && velocity.x > 0) {
        // Swipe right - previous track
        previous();
      } else if (offset.x < -50 && velocity.x < 0) {
        // Swipe left - next track
        next();
      }
    }
    
    // Vertical swipes for player expansion
    if (Math.abs(offset.y) > Math.abs(offset.x)) {
      if (offset.y < -50 && velocity.y < 0) {
        // Swipe up - expand player
        setIsExpanded(true);
      } else if (offset.y > 50 && velocity.y > 0) {
        // Swipe down - collapse player
        setIsExpanded(false);
      }
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!currentTrack) {
    return null;
  }

  return (
    <>
      {/* Mini Player (Collapsed) */}
      <motion.div
        className={`fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-r from-slate-900 to-slate-800 border-t border-white/10 ${className}`}
        initial={false}
        animate={{ 
          height: isExpanded ? '100vh' : isMobile ? '80px' : '72px',
          y: isExpanded ? 0 : 0
        }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      >
        {!isExpanded && (
          <motion.div
            className="flex items-center gap-3 p-4 cursor-pointer"
            onClick={() => setIsExpanded(true)}
            drag={isMobile ? 'y' : false}
            dragConstraints={{ top: -100, bottom: 100 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => handleSwipeGesture(info)}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={() => setIsDragging(false)}
            whileTap={{ scale: 0.98 }}
          >
            {/* Track Info */}
            <div className="flex-1 min-w-0">
              <div className="text-white font-medium truncate text-sm">
                {currentTrack.title}
              </div>
              <div className="text-white/60 truncate text-xs">
                {currentTrack.artist || 'Unknown Artist'}
              </div>
            </div>

            {/* Mini Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  isPlaying ? pause() : play();
                }}
                className="p-2 text-white hover:text-teal-400 transition-colors"
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                className="p-2 text-white hover:text-teal-400 transition-colors"
              >
                <SkipForward className="h-4 w-4" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
              <div 
                className="h-full bg-teal-400 transition-all duration-300"
                style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>
          </motion.div>
        )}

        {/* Expanded Player */}
        {isExpanded && (
          <motion.div
            className="h-full flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            drag={isMobile ? 'y' : false}
            dragConstraints={{ top: 0, bottom: 200 }}
            dragElastic={0.1}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100) {
                setIsExpanded(false);
              }
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 pt-8">
              <button
                onClick={() => setIsExpanded(false)}
                className="p-2 text-white/60 hover:text-white transition-colors"
              >
                <ChevronDown className="h-6 w-6" />
              </button>
              
              <div className="text-center">
                <div className="text-white/60 text-sm">Playing from</div>
                <div className="text-white font-medium">Music For The Future</div>
              </div>
              
              <button className="p-2 text-white/60 hover:text-white transition-colors">
                <MoreHorizontal className="h-6 w-6" />
              </button>
            </div>

            {/* Album Art */}
            <div className="flex-1 flex items-center justify-center p-8">
              <motion.div
                className="w-80 h-80 max-w-full max-h-full bg-gradient-to-br from-teal-500/20 to-blue-500/20 rounded-2xl border border-white/10 flex items-center justify-center"
                animate={{ 
                  rotate: isPlaying ? 360 : 0,
                  scale: isPlaying ? 1.02 : 1
                }}
                transition={{ 
                  rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
                  scale: { duration: 0.3 }
                }}
              >
                <div className="text-6xl">🎵</div>
              </motion.div>
            </div>

            {/* Track Info */}
            <div className="text-center px-8 mb-6">
              <h2 className="text-2xl font-bold text-white mb-2 truncate">
                {currentTrack.title}
              </h2>
              <p className="text-white/60 text-lg truncate">
                {currentTrack.artist || 'Unknown Artist'}
              </p>
            </div>

            {/* Progress */}
            <div className="px-8 mb-6">
              <div 
                ref={progressRef}
                className="relative h-2 bg-white/10 rounded-full cursor-pointer mb-2"
                onClick={handleProgressClick}
              >
                <div 
                  className="absolute top-0 left-0 h-full bg-teal-400 rounded-full transition-all duration-300"
                  style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                />
                <div 
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg transition-all duration-300"
                  style={{ left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                />
              </div>
              
              <div className="flex justify-between text-white/60 text-sm">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-8 px-8 mb-8">
              <button
                onClick={toggleShuffle}
                className={`p-3 transition-colors ${
                  isShuffled ? 'text-teal-400' : 'text-white/60 hover:text-white'
                }`}
              >
                <Shuffle className="h-5 w-5" />
              </button>

              <button
                onClick={previous}
                className="p-3 text-white hover:text-teal-400 transition-colors"
              >
                <SkipBack className="h-6 w-6" />
              </button>

              <motion.button
                onClick={isPlaying ? pause : play}
                className="p-4 bg-teal-500 hover:bg-teal-600 text-white rounded-full transition-colors"
                whileTap={{ scale: 0.95 }}
              >
                {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 ml-1" />}
              </motion.button>

              <button
                onClick={next}
                className="p-3 text-white hover:text-teal-400 transition-colors"
              >
                <SkipForward className="h-6 w-6" />
              </button>

              <button
                onClick={toggleRepeat}
                className={`p-3 transition-colors ${
                  repeatMode !== 'off' ? 'text-teal-400' : 'text-white/60 hover:text-white'
                }`}
              >
                <Repeat className="h-5 w-5" />
              </button>
            </div>

            {/* Volume Control */}
            <div className="flex items-center gap-4 px-8 pb-8">
              <button
                onClick={() => setVolume(volume > 0 ? 0 : 0.8)}
                className="text-white/60 hover:text-white transition-colors"
              >
                {volume > 0 ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
              </button>
              
              <div className="flex-1">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer slider"
                />
              </div>
              
              <button className="text-white/60 hover:text-white transition-colors">
                <Heart className="h-5 w-5" />
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Backdrop for expanded player */}
      {isExpanded && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsExpanded(false)}
        />
      )}
    </>
  );
}
