"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { AdvancedMusicTheoryEngine } from '@/lib/music-theory/musicTheoryEngine';
import { 
  MusicalKey,
  Chord,
  ChordProgression,
  AnalysisSession,
  GenerationRequest,
  CompositionAssistant,
  MusicTheoryKnowledgeBase,
  Note,
  Scale
} from '@/lib/music-theory/types';
import { useAuth } from './useAuth';

/**
 * Hook for advanced music theory functionality
 */
export function useMusicTheory() {
  const { user } = useAuth();
  const theoryEngine = useRef<AdvancedMusicTheoryEngine | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [chordProgressions, setChordProgressions] = useState<ChordProgression[]>([]);
  const [analysisSessions, setAnalysisSessions] = useState<AnalysisSession[]>([]);
  const [generationRequests, setGenerationRequests] = useState<GenerationRequest[]>([]);
  const [knowledgeBase, setKnowledgeBase] = useState<MusicTheoryKnowledgeBase | null>(null);

  const loadMusicTheoryData = useCallback(() => {
    if (!theoryEngine.current) return;

    const progressions = theoryEngine.current.getAllChordProgressions();
    setChordProgressions(progressions);
    
    const kb = theoryEngine.current.getKnowledgeBase();
    setKnowledgeBase(kb);
  }, []);

  // Initialize Music Theory Engine
  useEffect(() => {
    if (!theoryEngine.current) {
      theoryEngine.current = new AdvancedMusicTheoryEngine(user?.id);
      setIsInitialized(true);
    }
    loadMusicTheoryData();
  }, [loadMusicTheoryData, user?.id]);

  const analyzeKey = useCallback(async (input: {
    chords?: string[];
    notes?: Note[];
    audio_data?: ArrayBuffer;
  }) => {
    if (!theoryEngine.current) return null;

    try {
      const key = await theoryEngine.current.analyzeKey(input);
      return key;
    } catch (error) {
      console.error('Failed to analyze key:', error);
      throw error;
    }
  }, []);

  const analyzeChordProgression = useCallback(async (chords: string[], key?: MusicalKey) => {
    if (!theoryEngine.current) return null;

    try {
      const progression = await theoryEngine.current.analyzeChordProgression(chords, key);
      loadMusicTheoryData();
      return progression;
    } catch (error) {
      console.error('Failed to analyze chord progression:', error);
      throw error;
    }
  }, [loadMusicTheoryData]);

  const generateChordProgression = useCallback(async (parameters: {
    key?: MusicalKey;
    length?: number;
    style?: string;
    complexity?: number;
    harmonic_rhythm?: number[];
    cadence_type?: string;
  }) => {
    if (!theoryEngine.current) return null;

    try {
      const progression = await theoryEngine.current.generateChordProgression(parameters);
      loadMusicTheoryData();
      return progression;
    } catch (error) {
      console.error('Failed to generate chord progression:', error);
      throw error;
    }
  }, [loadMusicTheoryData]);

  const analyzeHarmonicFunction = useCallback(async (chords: Chord[], key: MusicalKey) => {
    if (!theoryEngine.current) return null;

    try {
      const functions = await theoryEngine.current.analyzeHarmonicFunction(chords, key);
      return functions;
    } catch (error) {
      console.error('Failed to analyze harmonic function:', error);
      throw error;
    }
  }, []);

  const generateVoiceLeading = useCallback(async (chords: Chord[], voiceCount: number = 4) => {
    if (!theoryEngine.current) return null;

    try {
      const voiceLeading = await theoryEngine.current.generateVoiceLeading(chords, voiceCount);
      return voiceLeading;
    } catch (error) {
      console.error('Failed to generate voice leading:', error);
      throw error;
    }
  }, []);

  const startAnalysisSession = useCallback(async (input: {
    type: 'audio' | 'midi' | 'score' | 'chord_symbols';
    data: any;
    analysis_types: string[];
    depth_level?: 'basic' | 'intermediate' | 'advanced' | 'expert';
    style_context?: string;
  }) => {
    if (!theoryEngine.current) return null;

    try {
      const sessionId = await theoryEngine.current.startAnalysisSession(input);
      
      // Update sessions list
      const session = theoryEngine.current.getAnalysisSession(sessionId);
      if (session) {
        setAnalysisSessions(prev => [...prev, session]);
      }
      
      return sessionId;
    } catch (error) {
      console.error('Failed to start analysis session:', error);
      throw error;
    }
  }, []);

  const requestComposition = useCallback(async (request: {
    type: 'chord_progression' | 'melody' | 'harmony' | 'complete_piece';
    parameters: any;
    constraints?: any[];
    preferences?: any[];
  }) => {
    if (!theoryEngine.current) return null;

    try {
      const requestId = await theoryEngine.current.requestComposition(request);
      
      // Update requests list
      const generationRequest = theoryEngine.current.getGenerationRequest(requestId);
      if (generationRequest) {
        setGenerationRequests(prev => [...prev, generationRequest]);
      }
      
      return requestId;
    } catch (error) {
      console.error('Failed to request composition:', error);
      throw error;
    }
  }, []);

  const getChordProgression = useCallback((progressionId: string) => {
    if (!theoryEngine.current) return null;
    return theoryEngine.current.getChordProgression(progressionId);
  }, []);

  const getAnalysisSession = useCallback((sessionId: string) => {
    if (!theoryEngine.current) return null;
    return theoryEngine.current.getAnalysisSession(sessionId);
  }, []);

  const getGenerationRequest = useCallback((requestId: string) => {
    if (!theoryEngine.current) return null;
    return theoryEngine.current.getGenerationRequest(requestId);
  }, []);

  return {
    isInitialized,
    chordProgressions,
    analysisSessions,
    generationRequests,
    knowledgeBase,
    analyzeKey,
    analyzeChordProgression,
    generateChordProgression,
    analyzeHarmonicFunction,
    generateVoiceLeading,
    startAnalysisSession,
    requestComposition,
    getChordProgression,
    getAnalysisSession,
    getGenerationRequest,
    refreshData: loadMusicTheoryData,
  };
}

/**
 * Hook for chord progression analysis and generation
 */
export function useChordProgressions() {
  const { 
    chordProgressions, 
    analyzeChordProgression, 
    generateChordProgression,
    getChordProgression 
  } = useMusicTheory();

  const [selectedProgression, setSelectedProgression] = useState<string | null>(null);

  const analyzeProgression = useCallback(async (chords: string[], key?: MusicalKey) => {
    const progression = await analyzeChordProgression(chords, key);
    if (progression) {
      setSelectedProgression(progression.id);
    }
    return progression;
  }, [analyzeChordProgression]);

  const generateProgression = useCallback(async (parameters: {
    key?: MusicalKey;
    length?: number;
    style?: string;
    complexity?: number;
  }) => {
    const progression = await generateChordProgression(parameters);
    if (progression) {
      setSelectedProgression(progression.id);
    }
    return progression;
  }, [generateChordProgression]);

  const getCurrentProgression = useCallback(() => {
    if (!selectedProgression) return null;
    return getChordProgression(selectedProgression);
  }, [selectedProgression, getChordProgression]);

  return {
    chordProgressions,
    selectedProgression,
    setSelectedProgression,
    analyzeProgression,
    generateProgression,
    getCurrentProgression,
  };
}

/**
 * Hook for harmonic analysis features
 */
export function useHarmonicAnalysis() {
  const { analyzeKey, analyzeHarmonicFunction, generateVoiceLeading } = useMusicTheory();
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const performHarmonicAnalysis = useCallback(async (input: {
    chords: string[];
    key?: MusicalKey;
    include_voice_leading?: boolean;
  }) => {
    setIsAnalyzing(true);
    try {
      // Analyze key if not provided
      const key = input.key || await analyzeKey({ chords: input.chords });
      if (!key) throw new Error('Could not determine key');

      // Parse chords (mock implementation)
      const parsedChords: Chord[] = input.chords.map(chord => ({
        root: { pitch_class: chord.charAt(0) as any, octave: 4, frequency: 440, midi_number: 60, enharmonic_equivalents: [], preferred_spelling: chord.charAt(0) },
        quality: 'major' as any,
        inversion: 0,
        bass_note: { pitch_class: chord.charAt(0) as any, octave: 3, frequency: 220, midi_number: 48, enharmonic_equivalents: [], preferred_spelling: chord.charAt(0) },
        chord_tones: [],
        extensions: [],
        alterations: [],
        voicing: {} as any,
        voice_leading: {} as any,
        roman_numeral: 'I',
        function: 'tonic' as any,
        tension_level: 0.2,
        stability: 0.8,
        key_context: key,
        confidence: 0.9,
        analysis_method: 'symbol_parsing',
        alternative_interpretations: [],
      }));

      // Analyze harmonic functions
      const functions = await analyzeHarmonicFunction(parsedChords, key);

      // Generate voice leading if requested
      let voiceLeading = null;
      if (input.include_voice_leading) {
        voiceLeading = await generateVoiceLeading(parsedChords);
      }

      const results = {
        key,
        chords: parsedChords,
        harmonic_functions: functions,
        voice_leading: voiceLeading,
        analysis_timestamp: Date.now(),
      };

      setAnalysisResults(results);
      return results;
    } catch (error) {
      console.error('Harmonic analysis failed:', error);
      throw error;
    } finally {
      setIsAnalyzing(false);
    }
  }, [analyzeKey, analyzeHarmonicFunction, generateVoiceLeading]);

  return {
    analysisResults,
    isAnalyzing,
    performHarmonicAnalysis,
    clearResults: () => setAnalysisResults(null),
  };
}

/**
 * Hook for AI composition assistance
 */
export function useCompositionAssistant() {
  const { requestComposition, getGenerationRequest } = useMusicTheory();
  const [activeRequests, setActiveRequests] = useState<Map<string, GenerationRequest>>(new Map());

  const generateChords = useCallback(async (parameters: {
    key?: string;
    length?: number;
    style?: string;
    complexity?: number;
  }) => {
    const requestId = await requestComposition({
      type: 'chord_progression',
      parameters,
    });

    if (requestId) {
      const request = getGenerationRequest(requestId);
      if (request) {
        setActiveRequests(prev => new Map(prev.set(requestId, request)));
      }
    }

    return requestId;
  }, [requestComposition, getGenerationRequest]);

  const generateMelody = useCallback(async (parameters: {
    key?: string;
    range?: [string, string];
    length?: number;
    style?: string;
  }) => {
    const requestId = await requestComposition({
      type: 'melody',
      parameters,
    });

    if (requestId) {
      const request = getGenerationRequest(requestId);
      if (request) {
        setActiveRequests(prev => new Map(prev.set(requestId, request)));
      }
    }

    return requestId;
  }, [requestComposition, getGenerationRequest]);

  const generateHarmony = useCallback(async (parameters: {
    melody?: string[];
    key?: string;
    style?: string;
    voice_count?: number;
  }) => {
    const requestId = await requestComposition({
      type: 'harmony',
      parameters,
    });

    if (requestId) {
      const request = getGenerationRequest(requestId);
      if (request) {
        setActiveRequests(prev => new Map(prev.set(requestId, request)));
      }
    }

    return requestId;
  }, [requestComposition, getGenerationRequest]);

  const getRequestStatus = useCallback((requestId: string) => {
    const request = activeRequests.get(requestId) || getGenerationRequest(requestId);
    return request?.status || 'unknown';
  }, [activeRequests, getGenerationRequest]);

  const getRequestProgress = useCallback((requestId: string) => {
    const request = activeRequests.get(requestId) || getGenerationRequest(requestId);
    return request?.progress || 0;
  }, [activeRequests, getGenerationRequest]);

  const getRequestResult = useCallback((requestId: string) => {
    const request = activeRequests.get(requestId) || getGenerationRequest(requestId);
    return request?.generated_content || null;
  }, [activeRequests, getGenerationRequest]);

  return {
    activeRequests: Array.from(activeRequests.values()),
    generateChords,
    generateMelody,
    generateHarmony,
    getRequestStatus,
    getRequestProgress,
    getRequestResult,
  };
}

/**
 * Hook for music theory knowledge base
 */
export function useMusicTheoryKnowledge() {
  const { knowledgeBase } = useMusicTheory();

  const getScales = useCallback(() => {
    return knowledgeBase?.scales || [];
  }, [knowledgeBase]);

  const getChords = useCallback(() => {
    return knowledgeBase?.chords || [];
  }, [knowledgeBase]);

  const getProgressions = useCallback(() => {
    return knowledgeBase?.progressions || [];
  }, [knowledgeBase]);

  const getCadences = useCallback(() => {
    return knowledgeBase?.cadences || [];
  }, [knowledgeBase]);

  const getVoiceLeadingRules = useCallback(() => {
    return knowledgeBase?.voice_leading_rules || [];
  }, [knowledgeBase]);

  const getStylePeriods = useCallback(() => {
    return knowledgeBase?.style_periods || [];
  }, [knowledgeBase]);

  const getGenreCharacteristics = useCallback(() => {
    return knowledgeBase?.genre_characteristics || [];
  }, [knowledgeBase]);

  const searchKnowledge = useCallback((query: string, category?: string) => {
    if (!knowledgeBase) return [];

    const results: any[] = [];
    
    // Search scales
    if (!category || category === 'scales') {
      const scaleResults = knowledgeBase.scales.filter(scale => 
        scale.name.toLowerCase().includes(query.toLowerCase()) ||
        scale.origin.toLowerCase().includes(query.toLowerCase())
      );
      results.push(...scaleResults.map(s => ({ type: 'scale', data: s })));
    }

    // Search chords
    if (!category || category === 'chords') {
      const chordResults = knowledgeBase.chords.filter(chord => 
        chord.name.toLowerCase().includes(query.toLowerCase()) ||
        chord.symbol.toLowerCase().includes(query.toLowerCase())
      );
      results.push(...chordResults.map(c => ({ type: 'chord', data: c })));
    }

    return results;
  }, [knowledgeBase]);

  return {
    knowledgeBase,
    getScales,
    getChords,
    getProgressions,
    getCadences,
    getVoiceLeadingRules,
    getStylePeriods,
    getGenreCharacteristics,
    searchKnowledge,
  };
}
