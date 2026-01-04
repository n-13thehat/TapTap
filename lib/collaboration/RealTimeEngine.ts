/**
 * Real-Time Collaboration Engine
 * Advanced real-time synchronization with conflict resolution, presence, and performance optimization
 */

import { RealtimeClient, RealtimeChannel, RealtimePresence } from '@supabase/realtime-js';

export interface CollaborationUser {
  id: string;
  username: string;
  avatar?: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer' | 'guest';
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen: number;
  permissions: UserPermissions;
  preferences: UserPreferences;
  metadata: {
    location?: string;
    timezone?: string;
    device?: string;
    browser?: string;
    connection?: ConnectionInfo;
  };
}

export interface UserPermissions {
  canEdit: boolean;
  canComment: boolean;
  canShare: boolean;
  canManageUsers: boolean;
  canExport: boolean;
  canDelete: boolean;
  canCreateTracks: boolean;
  canModifyEffects: boolean;
  canRecord: boolean;
  canMix: boolean;
  restrictedTracks?: string[];
  timeRestrictions?: {
    start: number;
    end: number;
    timezone: string;
  };
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  notifications: NotificationSettings;
  audio: AudioSettings;
  collaboration: CollaborationSettings;
  privacy: PrivacySettings;
}

export interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
  desktop: boolean;
  email: boolean;
  mentions: boolean;
  comments: boolean;
  changes: boolean;
  joins: boolean;
  leaves: boolean;
}

export interface AudioSettings {
  latency: 'low' | 'normal' | 'high';
  quality: 'draft' | 'good' | 'high' | 'ultra';
  monitoring: boolean;
  clickTrack: boolean;
  countIn: boolean;
}

export interface CollaborationSettings {
  showCursors: boolean;
  showSelections: boolean;
  showViewports: boolean;
  autoFollow: boolean;
  conflictResolution: 'manual' | 'auto' | 'last-writer-wins';
  syncFrequency: number;
}

export interface PrivacySettings {
  showOnlineStatus: boolean;
  showActivity: boolean;
  allowDirectMessages: boolean;
  shareAnalytics: boolean;
}

export interface ConnectionInfo {
  type: 'wifi' | 'cellular' | 'ethernet' | 'unknown';
  speed: number; // Mbps
  latency: number; // ms
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  stability: number; // 0-1
}

export interface RealTimeOperation {
  id: string;
  type: OperationType;
  userId: string;
  sessionId: string;
  timestamp: number;
  data: any;
  metadata: OperationMetadata;
  dependencies?: string[];
  conflicts?: ConflictInfo[];
  status: 'pending' | 'applied' | 'rejected' | 'conflicted';
}

export type OperationType = 
  | 'track.create' | 'track.delete' | 'track.update' | 'track.move'
  | 'audio.record' | 'audio.edit' | 'audio.delete' | 'audio.move'
  | 'effect.add' | 'effect.remove' | 'effect.update' | 'effect.reorder'
  | 'mix.volume' | 'mix.pan' | 'mix.mute' | 'mix.solo'
  | 'cursor.move' | 'selection.change' | 'viewport.change'
  | 'comment.add' | 'comment.edit' | 'comment.delete'
  | 'project.settings' | 'project.export' | 'project.save';

export interface OperationMetadata {
  trackId?: string;
  elementId?: string;
  position?: number;
  duration?: number;
  priority: 'low' | 'normal' | 'high' | 'critical';
  retryCount: number;
  maxRetries: number;
  timeout: number;
  compression?: boolean;
  encryption?: boolean;
}

export interface ConflictInfo {
  conflictId: string;
  type: 'concurrent_edit' | 'version_mismatch' | 'permission_denied' | 'resource_locked';
  description: string;
  conflictingOperations: string[];
  suggestedResolution: ConflictResolution;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ConflictResolution {
  strategy: 'merge' | 'overwrite' | 'reject' | 'manual';
  action: 'accept_local' | 'accept_remote' | 'merge_changes' | 'create_branch';
  mergeData?: any;
  reasoning: string;
}

export interface PresenceState {
  userId: string;
  sessionId: string;
  cursor: CursorState;
  selection: SelectionState;
  viewport: ViewportState;
  activity: ActivityState;
  audio: AudioState;
  lastUpdate: number;
}

export interface CursorState {
  trackId: string;
  position: number;
  elementType: 'audio' | 'midi' | 'automation' | 'effect';
  elementId?: string;
  visible: boolean;
  color: string;
  label?: string;
}

export interface SelectionState {
  trackId: string;
  startPosition: number;
  endPosition: number;
  elementType: 'audio' | 'midi' | 'automation' | 'effect';
  elementIds: string[];
  selectionType: 'range' | 'elements' | 'tracks';
  color: string;
}

export interface ViewportState {
  trackId?: string;
  zoomLevel: number;
  scrollPosition: number;
  visibleRange: [number, number];
  viewMode: 'waveform' | 'spectrogram' | 'midi' | 'automation';
  followMode: 'none' | 'cursor' | 'playhead' | 'selection';
}

export interface ActivityState {
  currentTool: string;
  mode: 'editing' | 'recording' | 'mixing' | 'reviewing' | 'listening';
  isRecording: boolean;
  isPlaying: boolean;
  lastAction: string;
  lastActionTime: number;
}

export interface AudioState {
  isMonitoring: boolean;
  inputLevel: number;
  outputLevel: number;
  latency: number;
  sampleRate: number;
  bufferSize: number;
  isRecording: boolean;
  recordingTrack?: string;
}

export interface SyncMetrics {
  operationsPerSecond: number;
  averageLatency: number;
  conflictRate: number;
  bandwidthUsage: number;
  connectionQuality: number;
  syncErrors: number;
  lastSyncTime: number;
  queueSize: number;
}

export interface CollaborationEvent {
  type: string;
  userId: string;
  sessionId: string;
  timestamp: number;
  data: any;
  metadata?: any;
}

export class RealTimeEngine {
  private client: RealtimeClient;
  private channel: RealtimeChannel | null = null;
  private presence: RealtimePresence | null = null;
  
  private projectId: string;
  private userId: string;
  private sessionId: string;
  
  // State management
  private users: Map<string, CollaborationUser> = new Map();
  private presenceStates: Map<string, PresenceState> = new Map();
  private operationQueue: RealTimeOperation[] = [];
  private pendingOperations: Map<string, RealTimeOperation> = new Map();
  private appliedOperations: Set<string> = new Set();
  
  // Conflict resolution
  private conflicts: Map<string, ConflictInfo> = new Map();
  private conflictResolvers: Map<string, (conflict: ConflictInfo) => Promise<ConflictResolution>> = new Map();
  
  // Performance monitoring
  private metrics: SyncMetrics = {
    operationsPerSecond: 0,
    averageLatency: 0,
    conflictRate: 0,
    bandwidthUsage: 0,
    connectionQuality: 1,
    syncErrors: 0,
    lastSyncTime: 0,
    queueSize: 0,
  };
  
  // Event handlers
  private eventHandlers: Map<string, ((event: CollaborationEvent) => void)[]> = new Map();
  
  // Timers and intervals
  private syncInterval: NodeJS.Timeout | null = null;
  private metricsInterval: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  
  // Configuration
  private config = {
    syncFrequency: 100, // ms
    maxOperationQueue: 1000,
    operationTimeout: 30000, // 30 seconds
    heartbeatInterval: 5000, // 5 seconds
    reconnectAttempts: 5,
    reconnectDelay: 1000, // ms
    compressionThreshold: 1024, // bytes
    batchSize: 50,
    enableEncryption: false,
    enableCompression: true,
  };

  constructor(
    supabaseUrl: string,
    supabaseKey: string,
    projectId: string,
    userId: string,
    options: Partial<typeof this.config> = {}
  ) {
    this.projectId = projectId;
    this.userId = userId;
    this.sessionId = this.generateSessionId();
    this.config = { ...this.config, ...options };

    // Initialize Supabase Realtime client
    this.client = new RealtimeClient(supabaseUrl, {
      params: {
        apikey: supabaseKey,
      },
      heartbeatIntervalMs: this.config.heartbeatInterval,
    });

    this.initializeConflictResolvers();
    this.startPerformanceMonitoring();
  }

  public async connect(): Promise<void> {
    try {
      // Connect to Realtime
      this.client.connect();

      // Create channel for the project
      this.channel = this.client.channel(`project:${this.projectId}`, {
        config: {
          presence: {
            key: this.userId,
          },
          broadcast: {
            self: true,
          },
        },
      });

      // Initialize presence
      this.presence = new RealtimePresence(this.channel);

      // Set up event listeners
      this.setupEventListeners();

      // Subscribe to channel
      await new Promise<void>((resolve, reject) => {
        this.channel!.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            resolve();
          } else if (status === 'CHANNEL_ERROR') {
            reject(new Error('Failed to subscribe to channel'));
          }
        });
      });

      // Start sync loop
      this.startSyncLoop();

      console.log(`Connected to real-time collaboration for project: ${this.projectId}`);
    } catch (error) {
      console.error('Failed to connect to real-time collaboration:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    // Stop intervals
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Unsubscribe from channel
    if (this.channel) {
      await this.channel.unsubscribe();
      this.channel = null;
    }

    // Disconnect client
    this.client.disconnect();

    console.log('Disconnected from real-time collaboration');
  }

  private setupEventListeners(): void {
    if (!this.channel || !this.presence) return;

    // Presence events
    this.presence.onJoin((key, currentPresences, newPresences) => {
      console.log('User joined:', key, newPresences);
      this.handleUserJoin(key, newPresences);
    });

    this.presence.onLeave((key, currentPresences, leftPresences) => {
      console.log('User left:', key, leftPresences);
      this.handleUserLeave(key, leftPresences);
    });

    this.presence.onSync(() => {
      console.log('Presence synced');
      this.handlePresenceSync();
    });

    // Broadcast events for operations
    this.channel.on('broadcast', { event: 'operation' }, (payload) => {
      this.handleRemoteOperation(payload);
    });

    this.channel.on('broadcast', { event: 'conflict' }, (payload) => {
      this.handleConflictNotification(payload);
    });

    this.channel.on('broadcast', { event: 'user_update' }, (payload) => {
      this.handleUserUpdate(payload);
    });

    // Connection events
    this.client.onOpen(() => {
      console.log('Real-time connection opened');
      this.metrics.connectionQuality = 1;
      this.emit('connection', { type: 'connected', timestamp: Date.now() });
    });

    this.client.onClose(() => {
      console.log('Real-time connection closed');
      this.metrics.connectionQuality = 0;
      this.emit('connection', { type: 'disconnected', timestamp: Date.now() });
    });

    this.client.onError((error) => {
      console.error('Real-time connection error:', error);
      this.metrics.syncErrors++;
      this.emit('error', { type: 'connection_error', error, timestamp: Date.now() });
    });
  }

  private handleUserJoin(userId: string, presences: any[]): void {
    presences.forEach(presence => {
      const user: CollaborationUser = {
        id: userId,
        username: presence.username || `User ${userId}`,
        avatar: presence.avatar,
        role: presence.role || 'viewer',
        status: 'online',
        lastSeen: Date.now(),
        permissions: presence.permissions || this.getDefaultPermissions('viewer'),
        preferences: presence.preferences || this.getDefaultPreferences(),
        metadata: presence.metadata || {},
      };

      this.users.set(userId, user);
      
      if (presence.state) {
        this.presenceStates.set(userId, presence.state);
      }
    });

    this.emit('user_joined', {
      type: 'user_joined',
      userId,
      timestamp: Date.now(),
      data: { users: Array.from(this.users.values()) },
    });
  }

  private handleUserLeave(userId: string, leftPresences: any[]): void {
    this.users.delete(userId);
    this.presenceStates.delete(userId);

    this.emit('user_left', {
      type: 'user_left',
      userId,
      timestamp: Date.now(),
      data: { users: Array.from(this.users.values()) },
    });
  }

  private handlePresenceSync(): void {
    if (!this.presence) return;

    const presenceState = this.presence.list();
    
    // Update presence states
    presenceState.forEach((presence: any) => {
      if (presence.state) {
        this.presenceStates.set(presence.user_id, presence.state);
      }
    });

    this.emit('presence_sync', {
      type: 'presence_sync',
      userId: this.userId,
      timestamp: Date.now(),
      data: { presences: Array.from(this.presenceStates.entries()) },
    });
  }

  private handleRemoteOperation(payload: any): void {
    const operation: RealTimeOperation = payload.operation;
    
    // Check if we've already applied this operation
    if (this.appliedOperations.has(operation.id)) {
      return;
    }

    // Check for conflicts
    const conflicts = this.detectConflicts(operation);
    if (conflicts.length > 0) {
      operation.conflicts = conflicts;
      operation.status = 'conflicted';
      this.handleConflicts(operation, conflicts);
      return;
    }

    // Apply operation
    this.applyOperation(operation);
  }

  private handleConflictNotification(payload: any): void {
    const conflict: ConflictInfo = payload.conflict;
    this.conflicts.set(conflict.conflictId, conflict);

    this.emit('conflict', {
      type: 'conflict',
      userId: this.userId,
      timestamp: Date.now(),
      data: { conflict },
    });
  }

  private handleUserUpdate(payload: any): void {
    const { userId, updates } = payload;
    const user = this.users.get(userId);
    
    if (user) {
      Object.assign(user, updates);
      this.users.set(userId, user);

      this.emit('user_updated', {
        type: 'user_updated',
        userId,
        timestamp: Date.now(),
        data: { user, updates },
      });
    }
  }

  public async sendOperation(operation: Omit<RealTimeOperation, 'id' | 'userId' | 'sessionId' | 'timestamp' | 'status'>): Promise<string> {
    const fullOperation: RealTimeOperation = {
      ...operation,
      id: this.generateOperationId(),
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: Date.now(),
      status: 'pending',
    };

    // Add to queue
    this.operationQueue.push(fullOperation);
    this.pendingOperations.set(fullOperation.id, fullOperation);

    // Broadcast operation
    if (this.channel) {
      await this.channel.send({
        type: 'broadcast',
        event: 'operation',
        payload: { operation: fullOperation },
      });
    }

    // Apply locally
    this.applyOperation(fullOperation);

    return fullOperation.id;
  }

  public async updatePresence(state: Partial<PresenceState>): Promise<void> {
    if (!this.presence) return;

    const currentState = this.presenceStates.get(this.userId) || this.getDefaultPresenceState();
    const newState = { ...currentState, ...state, lastUpdate: Date.now() };

    this.presenceStates.set(this.userId, newState);

    await this.presence.track({
      user_id: this.userId,
      state: newState,
      username: this.users.get(this.userId)?.username || `User ${this.userId}`,
      timestamp: Date.now(),
    });
  }

  public async updateUser(updates: Partial<CollaborationUser>): Promise<void> {
    const user = this.users.get(this.userId);
    if (!user) return;

    const updatedUser = { ...user, ...updates };
    this.users.set(this.userId, updatedUser);

    if (this.channel) {
      await this.channel.send({
        type: 'broadcast',
        event: 'user_update',
        payload: { userId: this.userId, updates },
      });
    }
  }

  private applyOperation(operation: RealTimeOperation): void {
    try {
      // Mark as applied
      this.appliedOperations.add(operation.id);
      operation.status = 'applied';

      // Remove from pending
      this.pendingOperations.delete(operation.id);

      // Emit operation applied event
      this.emit('operation_applied', {
        type: 'operation_applied',
        userId: operation.userId,
        sessionId: operation.sessionId,
        timestamp: Date.now(),
        data: { operation },
      });

      // Update metrics
      this.updateMetrics(operation);

    } catch (error) {
      console.error('Failed to apply operation:', error);
      operation.status = 'rejected';
      
      this.emit('operation_failed', {
        type: 'operation_failed',
        userId: operation.userId,
        sessionId: operation.sessionId,
        timestamp: Date.now(),
        data: { operation, error: (error as Error).message },
      });
    }
  }

  private detectConflicts(operation: RealTimeOperation): ConflictInfo[] {
    const conflicts: ConflictInfo[] = [];

    // Check for concurrent edits on the same resource
    const concurrentOps = this.operationQueue.filter(op => 
      op.id !== operation.id &&
      op.metadata.trackId === operation.metadata.trackId &&
      op.metadata.elementId === operation.metadata.elementId &&
      Math.abs(op.timestamp - operation.timestamp) < 1000 // Within 1 second
    );

    if (concurrentOps.length > 0) {
      conflicts.push({
        conflictId: this.generateConflictId(),
        type: 'concurrent_edit',
        description: `Concurrent edit detected on ${operation.metadata.trackId}`,
        conflictingOperations: [operation.id, ...concurrentOps.map(op => op.id)],
        suggestedResolution: {
          strategy: 'merge',
          action: 'merge_changes',
          reasoning: 'Merge concurrent changes based on timestamps',
        },
        severity: 'medium',
      });
    }

    // Check permissions
    const user = this.users.get(operation.userId);
    if (user && !this.hasPermission(user, operation.type)) {
      conflicts.push({
        conflictId: this.generateConflictId(),
        type: 'permission_denied',
        description: `User ${user.username} lacks permission for ${operation.type}`,
        conflictingOperations: [operation.id],
        suggestedResolution: {
          strategy: 'reject',
          action: 'accept_local',
          reasoning: 'Insufficient permissions',
        },
        severity: 'high',
      });
    }

    return conflicts;
  }

  private async handleConflicts(operation: RealTimeOperation, conflicts: ConflictInfo[]): Promise<void> {
    for (const conflict of conflicts) {
      this.conflicts.set(conflict.conflictId, conflict);

      // Try to resolve automatically
      const resolver = this.conflictResolvers.get(conflict.type);
      if (resolver) {
        try {
          const resolution = await resolver(conflict);
          await this.resolveConflict(conflict.conflictId, resolution);
        } catch (error) {
          console.error('Failed to auto-resolve conflict:', error);
          // Emit conflict for manual resolution
          this.emit('conflict', {
            type: 'conflict',
            userId: operation.userId,
            sessionId: operation.sessionId,
            timestamp: Date.now(),
            data: { conflict },
          });
        }
      } else {
        // Emit conflict for manual resolution
        this.emit('conflict', {
          type: 'conflict',
          userId: operation.userId,
          sessionId: operation.sessionId,
          timestamp: Date.now(),
          data: { conflict },
        });
      }
    }
  }

  public async resolveConflict(conflictId: string, resolution: ConflictResolution): Promise<void> {
    const conflict = this.conflicts.get(conflictId);
    if (!conflict) return;

    try {
      switch (resolution.strategy) {
        case 'merge':
          await this.mergeConflictingOperations(conflict, resolution);
          break;
        case 'overwrite':
          await this.overwriteConflictingOperations(conflict, resolution);
          break;
        case 'reject':
          await this.rejectConflictingOperations(conflict, resolution);
          break;
        case 'manual':
          // Keep conflict for manual resolution
          return;
      }

      // Remove resolved conflict
      this.conflicts.delete(conflictId);

      this.emit('conflict_resolved', {
        type: 'conflict_resolved',
        userId: this.userId,
        sessionId: this.sessionId,
        timestamp: Date.now(),
        data: { conflict, resolution },
      });

    } catch (error) {
      console.error('Failed to resolve conflict:', error);
      this.emit('conflict_resolution_failed', {
        type: 'conflict_resolution_failed',
        userId: this.userId,
        sessionId: this.sessionId,
        timestamp: Date.now(),
        data: { conflict, resolution, error: (error as Error).message },
      });
    }
  }

  private async mergeConflictingOperations(conflict: ConflictInfo, resolution: ConflictResolution): Promise<void> {
    // Implementation depends on operation types
    // This is a simplified merge strategy
    const operations = conflict.conflictingOperations.map(id => this.pendingOperations.get(id)).filter(Boolean);
    
    // Sort by timestamp
    operations.sort((a, b) => a!.timestamp - b!.timestamp);
    
    // Apply operations in order
    for (const operation of operations) {
      if (operation) {
        this.applyOperation(operation);
      }
    }
  }

  private async overwriteConflictingOperations(conflict: ConflictInfo, resolution: ConflictResolution): Promise<void> {
    // Keep the latest operation, reject others
    const operations = conflict.conflictingOperations.map(id => this.pendingOperations.get(id)).filter(Boolean);
    const latestOperation = operations.reduce((latest, current) => 
      current!.timestamp > latest!.timestamp ? current : latest
    );

    if (latestOperation) {
      this.applyOperation(latestOperation);
    }

    // Reject other operations
    operations.forEach(op => {
      if (op && op.id !== latestOperation?.id) {
        op.status = 'rejected';
        this.pendingOperations.delete(op.id);
      }
    });
  }

  private async rejectConflictingOperations(conflict: ConflictInfo, resolution: ConflictResolution): Promise<void> {
    // Reject all conflicting operations
    conflict.conflictingOperations.forEach(id => {
      const operation = this.pendingOperations.get(id);
      if (operation) {
        operation.status = 'rejected';
        this.pendingOperations.delete(id);
      }
    });
  }

  private hasPermission(user: CollaborationUser, operationType: OperationType): boolean {
    const { permissions } = user;

    switch (operationType) {
      case 'track.create':
      case 'track.delete':
      case 'track.update':
      case 'track.move':
        return permissions.canEdit && permissions.canCreateTracks;
      
      case 'audio.record':
        return permissions.canEdit && permissions.canRecord;
      
      case 'audio.edit':
      case 'audio.delete':
      case 'audio.move':
        return permissions.canEdit;
      
      case 'effect.add':
      case 'effect.remove':
      case 'effect.update':
      case 'effect.reorder':
        return permissions.canEdit && permissions.canModifyEffects;
      
      case 'mix.volume':
      case 'mix.pan':
      case 'mix.mute':
      case 'mix.solo':
        return permissions.canEdit && permissions.canMix;
      
      case 'comment.add':
      case 'comment.edit':
      case 'comment.delete':
        return permissions.canComment;
      
      case 'project.export':
        return permissions.canExport;
      
      case 'project.settings':
        return permissions.canManageUsers;
      
      default:
        return permissions.canEdit;
    }
  }

  private startSyncLoop(): void {
    this.syncInterval = setInterval(() => {
      this.processPendingOperations();
      this.cleanupOldOperations();
    }, this.config.syncFrequency);
  }

  private processPendingOperations(): void {
    const now = Date.now();
    const timeoutOperations: string[] = [];

    // Check for timed out operations
    this.pendingOperations.forEach((operation, id) => {
      if (now - operation.timestamp > this.config.operationTimeout) {
        timeoutOperations.push(id);
      }
    });

    // Handle timeouts
    timeoutOperations.forEach(id => {
      const operation = this.pendingOperations.get(id);
      if (operation) {
        operation.status = 'rejected';
        this.pendingOperations.delete(id);
        
        this.emit('operation_timeout', {
          type: 'operation_timeout',
          userId: operation.userId,
          sessionId: operation.sessionId,
          timestamp: Date.now(),
          data: { operation },
        });
      }
    });

    // Update queue size metric
    this.metrics.queueSize = this.pendingOperations.size;
  }

  private cleanupOldOperations(): void {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
    
    // Remove old operations from queue
    this.operationQueue = this.operationQueue.filter(op => op.timestamp > cutoff);
    
    // Remove old applied operations
    const oldApplied = Array.from(this.appliedOperations).filter(id => {
      const operation = this.operationQueue.find(op => op.id === id);
      return !operation || operation.timestamp <= cutoff;
    });
    
    oldApplied.forEach(id => this.appliedOperations.delete(id));
  }

  private updateMetrics(operation: RealTimeOperation): void {
    const now = Date.now();
    const latency = now - operation.timestamp;
    
    // Update average latency
    this.metrics.averageLatency = (this.metrics.averageLatency + latency) / 2;
    
    // Update operations per second
    const recentOps = this.operationQueue.filter(op => now - op.timestamp < 1000);
    this.metrics.operationsPerSecond = recentOps.length;
    
    // Update conflict rate
    const recentConflicts = Array.from(this.conflicts.values()).filter(c => 
      c.conflictId && now - Date.now() < 60000 // Last minute
    );
    this.metrics.conflictRate = recentConflicts.length / Math.max(recentOps.length, 1);
    
    this.metrics.lastSyncTime = now;
  }

  private startPerformanceMonitoring(): void {
    this.metricsInterval = setInterval(() => {
      this.emit('metrics_update', {
        type: 'metrics_update',
        userId: this.userId,
        sessionId: this.sessionId,
        timestamp: Date.now(),
        data: { metrics: this.metrics },
      });
    }, 5000); // Every 5 seconds
  }

  private initializeConflictResolvers(): void {
    // Auto-resolver for concurrent edits
    this.conflictResolvers.set('concurrent_edit', async (conflict) => ({
      strategy: 'merge',
      action: 'merge_changes',
      reasoning: 'Automatically merge concurrent changes based on timestamps',
    }));

    // Auto-resolver for permission conflicts
    this.conflictResolvers.set('permission_denied', async (conflict) => ({
      strategy: 'reject',
      action: 'accept_local',
      reasoning: 'Reject operation due to insufficient permissions',
    }));
  }

  private getDefaultPermissions(role: string): UserPermissions {
    const basePermissions = {
      canEdit: false,
      canComment: true,
      canShare: false,
      canManageUsers: false,
      canExport: false,
      canDelete: false,
      canCreateTracks: false,
      canModifyEffects: false,
      canRecord: false,
      canMix: false,
    };

    switch (role) {
      case 'owner':
      case 'admin':
        return { ...basePermissions, canEdit: true, canShare: true, canManageUsers: true, canExport: true, canDelete: true, canCreateTracks: true, canModifyEffects: true, canRecord: true, canMix: true };
      case 'editor':
        return { ...basePermissions, canEdit: true, canCreateTracks: true, canModifyEffects: true, canRecord: true, canMix: true };
      case 'viewer':
        return basePermissions;
      default:
        return basePermissions;
    }
  }

  private getDefaultPreferences(): UserPreferences {
    return {
      theme: 'dark',
      language: 'en',
      notifications: {
        enabled: true,
        sound: true,
        desktop: true,
        email: false,
        mentions: true,
        comments: true,
        changes: true,
        joins: true,
        leaves: true,
      },
      audio: {
        latency: 'normal',
        quality: 'high',
        monitoring: true,
        clickTrack: false,
        countIn: true,
      },
      collaboration: {
        showCursors: true,
        showSelections: true,
        showViewports: true,
        autoFollow: false,
        conflictResolution: 'auto',
        syncFrequency: 100,
      },
      privacy: {
        showOnlineStatus: true,
        showActivity: true,
        allowDirectMessages: true,
        shareAnalytics: false,
      },
    };
  }

  private getDefaultPresenceState(): PresenceState {
    return {
      userId: this.userId,
      sessionId: this.sessionId,
      cursor: {
        trackId: '',
        position: 0,
        elementType: 'audio',
        visible: true,
        color: this.generateUserColor(),
      },
      selection: {
        trackId: '',
        startPosition: 0,
        endPosition: 0,
        elementType: 'audio',
        elementIds: [],
        selectionType: 'range',
        color: this.generateUserColor(),
      },
      viewport: {
        zoomLevel: 1,
        scrollPosition: 0,
        visibleRange: [0, 100],
        viewMode: 'waveform',
        followMode: 'none',
      },
      activity: {
        currentTool: 'select',
        mode: 'editing',
        isRecording: false,
        isPlaying: false,
        lastAction: 'none',
        lastActionTime: Date.now(),
      },
      audio: {
        isMonitoring: false,
        inputLevel: 0,
        outputLevel: 0,
        latency: 0,
        sampleRate: 44100,
        bufferSize: 512,
        isRecording: false,
      },
      lastUpdate: Date.now(),
    };
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateOperationId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateConflictId(): string {
    return `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateUserColor(): string {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  // Event system
  public on(event: string, handler: (event: CollaborationEvent) => void): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  public off(event: string, handler: (event: CollaborationEvent) => void): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: Omit<CollaborationEvent, 'type'>): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const eventData: CollaborationEvent = {
        type: event,
        ...data,
      };
      handlers.forEach(handler => {
        try {
          handler(eventData);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  // Public getters
  public getUsers(): CollaborationUser[] {
    return Array.from(this.users.values());
  }

  public getPresenceStates(): Map<string, PresenceState> {
    return new Map(this.presenceStates);
  }

  public getMetrics(): SyncMetrics {
    return { ...this.metrics };
  }

  public getConflicts(): ConflictInfo[] {
    return Array.from(this.conflicts.values());
  }

  public getPendingOperations(): RealTimeOperation[] {
    return Array.from(this.pendingOperations.values());
  }

  public isConnected(): boolean {
    return this.client.isConnected();
  }

  public getConnectionState(): string {
    return this.channel?.state || 'disconnected';
  }
}
