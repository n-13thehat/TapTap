import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Volume2,
  VolumeX,
  Heart,
  MoreHorizontal,
  Cast,
  ListMusic,
  Maximize2,
} from 'lucide-react';
import { Track, DEFAULT_COVER } from '../types';
import { formatTime } from '../utils';

interface PlayerBarProps {
  current: Track | null;
  onToggle: () => void;
  playing: boolean;
}

export function PlayerBar({ current, onToggle, playing }: PlayerBarProps) {
  const progressRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [pct, setPct] = useState(0);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    setPct(0);
    setCurrentTime(0);
    setDuration(current?.duration || 0);
    if (!current?.audioUrl) return;

    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    const audio = audioRef.current;
    audio.src = current.audioUrl;
    audio.currentTime = 0;
    audio.muted = muted;

    const onLoaded = () => setDuration(audio.duration || current.duration || 0);
    const onTime = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration) setPct((audio.currentTime / audio.duration) * 100);
    };
    const onEnded = () => {
      setPct(0);
      setCurrentTime(0);
    };

    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnded);

    if (playing) {
      audio.play().catch(() => {});
    }

    return () => {
      audio.pause();
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnded);
    };
  }, [current?.id]);

  // Simulate progress for demo
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !current?.audioUrl) return;
    if (playing) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [playing, current?.audioUrl]);

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !duration) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newPct = (clickX / rect.width) * 100;
    const newTime = (newPct / 100) * duration;
    
    setPct(newPct);
    setCurrentTime(newTime);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/5 bg-slate-950/95 backdrop-blur-xl">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Track Info */}
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <motion.img
            src={current?.cover ?? DEFAULT_COVER}
            className="w-14 h-14 rounded-lg object-cover shadow-lg"
            alt="cover"
            whileHover={{ scale: 1.05 }}
          />
          <div className="min-w-0 flex-1">
            <div className="text-white font-medium truncate">
              {current?.title || "Select a track"}
            </div>
            <div className="text-white/60 text-sm truncate">
              {current?.artist || "No artist"}
            </div>
            {current && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs px-2 py-0.5 bg-teal-500/20 text-teal-300 rounded-full">
                  HiFi
                </span>
                <span className="text-xs text-white/40">
                  {current.album}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <Heart className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <MoreHorizontal className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* Center Controls */}
        <div className="flex flex-col items-center gap-3 flex-1 max-w-md">
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <Shuffle className="w-5 h-5" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <SkipBack className="w-5 h-5" />
            </motion.button>

            <motion.button
              onClick={onToggle}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-3 bg-white text-black rounded-full hover:bg-white/90 transition-colors shadow-lg"
            >
              {playing ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <SkipForward className="w-5 h-5" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <Repeat className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center gap-3 w-full">
            <span className="text-xs text-white/60 w-12 text-right">
              {formatTime(currentTime)}
            </span>
            <div
              ref={progressRef}
              className="relative h-1 flex-1 bg-white/20 rounded-full cursor-pointer group"
              onClick={handleProgressClick}
            >
              <motion.div
                style={{ width: `${pct}%` }}
                className="h-full bg-gradient-to-r from-teal-400 to-cyan-500 rounded-full relative"
                transition={{ duration: 0.1 }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" />
              </motion.div>
            </div>
            <span className="text-xs text-white/60 w-12">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3 min-w-0 flex-1 justify-end">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <ListMusic className="w-5 h-5" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <Cast className="w-5 h-5" />
          </motion.button>

          <div className="flex items-center gap-2">
            <motion.button
              onClick={() => setMuted(m => !m)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </motion.button>
            <div className="w-20 h-1 bg-white/20 rounded-full">
              <div className="w-3/4 h-full bg-gradient-to-r from-teal-400 to-cyan-500 rounded-full" />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <Maximize2 className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
