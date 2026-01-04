/**
 * Surf Manager
 * Core surf discovery system with TapPass gating, rate limiting, and error handling
 */

import { 
  SurfTrack, 
  SurfFeed, 
  SurfFilter, 
  SurfSortOption, 
  TapPassStatus, 
  SurfSession, 
  SurfRateLimit, 
  SurfError,
  SurfConfig 
} from './types';
import { eventBus, EventTypes } from '../eventBus';

export class SurfManager {
  private userId: string;
  private tapPassStatus: TapPassStatus;
  private currentSession: SurfSession | null = null;
  private rateLimits: Map<string, SurfRateLimit> = new Map();
  private config: SurfConfig;
  private feeds: Map<string, SurfFeed> = new Map();

  constructor(userId: string, tapPassStatus: TapPassStatus, config: SurfConfig) {
    this.userId = userId;
    this.tapPassStatus = tapPassStatus;
    this.config = config;
    this.initializeFeeds();
  }

  /**
   * Start a new surf session
   */
  async startSurfSession(): Promise<SurfSession> {
    // Check rate limits
    const canSurf = await this.checkRateLimit('surf');
    if (!canSurf) {
      throw new SurfError({
        id: this.generateId(),
        type: 'rate_limit',
        message: 'Surf rate limit exceeded. Please wait before surfing again.',
        timestamp: Date.now(),
        user_id: this.userId,
        action: 'start_session',
        retry_after: this.getRateLimitResetTime('surf'),
        fallback_available: false,
      });
    }

    this.currentSession = {
      id: this.generateId(),
      user_id: this.userId,
      started_at: Date.now(),
      tracks_surfed: 0,
      tracks_saved: 0,
      tracks_skipped: 0,
      session_duration: 0,
      feeds_accessed: [],
      tappass_gated_attempts: 0,
      beta_unlock_attempts: 0,
    };

    // Emit analytics event
    eventBus.emit(EventTypes.SURF_SESSION_STARTED, {
      sessionId: this.currentSession.id,
      userId: this.userId,
      tapPassTier: this.tapPassStatus.tier,
    }, {
      userId: this.userId,
      source: 'surf-manager',
    });

    console.log(`Surf session started: ${this.currentSession.id}`);
    return this.currentSession;
  }

  /**
   * Get tracks from a specific feed with access control
   */
  async getFeedTracks(feedId: string, limit = 20): Promise<SurfTrack[]> {
    const feed = this.feeds.get(feedId);
    if (!feed) {
      throw new SurfError({
        id: this.generateId(),
        type: 'parsing_error',
        message: `Feed not found: ${feedId}`,
        timestamp: Date.now(),
        user_id: this.userId,
        fallback_available: true,
      });
    }

    // Check TapPass requirements for premium feeds
    if (this.requiresTapPass(feed) && !this.tapPassStatus.has_tappass) {
      throw new SurfError({
        id: this.generateId(),
        type: 'tappass_required',
        message: 'This feed requires TapPass subscription',
        timestamp: Date.now(),
        user_id: this.userId,
        action: 'access_feed',
        fallback_available: true,
      });
    }

    // Check beta unlock requirements
    if (this.requiresBetaUnlock(feed) && !this.tapPassStatus.beta_access) {
      throw new SurfError({
        id: this.generateId(),
        type: 'beta_unlock_required',
        message: 'This feed requires beta access',
        timestamp: Date.now(),
        user_id: this.userId,
        action: 'access_feed',
        fallback_available: true,
      });
    }

    // Apply filters and get tracks
    let tracks = this.applyFilters(feed.tracks, feed.filters);
    tracks = this.sortTracks(tracks, feed.sort_by);
    tracks = tracks.slice(0, limit);

    // Filter out tracks that require access the user doesn't have
    tracks = tracks.filter(track => this.canAccessTrack(track));

    // Update session
    if (this.currentSession) {
      this.currentSession.tracks_surfed += tracks.length;
      if (!this.currentSession.feeds_accessed.includes(feedId)) {
        this.currentSession.feeds_accessed.push(feedId);
      }
    }

    return tracks;
  }

  /**
   * Save a track with rate limiting
   */
  async saveTrack(trackId: string): Promise<void> {
    // Check rate limits
    const canSave = await this.checkRateLimit('save');
    if (!canSave) {
      throw new SurfError({
        id: this.generateId(),
        type: 'rate_limit',
        message: 'Save rate limit exceeded',
        timestamp: Date.now(),
        user_id: this.userId,
        action: 'save_track',
        retry_after: this.getRateLimitResetTime('save'),
        fallback_available: false,
      });
    }

    // Find the track
    const track = this.findTrack(trackId);
    if (!track) {
      throw new SurfError({
        id: this.generateId(),
        type: 'parsing_error',
        message: 'Track not found',
        timestamp: Date.now(),
        user_id: this.userId,
        fallback_available: false,
      });
    }

    // Check access
    if (!this.canAccessTrack(track)) {
      throw new SurfError({
        id: this.generateId(),
        type: 'tappass_required',
        message: 'Track requires TapPass to save',
        timestamp: Date.now(),
        user_id: this.userId,
        action: 'save_track',
        fallback_available: false,
      });
    }

    // Update rate limit
    await this.updateRateLimit('save');

    // Update session
    if (this.currentSession) {
      this.currentSession.tracks_saved++;
    }

    // Emit event
    eventBus.emit(EventTypes.TRACK_SAVED, {
      trackId,
      title: track.title,
      artist: track.artist,
      source: 'surf',
    }, {
      userId: this.userId,
      source: 'surf-manager',
    });

    console.log(`Track saved: ${track.title} by ${track.artist}`);
  }

  /**
   * Skip a track with rate limiting
   */
  async skipTrack(trackId: string, reason?: string): Promise<void> {
    // Check rate limits
    const canSkip = await this.checkRateLimit('skip');
    if (!canSkip) {
      throw new SurfError({
        id: this.generateId(),
        type: 'rate_limit',
        message: 'Skip rate limit exceeded',
        timestamp: Date.now(),
        user_id: this.userId,
        action: 'skip_track',
        retry_after: this.getRateLimitResetTime('skip'),
        fallback_available: false,
      });
    }

    // Update rate limit
    await this.updateRateLimit('skip');

    // Update session
    if (this.currentSession) {
      this.currentSession.tracks_skipped++;
    }

    // Emit event
    eventBus.emit(EventTypes.TRACK_SKIPPED, {
      trackId,
      reason: reason || 'user_skip',
      source: 'surf',
    }, {
      userId: this.userId,
      source: 'surf-manager',
    });

    console.log(`Track skipped: ${trackId}, reason: ${reason}`);
  }

  /**
   * Create shadow track from external URL
   */
  async createShadowTrack(url: string, platform: string): Promise<string> {
    // Check beta unlock
    if (!this.tapPassStatus.beta_access) {
      throw new SurfError({
        id: this.generateId(),
        type: 'beta_unlock_required',
        message: 'Shadow track creation requires beta access',
        timestamp: Date.now(),
        user_id: this.userId,
        action: 'create_shadow',
        fallback_available: false,
      });
    }

    // Check rate limits
    const canCreate = await this.checkRateLimit('create_shadow');
    if (!canCreate) {
      throw new SurfError({
        id: this.generateId(),
        type: 'rate_limit',
        message: 'Shadow track creation rate limit exceeded',
        timestamp: Date.now(),
        user_id: this.userId,
        action: 'create_shadow',
        retry_after: this.getRateLimitResetTime('create_shadow'),
        fallback_available: false,
      });
    }

    // Create shadow track (would integrate with actual extraction service)
    const shadowId = this.generateId();
    
    // Update rate limit
    await this.updateRateLimit('create_shadow');

    // Emit event
    eventBus.emit(EventTypes.SHADOW_TRACK_CREATED, {
      shadowId,
      originalUrl: url,
      platform,
      userId: this.userId,
    }, {
      userId: this.userId,
      source: 'surf-manager',
    });

    console.log(`Shadow track creation started: ${shadowId}`);
    return shadowId;
  }

  /**
   * Get available feeds for user
   */
  getAvailableFeeds(): SurfFeed[] {
    return Array.from(this.feeds.values()).filter(feed => {
      // Check TapPass requirements
      if (this.requiresTapPass(feed) && !this.tapPassStatus.has_tappass) {
        return false;
      }
      
      // Check beta requirements
      if (this.requiresBetaUnlock(feed) && !this.tapPassStatus.beta_access) {
        return false;
      }
      
      return true;
    });
  }

  /**
   * Get current session stats
   */
  getCurrentSession(): SurfSession | null {
    if (this.currentSession) {
      this.currentSession.session_duration = Date.now() - this.currentSession.started_at;
    }
    return this.currentSession;
  }

  /**
   * End current session
   */
  async endSurfSession(): Promise<void> {
    if (!this.currentSession) return;

    this.currentSession.session_duration = Date.now() - this.currentSession.started_at;

    // Emit analytics event
    eventBus.emit(EventTypes.SURF_SESSION_ENDED, {
      sessionId: this.currentSession.id,
      duration: this.currentSession.session_duration,
      tracksSurfed: this.currentSession.tracks_surfed,
      tracksSaved: this.currentSession.tracks_saved,
      tracksSkipped: this.currentSession.tracks_skipped,
    }, {
      userId: this.userId,
      source: 'surf-manager',
    });

    console.log(`Surf session ended: ${this.currentSession.id}`);
    this.currentSession = null;
  }

  // Private helper methods
  private async checkRateLimit(action: SurfRateLimit['action']): Promise<boolean> {
    const key = `${this.userId}_${action}`;
    const limit = this.rateLimits.get(key);
    
    if (!limit) return true;
    
    const now = Date.now();
    if (now > limit.reset_at) {
      // Reset window
      this.rateLimits.delete(key);
      return true;
    }
    
    return limit.count < limit.limit;
  }

  private async updateRateLimit(action: SurfRateLimit['action']): Promise<void> {
    const key = `${this.userId}_${action}`;
    const now = Date.now();
    const windowDuration = this.getRateLimitWindow(action);
    const limit = this.getRateLimitMax(action);
    
    const existing = this.rateLimits.get(key);
    if (existing && now < existing.reset_at) {
      existing.count++;
    } else {
      this.rateLimits.set(key, {
        user_id: this.userId,
        action,
        count: 1,
        window_start: now,
        window_duration: windowDuration,
        limit,
        reset_at: now + windowDuration,
      });
    }
  }

  private getRateLimitWindow(action: SurfRateLimit['action']): number {
    switch (action) {
      case 'surf': return 60 * 60 * 1000; // 1 hour
      case 'save': return 60 * 60 * 1000; // 1 hour
      case 'skip': return 60 * 1000; // 1 minute
      case 'create_shadow': return 24 * 60 * 60 * 1000; // 1 day
      default: return 60 * 60 * 1000;
    }
  }

  private getRateLimitMax(action: SurfRateLimit['action']): number {
    const limits = this.config.rate_limits;
    switch (action) {
      case 'surf': return limits.surf_per_hour;
      case 'save': return limits.save_per_hour;
      case 'skip': return limits.skip_per_minute;
      case 'create_shadow': return limits.shadow_create_per_day;
      default: return 100;
    }
  }

  private getRateLimitResetTime(action: SurfRateLimit['action']): number {
    const key = `${this.userId}_${action}`;
    const limit = this.rateLimits.get(key);
    return limit?.reset_at || Date.now();
  }

  private requiresTapPass(feed: SurfFeed): boolean {
    return feed.type === 'curated' || feed.name.includes('Premium');
  }

  private requiresBetaUnlock(feed: SurfFeed): boolean {
    return feed.name.includes('Beta') || feed.name.includes('Experimental');
  }

  private canAccessTrack(track: SurfTrack): boolean {
    if (track.requires_tappass && !this.tapPassStatus.has_tappass) {
      return false;
    }
    if (track.beta_unlock_required && !this.tapPassStatus.beta_access) {
      return false;
    }
    return true;
  }

  private applyFilters(tracks: SurfTrack[], filters: SurfFilter): SurfTrack[] {
    return tracks.filter(track => {
      if (filters.genres?.length && !filters.genres.includes(track.genre || '')) {
        return false;
      }
      if (filters.sources?.length && !filters.sources.includes(track.source)) {
        return false;
      }
      if (filters.requires_tappass !== undefined && track.requires_tappass !== filters.requires_tappass) {
        return false;
      }
      if (filters.exclude_shadow && track.is_shadow) {
        return false;
      }
      return true;
    });
  }

  private sortTracks(tracks: SurfTrack[], sort: SurfSortOption): SurfTrack[] {
    return tracks.sort((a, b) => {
      if (sort.field === 'random') {
        return Math.random() - 0.5;
      }

      const field = sort.field;
      let aValue = a[field];
      let bValue = b[field];
      
      if (sort.direction === 'desc') {
        return bValue - aValue;
      } else {
        return aValue - bValue;
      }
    });
  }

  private findTrack(trackId: string): SurfTrack | null {
    for (const feed of this.feeds.values()) {
      const track = feed.tracks.find(t => t.id === trackId);
      if (track) return track;
    }
    return null;
  }

  private initializeFeeds(): void {
    // Initialize default feeds (would be loaded from API)
    this.feeds.set('trending', this.createTrendingFeed());
    this.feeds.set('fresh', this.createFreshFeed());
    this.feeds.set('premium', this.createPremiumFeed());
    this.feeds.set('beta', this.createBetaFeed());
  }

  private createTrendingFeed(): SurfFeed {
    return {
      id: 'trending',
      name: 'Trending Now',
      description: 'The hottest tracks right now',
      type: 'trending',
      tracks: [], // Would be populated from API
      metadata: {
        total_tracks: 0,
        last_updated: Date.now(),
        refresh_interval: 300, // 5 minutes
        source_weights: { youtube: 0.4, spotify: 0.3, taptap: 0.3 },
      },
      filters: {},
      sort_by: { field: 'trending_score', direction: 'desc' },
    };
  }

  private createFreshFeed(): SurfFeed {
    return {
      id: 'fresh',
      name: 'Fresh Drops',
      description: 'Newly discovered tracks',
      type: 'fresh',
      tracks: [],
      metadata: {
        total_tracks: 0,
        last_updated: Date.now(),
        refresh_interval: 600, // 10 minutes
        source_weights: { youtube: 0.5, soundcloud: 0.3, taptap: 0.2 },
      },
      filters: {},
      sort_by: { field: 'freshness_score', direction: 'desc' },
    };
  }

  private createPremiumFeed(): SurfFeed {
    return {
      id: 'premium',
      name: 'Premium Curated',
      description: 'Hand-picked tracks for TapPass members',
      type: 'curated',
      tracks: [],
      metadata: {
        total_tracks: 0,
        last_updated: Date.now(),
        refresh_interval: 1800, // 30 minutes
        source_weights: { taptap: 0.6, spotify: 0.4 },
      },
      filters: { requires_tappass: true },
      sort_by: { field: 'discovery_score', direction: 'desc' },
    };
  }

  private createBetaFeed(): SurfFeed {
    return {
      id: 'beta',
      name: 'Beta Experimental',
      description: 'Experimental features and tracks',
      type: 'personalized',
      tracks: [],
      metadata: {
        total_tracks: 0,
        last_updated: Date.now(),
        refresh_interval: 900, // 15 minutes
        source_weights: { youtube: 0.7, soundcloud: 0.3 },
      },
      filters: { beta_unlock_only: true },
      sort_by: { field: 'discovery_score', direction: 'desc' },
    };
  }

  private generateId(): string {
    return `surf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
