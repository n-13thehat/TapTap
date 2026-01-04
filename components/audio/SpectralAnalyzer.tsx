"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  BarChart3,
  LineChart,
  Activity,
  Zap,
  Settings,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  RotateCcw,
  Play,
  Pause,
  Volume2,
  Cpu,
  Clock,
  Target,
  Layers,
  Grid,
  Filter,
  TrendingUp,
  TrendingDown,
  Info,
  AlertTriangle,
  CheckCircle,
  Download,
  Upload,
  Share2,
  Camera,
  Video,
  Mic,
  Speaker
} from 'lucide-react';

interface SpectralAnalyzerProps {
  audioContext: AudioContext;
  sourceNode?: AudioNode;
  className?: string;
  onAnalysisUpdate?: (analysis: SpectralAnalysis) => void;
}

interface SpectralAnalysis {
  frequencyData: Uint8Array;
  timeData: Uint8Array;
  spectralCentroid: number;
  spectralRolloff: number;
  spectralFlux: number;
  zeroCrossingRate: number;
  rms: number;
  peak: number;
  dynamicRange: number;
  fundamentalFreq: number;
  harmonics: number[];
  noiseLevel: number;
  tonalBalance: {
    bass: number;
    midrange: number;
    treble: number;
  };
  stereoInfo?: {
    correlation: number;
    width: number;
    balance: number;
  };
}

interface AnalyzerSettings {
  fftSize: number;
  smoothingTimeConstant: number;
  minDecibels: number;
  maxDecibels: number;
  updateRate: number;
  showPhase: boolean;
  showHarmonics: boolean;
  showSpectrogram: boolean;
  logScale: boolean;
  peakHold: boolean;
  averaging: 'none' | 'exponential' | 'linear';
  windowFunction: 'hann' | 'hamming' | 'blackman' | 'rectangular';
}

type AnalyzerMode = 'spectrum' | 'waveform' | 'spectrogram' | 'phase' | 'correlation';
type ViewMode = 'single' | 'dual' | 'quad';

export default function SpectralAnalyzer({ 
  audioContext, 
  sourceNode, 
  className = '', 
  onAnalysisUpdate 
}: SpectralAnalyzerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spectrogramCanvasRef = useRef<HTMLCanvasElement>(null);
  const phaseCanvasRef = useRef<HTMLCanvasElement>(null);
  const correlationCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const [analyzerNode, setAnalyzerNode] = useState<AnalyserNode | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<AnalyzerMode>('spectrum');
  const [viewMode, setViewMode] = useState<ViewMode>('single');
  const [settings, setSettings] = useState<AnalyzerSettings>({
    fftSize: 2048,
    smoothingTimeConstant: 0.8,
    minDecibels: -90,
    maxDecibels: -10,
    updateRate: 60,
    showPhase: false,
    showHarmonics: true,
    showSpectrogram: true,
    logScale: true,
    peakHold: true,
    averaging: 'exponential',
    windowFunction: 'hann'
  });
  
  const [currentAnalysis, setCurrentAnalysis] = useState<SpectralAnalysis | null>(null);
  const [peakData, setPeakData] = useState<number[]>([]);
  const [spectrogramData, setSpectrogramData] = useState<number[][]>([]);
  const [showSettings, setShowSettings] = useState(false);
  
  // Animation frame reference
  const animationFrameRef = useRef<number>();
  const lastUpdateTime = useRef<number>(0);
  
  // Analysis buffers
  const frequencyBuffer = useRef<Uint8Array>();
  const timeBuffer = useRef<Uint8Array>();
  const previousFrequencyData = useRef<Uint8Array>();

  // Initialize analyzer
  useEffect(() => {
    if (!audioContext) return;

    const analyzer = audioContext.createAnalyser();
    analyzer.fftSize = settings.fftSize;
    analyzer.smoothingTimeConstant = settings.smoothingTimeConstant;
    analyzer.minDecibels = settings.minDecibels;
    analyzer.maxDecibels = settings.maxDecibels;

    // Initialize buffers
    frequencyBuffer.current = new Uint8Array(analyzer.frequencyBinCount);
    timeBuffer.current = new Uint8Array(analyzer.fftSize);
    previousFrequencyData.current = new Uint8Array(analyzer.frequencyBinCount);
    
    // Initialize peak data
    setPeakData(new Array(analyzer.frequencyBinCount).fill(0));
    
    setAnalyzerNode(analyzer);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [audioContext, settings.fftSize, settings.smoothingTimeConstant, settings.minDecibels, settings.maxDecibels]);

  // Connect source node
  useEffect(() => {
    if (!analyzerNode || !sourceNode) return;

    sourceNode.connect(analyzerNode);

    return () => {
      try {
        sourceNode.disconnect(analyzerNode);
      } catch (e) {
        // Ignore disconnect errors
      }
    };
  }, [analyzerNode, sourceNode]);

  // Start/stop analysis
  const toggleAnalysis = useCallback(() => {
    setIsActive(!isActive);
  }, [isActive]);

  // Analysis loop
  useEffect(() => {
    if (!isActive || !analyzerNode || !frequencyBuffer.current || !timeBuffer.current) {
      return;
    }

    const analyze = (timestamp: number) => {
      // Throttle updates based on update rate
      if (timestamp - lastUpdateTime.current < 1000 / settings.updateRate) {
        animationFrameRef.current = requestAnimationFrame(analyze);
        return;
      }
      lastUpdateTime.current = timestamp;

      // Get frequency and time domain data
      analyzerNode.getByteFrequencyData(frequencyBuffer.current!);
      analyzerNode.getByteTimeDomainData(timeBuffer.current!);

      // Perform analysis
      const analysis = performSpectralAnalysis(
        frequencyBuffer.current!,
        timeBuffer.current!,
        audioContext.sampleRate,
        analyzerNode.frequencyBinCount
      );

      setCurrentAnalysis(analysis);

      // Update peak hold data
      if (settings.peakHold) {
        setPeakData(prev => 
          prev.map((peak, i) => Math.max(peak * 0.95, frequencyBuffer.current![i]))
        );
      }

      // Update spectrogram data
      if (settings.showSpectrogram) {
        setSpectrogramData(prev => {
          const newData = [...prev, Array.from(frequencyBuffer.current!)];
          return newData.slice(-200); // Keep last 200 frames
        });
      }

      // Store previous data for flux calculation
      previousFrequencyData.current!.set(frequencyBuffer.current!);

      // Trigger callback
      if (onAnalysisUpdate) {
        onAnalysisUpdate(analysis);
      }

      // Draw visualizations
      drawVisualization();

      animationFrameRef.current = requestAnimationFrame(analyze);
    };

    animationFrameRef.current = requestAnimationFrame(analyze);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive, analyzerNode, settings, onAnalysisUpdate]);

  // Perform spectral analysis
  const performSpectralAnalysis = useCallback((
    frequencyData: Uint8Array,
    timeData: Uint8Array,
    sampleRate: number,
    binCount: number
  ): SpectralAnalysis => {
    // Convert to linear scale for calculations
    const linearFreqData = new Float32Array(frequencyData.length);
    for (let i = 0; i < frequencyData.length; i++) {
      linearFreqData[i] = Math.pow(10, (frequencyData[i] - 255) / 255 * 4); // -80dB to 0dB range
    }

    // Calculate spectral centroid
    let weightedSum = 0;
    let magnitudeSum = 0;
    for (let i = 0; i < linearFreqData.length; i++) {
      const frequency = (i * sampleRate) / (2 * binCount);
      weightedSum += frequency * linearFreqData[i];
      magnitudeSum += linearFreqData[i];
    }
    const spectralCentroid = magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;

    // Calculate spectral rolloff (85% of energy)
    const totalEnergy = linearFreqData.reduce((sum, val) => sum + val * val, 0);
    const rolloffThreshold = totalEnergy * 0.85;
    let cumulativeEnergy = 0;
    let spectralRolloff = 0;
    for (let i = 0; i < linearFreqData.length; i++) {
      cumulativeEnergy += linearFreqData[i] * linearFreqData[i];
      if (cumulativeEnergy >= rolloffThreshold) {
        spectralRolloff = (i * sampleRate) / (2 * binCount);
        break;
      }
    }

    // Calculate spectral flux
    let spectralFlux = 0;
    if (previousFrequencyData.current) {
      for (let i = 0; i < linearFreqData.length; i++) {
        const diff = linearFreqData[i] - (previousFrequencyData.current[i] / 255);
        spectralFlux += Math.max(0, diff);
      }
      spectralFlux /= linearFreqData.length;
    }

    // Calculate zero crossing rate
    let zeroCrossings = 0;
    for (let i = 1; i < timeData.length; i++) {
      if ((timeData[i] >= 128) !== (timeData[i - 1] >= 128)) {
        zeroCrossings++;
      }
    }
    const zeroCrossingRate = zeroCrossings / timeData.length;

    // Calculate RMS and peak
    let sumSquares = 0;
    let peak = 0;
    for (let i = 0; i < timeData.length; i++) {
      const sample = (timeData[i] - 128) / 128;
      sumSquares += sample * sample;
      peak = Math.max(peak, Math.abs(sample));
    }
    const rms = Math.sqrt(sumSquares / timeData.length);

    // Calculate dynamic range
    const dynamicRange = peak > 0 && rms > 0 ? 20 * Math.log10(peak / rms) : 0;

    // Find fundamental frequency (simplified)
    let maxMagnitude = 0;
    let fundamentalBin = 0;
    for (let i = 1; i < linearFreqData.length / 4; i++) { // Look in lower frequencies
      if (linearFreqData[i] > maxMagnitude) {
        maxMagnitude = linearFreqData[i];
        fundamentalBin = i;
      }
    }
    const fundamentalFreq = (fundamentalBin * sampleRate) / (2 * binCount);

    // Find harmonics
    const harmonics: number[] = [];
    if (fundamentalFreq > 0) {
      for (let h = 2; h <= 8; h++) {
        const harmonicFreq = fundamentalFreq * h;
        const harmonicBin = Math.round((harmonicFreq * 2 * binCount) / sampleRate);
        if (harmonicBin < linearFreqData.length) {
          harmonics.push(linearFreqData[harmonicBin]);
        }
      }
    }

    // Estimate noise level (lowest 10% of spectrum)
    const sortedMagnitudes = Array.from(linearFreqData).sort((a, b) => a - b);
    const noiseLevel = sortedMagnitudes[Math.floor(sortedMagnitudes.length * 0.1)];

    // Calculate tonal balance
    const bassEnd = Math.floor((250 * 2 * binCount) / sampleRate);
    const midEnd = Math.floor((4000 * 2 * binCount) / sampleRate);
    
    const bassEnergy = linearFreqData.slice(0, bassEnd).reduce((sum, val) => sum + val, 0);
    const midEnergy = linearFreqData.slice(bassEnd, midEnd).reduce((sum, val) => sum + val, 0);
    const trebleEnergy = linearFreqData.slice(midEnd).reduce((sum, val) => sum + val, 0);
    
    const totalEnergy2 = bassEnergy + midEnergy + trebleEnergy;
    const tonalBalance = {
      bass: totalEnergy2 > 0 ? bassEnergy / totalEnergy2 : 0,
      midrange: totalEnergy2 > 0 ? midEnergy / totalEnergy2 : 0,
      treble: totalEnergy2 > 0 ? trebleEnergy / totalEnergy2 : 0,
    };

    return {
      frequencyData,
      timeData,
      spectralCentroid,
      spectralRolloff,
      spectralFlux,
      zeroCrossingRate,
      rms,
      peak,
      dynamicRange,
      fundamentalFreq,
      harmonics,
      noiseLevel,
      tonalBalance,
    };
  }, []);

  // Draw visualization
  const drawVisualization = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !frequencyBuffer.current || !timeBuffer.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, width, height);

    switch (mode) {
      case 'spectrum':
        drawSpectrum(ctx, width, height);
        break;
      case 'waveform':
        drawWaveform(ctx, width, height);
        break;
      case 'spectrogram':
        drawSpectrogram();
        break;
      case 'phase':
        drawPhase();
        break;
      case 'correlation':
        drawCorrelation();
        break;
    }
  }, [mode, settings]);

  const drawSpectrum = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (!frequencyBuffer.current) return;

    const binCount = frequencyBuffer.current.length;
    const barWidth = width / binCount;

    // Draw frequency bars
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 1;
    ctx.beginPath();

    for (let i = 0; i < binCount; i++) {
      const magnitude = frequencyBuffer.current[i];
      const barHeight = (magnitude / 255) * height;
      
      const x = settings.logScale 
        ? (Math.log(i + 1) / Math.log(binCount)) * width
        : (i / binCount) * width;
      
      if (i === 0) {
        ctx.moveTo(x, height - barHeight);
      } else {
        ctx.lineTo(x, height - barHeight);
      }
    }
    ctx.stroke();

    // Draw peak hold
    if (settings.peakHold && peakData.length > 0) {
      ctx.strokeStyle = '#ff4444';
      ctx.lineWidth = 1;
      ctx.beginPath();

      for (let i = 0; i < binCount; i++) {
        const magnitude = peakData[i];
        const barHeight = (magnitude / 255) * height;
        
        const x = settings.logScale 
          ? (Math.log(i + 1) / Math.log(binCount)) * width
          : (i / binCount) * width;
        
        if (i === 0) {
          ctx.moveTo(x, height - barHeight);
        } else {
          ctx.lineTo(x, height - barHeight);
        }
      }
      ctx.stroke();
    }

    // Draw harmonics
    if (settings.showHarmonics && currentAnalysis?.fundamentalFreq) {
      ctx.strokeStyle = '#ffaa00';
      ctx.lineWidth = 2;
      
      const fundamental = currentAnalysis.fundamentalFreq;
      for (let h = 1; h <= 8; h++) {
        const harmonicFreq = fundamental * h;
        const maxFreq = audioContext.sampleRate / 2;
        if (harmonicFreq > maxFreq) break;
        
        const x = settings.logScale
          ? (Math.log(harmonicFreq / 20) / Math.log(maxFreq / 20)) * width
          : (harmonicFreq / maxFreq) * width;
        
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
    }

    // Draw frequency labels
    ctx.fillStyle = '#ffffff80';
    ctx.font = '10px monospace';
    const frequencies = [100, 1000, 10000];
    frequencies.forEach(freq => {
      const maxFreq = audioContext.sampleRate / 2;
      const x = settings.logScale
        ? (Math.log(freq / 20) / Math.log(maxFreq / 20)) * width
        : (freq / maxFreq) * width;
      
      ctx.fillText(`${freq}Hz`, x, height - 5);
    });
  }, [settings, peakData, currentAnalysis, audioContext]);

  const drawWaveform = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (!timeBuffer.current) return;

    const bufferLength = timeBuffer.current.length;
    const sliceWidth = width / bufferLength;

    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2;
    ctx.beginPath();

    for (let i = 0; i < bufferLength; i++) {
      const v = (timeBuffer.current[i] - 128) / 128;
      const y = (v * height) / 2 + height / 2;
      const x = i * sliceWidth;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();

    // Draw zero line
    ctx.strokeStyle = '#ffffff40';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
  }, []);

  const drawSpectrogram = useCallback(() => {
    const canvas = spectrogramCanvasRef.current;
    if (!canvas || spectrogramData.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const binCount = spectrogramData[0]?.length || 0;

    // Clear canvas
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);

    // Draw spectrogram
    const timeSliceWidth = width / spectrogramData.length;
    const freqBinHeight = height / binCount;

    spectrogramData.forEach((frame, timeIndex) => {
      frame.forEach((magnitude, freqIndex) => {
        const intensity = magnitude / 255;
        const hue = (1 - intensity) * 240; // Blue to red
        const saturation = 100;
        const lightness = intensity * 50;
        
        ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        ctx.fillRect(
          timeIndex * timeSliceWidth,
          height - (freqIndex + 1) * freqBinHeight,
          timeSliceWidth,
          freqBinHeight
        );
      });
    });
  }, [spectrogramData]);

  const drawPhase = useCallback(() => {
    const canvas = phaseCanvasRef.current;
    if (!canvas || !timeBuffer.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);

    // Draw phase scope (Lissajous pattern for stereo)
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 1;
    ctx.beginPath();

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 3;

    for (let i = 0; i < timeBuffer.current.length; i += 2) {
      const left = (timeBuffer.current[i] - 128) / 128;
      const right = (timeBuffer.current[i + 1] - 128) / 128;
      
      const x = centerX + left * radius;
      const y = centerY + right * radius;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();

    // Draw reference lines
    ctx.strokeStyle = '#ffffff20';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, height);
    ctx.stroke();
  }, []);

  const drawCorrelation = useCallback(() => {
    const canvas = correlationCanvasRef.current;
    if (!canvas || !currentAnalysis?.stereoInfo) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);

    // Draw correlation meter
    const { correlation, width: stereoWidth, balance } = currentAnalysis.stereoInfo;

    // Correlation meter
    const corrY = height * 0.3;
    const corrWidth = width * 0.8;
    const corrX = (width - corrWidth) / 2;

    ctx.fillStyle = '#333';
    ctx.fillRect(corrX, corrY - 10, corrWidth, 20);

    const corrPos = corrX + (correlation + 1) / 2 * corrWidth;
    ctx.fillStyle = correlation > 0.8 ? '#ff4444' : correlation > 0.5 ? '#ffaa00' : '#00ff88';
    ctx.fillRect(corrPos - 2, corrY - 10, 4, 20);

    // Width meter
    const widthY = height * 0.6;
    ctx.fillStyle = '#333';
    ctx.fillRect(corrX, widthY - 10, corrWidth, 20);

    const widthPos = corrX + stereoWidth * corrWidth;
    ctx.fillStyle = '#00aaff';
    ctx.fillRect(corrX, widthY - 10, widthPos - corrX, 20);

    // Labels
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px monospace';
    ctx.fillText('Correlation', corrX, corrY - 15);
    ctx.fillText('Width', corrX, widthY - 15);
    ctx.fillText(`${(correlation * 100).toFixed(0)}%`, corrPos + 5, corrY + 5);
    ctx.fillText(`${(stereoWidth * 100).toFixed(0)}%`, widthPos + 5, widthY + 5);
  }, [currentAnalysis]);

  // Update settings
  const updateSettings = useCallback((newSettings: Partial<AnalyzerSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // Export analysis data
  const exportData = useCallback(() => {
    if (!currentAnalysis) return;

    const data = {
      timestamp: Date.now(),
      analysis: currentAnalysis,
      settings,
      spectrogramData: spectrogramData.slice(-100), // Last 100 frames
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spectral-analysis-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [currentAnalysis, settings, spectrogramData]);

  return (
    <div className={`bg-black/90 backdrop-blur-md border border-white/10 rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 size={20} className="text-green-400" />
            Spectral Analyzer
          </h2>
          
          <div className="flex items-center gap-2">
            {/* Analysis status */}
            <div className={`flex items-center gap-1 px-2 py-1 rounded text-sm ${
              isActive ? 'bg-green-600/20 text-green-400' : 'bg-gray-600/20 text-gray-400'
            }`}>
              {isActive ? <Activity size={12} /> : <Pause size={12} />}
              {isActive ? 'Active' : 'Stopped'}
            </div>
            
            {/* Controls */}
            <button
              onClick={toggleAnalysis}
              className={`p-2 rounded transition-colors ${
                isActive 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {isActive ? <Pause size={16} /> : <Play size={16} />}
            </button>
            
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <Settings size={16} />
            </button>
            
            <button
              onClick={exportData}
              className="p-2 rounded bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            >
              <Download size={16} />
            </button>
          </div>
        </div>

        {/* Mode selector */}
        <div className="flex items-center gap-1 bg-white/10 rounded-lg p-1 mb-4">
          {[
            { mode: 'spectrum' as AnalyzerMode, name: 'Spectrum', icon: BarChart3 },
            { mode: 'waveform' as AnalyzerMode, name: 'Waveform', icon: Activity },
            { mode: 'spectrogram' as AnalyzerMode, name: 'Spectrogram', icon: Grid },
            { mode: 'phase' as AnalyzerMode, name: 'Phase', icon: Target },
            { mode: 'correlation' as AnalyzerMode, name: 'Stereo', icon: Speaker },
          ].map(({ mode: m, name, icon: Icon }) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex items-center gap-1 px-3 py-1 rounded text-sm transition-colors ${
                mode === m ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white'
              }`}
            >
              <Icon size={14} />
              {name}
            </button>
          ))}
        </div>

        {/* Analysis info */}
        {currentAnalysis && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-white/60">Centroid</div>
              <div className="text-white font-mono">{currentAnalysis.spectralCentroid.toFixed(0)}Hz</div>
            </div>
            <div>
              <div className="text-white/60">RMS</div>
              <div className="text-white font-mono">{(currentAnalysis.rms * 100).toFixed(1)}%</div>
            </div>
            <div>
              <div className="text-white/60">Peak</div>
              <div className="text-white font-mono">{(currentAnalysis.peak * 100).toFixed(1)}%</div>
            </div>
            <div>
              <div className="text-white/60">Fundamental</div>
              <div className="text-white font-mono">{currentAnalysis.fundamentalFreq.toFixed(0)}Hz</div>
            </div>
          </div>
        )}
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="p-4 border-b border-white/10 bg-white/5">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-white/80 text-sm mb-1">FFT Size</label>
              <select
                value={settings.fftSize}
                onChange={(e) => updateSettings({ fftSize: parseInt(e.target.value) })}
                className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm"
              >
                <option value={512}>512</option>
                <option value={1024}>1024</option>
                <option value={2048}>2048</option>
                <option value={4096}>4096</option>
                <option value={8192}>8192</option>
              </select>
            </div>
            
            <div>
              <label className="block text-white/80 text-sm mb-1">Smoothing</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.smoothingTimeConstant}
                onChange={(e) => updateSettings({ smoothingTimeConstant: parseFloat(e.target.value) })}
                className="w-full"
              />
              <div className="text-white/60 text-xs">{settings.smoothingTimeConstant.toFixed(1)}</div>
            </div>
            
            <div>
              <label className="block text-white/80 text-sm mb-1">Update Rate</label>
              <input
                type="range"
                min="10"
                max="120"
                step="10"
                value={settings.updateRate}
                onChange={(e) => updateSettings({ updateRate: parseInt(e.target.value) })}
                className="w-full"
              />
              <div className="text-white/60 text-xs">{settings.updateRate} FPS</div>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.logScale}
                onChange={(e) => updateSettings({ logScale: e.target.checked })}
                className="rounded"
              />
              <label className="text-white/80 text-sm">Log Scale</label>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.peakHold}
                onChange={(e) => updateSettings({ peakHold: e.target.checked })}
                className="rounded"
              />
              <label className="text-white/80 text-sm">Peak Hold</label>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.showHarmonics}
                onChange={(e) => updateSettings({ showHarmonics: e.target.checked })}
                className="rounded"
              />
              <label className="text-white/80 text-sm">Show Harmonics</label>
            </div>
          </div>
        </div>
      )}

      {/* Visualization */}
      <div className="p-4">
        <div className="relative bg-black rounded-lg overflow-hidden" style={{ height: '300px' }}>
          {mode === 'spectrum' || mode === 'waveform' ? (
            <canvas
              ref={canvasRef}
              width={800}
              height={300}
              className="w-full h-full"
            />
          ) : mode === 'spectrogram' ? (
            <canvas
              ref={spectrogramCanvasRef}
              width={800}
              height={300}
              className="w-full h-full"
            />
          ) : mode === 'phase' ? (
            <canvas
              ref={phaseCanvasRef}
              width={800}
              height={300}
              className="w-full h-full"
            />
          ) : mode === 'correlation' ? (
            <canvas
              ref={correlationCanvasRef}
              width={800}
              height={300}
              className="w-full h-full"
            />
          ) : null}
          
          {!isActive && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="text-center text-white/60">
                <Play size={48} className="mx-auto mb-2 opacity-50" />
                <p>Click play to start analysis</p>
              </div>
            </div>
          )}
        </div>

        {/* Tonal balance */}
        {currentAnalysis && (
          <div className="mt-4 p-3 bg-white/5 rounded-lg">
            <h4 className="text-white/80 text-sm mb-2">Tonal Balance</h4>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <div className="text-white/60 text-xs">Bass</div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div 
                    className="bg-red-400 h-2 rounded-full transition-all"
                    style={{ width: `${currentAnalysis.tonalBalance.bass * 100}%` }}
                  />
                </div>
                <div className="text-white/60 text-xs">{(currentAnalysis.tonalBalance.bass * 100).toFixed(0)}%</div>
              </div>
              
              <div>
                <div className="text-white/60 text-xs">Mid</div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div 
                    className="bg-yellow-400 h-2 rounded-full transition-all"
                    style={{ width: `${currentAnalysis.tonalBalance.midrange * 100}%` }}
                  />
                </div>
                <div className="text-white/60 text-xs">{(currentAnalysis.tonalBalance.midrange * 100).toFixed(0)}%</div>
              </div>
              
              <div>
                <div className="text-white/60 text-xs">Treble</div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div 
                    className="bg-blue-400 h-2 rounded-full transition-all"
                    style={{ width: `${currentAnalysis.tonalBalance.treble * 100}%` }}
                  />
                </div>
                <div className="text-white/60 text-xs">{(currentAnalysis.tonalBalance.treble * 100).toFixed(0)}%</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
