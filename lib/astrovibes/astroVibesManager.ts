/**
 * AstroVibes Manager
 * Core astrology system with profile management, transit calculations, and music recommendations
 */

import { 
  AstrologicalProfile, 
  DailyTransit, 
  VibeMode, 
  AstroCompatibility,
  AstroInsight,
  AstroSettings,
  ZodiacSign,
  Planet,
  Element,
  Modality,
  VibeProfile,
  MusicVibeRecommendation
} from './types';
import { eventBus, EventTypes } from '../eventBus';

export class AstroVibesManager {
  private profiles: Map<string, AstrologicalProfile> = new Map();
  private dailyTransits: Map<string, DailyTransit> = new Map();
  private vibeModes: Map<string, VibeMode> = new Map();
  private compatibilities: Map<string, AstroCompatibility> = new Map();
  private insights: Map<string, AstroInsight> = new Map();
  private settings: Map<string, AstroSettings> = new Map();
  
  private transitTimer: NodeJS.Timeout | null = null;
  private vibeSubscribers: Map<string, Set<(vibe: VibeProfile) => void>> = new Map();
  
  private userId?: string;
  private isInitialized = false;

  constructor(userId?: string) {
    this.userId = userId;
    this.initializeZodiacData();
    this.initializeDefaultVibeModes();
    this.startTransitUpdates();
    this.loadFromStorage();
    this.isInitialized = true;
  }

  /**
   * Create astrological profile from birth data
   */
  async createProfile(birthData: {
    birth_date: string;
    birth_time?: string;
    birth_location: {
      city: string;
      country: string;
      latitude: number;
      longitude: number;
    };
    timezone: string;
  }): Promise<string> {
    if (!this.userId) {
      throw new Error('User ID required to create profile');
    }

    // Calculate astrological chart
    const chartData = await this.calculateChart(birthData);
    
    const profile: AstrologicalProfile = {
      id: this.generateId(),
      user_id: this.userId,
      birth_date: birthData.birth_date,
      birth_time: birthData.birth_time,
      birth_location: {
        ...birthData.birth_location,
        timezone_offset: this.getTimezoneOffset(birthData.timezone),
      },
      timezone: birthData.timezone,
      ...chartData,
      is_public: false,
      show_birth_time: !!birthData.birth_time,
      show_location: false,
      vibe_sensitivity: 'medium',
      preferred_elements: [],
      preferred_modalities: [],
      created_at: Date.now(),
      updated_at: Date.now(),
      last_transit_update: 0,
      accuracy_level: birthData.birth_time ? 'precise' : 'basic',
    };

    this.profiles.set(profile.id, profile);
    
    // Generate initial daily transit
    await this.generateDailyTransit(this.userId);
    
    // Create default settings
    this.createDefaultSettings(this.userId);
    
    this.persistToStorage();
    
    console.log(`Astrological profile created: ${profile.sun_sign} sun, ${profile.moon_sign} moon, ${profile.rising_sign} rising`);
    return profile.id;
  }

  /**
   * Get user's astrological profile
   */
  getProfile(userId: string): AstrologicalProfile | null {
    return Array.from(this.profiles.values()).find(p => p.user_id === userId) || null;
  }

  /**
   * Generate daily transit and vibe analysis
   */
  async generateDailyTransit(userId: string): Promise<DailyTransit | null> {
    const profile = this.getProfile(userId);
    if (!profile) return null;

    const today = new Date().toISOString().split('T')[0];
    const transitKey = `${userId}_${today}`;
    
    // Check if already calculated today
    const existing = this.dailyTransits.get(transitKey);
    if (existing && existing.expires_at > Date.now()) {
      return existing;
    }

    // Calculate current transits
    const transits = await this.calculateCurrentTransits(profile);
    const moonPhase = await this.calculateMoonPhase();
    
    // Analyze overall vibe
    const overallVibe = this.analyzeVibeProfile(transits, moonPhase, profile);
    
    // Generate music recommendations
    const musicRecommendations = this.generateMusicRecommendations(overallVibe, profile);
    
    const dailyTransit: DailyTransit = {
      id: this.generateId(),
      date: today,
      user_id: userId,
      transits,
      moon_phase: moonPhase,
      dominant_elements: this.calculateDominantElements(transits),
      dominant_modalities: this.calculateDominantModalities(transits),
      overall_vibe: overallVibe,
      music_recommendations: musicRecommendations,
      calculated_at: Date.now(),
      expires_at: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
    };

    this.dailyTransits.set(transitKey, dailyTransit);
    
    // Update profile's last transit update
    profile.last_transit_update = Date.now();
    
    // Notify subscribers
    this.notifyVibeSubscribers(userId, overallVibe);
    
    // Check for vibe mode activations
    await this.checkVibeModeTriggers(userId, dailyTransit);
    
    this.persistToStorage();
    
    console.log(`Daily transit generated for ${userId}: ${overallVibe.primary_theme} theme`);
    return dailyTransit;
  }

  /**
   * Get current vibe profile for user
   */
  getCurrentVibe(userId: string): VibeProfile | null {
    const today = new Date().toISOString().split('T')[0];
    const transitKey = `${userId}_${today}`;
    const dailyTransit = this.dailyTransits.get(transitKey);
    
    return dailyTransit?.overall_vibe || null;
  }

  /**
   * Subscribe to vibe updates
   */
  subscribeToVibes(userId: string, callback: (vibe: VibeProfile) => void): () => void {
    if (!this.vibeSubscribers.has(userId)) {
      this.vibeSubscribers.set(userId, new Set());
    }
    
    this.vibeSubscribers.get(userId)!.add(callback);

    // Send current vibe immediately
    const currentVibe = this.getCurrentVibe(userId);
    if (currentVibe) {
      callback(currentVibe);
    }

    return () => {
      const subscribers = this.vibeSubscribers.get(userId);
      if (subscribers) {
        subscribers.delete(callback);
        if (subscribers.size === 0) {
          this.vibeSubscribers.delete(userId);
        }
      }
    };
  }

  /**
   * Create custom vibe mode
   */
  createVibeMode(vibeModeData: Omit<VibeMode, 'id' | 'created_at' | 'usage_count'>): string {
    const vibeMode: VibeMode = {
      ...vibeModeData,
      id: this.generateId(),
      created_at: Date.now(),
      usage_count: 0,
    };

    this.vibeModes.set(vibeMode.id, vibeMode);
    this.persistToStorage();

    console.log(`Vibe mode created: ${vibeMode.name}`);
    return vibeMode.id;
  }

  /**
   * Activate vibe mode
   */
  activateVibeMode(vibeModeId: string, userId: string): void {
    const vibeMode = this.vibeModes.get(vibeModeId);
    if (!vibeMode) {
      throw new Error('Vibe mode not found');
    }

    // Deactivate other vibe modes
    Array.from(this.vibeModes.values()).forEach(mode => {
      mode.is_active = false;
    });

    // Activate selected mode
    vibeMode.is_active = true;
    vibeMode.usage_count++;

    this.persistToStorage();

    // Emit vibe mode activation event
    eventBus.emit(EventTypes.VIBE_MODE_ACTIVATED, {
      vibeModeId,
      userId,
      modeName: vibeMode.name,
      musicProfile: vibeMode.music_profile,
    }, {
      userId,
      source: 'astrovibes-manager',
    });

    console.log(`Vibe mode activated: ${vibeMode.name}`);
  }

  /**
   * Calculate compatibility between two users
   */
  async calculateCompatibility(userId1: string, userId2: string): Promise<AstroCompatibility | null> {
    const profile1 = this.getProfile(userId1);
    const profile2 = this.getProfile(userId2);
    
    if (!profile1 || !profile2) return null;

    const compatibilityKey = `${userId1}_${userId2}`;
    
    // Check if already calculated recently
    const existing = this.compatibilities.get(compatibilityKey);
    if (existing && existing.expires_at > Date.now()) {
      return existing;
    }

    // Calculate various compatibility scores
    const elementCompatibility = this.calculateElementCompatibility(profile1, profile2);
    const modalityCompatibility = this.calculateModalityCompatibility(profile1, profile2);
    const sunMoonCompatibility = this.calculateSunMoonCompatibility(profile1, profile2);
    const venusMarsCompatibility = this.calculateVenusMarsCompatibility(profile1, profile2);
    
    // Calculate overall score
    const overallScore = Math.round(
      (elementCompatibility + modalityCompatibility + sunMoonCompatibility + venusMarsCompatibility) / 4
    );

    // Analyze aspects between charts
    const harmonious = this.findHarmoniousAspects(profile1, profile2);
    const challenging = this.findChallengingAspects(profile1, profile2);

    // Calculate music compatibility
    const musicSyncScore = this.calculateMusicCompatibility(profile1, profile2);

    const compatibility: AstroCompatibility = {
      user1_id: userId1,
      user2_id: userId2,
      overall_score: overallScore,
      element_compatibility: elementCompatibility,
      modality_compatibility: modalityCompatibility,
      sun_moon_compatibility: sunMoonCompatibility,
      venus_mars_compatibility: venusMarsCompatibility,
      harmonious_aspects: harmonious,
      challenging_aspects: challenging,
      music_sync_score: musicSyncScore,
      shared_vibe_preferences: this.findSharedVibePreferences(profile1, profile2),
      complementary_tastes: this.findComplementaryTastes(profile1, profile2),
      collaborative_playlist_suggestions: this.generateCollaborativePlaylistSuggestions(profile1, profile2),
      shared_listening_times: this.calculateOptimalListeningTimes(profile1, profile2),
      calculated_at: Date.now(),
      expires_at: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
    };

    this.compatibilities.set(compatibilityKey, compatibility);
    this.persistToStorage();

    console.log(`Compatibility calculated: ${overallScore}% overall, ${musicSyncScore}% music sync`);
    return compatibility;
  }

  /**
   * Get music recommendations based on current vibes
   */
  getMusicRecommendations(userId: string): MusicVibeRecommendation[] {
    const currentVibe = this.getCurrentVibe(userId);
    if (!currentVibe) return [];

    const profile = this.getProfile(userId);
    if (!profile) return [];

    return this.generateMusicRecommendations(currentVibe, profile);
  }

  /**
   * Update user settings
   */
  updateSettings(userId: string, settings: Partial<AstroSettings>): void {
    const current = this.settings.get(userId) || this.createDefaultSettings(userId);
    const updated = {
      ...current,
      ...settings,
      updated_at: Date.now(),
    };

    this.settings.set(userId, updated);
    this.persistToStorage();

    console.log(`AstroVibes settings updated for user: ${userId}`);
  }

  /**
   * Get user settings
   */
  getSettings(userId: string): AstroSettings {
    return this.settings.get(userId) || this.createDefaultSettings(userId);
  }

  // Private methods
  private async calculateChart(birthData: any): Promise<
    Pick<AstrologicalProfile, 'sun_sign' | 'moon_sign' | 'rising_sign' | 'planets' | 'houses' | 'aspects'>
  > {
    // Mock astrological calculations
    // In a real implementation, this would use an ephemeris library
    
    const sunSign = this.calculateSunSign(birthData.birth_date);
    const moonSign = this.calculateMoonSign(birthData.birth_date, birthData.birth_time);
    const risingSign = this.calculateRisingSign(birthData.birth_date, birthData.birth_time, birthData.birth_location);
    
    const planets = this.calculatePlanetPositions(birthData);
    const houses = this.calculateHousePositions(birthData);
    const aspects = this.calculateAspects(planets);

    return {
      sun_sign: sunSign,
      moon_sign: moonSign,
      rising_sign: risingSign,
      planets,
      houses,
      aspects,
    };
  }

  private calculateSunSign(birthDate: string): ZodiacSign {
    const date = new Date(birthDate);
    const month = date.getMonth() + 1;
    const day = date.getDate();

    // Simplified sun sign calculation
    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'aries';
    if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'taurus';
    if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'gemini';
    if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'cancer';
    if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'leo';
    if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'virgo';
    if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'libra';
    if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'scorpio';
    if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 'sagittarius';
    if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 'capricorn';
    if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'aquarius';
    return 'pisces';
  }

  private calculateMoonSign(birthDate: string, birthTime?: string): ZodiacSign {
    // Mock calculation - would use ephemeris data
    const signs: ZodiacSign[] = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];
    const date = new Date(birthDate);
    const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    return signs[dayOfYear % 12];
  }

  private calculateRisingSign(birthDate: string, birthTime?: string, location?: any): ZodiacSign {
    // Mock calculation - would require birth time and location
    if (!birthTime) {
      return this.calculateSunSign(birthDate); // Fallback to sun sign
    }
    
    const signs: ZodiacSign[] = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];
    const timeHash = birthTime.split(':').reduce((acc, val) => acc + parseInt(val), 0);
    return signs[timeHash % 12];
  }

  private calculatePlanetPositions(birthData: any): any[] {
    // Mock planet positions
    const planets: Planet[] = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
    const signs: ZodiacSign[] = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];
    
    return planets.map((planet, index) => ({
      planet,
      sign: signs[index % 12],
      degree: Math.floor(Math.random() * 30),
      house: (index % 12) + 1,
      retrograde: Math.random() < 0.2,
    }));
  }

  private calculateHousePositions(birthData: any): any[] {
    const signs: ZodiacSign[] = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];
    
    return Array.from({ length: 12 }, (_, index) => ({
      house: index + 1,
      sign: signs[index % 12],
      degree: Math.floor(Math.random() * 30),
      cusp_degree: Math.floor(Math.random() * 30),
    }));
  }

  private calculateAspects(planets: any[]): any[] {
    // Mock aspect calculations
    const aspects = [];
    const aspectTypes = ['conjunction', 'opposition', 'trine', 'square', 'sextile'];
    
    for (let i = 0; i < planets.length; i++) {
      for (let j = i + 1; j < planets.length; j++) {
        if (Math.random() < 0.3) { // 30% chance of aspect
          aspects.push({
            planet1: planets[i].planet,
            planet2: planets[j].planet,
            aspect_type: aspectTypes[Math.floor(Math.random() * aspectTypes.length)],
            degree: Math.floor(Math.random() * 360),
            orb: Math.floor(Math.random() * 8) + 1,
            applying: Math.random() < 0.5,
          });
        }
      }
    }
    
    return aspects;
  }

  private async calculateCurrentTransits(profile: AstrologicalProfile): Promise<any[]> {
    // Mock transit calculations
    const transits: any[] = [];
    const planets: Planet[] = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn'];
    const aspectTypes = ['conjunction', 'opposition', 'trine', 'square', 'sextile'];
    
    planets.forEach(transitingPlanet => {
      profile.planets.forEach(natalPlanet => {
        if (Math.random() < 0.1) { // 10% chance of significant transit
          transits.push({
            transiting_planet: transitingPlanet,
            natal_planet: natalPlanet.planet,
            aspect_type: aspectTypes[Math.floor(Math.random() * aspectTypes.length)],
            exact_time: Date.now() + Math.random() * 86400000, // Within 24 hours
            orb: Math.random() * 3,
            influence_strength: Math.floor(Math.random() * 100),
            vibe_impact: {
              energy_delta: Math.floor(Math.random() * 100) - 50,
              mood_shift: 'Energizing influence from planetary alignment',
              music_influence: 'Increased appreciation for rhythmic complexity',
              duration_hours: Math.floor(Math.random() * 12) + 6,
            },
          });
        }
      });
    });
    
    return transits;
  }

  private async calculateMoonPhase(): Promise<any> {
    // Mock moon phase calculation
    const phases = ['new', 'waxing_crescent', 'first_quarter', 'waxing_gibbous', 'full', 'waning_gibbous', 'last_quarter', 'waning_crescent'];
    const signs: ZodiacSign[] = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];
    
    return {
      phase: phases[Math.floor(Math.random() * phases.length)],
      illumination: Math.floor(Math.random() * 100),
      sign: signs[Math.floor(Math.random() * signs.length)],
      degree: Math.floor(Math.random() * 30),
    };
  }

  private analyzeVibeProfile(transits: any[], moonPhase: any, profile: AstrologicalProfile): VibeProfile {
    // Analyze transits and moon phase to determine current vibe
    const energyLevel = Math.max(0, Math.min(100, 50 + transits.reduce((sum, t) => sum + (t.vibe_impact?.energy_delta || 0), 0)));
    const emotionalIntensity = moonPhase.illumination;
    const creativityBoost = Math.floor(Math.random() * 100);
    const socialInclination = Math.floor(Math.random() * 100);
    const introspectionLevel = 100 - socialInclination;

    const themes = ['transformation', 'communication', 'love', 'action', 'expansion', 'discipline', 'innovation', 'spirituality'];
    const primaryTheme = themes[Math.floor(Math.random() * themes.length)];

    return {
      energy_level: energyLevel,
      emotional_intensity: emotionalIntensity,
      creativity_boost: creativityBoost,
      social_inclination: socialInclination,
      introspection_level: introspectionLevel,
      tempo_preference: energyLevel > 70 ? 'fast' : energyLevel > 40 ? 'medium' : 'slow',
      genre_affinity: this.calculateGenreAffinity(profile, energyLevel, emotionalIntensity),
      mood_tags: this.generateMoodTags(primaryTheme, energyLevel, emotionalIntensity),
      primary_theme: primaryTheme as any,
      secondary_themes: themes.filter(t => t !== primaryTheme).slice(0, 2) as any[],
    };
  }

  private calculateGenreAffinity(profile: AstrologicalProfile, energy: number, emotion: number): any[] {
    const genreMap = {
      high_energy: ['electronic', 'rock', 'pop', 'dance'],
      medium_energy: ['indie', 'alternative', 'r&b', 'funk'],
      low_energy: ['ambient', 'classical', 'jazz', 'folk'],
      high_emotion: ['soul', 'blues', 'ballad', 'opera'],
      medium_emotion: ['pop', 'rock', 'indie', 'country'],
      low_emotion: ['instrumental', 'ambient', 'minimal', 'techno'],
    };

    const energyCategory = energy > 70 ? 'high_energy' : energy > 40 ? 'medium_energy' : 'low_energy';
    const emotionCategory = emotion > 70 ? 'high_emotion' : emotion > 40 ? 'medium_emotion' : 'low_emotion';

    const energyGenres = genreMap[energyCategory] || [];
    const emotionGenres = genreMap[emotionCategory] || [];
    const allGenres = [...new Set([...energyGenres, ...emotionGenres])];

    return allGenres.map(genre => ({
      genre,
      affinity_score: Math.floor(Math.random() * 40) + 60, // 60-100
      reason: `Aligned with current ${energyCategory.replace('_', ' ')} and ${emotionCategory.replace('_', ' ')} state`,
    }));
  }

  private generateMoodTags(theme: string, energy: number, emotion: number): string[] {
    const baseTags = {
      transformation: ['evolving', 'changing', 'metamorphic'],
      communication: ['expressive', 'social', 'articulate'],
      love: ['romantic', 'affectionate', 'harmonious'],
      action: ['dynamic', 'motivated', 'driven'],
      expansion: ['optimistic', 'adventurous', 'growing'],
      discipline: ['focused', 'structured', 'determined'],
      innovation: ['creative', 'experimental', 'futuristic'],
      spirituality: ['transcendent', 'mystical', 'contemplative'],
    };

    const energyTags = energy > 70 ? ['energetic', 'vibrant', 'intense'] : 
                     energy > 40 ? ['balanced', 'steady', 'moderate'] : 
                     ['calm', 'peaceful', 'gentle'];

    const emotionTags = emotion > 70 ? ['passionate', 'deep', 'profound'] :
                       emotion > 40 ? ['warm', 'engaging', 'connected'] :
                       ['cool', 'detached', 'analytical'];

    return [...(baseTags[theme as keyof typeof baseTags] || []), ...energyTags, ...emotionTags];
  }

  private generateMusicRecommendations(vibe: VibeProfile, profile: AstrologicalProfile): MusicVibeRecommendation[] {
    const recommendations: MusicVibeRecommendation[] = [];

    // Genre recommendations based on vibe
    vibe.genre_affinity.forEach(affinity => {
      recommendations.push({
        recommendation_type: 'genre',
        value: affinity.genre,
        confidence: affinity.affinity_score,
        reason: affinity.reason,
        astrological_basis: [`${vibe.primary_theme} theme`, `${profile.sun_sign} sun influence`],
        valid_until: Date.now() + (24 * 60 * 60 * 1000),
      });
    });

    // Tempo recommendations
    recommendations.push({
      recommendation_type: 'tempo',
      value: vibe.tempo_preference,
      confidence: 85,
      reason: `Current energy level (${vibe.energy_level}) suggests ${vibe.tempo_preference} tempo`,
      astrological_basis: ['Current planetary transits', 'Moon phase influence'],
      valid_until: Date.now() + (12 * 60 * 60 * 1000),
    });

    // Mood recommendations
    vibe.mood_tags.slice(0, 3).forEach(mood => {
      recommendations.push({
        recommendation_type: 'mood',
        value: mood,
        confidence: 75,
        reason: `Aligned with current ${vibe.primary_theme} theme`,
        astrological_basis: [`${profile.sun_sign} characteristics`, 'Current transit influences'],
        valid_until: Date.now() + (6 * 60 * 60 * 1000),
      });
    });

    return recommendations;
  }

  private calculateDominantElements(transits: any[]): Element[] {
    // Mock calculation of dominant elements from transits
    const elements: Element[] = ['fire', 'earth', 'air', 'water'];
    return elements.filter(() => Math.random() < 0.5);
  }

  private calculateDominantModalities(transits: any[]): Modality[] {
    // Mock calculation of dominant modalities from transits
    const modalities: Modality[] = ['cardinal', 'fixed', 'mutable'];
    return modalities.filter(() => Math.random() < 0.5);
  }

  private notifyVibeSubscribers(userId: string, vibe: VibeProfile): void {
    const subscribers = this.vibeSubscribers.get(userId);
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(vibe);
        } catch (error) {
          console.error('Vibe subscriber callback error:', error);
        }
      });
    }
  }

  private async checkVibeModeTriggers(userId: string, dailyTransit: DailyTransit): Promise<void> {
    const userVibeModes = Array.from(this.vibeModes.values()).filter(mode => mode.auto_activate);
    
    for (const vibeMode of userVibeModes) {
      const shouldActivate = vibeMode.triggers.some(trigger => 
        this.evaluateTrigger(trigger, dailyTransit)
      );
      
      if (shouldActivate && !vibeMode.is_active) {
        this.activateVibeMode(vibeMode.id, userId);
      }
    }
  }

  private evaluateTrigger(trigger: any, dailyTransit: DailyTransit): boolean {
    // Mock trigger evaluation
    switch (trigger.type) {
      case 'moon_phase':
        return dailyTransit.moon_phase.phase === trigger.condition.moon_phase;
      case 'element_dominance':
        return dailyTransit.dominant_elements.includes(trigger.condition.dominant_element);
      case 'transit':
        return dailyTransit.transits.some(t => 
          t.transiting_planet === trigger.condition.planet &&
          t.aspect_type === trigger.condition.aspect
        );
      default:
        return false;
    }
  }

  private calculateElementCompatibility(profile1: AstrologicalProfile, profile2: AstrologicalProfile): number {
    // Mock element compatibility calculation
    const elementCompatibility = {
      fire: { fire: 85, earth: 45, air: 75, water: 35 },
      earth: { fire: 45, earth: 80, air: 40, water: 70 },
      air: { fire: 75, earth: 40, air: 85, water: 50 },
      water: { fire: 35, earth: 70, air: 50, water: 90 },
    };

    const element1 = this.getSignElement(profile1.sun_sign);
    const element2 = this.getSignElement(profile2.sun_sign);
    
    return elementCompatibility[element1]?.[element2] || 50;
  }

  private calculateModalityCompatibility(profile1: AstrologicalProfile, profile2: AstrologicalProfile): number {
    // Mock modality compatibility calculation
    return Math.floor(Math.random() * 40) + 60; // 60-100
  }

  private calculateSunMoonCompatibility(profile1: AstrologicalProfile, profile2: AstrologicalProfile): number {
    // Mock sun-moon compatibility calculation
    return Math.floor(Math.random() * 40) + 60; // 60-100
  }

  private calculateVenusMarsCompatibility(profile1: AstrologicalProfile, profile2: AstrologicalProfile): number {
    // Mock Venus-Mars compatibility calculation
    return Math.floor(Math.random() * 40) + 60; // 60-100
  }

  private findHarmoniousAspects(profile1: AstrologicalProfile, profile2: AstrologicalProfile): any[] {
    // Mock harmonious aspects between charts
    return [];
  }

  private findChallengingAspects(profile1: AstrologicalProfile, profile2: AstrologicalProfile): any[] {
    // Mock challenging aspects between charts
    return [];
  }

  private calculateMusicCompatibility(profile1: AstrologicalProfile, profile2: AstrologicalProfile): number {
    // Mock music compatibility calculation based on astrological profiles
    return Math.floor(Math.random() * 40) + 60; // 60-100
  }

  private findSharedVibePreferences(profile1: AstrologicalProfile, profile2: AstrologicalProfile): string[] {
    return ['ambient', 'electronic', 'indie'];
  }

  private findComplementaryTastes(profile1: AstrologicalProfile, profile2: AstrologicalProfile): string[] {
    return ['jazz-rock fusion', 'world music', 'experimental'];
  }

  private generateCollaborativePlaylistSuggestions(profile1: AstrologicalProfile, profile2: AstrologicalProfile): string[] {
    return ['Cosmic Harmony', 'Elemental Fusion', 'Planetary Alignment'];
  }

  private calculateOptimalListeningTimes(profile1: AstrologicalProfile, profile2: AstrologicalProfile): string[] {
    return ['Evening (7-9 PM)', 'Late night (10 PM-12 AM)', 'Early morning (6-8 AM)'];
  }

  private getSignElement(sign: ZodiacSign): Element {
    const elementMap: Record<ZodiacSign, Element> = {
      aries: 'fire', leo: 'fire', sagittarius: 'fire',
      taurus: 'earth', virgo: 'earth', capricorn: 'earth',
      gemini: 'air', libra: 'air', aquarius: 'air',
      cancer: 'water', scorpio: 'water', pisces: 'water',
    };
    return elementMap[sign];
  }

  private getTimezoneOffset(timezone: string): number {
    // Mock timezone offset calculation
    return 0;
  }

  private createDefaultSettings(userId: string): AstroSettings {
    const settings: AstroSettings = {
      user_id: userId,
      profile_visibility: 'private',
      show_compatibility: true,
      allow_vibe_sharing: false,
      daily_insights: true,
      transit_alerts: false,
      vibe_mode_suggestions: true,
      compatibility_notifications: false,
      insight_frequency: 'moderate',
      music_integration_level: 'moderate',
      auto_vibe_modes: true,
      orb_tolerance: 8,
      house_system: 'placidus',
      include_asteroids: false,
      include_fixed_stars: false,
      updated_at: Date.now(),
      onboarding_completed: false,
    };

    this.settings.set(userId, settings);
    return settings;
  }

  private initializeZodiacData(): void {
    // Initialize zodiac sign data and characteristics
    console.log('Zodiac data initialized');
  }

  private initializeDefaultVibeModes(): void {
    // Create default vibe modes
    const defaultModes: Array<Omit<VibeMode, 'id' | 'created_at' | 'usage_count'>> = [
      {
        name: 'Cosmic Flow',
        description: 'Ethereal and transcendent music for spiritual moments',
        triggers: [{
          type: 'moon_phase',
          condition: { moon_phase: 'full' },
          threshold: 80,
        }],
        music_profile: {
          preferred_genres: ['ambient', 'new age', 'classical'],
          tempo_range: [60, 90],
          energy_level: 30,
          valence: 70,
          danceability: 20,
          acousticness: 80,
          instrumentalness: 90,
          key_preferences: ['C', 'G', 'D'],
          time_signature_preferences: [4],
          mood_tags: ['peaceful', 'transcendent', 'mystical'],
        },
        color_scheme: {
          primary: '#4A90E2',
          secondary: '#7B68EE',
          accent: '#FFD700',
          background: '#1A1A2E',
          text: '#FFFFFF',
          gradient: ['#4A90E2', '#7B68EE', '#9370DB'],
        },
        visual_effects: [{
          type: 'particles',
          config: { count: 100, speed: 0.5, color: '#4A90E2' },
          intensity: 60,
        }],
        is_active: false,
        auto_activate: true,
        priority: 1,
      },
      {
        name: 'Fire Energy',
        description: 'High-energy music for dynamic and passionate moments',
        triggers: [{
          type: 'element_dominance',
          condition: { dominant_element: 'fire' },
          threshold: 70,
        }],
        music_profile: {
          preferred_genres: ['rock', 'electronic', 'pop', 'dance'],
          tempo_range: [120, 180],
          energy_level: 90,
          valence: 80,
          danceability: 85,
          acousticness: 20,
          instrumentalness: 30,
          key_preferences: ['E', 'A', 'B'],
          time_signature_preferences: [4],
          mood_tags: ['energetic', 'passionate', 'dynamic'],
        },
        color_scheme: {
          primary: '#FF4500',
          secondary: '#FF6347',
          accent: '#FFD700',
          background: '#2F1B14',
          text: '#FFFFFF',
          gradient: ['#FF4500', '#FF6347', '#FF8C00'],
        },
        visual_effects: [{
          type: 'animation',
          config: { type: 'pulse', speed: 2, intensity: 80 },
          intensity: 80,
        }],
        is_active: false,
        auto_activate: true,
        priority: 2,
      },
    ];

    defaultModes.forEach(mode => {
      this.createVibeMode(mode);
    });
  }

  private startTransitUpdates(): void {
    // Update transits every hour
    this.transitTimer = setInterval(() => {
      this.updateAllUserTransits();
    }, 60 * 60 * 1000); // 1 hour
  }

  private async updateAllUserTransits(): Promise<void> {
    const userIds = new Set(Array.from(this.profiles.values()).map(p => p.user_id));
    
    for (const userId of userIds) {
      try {
        await this.generateDailyTransit(userId);
      } catch (error) {
        console.error(`Failed to update transits for user ${userId}:`, error);
      }
    }
  }

  private generateId(): string {
    return `astro_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Storage methods
  private async persistToStorage(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      const data = {
        profiles: Array.from(this.profiles.entries()),
        dailyTransits: Array.from(this.dailyTransits.entries()),
        vibeModes: Array.from(this.vibeModes.entries()),
        compatibilities: Array.from(this.compatibilities.entries()),
        insights: Array.from(this.insights.entries()),
        settings: Array.from(this.settings.entries()),
      };

      localStorage.setItem(`taptap_astrovibes_${this.userId || 'anonymous'}`, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to persist AstroVibes data:', error);
    }
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(`taptap_astrovibes_${this.userId || 'anonymous'}`);
      if (stored) {
        const data = JSON.parse(stored);
        
        this.profiles = new Map(data.profiles || []);
        this.dailyTransits = new Map(data.dailyTransits || []);
        this.vibeModes = new Map(data.vibeModes || []);
        this.compatibilities = new Map(data.compatibilities || []);
        this.insights = new Map(data.insights || []);
        this.settings = new Map(data.settings || []);

        console.log(`AstroVibes data loaded: ${this.profiles.size} profiles, ${this.vibeModes.size} vibe modes`);
      }
    } catch (error) {
      console.error('Failed to load AstroVibes data:', error);
    }
  }

  // Cleanup
  destroy(): void {
    if (this.transitTimer) {
      clearInterval(this.transitTimer);
    }

    this.persistToStorage();
  }
}
