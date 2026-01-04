/**
 * Prism Analytics Engine
 * Comprehensive analytics system with KPI mapping, opt-in controls, and event tracking
 */

import { EventPayload } from '../eventBus';

export interface AnalyticsEvent {
  id: string;
  type: string;
  category: 'user' | 'system' | 'performance' | 'business' | 'engagement';
  properties: Record<string, any>;
  userId?: string;
  sessionId: string;
  timestamp: number;
  source: string;
  version: string;
}

export interface KPIMetric {
  id: string;
  name: string;
  category: string;
  value: number;
  unit: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface AnalyticsConfig {
  enabled: boolean;
  userId?: string;
  optInLevel: 'none' | 'basic' | 'enhanced' | 'full';
  retentionDays: number;
  batchSize: number;
  flushInterval: number;
  enableRealtime: boolean;
  enableKPIs: boolean;
  enablePerformance: boolean;
  enableUserBehavior: boolean;
  enableBusinessMetrics: boolean;
}

export interface UserConsent {
  userId: string;
  level: 'none' | 'basic' | 'enhanced' | 'full';
  timestamp: number;
  version: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Prism Analytics Engine Implementation
 */
export class PrismAnalytics {
  private config: AnalyticsConfig;
  private events: AnalyticsEvent[] = [];
  private kpis: KPIMetric[] = [];
  private sessionId: string;
  private flushTimer?: NodeJS.Timeout;
  private performanceObserver?: PerformanceObserver;
  private listeners: Set<(event: AnalyticsEvent) => void> = new Set();

  constructor(config: Partial<AnalyticsConfig> = {}) {
    this.config = {
      enabled: true,
      optInLevel: 'basic',
      retentionDays: 30,
      batchSize: 50,
      flushInterval: 30000, // 30 seconds
      enableRealtime: true,
      enableKPIs: true,
      enablePerformance: true,
      enableUserBehavior: true,
      enableBusinessMetrics: true,
      ...config,
    };

    this.sessionId = this.generateSessionId();
    this.initializePerformanceTracking();
    this.startFlushTimer();
  }

  /**
   * Track analytics event
   */
  track(
    type: string,
    properties: Record<string, any> = {},
    category: AnalyticsEvent['category'] = 'user'
  ): void {
    if (!this.config.enabled || !this.shouldTrackCategory(category)) {
      return;
    }

    const event: AnalyticsEvent = {
      id: this.generateEventId(),
      type,
      category,
      properties: this.sanitizeProperties(properties),
      userId: this.config.userId,
      sessionId: this.sessionId,
      timestamp: Date.now(),
      source: 'taptap-web',
      version: '1.0.0',
    };

    this.events.push(event);
    this.persistEvent(event);
    this.notifyListeners(event);

    // Auto-flush if batch size reached
    if (this.events.length >= this.config.batchSize) {
      this.flush();
    }
  }

  /**
   * Track KPI metric
   */
  trackKPI(
    id: string,
    name: string,
    category: string,
    value: number,
    unit: string,
    metadata?: Record<string, any>
  ): void {
    if (!this.config.enabled || !this.config.enableKPIs) {
      return;
    }

    const kpi: KPIMetric = {
      id,
      name,
      category,
      value,
      unit,
      timestamp: Date.now(),
      metadata,
    };

    this.kpis.push(kpi);
    this.persistKPI(kpi);

    console.log(`KPI tracked: ${name} = ${value} ${unit}`);
  }

  /**
   * Process event bus event for analytics
   */
  processEventBusEvent(event: EventPayload): void {
    if (!this.config.enabled) return;

    // Map event bus events to analytics events
    const analyticsEvent = this.mapEventBusToAnalytics(event);
    if (analyticsEvent) {
      this.track(analyticsEvent.type, analyticsEvent.properties, analyticsEvent.category);
    }

    // Extract KPIs from events
    this.extractKPIsFromEvent(event);
  }

  /**
   * Update user consent
   */
  updateConsent(level: UserConsent['level'], userId?: string): void {
    const consent: UserConsent = {
      userId: userId || this.config.userId || 'anonymous',
      level,
      timestamp: Date.now(),
      version: '1.0.0',
      ipAddress: this.getClientIP(),
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
    };

    this.config.optInLevel = level;
    this.config.userId = userId;
    this.persistConsent(consent);

    console.log(`Analytics consent updated: ${level}`);
  }

  /**
   * Get analytics dashboard data
   */
  getDashboardData(): {
    events: AnalyticsEvent[];
    kpis: KPIMetric[];
    sessionStats: any;
    userStats: any;
  } {
    return {
      events: this.events.slice(-100), // Last 100 events
      kpis: this.kpis.slice(-50), // Last 50 KPIs
      sessionStats: this.getSessionStats(),
      userStats: this.getUserStats(),
    };
  }

  /**
   * Subscribe to analytics events
   */
  subscribe(callback: (event: AnalyticsEvent) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Flush events to storage/server
   */
  async flush(): Promise<void> {
    if (this.events.length === 0) return;

    try {
      const eventsToFlush = [...this.events];
      const kpisToFlush = [...this.kpis];

      // Send to analytics service (would be implemented based on backend)
      await this.sendToAnalyticsService(eventsToFlush, kpisToFlush);

      // Clear flushed events
      this.events = [];
      this.kpis = [];

      console.log(`Analytics flushed: ${eventsToFlush.length} events, ${kpisToFlush.length} KPIs`);
    } catch (error) {
      console.error('Failed to flush analytics:', error);
    }
  }

  // Private helper methods
  private shouldTrackCategory(category: AnalyticsEvent['category']): boolean {
    switch (this.config.optInLevel) {
      case 'none':
        return false;
      case 'basic':
        return category === 'system' || category === 'performance';
      case 'enhanced':
        return category !== 'business';
      case 'full':
        return true;
      default:
        return false;
    }
  }

  private sanitizeProperties(properties: Record<string, any>): Record<string, any> {
    // Remove sensitive data based on consent level
    const sanitized = { ...properties };

    if (this.config.optInLevel === 'basic') {
      // Remove PII for basic consent
      delete sanitized.email;
      delete sanitized.phone;
      delete sanitized.address;
    }

    return sanitized;
  }

  private mapEventBusToAnalytics(event: EventPayload): {
    type: string;
    properties: Record<string, any>;
    category: AnalyticsEvent['category'];
  } | null {
    const eventTypeMap: Record<string, { category: AnalyticsEvent['category']; name: string }> = {
      'track.played': { category: 'engagement', name: 'track_played' },
      'track.saved': { category: 'engagement', name: 'track_saved' },
      'playlist.created': { category: 'user', name: 'playlist_created' },
      'social.post_liked': { category: 'engagement', name: 'post_liked' },
      'wallet.connected': { category: 'business', name: 'wallet_connected' },
      'user.signed_in': { category: 'user', name: 'user_signed_in' },
      'system.error_occurred': { category: 'system', name: 'error_occurred' },
    };

    const mapping = eventTypeMap[event.type];
    if (!mapping) return null;

    return {
      type: mapping.name,
      properties: {
        ...event.data,
        eventId: event.id,
        originalType: event.type,
      },
      category: mapping.category,
    };
  }

  private extractKPIsFromEvent(event: EventPayload): void {
    switch (event.type) {
      case 'track.played':
        this.trackKPI('tracks_played', 'Tracks Played', 'engagement', 1, 'count');
        break;
      case 'user.signed_in':
        this.trackKPI('user_sessions', 'User Sessions', 'user', 1, 'count');
        break;
      case 'wallet.connected':
        this.trackKPI('wallet_connections', 'Wallet Connections', 'business', 1, 'count');
        break;
    }
  }

  private getSessionStats(): any {
    const sessionEvents = this.events.filter(e => e.sessionId === this.sessionId);
    return {
      sessionId: this.sessionId,
      eventCount: sessionEvents.length,
      duration: Date.now() - (sessionEvents[0]?.timestamp || Date.now()),
      categories: this.groupBy(sessionEvents, 'category'),
    };
  }

  private getUserStats(): any {
    if (!this.config.userId) return null;

    const userEvents = this.events.filter(e => e.userId === this.config.userId);
    return {
      userId: this.config.userId,
      totalEvents: userEvents.length,
      categories: this.groupBy(userEvents, 'category'),
      lastActivity: Math.max(...userEvents.map(e => e.timestamp)),
    };
  }

  private groupBy<T>(array: T[], key: keyof T): Record<string, number> {
    return array.reduce((acc, item) => {
      const group = String(item[key]);
      acc[group] = (acc[group] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getClientIP(): string | undefined {
    // Would be implemented to get client IP (server-side or via service)
    return undefined;
  }

  private initializePerformanceTracking(): void {
    if (!this.config.enablePerformance || typeof window === 'undefined') return;

    try {
      this.performanceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.track('performance_metric', {
            name: entry.name,
            duration: entry.duration,
            startTime: entry.startTime,
            entryType: entry.entryType,
          }, 'performance');
        }
      });

      this.performanceObserver.observe({ entryTypes: ['navigation', 'resource', 'measure'] });
    } catch (error) {
      console.warn('Performance tracking not available:', error);
    }
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  private notifyListeners(event: AnalyticsEvent): void {
    this.listeners.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Analytics listener error:', error);
      }
    });
  }

  private persistEvent(event: AnalyticsEvent): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem('taptap_analytics_events') || '[]';
      const events = JSON.parse(stored);
      events.push(event);

      // Keep only last 1000 events
      if (events.length > 1000) {
        events.splice(0, events.length - 1000);
      }

      localStorage.setItem('taptap_analytics_events', JSON.stringify(events));
    } catch (error) {
      console.warn('Failed to persist analytics event:', error);
    }
  }

  private persistKPI(kpi: KPIMetric): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem('taptap_analytics_kpis') || '[]';
      const kpis = JSON.parse(stored);
      kpis.push(kpi);

      // Keep only last 500 KPIs
      if (kpis.length > 500) {
        kpis.splice(0, kpis.length - 500);
      }

      localStorage.setItem('taptap_analytics_kpis', JSON.stringify(kpis));
    } catch (error) {
      console.warn('Failed to persist KPI:', error);
    }
  }

  private persistConsent(consent: UserConsent): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem('taptap_analytics_consent', JSON.stringify(consent));
    } catch (error) {
      console.warn('Failed to persist consent:', error);
    }
  }

  private async sendToAnalyticsService(events: AnalyticsEvent[], kpis: KPIMetric[]): Promise<void> {
    // Implementation would send to analytics backend
    console.log('Analytics data sent:', { events: events.length, kpis: kpis.length });
  }
}
