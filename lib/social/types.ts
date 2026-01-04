/**
 * Social App Types and Interfaces
 * Comprehensive type definitions for the TapTap Social system
 */

export interface SocialPost {
  id: string;
  content: string;
  author_id: string;
  author: SocialUser;
  type: 'text' | 'track_share' | 'battle_share' | 'playlist_share' | 'image' | 'video';
  
  // Content attachments
  attachments: SocialAttachment[];
  track_id?: string;
  battle_id?: string;
  playlist_id?: string;
  
  // Threading
  parent_id?: string; // For replies
  thread_id?: string; // Root thread ID
  reply_count: number;
  thread_depth: number;
  
  // Engagement
  like_count: number;
  share_count: number;
  comment_count: number;
  view_count: number;
  
  // User interactions
  is_liked: boolean;
  is_shared: boolean;
  is_bookmarked: boolean;
  
  // Timestamps
  created_at: number;
  updated_at: number;
  edited_at?: number;
  
  // Moderation
  moderation_status: 'pending' | 'approved' | 'flagged' | 'removed' | 'shadow_banned';
  moderation_flags: ModerationFlag[];
  moderation_score: number; // 0-100, higher = more problematic
  
  // Visibility
  visibility: 'public' | 'followers' | 'friends' | 'private';
  is_pinned: boolean;
  is_featured: boolean;
  
  // Draft state
  is_draft: boolean;
  draft_saved_at?: number;
  
  // Outbox state
  outbox_status?: 'pending' | 'sending' | 'sent' | 'failed' | 'retrying';
  outbox_attempts?: number;
  outbox_last_attempt?: number;
  outbox_error?: string;
}

export interface SocialUser {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
  verified: boolean;
  follower_count: number;
  following_count: number;
  post_count: number;
  
  // Relationship to current user
  is_following: boolean;
  is_followed_by: boolean;
  is_blocked: boolean;
  is_muted: boolean;
  
  // Moderation
  reputation_score: number;
  trust_level: 'new' | 'basic' | 'member' | 'regular' | 'leader' | 'moderator';
  moderation_flags: string[];
  
  // Activity
  last_active_at: number;
  is_online: boolean;
}

export interface SocialAttachment {
  id: string;
  type: 'image' | 'video' | 'audio' | 'link' | 'track' | 'battle' | 'playlist';
  url: string;
  thumbnail_url?: string;
  title?: string;
  description?: string;
  metadata: Record<string, any>;
  file_size?: number;
  duration?: number;
  dimensions?: { width: number; height: number };
}

export interface ModerationFlag {
  id: string;
  type: 'spam' | 'harassment' | 'hate_speech' | 'inappropriate_content' | 'copyright' | 'misinformation' | 'self_harm';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-100
  flagged_by: 'user' | 'ai' | 'moderator';
  flagged_at: number;
  reason: string;
  context?: string;
  auto_action?: 'none' | 'hide' | 'remove' | 'shadow_ban' | 'suspend_user';
}

export interface SocialDraft {
  id: string;
  user_id: string;
  content: string;
  type: SocialPost['type'];
  attachments: SocialAttachment[];
  parent_id?: string;
  visibility: SocialPost['visibility'];
  
  // Auto-save metadata
  created_at: number;
  last_saved_at: number;
  save_count: number;
  auto_saved: boolean;
  
  // Draft state
  is_complete: boolean;
  validation_errors: string[];
  character_count: number;
  estimated_read_time: number;
}

export interface OutboxItem {
  id: string;
  user_id: string;
  post_data: Partial<SocialPost>;
  action: 'create' | 'update' | 'delete' | 'like' | 'share' | 'follow';
  
  // Retry logic
  status: 'pending' | 'sending' | 'sent' | 'failed' | 'retrying' | 'cancelled';
  attempts: number;
  max_attempts: number;
  next_retry_at: number;
  retry_delay: number; // milliseconds
  
  // Error handling
  last_error?: string;
  error_count: number;
  permanent_failure: boolean;
  
  // Timestamps
  created_at: number;
  last_attempt_at?: number;
  sent_at?: number;
  
  // Priority
  priority: 'low' | 'normal' | 'high' | 'urgent';
  
  // Dependencies
  depends_on?: string[]; // Other outbox item IDs
  blocks?: string[]; // Items that depend on this one
}

export interface SocialThread {
  id: string;
  root_post_id: string;
  root_post: SocialPost;
  reply_count: number;
  participant_count: number;
  participants: SocialUser[];
  
  // Threading structure
  replies: SocialPost[];
  max_depth: number;
  is_collapsed: boolean;
  
  // Engagement
  total_likes: number;
  total_shares: number;
  last_activity_at: number;
  
  // Moderation
  is_locked: boolean;
  lock_reason?: string;
  locked_by?: string;
  locked_at?: number;
}

export interface SocialFeed {
  id: string;
  name: string;
  type: 'home' | 'following' | 'trending' | 'local' | 'hashtag' | 'user' | 'thread';
  posts: SocialPost[];
  
  // Pagination
  has_more: boolean;
  next_cursor?: string;
  total_count?: number;
  
  // Filtering
  filters: SocialFeedFilter;
  sort_by: SocialSortOption;
  
  // Metadata
  last_updated: number;
  refresh_interval: number;
  auto_refresh: boolean;
}

export interface SocialFeedFilter {
  user_ids?: string[];
  post_types?: SocialPost['type'][];
  hashtags?: string[];
  mentions?: string[];
  date_range?: { start: number; end: number };
  has_attachments?: boolean;
  min_engagement?: number;
  exclude_replies?: boolean;
  exclude_reposts?: boolean;
  moderation_status?: ModerationFlag['type'][];
}

export interface SocialSortOption {
  field: 'created_at' | 'updated_at' | 'like_count' | 'comment_count' | 'engagement_score' | 'trending_score';
  direction: 'asc' | 'desc';
}

export interface SocialNotification {
  id: string;
  type: 'like' | 'comment' | 'share' | 'follow' | 'mention' | 'reply' | 'moderation';
  user_id: string;
  actor_id: string;
  actor: SocialUser;
  post_id?: string;
  post?: SocialPost;
  
  // Content
  title: string;
  message: string;
  action_url?: string;
  
  // State
  is_read: boolean;
  is_seen: boolean;
  created_at: number;
  read_at?: number;
  
  // Grouping
  group_key?: string;
  group_count?: number;
  is_grouped: boolean;
}

export interface ModerationAction {
  id: string;
  type: 'approve' | 'flag' | 'hide' | 'remove' | 'shadow_ban' | 'suspend' | 'warn';
  target_type: 'post' | 'user' | 'comment';
  target_id: string;
  moderator_id: string;
  reason: string;
  
  // Auto vs manual
  is_automated: boolean;
  ai_confidence?: number;
  
  // Appeal
  can_appeal: boolean;
  appeal_deadline?: number;
  appeal_id?: string;
  
  // Timestamps
  created_at: number;
  expires_at?: number;
  
  // Context
  context: Record<string, any>;
  evidence_urls?: string[];
}

export interface SocialAnalytics {
  user_id: string;
  period: 'hour' | 'day' | 'week' | 'month';
  
  // Engagement metrics
  posts_created: number;
  likes_received: number;
  comments_received: number;
  shares_received: number;
  followers_gained: number;
  
  // Activity metrics
  posts_liked: number;
  comments_made: number;
  shares_made: number;
  users_followed: number;
  
  // Reach metrics
  total_impressions: number;
  unique_viewers: number;
  engagement_rate: number;
  
  // Content performance
  top_posts: SocialPost[];
  trending_hashtags: string[];
  
  // Moderation metrics
  flags_received: number;
  flags_given: number;
  moderation_actions: number;
}

export interface SocialSettings {
  user_id: string;
  
  // Privacy
  profile_visibility: 'public' | 'followers' | 'private';
  allow_mentions: boolean;
  allow_direct_messages: boolean;
  require_follow_approval: boolean;
  
  // Notifications
  email_notifications: boolean;
  push_notifications: boolean;
  notification_types: Record<SocialNotification['type'], boolean>;
  
  // Content
  auto_save_drafts: boolean;
  auto_save_interval: number; // seconds
  default_post_visibility: SocialPost['visibility'];
  
  // Moderation
  content_filter_level: 'off' | 'low' | 'medium' | 'high';
  hide_sensitive_content: boolean;
  block_new_accounts: boolean;
  
  // Outbox
  retry_failed_posts: boolean;
  max_retry_attempts: number;
  retry_delay_multiplier: number;
}
