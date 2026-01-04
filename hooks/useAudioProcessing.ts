"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { AdvancedAudioProcessingEngine } from '@/lib/audio-processing/audioProcessingEngine';
import { 
  AudioTrack,
  AudioEffect,
  SpatialAudio,
  AISourceSeparation,
  AIEnhancement,
  AIMastering,
  AudioAnalysisSession,
  AudioProcessingMetrics
} from '@/lib/audio-processing/types';
import { useAuth } from './useAuth';

/**
 * Hook for advanced audio processing functionality
 */
export function useAudioProcessing() {
  const { user } = useAuth();
  const processingEngine = useRef<AdvancedAudioProcessingEngine | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [tracks, setTracks] = useState<AudioTrack[]>([]);
  const [effects, setEffects] = useState<AudioEffect[]>([]);
  const [spatialProcessors, setSpatialProcessors] = useState<SpatialAudio[]>([]);
  const [analysisSessions, setAnalysisSessions] = useState<AudioAnalysisSession[]>([]);
  const [metrics, setMetrics] = useState<AudioProcessingMetrics | null>(null);

  const loadAudioData = useCallback(() => {
    if (!processingEngine.current) return;

    const allTracks = processingEngine.current.getAllTracks();
    setTracks(allTracks);
  }, []);

  const startMetricsUpdates = useCallback(() => {
    const interval = setInterval(() => {
      if (processingEngine.current) {
        const currentMetrics = processingEngine.current.getProcessingMetrics();
        setMetrics(currentMetrics);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Initialize Audio Processing Engine
  useEffect(() => {
    if (!processingEngine.current) {
      processingEngine.current = new AdvancedAudioProcessingEngine(user?.id);
      setIsInitialized(true);
    }
    loadAudioData();
    const stopMetrics = startMetricsUpdates();
    return () => {
      stopMetrics?.();
    };
  }, [loadAudioData, startMetricsUpdates, user?.id]);

  const loadTrack = useCallback(async (audioFile: File, metadata?: {
    name?: string;
    description?: string;
  }) => {
    if (!processingEngine.current) return null;

    try {
      const arrayBuffer = await audioFile.arrayBuffer();
      const trackId = await processingEngine.current.loadTrack(arrayBuffer, {
        name: metadata?.name || audioFile.name,
        description: metadata?.description,
      });
      
      loadAudioData();
      return trackId;
    } catch (error) {
      console.error('Failed to load track:', error);
      throw error;
    }
  }, [loadAudioData]);

  const applyEffect = useCallback(async (trackId: string, effectType: string, parameters: Record<string, number>) => {
    if (!processingEngine.current) return null;

    try {
      const effectId = await processingEngine.current.applyEffect(trackId, effectType, parameters);
      loadAudioData();
      return effectId;
    } catch (error) {
      console.error('Failed to apply effect:', error);
      throw error;
    }
  }, [loadAudioData]);

  const createSpatialProcessor = useCallback(async (config: {
    name: string;
    type: 'stereo' | 'surround' | 'binaural' | 'ambisonic';
    format: string;
    room_simulation?: boolean;
  }) => {
    if (!processingEngine.current) return null;

    try {
      const processorId = await processingEngine.current.createSpatialProcessor(config);
      
      // Update spatial processors list
      const processor = processingEngine.current.getSpatialProcessor(processorId);
      if (processor) {
        setSpatialProcessors(prev => [...prev, processor]);
      }
      
      return processorId;
    } catch (error) {
      console.error('Failed to create spatial processor:', error);
      throw error;
    }
  }, []);

  const separateAudioSources = useCallback(async (trackId: string, targets: string[]) => {
    if (!processingEngine.current) return null;

    try {
      const separation = await processingEngine.current.separateAudioSources(trackId, targets);
      return separation;
    } catch (error) {
      console.error('Failed to separate audio sources:', error);
      throw error;
    }
  }, []);

  const enhanceAudio = useCallback(async (trackId: string, enhancementTypes: string[]) => {
    if (!processingEngine.current) return null;

    try {
      const enhancement = await processingEngine.current.enhanceAudio(trackId, enhancementTypes);
      return enhancement;
    } catch (error) {
      console.error('Failed to enhance audio:', error);
      throw error;
    }
  }, []);

  const masterAudio = useCallback(async (trackId: string, config: {
    target_loudness?: number;
    target_genre?: string;
    reference_track?: string;
  }) => {
    if (!processingEngine.current) return null;

    try {
      const mastering = await processingEngine.current.masterAudio(trackId, config);
      return mastering;
    } catch (error) {
      console.error('Failed to master audio:', error);
      throw error;
    }
  }, []);

  const startAnalysis = useCallback(async (trackId: string, analysisTypes: string[]) => {
    if (!processingEngine.current) return null;

    try {
      const sessionId = await processingEngine.current.startAnalysisSession(trackId, analysisTypes);
      
      // Update analysis sessions list
      const session = processingEngine.current.getAnalysisSession(sessionId);
      if (session) {
        setAnalysisSessions(prev => [...prev, session]);
      }
      
      return sessionId;
    } catch (error) {
      console.error('Failed to start analysis:', error);
      throw error;
    }
  }, []);

  const getTrack = useCallback((trackId: string) => {
    if (!processingEngine.current) return null;
    return processingEngine.current.getTrack(trackId);
  }, []);

  const getEffect = useCallback((effectId: string) => {
    if (!processingEngine.current) return null;
    return processingEngine.current.getEffect(effectId);
  }, []);

  const getAnalysisSession = useCallback((sessionId: string) => {
    if (!processingEngine.current) return null;
    return processingEngine.current.getAnalysisSession(sessionId);
  }, []);

  return {
    isInitialized,
    tracks,
    effects,
    spatialProcessors,
    analysisSessions,
    metrics,
    loadTrack,
    applyEffect,
    createSpatialProcessor,
    separateAudioSources,
    enhanceAudio,
    masterAudio,
    startAnalysis,
    getTrack,
    getEffect,
    getAnalysisSession,
    refreshData: loadAudioData,
  };
}

/**
 * Hook for AI audio processing features
 */
export function useAIAudioProcessing() {
  const { separateAudioSources, enhanceAudio, masterAudio } = useAudioProcessing();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingType, setProcessingType] = useState<string | null>(null);

  const processWithAI = useCallback(async (
    type: 'separation' | 'enhancement' | 'mastering',
    trackId: string,
    config: any
  ) => {
    setIsProcessing(true);
    setProcessingProgress(0);
    setProcessingType(type);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProcessingProgress(prev => Math.min(90, prev + 10));
      }, 500);

      let result;
      switch (type) {
        case 'separation':
          result = await separateAudioSources(trackId, config.targets);
          break;
        case 'enhancement':
          result = await enhanceAudio(trackId, config.enhancementTypes);
          break;
        case 'mastering':
          result = await masterAudio(trackId, config);
          break;
        default:
          throw new Error(`Unknown AI processing type: ${type}`);
      }

      clearInterval(progressInterval);
      setProcessingProgress(100);

      setTimeout(() => {
        setIsProcessing(false);
        setProcessingProgress(0);
        setProcessingType(null);
      }, 1000);

      return result;
    } catch (error) {
      setIsProcessing(false);
      setProcessingProgress(0);
      setProcessingType(null);
      throw error;
    }
  }, [separateAudioSources, enhanceAudio, masterAudio]);

  return {
    isProcessing,
    processingProgress,
    processingType,
    processWithAI,
  };
}

/**
 * Hook for spatial audio processing
 */
export function useSpatialAudio() {
  const { spatialProcessors, createSpatialProcessor } = useAudioProcessing();
  const [activeSpatialProcessor, setActiveSpatialProcessor] = useState<string | null>(null);

  const createBinauralProcessor = useCallback(async (name: string) => {
    return await createSpatialProcessor({
      name,
      type: 'binaural',
      format: 'binaural',
      room_simulation: true,
    });
  }, [createSpatialProcessor]);

  const createSurroundProcessor = useCallback(async (name: string, format: string) => {
    return await createSpatialProcessor({
      name,
      type: 'surround',
      format,
      room_simulation: false,
    });
  }, [createSpatialProcessor]);

  const createAmbisonicProcessor = useCallback(async (name: string, order: number = 1) => {
    return await createSpatialProcessor({
      name,
      type: 'ambisonic',
      format: `ambisonic_${order}st`,
      room_simulation: true,
    });
  }, [createSpatialProcessor]);

  return {
    spatialProcessors,
    activeSpatialProcessor,
    setActiveSpatialProcessor,
    createBinauralProcessor,
    createSurroundProcessor,
    createAmbisonicProcessor,
  };
}

/**
 * Hook for audio analysis features
 */
export function useAudioAnalysis() {
  const { analysisSessions, startAnalysis, getAnalysisSession } = useAudioProcessing();
  const [activeAnalysis, setActiveAnalysis] = useState<string | null>(null);

  const analyzeTrack = useCallback(async (trackId: string, analysisTypes: string[]) => {
    const sessionId = await startAnalysis(trackId, analysisTypes);
    if (sessionId) {
      setActiveAnalysis(sessionId);
    }
    return sessionId;
  }, [startAnalysis]);

  const getAnalysisProgress = useCallback((sessionId: string) => {
    const session = getAnalysisSession(sessionId);
    return session?.progress || 0;
  }, [getAnalysisSession]);

  const getAnalysisResults = useCallback((sessionId: string) => {
    const session = getAnalysisSession(sessionId);
    return session?.results || [];
  }, [getAnalysisSession]);

  const isAnalysisComplete = useCallback((sessionId: string) => {
    const session = getAnalysisSession(sessionId);
    return session?.status === 'completed';
  }, [getAnalysisSession]);

  return {
    analysisSessions,
    activeAnalysis,
    analyzeTrack,
    getAnalysisProgress,
    getAnalysisResults,
    isAnalysisComplete,
  };
}

/**
 * Hook for audio effects processing
 */
export function useAudioEffects() {
  const { effects, applyEffect } = useAudioProcessing();

  const applyEqualizer = useCallback(async (trackId: string, bands: Record<string, number>) => {
    return await applyEffect(trackId, 'equalizer', bands);
  }, [applyEffect]);

  const applyCompressor = useCallback(async (trackId: string, settings: {
    threshold?: number;
    ratio?: number;
    attack?: number;
    release?: number;
  }) => {
    return await applyEffect(trackId, 'compressor', {
      threshold: settings.threshold || -12,
      ratio: settings.ratio || 3,
      attack: settings.attack || 10,
      release: settings.release || 100,
    });
  }, [applyEffect]);

  const applyReverb = useCallback(async (trackId: string, settings: {
    room_size?: number;
    damping?: number;
    wet_level?: number;
    dry_level?: number;
  }) => {
    return await applyEffect(trackId, 'reverb', {
      room_size: settings.room_size || 50,
      damping: settings.damping || 30,
      wet_level: settings.wet_level || 30,
      dry_level: settings.dry_level || 70,
    });
  }, [applyEffect]);

  const applyDelay = useCallback(async (trackId: string, settings: {
    delay_time?: number;
    feedback?: number;
    wet_level?: number;
  }) => {
    return await applyEffect(trackId, 'delay', {
      delay_time: settings.delay_time || 250,
      feedback: settings.feedback || 30,
      wet_level: settings.wet_level || 25,
    });
  }, [applyEffect]);

  return {
    effects,
    applyEqualizer,
    applyCompressor,
    applyReverb,
    applyDelay,
  };
}
