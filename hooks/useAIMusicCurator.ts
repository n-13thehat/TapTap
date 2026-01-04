"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { AIMusicCurator } from '@/lib/ai-curator/aiMusicCurator';
import { 
  UserMusicProfile, 
  AIPlaylist, 
  SmartRadio,
  CuratorInsights,
  UserInteraction,
  CurationInput 
} from '@/lib/ai-curator/types';
import { useAuth } from './useAuth';

/**
 * Hook for AI Music Curator functionality
 */
export function useAIMusicCurator() {
  const { user } = useAuth();
  const curatorManager = useRef<AIMusicCurator | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [userProfile, setUserProfile] = useState<UserMusicProfile | null>(null);
  const [playlists, setPlaylists] = useState<AIPlaylist[]>([]);
  const [smartRadios, setSmartRadios] = useState<SmartRadio[]>([]);

  const loadUserData = useCallback(() => {
    if (!curatorManager.current || !user?.id) return;

    const profile = curatorManager.current.getUserProfile(user.id);
    setUserProfile(profile);

    const userPlaylists = curatorManager.current.getUserPlaylists(user.id);
    setPlaylists(userPlaylists);

    const userRadios = curatorManager.current.getUserRadios(user.id);
    setSmartRadios(userRadios);
  }, [user?.id]);

  // Initialize AI Music Curator
  useEffect(() => {
    if (!curatorManager.current) {
      curatorManager.current = new AIMusicCurator(user?.id);
      setIsInitialized(true);
    }
    loadUserData();
  }, [loadUserData, user?.id]);

  const analyzeUserBehavior = useCallback(async (interactions: UserInteraction[]) => {
    if (!curatorManager.current || !user?.id) return null;

    try {
      const profile = await curatorManager.current.analyzeUserBehavior(user.id, interactions);
      setUserProfile(profile);
      return profile;
    } catch (error) {
      console.error('Failed to analyze user behavior:', error);
      throw error;
    }
  }, [user?.id]);

  const generatePlaylist = useCallback(async (input: CurationInput) => {
    if (!curatorManager.current || !user?.id) return null;

    try {
      const playlist = await curatorManager.current.generatePlaylist(user.id, input);
      setPlaylists(prev => [playlist, ...prev]);
      return playlist;
    } catch (error) {
      console.error('Failed to generate playlist:', error);
      throw error;
    }
  }, [user?.id]);

  const createSmartRadio = useCallback(async (config: {
    name: string;
    seed_type: 'track' | 'artist' | 'genre' | 'mood' | 'user_taste';
    seed_values: string[];
    exploration_factor?: number;
  }) => {
    if (!curatorManager.current || !user?.id) return null;

    try {
      const radio = await curatorManager.current.createSmartRadio(user.id, config);
      setSmartRadios(prev => [radio, ...prev]);
      return radio;
    } catch (error) {
      console.error('Failed to create smart radio:', error);
      throw error;
    }
  }, [user?.id]);

  const getNextRadioTrack = useCallback(async (radioId: string, feedback?: { track_id: string; feedback_type: string }) => {
    if (!curatorManager.current) return null;

    try {
      return await curatorManager.current.getNextRadioTrack(radioId, feedback);
    } catch (error) {
      console.error('Failed to get next radio track:', error);
      return null;
    }
  }, []);

  const ratePlaylist = useCallback(async (playlistId: string, rating: number, feedback?: string) => {
    if (!curatorManager.current) return;

    try {
      await curatorManager.current.ratePlaylist(playlistId, rating, feedback);
      // Update local playlist
      setPlaylists(prev => prev.map(p => 
        p.id === playlistId ? { ...p, user_rating: rating } : p
      ));
    } catch (error) {
      console.error('Failed to rate playlist:', error);
      throw error;
    }
  }, []);

  const generateInsights = useCallback(async (period: 'week' | 'month' | 'quarter' | 'year') => {
    if (!curatorManager.current || !user?.id) return null;

    try {
      return await curatorManager.current.generateInsights(user.id, period);
    } catch (error) {
      console.error('Failed to generate insights:', error);
      throw error;
    }
  }, [user?.id]);

  return {
    isInitialized,
    userProfile,
    playlists,
    smartRadios,
    analyzeUserBehavior,
    generatePlaylist,
    createSmartRadio,
    getNextRadioTrack,
    ratePlaylist,
    generateInsights,
    refreshUserData: loadUserData,
  };
}

/**
 * Hook for playlist generation
 */
export function usePlaylistGeneration() {
  const { generatePlaylist } = useAIMusicCurator();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

  const generateAIPlaylist = useCallback(async (input: CurationInput) => {
    setIsGenerating(true);
    setGenerationProgress(0);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => Math.min(90, prev + 10));
      }, 200);

      const playlist = await generatePlaylist(input);
      
      clearInterval(progressInterval);
      setGenerationProgress(100);
      
      setTimeout(() => {
        setIsGenerating(false);
        setGenerationProgress(0);
      }, 500);

      return playlist;
    } catch (error) {
      setIsGenerating(false);
      setGenerationProgress(0);
      throw error;
    }
  }, [generatePlaylist]);

  return {
    generateAIPlaylist,
    isGenerating,
    generationProgress,
  };
}

/**
 * Hook for smart radio functionality
 */
export function useSmartRadio(radioId?: string) {
  const { smartRadios, getNextRadioTrack } = useAIMusicCurator();
  const [currentTrack, setCurrentTrack] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackHistory, setTrackHistory] = useState<string[]>([]);

  const radio = radioId ? smartRadios.find(r => r.id === radioId) : null;

  const playNextTrack = useCallback(async (feedback?: { track_id: string; feedback_type: string }) => {
    if (!radioId) return;

    try {
      const nextTrack = await getNextRadioTrack(radioId, feedback);
      if (nextTrack) {
        if (currentTrack) {
          setTrackHistory(prev => [currentTrack, ...prev.slice(0, 9)]); // Keep last 10
        }
        setCurrentTrack(nextTrack);
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Failed to play next track:', error);
    }
  }, [radioId, getNextRadioTrack, currentTrack]);

  const provideFeedback = useCallback(async (feedbackType: 'thumbs_up' | 'thumbs_down' | 'skip') => {
    if (!currentTrack) return;

    await playNextTrack({
      track_id: currentTrack,
      feedback_type: feedbackType,
    });
  }, [currentTrack, playNextTrack]);

  const skipTrack = useCallback(() => {
    provideFeedback('skip');
  }, [provideFeedback]);

  const likeTrack = useCallback(() => {
    provideFeedback('thumbs_up');
  }, [provideFeedback]);

  const dislikeTrack = useCallback(() => {
    provideFeedback('thumbs_down');
  }, [provideFeedback]);

  return {
    radio,
    currentTrack,
    isPlaying,
    trackHistory,
    playNextTrack,
    skipTrack,
    likeTrack,
    dislikeTrack,
    setIsPlaying,
  };
}

/**
 * Hook for music insights
 */
export function useMusicInsights() {
  const { generateInsights } = useAIMusicCurator();
  const [insights, setInsights] = useState<CuratorInsights | null>(null);
  const [loading, setLoading] = useState(false);

  const loadInsights = useCallback(async (period: 'week' | 'month' | 'quarter' | 'year') => {
    setLoading(true);
    try {
      const newInsights = await generateInsights(period);
      setInsights(newInsights);
    } catch (error) {
      console.error('Failed to load insights:', error);
    } finally {
      setLoading(false);
    }
  }, [generateInsights]);

  return {
    insights,
    loading,
    loadInsights,
  };
}
