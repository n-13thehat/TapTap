"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Shuffle,
  Repeat,
  Repeat1,
  List,
  Heart,
  Share2,
  MoreHorizontal,
  Maximize2,
  Minimize2,
  Download,
  Radio,
  Headphones,
  Loader2,
  Waves,
  BarChart3
} from 'lucide-react';
import { useUnifiedPlayer } from '@/stores/unifiedPlayer';
import QueueManager from './QueueManager';
import { useIsMobile, MobileDrawer } from '@/components/mobile/MobileOptimizations';

interface StreamingAudioPlayerProps {
  className?: string;
}

export default function StreamingAudioPlayer({
  className = ''
}: StreamingAudioPlayerProps) {
  // Use unified player store
  const {
    currentTrack,
    queue,
    isPlaying,
    volume,
    isMuted,
    shuffle,
    repeat,
    showQueue,
    isExpanded,
    currentTime,
    duration,
    isLoading,
    isBuffering,
    play,
    pause,
    togglePlayPause,
    next,
    previous,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    toggleRepeat,
    toggleQueue,
    toggleExpanded,
    setCurrentTime,
    setDuration,
    setIsLoading,
    setIsBuffering,
    addToQueue,
    removeFromQueue,
    reorderQueue,
    clearQueue,
    shuffleQueue
  } = useUnifiedPlayer();
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [showVolume, setShowVolume] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const isMobile = useIsMobile();

  // Audio element event handlers
  const handleLoadStart = useCallback(() => setIsLoading(true), [setIsLoading]);
  const handleCanPlay = useCallback(() => setIsLoading(false), [setIsLoading]);
  const handleWaiting = useCallback(() => setIsBuffering(true), [setIsBuffering]);
  const handlePlaying = useCallback(() => setIsBuffering(false), [setIsBuffering]);
  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  }, [setCurrentTime]);
  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  }, [setDuration]);
  const handleEnded = useCallback(() => {
    if (repeat === 'one') {
      audioRef.current?.play();
    } else {
      next();
    }
  }, [repeat, next]);

  // Sync audio element with props
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    if (audio.src !== currentTrack.audioUrl) {
      audio.src = currentTrack.audioUrl;
      setCurrentTime(0);
      setDuration(0);
    }

    audio.volume = volume;
    
    if (isPlaying) {
      audio.play().catch(console.error);
    } else {
      audio.pause();
    }
  }, [currentTrack, isPlaying, volume]);

  // Progress bar click handler
  const handleProgressClick = useCallback((e: React.MouseEvent) => {
    if (!progressRef.current || !duration) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      seek(newTime);
    }
  }, [duration, seek, setCurrentTime]);

  // Format time helper
  const formatTime = useCallback((seconds: number) => {
    if (!isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Progress percentage
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Repeat icon
  const RepeatIcon = repeat === 'one' ? Repeat1 : Repeat;

  if (!currentTrack) {
    return (
      <div className={`bg-black/90 backdrop-blur-md border-t border-white/10 p-4 ${className}`}>
        <div className="flex items-center justify-center text-white/60">
          <Radio className="h-5 w-5 mr-2" />
          <span>No track selected</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-black/90 backdrop-blur-md border-t border-white/10 ${className}`}>
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onLoadStart={handleLoadStart}
        onCanPlay={handleCanPlay}
        onWaiting={handleWaiting}
        onPlaying={handlePlaying}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        preload="metadata"
      />

      {/* Main Player Bar */}
      <div className={`flex items-center gap-2 p-3 ${isMobile ? 'flex-col space-y-2' : 'md:gap-4 md:p-4'}`}>
        {/* Mobile: Track Info + Controls in one row */}
        {isMobile ? (
          <>
            <div className="flex items-center gap-3 w-full">
              <div className="relative">
                <img
                  src={currentTrack.cover || '/default-cover.jpg'}
                  alt={currentTrack.title}
                  className="w-10 h-10 rounded-lg object-cover"
                />
                {(isLoading || isBuffering) && (
                  <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                    <Loader2 className="h-3 w-3 text-white animate-spin" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-white font-medium truncate text-sm">{currentTrack.title}</h3>
                <p className="text-white/60 text-xs truncate">{currentTrack.artist}</p>
              </div>

              {/* Mobile Controls */}
              <div className="flex items-center gap-1">
                <button
                  onClick={previous}
                  className="p-2 rounded-lg text-white/60 hover:text-white transition-colors"
                >
                  <SkipBack className="h-4 w-4" />
                </button>

                <button
                  onClick={togglePlayPause}
                  disabled={isLoading}
                  className="p-2 rounded-full bg-teal-500 hover:bg-teal-600 text-white transition-colors disabled:opacity-50"
                >
                  {isLoading || isBuffering ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4 ml-0.5" />
                  )}
                </button>

                <button
                  onClick={next}
                  className="p-2 rounded-lg text-white/60 hover:text-white transition-colors"
                >
                  <SkipForward className="h-4 w-4" />
                </button>

                <button
                  onClick={toggleQueue}
                  className={`p-2 rounded-lg transition-colors ${
                    showQueue ? 'text-teal-400 bg-teal-400/20' : 'text-white/60 hover:text-white'
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Mobile Progress Bar */}
            <div className="flex items-center gap-2 w-full">
              <span className="text-xs text-white/60 w-8 text-right">
                {formatTime(currentTime)}
              </span>
              <div
                ref={progressRef}
                onClick={handleProgressClick}
                className="relative h-1 flex-1 bg-white/20 rounded-full cursor-pointer"
              >
                <div
                  className="absolute top-0 left-0 h-full bg-teal-400 rounded-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-xs text-white/60 w-8">
                {formatTime(duration)}
              </span>
            </div>
          </>
        ) : (
          <>
            {/* Desktop Layout */}
            {/* Track Info */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="relative">
                <img
                  src={currentTrack.cover || '/default-cover.jpg'}
                  alt={currentTrack.title}
                  className="w-12 h-12 rounded-lg object-cover"
                />
                {(isLoading || isBuffering) && (
                  <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                    <Loader2 className="h-4 w-4 text-white animate-spin" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-white font-medium truncate">{currentTrack.title}</h3>
                <p className="text-white/60 text-sm truncate">{currentTrack.artist}</p>
              </div>

              {/* Track Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsLiked(!isLiked)}
                  className={`p-2 rounded-lg transition-colors ${
                    isLiked ? 'text-red-400 hover:text-red-300' : 'text-white/60 hover:text-white'
                  }`}
                >
                  <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                </button>
                <button className="p-2 rounded-lg text-white/60 hover:text-white transition-colors">
                  <Share2 className="h-4 w-4" />
                </button>
                <button className="p-2 rounded-lg text-white/60 hover:text-white transition-colors">
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}

        {/* Desktop Playback Controls */}
        {!isMobile && (
          <div className="flex items-center gap-2">
            <button
              onClick={toggleShuffle}
              className={`p-2 rounded-lg transition-colors ${
                shuffle ? 'text-teal-400 bg-teal-400/20' : 'text-white/60 hover:text-white'
              }`}
            >
              <Shuffle className="h-4 w-4" />
            </button>

            <button
              onClick={previous}
              className="p-2 rounded-lg text-white/60 hover:text-white transition-colors"
            >
              <SkipBack className="h-4 w-4" />
            </button>

            <button
              onClick={togglePlayPause}
              disabled={isLoading}
              className="p-3 rounded-full bg-teal-500 hover:bg-teal-600 text-white transition-colors disabled:opacity-50"
            >
              {isLoading || isBuffering ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5 ml-0.5" />
              )}
            </button>

            <button
              onClick={next}
              className="p-2 rounded-lg text-white/60 hover:text-white transition-colors"
            >
              <SkipForward className="h-4 w-4" />
            </button>

            <button
              onClick={toggleRepeat}
              className={`p-2 rounded-lg transition-colors ${
                repeat !== 'off' ? 'text-teal-400 bg-teal-400/20' : 'text-white/60 hover:text-white'
              }`}
            >
              <RepeatIcon className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Desktop Progress & Volume */}
        {!isMobile && (
          <div className="flex items-center gap-4 min-w-0 flex-1">
            {/* Progress */}
            <div className="flex items-center gap-2 flex-1">
              <span className="text-xs text-white/60 w-10 text-right">
                {formatTime(currentTime)}
              </span>
              <div
                ref={progressRef}
                onClick={handleProgressClick}
                className="relative h-2 flex-1 bg-white/20 rounded-full cursor-pointer group"
              >
                <div
                  className="absolute top-0 left-0 h-full bg-teal-400 rounded-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-teal-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ left: `${progressPercent}%`, transform: 'translateX(-50%) translateY(-50%)' }}
                />
              </div>
              <span className="text-xs text-white/60 w-10">
                {formatTime(duration)}
              </span>
            </div>

            {/* Volume */}
            <div className="relative">
              <button
                onClick={() => setShowVolume(!showVolume)}
                onMouseEnter={() => setShowVolume(true)}
                className="p-2 rounded-lg text-white/60 hover:text-white transition-colors"
              >
                {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>

              <AnimatePresence>
                {showVolume && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    onMouseLeave={() => setShowVolume(false)}
                    className="absolute bottom-full right-0 mb-2 p-2 bg-black/90 backdrop-blur-md border border-white/10 rounded-lg"
                  >
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={isMuted ? 0 : volume}
                      onChange={(e) => setVolume(parseFloat(e.target.value))}
                      className="w-20 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Queue */}
            <button
              onClick={toggleQueue}
              className={`p-2 rounded-lg transition-colors ${
                showQueue ? 'text-teal-400 bg-teal-400/20' : 'text-white/60 hover:text-white'
              }`}
            >
              <List className="h-4 w-4" />
            </button>

            {/* Expand */}
            <button
              onClick={toggleExpanded}
              className="p-2 rounded-lg text-white/60 hover:text-white transition-colors"
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
          </div>
        )}
      </div>

      {/* Expanded View */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/10 p-4"
          >
            <div className="flex items-center justify-center gap-8">
              <div className="flex items-center gap-2 text-white/60">
                <Waves className="h-4 w-4" />
                <span className="text-sm">Visualizer</span>
              </div>
              <div className="flex items-center gap-2 text-white/60">
                <BarChart3 className="h-4 w-4" />
                <span className="text-sm">Equalizer</span>
              </div>
              <div className="flex items-center gap-2 text-white/60">
                <Headphones className="h-4 w-4" />
                <span className="text-sm">Audio Effects</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Queue Manager */}
      {isMobile ? (
        <MobileDrawer
          isOpen={showQueue}
          onClose={toggleQueue}
          title="Queue"
          position="bottom"
        >
          <QueueManager
            queue={queue}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            onPlay={(track) => play(track)}
            onPause={pause}
            onRemove={removeFromQueue}
            onReorder={reorderQueue}
            onClear={clearQueue}
            onShuffle={shuffleQueue}
            onClose={toggleQueue}
            className="border-none bg-transparent"
          />
        </MobileDrawer>
      ) : (
        <AnimatePresence>
          {showQueue && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-full left-0 right-0 mb-2"
            >
              <QueueManager
                queue={queue}
                currentTrack={currentTrack}
                isPlaying={isPlaying}
                onPlay={(track) => play(track)}
                onPause={pause}
                onRemove={removeFromQueue}
                onReorder={reorderQueue}
                onClear={clearQueue}
                onShuffle={shuffleQueue}
                onClose={toggleQueue}
                className="max-w-4xl mx-auto"
              />
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
