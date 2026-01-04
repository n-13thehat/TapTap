/**
 * Notifications App Types and Interfaces
 * Comprehensive type definitions for the TapTap Notifications system
 */

export interface Notification {
  id: string;
  type: NotificationType;
  category: 'system' | 'social' | 'music' | 'battle' | 'achievement' | 'security' | 'marketing';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  
  // Content
  title: string;
  message: string;
  summary?: string; // Short version for previews
  rich_content?: RichContent;
  
  // Recipients
  user_id: string;
  group_id?: string; // For group notifications
  
  // Delivery
  channels: NotificationChannel[];
  delivery_status: DeliveryStatus;
  
  // Interaction
  action_url?: string;
  actions: NotificationAction[];
  
  // State
  is_read: boolean;
  is_seen: boolean;
  is_dismissed: boolean;
  is_archived: boolean;
  
  // Scheduling
  scheduled_at?: number;
  expires_at?: number;
  
  // Timestamps
  created_at: number;
  sent_at?: number;
  read_at?: number;
  dismissed_at?: number;
  
  // Metadata
  source: string;
  source_id?: string;
  tags: string[];
  custom_data: Record<string, any>;
  
  // Tracking
  delivery_attempts: number;
  last_delivery_attempt?: number;
  delivery_errors: string[];
}

export type NotificationType = 
  | 'like' | 'comment' | 'share' | 'follow' | 'mention'
  | 'track_uploaded' | 'playlist_shared' | 'battle_invite' | 'battle_result'
  | 'achievement_unlocked' | 'level_up' | 'streak_milestone'
  | 'system_update' | 'maintenance' | 'security_alert'
  | 'newsletter' | 'promotion' | 'recommendation'
  | 'reminder' | 'deadline' | 'event';

export interface RichContent {
  html?: string;
  markdown?: string;
  images: NotificationImage[];
  attachments: NotificationAttachment[];
  embedded_player?: EmbeddedPlayer;
}

export interface NotificationImage {
  url: string;
  alt_text: string;
  width?: number;
  height?: number;
  thumbnail_url?: string;
}

export interface NotificationAttachment {
  type: 'audio' | 'video' | 'document' | 'image';
  url: string;
  filename: string;
  size: number;
  mime_type: string;
}

export interface EmbeddedPlayer {
  type: 'track' | 'playlist' | 'battle';
  id: string;
  title: string;
  thumbnail_url?: string;
  duration?: number;
}

export interface NotificationAction {
  id: string;
  label: string;
  type: 'button' | 'link' | 'inline_reply' | 'quick_action';
  action: string; // URL or action identifier
  style: 'primary' | 'secondary' | 'destructive';
  icon?: string;
  requires_confirmation?: boolean;
}

export interface NotificationChannel {
  type: 'push' | 'email' | 'sms' | 'in_app' | 'webhook';
  enabled: boolean;
  config: ChannelConfig;
  delivery_status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced';
  sent_at?: number;
  delivered_at?: number;
  error_message?: string;
}

export interface ChannelConfig {
  // Push notifications
  push_token?: string;
  badge_count?: number;
  sound?: string;
  vibration_pattern?: number[];
  
  // Email
  email_address?: string;
  template_id?: string;
  sender_name?: string;
  reply_to?: string;
  
  // SMS
  phone_number?: string;
  country_code?: string;
  
  // Webhook
  webhook_url?: string;
  webhook_secret?: string;
  headers?: Record<string, string>;
  
  // In-app
  display_duration?: number;
  position?: 'top' | 'bottom' | 'center';
  style?: 'toast' | 'banner' | 'modal';
}

export interface DeliveryStatus {
  total_channels: number;
  sent_channels: number;
  delivered_channels: number;
  failed_channels: number;
  overall_status: 'pending' | 'partial' | 'delivered' | 'failed';
  last_attempt_at?: number;
  next_retry_at?: number;
}

export interface NotificationPreferences {
  user_id: string;
  
  // Global settings
  enabled: boolean;
  quiet_hours: QuietHours;
  frequency_limit: FrequencyLimit;
  
  // Channel preferences
  channels: Record<NotificationChannel['type'], ChannelPreference>;
  
  // Type preferences
  types: Record<NotificationType, TypePreference>;
  
  // Category preferences
  categories: Record<Notification['category'], CategoryPreference>;
  
  // Advanced settings
  grouping_enabled: boolean;
  smart_delivery: boolean;
  priority_override: boolean;
  
  // Metadata
  updated_at: number;
  version: number;
}

export interface QuietHours {
  enabled: boolean;
  start_time: string; // HH:MM format
  end_time: string; // HH:MM format
  timezone: string;
  days: number[]; // 0-6, Sunday = 0
  emergency_override: boolean;
}

export interface FrequencyLimit {
  max_per_hour: number;
  max_per_day: number;
  burst_limit: number;
  cooldown_period: number; // seconds
}

export interface ChannelPreference {
  enabled: boolean;
  priority_threshold: Notification['priority'];
  delivery_window?: {
    start_hour: number;
    end_hour: number;
  };
  rate_limit?: {
    max_per_hour: number;
    max_per_day: number;
  };
}

export interface TypePreference {
  enabled: boolean;
  channels: NotificationChannel['type'][];
  priority: Notification['priority'];
  grouping: boolean;
  delay: number; // seconds
}

export interface CategoryPreference {
  enabled: boolean;
  channels: NotificationChannel['type'][];
  priority_threshold: Notification['priority'];
  batch_delivery: boolean;
  digest_frequency?: 'immediate' | 'hourly' | 'daily' | 'weekly';
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: NotificationType;
  category: Notification['category'];
  
  // Content templates
  title_template: string;
  message_template: string;
  summary_template?: string;
  
  // Channel-specific templates
  email_template?: EmailTemplate;
  push_template?: PushTemplate;
  sms_template?: SmsTemplate;
  
  // Variables
  variables: TemplateVariable[];
  
  // Localization
  localizations: Record<string, LocalizedTemplate>;
  
  // Metadata
  created_at: number;
  updated_at: number;
  version: number;
  is_active: boolean;
}

export interface EmailTemplate {
  subject_template: string;
  html_template: string;
  text_template: string;
  preheader?: string;
  sender_name?: string;
  reply_to?: string;
}

export interface PushTemplate {
  title_template: string;
  body_template: string;
  icon?: string;
  image?: string;
  sound?: string;
  badge?: number;
  click_action?: string;
}

export interface SmsTemplate {
  message_template: string;
  max_length: number;
  unicode_support: boolean;
}

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'url' | 'image';
  required: boolean;
  default_value?: any;
  description: string;
  validation?: VariableValidation;
}

export interface VariableValidation {
  min_length?: number;
  max_length?: number;
  pattern?: string;
  allowed_values?: any[];
}

export interface LocalizedTemplate {
  language: string;
  title_template: string;
  message_template: string;
  summary_template?: string;
  email_template?: EmailTemplate;
  push_template?: PushTemplate;
  sms_template?: SmsTemplate;
}

export interface NotificationDigest {
  id: string;
  user_id: string;
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  frequency: DigestFrequency;
  
  // Content
  title: string;
  summary: string;
  sections: DigestSection[];
  
  // Delivery
  channels: NotificationChannel['type'][];
  scheduled_at: number;
  sent_at?: number;
  
  // Notifications included
  notification_ids: string[];
  notification_count: number;
  
  // Metadata
  created_at: number;
  template_id?: string;
}

export interface DigestFrequency {
  interval: 'hours' | 'days' | 'weeks' | 'months';
  value: number;
  time_of_day?: string; // HH:MM
  day_of_week?: number; // 0-6
  day_of_month?: number; // 1-31
}

export interface DigestSection {
  title: string;
  type: 'notifications' | 'summary' | 'highlights' | 'recommendations';
  notifications: Notification[];
  summary_text?: string;
  action_url?: string;
}

export interface NotificationAnalytics {
  notification_id?: string;
  user_id?: string;
  period: 'hour' | 'day' | 'week' | 'month';
  
  // Delivery metrics
  sent_count: number;
  delivered_count: number;
  failed_count: number;
  bounce_rate: number;
  
  // Engagement metrics
  open_rate: number;
  click_rate: number;
  action_rate: number;
  dismiss_rate: number;
  
  // Channel performance
  channel_performance: Record<NotificationChannel['type'], ChannelMetrics>;
  
  // Type performance
  type_performance: Record<NotificationType, TypeMetrics>;
  
  // Time-based metrics
  best_send_times: number[];
  response_time_avg: number;
  
  // User behavior
  user_preferences_changes: number;
  unsubscribe_rate: number;
  
  // Metadata
  calculated_at: number;
  data_points: number;
}

export interface ChannelMetrics {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  failed: number;
  delivery_rate: number;
  engagement_rate: number;
  avg_delivery_time: number;
}

export interface TypeMetrics {
  sent: number;
  opened: number;
  clicked: number;
  dismissed: number;
  engagement_rate: number;
  avg_response_time: number;
  user_satisfaction: number;
}

export interface NotificationQueue {
  id: string;
  priority: number;
  notifications: QueuedNotification[];
  
  // Processing
  status: 'idle' | 'processing' | 'paused' | 'error';
  processed_count: number;
  failed_count: number;
  
  // Rate limiting
  rate_limit: number; // notifications per second
  burst_limit: number;
  current_burst: number;
  
  // Retry logic
  retry_attempts: number;
  max_retries: number;
  retry_delay: number;
  
  // Metadata
  created_at: number;
  started_at?: number;
  completed_at?: number;
}

export interface QueuedNotification {
  notification: Notification;
  priority: number;
  scheduled_at: number;
  attempts: number;
  last_attempt_at?: number;
  error_message?: string;
}

export interface NotificationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  
  // Conditions
  conditions: RuleCondition[];
  
  // Actions
  actions: RuleAction[];
  
  // Scheduling
  schedule?: RuleSchedule;
  
  // Metadata
  created_at: number;
  updated_at: number;
  last_triggered_at?: number;
  trigger_count: number;
}

export interface RuleCondition {
  type: 'user_property' | 'event' | 'time' | 'frequency' | 'custom';
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
  case_sensitive?: boolean;
}

export interface RuleAction {
  type: 'send_notification' | 'update_preferences' | 'add_to_digest' | 'suppress' | 'escalate';
  config: Record<string, any>;
  delay?: number; // seconds
}

export interface RuleSchedule {
  type: 'immediate' | 'delayed' | 'scheduled' | 'recurring';
  delay?: number; // seconds
  scheduled_at?: number;
  recurring_pattern?: {
    interval: 'minutes' | 'hours' | 'days' | 'weeks' | 'months';
    value: number;
    end_date?: number;
  };
}
