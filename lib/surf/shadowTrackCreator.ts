/**
 * Shadow Track Creator
 * System for creating shadow tracks from external platform URLs
 */

import { ShadowTrackCreation, SurfTrack } from './types';
import { eventBus, EventTypes } from '../eventBus';

export interface PlatformExtractor {
  platform: string;
  extractMetadata: (url: string) => Promise<ExtractedMetadata>;
  validateUrl: (url: string) => boolean;
  getRateLimit: () => number; // requests per hour
}

export interface ExtractedMetadata {
  title: string;
  artist: string;
  duration: number;
  thumbnail_url?: string;
  description?: string;
  tags?: string[];
  upload_date?: string;
  view_count?: number;
  like_count?: number;
}

export class ShadowTrackCreator {
  private extractors: Map<string, PlatformExtractor> = new Map();
  private processingQueue: ShadowTrackCreation[] = [];
  private rateLimits: Map<string, { count: number; resetAt: number }> = new Map();

  constructor() {
    this.initializeExtractors();
  }

  /**
   * Create shadow track from URL
   */
  async createShadowTrack(
    url: string, 
    userId: string, 
    options: { priority?: 'low' | 'normal' | 'high' } = {}
  ): Promise<ShadowTrackCreation> {
    // Detect platform
    const platform = this.detectPlatform(url);
    if (!platform) {
      throw new Error('Unsupported platform or invalid URL');
    }

    // Validate URL
    const extractor = this.extractors.get(platform);
    if (!extractor || !extractor.validateUrl(url)) {
      throw new Error(`Invalid ${platform} URL`);
    }

    // Check rate limits
    if (!this.checkRateLimit(platform)) {
      throw new Error(`Rate limit exceeded for ${platform}. Please try again later.`);
    }

    // Create shadow track record
    const shadowTrack: ShadowTrackCreation = {
      id: this.generateId(),
      original_url: url,
      source_platform: platform as any,
      status: 'pending',
      created_by: userId,
      created_at: Date.now(),
      extraction_method: 'api',
      quality: 'medium',
    };

    // Add to processing queue
    this.processingQueue.push(shadowTrack);

    // Start processing (async)
    this.processNextInQueue();

    // Emit event
    eventBus.emit(EventTypes.SHADOW_TRACK_CREATED, {
      shadowId: shadowTrack.id,
      originalUrl: url,
      platform,
      userId,
    }, {
      userId,
      source: 'shadow-track-creator',
    });

    console.log(`Shadow track creation queued: ${shadowTrack.id}`);
    return shadowTrack;
  }

  /**
   * Get shadow track status
   */
  getShadowTrackStatus(shadowId: string): ShadowTrackCreation | null {
    return this.processingQueue.find(track => track.id === shadowId) || null;
  }

  /**
   * Process next item in queue
   */
  private async processNextInQueue(): Promise<void> {
    const nextTrack = this.processingQueue.find(track => track.status === 'pending');
    if (!nextTrack) return;

    nextTrack.status = 'processing';

    try {
      await this.processShadowTrack(nextTrack);
      nextTrack.status = 'completed';
      nextTrack.processed_at = Date.now();

      // Emit completion event
      eventBus.emit(EventTypes.SHADOW_TRACK_COMPLETED, {
        shadowId: nextTrack.id,
        title: nextTrack.title,
        artist: nextTrack.artist,
        duration: nextTrack.duration,
      }, {
        userId: nextTrack.created_by,
        source: 'shadow-track-creator',
      });

      console.log(`Shadow track completed: ${nextTrack.title} by ${nextTrack.artist}`);
    } catch (error) {
      nextTrack.status = 'failed';
      nextTrack.error_message = error instanceof Error ? error.message : 'Unknown error';
      nextTrack.processed_at = Date.now();

      // Emit error event
      eventBus.emit(EventTypes.SHADOW_TRACK_FAILED, {
        shadowId: nextTrack.id,
        error: nextTrack.error_message,
        originalUrl: nextTrack.original_url,
      }, {
        userId: nextTrack.created_by,
        source: 'shadow-track-creator',
      });

      console.error(`Shadow track failed: ${nextTrack.id}`, error);
    }

    // Process next item
    setTimeout(() => this.processNextInQueue(), 1000);
  }

  /**
   * Process individual shadow track
   */
  private async processShadowTrack(shadowTrack: ShadowTrackCreation): Promise<void> {
    const extractor = this.extractors.get(shadowTrack.source_platform);
    if (!extractor) {
      throw new Error(`No extractor available for ${shadowTrack.source_platform}`);
    }

    // Update rate limit
    this.updateRateLimit(shadowTrack.source_platform);

    // Extract metadata
    const metadata = await extractor.extractMetadata(shadowTrack.original_url);

    // Update shadow track with extracted data
    shadowTrack.title = metadata.title;
    shadowTrack.artist = metadata.artist;
    shadowTrack.duration = metadata.duration;
    shadowTrack.thumbnail_url = metadata.thumbnail_url;

    // Generate audio URL (would integrate with actual audio extraction service)
    shadowTrack.audio_url = this.generateAudioUrl(shadowTrack);

    console.log(`Metadata extracted for ${shadowTrack.id}: ${metadata.title} by ${metadata.artist}`);
  }

  /**
   * Convert shadow track to surf track
   */
  convertToSurfTrack(shadowTrack: ShadowTrackCreation): SurfTrack {
    if (shadowTrack.status !== 'completed') {
      throw new Error('Shadow track is not completed');
    }

    return {
      id: shadowTrack.id,
      title: shadowTrack.title!,
      artist: shadowTrack.artist!,
      duration: shadowTrack.duration!,
      audio_url: shadowTrack.audio_url!,
      cover_image: shadowTrack.thumbnail_url,
      
      // Surf-specific metadata
      source: 'taptap',
      discovery_score: 50, // Default score for shadow tracks
      trending_score: 0,
      freshness_score: 100, // New tracks are fresh
      engagement_score: 0,
      
      // Shadow track metadata
      is_shadow: true,
      shadow_created_at: shadowTrack.created_at,
      shadow_source: shadowTrack.source_platform,
      original_url: shadowTrack.original_url,
      
      // Access control
      requires_tappass: false,
      beta_unlock_required: true, // Shadow tracks require beta access
      
      // Metadata
      created_at: shadowTrack.created_at,
      updated_at: Date.now(),
      tags: ['shadow', 'user-created'],
      energy_level: 5, // Default energy
    };
  }

  /**
   * Get processing queue status
   */
  getQueueStatus(): {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    total: number;
  } {
    const pending = this.processingQueue.filter(t => t.status === 'pending').length;
    const processing = this.processingQueue.filter(t => t.status === 'processing').length;
    const completed = this.processingQueue.filter(t => t.status === 'completed').length;
    const failed = this.processingQueue.filter(t => t.status === 'failed').length;

    return {
      pending,
      processing,
      completed,
      failed,
      total: this.processingQueue.length,
    };
  }

  // Private helper methods
  private detectPlatform(url: string): string | null {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return 'youtube';
    }
    if (url.includes('spotify.com')) {
      return 'spotify';
    }
    if (url.includes('music.apple.com')) {
      return 'apple_music';
    }
    if (url.includes('soundcloud.com')) {
      return 'soundcloud';
    }
    return null;
  }

  private checkRateLimit(platform: string): boolean {
    const limit = this.rateLimits.get(platform);
    if (!limit) return true;

    const now = Date.now();
    if (now > limit.resetAt) {
      this.rateLimits.delete(platform);
      return true;
    }

    const extractor = this.extractors.get(platform);
    const maxRequests = extractor?.getRateLimit() || 100;
    
    return limit.count < maxRequests;
  }

  private updateRateLimit(platform: string): void {
    const now = Date.now();
    const resetAt = now + (60 * 60 * 1000); // 1 hour
    
    const existing = this.rateLimits.get(platform);
    if (existing && now < existing.resetAt) {
      existing.count++;
    } else {
      this.rateLimits.set(platform, { count: 1, resetAt });
    }
  }

  private generateAudioUrl(shadowTrack: ShadowTrackCreation): string {
    // In a real implementation, this would integrate with audio extraction service
    return `/api/shadow-tracks/${shadowTrack.id}/audio`;
  }

  private generateId(): string {
    return `shadow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeExtractors(): void {
    // YouTube extractor
    this.extractors.set('youtube', {
      platform: 'youtube',
      validateUrl: (url: string) => {
        return /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/.test(url);
      },
      extractMetadata: async (url: string) => {
        // Mock implementation - would use YouTube API
        return {
          title: 'Sample YouTube Track',
          artist: 'YouTube Artist',
          duration: 180,
          thumbnail_url: 'https://img.youtube.com/vi/sample/maxresdefault.jpg',
          description: 'Sample description',
          tags: ['music', 'youtube'],
        };
      },
      getRateLimit: () => 100, // 100 requests per hour
    });

    // Spotify extractor
    this.extractors.set('spotify', {
      platform: 'spotify',
      validateUrl: (url: string) => {
        return /^https?:\/\/open\.spotify\.com\/(track|album|playlist)\/[\w]+/.test(url);
      },
      extractMetadata: async (url: string) => {
        // Mock implementation - would use Spotify API
        return {
          title: 'Sample Spotify Track',
          artist: 'Spotify Artist',
          duration: 200,
          thumbnail_url: 'https://i.scdn.co/image/sample',
        };
      },
      getRateLimit: () => 200, // 200 requests per hour
    });

    // SoundCloud extractor
    this.extractors.set('soundcloud', {
      platform: 'soundcloud',
      validateUrl: (url: string) => {
        return /^https?:\/\/soundcloud\.com\/[\w-]+\/[\w-]+/.test(url);
      },
      extractMetadata: async (url: string) => {
        // Mock implementation - would use SoundCloud API
        return {
          title: 'Sample SoundCloud Track',
          artist: 'SoundCloud Artist',
          duration: 240,
          thumbnail_url: 'https://i1.sndcdn.com/artworks-sample-large.jpg',
        };
      },
      getRateLimit: () => 150, // 150 requests per hour
    });
  }
}
