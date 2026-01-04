/**
 * Collaborative Creation Types and Interfaces
 * Real-time collaboration system for music creation with version control and workflow management
 */

import type { AudioEffect, AutomationCurve } from '../audio-processing/types';

export interface CollaborativeProject {
  id: string;
  name: string;
  description: string;
  
  // Project metadata
  owner_id: string;
  collaborators: ProjectCollaborator[];
  created_at: number;
  updated_at: number;
  last_activity: number;
  
  // Project settings
  visibility: 'private' | 'collaborators' | 'public';
  collaboration_mode: 'open' | 'invite_only' | 'approval_required';
  max_collaborators: number;
  
  // Creative content
  tracks: CollaborativeTrack[];
  assets: ProjectAsset[];
  templates: ProjectTemplate[];
  
  // Version control
  current_version: string;
  version_history: ProjectVersion[];
  branches: ProjectBranch[];
  
  // Workflow
  workflow_state: WorkflowState;
  milestones: ProjectMilestone[];
  tasks: CollaborativeTask[];
  
  // Real-time state
  active_sessions: CollaborationSession[];
  live_cursors: LiveCursor[];
  pending_changes: PendingChange[];
  
  // Project statistics
  stats: ProjectStats;
}

export interface ProjectCollaborator {
  user_id: string;
  username: string;
  avatar_url?: string;
  role: CollaboratorRole;
  permissions: CollaboratorPermissions;
  joined_at: number;
  last_active: number;
  contribution_score: number;
  status: 'active' | 'away' | 'offline';
}

export type CollaboratorRole = 'owner' | 'admin' | 'editor' | 'contributor' | 'viewer';

export interface CollaboratorPermissions {
  can_edit_tracks: boolean;
  can_add_tracks: boolean;
  can_delete_tracks: boolean;
  can_manage_versions: boolean;
  can_invite_collaborators: boolean;
  can_manage_workflow: boolean;
  can_export_project: boolean;
  can_change_settings: boolean;
}

export interface CollaborativeTrack {
  id: string;
  name: string;
  description?: string;
  
  // Track content
  audio_data: AudioTrackData;
  midi_data?: MidiTrackData;
  lyrics?: LyricsData;
  metadata: TrackMetadata;
  
  // Collaboration
  created_by: string;
  contributors: TrackContributor[];
  current_editor?: string;
  locked_by?: string;
  locked_at?: number;
  
  // Version control
  version: string;
  version_history: TrackVersion[];
  
  // Real-time editing
  live_edits: LiveEdit[];
  pending_operations: Operation[];
  
  // Comments and feedback
  comments: TrackComment[];
  suggestions: TrackSuggestion[];
  
  // Status
  status: 'draft' | 'in_progress' | 'review' | 'approved' | 'final';
  created_at: number;
  updated_at: number;
}

export interface AudioTrackData {
  waveform_data: number[];
  duration: number; // seconds
  sample_rate: number;
  bit_depth: number;
  channels: number;
  format: 'wav' | 'mp3' | 'flac' | 'aac';
  file_url?: string;
  
  // Audio processing
  effects: AudioEffect[];
  automation: AutomationCurve[];
  markers: AudioMarker[];
  regions: AudioRegion[];
}

export interface AudioMarker {
  id: string;
  label: string;
  time: number; // milliseconds
  color?: string;
  description?: string;
  created_by?: string;
}

export interface AudioRegion {
  id: string;
  start_time: number; // milliseconds
  end_time: number;   // milliseconds
  label: string;
  color?: string;
  description?: string;
  track_id?: string;
  loop_enabled?: boolean;
}

export interface MidiTrackData {
  notes: MidiNote[];
  tempo_changes: TempoChange[];
  time_signature_changes: TimeSignatureChange[];
  key_signature: string;
  instrument: string;
  channel: number;
}

export interface MidiNote {
  id: string;
  pitch: number; // MIDI note number
  velocity: number; // 0-127
  start_time: number; // in ticks or seconds
  duration: number;
  channel: number;
}

export interface TempoChange {
  id: string;
  time: number; // milliseconds
  bpm: number;
  curve?: 'linear' | 'ease_in' | 'ease_out' | 'step';
}

export interface TimeSignatureChange {
  id: string;
  time: number; // milliseconds
  numerator: number;
  denominator: number;
}

export interface LyricsData {
  lines: LyricsLine[];
  language: string;
  structure: SongStructure[];
  rhyme_scheme?: string;
  syllable_count?: number;
}

export interface LyricsLine {
  id: string;
  text: string;
  timestamp?: number; // sync with audio
  section: string; // verse, chorus, bridge, etc.
  notes?: string;
}

export interface SongStructure {
  section: string;
  start_time: number;
  end_time: number;
  repetitions: number;
}

export interface TrackMetadata {
  genre: string[];
  mood: string[];
  key: string;
  tempo: number;
  time_signature: string;
  tags: string[];
  
  // Technical metadata
  loudness: number; // LUFS
  dynamic_range: number;
  peak_level: number;
  rms_level: number;
}

export interface TrackContributor {
  user_id: string;
  contribution_type: 'composition' | 'lyrics' | 'arrangement' | 'mixing' | 'mastering' | 'performance';
  contribution_percentage: number;
  timestamp: number;
  description?: string;
}

export interface TrackVersion {
  id: string;
  version_number: string;
  created_by: string;
  created_at: number;
  message: string;
  changes: VersionChange[];
  
  // Version data
  audio_data?: AudioTrackData;
  midi_data?: MidiTrackData;
  lyrics?: LyricsData;
  metadata: TrackMetadata;
  
  // Comparison
  diff_from_previous?: TrackDiff;
  file_size: number;
  checksum: string;
}

export interface VersionChange {
  type: 'audio_edit' | 'midi_edit' | 'lyrics_edit' | 'metadata_change' | 'effect_added' | 'effect_removed';
  description: string;
  timestamp: number;
  user_id: string;
  details: Record<string, any>;
}

export interface TrackDiff {
  audio_changes: AudioChange[];
  midi_changes: MidiChange[];
  lyrics_changes: LyricsChange[];
  metadata_changes: MetadataChange[];
}

export interface AudioChange {
  type: 'insert' | 'delete' | 'modify';
  start_time: number;
  end_time: number;
  description: string;
  waveform_diff?: number[];
}

export interface MidiChange {
  type: 'note_added' | 'note_removed' | 'note_modified' | 'tempo_change' | 'instrument_change';
  note_id?: string;
  old_value?: any;
  new_value?: any;
  timestamp: number;
}

export interface LyricsChange {
  type: 'line_added' | 'line_removed' | 'line_modified' | 'structure_change';
  line_id?: string;
  old_text?: string;
  new_text?: string;
  position: number;
}

export interface MetadataChange {
  field: string;
  old_value: any;
  new_value: any;
  timestamp: number;
}

export interface LiveEdit {
  id: string;
  user_id: string;
  type: 'audio_selection' | 'midi_edit' | 'lyrics_edit' | 'effect_adjustment';
  start_time: number;
  end_time?: number;
  data: Record<string, any>;
  timestamp: number;
  is_active: boolean;
}

export interface Operation {
  id: string;
  type: 'insert' | 'delete' | 'modify' | 'move';
  user_id: string;
  target: OperationTarget;
  data: any;
  timestamp: number;
  dependencies: string[]; // other operation IDs
  conflicts: OperationConflict[];
}

export interface OperationTarget {
  track_id: string;
  element_type: 'audio' | 'midi' | 'lyrics' | 'metadata';
  element_id?: string;
  position?: number;
  range?: [number, number];
}

export interface OperationConflict {
  conflicting_operation_id: string;
  conflict_type: 'concurrent_edit' | 'dependency_violation' | 'data_inconsistency';
  resolution_strategy: 'merge' | 'override' | 'manual';
  resolved: boolean;
  resolved_by?: string;
  resolved_at?: number;
}

export interface TrackComment {
  id: string;
  user_id: string;
  username: string;
  content: string;
  timestamp: number;
  
  // Position in track
  audio_timestamp?: number;
  midi_position?: number;
  lyrics_line_id?: string;
  
  // Thread
  parent_comment_id?: string;
  replies: TrackComment[];
  
  // Status
  is_resolved: boolean;
  resolved_by?: string;
  resolved_at?: number;
  
  // Reactions
  reactions: CommentReaction[];
}

export interface CommentReaction {
  user_id: string;
  type: 'like' | 'love' | 'laugh' | 'wow' | 'sad' | 'angry';
  timestamp: number;
}

export interface TrackSuggestion {
  id: string;
  user_id: string;
  type: 'audio_edit' | 'midi_change' | 'lyrics_revision' | 'arrangement_idea' | 'mix_suggestion';
  title: string;
  description: string;
  
  // Suggested changes
  proposed_changes: Operation[];
  preview_data?: any;
  
  // Voting
  votes: SuggestionVote[];
  score: number;
  
  // Status
  status: 'pending' | 'accepted' | 'rejected' | 'implemented';
  reviewed_by?: string;
  reviewed_at?: number;
  
  // Metadata
  created_at: number;
  updated_at: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface SuggestionVote {
  user_id: string;
  vote: 'up' | 'down';
  timestamp: number;
  comment?: string;
}

export interface CollaborationSession {
  id: string;
  user_id: string;
  username: string;
  
  // Session info
  started_at: number;
  last_activity: number;
  is_active: boolean;
  
  // Current focus
  current_track_id?: string;
  current_tool: string;
  current_selection?: SelectionRange;
  
  // Real-time state
  cursor_position: CursorPosition;
  viewport: ViewportState;
  
  // Collaboration mode
  mode: 'editing' | 'reviewing' | 'listening' | 'commenting';
  permissions: SessionPermissions;
}

export interface SelectionRange {
  track_id: string;
  element_type: 'audio' | 'midi' | 'lyrics';
  start: number;
  end: number;
  data?: any;
}

export interface CursorPosition {
  track_id: string;
  element_type: 'audio' | 'midi' | 'lyrics';
  position: number;
  timestamp: number;
}

export interface ViewportState {
  track_id: string;
  zoom_level: number;
  scroll_position: number;
  visible_range: [number, number];
  view_mode: 'waveform' | 'piano_roll' | 'lyrics' | 'mixer';
}

export interface SessionPermissions {
  can_edit: boolean;
  can_comment: boolean;
  can_suggest: boolean;
  can_lock_tracks: boolean;
  can_create_versions: boolean;
}

export interface LiveCursor {
  user_id: string;
  username: string;
  color: string;
  position: CursorPosition;
  selection?: SelectionRange;
  last_update: number;
  is_visible: boolean;
}

export interface PendingChange {
  id: string;
  user_id: string;
  operation: Operation;
  status: 'pending' | 'applied' | 'rejected' | 'conflicted';
  created_at: number;
  applied_at?: number;
  
  // Conflict resolution
  conflicts: OperationConflict[];
  resolution_required: boolean;
  auto_merge_possible: boolean;
}

export interface ProjectVersion {
  id: string;
  version_number: string;
  name: string;
  description: string;
  
  // Version metadata
  created_by: string;
  created_at: number;
  parent_version_id?: string;
  
  // Content snapshot
  tracks_snapshot: Record<string, TrackVersion>;
  project_settings: Record<string, any>;
  
  // Statistics
  total_changes: number;
  contributors: string[];
  
  // Tags and labels
  tags: string[];
  is_release: boolean;
  release_notes?: string;
}

export interface ProjectBranch {
  id: string;
  name: string;
  description: string;
  
  // Branch metadata
  created_by: string;
  created_at: number;
  base_version_id: string;
  head_version_id: string;
  
  // Branch state
  is_active: boolean;
  is_merged: boolean;
  merged_at?: number;
  merged_by?: string;
  
  // Merge info
  merge_conflicts: MergeConflict[];
  auto_merge_possible: boolean;
  
  // Protection
  is_protected: boolean;
  required_reviewers: string[];
  
  // Statistics
  commits_ahead: number;
  commits_behind: number;
  contributors: string[];
}

export interface MergeConflict {
  id: string;
  type: 'track_conflict' | 'metadata_conflict' | 'structure_conflict';
  track_id?: string;
  description: string;
  
  // Conflict data
  base_version: any;
  source_version: any;
  target_version: any;
  
  // Resolution
  resolution_strategy?: 'accept_source' | 'accept_target' | 'manual_merge';
  resolved: boolean;
  resolved_by?: string;
  resolved_at?: number;
  resolution_data?: any;
}

export interface WorkflowState {
  current_phase: WorkflowPhase;
  phases: WorkflowPhase[];
  
  // Workflow settings
  auto_advance: boolean;
  require_approval: boolean;
  notification_settings: WorkflowNotifications;
  
  // Progress tracking
  overall_progress: number; // 0-100
  phase_progress: Record<string, number>;
  
  // Deadlines
  target_completion: number;
  phase_deadlines: Record<string, number>;
}

export interface WorkflowPhase {
  id: string;
  name: string;
  description: string;
  
  // Phase configuration
  required_roles: CollaboratorRole[];
  required_approvals: number;
  auto_advance_conditions: AutoAdvanceCondition[];
  
  // Phase state
  status: 'not_started' | 'in_progress' | 'review' | 'completed' | 'blocked';
  started_at?: number;
  completed_at?: number;
  
  // Tasks and deliverables
  tasks: string[]; // Task IDs
  deliverables: PhaseDeliverable[];
  
  // Approval
  approvals: PhaseApproval[];
  required_approval_count: number;
}

export interface AutoAdvanceCondition {
  type: 'all_tasks_complete' | 'approval_threshold' | 'time_elapsed' | 'custom';
  parameters: Record<string, any>;
  is_met: boolean;
}

export interface PhaseDeliverable {
  id: string;
  name: string;
  description: string;
  type: 'track' | 'mix' | 'master' | 'document' | 'approval';
  
  // Status
  status: 'pending' | 'in_progress' | 'completed' | 'approved';
  assigned_to: string[];
  due_date?: number;
  
  // Content
  track_ids: string[];
  file_urls: string[];
  notes?: string;
  
  // Quality checks
  quality_checks: QualityCheck[];
  meets_requirements: boolean;
}

export interface QualityCheck {
  id: string;
  name: string;
  type: 'audio_quality' | 'mix_balance' | 'loudness' | 'technical' | 'creative';
  
  // Check configuration
  criteria: QualityCriteria;
  auto_check: boolean;
  
  // Results
  status: 'pending' | 'passed' | 'failed' | 'warning';
  score?: number;
  feedback?: string;
  checked_by?: string;
  checked_at?: number;
}

export interface QualityCriteria {
  min_loudness?: number;
  max_loudness?: number;
  min_dynamic_range?: number;
  max_peak_level?: number;
  frequency_balance?: FrequencyBalance;
  stereo_width?: StereoWidth;
  custom_rules?: CustomRule[];
}

export interface FrequencyBalance {
  low_freq_range: [number, number]; // Hz
  mid_freq_range: [number, number];
  high_freq_range: [number, number];
  balance_tolerance: number; // dB
}

export interface StereoWidth {
  min_width: number; // 0-1
  max_width: number;
  correlation_threshold: number;
}

export interface CustomRule {
  id: string;
  name: string;
  description: string;
  rule_function: string; // JavaScript function as string
  parameters: Record<string, any>;
}

export interface PhaseApproval {
  user_id: string;
  username: string;
  role: CollaboratorRole;
  
  // Approval details
  approved: boolean;
  timestamp: number;
  comments?: string;
  conditions?: string[];
  
  // Review data
  reviewed_deliverables: string[];
  quality_assessment: QualityAssessment;
}

export interface QualityAssessment {
  overall_rating: number; // 1-5
  technical_quality: number;
  creative_quality: number;
  mix_quality: number;
  
  // Detailed feedback
  strengths: string[];
  improvements: string[];
  critical_issues: string[];
  
  // Recommendations
  recommended_changes: TrackSuggestion[];
  approval_conditions: string[];
}

export interface WorkflowNotifications {
  phase_start: boolean;
  phase_complete: boolean;
  approval_required: boolean;
  deadline_approaching: boolean;
  conflict_detected: boolean;
  
  // Notification channels
  in_app: boolean;
  email: boolean;
  slack?: SlackIntegration;
  discord?: DiscordIntegration;
}

export interface SlackIntegration {
  enabled: boolean;
  webhook_url: string;
  channel: string;
  mention_users: boolean;
}

export interface DiscordIntegration {
  enabled: boolean;
  webhook_url: string;
  channel_id: string;
  role_mentions: string[];
}

export interface ProjectMilestone {
  id: string;
  name: string;
  description: string;
  
  // Milestone timing
  target_date: number;
  actual_date?: number;
  is_completed: boolean;
  
  // Requirements
  required_deliverables: string[];
  required_approvals: string[];
  success_criteria: SuccessCriteria[];
  
  // Progress
  completion_percentage: number;
  blockers: MilestoneBlocker[];
  
  // Metadata
  created_by: string;
  created_at: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface SuccessCriteria {
  id: string;
  description: string;
  type: 'deliverable' | 'quality' | 'approval' | 'custom';
  is_met: boolean;
  verified_by?: string;
  verified_at?: number;
}

export interface MilestoneBlocker {
  id: string;
  description: string;
  type: 'dependency' | 'resource' | 'approval' | 'technical' | 'external';
  severity: 'low' | 'medium' | 'high' | 'critical';
  
  // Resolution
  assigned_to?: string;
  target_resolution: number;
  status: 'open' | 'in_progress' | 'resolved';
  resolution_notes?: string;
}

export interface CollaborativeTask {
  id: string;
  title: string;
  description: string;
  
  // Task assignment
  assigned_to: string[];
  created_by: string;
  
  // Task details
  type: 'composition' | 'recording' | 'editing' | 'mixing' | 'mastering' | 'review' | 'approval';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimated_hours: number;
  actual_hours?: number;
  
  // Dependencies
  depends_on: string[]; // Other task IDs
  blocks: string[]; // Tasks that depend on this one
  
  // Status and progress
  status: 'todo' | 'in_progress' | 'review' | 'completed' | 'blocked';
  progress_percentage: number;
  
  // Timing
  created_at: number;
  due_date?: number;
  started_at?: number;
  completed_at?: number;
  
  // Content
  related_tracks: string[];
  attachments: TaskAttachment[];
  comments: TaskComment[];
  
  // Workflow integration
  workflow_phase_id?: string;
  milestone_id?: string;
  
  // Quality and acceptance
  acceptance_criteria: AcceptanceCriteria[];
  quality_requirements: QualityRequirement[];
}

export interface TaskAttachment {
  id: string;
  name: string;
  type: 'audio' | 'midi' | 'document' | 'image' | 'video' | 'other';
  file_url: string;
  file_size: number;
  uploaded_by: string;
  uploaded_at: number;
  description?: string;
}

export interface TaskComment {
  id: string;
  user_id: string;
  username: string;
  content: string;
  timestamp: number;
  
  // Mentions and references
  mentions: string[]; // User IDs
  track_references: string[]; // Track IDs
  
  // Thread
  parent_comment_id?: string;
  replies: TaskComment[];
}

export interface AcceptanceCriteria {
  id: string;
  description: string;
  is_met: boolean;
  verified_by?: string;
  verified_at?: number;
  notes?: string;
}

export interface QualityRequirement {
  id: string;
  name: string;
  description: string;
  type: 'technical' | 'creative' | 'format' | 'delivery';
  
  // Requirements
  min_quality_score?: number;
  required_format?: string;
  technical_specs?: Record<string, any>;
  
  // Validation
  is_met: boolean;
  validation_method: 'manual' | 'automated' | 'hybrid';
  validated_by?: string;
  validated_at?: number;
}

export interface ProjectAsset {
  id: string;
  name: string;
  description?: string;
  type: 'audio' | 'midi' | 'loop' | 'sample' | 'preset' | 'template' | 'document';
  
  // File information
  file_url: string;
  file_size: number;
  format: string;
  duration?: number; // for audio assets
  
  // Metadata
  tags: string[];
  genre?: string;
  mood?: string;
  key?: string;
  tempo?: number;
  
  // Usage tracking
  used_in_tracks: string[];
  usage_count: number;
  
  // Collaboration
  uploaded_by: string;
  uploaded_at: number;
  shared_with: string[]; // User IDs
  
  // Licensing and rights
  license_type: 'original' | 'royalty_free' | 'licensed' | 'creative_commons';
  license_details?: string;
  attribution_required: boolean;
  commercial_use_allowed: boolean;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  type: 'track_template' | 'project_template' | 'workflow_template' | 'mix_template';
  
  // Template content
  template_data: any;
  preview_url?: string;
  
  // Usage
  created_by: string;
  created_at: number;
  usage_count: number;
  is_public: boolean;
  
  // Categorization
  genre: string[];
  mood: string[];
  tags: string[];
  
  // Ratings and feedback
  rating: number; // 1-5
  reviews: TemplateReview[];
}

export interface TemplateReview {
  id: string;
  user_id: string;
  username: string;
  rating: number; // 1-5
  review_text?: string;
  timestamp: number;
  helpful_votes: number;
}

export interface ProjectStats {
  // Activity metrics
  total_sessions: number;
  total_session_time: number; // seconds
  active_days: number;
  
  // Content metrics
  total_tracks: number;
  total_versions: number;
  total_comments: number;
  total_suggestions: number;
  
  // Collaboration metrics
  total_collaborators: number;
  active_collaborators: number;
  contribution_distribution: Record<string, number>;
  
  // Progress metrics
  completion_percentage: number;
  milestones_completed: number;
  tasks_completed: number;
  
  // Quality metrics
  average_track_rating: number;
  quality_score: number;
  approval_rate: number;
  
  // Timeline
  project_duration: number; // days since creation
  estimated_completion: number; // timestamp
  time_to_completion: number; // estimated days remaining
}

export interface ConflictResolution {
  id: string;
  conflict_type: 'concurrent_edit' | 'version_conflict' | 'merge_conflict' | 'permission_conflict';
  
  // Conflict details
  conflicting_operations: Operation[];
  affected_tracks: string[];
  involved_users: string[];
  
  // Resolution strategy
  strategy: 'automatic_merge' | 'manual_merge' | 'user_choice' | 'rollback';
  resolution_data: any;
  
  // Status
  status: 'pending' | 'in_progress' | 'resolved' | 'escalated';
  resolved_by?: string;
  resolved_at?: number;
  
  // Metadata
  created_at: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  escalation_level: number;
}

export interface RealTimeSync {
  project_id: string;
  session_id: string;
  
  // Sync state
  last_sync: number;
  pending_operations: Operation[];
  acknowledged_operations: string[];
  
  // Conflict detection
  potential_conflicts: OperationConflict[];
  conflict_resolution_queue: ConflictResolution[];
  
  // Performance
  sync_latency: number; // milliseconds
  operation_queue_size: number;
  bandwidth_usage: number; // bytes per second
}

export interface CollaborationAnalytics {
  project_id: string;
  period: 'day' | 'week' | 'month' | 'quarter' | 'year';
  
  // Activity analytics
  session_analytics: SessionAnalytics;
  contribution_analytics: ContributionAnalytics;
  collaboration_patterns: CollaborationPattern[];
  
  // Performance analytics
  productivity_metrics: ProductivityMetrics;
  quality_metrics: QualityMetrics;
  efficiency_metrics: EfficiencyMetrics;
  
  // Insights
  generated_insights: AnalyticsInsight[];
  recommendations: CollaborationRecommendation[];
  
  // Metadata
  generated_at: number;
  data_period: [number, number];
}

export interface SessionAnalytics {
  total_sessions: number;
  total_session_time: number;
  average_session_length: number;
  peak_concurrent_users: number;
  
  // User activity
  most_active_users: UserActivity[];
  session_distribution: Record<string, number>; // hour of day -> session count
  
  // Tool usage
  tool_usage: Record<string, number>;
  feature_adoption: Record<string, number>;
}

export interface UserActivity {
  user_id: string;
  username: string;
  session_count: number;
  total_time: number;
  contribution_score: number;
  last_active: number;
}

export interface ContributionAnalytics {
  total_contributions: number;
  contribution_types: Record<string, number>;
  
  // User contributions
  top_contributors: UserContribution[];
  contribution_timeline: ContributionTimelineEntry[];
  
  // Content analysis
  tracks_created: number;
  versions_created: number;
  comments_made: number;
  suggestions_made: number;
}

export interface UserContribution {
  user_id: string;
  username: string;
  total_contributions: number;
  contribution_breakdown: Record<string, number>;
  quality_score: number;
  impact_score: number;
}

export interface ContributionTimelineEntry {
  timestamp: number;
  user_id: string;
  contribution_type: string;
  track_id?: string;
  impact_score: number;
}

export interface CollaborationPattern {
  pattern_type: 'peak_hours' | 'user_pairs' | 'workflow_bottlenecks' | 'communication_hubs';
  description: string;
  frequency: number;
  impact_score: number;
  
  // Pattern data
  involved_users: string[];
  time_patterns: number[];
  correlation_strength: number;
  
  // Insights
  insights: string[];
  recommendations: string[];
}

export interface ProductivityMetrics {
  tracks_per_session: number;
  versions_per_track: number;
  time_to_completion: number;
  
  // Efficiency indicators
  rework_rate: number; // percentage of work that gets redone
  approval_rate: number;
  conflict_rate: number;
  
  // Workflow metrics
  phase_completion_times: Record<string, number>;
  bottleneck_phases: string[];
  automation_usage: number;
}

export interface QualityMetrics {
  average_track_quality: number;
  quality_improvement_rate: number;
  defect_rate: number;
  
  // Review metrics
  review_coverage: number; // percentage of tracks reviewed
  review_effectiveness: number;
  feedback_implementation_rate: number;
  
  // Standards compliance
  technical_standards_compliance: number;
  creative_standards_compliance: number;
  format_compliance: number;
}

export interface EfficiencyMetrics {
  resource_utilization: number;
  parallel_work_efficiency: number;
  communication_efficiency: number;
  
  // Time metrics
  setup_time: number;
  active_work_time: number;
  coordination_overhead: number;
  
  // Automation metrics
  automated_task_percentage: number;
  manual_intervention_rate: number;
  error_recovery_time: number;
}

export interface AnalyticsInsight {
  type: 'productivity' | 'quality' | 'collaboration' | 'workflow' | 'resource';
  title: string;
  description: string;
  confidence: number; // 0-100
  
  // Supporting data
  metrics: Record<string, number>;
  trends: TrendData[];
  comparisons: ComparisonData[];
  
  // Actionability
  actionable: boolean;
  recommended_actions: string[];
  potential_impact: number; // 0-100
  
  // Metadata
  generated_at: number;
  data_sources: string[];
}

export interface TrendData {
  metric: string;
  values: number[];
  timestamps: number[];
  trend_direction: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  trend_strength: number; // 0-1
}

export interface ComparisonData {
  metric: string;
  current_value: number;
  comparison_value: number;
  comparison_type: 'previous_period' | 'project_average' | 'industry_benchmark';
  difference_percentage: number;
}

export interface CollaborationRecommendation {
  type: 'workflow' | 'tool' | 'process' | 'team' | 'quality';
  title: string;
  description: string;
  
  // Implementation
  implementation_effort: 'low' | 'medium' | 'high';
  expected_impact: number; // 0-100
  timeline: string;
  
  // Details
  specific_actions: string[];
  success_metrics: string[];
  risks: string[];
  
  // Prioritization
  priority_score: number;
  urgency: 'low' | 'medium' | 'high';
  
  // Metadata
  generated_at: number;
  applicable_to: string[]; // user IDs or 'all'
}
