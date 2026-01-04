"use client";

import { useEffect, useCallback, useRef } from 'react';
import { eventBus, EventPayload, EventHandler, EventType, EventTypes } from '@/lib/eventBus';

/**
 * Hook for emitting events
 */
export function useEventEmitter() {
  const emit = useCallback(async (
    type: EventType, 
    data: Record<string, any>, 
    options?: {
      userId?: string;
      sessionId?: string;
      source?: string;
      correlationId?: string;
    }
  ) => {
    try {
      await eventBus.emit(type, data, options);
    } catch (error) {
      console.error('Failed to emit event:', error);
    }
  }, []);

  return { emit };
}

/**
 * Hook for listening to events
 */
export function useEventListener(
  eventTypes: EventType | EventType[],
  handler: (event: EventPayload) => Promise<void> | void,
  options?: {
    idempotent?: boolean;
    retryCount?: number;
    retryDelay?: number;
    priority?: number;
  }
) {
  const handlerRef = useRef(handler);
  const handlerIdRef = useRef<string | null>(null);

  // Update handler ref when handler changes
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    const types = Array.isArray(eventTypes) ? eventTypes : [eventTypes];
    const handlerId = `hook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    handlerIdRef.current = handlerId;

    const eventHandler: EventHandler = {
      id: handlerId,
      eventTypes: types,
      handler: (event) => handlerRef.current(event),
      options,
    };

    const unsubscribe = eventBus.on(eventHandler);

    return () => {
      unsubscribe();
    };
  }, [eventTypes, options]);
}

/**
 * Hook for tracking specific events with analytics
 */
export function useEventTracker() {
  const { emit } = useEventEmitter();

  const trackPageView = useCallback((page: string, data?: Record<string, any>) => {
    emit(EventTypes.PAGE_VIEW, {
      page,
      url: typeof window !== 'undefined' ? window.location.href : '',
      referrer: typeof window !== 'undefined' ? document.referrer : '',
      timestamp: Date.now(),
      ...data,
    });
  }, [emit]);

  const trackButtonClick = useCallback((buttonId: string, data?: Record<string, any>) => {
    emit(EventTypes.BUTTON_CLICKED, {
      buttonId,
      timestamp: Date.now(),
      ...data,
    });
  }, [emit]);

  const trackSearch = useCallback((query: string, results?: number, data?: Record<string, any>) => {
    emit(EventTypes.SEARCH_PERFORMED, {
      query,
      results,
      timestamp: Date.now(),
      ...data,
    });
  }, [emit]);

  const trackTrackPlayed = useCallback((trackId: string, data?: Record<string, any>) => {
    emit(EventTypes.TRACK_PLAYED, {
      trackId,
      timestamp: Date.now(),
      ...data,
    });
  }, [emit]);

  const trackTrackSaved = useCallback((trackId: string, data?: Record<string, any>) => {
    emit(EventTypes.TRACK_SAVED, {
      trackId,
      timestamp: Date.now(),
      ...data,
    });
  }, [emit]);

  const trackPlaylistCreated = useCallback((playlistId: string, data?: Record<string, any>) => {
    emit(EventTypes.PLAYLIST_CREATED, {
      playlistId,
      timestamp: Date.now(),
      ...data,
    });
  }, [emit]);

  const trackUserAction = useCallback((action: string, data?: Record<string, any>) => {
    emit(`user.${action}` as EventType, {
      action,
      timestamp: Date.now(),
      ...data,
    });
  }, [emit]);

  return {
    trackPageView,
    trackButtonClick,
    trackSearch,
    trackTrackPlayed,
    trackTrackSaved,
    trackPlaylistCreated,
    trackUserAction,
  };
}

/**
 * Hook for event bus metrics and debugging
 */
export function useEventBusMetrics() {
  const getMetrics = useCallback(() => {
    return eventBus.getMetrics();
  }, []);

  const clearProcessedEvents = useCallback(() => {
    eventBus.clearProcessedEvents();
  }, []);

  return {
    getMetrics,
    clearProcessedEvents,
  };
}

/**
 * Hook for player-specific events
 */
export function usePlayerEvents() {
  const { emit } = useEventEmitter();

  const trackPlayed = useCallback((trackId: string, data?: Record<string, any>) => {
    emit(EventTypes.TRACK_PLAYED, {
      trackId,
      timestamp: Date.now(),
      ...data,
    });
  }, [emit]);

  const trackPaused = useCallback((trackId: string, position: number, data?: Record<string, any>) => {
    emit(EventTypes.TRACK_PAUSED, {
      trackId,
      position,
      timestamp: Date.now(),
      ...data,
    });
  }, [emit]);

  const trackCompleted = useCallback((trackId: string, duration: number, data?: Record<string, any>) => {
    emit(EventTypes.TRACK_COMPLETED, {
      trackId,
      duration,
      timestamp: Date.now(),
      ...data,
    });
  }, [emit]);

  const trackSkipped = useCallback((trackId: string, position: number, data?: Record<string, any>) => {
    emit(EventTypes.TRACK_SKIPPED, {
      trackId,
      position,
      timestamp: Date.now(),
      ...data,
    });
  }, [emit]);

  const trackSaved = useCallback((trackId: string, data?: Record<string, any>) => {
    emit(EventTypes.TRACK_SAVED, {
      trackId,
      timestamp: Date.now(),
      ...data,
    });
  }, [emit]);

  return {
    trackPlayed,
    trackPaused,
    trackCompleted,
    trackSkipped,
    trackSaved,
  };
}

/**
 * Hook for social events
 */
export function useSocialEvents() {
  const { emit } = useEventEmitter();

  const postCreated = useCallback((postId: string, data?: Record<string, any>) => {
    emit(EventTypes.POST_CREATED, {
      postId,
      timestamp: Date.now(),
      ...data,
    });
  }, [emit]);

  const postLiked = useCallback((postId: string, data?: Record<string, any>) => {
    emit(EventTypes.POST_LIKED, {
      postId,
      timestamp: Date.now(),
      ...data,
    });
  }, [emit]);

  const commentCreated = useCallback((postId: string, commentId: string, data?: Record<string, any>) => {
    emit(EventTypes.COMMENT_CREATED, {
      postId,
      commentId,
      timestamp: Date.now(),
      ...data,
    });
  }, [emit]);

  return {
    postCreated,
    postLiked,
    commentCreated,
  };
}
