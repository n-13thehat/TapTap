/**
 * TapTap Events Bus System
 * Comprehensive event system with at-least-once delivery and idempotent handlers
 */

export interface EventPayload {
  id: string;
  type: string;
  timestamp: number;
  userId?: string;
  sessionId?: string;
  data: Record<string, any>;
  metadata?: {
    source?: string;
    version?: string;
    retryCount?: number;
    correlationId?: string;
  };
}

export interface EventHandler {
  id: string;
  eventTypes: string[];
  handler: (event: EventPayload) => Promise<void> | void;
  options?: {
    idempotent?: boolean;
    retryCount?: number;
    retryDelay?: number;
    priority?: number;
  };
}

export interface EventBusConfig {
  persistEvents?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  batchSize?: number;
  flushInterval?: number;
  enableMetrics?: boolean;
}

// Event type constants for type safety
export const EventTypes = {
  // Player Events
  TRACK_PLAYED: 'track.played',
  TRACK_PAUSED: 'track.paused',
  TRACK_STOPPED: 'track.stopped',
  TRACK_LOADED: 'track.loaded',
  TRACK_SAVED: 'track.saved',
  TRACK_UNSAVED: 'track.unsaved',
  TRACK_SKIPPED: 'track.skipped',
  TRACK_COMPLETED: 'track.completed',
  
  // Playlist Events
  PLAYLIST_CREATED: 'playlist.created',
  PLAYLIST_UPDATED: 'playlist.updated',
  PLAYLIST_DELETED: 'playlist.deleted',
  TRACK_ADDED_TO_PLAYLIST: 'track.added_to_playlist',
  TRACK_REMOVED_FROM_PLAYLIST: 'track.removed_from_playlist',
  
  // User Events
  USER_SIGNED_IN: 'user.signed_in',
  USER_SIGNED_OUT: 'user.signed_out',
  USER_PROFILE_UPDATED: 'user.profile_updated',
  CREATOR_MODE_TOGGLED: 'user.creator_mode_toggled',
  
  // Wallet Events
  WALLET_CONNECTED: 'wallet.connected',
  WALLET_DISCONNECTED: 'wallet.disconnected',
  TRANSACTION_INITIATED: 'wallet.transaction_initiated',
  TRANSACTION_COMPLETED: 'wallet.transaction_completed',
  
  // Social Events
  POST_CREATED: 'social.post_created',
  POST_LIKED: 'social.post_liked',
  POST_SHARED: 'social.post_shared',
  COMMENT_CREATED: 'social.comment_created',
  DRAFT_SAVED: 'social.draft_saved',
  POST_QUEUED: 'social.post_queued',
  POST_PUBLISHED: 'social.post_published',
  POST_FAILED: 'social.post_failed',
  
  // Surf Events
  SURF_SESSION_STARTED: 'surf.session_started',
  SURF_SESSION_ENDED: 'surf.session_ended',
  SHADOW_TRACK_CREATED: 'surf.shadow_track_created',
  SHADOW_TRACK_COMPLETED: 'surf.shadow_track_completed',
  SHADOW_TRACK_FAILED: 'surf.shadow_track_failed',
  VIBE_MODE_ACTIVATED: 'astrovibes.vibe_mode_activated',

  // Collaborative Creation Events
  COLLABORATION_SESSION_JOINED: 'collab.session_joined',
  TRACK_CREATED: 'collab.track_created',
  COMMENT_ADDED: 'collab.comment_added',
  SUGGESTION_CREATED: 'collab.suggestion_created',
  VERSION_CREATED: 'collab.version_created',
  
  // Battle Events
  BATTLE_CREATED: 'battle.created',
  BATTLE_VOTE_CAST: 'battle.vote_cast',
  BATTLE_COMPLETED: 'battle.completed',
  BATTLE_TRACK_ADDED: 'battle.track_added',
  BATTLE_VOTING_STARTED: 'battle.voting_started',
  
  // Live Events
  STREAM_STARTED: 'live.stream_started',
  STREAM_ENDED: 'live.stream_ended',
  VIEWER_JOINED: 'live.viewer_joined',
  VIEWER_LEFT: 'live.viewer_left',
  
  // Marketplace Events
  ITEM_PURCHASED: 'marketplace.item_purchased',
  ITEM_LISTED: 'marketplace.item_listed',
  PAYMENT_PROCESSED: 'marketplace.payment_processed',

  // Music Theory Events
  KEY_DETECTED: 'music.key_detected',
  PROGRESSION_GENERATED: 'music.progression_generated',

  // Notification Events
  NOTIFICATION_SENT: 'notifications.sent',

  // Moderation Events
  USER_REPORT_CREATED: 'moderation.user_report_created',
  MODERATION_ACTION_TAKEN: 'moderation.action_taken',
  
  // System Events
  FEATURE_FLAG_CHANGED: 'system.feature_flag_changed',
  ERROR_OCCURRED: 'system.error_occurred',
  PERFORMANCE_METRIC: 'system.performance_metric',
  
  // Analytics Events
  PAGE_VIEW: 'analytics.page_view',
  BUTTON_CLICKED: 'analytics.button_clicked',
  SEARCH_PERFORMED: 'analytics.search_performed',
  ANALYTICS_EVENT_PROCESSED: 'analytics.event_processed',
  
  // Upload Events
  UPLOAD_STARTED: 'upload.started',
  UPLOAD_PROGRESS: 'upload.progress',
  UPLOAD_COMPLETED: 'upload.completed',
  UPLOAD_FAILED: 'upload.failed',
} as const;

export type EventType = typeof EventTypes[keyof typeof EventTypes];

/**
 * Event Bus Implementation
 */
class EventBusImpl {
  private handlers: Map<string, EventHandler> = new Map();
  private eventQueue: EventPayload[] = [];
  private processedEvents: Set<string> = new Set();
  private config: EventBusConfig;
  private flushTimer?: NodeJS.Timeout;
  private metrics = {
    eventsEmitted: 0,
    eventsProcessed: 0,
    eventsRetried: 0,
    eventsFailed: 0,
  };

  constructor(config: EventBusConfig = {}) {
    this.config = {
      persistEvents: true,
      maxRetries: 3,
      retryDelay: 1000,
      batchSize: 10,
      flushInterval: 5000,
      enableMetrics: true,
      ...config,
    };

    this.startFlushTimer();
    this.loadPersistedEvents();
  }

  /**
   * Register an event handler
   */
  on(handler: EventHandler): () => void {
    this.handlers.set(handler.id, handler);

    console.log(`Event handler registered: ${handler.id} for events: ${handler.eventTypes.join(', ')}`);

    // Return unsubscribe function
    return () => {
      this.handlers.delete(handler.id);
      console.log(`Event handler unregistered: ${handler.id}`);
    };
  }

  /**
   * Subscribe to events (alias for on)
   */
  subscribe(handler: EventHandler): () => void {
    return this.on(handler);
  }

  /**
   * Unsubscribe from events
   */
  unsubscribe(handlerId: string): void {
    this.handlers.delete(handlerId);
    console.log(`Event handler unregistered: ${handlerId}`);
  }

  /**
   * Emit an event
   */
  async emit(type: EventType, data: Record<string, any>, options?: {
    userId?: string;
    sessionId?: string;
    source?: string;
    correlationId?: string;
    serverSync?: boolean;
  }): Promise<void> {
    const event: EventPayload = {
      id: this.generateEventId(),
      type,
      timestamp: Date.now(),
      userId: options?.userId,
      sessionId: options?.sessionId || this.getSessionId(),
      data,
      metadata: {
        source: options?.source || 'client',
        version: '1.0.0',
        retryCount: 0,
        correlationId: options?.correlationId,
      },
    };

    this.eventQueue.push(event);
    this.metrics.eventsEmitted++;

    if (this.config.enableMetrics) {
      console.log(`Event emitted: ${type}`, { eventId: event.id, data });
    }

    // Send to server if serverSync is enabled (default true)
    if (options?.serverSync !== false && typeof window !== 'undefined') {
      try {
        const { eventSinkService } = await import('@/lib/services/event-sink.service');
        eventSinkService.enqueueEvent(event);
      } catch (error) {
        console.warn('Failed to enqueue event for server sync:', error);
      }
    }

    // Immediate processing for high-priority events
    if (this.isHighPriorityEvent(type)) {
      await this.processEvent(event);
    } else {
      this.persistEvent(event);
    }
  }

  /**
   * Process events in the queue
   */
  private async processEvents(): Promise<void> {
    const batch = this.eventQueue.splice(0, this.config.batchSize);
    
    for (const event of batch) {
      await this.processEvent(event);
    }
  }

  /**
   * Process a single event
   */
  private async processEvent(event: EventPayload): Promise<void> {
    // Skip if already processed (idempotency)
    if (this.processedEvents.has(event.id)) {
      return;
    }

    const matchingHandlers = Array.from(this.handlers.values()).filter(handler =>
      handler.eventTypes.includes(event.type)
    );

    for (const handler of matchingHandlers) {
      try {
        await this.executeHandler(handler, event);
        this.metrics.eventsProcessed++;
      } catch (error) {
        console.error(`Handler ${handler.id} failed for event ${event.id}:`, error);
        await this.retryEvent(event, handler, error as Error);
      }
    }

    // Mark as processed
    this.processedEvents.add(event.id);
    this.removePersistedEvent(event.id);
  }

  /**
   * Execute a handler with retry logic
   */
  private async executeHandler(handler: EventHandler, event: EventPayload): Promise<void> {
    const startTime = Date.now();

    try {
      await handler.handler(event);

      if (this.config.enableMetrics) {
        const duration = Date.now() - startTime;
        console.log(`Handler ${handler.id} executed in ${duration}ms for event ${event.type}`);
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Retry failed event
   */
  private async retryEvent(event: EventPayload, handler: EventHandler, error: Error): Promise<void> {
    const maxRetries = handler.options?.retryCount ?? this.config.maxRetries ?? 3;
    const retryDelay = handler.options?.retryDelay ?? this.config.retryDelay ?? 1000;

    if (!event.metadata) event.metadata = {};
    event.metadata.retryCount = (event.metadata.retryCount || 0) + 1;

    if (event.metadata.retryCount <= maxRetries) {
      this.metrics.eventsRetried++;

      console.warn(`Retrying event ${event.id} (attempt ${event.metadata.retryCount}/${maxRetries})`);

      setTimeout(async () => {
        try {
          await this.executeHandler(handler, event);
          this.metrics.eventsProcessed++;
        } catch (retryError) {
          if (event.metadata!.retryCount! >= maxRetries) {
            this.metrics.eventsFailed++;
            console.error(`Event ${event.id} failed after ${maxRetries} retries:`, retryError);
            this.handleFailedEvent(event, retryError as Error);
          } else {
            await this.retryEvent(event, handler, retryError as Error);
          }
        }
      }, retryDelay * Math.pow(2, event.metadata.retryCount - 1)); // Exponential backoff
    } else {
      this.metrics.eventsFailed++;
      this.handleFailedEvent(event, error);
    }
  }

  /**
   * Handle permanently failed events
   */
  private handleFailedEvent(event: EventPayload, error: Error): void {
    console.error(`Event ${event.id} permanently failed:`, error);

    // Store failed event for manual review
    this.persistFailedEvent(event, error);

    // Emit system error event
    this.emit(EventTypes.ERROR_OCCURRED, {
      originalEvent: event,
      error: error.message,
      stack: error.stack,
    }).catch(console.error);
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current session ID
   */
  private getSessionId(): string {
    if (typeof window !== 'undefined') {
      let sessionId = sessionStorage.getItem('taptap_session_id');
      if (!sessionId) {
        sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('taptap_session_id', sessionId);
      }
      return sessionId;
    }
    return 'server_session';
  }

  /**
   * Check if event is high priority
   */
  private isHighPriorityEvent(type: EventType): boolean {
    const highPriorityEvents: EventType[] = [
      EventTypes.ERROR_OCCURRED,
      EventTypes.TRANSACTION_COMPLETED,
      EventTypes.PAYMENT_PROCESSED,
      EventTypes.USER_SIGNED_IN,
      EventTypes.USER_SIGNED_OUT,
    ];
    return highPriorityEvents.includes(type);
  }

  /**
   * Start flush timer for batch processing
   */
  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      if (this.eventQueue.length > 0) {
        this.processEvents().catch(console.error);
      }
    }, this.config.flushInterval);
  }

  /**
   * Persist event to storage
   */
  private persistEvent(event: EventPayload): void {
    if (!this.config.persistEvents || typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem('taptap_event_queue') || '[]';
      const queue = JSON.parse(stored);
      queue.push(event);

      // Keep only last 1000 events to prevent storage overflow
      if (queue.length > 1000) {
        queue.splice(0, queue.length - 1000);
      }

      localStorage.setItem('taptap_event_queue', JSON.stringify(queue));
    } catch (error) {
      console.warn('Failed to persist event:', error);
    }
  }

  /**
   * Load persisted events from storage
   */
  private loadPersistedEvents(): void {
    if (!this.config.persistEvents || typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem('taptap_event_queue');
      if (stored) {
        const queue = JSON.parse(stored);
        this.eventQueue.push(...queue);
        console.log(`Loaded ${queue.length} persisted events`);
      }
    } catch (error) {
      console.warn('Failed to load persisted events:', error);
    }
  }

  /**
   * Remove persisted event
   */
  private removePersistedEvent(eventId: string): void {
    if (!this.config.persistEvents || typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem('taptap_event_queue') || '[]';
      const queue = JSON.parse(stored);
      const filtered = queue.filter((event: EventPayload) => event.id !== eventId);
      localStorage.setItem('taptap_event_queue', JSON.stringify(filtered));
    } catch (error) {
      console.warn('Failed to remove persisted event:', error);
    }
  }

  /**
   * Persist failed event for manual review
   */
  private persistFailedEvent(event: EventPayload, error: Error): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem('taptap_failed_events') || '[]';
      const failed = JSON.parse(stored);
      failed.push({
        event,
        error: {
          message: error.message,
          stack: error.stack,
        },
        failedAt: Date.now(),
      });

      // Keep only last 100 failed events
      if (failed.length > 100) {
        failed.splice(0, failed.length - 100);
      }

      localStorage.setItem('taptap_failed_events', JSON.stringify(failed));
    } catch (error) {
      console.warn('Failed to persist failed event:', error);
    }
  }

  /**
   * Get event bus metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      queueSize: this.eventQueue.length,
      handlersCount: this.handlers.size,
      processedEventsCount: this.processedEvents.size,
    };
  }

  /**
   * Clear processed events cache (for memory management)
   */
  clearProcessedEvents(): void {
    this.processedEvents.clear();
    console.log('Processed events cache cleared');
  }

  /**
   * Shutdown event bus
   */
  shutdown(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    // Process remaining events
    this.processEvents().catch(console.error);

    console.log('Event bus shutdown complete');
  }
}

// Global event bus instance
export const eventBus = new EventBusImpl();

// React hook for agent bus functionality
export const useAgentBus = () => {
  return {
    emit: (eventType: string, data: any) => {
      eventBus.emit(eventType as EventType, data, {
        source: 'agent-bus'
      });
    },
    subscribe: (eventTypes: string[], handler: (event: EventPayload) => void) => {
      const handlerId = `agent-handler-${Date.now()}-${Math.random()}`;
      eventBus.subscribe({
        id: handlerId,
        eventTypes,
        handler,
        options: {
          idempotent: true,
          retryCount: 3
        }
      });
      return () => eventBus.unsubscribe(handlerId);
    }
  };
};
