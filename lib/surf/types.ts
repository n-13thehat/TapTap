/**
 * Surf App Types and Interfaces
 * Comprehensive type definitions for the TapTap Surf discovery system
 */

export interface SurfTrack {
  id: string;
  title: string;
  artist: string;
  genre?: string;
  duration: number;
  audio_url: string;
  cover_image?: string;
  youtube_id?: string;
  spotify_id?: string;
  apple_music_id?: string;
  soundcloud_id?: string;
  
  // Surf-specific metadata
  source: 'youtube' | 'spotify' | 'apple_music' | 'soundcloud' | 'taptap' | 'user_upload';
  discovery_score: number; // 0-100
  trending_score: number; // 0-100
  freshness_score: number; // 0-100 (how new/recent)
  engagement_score: number; // 0-100 (likes, shares, plays)
  
  // Shadow track metadata
  is_shadow: boolean;
  shadow_created_at?: number;
  shadow_source?: string;
  original_url?: string;
  
  // Access control
  requires_tappass: boolean;
  beta_unlock_required: boolean;
  premium_tier?: 'free' | 'basic' | 'premium' | 'vip';
  
  // Metadata
  created_at: number;
  updated_at: number;
  tags: string[];
  mood?: string;
  energy_level?: number; // 1-10
  bpm?: number;
  key?: string;
}

export interface SurfFeed {
  id: string;
  name: string;
  description: string;
  type: 'trending' | 'fresh' | 'genre' | 'mood' | 'personalized' | 'curated';
  tracks: SurfTrack[];
  metadata: {
    total_tracks: number;
    last_updated: number;
    refresh_interval: number; // seconds
    source_weights: Record<string, number>;
  };
  filters: SurfFilter;
  sort_by: SurfSortOption;
}

export interface SurfFilter {
  genres?: string[];
  moods?: string[];
  sources?: string[];
  duration_range?: { min: number; max: number };
  energy_range?: { min: number; max: number };
  discovery_score_min?: number;
  trending_score_min?: number;
  freshness_score_min?: number;
  requires_tappass?: boolean;
  beta_unlock_only?: boolean;
  exclude_shadow?: boolean;
}

export interface SurfSortOption {
  field: 'discovery_score' | 'trending_score' | 'freshness_score' | 'engagement_score' | 'created_at' | 'random';
  direction: 'asc' | 'desc';
}

export interface TapPassStatus {
  has_tappass: boolean;
  tier: 'free' | 'basic' | 'premium' | 'vip';
  expires_at?: number;
  features: string[];
  daily_surf_limit: number;
  daily_surf_used: number;
  beta_access: boolean;
}

export interface SurfSession {
  id: string;
  user_id: string;
  started_at: number;
  tracks_surfed: number;
  tracks_saved: number;
  tracks_skipped: number;
  session_duration: number;
  feeds_accessed: string[];
  tappass_gated_attempts: number;
  beta_unlock_attempts: number;
}

export interface SurfRateLimit {
  user_id: string;
  action: 'surf' | 'save' | 'skip' | 'share' | 'create_shadow';
  count: number;
  window_start: number;
  window_duration: number; // seconds
  limit: number;
  reset_at: number;
}

export interface ShadowTrackCreation {
  id: string;
  original_url: string;
  source_platform: 'youtube' | 'spotify' | 'apple_music' | 'soundcloud';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_by: string;
  created_at: number;
  processed_at?: number;
  error_message?: string;
  
  // Extracted metadata
  title?: string;
  artist?: string;
  duration?: number;
  thumbnail_url?: string;
  audio_url?: string;
  
  // Processing details
  extraction_method: 'api' | 'scraping' | 'manual';
  quality: 'low' | 'medium' | 'high';
  file_size?: number;
}

export type SurfErrorType = 'rate_limit' | 'tappass_required' | 'beta_unlock_required' | 'network_error' | 'parsing_error' | 'quota_exceeded';

export interface SurfErrorOptions {
  id: string;
  type: SurfErrorType;
  message: string;
  details?: Record<string, any>;
  timestamp: number;
  user_id?: string;
  action?: string;
  retry_after?: number;
  fallback_available: boolean;
}

export class SurfError extends Error implements SurfErrorOptions {
  id: string;
  type: SurfErrorType;
  details?: Record<string, any>;
  timestamp: number;
  user_id?: string;
  action?: string;
  retry_after?: number;
  fallback_available: boolean;

  constructor(options: SurfErrorOptions) {
    super(options.message);
    this.name = 'SurfError';
    this.id = options.id;
    this.type = options.type;
    this.details = options.details;
    this.timestamp = options.timestamp;
    this.user_id = options.user_id;
    this.action = options.action;
    this.retry_after = options.retry_after;
    this.fallback_available = options.fallback_available;
  }
}

export interface SurfAnalytics {
  session_id: string;
  user_id: string;
  event_type: 'surf_start' | 'track_played' | 'track_saved' | 'track_skipped' | 'feed_switched' | 'error_occurred';
  track_id?: string;
  feed_id?: string;
  error_type?: string;
  timestamp: number;
  metadata: Record<string, any>;
}

export interface SurfConfig {
  rate_limits: {
    surf_per_hour: number;
    save_per_hour: number;
    skip_per_minute: number;
    shadow_create_per_day: number;
  };
  tappass_features: {
    unlimited_surf: boolean;
    premium_feeds: boolean;
    early_access: boolean;
    ad_free: boolean;
  };
  beta_features: {
    experimental_feeds: boolean;
    advanced_filters: boolean;
    shadow_track_creation: boolean;
    api_access: boolean;
  };
  fallback_strategies: {
    network_error: 'cache' | 'offline_mode' | 'retry';
    rate_limit: 'queue' | 'upgrade_prompt' | 'wait';
    tappass_required: 'preview' | 'upgrade_prompt' | 'block';
  };
}
