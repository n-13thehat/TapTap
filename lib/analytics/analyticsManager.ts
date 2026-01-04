/**
 * Analytics Manager
 * Core analytics system with real-time processing and metric calculation
 */

import { 
  AnalyticsEvent, 
  AnalyticsMetric, 
  AnalyticsDashboard,
  AnalyticsSession,
  AnalyticsTrend,
  AnalyticsConfiguration 
} from './types';
import { eventBus, EventTypes } from '../eventBus';

export class AnalyticsManager {
  private events: Map<string, AnalyticsEvent> = new Map();
  private metrics: Map<string, AnalyticsMetric> = new Map();
  private dashboards: Map<string, AnalyticsDashboard> = new Map();
  private sessions: Map<string, AnalyticsSession> = new Map();
  private trends: Map<string, AnalyticsTrend> = new Map();
  
  private currentSession: AnalyticsSession | null = null;
  private eventQueue: AnalyticsEvent[] = [];
  private processingTimer: NodeJS.Timeout | null = null;
  private realTimeSubscribers: Map<string, Set<(data: any) => void>> = new Map();
  
  private config: AnalyticsConfiguration;
  private userId?: string;

  constructor(userId?: string, config?: Partial<AnalyticsConfiguration>) {
    this.userId = userId;
    this.config = {
      sampling_rate: 1.0,
      batch_size: 100,
      flush_interval: 5, // 5 seconds
      retention_policy: {
        raw_events: 90,
        aggregated_data: 365,
        reports: 30,
      },
      real_time_processing: true,
      max_concurrent_queries: 10,
      query_timeout: 30,
      anonymize_ip: true,
      respect_do_not_track: false,
      gdpr_compliance: true,
      enable_real_time_dashboards: true,
      enable_trend_analysis: true,
      enable_anomaly_detection: true,
      enable_forecasting: true,
      ...config,
    };

    this.initializeDefaultMetrics();
    this.startSession();
    this.startProcessing();
    this.loadFromStorage();
  }

  /**
   * Track an analytics event
   */
  track(type: string, properties: Record<string, any> = {}): void {
    // Respect Do Not Track
    if (this.config.respect_do_not_track && navigator.doNotTrack === '1') {
      return;
    }

    // Apply sampling
    if (Math.random() > this.config.sampling_rate) {
      return;
    }

    const event: AnalyticsEvent = {
      id: this.generateId(),
      type,
      category: this.categorizeEvent(type),
      action: properties.action || type,
      label: properties.label,
      value: properties.value,
      user_id: this.userId,
      session_id: this.currentSession?.id || 'unknown',
      timestamp: Date.now(),
      properties: { ...properties },
      user_agent: navigator.userAgent,
      page_url: window.location.href,
      referrer: document.referrer,
      processed: false,
    };

    // Add to queue
    this.eventQueue.push(event);
    this.events.set(event.id, event);

    // Update current session
    if (this.currentSession) {
      this.currentSession.events_count++;
      this.currentSession.last_activity_at = Date.now();
    }

    // Real-time processing for critical events
    if (this.config.real_time_processing && this.isCriticalEvent(type)) {
      this.processEvent(event);
    }

    console.log(`Analytics event tracked: ${type}`, properties);
  }

  /**
   * Create custom metric
   */
  createMetric(metricData: Omit<AnalyticsMetric, 'id' | 'created_at' | 'updated_at'>): string {
    const metric: AnalyticsMetric = {
      ...metricData,
      id: this.generateId(),
      created_at: Date.now(),
      updated_at: Date.now(),
    };

    this.metrics.set(metric.id, metric);
    this.persistToStorage();

    console.log(`Custom metric created: ${metric.name}`);
    return metric.id;
  }

  /**
   * Get metric value
   */
  async getMetricValue(metricId: string, timeRange?: { start: number; end: number }): Promise<number> {
    const metric = this.metrics.get(metricId);
    if (!metric) {
      throw new Error('Metric not found');
    }

    const relevantEvents = this.getEventsForMetric(metric, timeRange);
    return this.calculateMetricValue(metric, relevantEvents);
  }

  /**
   * Get real-time metric data
   */
  subscribeToMetric(metricId: string, callback: (value: number) => void): () => void {
    if (!this.realTimeSubscribers.has(metricId)) {
      this.realTimeSubscribers.set(metricId, new Set());
    }
    
    this.realTimeSubscribers.get(metricId)!.add(callback);

    // Send initial value
    this.getMetricValue(metricId).then(callback).catch(console.error);

    // Return unsubscribe function
    return () => {
      const subscribers = this.realTimeSubscribers.get(metricId);
      if (subscribers) {
        subscribers.delete(callback);
        if (subscribers.size === 0) {
          this.realTimeSubscribers.delete(metricId);
        }
      }
    };
  }

  /**
   * Create dashboard
   */
  createDashboard(dashboardData: Omit<AnalyticsDashboard, 'id' | 'created_at' | 'updated_at' | 'view_count'>): string {
    const dashboard: AnalyticsDashboard = {
      ...dashboardData,
      id: this.generateId(),
      created_at: Date.now(),
      updated_at: Date.now(),
      last_viewed_at: Date.now(),
      view_count: 0,
    };

    this.dashboards.set(dashboard.id, dashboard);
    this.persistToStorage();

    console.log(`Dashboard created: ${dashboard.name}`);
    return dashboard.id;
  }

  /**
   * Get dashboard data
   */
  async getDashboardData(dashboardId: string): Promise<{
    dashboard: AnalyticsDashboard;
    widgets: Array<{ widget: any; data: any }>;
  }> {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) {
      throw new Error('Dashboard not found');
    }

    // Update view count
    dashboard.view_count++;
    dashboard.last_viewed_at = Date.now();

    const widgets = await Promise.all(
      dashboard.widgets.map(async (widget) => {
        const data = await this.getWidgetData(widget);
        return { widget, data };
      })
    );

    return { dashboard, widgets };
  }

  /**
   * Generate trend analysis
   */
  async generateTrend(metricId: string, period: 'hour' | 'day' | 'week' | 'month'): Promise<AnalyticsTrend> {
    const metric = this.metrics.get(metricId);
    if (!metric) {
      throw new Error('Metric not found');
    }

    const dataPoints = await this.getTrendDataPoints(metricId, period);
    const trend = this.analyzeTrend(dataPoints);
    const anomalies = this.detectAnomalies(dataPoints);

    const trendData: AnalyticsTrend = {
      metric_id: metricId,
      time_period: period,
      data_points: dataPoints,
      trend_direction: trend.direction,
      trend_strength: trend.strength,
      change_percentage: trend.changePercentage,
      anomalies,
      calculated_at: Date.now(),
      data_quality_score: this.calculateDataQuality(dataPoints),
    };

    // Add forecasting if enabled
    if (this.config.enable_forecasting && dataPoints.length >= 10) {
      trendData.forecast_points = this.generateForecast(dataPoints);
      trendData.confidence_interval = 0.95;
    }

    this.trends.set(`${metricId}_${period}`, trendData);
    return trendData;
  }

  /**
   * Export analytics data
   */
  async exportData(
    format: 'json' | 'csv' | 'excel',
    options: {
      metrics?: string[];
      timeRange?: { start: number; end: number };
      filters?: any[];
    }
  ): Promise<{ data: any; filename: string }> {
    const { metrics = [], timeRange, filters = [] } = options;
    
    let data: any;
    let filename: string;

    switch (format) {
      case 'json':
        data = await this.exportToJSON(metrics, timeRange, filters);
        filename = `analytics_export_${Date.now()}.json`;
        break;
      
      case 'csv':
        data = await this.exportToCSV(metrics, timeRange, filters);
        filename = `analytics_export_${Date.now()}.csv`;
        break;
      
      case 'excel':
        data = await this.exportToExcel(metrics, timeRange, filters);
        filename = `analytics_export_${Date.now()}.xlsx`;
        break;
      
      default:
        throw new Error('Unsupported export format');
    }

    console.log(`Analytics data exported: ${format}`);
    return { data, filename };
  }

  /**
   * Get analytics overview
   */
  getOverview(): {
    totalEvents: number;
    activeSession: AnalyticsSession | null;
    topMetrics: Array<{ metric: AnalyticsMetric; value: number }>;
    recentTrends: AnalyticsTrend[];
  } {
    const totalEvents = this.events.size;
    const activeSession = this.currentSession;
    
    // Get top metrics (simplified)
    const topMetrics = Array.from(this.metrics.values())
      .slice(0, 5)
      .map(metric => ({
        metric,
        value: Math.floor(Math.random() * 1000), // Mock value
      }));

    const recentTrends = Array.from(this.trends.values())
      .sort((a, b) => b.calculated_at - a.calculated_at)
      .slice(0, 3);

    return {
      totalEvents,
      activeSession,
      topMetrics,
      recentTrends,
    };
  }

  // Private methods
  private startSession(): void {
    this.currentSession = {
      id: this.generateId(),
      user_id: this.userId,
      started_at: Date.now(),
      page_views: 1,
      events_count: 0,
      last_activity_at: Date.now(),
      user_agent: navigator.userAgent,
      ip_address: 'anonymized',
      landing_page: window.location.href,
      device_type: this.detectDeviceType(),
      browser: this.detectBrowser(),
      os: this.detectOS(),
      bounce: false,
      conversion_events: [],
      goal_completions: 0,
    };

    this.sessions.set(this.currentSession.id, this.currentSession);
    console.log(`Analytics session started: ${this.currentSession.id}`);
  }

  private startProcessing(): void {
    this.processingTimer = setInterval(() => {
      this.processEventQueue();
    }, this.config.flush_interval * 1000);
  }

  private processEventQueue(): void {
    if (this.eventQueue.length === 0) return;

    const batch = this.eventQueue.splice(0, this.config.batch_size);
    
    batch.forEach(event => {
      this.processEvent(event);
    });

    console.log(`Processed ${batch.length} analytics events`);
  }

  private processEvent(event: AnalyticsEvent): void {
    event.processed = true;
    event.processed_at = Date.now();

    // Update real-time metrics
    this.updateRealTimeMetrics(event);

    // Emit event for external listeners
    eventBus.emit(EventTypes.ANALYTICS_EVENT_PROCESSED, {
      eventId: event.id,
      type: event.type,
      category: event.category,
      userId: event.user_id,
    }, {
      userId: event.user_id,
      source: 'analytics-manager',
    });
  }

  private updateRealTimeMetrics(event: AnalyticsEvent): void {
    // Find metrics that should be updated by this event
    const relevantMetrics = Array.from(this.metrics.values())
      .filter(metric => 
        metric.is_real_time && 
        metric.calculation.source_events.includes(event.type)
      );

    relevantMetrics.forEach(async (metric) => {
      try {
        const newValue = await this.getMetricValue(metric.id);
        
        // Notify subscribers
        const subscribers = this.realTimeSubscribers.get(metric.id);
        if (subscribers) {
          subscribers.forEach(callback => callback(newValue));
        }
      } catch (error) {
        console.error(`Failed to update real-time metric ${metric.id}:`, error);
      }
    });
  }

  private categorizeEvent(type: string): AnalyticsEvent['category'] {
    if (type.includes('user') || type.includes('login') || type.includes('signup')) {
      return 'user';
    }
    if (type.includes('play') || type.includes('like') || type.includes('share')) {
      return 'engagement';
    }
    if (type.includes('track') || type.includes('playlist') || type.includes('battle')) {
      return 'content';
    }
    if (type.includes('error') || type.includes('performance')) {
      return 'system';
    }
    return 'business';
  }

  private isCriticalEvent(type: string): boolean {
    const criticalEvents = ['error', 'crash', 'payment', 'signup', 'conversion'];
    return criticalEvents.some(critical => type.includes(critical));
  }

  private getEventsForMetric(metric: AnalyticsMetric, timeRange?: { start: number; end: number }): AnalyticsEvent[] {
    let events = Array.from(this.events.values())
      .filter(event => metric.calculation.source_events.includes(event.type));

    if (timeRange) {
      events = events.filter(event => 
        event.timestamp >= timeRange.start && 
        event.timestamp <= timeRange.end
      );
    }

    // Apply filters
    metric.calculation.filters.forEach(filter => {
      events = events.filter(event => this.applyFilter(event, filter));
    });

    return events;
  }

  private applyFilter(event: AnalyticsEvent, filter: any): boolean {
    const value = this.getEventFieldValue(event, filter.field);
    
    switch (filter.operator) {
      case 'equals':
        return value === filter.value;
      case 'not_equals':
        return value !== filter.value;
      case 'contains':
        return String(value).includes(String(filter.value));
      case 'greater_than':
        return Number(value) > Number(filter.value);
      case 'less_than':
        return Number(value) < Number(filter.value);
      default:
        return true;
    }
  }

  private getEventFieldValue(event: AnalyticsEvent, field: string): any {
    if (field.startsWith('properties.')) {
      const propName = field.substring(11);
      return event.properties[propName];
    }
    return (event as any)[field];
  }

  private calculateMetricValue(metric: AnalyticsMetric, events: AnalyticsEvent[]): number {
    switch (metric.aggregation) {
      case 'count':
        return events.length;
      case 'sum':
        return events.reduce((sum, event) => sum + (event.value || 0), 0);
      case 'avg':
        const values = events.map(event => event.value || 0);
        return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
      case 'distinct':
        const uniqueValues = new Set(events.map(event => event.user_id));
        return uniqueValues.size;
      default:
        return events.length;
    }
  }

  private async getWidgetData(widget: any): Promise<any> {
    // Mock widget data generation
    const data = {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [{
        label: widget.title,
        data: Array.from({ length: 6 }, () => Math.floor(Math.random() * 100)),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
      }],
    };

    return data;
  }

  private async getTrendDataPoints(metricId: string, period: string): Promise<any[]> {
    // Mock trend data generation
    const now = Date.now();
    const periodMs = period === 'hour' ? 3600000 : 
                   period === 'day' ? 86400000 : 
                   period === 'week' ? 604800000 : 2592000000;

    const points = [];
    for (let i = 29; i >= 0; i--) {
      points.push({
        timestamp: now - (i * periodMs),
        value: Math.floor(Math.random() * 100) + 50,
        confidence: 0.95,
      });
    }

    return points;
  }

  private analyzeTrend(dataPoints: any[]): { direction: 'stable' | 'up' | 'down' | 'volatile'; strength: number; changePercentage: number } {
    if (dataPoints.length < 2) {
      return { direction: 'stable', strength: 0, changePercentage: 0 };
    }

    const firstValue = dataPoints[0].value;
    const lastValue = dataPoints[dataPoints.length - 1].value;
    const changePercentage = ((lastValue - firstValue) / firstValue) * 100;

    let direction: 'stable' | 'up' | 'down' | 'volatile' = 'stable';
    if (Math.abs(changePercentage) > 5) {
      direction = changePercentage > 0 ? 'up' : 'down';
    }

    const strength = Math.min(100, Math.abs(changePercentage) * 2);

    return { direction, strength, changePercentage };
  }

  private detectAnomalies(dataPoints: any[]): any[] {
    // Simple anomaly detection
    const values = dataPoints.map(p => p.value);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(values.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / values.length);

    const anomalies: AnalyticsTrend['anomalies'] = [];
    dataPoints.forEach((point, index) => {
      const zScore = Math.abs((point.value - mean) / stdDev);
      if (zScore > 2) { // 2 standard deviations
        anomalies.push({
          timestamp: point.timestamp,
          expected_value: mean,
          actual_value: point.value,
          severity: zScore > 3 ? 'high' : 'medium',
          type: point.value > mean ? 'spike' : 'drop',
          confidence: Math.min(100, zScore * 30),
          description: `Value ${point.value > mean ? 'spike' : 'drop'} detected`,
        });
      }
    });

    return anomalies;
  }

  private generateForecast(dataPoints: any[]): any[] {
    // Simple linear forecast
    const values = dataPoints.map(p => p.value);
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((sum, y, x) => sum + x * y, 0);
    const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const forecast = [];
    const lastTimestamp = dataPoints[dataPoints.length - 1].timestamp;
    const timeStep = dataPoints[1].timestamp - dataPoints[0].timestamp;

    for (let i = 1; i <= 7; i++) {
      const forecastValue = intercept + slope * (n + i - 1);
      forecast.push({
        timestamp: lastTimestamp + (i * timeStep),
        value: Math.max(0, forecastValue),
        confidence: Math.max(0.5, 0.95 - (i * 0.1)),
        is_forecast: true,
      });
    }

    return forecast;
  }

  private calculateDataQuality(dataPoints: any[]): number {
    if (dataPoints.length === 0) return 0;
    
    // Simple data quality score based on completeness and consistency
    const completeness = dataPoints.filter(p => p.value !== null && p.value !== undefined).length / dataPoints.length;
    const consistency = 1 - (this.calculateVariationCoefficient(dataPoints.map(p => p.value)) / 100);
    
    return Math.round((completeness * 0.6 + Math.max(0, consistency) * 0.4) * 100);
  }

  private calculateVariationCoefficient(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(values.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / values.length);
    return mean !== 0 ? (stdDev / mean) * 100 : 0;
  }

  private async exportToJSON(metrics: string[], timeRange?: any, filters?: any[]): Promise<string> {
    const data = {
      export_timestamp: Date.now(),
      metrics: metrics.map(id => this.metrics.get(id)).filter(Boolean),
      events: Array.from(this.events.values()).slice(0, 1000), // Limit for demo
      time_range: timeRange,
      filters,
    };
    
    return JSON.stringify(data, null, 2);
  }

  private async exportToCSV(metrics: string[], timeRange?: any, filters?: any[]): Promise<string> {
    const events = Array.from(this.events.values()).slice(0, 1000);
    
    const headers = ['timestamp', 'type', 'category', 'action', 'user_id', 'value'];
    const rows = events.map(event => [
      new Date(event.timestamp).toISOString(),
      event.type,
      event.category,
      event.action,
      event.user_id || '',
      event.value || '',
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  private async exportToExcel(metrics: string[], timeRange?: any, filters?: any[]): Promise<Blob> {
    // Mock Excel export - would use a library like xlsx in real implementation
    const csvData = await this.exportToCSV(metrics, timeRange, filters);
    return new Blob([csvData], { type: 'application/vnd.ms-excel' });
  }

  private detectDeviceType(): 'desktop' | 'mobile' | 'tablet' {
    const userAgent = navigator.userAgent;
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) return 'tablet';
    if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) return 'mobile';
    return 'desktop';
  }

  private detectBrowser(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private detectOS(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Unknown';
  }

  private initializeDefaultMetrics(): void {
    // Page views metric
    this.createMetric({
      name: 'page_views',
      display_name: 'Page Views',
      description: 'Total number of page views',
      type: 'counter',
      category: 'engagement',
      calculation: {
        source_events: ['page_view'],
        filters: [],
        grouping: [],
      },
      aggregation: 'count',
      unit: 'views',
      format: 'number',
      decimal_places: 0,
      is_real_time: true,
      update_frequency: 5,
      retention_days: 90,
      created_by: 'system',
      tags: ['core', 'engagement'],
    });

    // Unique users metric
    this.createMetric({
      name: 'unique_users',
      display_name: 'Unique Users',
      description: 'Number of unique users',
      type: 'gauge',
      category: 'engagement',
      calculation: {
        source_events: ['page_view', 'track_play', 'user_login'],
        filters: [],
        grouping: ['user_id'],
      },
      aggregation: 'distinct',
      unit: 'users',
      format: 'number',
      decimal_places: 0,
      is_real_time: true,
      update_frequency: 10,
      retention_days: 90,
      created_by: 'system',
      tags: ['core', 'users'],
    });

    // Track plays metric
    this.createMetric({
      name: 'track_plays',
      display_name: 'Track Plays',
      description: 'Total number of track plays',
      type: 'counter',
      category: 'custom',
      calculation: {
        source_events: ['track_play'],
        filters: [],
        grouping: [],
      },
      aggregation: 'count',
      unit: 'plays',
      format: 'number',
      decimal_places: 0,
      is_real_time: true,
      update_frequency: 5,
      retention_days: 365,
      created_by: 'system',
      tags: ['core', 'content', 'music'],
    });
  }

  private generateId(): string {
    return `analytics_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Storage methods
  private async persistToStorage(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      const data = {
        metrics: Array.from(this.metrics.entries()),
        dashboards: Array.from(this.dashboards.entries()),
        sessions: Array.from(this.sessions.entries()),
        trends: Array.from(this.trends.entries()),
        config: this.config,
      };

      localStorage.setItem(`taptap_analytics_${this.userId || 'anonymous'}`, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to persist analytics data:', error);
    }
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(`taptap_analytics_${this.userId || 'anonymous'}`);
      if (stored) {
        const data = JSON.parse(stored);
        
        this.metrics = new Map(data.metrics || []);
        this.dashboards = new Map(data.dashboards || []);
        this.sessions = new Map(data.sessions || []);
        this.trends = new Map(data.trends || []);
        
        if (data.config) {
          this.config = { ...this.config, ...data.config };
        }

        console.log(`Analytics data loaded: ${this.metrics.size} metrics, ${this.dashboards.size} dashboards`);
      }
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    }
  }

  // Cleanup
  destroy(): void {
    if (this.processingTimer) {
      clearInterval(this.processingTimer);
    }
    
    // End current session
    if (this.currentSession) {
      this.currentSession.ended_at = Date.now();
      this.currentSession.duration = this.currentSession.ended_at - this.currentSession.started_at;
    }

    this.persistToStorage();
  }
}
