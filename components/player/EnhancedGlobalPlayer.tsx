"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  useEnhancedPlayerStore, 
  useCurrentTrack, 
  usePlaybackState, 
  useQueue, 
  useAudioSettings, 
  usePlaybackModes,
  useUI 
} from '@/stores/enhancedPlayer';
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
  Settings,
  Mic2,
  Radio,
  Sparkles,
  Sliders,
  Users,
  MessageCircle,
  Cast,
  Download,
  PlusCircle,
  Music,
  Headphones,
  Zap,
  Brain,
  Eye,
  EyeOff
} from 'lucide-react';
import { AdvancedAudioVisualizer } from '@/components/audio/AdvancedAudioVisualizer';
import { AdvancedEffectsRack } from '@/components/audio/AdvancedEffectsRack';
import { AIAudioStudio } from '@/components/audio/AIAudioStudio';

interface EnhancedGlobalPlayerProps {
  className?: string;
}

export default function EnhancedGlobalPlayer({ className = '' }: EnhancedGlobalPlayerProps) {
  const currentTrack = useCurrentTrack();
  const playback = usePlaybackState();
  const queue = useQueue();
  const audioSettings = useAudioSettings();
  const playbackModes = usePlaybackModes();
  const ui = useUI();
  
  const {
    play,
    pause,
    skipNext,
    skipPrevious,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    setRepeat,
    toggleQueue,
    toggleLyrics,
    toggleVisualizer,
    toggleEffects,
    toggleAI,
    setPlayerSize,
    setPlayerLayout,
    audioElement,
    audioContext,
    effectsProcessor,
    aiProcessor,
    isInitialized
  } = useEnhancedPlayerStore();

  // Local state
  const [showSettings, setShowSettings] = useState(false);
  const [showSocial, setShowSocial] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  const playerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  // Initialize player
  useEffect(() => {
    if (!isInitialized) {
      useEnhancedPlayerStore.getState().initialize();
    }
  }, [isInitialized]);

  // Format time helper
  const formatTime = useCallback((seconds: number) => {
    if (!seconds || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Progress bar interaction
  const handleProgressClick = useCallback((e: React.MouseEvent) => {
    if (!progressRef.current || !playback.duration) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const time = percent * playback.duration;
    seek(time);
  }, [playback.duration, seek]);

  // Drag functionality for floating player
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (ui.layout !== 'floating') return;
    
    setIsDragging(true);
    const rect = playerRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  }, [ui.layout]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    setPosition({
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y
    });
  }, [isDragging, dragOffset]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          if (playback.status === 'playing') pause();
          else play();
          break;
        case 'ArrowRight':
          if (e.shiftKey) skipNext();
          else seek(playback.currentTime + 10);
          break;
        case 'ArrowLeft':
          if (e.shiftKey) skipPrevious();
          else seek(playback.currentTime - 10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(Math.min(1, audioSettings.volume + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(Math.max(0, audioSettings.volume - 0.1));
          break;
        case 'KeyM':
          toggleMute();
          break;
        case 'KeyS':
          toggleShuffle();
          break;
        case 'KeyR':
          const modes: Array<'none' | 'one' | 'all'> = ['none', 'one', 'all'];
          const currentIndex = modes.indexOf(playbackModes.repeat);
          const nextMode = modes[(currentIndex + 1) % modes.length];
          setRepeat(nextMode);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [playback, audioSettings, playbackModes, play, pause, skipNext, skipPrevious, seek, setVolume, toggleMute, toggleShuffle, setRepeat]);

  // Render different layouts
  const renderMiniPlayer = () => (
    <div className="flex items-center gap-3 bg-black/80 backdrop-blur-md rounded-full px-4 py-2 shadow-lg">
      {currentTrack?.cover_url && (
        <img 
          src={currentTrack.cover_url} 
          alt={currentTrack.title}
          className="w-8 h-8 rounded-full object-cover"
        />
      )}
      
      <button
        onClick={() => playback.status === 'playing' ? pause() : play()}
        className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
      >
        {playback.status === 'playing' ? <Pause size={14} /> : <Play size={14} />}
      </button>
      
      <div className="text-white text-sm font-medium max-w-32 truncate">
        {currentTrack?.title || 'No track'}
      </div>
      
      <button
        onClick={() => setPlayerSize('compact')}
        className="text-white/60 hover:text-white transition-colors"
      >
        <Maximize2 size={14} />
      </button>
    </div>
  );

  const renderCompactPlayer = () => (
    <div className="bg-black/90 backdrop-blur-md border-t border-white/10 p-4">
      <div className="flex items-center gap-4">
        {/* Track Info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {currentTrack?.cover_url && (
            <img 
              src={currentTrack.cover_url} 
              alt={currentTrack.title}
              className="w-12 h-12 rounded-lg object-cover"
            />
          )}
          <div className="min-w-0 flex-1">
            <div className="text-white font-medium truncate">
              {currentTrack?.title || 'No track selected'}
            </div>
            <div className="text-white/60 text-sm truncate">
              {currentTrack?.artist || ''}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleShuffle}
            className={`transition-colors ${
              playbackModes.shuffle ? 'text-green-400' : 'text-white/60 hover:text-white'
            }`}
          >
            <Shuffle size={16} />
          </button>
          
          <button
            onClick={skipPrevious}
            className="text-white/80 hover:text-white transition-colors"
          >
            <SkipBack size={18} />
          </button>
          
          <button
            onClick={() => playback.status === 'playing' ? pause() : play()}
            className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
          >
            {playback.status === 'playing' ? <Pause size={20} /> : <Play size={20} />}
          </button>
          
          <button
            onClick={skipNext}
            className="text-white/80 hover:text-white transition-colors"
          >
            <SkipForward size={18} />
          </button>
          
          <button
            onClick={() => {
              const modes: Array<'none' | 'one' | 'all'> = ['none', 'one', 'all'];
              const currentIndex = modes.indexOf(playbackModes.repeat);
              const nextMode = modes[(currentIndex + 1) % modes.length];
              setRepeat(nextMode);
            }}
            className={`transition-colors ${
              playbackModes.repeat !== 'none' ? 'text-green-400' : 'text-white/60 hover:text-white'
            }`}
          >
            {playbackModes.repeat === 'one' ? <RepeatOnce size={16} /> : <Repeat size={16} />}
          </button>
        </div>

        {/* Progress */}
        <div className="flex-1 max-w-md">
          <div className="flex items-center gap-2 text-xs text-white/60 mb-1">
            <span>{formatTime(playback.currentTime)}</span>
            <span>/</span>
            <span>{formatTime(playback.duration)}</span>
          </div>
          <div
            ref={progressRef}
            onClick={handleProgressClick}
            className="h-1 bg-white/20 rounded-full cursor-pointer group"
          >
            <div 
              className="h-full bg-green-400 rounded-full transition-all group-hover:bg-green-300"
              style={{ width: `${(playback.currentTime / playback.duration) * 100 || 0}%` }}
            />
          </div>
        </div>

        {/* Volume */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMute}
            className="text-white/60 hover:text-white transition-colors"
          >
            {audioSettings.muted || audioSettings.volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={audioSettings.muted ? 0 : audioSettings.volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-20 accent-green-400"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleQueue}
            className={`p-2 rounded-lg transition-colors ${
              ui.showQueue ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            <List size={16} />
          </button>
          
          <button
            onClick={toggleVisualizer}
            className={`p-2 rounded-lg transition-colors ${
              ui.showVisualizer ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            <Radio size={16} />
          </button>
          
          <button
            onClick={toggleEffects}
            className={`p-2 rounded-lg transition-colors ${
              ui.showEffects ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            <Sliders size={16} />
          </button>
          
          <button
            onClick={toggleAI}
            className={`p-2 rounded-lg transition-colors ${
              ui.showAI ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            <Brain size={16} />
          </button>
          
          <button
            onClick={() => setPlayerSize('full')}
            className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Maximize2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  const renderFullPlayer = () => (
    <div className="bg-gradient-to-br from-gray-900 via-black to-gray-900 min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Music className="text-green-400" />
            TapTap Player
          </h1>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPlayerSize('compact')}
              className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Minimize2 size={16} />
            </button>
            
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-lg transition-colors ${
                showSettings ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <Settings size={16} />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Track Info & Controls */}
          <div className="space-y-6">
            {/* Current Track */}
            <div className="bg-white/5 rounded-xl p-6">
              {currentTrack ? (
                <div className="space-y-4">
                  {currentTrack.cover_url && (
                    <img 
                      src={currentTrack.cover_url} 
                      alt={currentTrack.title}
                      className="w-full aspect-square rounded-lg object-cover"
                    />
                  )}
                  
                  <div>
                    <h2 className="text-xl font-bold text-white">{currentTrack.title}</h2>
                    <p className="text-white/60">{currentTrack.artist}</p>
                    {currentTrack.album && (
                      <p className="text-white/40 text-sm">{currentTrack.album}</p>
                    )}
                  </div>
                  
                  {/* Progress */}
                  <div className="space-y-2">
                    <div
                      ref={progressRef}
                      onClick={handleProgressClick}
                      className="h-2 bg-white/20 rounded-full cursor-pointer group"
                    >
                      <div 
                        className="h-full bg-green-400 rounded-full transition-all group-hover:bg-green-300"
                        style={{ width: `${(playback.currentTime / playback.duration) * 100 || 0}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-sm text-white/60">
                      <span>{formatTime(playback.currentTime)}</span>
                      <span>{formatTime(playback.duration)}</span>
                    </div>
                  </div>
                  
                  {/* Controls */}
                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={toggleShuffle}
                      className={`p-2 rounded-lg transition-colors ${
                        playbackModes.shuffle ? 'bg-green-600 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <Shuffle size={20} />
                    </button>
                    
                    <button
                      onClick={skipPrevious}
                      className="p-3 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <SkipBack size={24} />
                    </button>
                    
                    <button
                      onClick={() => playback.status === 'playing' ? pause() : play()}
                      className="w-14 h-14 bg-green-600 hover:bg-green-700 rounded-full flex items-center justify-center transition-colors"
                    >
                      {playback.status === 'playing' ? <Pause size={28} /> : <Play size={28} />}
                    </button>
                    
                    <button
                      onClick={skipNext}
                      className="p-3 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <SkipForward size={24} />
                    </button>
                    
                    <button
                      onClick={() => {
                        const modes: Array<'none' | 'one' | 'all'> = ['none', 'one', 'all'];
                        const currentIndex = modes.indexOf(playbackModes.repeat);
                        const nextMode = modes[(currentIndex + 1) % modes.length];
                        setRepeat(nextMode);
                      }}
                      className={`p-2 rounded-lg transition-colors ${
                        playbackModes.repeat !== 'none' ? 'bg-green-600 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {playbackModes.repeat === 'one' ? <RepeatOnce size={20} /> : <Repeat size={20} />}
                    </button>
                  </div>
                  
                  {/* Volume */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={toggleMute}
                      className="text-white/60 hover:text-white transition-colors"
                    >
                      {audioSettings.muted || audioSettings.volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={audioSettings.muted ? 0 : audioSettings.volume}
                      onChange={(e) => setVolume(Number(e.target.value))}
                      className="flex-1 accent-green-400"
                    />
                    <span className="text-white/60 text-sm w-8">
                      {Math.round((audioSettings.muted ? 0 : audioSettings.volume) * 100)}
                    </span>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center justify-center gap-2">
                    <button className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors">
                      <Heart size={18} />
                    </button>
                    <button className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors">
                      <Share2 size={18} />
                    </button>
                    <button className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors">
                      <Download size={18} />
                    </button>
                    <button className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors">
                      <PlusCircle size={18} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-white/60">
                  <Music size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No track selected</p>
                  <p className="text-sm">Choose a track to start playing</p>
                </div>
              )}
            </div>
            
            {/* Quick Actions */}
            <div className="bg-white/5 rounded-xl p-4">
              <h3 className="text-white font-medium mb-3">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={toggleQueue}
                  className={`p-3 rounded-lg transition-colors flex items-center gap-2 ${
                    ui.showQueue ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <List size={16} />
                  <span className="text-sm">Queue</span>
                </button>
                
                <button
                  onClick={toggleLyrics}
                  className={`p-3 rounded-lg transition-colors flex items-center gap-2 ${
                    ui.showLyrics ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Mic2 size={16} />
                  <span className="text-sm">Lyrics</span>
                </button>
                
                <button
                  onClick={toggleVisualizer}
                  className={`p-3 rounded-lg transition-colors flex items-center gap-2 ${
                    ui.showVisualizer ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Radio size={16} />
                  <span className="text-sm">Visualizer</span>
                </button>
                
                <button
                  onClick={() => setShowSocial(!showSocial)}
                  className={`p-3 rounded-lg transition-colors flex items-center gap-2 ${
                    showSocial ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Users size={16} />
                  <span className="text-sm">Social</span>
                </button>
              </div>
            </div>
          </div>

          {/* Center Column - Visualizer/Effects/AI */}
          <div className="space-y-6">
            {ui.showVisualizer && audioElement && (
              <div className="bg-white/5 rounded-xl overflow-hidden">
                <AdvancedAudioVisualizer
                  audioElement={audioElement}
                  className="h-64"
                />
              </div>
            )}
            
            {ui.showEffects && audioContext && (
              <div className="bg-white/5 rounded-xl p-4">
                <AdvancedEffectsRack
                  audioContext={audioContext}
                  onEffectsChange={(effects) => {
                    // Handle effects change
                  }}
                />
              </div>
            )}
            
            {ui.showAI && audioContext && (
              <div className="bg-white/5 rounded-xl p-4">
                <AIAudioStudio
                  audioContext={audioContext}
                  audioBuffer={undefined} // Would need to get current track buffer
                  onProcessedAudio={(buffer, type) => {
                    console.log('Processed audio:', type, buffer);
                  }}
                />
              </div>
            )}
          </div>

          {/* Right Column - Queue/Social */}
          <div className="space-y-6">
            {ui.showQueue && (
              <div className="bg-white/5 rounded-xl p-4">
                <h3 className="text-white font-medium mb-3">Queue ({queue.tracks.length})</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {queue.tracks.map((track, index) => (
                    <div
                      key={track.id}
                      className={`p-3 rounded-lg transition-colors cursor-pointer ${
                        index === queue.currentIndex
                          ? 'bg-green-600/20 border border-green-600/30'
                          : 'hover:bg-white/10'
                      }`}
                      onClick={() => useEnhancedPlayerStore.getState().skipToTrack(index)}
                    >
                      <div className="flex items-center gap-3">
                        {track.cover_url && (
                          <img 
                            src={track.cover_url} 
                            alt={track.title}
                            className="w-10 h-10 rounded object-cover"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-white text-sm font-medium truncate">
                            {track.title}
                          </div>
                          <div className="text-white/60 text-xs truncate">
                            {track.artist}
                          </div>
                        </div>
                        <div className="text-white/40 text-xs">
                          {formatTime(track.duration)}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {queue.tracks.length === 0 && (
                    <div className="text-center py-8 text-white/60">
                      <List size={32} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Queue is empty</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {showSocial && (
              <div className="bg-white/5 rounded-xl p-4">
                <h3 className="text-white font-medium mb-3">Social</h3>
                <div className="space-y-3">
                  <button className="w-full p-3 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition-colors flex items-center gap-2">
                    <Cast size={16} />
                    Start Broadcasting
                  </button>
                  
                  <button className="w-full p-3 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition-colors flex items-center gap-2">
                    <MessageCircle size={16} />
                    Live Chat
                  </button>
                  
                  <button className="w-full p-3 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition-colors flex items-center gap-2">
                    <Users size={16} />
                    Collaborative Queue
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderTheaterPlayer = () => (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 bg-gradient-to-b from-black/80 to-transparent">
        <h1 className="text-xl font-bold text-white">Theater Mode</h1>
        <button
          onClick={() => setPlayerSize('full')}
          className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
        >
          <Minimize2 size={20} />
        </button>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        {ui.showVisualizer && audioElement ? (
          <AdvancedAudioVisualizer
            audioElement={audioElement}
            className="w-full h-full"
          />
        ) : (
          <div className="text-center">
            {currentTrack?.cover_url ? (
              <img 
                src={currentTrack.cover_url} 
                alt={currentTrack.title}
                className="w-96 h-96 rounded-2xl object-cover mx-auto mb-8 shadow-2xl"
              />
            ) : (
              <div className="w-96 h-96 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-8">
                <Music size={96} className="text-white/30" />
              </div>
            )}
            
            {currentTrack && (
              <div className="space-y-2">
                <h2 className="text-4xl font-bold text-white">{currentTrack.title}</h2>
                <p className="text-2xl text-white/60">{currentTrack.artist}</p>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Controls */}
      <div className="p-6 bg-gradient-to-t from-black/80 to-transparent">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Progress */}
          <div className="space-y-2">
            <div
              ref={progressRef}
              onClick={handleProgressClick}
              className="h-2 bg-white/20 rounded-full cursor-pointer group"
            >
              <div 
                className="h-full bg-white rounded-full transition-all group-hover:bg-white/80"
                style={{ width: `${(playback.currentTime / playback.duration) * 100 || 0}%` }}
              />
            </div>
            <div className="flex justify-between text-white/60">
              <span>{formatTime(playback.currentTime)}</span>
              <span>{formatTime(playback.duration)}</span>
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex items-center justify-center gap-6">
            <button
              onClick={toggleShuffle}
              className={`p-3 rounded-lg transition-colors ${
                playbackModes.shuffle ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <Shuffle size={24} />
            </button>
            
            <button
              onClick={skipPrevious}
              className="p-4 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <SkipBack size={32} />
            </button>
            
            <button
              onClick={() => playback.status === 'playing' ? pause() : play()}
              className="w-16 h-16 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
            >
              {playback.status === 'playing' ? <Pause size={36} /> : <Play size={36} />}
            </button>
            
            <button
              onClick={skipNext}
              className="p-4 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <SkipForward size={32} />
            </button>
            
            <button
              onClick={() => {
                const modes: Array<'none' | 'one' | 'all'> = ['none', 'one', 'all'];
                const currentIndex = modes.indexOf(playbackModes.repeat);
                const nextMode = modes[(currentIndex + 1) % modes.length];
                setRepeat(nextMode);
              }}
              className={`p-3 rounded-lg transition-colors ${
                playbackModes.repeat !== 'none' ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              {playbackModes.repeat === 'one' ? <RepeatOnce size={24} /> : <Repeat size={24} />}
            </button>
          </div>
          
          {/* Volume & Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleMute}
                className="text-white/60 hover:text-white transition-colors"
              >
                {audioSettings.muted || audioSettings.volume === 0 ? <VolumeX size={24} /> : <Volume2 size={24} />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={audioSettings.muted ? 0 : audioSettings.volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-32 accent-white"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={toggleVisualizer}
                className={`p-2 rounded-lg transition-colors ${
                  ui.showVisualizer ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                {ui.showVisualizer ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Don't render if not initialized
  if (!isInitialized) {
    return null;
  }

  // Render based on player size
  const playerContent = () => {
    switch (ui.playerSize) {
      case 'mini':
        return renderMiniPlayer();
      case 'compact':
        return renderCompactPlayer();
      case 'full':
        return renderFullPlayer();
      case 'theater':
        return renderTheaterPlayer();
      default:
        return renderCompactPlayer();
    }
  };

  // Apply layout styles
  const getLayoutStyles = () => {
    switch (ui.layout) {
      case 'floating':
        return {
          position: 'fixed' as const,
          top: position.y || 20,
          right: position.x || 20,
          zIndex: 1000,
          cursor: isDragging ? 'grabbing' : 'grab',
        };
      case 'sidebar':
        return {
          position: 'fixed' as const,
          right: 0,
          top: 0,
          bottom: 0,
          width: '400px',
          zIndex: 50,
        };
      case 'overlay':
        return {
          position: 'fixed' as const,
          inset: 0,
          zIndex: 50,
        };
      case 'bottom':
      default:
        return {
          position: 'fixed' as const,
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 50,
        };
    }
  };

  return (
    <div
      ref={playerRef}
      className={`${className} ${ui.playerSize === 'theater' ? '' : 'shadow-2xl'}`}
      style={ui.playerSize !== 'theater' ? getLayoutStyles() : undefined}
      onMouseDown={handleMouseDown}
    >
      {playerContent()}
    </div>
  );
}
