"use client";

import { useState, useRef } from 'react';
import { useAudioProcessing, useAIAudioProcessing, useSpatialAudio, useAudioAnalysis } from '@/hooks/useAudioProcessing';
import AudioTrackList from './AudioTrackList';
import EffectsRack from './EffectsRack';
import SpatialAudioControls from './SpatialAudioControls';
import AIProcessingPanel from './AIProcessingPanel';
import AudioAnalysisPanel from './AudioAnalysisPanel';
import {
  Activity,
  Sliders,
  Headphones,
  Brain,
  BarChart3,
  Settings,
  Upload,
  Play,
  Pause,
  Volume2,
  Cpu,
  Zap
} from 'lucide-react';

export default function AudioProcessingInterface() {
  const [selectedView, setSelectedView] = useState<'tracks' | 'effects' | 'spatial' | 'ai' | 'analysis' | 'settings'>('tracks');
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { 
    isInitialized, 
    tracks, 
    effects,
    metrics,
    loadTrack 
  } = useAudioProcessing();

  const { 
    isProcessing, 
    processingProgress, 
    processingType 
  } = useAIAudioProcessing();

  const { spatialProcessors } = useSpatialAudio();
  const { analysisSessions } = useAudioAnalysis();

  const currentTrack = selectedTrack ? tracks.find(t => t.id === selectedTrack) : null;

  const getViewIcon = (view: string) => {
    switch (view) {
      case 'tracks': return <Activity size={16} />;
      case 'effects': return <Sliders size={16} />;
      case 'spatial': return <Headphones size={16} />;
      case 'ai': return <Brain size={16} />;
      case 'analysis': return <BarChart3 size={16} />;
      case 'settings': return <Settings size={16} />;
      default: return <Activity size={16} />;
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const trackId = await loadTrack(file);
      if (trackId) {
        setSelectedTrack(trackId);
      }
    } catch (error) {
      console.error('Failed to upload file:', error);
    }
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Activity size={48} className="mx-auto mb-4 text-blue-400 animate-pulse" />
          <p className="text-white/60">Loading Audio Processing Engine...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity size={32} className="text-blue-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">Advanced Audio Processing</h1>
            <p className="text-white/60">
              Professional audio processing with AI enhancement and spatial audio
            </p>
          </div>
        </div>
        
        <div className="flex gap-3">
          {metrics && (
            <div className="flex items-center gap-2 bg-green-600/20 border border-green-600/30 px-4 py-2 rounded-lg">
              <Cpu size={16} className="text-green-400" />
              <div className="text-sm">
                <div className="text-white font-medium">{Math.round(metrics.cpu_usage * 100)}%</div>
                <div className="text-white/60">CPU Usage</div>
              </div>
            </div>
          )}
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
          >
            <Upload size={16} />
            Load Audio
          </button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* Transport Controls */}
      {currentTrack && (
        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handlePlayPause}
                className="w-12 h-12 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center transition-colors"
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </button>
              
              <div>
                <h3 className="font-medium text-white">{currentTrack.name}</h3>
                <p className="text-sm text-white/60">
                  {currentTrack.duration.toFixed(2)}s • {currentTrack.sample_rate}Hz • {currentTrack.channels}ch
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Volume2 size={16} className="text-white/60" />
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  defaultValue="75"
                  className="w-24"
                />
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Activity size={16} className="text-green-400" />
                <span className="text-white/80">
                  Peak: {currentTrack.peak_level.toFixed(1)}dB
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Processing Status */}
      {isProcessing && (
        <div className="bg-orange-600/20 border border-orange-600/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-orange-400 animate-pulse" />
              <span className="font-medium text-white">
                AI Processing: {processingType}
              </span>
            </div>
            <span className="text-orange-400 font-medium">
              {Math.round(processingProgress)}%
            </span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div 
              className="bg-orange-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${processingProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4 text-center">
          <Activity size={24} className="mx-auto mb-2 text-blue-400" />
          <div className="text-2xl font-bold text-blue-400">{tracks.length}</div>
          <div className="text-sm text-white/60">Audio Tracks</div>
        </div>

        <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 text-center">
          <Sliders size={24} className="mx-auto mb-2 text-green-400" />
          <div className="text-2xl font-bold text-green-400">{effects.length}</div>
          <div className="text-sm text-white/60">Active Effects</div>
        </div>

        <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-4 text-center">
          <Headphones size={24} className="mx-auto mb-2 text-purple-400" />
          <div className="text-2xl font-bold text-purple-400">{spatialProcessors.length}</div>
          <div className="text-sm text-white/60">Spatial Processors</div>
        </div>

        <div className="bg-orange-500/20 border border-orange-500/30 rounded-lg p-4 text-center">
          <Brain size={24} className="mx-auto mb-2 text-orange-400" />
          <div className="text-2xl font-bold text-orange-400">4</div>
          <div className="text-sm text-white/60">AI Processors</div>
        </div>

        <div className="bg-pink-500/20 border border-pink-500/30 rounded-lg p-4 text-center">
          <BarChart3 size={24} className="mx-auto mb-2 text-pink-400" />
          <div className="text-2xl font-bold text-pink-400">{analysisSessions.length}</div>
          <div className="text-sm text-white/60">Analysis Sessions</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {[
          { id: 'tracks', name: 'Audio Tracks', count: tracks.length },
          { id: 'effects', name: 'Effects Rack', count: effects.length },
          { id: 'spatial', name: 'Spatial Audio', count: spatialProcessors.length },
          { id: 'ai', name: 'AI Processing', count: 4 },
          { id: 'analysis', name: 'Audio Analysis', count: analysisSessions.length },
          { id: 'settings', name: 'Engine Settings', count: 0 },
        ].map((view) => (
          <button
            key={view.id}
            onClick={() => setSelectedView(view.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              selectedView === view.id
                ? 'bg-blue-600 text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            {getViewIcon(view.id)}
            <span>{view.name}</span>
            {view.count > 0 && (
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                {view.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="space-y-6">
        {selectedView === 'tracks' && (
          <AudioTrackList 
            tracks={tracks}
            onTrackSelect={(track) => setSelectedTrack(track.id)}
          />
        )}

        {selectedView === 'effects' && (
          <EffectsRack />
        )}

        {selectedView === 'spatial' && (
          <SpatialAudioControls />
        )}

        {selectedView === 'ai' && (
          <AIProcessingPanel />
        )}

        {selectedView === 'analysis' && (
          <AudioAnalysisPanel />
        )}

        {selectedView === 'settings' && (
          <div className="bg-white/5 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Audio Engine Settings</h3>
            
            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-white mb-3">Audio Configuration</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-white/80 mb-2">Sample Rate</label>
                    <select className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white">
                      <option value="44100">44.1 kHz</option>
                      <option value="48000" selected>48 kHz</option>
                      <option value="96000">96 kHz</option>
                      <option value="192000">192 kHz</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-white/80 mb-2">Buffer Size</label>
                    <select className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white">
                      <option value="128">128 samples</option>
                      <option value="256">256 samples</option>
                      <option value="512" selected>512 samples</option>
                      <option value="1024">1024 samples</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-white mb-3">Processing Options</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white/80">Real-time Processing</span>
                    <button className="w-12 h-6 bg-green-600 rounded-full relative">
                      <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5" />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-white/80">AI Enhancement</span>
                    <button className="w-12 h-6 bg-blue-600 rounded-full relative">
                      <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5" />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-white/80">GPU Acceleration</span>
                    <button className="w-12 h-6 bg-white/20 rounded-full relative">
                      <div className="w-5 h-5 bg-white rounded-full absolute left-0.5 top-0.5" />
                    </button>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-white mb-3">Performance Metrics</h4>
                {metrics && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="text-sm text-white/60">CPU Usage</div>
                      <div className="text-lg font-semibold text-green-400">
                        {Math.round(metrics.cpu_usage * 100)}%
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="text-sm text-white/60">Memory Usage</div>
                      <div className="text-lg font-semibold text-blue-400">
                        {Math.round(metrics.memory_usage / 1024 / 1024)}MB
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="text-sm text-white/60">Total Latency</div>
                      <div className="text-lg font-semibold text-purple-400">
                        {metrics.total_latency.toFixed(1)}ms
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="text-sm text-white/60">Real-time Factor</div>
                      <div className="text-lg font-semibold text-orange-400">
                        {metrics.real_time_factor.toFixed(2)}x
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Processing Status Indicator */}
      {metrics && (
        <div className="fixed bottom-6 right-6">
          <div className="bg-blue-600/20 border border-blue-600/30 rounded-lg p-3 flex items-center gap-2">
            <Activity size={16} className="text-blue-400" />
            <div className="text-sm">
              <div className="text-blue-400 font-medium">Engine Active</div>
              <div className="text-white/60">
                {Math.round(metrics.cpu_usage * 100)}% CPU • {metrics.total_latency.toFixed(1)}ms
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
