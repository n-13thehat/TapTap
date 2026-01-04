// API-related type definitions
import { User, ApiResponse, PaginatedResponse } from './global';
import { Track } from './track';

// Request/Response types
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse extends ApiResponse<{
  user: User;
  token: string;
  expiresAt: string;
}> {}

export interface SignupRequest {
  email: string;
  username: string;
  password: string;
  inviteCode?: string;
  walletAddress?: string;
}

export interface SignupResponse extends ApiResponse<{
  user: User;
  token: string;
  requiresVerification: boolean;
}> {}

// Track API types
export interface TrackUploadRequest {
  title: string;
  artist: string;
  album?: string;
  genre?: string;
  tags?: string[];
  isPublic?: boolean;
}

export interface TrackUploadResponse extends ApiResponse<{
  track: Track;
  uploadUrl: string;
  uploadId: string;
}> {}

export interface TrackSearchRequest {
  query?: string;
  genre?: string;
  artist?: string;
  album?: string;
  tags?: string[];
  sortBy?: 'relevance' | 'date' | 'popularity' | 'title';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface TrackSearchResponse extends PaginatedResponse<Track> {}

// Battle API types
export interface BattleCreateRequest {
  title: string;
  description?: string;
  genre?: string;
  maxParticipants: number;
  duration: number; // in hours
  entryFee?: number;
  prizePool?: number;
  rules?: string[];
  startTime?: string;
  endTime?: string;
}

export interface BattleJoinRequest {
  battleId: string;
  trackId: string;
}

export interface BattleVoteRequest {
  battleId: string;
  trackId: string;
  score: number; // 1-10
  comment?: string;
}

// Social API types
export interface PostCreateRequest {
  content: string;
  trackId?: string;
  imageUrl?: string;
  tags?: string[];
  visibility?: 'public' | 'followers' | 'private';
}

export interface CommentCreateRequest {
  postId: string;
  content: string;
  parentId?: string; // for replies
}

export interface FollowRequest {
  userId: string;
}

// Analytics API types
export interface AnalyticsRequest {
  startDate: string;
  endDate: string;
  metrics: string[];
  groupBy?: 'day' | 'week' | 'month';
  filters?: Record<string, any>;
}

export interface AnalyticsResponse extends ApiResponse<{
  metrics: Record<string, any[]>;
  summary: Record<string, number>;
  period: {
    start: string;
    end: string;
    granularity: string;
  };
}> {}

// Admin API types
export interface UserManagementRequest {
  userId: string;
  action: 'suspend' | 'unsuspend' | 'ban' | 'unban' | 'verify' | 'unverify';
  reason?: string;
  duration?: number; // in days
}

export interface ContentModerationRequest {
  contentId: string;
  contentType: 'track' | 'post' | 'comment';
  action: 'approve' | 'reject' | 'flag' | 'remove';
  reason?: string;
  moderatorNotes?: string;
}

// Feature Flag API types
export interface FeatureFlagUpdateRequest {
  key: string;
  enabled: boolean;
  rolloutPercentage?: number;
  conditions?: any[];
}

// Wallet API types
export interface WalletCreateRequest {
  userId: string;
  walletType: 'solana' | 'ethereum';
}

export interface WalletTransactionRequest {
  fromWallet: string;
  toWallet: string;
  amount: number;
  currency: string;
  memo?: string;
}

// Notification API types
export interface NotificationMarkReadRequest {
  notificationIds: string[];
}

export interface NotificationPreferencesRequest {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  notificationTypes: string[];
}

// Library API types
export interface LibraryAddRequest {
  trackId: string;
  playlistId?: string;
  rating?: number;
  notes?: string;
}

export interface PlaylistCreateRequest {
  name: string;
  description?: string;
  isPublic?: boolean;
  coverImage?: string;
  tags?: string[];
}

export interface PlaylistUpdateRequest {
  name?: string;
  description?: string;
  isPublic?: boolean;
  coverImage?: string;
  tags?: string[];
}

// Search API types
export interface GlobalSearchRequest {
  query: string;
  types?: ('tracks' | 'users' | 'playlists' | 'battles')[];
  limit?: number;
  filters?: Record<string, any>;
}

export interface GlobalSearchResponse extends ApiResponse<{
  tracks: Track[];
  users: User[];
  playlists: any[];
  battles: any[];
  total: number;
}> {}

// Error types
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ApiError {
  message: string;
  code: string;
  statusCode: number;
  details?: ValidationError[];
  timestamp: string;
}

// Middleware types
export interface AuthenticatedRequest extends Request {
  user: User;
  session: any;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

// Webhook types
export interface WebhookPayload {
  event: string;
  timestamp: string;
  data: any;
  signature: string;
}

export interface WebhookResponse {
  received: boolean;
  processed: boolean;
  error?: string;
}

// Additional types for compatibility
export interface TrackWithArtist extends Track {
  artist: {
    id: string;
    name: string;
    stageName?: string;
  };
}
