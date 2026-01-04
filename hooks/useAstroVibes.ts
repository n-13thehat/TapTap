"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { AstroVibesManager } from '@/lib/astrovibes/astroVibesManager';
import { 
  AstrologicalProfile, 
  DailyTransit, 
  VibeProfile, 
  VibeMode,
  AstroCompatibility,
  AstroSettings,
  ZodiacSign 
} from '@/lib/astrovibes/types';
import { useAuth } from './useAuth';

/**
 * Hook for AstroVibes functionality
 */
export function useAstroVibes() {
  const { user } = useAuth();
  const astroManager = useRef<AstroVibesManager | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [profile, setProfile] = useState<AstrologicalProfile | null>(null);
  const [currentVibe, setCurrentVibe] = useState<VibeProfile | null>(null);
  const [vibeModes, setVibeModes] = useState<VibeMode[]>([]);

  const loadProfile = useCallback(() => {
    if (!astroManager.current || !user?.id) return;

    const userProfile = astroManager.current.getProfile(user.id);
    setProfile(userProfile);
  }, [user?.id]);

  const loadVibeModes = useCallback(() => {
    if (!astroManager.current) return;

    // In a real implementation, this would fetch user's vibe modes
    setVibeModes([]);
  }, []);

  // Initialize AstroVibes manager
  useEffect(() => {
    if (!astroManager.current) {
      astroManager.current = new AstroVibesManager(user?.id);
      setIsInitialized(true);
    }
    loadProfile();
    loadVibeModes();
  }, [loadProfile, loadVibeModes, user?.id]);

  // Subscribe to vibe updates
  useEffect(() => {
    if (!astroManager.current || !user?.id) return;

    const unsubscribe = astroManager.current.subscribeToVibes(user.id, (vibe) => {
      setCurrentVibe(vibe);
    });

    return unsubscribe;
  }, [user?.id, isInitialized]);

  const createProfile = useCallback(async (birthData: {
    birth_date: string;
    birth_time?: string;
    birth_location: {
      city: string;
      country: string;
      latitude: number;
      longitude: number;
    };
    timezone: string;
  }) => {
    if (!astroManager.current) return null;

    try {
      const profileId = await astroManager.current.createProfile(birthData);
      loadProfile();
      return profileId;
    } catch (error) {
      console.error('Failed to create astrological profile:', error);
      throw error;
    }
  }, [loadProfile]);

  const generateDailyTransit = useCallback(async () => {
    if (!astroManager.current || !user?.id) return null;

    try {
      return await astroManager.current.generateDailyTransit(user.id);
    } catch (error) {
      console.error('Failed to generate daily transit:', error);
      return null;
    }
  }, [user?.id]);

  const createVibeMode = useCallback((vibeModeData: Omit<VibeMode, 'id' | 'created_at' | 'usage_count'>) => {
    if (!astroManager.current) return null;

    try {
      const vibeModeId = astroManager.current.createVibeMode(vibeModeData);
      loadVibeModes();
      return vibeModeId;
    } catch (error) {
      console.error('Failed to create vibe mode:', error);
      throw error;
    }
  }, [loadVibeModes]);

  const activateVibeMode = useCallback((vibeModeId: string) => {
    if (!astroManager.current || !user?.id) return;

    try {
      astroManager.current.activateVibeMode(vibeModeId, user.id);
      loadVibeModes();
    } catch (error) {
      console.error('Failed to activate vibe mode:', error);
      throw error;
    }
  }, [user?.id, loadVibeModes]);

  const getMusicRecommendations = useCallback(() => {
    if (!astroManager.current || !user?.id) return [];

    return astroManager.current.getMusicRecommendations(user.id);
  }, [user?.id]);

  return {
    isInitialized,
    profile,
    currentVibe,
    vibeModes,
    createProfile,
    generateDailyTransit,
    createVibeMode,
    activateVibeMode,
    getMusicRecommendations,
    refreshProfile: loadProfile,
    refreshVibeModes: loadVibeModes,
  };
}

/**
 * Hook for astrological compatibility
 */
export function useAstroCompatibility() {
  const { user } = useAuth();
  const astroManager = useRef<AstroVibesManager | null>(null);
  const [compatibilities, setCompatibilities] = useState<Map<string, AstroCompatibility>>(new Map());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!astroManager.current) {
      astroManager.current = new AstroVibesManager(user?.id);
    }
  }, [user?.id]);

  const calculateCompatibility = useCallback(async (otherUserId: string) => {
    if (!astroManager.current || !user?.id) return null;

    setLoading(true);
    try {
      const compatibility = await astroManager.current.calculateCompatibility(user.id, otherUserId);
      if (compatibility) {
        setCompatibilities(prev => new Map(prev.set(`${user.id}_${otherUserId}`, compatibility)));
      }
      return compatibility;
    } catch (error) {
      console.error('Failed to calculate compatibility:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const getCompatibility = useCallback((otherUserId: string) => {
    return compatibilities.get(`${user?.id}_${otherUserId}`) || null;
  }, [compatibilities, user?.id]);

  return {
    calculateCompatibility,
    getCompatibility,
    compatibilities: Array.from(compatibilities.values()),
    loading,
  };
}

/**
 * Hook for AstroVibes settings
 */
export function useAstroSettings() {
  const { user } = useAuth();
  const astroManager = useRef<AstroVibesManager | null>(null);
  const [settings, setSettings] = useState<AstroSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSettings = useCallback(() => {
    if (!astroManager.current || !user?.id) return;

    setLoading(true);
    try {
      const userSettings = astroManager.current.getSettings(user.id);
      setSettings(userSettings);
    } catch (error) {
      console.error('Failed to load AstroVibes settings:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!astroManager.current) {
      astroManager.current = new AstroVibesManager(user?.id);
    }

    if (user?.id) {
      loadSettings();
    }
  }, [loadSettings, user?.id]);

  const updateSettings = useCallback(async (updates: Partial<AstroSettings>) => {
    if (!astroManager.current || !user?.id) return;

    try {
      astroManager.current.updateSettings(user.id, updates);
      loadSettings();
    } catch (error) {
      console.error('Failed to update AstroVibes settings:', error);
      throw error;
    }
  }, [user?.id, loadSettings]);

  const toggleDailyInsights = useCallback(async () => {
    if (!settings) return;

    await updateSettings({
      daily_insights: !settings.daily_insights,
    });
  }, [settings, updateSettings]);

  const toggleTransitAlerts = useCallback(async () => {
    if (!settings) return;

    await updateSettings({
      transit_alerts: !settings.transit_alerts,
    });
  }, [settings, updateSettings]);

  const setProfileVisibility = useCallback(async (visibility: AstroSettings['profile_visibility']) => {
    await updateSettings({
      profile_visibility: visibility,
    });
  }, [updateSettings]);

  const setMusicIntegrationLevel = useCallback(async (level: AstroSettings['music_integration_level']) => {
    await updateSettings({
      music_integration_level: level,
    });
  }, [updateSettings]);

  return {
    settings,
    loading,
    updateSettings,
    toggleDailyInsights,
    toggleTransitAlerts,
    setProfileVisibility,
    setMusicIntegrationLevel,
    refreshSettings: loadSettings,
  };
}

/**
 * Hook for zodiac sign information
 */
export function useZodiacInfo() {
  const getSignInfo = useCallback((sign: ZodiacSign) => {
    const signData = {
      aries: {
        element: 'fire' as const,
        modality: 'cardinal' as const,
        ruling_planet: 'mars' as const,
        symbol: '♈',
        date_range: 'March 21 - April 19',
        keywords: ['pioneering', 'energetic', 'bold', 'competitive'],
        strengths: ['leadership', 'courage', 'determination', 'enthusiasm'],
        challenges: ['impatience', 'impulsiveness', 'aggression', 'selfishness'],
        preferred_genres: ['rock', 'electronic', 'punk', 'metal'],
        typical_tempo: 'fast',
        mood_associations: ['energetic', 'passionate', 'dynamic'],
        colors: ['red', 'orange', 'bright yellow'],
        gemstones: ['diamond', 'ruby', 'bloodstone'],
        most_compatible: ['leo', 'sagittarius', 'gemini', 'aquarius'],
        least_compatible: ['cancer', 'capricorn'],
      },
      taurus: {
        element: 'earth' as const,
        modality: 'fixed' as const,
        ruling_planet: 'venus' as const,
        symbol: '♉',
        date_range: 'April 20 - May 20',
        keywords: ['stable', 'practical', 'sensual', 'determined'],
        strengths: ['reliability', 'patience', 'devotion', 'responsibility'],
        challenges: ['stubbornness', 'possessiveness', 'materialism', 'laziness'],
        preferred_genres: ['classical', 'jazz', 'r&b', 'folk'],
        typical_tempo: 'slow to medium',
        mood_associations: ['grounded', 'sensual', 'peaceful'],
        colors: ['green', 'pink', 'earth tones'],
        gemstones: ['emerald', 'rose quartz', 'sapphire'],
        most_compatible: ['virgo', 'capricorn', 'cancer', 'pisces'],
        least_compatible: ['leo', 'aquarius'],
      },
      // Add more signs as needed...
    };

    return signData[sign as keyof typeof signData] || null;
  }, []);

  const getElementInfo = useCallback((element: string) => {
    const elementData = {
      fire: {
        signs: ['aries', 'leo', 'sagittarius'],
        characteristics: ['energetic', 'passionate', 'creative', 'spontaneous'],
        music_preferences: ['high energy', 'rhythmic', 'bold', 'expressive'],
        colors: ['red', 'orange', 'yellow'],
      },
      earth: {
        signs: ['taurus', 'virgo', 'capricorn'],
        characteristics: ['practical', 'stable', 'grounded', 'reliable'],
        music_preferences: ['structured', 'melodic', 'traditional', 'acoustic'],
        colors: ['brown', 'green', 'beige'],
      },
      air: {
        signs: ['gemini', 'libra', 'aquarius'],
        characteristics: ['intellectual', 'communicative', 'social', 'adaptable'],
        music_preferences: ['complex', 'innovative', 'lyrical', 'diverse'],
        colors: ['light blue', 'yellow', 'white'],
      },
      water: {
        signs: ['cancer', 'scorpio', 'pisces'],
        characteristics: ['emotional', 'intuitive', 'empathetic', 'creative'],
        music_preferences: ['emotional', 'atmospheric', 'flowing', 'deep'],
        colors: ['blue', 'sea green', 'silver'],
      },
    };

    return elementData[element as keyof typeof elementData] || null;
  }, []);

  return {
    getSignInfo,
    getElementInfo,
  };
}
