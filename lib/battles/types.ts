/**
 * Battles App Types and Interfaces
 * Comprehensive type definitions for the TapTap Battles system
 */

import { Track } from '@/types/track';

export interface Battle {
  id: string;
  title: string;
  description?: string;
  type: 'head_to_head' | 'tournament' | 'bracket' | 'community_vote' | 'timed_challenge';
  status: 'draft' | 'active' | 'voting' | 'completed' | 'cancelled';
  
  // Participants
  tracks: BattleTrack[];
  max_participants: number;
  min_participants: number;
  
  // Timing
  created_at: number;
  updated_at: number;
  starts_at: number;
  voting_starts_at: number;
  voting_ends_at: number;
  ends_at: number;
  
  // Creator and moderation
  created_by: string;
  moderators: string[];
  
  // Voting configuration
  voting_config: VotingConfig;
  
  // Results
  results?: BattleResults;
  winner_track_id?: string;
  
  // Metadata
  tags: string[];
  genre?: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  prize_pool?: PrizePool;
  entry_fee?: number;
  
  // Analytics
  total_votes: number;
  total_participants: number;
  view_count: number;
  engagement_score: number;
}

export interface BattleTrack {
  track: Track;
  submitted_by: string;
  submitted_at: number;
  votes: number;
  vote_percentage: number;
  position: number;
  eliminated_at?: number;
  advancement_round?: number;
}

export interface VotingConfig {
  votes_per_user: number;
  allow_vote_changes: boolean;
  require_authentication: boolean;
  voting_duration: number; // seconds
  fraud_detection_enabled: boolean;
  rate_limit_per_minute: number;
  cooldown_between_votes: number; // seconds
  weight_by_user_reputation: boolean;
  anonymous_voting: boolean;
}

export interface Vote {
  id: string;
  battle_id: string;
  track_id: string;
  user_id: string;
  weight: number; // 1.0 = normal vote, can be adjusted for reputation
  timestamp: number;
  ip_address?: string;
  user_agent?: string;
  session_id: string;
  
  // Fraud detection metadata
  fraud_score: number; // 0-100, higher = more suspicious
  fraud_flags: FraudFlag[];
  is_verified: boolean;
  verification_method?: 'captcha' | 'email' | 'phone' | 'manual';
}

export interface FraudFlag {
  type: 'duplicate_ip' | 'rapid_voting' | 'suspicious_pattern' | 'bot_behavior' | 'vpn_detected' | 'new_account';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  confidence: number; // 0-100
  detected_at: number;
}

export interface BattleResults {
  final_rankings: BattleTrack[];
  vote_breakdown: VoteBreakdown[];
  statistics: BattleStatistics;
  fraud_report: FraudReport;
  recap: BattleRecap;
}

export interface VoteBreakdown {
  track_id: string;
  total_votes: number;
  verified_votes: number;
  flagged_votes: number;
  vote_timeline: VoteTimelineEntry[];
  demographic_breakdown: Record<string, number>;
}

export interface VoteTimelineEntry {
  timestamp: number;
  cumulative_votes: number;
  vote_rate: number; // votes per minute
}

export interface BattleStatistics {
  total_votes_cast: number;
  verified_votes: number;
  flagged_votes: number;
  unique_voters: number;
  average_vote_time: number;
  peak_voting_rate: number;
  geographic_distribution: Record<string, number>;
  device_distribution: Record<string, number>;
  engagement_metrics: {
    bounce_rate: number;
    average_session_duration: number;
    return_voter_rate: number;
  };
}

export interface FraudReport {
  total_fraud_score: number;
  flagged_votes_count: number;
  fraud_patterns_detected: string[];
  recommended_actions: string[];
  confidence_level: number;
  investigation_notes?: string;
}

export interface BattleRecap {
  id: string;
  battle_id: string;
  type: 'text' | 'video' | 'audio' | 'interactive';
  content: RecapContent;
  generated_at: number;
  generated_by: 'ai' | 'human' | 'hybrid';
  status: 'generating' | 'ready' | 'published' | 'archived';
  engagement_stats: {
    views: number;
    shares: number;
    likes: number;
    comments: number;
  };
}

export interface RecapContent {
  title: string;
  summary: string;
  highlights: RecapHighlight[];
  key_moments: KeyMoment[];
  winner_spotlight: WinnerSpotlight;
  statistics_summary: string;
  media_assets: MediaAsset[];
}

export interface RecapHighlight {
  type: 'comeback' | 'upset' | 'close_race' | 'dominant_performance' | 'controversy';
  title: string;
  description: string;
  timestamp?: number;
  tracks_involved: string[];
  significance_score: number;
}

export interface KeyMoment {
  timestamp: number;
  event_type: 'voting_surge' | 'lead_change' | 'elimination' | 'milestone';
  description: string;
  impact_score: number;
  related_tracks: string[];
}

export interface WinnerSpotlight {
  track_id: string;
  victory_margin: number;
  victory_type: 'landslide' | 'comfortable' | 'narrow' | 'upset';
  winning_factors: string[];
  quote?: string;
  celebration_media?: string;
}

export interface MediaAsset {
  type: 'image' | 'video' | 'audio' | 'gif';
  url: string;
  caption?: string;
  timestamp?: number;
  duration?: number;
}

export interface PrizePool {
  total_value: number;
  currency: 'USD' | 'tokens' | 'credits';
  distribution: PrizeDistribution[];
  sponsor?: string;
  terms_url?: string;
}

export interface PrizeDistribution {
  position: number;
  amount: number;
  percentage: number;
  additional_rewards?: string[];
}

export interface BattleCreationWizard {
  step: 'basic' | 'tracks' | 'voting' | 'timing' | 'prizes' | 'review';
  data: Partial<Battle>;
  validation_errors: Record<string, string>;
  suggestions: WizardSuggestion[];
}

export interface WizardSuggestion {
  type: 'track_recommendation' | 'timing_optimization' | 'voting_config' | 'prize_suggestion';
  title: string;
  description: string;
  action?: () => void;
  priority: 'low' | 'medium' | 'high';
}

export interface BattleAnalytics {
  battle_id: string;
  real_time_metrics: {
    current_votes: number;
    voting_rate: number;
    active_users: number;
    fraud_alerts: number;
  };
  historical_data: {
    vote_progression: VoteTimelineEntry[];
    user_engagement: EngagementMetric[];
    fraud_incidents: FraudIncident[];
  };
  predictions: {
    estimated_final_votes: number;
    projected_winner: string;
    confidence_interval: number;
  };
}

export interface EngagementMetric {
  timestamp: number;
  active_users: number;
  page_views: number;
  average_session_duration: number;
  bounce_rate: number;
}

export interface FraudIncident {
  timestamp: number;
  type: string;
  severity: string;
  affected_votes: number;
  action_taken: string;
  resolved: boolean;
}

export interface VoteRateLimit {
  user_id: string;
  battle_id: string;
  votes_cast: number;
  last_vote_at: number;
  cooldown_until: number;
  daily_limit: number;
  daily_used: number;
  reputation_multiplier: number;
}

export interface BattleNotification {
  id: string;
  type: 'battle_started' | 'voting_opened' | 'battle_ended' | 'fraud_detected' | 'recap_ready';
  battle_id: string;
  user_id: string;
  title: string;
  message: string;
  action_url?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  sent_at: number;
  read_at?: number;
}
