// Global type definitions matching Prisma schema
export interface User {
  id: string;
  email: string;
  username: string;
  role: Role;
  status: AccountStatus;
  verified: VerificationStatus;
  authUserId: string;
  avatarUrl?: string | null;
  bio?: string | null;
  country?: string | null;
  deletedAt?: Date | null;
  hashedPassword?: string | null;
  headerUrl?: string | null;
  inviteCode?: string | null;
  walletAddress?: string | null;
  hasTapPass: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type Role = 'LISTENER' | 'CREATOR' | 'ADMIN' | 'MODERATOR';
export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'BANNED' | 'DELETED' | 'PENDING';
export type VerificationStatus = 'VERIFIED' | 'UNVERIFIED' | 'PENDING' | 'REJECTED';

export interface Session {
  id: string;
  userId: string;
  user: User;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  deviceInfo?: DeviceInfo;
  ipAddress?: string;
  userAgent?: string;
}

export interface DeviceInfo {
  type: 'desktop' | 'mobile' | 'tablet';
  os: string;
  browser: string;
  version: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
  timestamp: string;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  code?: string;
  details?: Record<string, any>;
  timestamp: string;
}

// Event system types
export interface BaseEvent {
  id: string;
  type: string;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

export interface EventBusEvent extends BaseEvent {
  source: string;
  target?: string;
  payload: any;
}

// Agent system types
export interface Agent {
  id: string;
  name: string;
  type: AgentType;
  status: AgentStatus;
  capabilities: string[];
  config: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  lastActiveAt?: Date;
}

export type AgentType = 'AI_CURATOR' | 'BATTLE_JUDGE' | 'CONTENT_MODERATOR' | 'ANALYTICS' | 'ASSISTANT';
export type AgentStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'ERROR';

export interface AgentTask {
  id: string;
  agentId: string;
  type: string;
  status: TaskStatus;
  priority: TaskPriority;
  payload: any;
  result?: any;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  retryCount: number;
  maxRetries: number;
}

export type TaskStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type TaskPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';

// Notification types
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: Date;
  readAt?: Date;
  expiresAt?: Date;
}

export type NotificationType = 
  | 'TRACK_LIKED' 
  | 'TRACK_COMMENTED' 
  | 'FOLLOWER_NEW' 
  | 'BATTLE_INVITE' 
  | 'BATTLE_RESULT' 
  | 'SYSTEM_ANNOUNCEMENT' 
  | 'FEATURE_UPDATE';

// Feature flag types
export interface FeatureFlag {
  key: string;
  enabled: boolean;
  description: string;
  conditions?: FeatureFlagCondition[];
  rolloutPercentage?: number;
  environment?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeatureFlagCondition {
  type: 'USER_ROLE' | 'USER_ID' | 'RANDOM' | 'DATE_RANGE';
  operator: 'EQUALS' | 'NOT_EQUALS' | 'IN' | 'NOT_IN' | 'GREATER_THAN' | 'LESS_THAN';
  value: any;
}

// Performance monitoring types
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  tags?: Record<string, string>;
}

export interface HealthCheck {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: Date;
  responseTime?: number;
  error?: string;
  details?: Record<string, any>;
}

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// URL type for validation
export type URL = string;

// UUID type
export type UUID = string;

// Email type
export type Email = string;
