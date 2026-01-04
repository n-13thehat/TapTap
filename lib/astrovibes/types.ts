/**
 * AstroVibes System Types and Interfaces
 * Comprehensive astrology system for personalized music recommendations
 */

export interface AstrologicalProfile {
  id: string;
  user_id: string;
  
  // Birth data
  birth_date: string; // ISO date
  birth_time?: string; // HH:MM format
  birth_location: BirthLocation;
  timezone: string;
  
  // Calculated chart data
  sun_sign: ZodiacSign;
  moon_sign: ZodiacSign;
  rising_sign: ZodiacSign;
  planets: PlanetPosition[];
  houses: HousePosition[];
  aspects: AspectPosition[];
  
  // Profile settings
  is_public: boolean;
  show_birth_time: boolean;
  show_location: boolean;
  
  // Preferences
  vibe_sensitivity: 'low' | 'medium' | 'high';
  preferred_elements: Element[];
  preferred_modalities: Modality[];
  
  // Metadata
  created_at: number;
  updated_at: number;
  last_transit_update: number;
  accuracy_level: 'basic' | 'detailed' | 'precise'; // Based on birth time availability
}

export interface BirthLocation {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone_offset: number;
}

export type ZodiacSign = 
  | 'aries' | 'taurus' | 'gemini' | 'cancer' 
  | 'leo' | 'virgo' | 'libra' | 'scorpio' 
  | 'sagittarius' | 'capricorn' | 'aquarius' | 'pisces';

export type Planet = 
  | 'sun' | 'moon' | 'mercury' | 'venus' | 'mars' 
  | 'jupiter' | 'saturn' | 'uranus' | 'neptune' | 'pluto'
  | 'north_node' | 'south_node' | 'chiron';

export type Element = 'fire' | 'earth' | 'air' | 'water';
export type Modality = 'cardinal' | 'fixed' | 'mutable';

export interface PlanetPosition {
  planet: Planet;
  sign: ZodiacSign;
  degree: number;
  house: number;
  retrograde: boolean;
}

export interface HousePosition {
  house: number;
  sign: ZodiacSign;
  degree: number;
  cusp_degree: number;
}

export interface AspectPosition {
  planet1: Planet;
  planet2: Planet;
  aspect_type: AspectType;
  degree: number;
  orb: number;
  applying: boolean;
}

export type AspectType = 
  | 'conjunction' | 'opposition' | 'trine' | 'square' 
  | 'sextile' | 'quincunx' | 'semisextile' | 'semisquare';

export interface DailyTransit {
  id: string;
  date: string; // YYYY-MM-DD
  user_id: string;
  
  // Transit data
  transits: TransitAspect[];
  moon_phase: MoonPhase;
  dominant_elements: Element[];
  dominant_modalities: Modality[];
  
  // Vibe analysis
  overall_vibe: VibeProfile;
  music_recommendations: MusicVibeRecommendation[];
  
  // Metadata
  calculated_at: number;
  expires_at: number;
}

export interface TransitAspect {
  transiting_planet: Planet;
  natal_planet: Planet;
  aspect_type: AspectType;
  exact_time?: number; // Unix timestamp
  orb: number;
  influence_strength: number; // 0-100
  vibe_impact: VibeImpact;
}

export interface MoonPhase {
  phase: 'new' | 'waxing_crescent' | 'first_quarter' | 'waxing_gibbous' 
        | 'full' | 'waning_gibbous' | 'last_quarter' | 'waning_crescent';
  illumination: number; // 0-100
  sign: ZodiacSign;
  degree: number;
}

export interface VibeProfile {
  energy_level: number; // 0-100
  emotional_intensity: number; // 0-100
  creativity_boost: number; // 0-100
  social_inclination: number; // 0-100
  introspection_level: number; // 0-100
  
  // Musical preferences influenced by current vibes
  tempo_preference: 'slow' | 'medium' | 'fast' | 'varied';
  genre_affinity: GenreAffinity[];
  mood_tags: string[];
  
  // Dominant themes
  primary_theme: AstroTheme;
  secondary_themes: AstroTheme[];
}

export interface GenreAffinity {
  genre: string;
  affinity_score: number; // 0-100
  reason: string;
}

export type AstroTheme = 
  | 'transformation' | 'communication' | 'love' | 'action' 
  | 'expansion' | 'discipline' | 'innovation' | 'spirituality'
  | 'healing' | 'intuition' | 'grounding' | 'adventure';

export interface VibeImpact {
  energy_delta: number; // -50 to +50
  mood_shift: string;
  music_influence: string;
  duration_hours: number;
}

export interface MusicVibeRecommendation {
  recommendation_type: 'genre' | 'mood' | 'tempo' | 'artist' | 'track';
  value: string;
  confidence: number; // 0-100
  reason: string;
  astrological_basis: string[];
  valid_until: number; // Unix timestamp
}

export interface VibeMode {
  id: string;
  name: string;
  description: string;
  
  // Astrological triggers
  triggers: VibeTrigger[];
  
  // Music characteristics
  music_profile: MusicProfile;
  
  // Visual theme
  color_scheme: ColorScheme;
  visual_effects: VisualEffect[];
  
  // Activation
  is_active: boolean;
  auto_activate: boolean;
  priority: number;
  
  // Metadata
  created_at: number;
  usage_count: number;
  user_rating?: number;
}

export interface VibeTrigger {
  type: 'transit' | 'moon_phase' | 'element_dominance' | 'custom';
  condition: TriggerCondition;
  threshold: number;
  duration_hours?: number;
}

export interface TriggerCondition {
  // Transit conditions
  planet?: Planet;
  aspect?: AspectType;
  sign?: ZodiacSign;
  
  // Moon phase conditions
  moon_phase?: MoonPhase['phase'];
  illumination_range?: [number, number];
  
  // Element/modality conditions
  dominant_element?: Element;
  dominant_modality?: Modality;
  
  // Custom conditions
  custom_rule?: string;
}

export interface MusicProfile {
  preferred_genres: string[];
  tempo_range: [number, number]; // BPM
  energy_level: number; // 0-100
  valence: number; // 0-100 (musical positivity)
  danceability: number; // 0-100
  acousticness: number; // 0-100
  instrumentalness: number; // 0-100
  
  // Advanced preferences
  key_preferences: string[];
  time_signature_preferences: number[];
  mood_tags: string[];
}

export interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  gradient?: string[];
}

export interface VisualEffect {
  type: 'particles' | 'gradient' | 'animation' | 'filter';
  config: Record<string, any>;
  intensity: number; // 0-100
}

export interface AstroCompatibility {
  user1_id: string;
  user2_id: string;
  
  // Compatibility scores
  overall_score: number; // 0-100
  element_compatibility: number;
  modality_compatibility: number;
  sun_moon_compatibility: number;
  venus_mars_compatibility: number;
  
  // Detailed analysis
  harmonious_aspects: AspectPosition[];
  challenging_aspects: AspectPosition[];
  
  // Music compatibility
  music_sync_score: number; // 0-100
  shared_vibe_preferences: string[];
  complementary_tastes: string[];
  
  // Recommendations
  collaborative_playlist_suggestions: string[];
  shared_listening_times: string[];
  
  // Metadata
  calculated_at: number;
  expires_at: number;
}

export interface AstroEvent {
  id: string;
  type: 'transit' | 'lunar_event' | 'planetary_event' | 'seasonal';
  name: string;
  description: string;
  
  // Timing
  start_time: number;
  peak_time?: number;
  end_time: number;
  
  // Astrological data
  planets_involved: Planet[];
  signs_involved: ZodiacSign[];
  aspect_type?: AspectType;
  
  // Impact
  global_influence: VibeImpact;
  affected_signs: ZodiacSign[];
  
  // Music recommendations
  event_playlist_id?: string;
  recommended_genres: string[];
  
  // Metadata
  significance_level: 'minor' | 'moderate' | 'major' | 'rare';
  next_occurrence?: number;
}

export interface AstroInsight {
  id: string;
  user_id: string;
  type: 'daily' | 'weekly' | 'monthly' | 'transit_specific';
  
  // Content
  title: string;
  summary: string;
  detailed_analysis: string;
  
  // Astrological basis
  primary_influences: string[];
  supporting_transits: TransitAspect[];
  
  // Music connection
  music_recommendations: MusicVibeRecommendation[];
  playlist_suggestions: string[];
  
  // Timing
  valid_from: number;
  valid_until: number;
  
  // Engagement
  is_read: boolean;
  user_feedback?: 'helpful' | 'neutral' | 'not_helpful';
  
  // Metadata
  generated_at: number;
  confidence_score: number;
}

export interface AstroSettings {
  user_id: string;
  
  // Privacy settings
  profile_visibility: 'private' | 'friends' | 'public';
  show_compatibility: boolean;
  allow_vibe_sharing: boolean;
  
  // Notification preferences
  daily_insights: boolean;
  transit_alerts: boolean;
  vibe_mode_suggestions: boolean;
  compatibility_notifications: boolean;
  
  // Personalization
  insight_frequency: 'minimal' | 'moderate' | 'detailed';
  music_integration_level: 'subtle' | 'moderate' | 'immersive';
  auto_vibe_modes: boolean;
  
  // Advanced settings
  orb_tolerance: number; // Degrees for aspect calculations
  house_system: 'placidus' | 'koch' | 'equal' | 'whole_sign';
  include_asteroids: boolean;
  include_fixed_stars: boolean;
  
  // Metadata
  updated_at: number;
  onboarding_completed: boolean;
}

export interface AstroOnboarding {
  user_id: string;
  step: 'welcome' | 'birth_data' | 'preferences' | 'privacy' | 'complete';
  
  // Progress tracking
  completed_steps: string[];
  current_step_data: Record<string, any>;
  
  // Validation
  birth_data_validated: boolean;
  location_confirmed: boolean;
  
  // Metadata
  started_at: number;
  completed_at?: number;
  abandoned_at?: number;
}

export interface ZodiacSignInfo {
  sign: ZodiacSign;
  element: Element;
  modality: Modality;
  ruling_planet: Planet;
  symbol: string;
  date_range: string;
  
  // Characteristics
  keywords: string[];
  strengths: string[];
  challenges: string[];
  
  // Music associations
  preferred_genres: string[];
  typical_tempo: string;
  mood_associations: string[];
  
  // Colors and aesthetics
  colors: string[];
  gemstones: string[];
  
  // Compatibility
  most_compatible: ZodiacSign[];
  least_compatible: ZodiacSign[];
}
