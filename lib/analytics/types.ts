/**
 * Analytics App Types and Interfaces
 * Comprehensive type definitions for the TapTap Analytics system
 */

export interface AnalyticsEvent {
  id: string;
  type: string;
  category: 'user' | 'content' | 'engagement' | 'system' | 'business';
  action: string;
  label?: string;
  value?: number;
  
  // Context
  user_id?: string;
  session_id: string;
  timestamp: number;
  
  // Properties
  properties: Record<string, any>;
  
  // Technical metadata
  user_agent?: string;
  ip_address?: string;
  referrer?: string;
  page_url?: string;
  
  // Processing
  processed: boolean;
  processed_at?: number;
  batch_id?: string;
}

export interface AnalyticsMetric {
  id: string;
  name: string;
  display_name: string;
  description: string;
  type: 'counter' | 'gauge' | 'histogram' | 'rate' | 'percentage' | 'duration';
  category: 'engagement' | 'performance' | 'business' | 'technical' | 'custom';
  
  // Calculation
  calculation: MetricCalculation;
  aggregation: 'sum' | 'avg' | 'min' | 'max' | 'count' | 'distinct' | 'percentile';
  
  // Display
  unit: string;
  format: 'number' | 'percentage' | 'currency' | 'duration' | 'bytes';
  decimal_places: number;
  
  // Configuration
  is_real_time: boolean;
  update_frequency: number; // seconds
  retention_days: number;
  
  // Metadata
  created_at: number;
  updated_at: number;
  created_by: string;
  tags: string[];
}

export interface MetricCalculation {
  source_events: string[]; // Event types to include
  filters: AnalyticsFilter[];
  grouping: string[]; // Group by fields
  time_window?: number; // seconds
  custom_formula?: string; // For complex calculations
}

export interface AnalyticsFilter {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'in' | 'not_in' | 'exists' | 'not_exists';
  value: any;
  case_sensitive?: boolean;
}

export interface AnalyticsDashboard {
  id: string;
  name: string;
  description?: string;
  type: 'overview' | 'engagement' | 'performance' | 'business' | 'custom';
  
  // Layout
  layout: DashboardLayout;
  widgets: DashboardWidget[];
  
  // Configuration
  refresh_interval: number; // seconds
  auto_refresh: boolean;
  time_range: TimeRange;
  
  // Access
  visibility: 'public' | 'private' | 'shared';
  shared_with: string[];
  created_by: string;
  
  // Metadata
  created_at: number;
  updated_at: number;
  last_viewed_at: number;
  view_count: number;
  
  // Export
  export_formats: ('json' | 'csv' | 'pdf' | 'png')[];
  scheduled_exports: ScheduledExport[];
}

export interface DashboardLayout {
  columns: number;
  rows: number;
  grid_size: number;
  responsive: boolean;
}

export interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'text' | 'image' | 'iframe';
  title: string;
  description?: string;
  
  // Position and size
  position: { x: number; y: number };
  size: { width: number; height: number };
  
  // Configuration
  config: WidgetConfig;
  
  // Data
  metric_ids: string[];
  filters: AnalyticsFilter[];
  time_range?: TimeRange;
  
  // Display
  refresh_interval?: number;
  show_legend: boolean;
  show_title: boolean;
  
  // Interaction
  clickable: boolean;
  drill_down_url?: string;
}

export interface WidgetConfig {
  chart_type?: 'line' | 'bar' | 'pie' | 'doughnut' | 'area' | 'scatter' | 'heatmap';
  color_scheme?: string[];
  show_data_labels?: boolean;
  show_grid?: boolean;
  animation_enabled?: boolean;
  
  // Table specific
  columns?: TableColumn[];
  pagination?: boolean;
  sorting?: boolean;
  
  // Text specific
  content?: string;
  font_size?: number;
  alignment?: 'left' | 'center' | 'right';
}

export interface TableColumn {
  field: string;
  title: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  format?: string;
  sortable: boolean;
  width?: number;
}

export interface TimeRange {
  type: 'relative' | 'absolute';
  
  // Relative
  period?: 'last_hour' | 'last_24h' | 'last_7d' | 'last_30d' | 'last_90d' | 'last_year';
  
  // Absolute
  start_date?: number;
  end_date?: number;
  
  // Timezone
  timezone?: string;
}

export interface AnalyticsReport {
  id: string;
  name: string;
  description?: string;
  type: 'scheduled' | 'ad_hoc' | 'automated';
  
  // Content
  dashboard_id?: string;
  metrics: string[];
  filters: AnalyticsFilter[];
  time_range: TimeRange;
  
  // Generation
  format: 'pdf' | 'csv' | 'json' | 'excel';
  template?: string;
  
  // Scheduling
  schedule?: ReportSchedule;
  
  // Distribution
  recipients: string[];
  delivery_method: 'email' | 'webhook' | 'download';
  
  // Status
  status: 'pending' | 'generating' | 'completed' | 'failed';
  generated_at?: number;
  file_url?: string;
  error_message?: string;
  
  // Metadata
  created_at: number;
  created_by: string;
}

export interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  day_of_week?: number; // 0-6, Sunday = 0
  day_of_month?: number; // 1-31
  time: string; // HH:MM format
  timezone: string;
  enabled: boolean;
}

export interface ScheduledExport {
  id: string;
  dashboard_id: string;
  format: 'json' | 'csv' | 'pdf' | 'png';
  schedule: ReportSchedule;
  recipients: string[];
  last_export_at?: number;
  next_export_at: number;
  enabled: boolean;
}

export interface AnalyticsTrend {
  metric_id: string;
  time_period: 'hour' | 'day' | 'week' | 'month';
  data_points: TrendDataPoint[];
  
  // Analysis
  trend_direction: 'up' | 'down' | 'stable' | 'volatile';
  trend_strength: number; // 0-100
  change_percentage: number;
  
  // Forecasting
  forecast_points?: TrendDataPoint[];
  confidence_interval?: number;
  
  // Anomalies
  anomalies: TrendAnomaly[];
  
  // Metadata
  calculated_at: number;
  data_quality_score: number;
}

export interface TrendDataPoint {
  timestamp: number;
  value: number;
  confidence?: number;
  is_forecast?: boolean;
  is_anomaly?: boolean;
}

export interface TrendAnomaly {
  timestamp: number;
  expected_value: number;
  actual_value: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'spike' | 'drop' | 'pattern_break' | 'seasonal_deviation';
  confidence: number;
  description: string;
}

export interface AnalyticsAlert {
  id: string;
  name: string;
  description?: string;
  metric_id: string;
  
  // Conditions
  condition: AlertCondition;
  threshold_value: number;
  comparison_period?: number; // seconds
  
  // Notification
  notification_channels: NotificationChannel[];
  cooldown_period: number; // seconds
  
  // Status
  enabled: boolean;
  last_triggered_at?: number;
  trigger_count: number;
  
  // Metadata
  created_at: number;
  created_by: string;
}

export interface AlertCondition {
  type: 'threshold' | 'change' | 'anomaly' | 'trend';
  operator: 'greater_than' | 'less_than' | 'equals' | 'change_by' | 'anomaly_detected';
  time_window: number; // seconds
  min_data_points: number;
}

export interface NotificationChannel {
  type: 'email' | 'webhook' | 'slack' | 'sms' | 'push';
  config: Record<string, any>;
  enabled: boolean;
}

export interface AnalyticsSession {
  id: string;
  user_id?: string;
  started_at: number;
  ended_at?: number;
  duration?: number;
  
  // Activity
  page_views: number;
  events_count: number;
  last_activity_at: number;
  
  // Technical
  user_agent: string;
  ip_address: string;
  referrer?: string;
  landing_page: string;
  exit_page?: string;
  
  // Geography
  country?: string;
  region?: string;
  city?: string;
  
  // Device
  device_type: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  os: string;
  screen_resolution?: string;
  
  // Engagement
  bounce: boolean;
  conversion_events: string[];
  goal_completions: number;
}

export interface AnalyticsGoal {
  id: string;
  name: string;
  description?: string;
  type: 'event' | 'page_view' | 'duration' | 'custom';
  
  // Configuration
  target_events: string[];
  target_pages?: string[];
  target_duration?: number;
  custom_condition?: string;
  
  // Value
  value_per_completion: number;
  currency: string;
  
  // Tracking
  total_completions: number;
  completion_rate: number;
  average_value: number;
  
  // Metadata
  created_at: number;
  created_by: string;
  enabled: boolean;
}

export interface AnalyticsExport {
  id: string;
  type: 'dashboard' | 'report' | 'raw_data';
  format: 'json' | 'csv' | 'pdf' | 'excel' | 'png';
  
  // Content
  dashboard_id?: string;
  report_id?: string;
  metrics?: string[];
  filters: AnalyticsFilter[];
  time_range: TimeRange;
  
  // Processing
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  
  // Output
  file_url?: string;
  file_size?: number;
  download_count: number;
  expires_at: number;
  
  // Error handling
  error_message?: string;
  retry_count: number;
  
  // Metadata
  created_at: number;
  created_by: string;
  completed_at?: number;
}

export interface AnalyticsConfiguration {
  // Data collection
  sampling_rate: number; // 0-1
  batch_size: number;
  flush_interval: number; // seconds
  
  // Storage
  retention_policy: {
    raw_events: number; // days
    aggregated_data: number; // days
    reports: number; // days
  };
  
  // Performance
  real_time_processing: boolean;
  max_concurrent_queries: number;
  query_timeout: number; // seconds
  
  // Privacy
  anonymize_ip: boolean;
  respect_do_not_track: boolean;
  gdpr_compliance: boolean;
  
  // Features
  enable_real_time_dashboards: boolean;
  enable_trend_analysis: boolean;
  enable_anomaly_detection: boolean;
  enable_forecasting: boolean;
}
