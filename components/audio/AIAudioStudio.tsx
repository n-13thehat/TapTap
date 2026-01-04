"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  AIAudioProcessor, 
  AudioAnalysisResult, 
  SourceSeparationResult, 
  AudioEnhancementResult, 
  MasteringResult,
  AIProcessingConfig 
} from '@/lib/audio/ai/AIAudioProcessor';
import {
  Brain,
  Activity,
  Sparkles,
  Volume2,
  Settings,
  Play,
  Pause,
  Download,
  Upload,
  Cpu,
  Clock,
  Zap,
  Target,
  Layers,
  Music,
  Mic,
  Circle,
  Guitar,
  Headphones,
  BarChart3,
  TrendingUp,
  Sliders,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Loader
} from 'lucide-react';

interface AIAudioStudioProps {
  audioContext?: AudioContext;
  audioBuffer?: AudioBuffer;
  onProcessedAudio?: (buffer: AudioBuffer, type: string) => void;
  className?: string;
}

interface ProcessingState {
  isAnalyzing: boolean;
  isSeparating: boolean;
  isEnhancing: boolean;
  isMastering: boolean;
  progress: number;
  stage: string;
}

export default function AIAudioStudio({ 
  audioContext, 
  audioBuffer, 
  onProcessedAudio, 
  className = '' 
}: AIAudioStudioProps) {
  const processorRef = useRef<AIAudioProcessor | null>(null);
  const [activeTab, setActiveTab] = useState<'analyze' | 'separate' | 'enhance' | 'master'>('analyze');
  const [processingState, setProcessingState] = useState<ProcessingState>({
    isAnalyzing: false,
    isSeparating: false,
    isEnhancing: false,
    isMastering: false,
    progress: 0,
    stage: ''
  });
  
  // Results
  const [analysisResult, setAnalysisResult] = useState<AudioAnalysisResult | null>(null);
  const [separationResult, setSeparationResult] = useState<SourceSeparationResult | null>(null);
  const [enhancementResult, setEnhancementResult] = useState<AudioEnhancementResult | null>(null);
  const [masteringResult, setMasteringResult] = useState<MasteringResult | null>(null);
  
  // Settings
  const [config, setConfig] = useState<AIProcessingConfig>({
    model: 'standard',
    quality: 'balanced',
    realtime: false,
    gpuAcceleration: true
  });
  
  const [enhancementOptions, setEnhancementOptions] = useState({
    noiseReduction: true,
    clarityEnhancement: true,
    dynamicRangeExpansion: false,
    stereoWidening: false,
    harmonicEnhancement: true
  });
  
  const [masteringOptions, setMasteringOptions] = useState({
    targetLUFS: -14,
    peakLevel: -1,
    dynamicRange: 10,
    stereoWidth: 1.2,
    genre: 'pop'
  });

  // Initialize AI processor
  useEffect(() => {
    if (!audioContext) return;

    processorRef.current = new AIAudioProcessor(audioContext, config);
    
    // Set up event listeners
    const processor = processorRef.current;
    
    const handleAnalysisComplete = (event: Event) => {
      const result = (event as CustomEvent).detail;
      setAnalysisResult(result);
      setProcessingState(prev => ({ ...prev, isAnalyzing: false }));
    };
    
    const handleSeparationProgress = (event: Event) => {
      const { progress, stage } = (event as CustomEvent).detail;
      setProcessingState(prev => ({ ...prev, progress, stage }));
    };
    
    const handleSeparationComplete = (event: Event) => {
      const result = (event as CustomEvent).detail;
      setSeparationResult(result);
      setProcessingState(prev => ({ ...prev, isSeparating: false, progress: 0, stage: '' }));
    };
    
    const handleEnhancementProgress = (event: Event) => {
      const { progress, stage } = (event as CustomEvent).detail;
      setProcessingState(prev => ({ ...prev, progress, stage }));
    };
    
    const handleEnhancementComplete = (event: Event) => {
      const result = (event as CustomEvent).detail;
      setEnhancementResult(result);
      setProcessingState(prev => ({ ...prev, isEnhancing: false, progress: 0, stage: '' }));
      
      if (onProcessedAudio) {
        onProcessedAudio(result.enhancedAudio, 'enhanced');
      }
    };
    
    const handleMasteringProgress = (event: Event) => {
      const { progress, stage } = (event as CustomEvent).detail;
      setProcessingState(prev => ({ ...prev, progress, stage }));
    };
    
    const handleMasteringComplete = (event: Event) => {
      const result = (event as CustomEvent).detail;
      setMasteringResult(result);
      setProcessingState(prev => ({ ...prev, isMastering: false, progress: 0, stage: '' }));
      
      if (onProcessedAudio) {
        onProcessedAudio(result.masteredAudio, 'mastered');
      }
    };
    
    const handleError = (event: Event) => {
      const { error, operation } = (event as CustomEvent).detail;
      console.error(`AI processing error in ${operation}:`, error);
      setProcessingState(prev => ({
        ...prev,
        isAnalyzing: false,
        isSeparating: false,
        isEnhancing: false,
        isMastering: false,
        progress: 0,
        stage: ''
      }));
    };
    
    processor.addEventListener('analysis-complete', handleAnalysisComplete);
    processor.addEventListener('separation-progress', handleSeparationProgress);
    processor.addEventListener('separation-complete', handleSeparationComplete);
    processor.addEventListener('enhancement-progress', handleEnhancementProgress);
    processor.addEventListener('enhancement-complete', handleEnhancementComplete);
    processor.addEventListener('mastering-progress', handleMasteringProgress);
    processor.addEventListener('mastering-complete', handleMasteringComplete);
    processor.addEventListener('error', handleError);

    return () => {
      processor.removeEventListener('analysis-complete', handleAnalysisComplete);
      processor.removeEventListener('separation-progress', handleSeparationProgress);
      processor.removeEventListener('separation-complete', handleSeparationComplete);
      processor.removeEventListener('enhancement-progress', handleEnhancementProgress);
      processor.removeEventListener('enhancement-complete', handleEnhancementComplete);
      processor.removeEventListener('mastering-progress', handleMasteringProgress);
      processor.removeEventListener('mastering-complete', handleMasteringComplete);
      processor.removeEventListener('error', handleError);
      processor.destroy();
    };
  }, [audioContext, config, onProcessedAudio]);

  // Analysis functions
  const runAnalysis = useCallback(async () => {
    if (!processorRef.current || !audioBuffer || processingState.isAnalyzing) return;
    
    setProcessingState(prev => ({ ...prev, isAnalyzing: true }));
    
    try {
      await processorRef.current.analyzeAudio(audioBuffer);
    } catch (error) {
      console.error('Analysis failed:', error);
      setProcessingState(prev => ({ ...prev, isAnalyzing: false }));
    }
  }, [audioBuffer, processingState.isAnalyzing]);

  const runSourceSeparation = useCallback(async () => {
    if (!processorRef.current || !audioBuffer || processingState.isSeparating) return;
    
    setProcessingState(prev => ({ ...prev, isSeparating: true }));
    
    try {
      await processorRef.current.separateAudioSources(audioBuffer);
    } catch (error) {
      console.error('Source separation failed:', error);
      setProcessingState(prev => ({ ...prev, isSeparating: false }));
    }
  }, [audioBuffer, processingState.isSeparating]);

  const runEnhancement = useCallback(async () => {
    if (!processorRef.current || !audioBuffer || processingState.isEnhancing) return;
    
    setProcessingState(prev => ({ ...prev, isEnhancing: true }));
    
    try {
      await processorRef.current.enhanceAudio(audioBuffer, enhancementOptions);
    } catch (error) {
      console.error('Enhancement failed:', error);
      setProcessingState(prev => ({ ...prev, isEnhancing: false }));
    }
  }, [audioBuffer, enhancementOptions, processingState.isEnhancing]);

  const runMastering = useCallback(async () => {
    if (!processorRef.current || !audioBuffer || processingState.isMastering) return;
    
    setProcessingState(prev => ({ ...prev, isMastering: true }));
    
    try {
      await processorRef.current.masterAudio(audioBuffer, masteringOptions);
    } catch (error) {
      console.error('Mastering failed:', error);
      setProcessingState(prev => ({ ...prev, isMastering: false }));
    }
  }, [audioBuffer, masteringOptions, processingState.isMastering]);

  // Render analysis results
  const renderAnalysisResults = () => {
    if (!analysisResult) return null;

    return (
      <div className="space-y-6">
        {/* Musical Analysis */}
        <div className="bg-white/5 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Music size={20} className="text-blue-400" />
            Musical Analysis
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{analysisResult.tempo.toFixed(0)}</div>
              <div className="text-sm text-white/60">BPM</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{analysisResult.key}</div>
              <div className="text-sm text-white/60">Key</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{analysisResult.timeSignature}</div>
              <div className="text-sm text-white/60">Time Sig</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{analysisResult.loudness.toFixed(1)}</div>
              <div className="text-sm text-white/60">LUFS</div>
            </div>
          </div>
        </div>

        {/* Audio Characteristics */}
        <div className="bg-white/5 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 size={20} className="text-green-400" />
            Audio Characteristics
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { label: 'Energy', value: analysisResult.energy, color: 'bg-red-500' },
              { label: 'Valence', value: analysisResult.valence, color: 'bg-yellow-500' },
              { label: 'Danceability', value: analysisResult.danceability, color: 'bg-purple-500' },
              { label: 'Acousticness', value: analysisResult.acousticness, color: 'bg-green-500' },
              { label: 'Instrumentalness', value: analysisResult.instrumentalness, color: 'bg-blue-500' },
              { label: 'Speechiness', value: analysisResult.speechiness, color: 'bg-orange-500' }
            ].map(({ label, value, color }) => (
              <div key={label} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white/80">{label}</span>
                  <span className="text-white/60">{(value * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${color}`}
                    style={{ width: `${value * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Technical Analysis */}
        <div className="bg-white/5 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-cyan-400" />
            Technical Analysis
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-xl font-bold text-white">{analysisResult.dynamicRange.toFixed(1)}</div>
              <div className="text-sm text-white/60">Dynamic Range (dB)</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-white">{(analysisResult.spectralCentroid / 1000).toFixed(1)}k</div>
              <div className="text-sm text-white/60">Spectral Centroid (Hz)</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-white">{(analysisResult.spectralRolloff / 1000).toFixed(1)}k</div>
              <div className="text-sm text-white/60">Spectral Rolloff (Hz)</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render source separation results
  const renderSeparationResults = () => {
    if (!separationResult) return null;

    const sources = [
      { name: 'Vocals', buffer: separationResult.vocals, icon: Mic, color: 'text-pink-400' },
      { name: 'Drums', buffer: separationResult.drums, icon: Circle, color: 'text-red-400' },
      { name: 'Bass', buffer: separationResult.bass, icon: Guitar, color: 'text-blue-400' },
      { name: 'Other', buffer: separationResult.other, icon: Headphones, color: 'text-green-400' }
    ];

    return (
      <div className="space-y-4">
        <div className="bg-white/5 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Separated Sources</h3>
            <div className="flex items-center gap-2 text-sm text-white/60">
              <CheckCircle size={16} className="text-green-400" />
              <span>{(separationResult.confidence * 100).toFixed(0)}% confidence</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sources.map(({ name, buffer, icon: Icon, color }) => (
              <div key={name} className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Icon size={20} className={color} />
                    <span className="text-white font-medium">{name}</span>
                  </div>
                  <button
                    onClick={() => onProcessedAudio?.(buffer, name.toLowerCase())}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                    title={`Play ${name}`}
                  >
                    <Play size={14} className="text-white" />
                  </button>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-white/60">
                    <span>Duration</span>
                    <span>{buffer.duration.toFixed(1)}s</span>
                  </div>
                  <div className="flex justify-between text-xs text-white/60">
                    <span>Channels</span>
                    <span>{buffer.numberOfChannels}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render enhancement results
  const renderEnhancementResults = () => {
    if (!enhancementResult) return null;

    const improvements = Object.entries(enhancementResult.improvements).map(([key, value]) => ({
      name: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
      value: value as number,
      enabled: enhancementOptions[key as keyof typeof enhancementOptions]
    }));

    return (
      <div className="space-y-4">
        <div className="bg-white/5 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Enhancement Results</h3>
            <div className="flex items-center gap-2 text-sm text-white/60">
              <Clock size={16} />
              <span>{enhancementResult.processingTime}ms</span>
            </div>
          </div>
          
          <div className="space-y-4">
            {improvements.map(({ name, value, enabled }) => (
              <div key={name} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className={`${enabled ? 'text-white' : 'text-white/40'}`}>{name}</span>
                  <span className="text-white/60">{enabled ? `+${(value * 100).toFixed(0)}%` : 'Disabled'}</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${
                      enabled ? 'bg-green-500' : 'bg-white/20'
                    }`}
                    style={{ width: enabled ? `${value * 100}%` : '0%' }}
                  />
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 pt-4 border-t border-white/10">
            <button
              onClick={() => onProcessedAudio?.(enhancementResult.enhancedAudio, 'enhanced')}
              className="w-full bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-white flex items-center justify-center gap-2 transition-colors"
            >
              <Play size={16} />
              Play Enhanced Audio
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render mastering results
  const renderMasteringResults = () => {
    if (!masteringResult) return null;

    return (
      <div className="space-y-4">
        <div className="bg-white/5 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Mastering Results</h3>
            <div className="flex items-center gap-2 text-sm text-white/60">
              <Clock size={16} />
              <span>{masteringResult.processingTime}ms</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Before/After Comparison */}
            <div className="space-y-4">
              <h4 className="text-white font-medium">Before vs After</h4>
              
              {[
                { label: 'LUFS', before: masteringResult.analysis.beforeLUFS, after: masteringResult.analysis.afterLUFS, unit: '' },
                { label: 'Peak', before: masteringResult.analysis.beforePeak, after: masteringResult.analysis.afterPeak, unit: 'dB' },
                { label: 'Dynamic Range', before: masteringResult.analysis.beforeDR, after: masteringResult.analysis.afterDR, unit: 'dB' }
              ].map(({ label, before, after, unit }) => (
                <div key={label} className="space-y-1">
                  <div className="flex justify-between text-sm text-white/80">
                    <span>{label}</span>
                    <span>{before.toFixed(1)}{unit} → {after.toFixed(1)}{unit}</span>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-red-500/20 rounded h-2">
                      <div className="bg-red-500 h-2 rounded" style={{ width: '60%' }} />
                    </div>
                    <div className="flex-1 bg-green-500/20 rounded h-2">
                      <div className="bg-green-500 h-2 rounded" style={{ width: '80%' }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Settings Applied */}
            <div className="space-y-4">
              <h4 className="text-white font-medium">Settings Applied</h4>
              
              {[
                { label: 'Target LUFS', value: masteringResult.settings.targetLUFS, unit: '' },
                { label: 'Peak Level', value: masteringResult.settings.peakLevel, unit: 'dB' },
                { label: 'Dynamic Range', value: masteringResult.settings.dynamicRange, unit: 'dB' },
                { label: 'Stereo Width', value: masteringResult.settings.stereoWidth, unit: 'x' }
              ].map(({ label, value, unit }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-white/80">{label}</span>
                  <span className="text-white">{value}{unit}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-white/10">
            <button
              onClick={() => onProcessedAudio?.(masteringResult.masteredAudio, 'mastered')}
              className="w-full bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-white flex items-center justify-center gap-2 transition-colors"
            >
              <Play size={16} />
              Play Mastered Audio
            </button>
          </div>
        </div>
      </div>
    );
  };

  const tabs = [
    { id: 'analyze', name: 'Analyze', icon: BarChart3, color: 'text-blue-400' },
    { id: 'separate', name: 'Separate', icon: Layers, color: 'text-green-400' },
    { id: 'enhance', name: 'Enhance', icon: Sparkles, color: 'text-yellow-400' },
    { id: 'master', name: 'Master', icon: Target, color: 'text-purple-400' }
  ] as const;

  const isProcessing = Object.values(processingState).some(state => 
    typeof state === 'boolean' && state
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <Brain size={28} className="text-purple-400" />
          AI Audio Studio
        </h2>
        
        {/* Processing indicator */}
        {isProcessing && (
          <div className="flex items-center gap-2 bg-purple-600/20 px-4 py-2 rounded-lg">
            <Loader size={16} className="text-purple-400 animate-spin" />
            <span className="text-white text-sm">
              {processingState.stage} ({(processingState.progress * 100).toFixed(0)}%)
            </span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-white/5 rounded-lg p-1">
        {tabs.map(({ id, name, icon: Icon, color }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all ${
              activeTab === id
                ? 'bg-white/10 text-white'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Icon size={18} className={activeTab === id ? color : ''} />
            <span className="font-medium">{name}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {!audioBuffer ? (
          <div className="text-center py-16 text-white/60">
            <Brain size={64} className="mx-auto mb-4 opacity-50" />
            <p className="text-xl font-medium">No Audio Loaded</p>
            <p className="text-sm">Load an audio file to start AI processing</p>
          </div>
        ) : (
          <>
            {/* Analysis Tab */}
            {activeTab === 'analyze' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <p className="text-white/80">
                    Analyze audio characteristics, tempo, key, and musical features using AI.
                  </p>
                  <button
                    onClick={runAnalysis}
                    disabled={processingState.isAnalyzing}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 px-6 py-2 rounded-lg text-white flex items-center gap-2 transition-colors"
                  >
                    {processingState.isAnalyzing ? (
                      <Loader size={16} className="animate-spin" />
                    ) : (
                      <BarChart3 size={16} />
                    )}
                    {processingState.isAnalyzing ? 'Analyzing...' : 'Analyze Audio'}
                  </button>
                </div>
                
                {renderAnalysisResults()}
              </div>
            )}

            {/* Source Separation Tab */}
            {activeTab === 'separate' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <p className="text-white/80">
                    Separate audio into individual sources: vocals, drums, bass, and other instruments.
                  </p>
                  <button
                    onClick={runSourceSeparation}
                    disabled={processingState.isSeparating}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 px-6 py-2 rounded-lg text-white flex items-center gap-2 transition-colors"
                  >
                    {processingState.isSeparating ? (
                      <Loader size={16} className="animate-spin" />
                    ) : (
                      <Layers size={16} />
                    )}
                    {processingState.isSeparating ? 'Separating...' : 'Separate Sources'}
                  </button>
                </div>
                
                {/* Progress bar */}
                {processingState.isSeparating && (
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="flex justify-between text-sm text-white/80 mb-2">
                      <span>{processingState.stage}</span>
                      <span>{(processingState.progress * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${processingState.progress * 100}%` }}
                      />
                    </div>
                  </div>
                )}
                
                {renderSeparationResults()}
              </div>
            )}

            {/* Enhancement Tab */}
            {activeTab === 'enhance' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <p className="text-white/80">
                    Enhance audio quality with AI-powered noise reduction, clarity, and dynamics.
                  </p>
                  <button
                    onClick={runEnhancement}
                    disabled={processingState.isEnhancing}
                    className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-600/50 px-6 py-2 rounded-lg text-white flex items-center gap-2 transition-colors"
                  >
                    {processingState.isEnhancing ? (
                      <Loader size={16} className="animate-spin" />
                    ) : (
                      <Sparkles size={16} />
                    )}
                    {processingState.isEnhancing ? 'Enhancing...' : 'Enhance Audio'}
                  </button>
                </div>

                {/* Enhancement Options */}
                <div className="bg-white/5 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Enhancement Options</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(enhancementOptions).map(([key, enabled]) => (
                      <label key={key} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={enabled}
                          onChange={(e) => setEnhancementOptions(prev => ({
                            ...prev,
                            [key]: e.target.checked
                          }))}
                          className="w-4 h-4 rounded border-white/20 bg-white/10 text-yellow-600"
                        />
                        <span className="text-white/80">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                
                {/* Progress bar */}
                {processingState.isEnhancing && (
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="flex justify-between text-sm text-white/80 mb-2">
                      <span>{processingState.stage}</span>
                      <span>{(processingState.progress * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div 
                        className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${processingState.progress * 100}%` }}
                      />
                    </div>
                  </div>
                )}
                
                {renderEnhancementResults()}
              </div>
            )}

            {/* Mastering Tab */}
            {activeTab === 'master' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <p className="text-white/80">
                    Apply professional mastering with AI-optimized loudness, dynamics, and EQ.
                  </p>
                  <button
                    onClick={runMastering}
                    disabled={processingState.isMastering}
                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 px-6 py-2 rounded-lg text-white flex items-center gap-2 transition-colors"
                  >
                    {processingState.isMastering ? (
                      <Loader size={16} className="animate-spin" />
                    ) : (
                      <Target size={16} />
                    )}
                    {processingState.isMastering ? 'Mastering...' : 'Master Audio'}
                  </button>
                </div>

                {/* Mastering Options */}
                <div className="bg-white/5 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Mastering Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-white/80 text-sm mb-2">Target LUFS</label>
                        <input
                          type="range"
                          min="-23"
                          max="-6"
                          step="0.1"
                          value={masteringOptions.targetLUFS}
                          onChange={(e) => setMasteringOptions(prev => ({
                            ...prev,
                            targetLUFS: Number(e.target.value)
                          }))}
                          className="w-full"
                        />
                        <div className="text-xs text-white/60 mt-1">{masteringOptions.targetLUFS} LUFS</div>
                      </div>
                      
                      <div>
                        <label className="block text-white/80 text-sm mb-2">Peak Level</label>
                        <input
                          type="range"
                          min="-3"
                          max="0"
                          step="0.1"
                          value={masteringOptions.peakLevel}
                          onChange={(e) => setMasteringOptions(prev => ({
                            ...prev,
                            peakLevel: Number(e.target.value)
                          }))}
                          className="w-full"
                        />
                        <div className="text-xs text-white/60 mt-1">{masteringOptions.peakLevel} dB</div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-white/80 text-sm mb-2">Dynamic Range</label>
                        <input
                          type="range"
                          min="6"
                          max="20"
                          step="0.5"
                          value={masteringOptions.dynamicRange}
                          onChange={(e) => setMasteringOptions(prev => ({
                            ...prev,
                            dynamicRange: Number(e.target.value)
                          }))}
                          className="w-full"
                        />
                        <div className="text-xs text-white/60 mt-1">{masteringOptions.dynamicRange} dB</div>
                      </div>
                      
                      <div>
                        <label className="block text-white/80 text-sm mb-2">Stereo Width</label>
                        <input
                          type="range"
                          min="0.8"
                          max="2.0"
                          step="0.1"
                          value={masteringOptions.stereoWidth}
                          onChange={(e) => setMasteringOptions(prev => ({
                            ...prev,
                            stereoWidth: Number(e.target.value)
                          }))}
                          className="w-full"
                        />
                        <div className="text-xs text-white/60 mt-1">{masteringOptions.stereoWidth}x</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Progress bar */}
                {processingState.isMastering && (
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="flex justify-between text-sm text-white/80 mb-2">
                      <span>{processingState.stage}</span>
                      <span>{(processingState.progress * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div 
                        className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${processingState.progress * 100}%` }}
                      />
                    </div>
                  </div>
                )}
                
                {renderMasteringResults()}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
