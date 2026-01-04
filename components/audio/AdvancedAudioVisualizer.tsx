"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { AdvancedVisualizer, VisualizationConfig, ColorScheme } from '@/lib/audio/visualizations/AdvancedVisualizer';
import { 
  BarChart3, 
  Activity, 
  Circle, 
  Box, 
  Sparkles, 
  Radio,
  Settings,
  Palette,
  Volume2,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';

interface AdvancedAudioVisualizerProps {
  audioElement?: HTMLAudioElement;
  className?: string;
  config?: Partial<VisualizationConfig>;
  onVisualizationData?: (data: any) => void;
}

const visualizationTypes = [
  { type: 'spectrum', name: 'Spectrum', icon: BarChart3, description: 'Frequency spectrum analyzer' },
  { type: 'waveform', name: 'Waveform', icon: Activity, description: 'Time domain waveform' },
  { type: 'circular', name: 'Circular', icon: Circle, description: 'Circular spectrum display' },
  { type: '3d', name: '3D Bars', icon: Box, description: '3D frequency visualization' },
  { type: 'particle', name: 'Particles', icon: Sparkles, description: 'Particle system visualization' },
  { type: 'oscilloscope', name: 'Oscilloscope', icon: Radio, description: 'Oscilloscope display' }
] as const;

const colorSchemes: Record<string, ColorScheme> = {
  teal: {
    primary: '#14b8a6',
    secondary: '#06b6d4',
    accent: '#f59e0b',
    background: '#0f172a',
    grid: '#334155',
    text: '#e2e8f0',
    gradient: ['#14b8a6', '#06b6d4', '#8b5cf6', '#f59e0b']
  },
  purple: {
    primary: '#8b5cf6',
    secondary: '#a855f7',
    accent: '#f59e0b',
    background: '#1e1b4b',
    grid: '#3730a3',
    text: '#e2e8f0',
    gradient: ['#8b5cf6', '#a855f7', '#ec4899', '#f59e0b']
  },
  green: {
    primary: '#10b981',
    secondary: '#34d399',
    accent: '#fbbf24',
    background: '#064e3b',
    grid: '#065f46',
    text: '#d1fae5',
    gradient: ['#10b981', '#34d399', '#60a5fa', '#fbbf24']
  },
  orange: {
    primary: '#f59e0b',
    secondary: '#fb923c',
    accent: '#8b5cf6',
    background: '#451a03',
    grid: '#92400e',
    text: '#fed7aa',
    gradient: ['#f59e0b', '#fb923c', '#ef4444', '#8b5cf6']
  },
  blue: {
    primary: '#3b82f6',
    secondary: '#60a5fa',
    accent: '#f59e0b',
    background: '#1e3a8a',
    grid: '#1d4ed8',
    text: '#dbeafe',
    gradient: ['#3b82f6', '#60a5fa', '#8b5cf6', '#f59e0b']
  }
};

export default function AdvancedAudioVisualizer({ 
  audioElement, 
  className = '', 
  config = {},
  onVisualizationData 
}: AdvancedAudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const visualizerRef = useRef<AdvancedVisualizer | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [currentType, setCurrentType] = useState<VisualizationConfig['type']>('spectrum');
  const [currentColorScheme, setCurrentColorScheme] = useState('teal');
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<Partial<VisualizationConfig>>({
    fftSize: 2048,
    smoothingTimeConstant: 0.8,
    minDecibels: -90,
    maxDecibels: -10,
    showPeaks: true,
    showGrid: true,
    showLabels: true,
    ...config
  });

  // Initialize visualizer
  useEffect(() => {
    if (!canvasRef.current || !audioElement) return;

    const canvas = canvasRef.current;
    const visualizerConfig: Partial<VisualizationConfig> = {
      type: currentType,
      colorScheme: colorSchemes[currentColorScheme],
      ...settings
    };

    try {
      visualizerRef.current = new AdvancedVisualizer(canvas, audioElement, visualizerConfig);
      
      // Start data collection interval
      const dataInterval = setInterval(() => {
        if (visualizerRef.current && onVisualizationData) {
          const data = visualizerRef.current.getVisualizationData();
          onVisualizationData(data);
        }
      }, 100);

      return () => {
        clearInterval(dataInterval);
        if (visualizerRef.current) {
          visualizerRef.current.destroy();
          visualizerRef.current = null;
        }
      };
    } catch (error) {
      console.error('Failed to initialize visualizer:', error);
    }
  }, [audioElement, currentType, currentColorScheme, settings, onVisualizationData]);

  // Handle play/pause
  const toggleVisualization = useCallback(() => {
    if (!visualizerRef.current) return;

    if (isActive) {
      visualizerRef.current.stop();
      setIsActive(false);
    } else {
      visualizerRef.current.start();
      setIsActive(true);
    }
  }, [isActive]);

  // Update visualization type
  const changeVisualizationType = useCallback((type: VisualizationConfig['type']) => {
    setCurrentType(type);
    if (visualizerRef.current) {
      visualizerRef.current.updateConfig({ type });
    }
  }, []);

  // Update color scheme
  const changeColorScheme = useCallback((scheme: string) => {
    setCurrentColorScheme(scheme);
    if (visualizerRef.current) {
      visualizerRef.current.updateConfig({ colorScheme: colorSchemes[scheme] });
    }
  }, []);

  // Update settings
  const updateSettings = useCallback((newSettings: Partial<VisualizationConfig>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    if (visualizerRef.current) {
      visualizerRef.current.updateConfig(newSettings);
    }
  }, []);

  // Reset to defaults
  const resetSettings = useCallback(() => {
    const defaultSettings = {
      fftSize: 2048,
      smoothingTimeConstant: 0.8,
      minDecibels: -90,
      maxDecibels: -10,
      showPeaks: true,
      showGrid: true,
      showLabels: true
    };
    updateSettings(defaultSettings);
  }, [updateSettings]);

  return (
    <div className={`relative bg-slate-900 rounded-lg overflow-hidden ${className}`}>
      {/* Header Controls */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleVisualization}
            className={`p-2 rounded-lg transition-colors ${
              isActive 
                ? 'bg-green-600 text-white' 
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
            title={isActive ? 'Stop visualization' : 'Start visualization'}
          >
            {isActive ? <Pause size={16} /> : <Play size={16} />}
          </button>
          
          <div className="flex items-center gap-1 bg-black/30 rounded-lg p-1">
            {visualizationTypes.map(({ type, name, icon: Icon }) => (
              <button
                key={type}
                onClick={() => changeVisualizationType(type)}
                className={`p-2 rounded transition-colors ${
                  currentType === type
                    ? 'bg-white/20 text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
                title={name}
              >
                <Icon size={16} />
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Color Scheme Selector */}
          <div className="flex items-center gap-1 bg-black/30 rounded-lg p-1">
            {Object.entries(colorSchemes).map(([key, scheme]) => (
              <button
                key={key}
                onClick={() => changeColorScheme(key)}
                className={`w-6 h-6 rounded border-2 transition-all ${
                  currentColorScheme === key
                    ? 'border-white scale-110'
                    : 'border-white/30 hover:border-white/60'
                }`}
                style={{ backgroundColor: scheme.primary }}
                title={`${key} theme`}
              />
            ))}
          </div>

          {/* Settings Toggle */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-lg transition-colors ${
              showSettings
                ? 'bg-white/20 text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
            title="Settings"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute top-16 right-4 z-20 bg-black/90 backdrop-blur-sm rounded-lg p-4 w-80 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-medium">Visualization Settings</h3>
            <button
              onClick={resetSettings}
              className="p-1 text-white/60 hover:text-white transition-colors"
              title="Reset to defaults"
            >
              <RotateCcw size={14} />
            </button>
          </div>

          <div className="space-y-4">
            {/* FFT Size */}
            <div>
              <label className="block text-white/80 text-sm mb-2">FFT Size</label>
              <select
                value={settings.fftSize}
                onChange={(e) => updateSettings({ fftSize: Number(e.target.value) })}
                className="w-full bg-white/10 text-white rounded px-3 py-2 text-sm"
              >
                <option value={512}>512</option>
                <option value={1024}>1024</option>
                <option value={2048}>2048</option>
                <option value={4096}>4096</option>
                <option value={8192}>8192</option>
              </select>
            </div>

            {/* Smoothing */}
            <div>
              <label className="block text-white/80 text-sm mb-2">
                Smoothing: {settings.smoothingTimeConstant?.toFixed(2)}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={settings.smoothingTimeConstant}
                onChange={(e) => updateSettings({ smoothingTimeConstant: Number(e.target.value) })}
                className="w-full"
              />
            </div>

            {/* Min Decibels */}
            <div>
              <label className="block text-white/80 text-sm mb-2">
                Min dB: {settings.minDecibels}
              </label>
              <input
                type="range"
                min="-100"
                max="-30"
                step="1"
                value={settings.minDecibels}
                onChange={(e) => updateSettings({ minDecibels: Number(e.target.value) })}
                className="w-full"
              />
            </div>

            {/* Max Decibels */}
            <div>
              <label className="block text-white/80 text-sm mb-2">
                Max dB: {settings.maxDecibels}
              </label>
              <input
                type="range"
                min="-30"
                max="0"
                step="1"
                value={settings.maxDecibels}
                onChange={(e) => updateSettings({ maxDecibels: Number(e.target.value) })}
                className="w-full"
              />
            </div>

            {/* Display Options */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-white/80 text-sm">
                <input
                  type="checkbox"
                  checked={settings.showPeaks}
                  onChange={(e) => updateSettings({ showPeaks: e.target.checked })}
                  className="rounded"
                />
                Show Peaks
              </label>
              
              <label className="flex items-center gap-2 text-white/80 text-sm">
                <input
                  type="checkbox"
                  checked={settings.showGrid}
                  onChange={(e) => updateSettings({ showGrid: e.target.checked })}
                  className="rounded"
                />
                Show Grid
              </label>
              
              <label className="flex items-center gap-2 text-white/80 text-sm">
                <input
                  type="checkbox"
                  checked={settings.showLabels}
                  onChange={(e) => updateSettings({ showLabels: e.target.checked })}
                  className="rounded"
                />
                Show Labels
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Visualization Type Info */}
      <div className="absolute bottom-4 left-4 z-10">
        <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2">
          <div className="text-white font-medium text-sm">
            {visualizationTypes.find(v => v.type === currentType)?.name}
          </div>
          <div className="text-white/60 text-xs">
            {visualizationTypes.find(v => v.type === currentType)?.description}
          </div>
        </div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ minHeight: '300px' }}
      />

      {/* No Audio Message */}
      {!audioElement && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white/60">
            <Volume2 size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No Audio Source</p>
            <p className="text-sm">Connect an audio element to see visualizations</p>
          </div>
        </div>
      )}
    </div>
  );
}


