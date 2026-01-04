"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  RealTimeEngine, 
  CollaborationUser, 
  PresenceState, 
  ConflictInfo, 
  SyncMetrics,
  CollaborationEvent 
} from '@/lib/collaboration/RealTimeEngine';
import {
  Users,
  MessageCircle,
  Video,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Settings,
  Share2,
  Download,
  Upload,
  Play,
  Pause,
  Circle,
  Square,
  SkipBack,
  SkipForward,
  Rewind,
  FastForward,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle,
  Clock,
  Wifi,
  WifiOff,
  Activity,
  Zap,
  Target,
  Layers,
  Grid,
  List,
  Filter,
  Search,
  Bell,
  BellOff,
  Camera,
  CameraOff,
  Phone,
  PhoneOff,
  Monitor,
  Smartphone,
  Tablet,
  Laptop,
  Globe,
  MapPin,
  Calendar,
  User,
  Crown,
  Shield,
  Edit,
  MessageSquare,
  Heart,
  Star,
  ThumbsUp,
  ThumbsDown,
  MoreHorizontal,
  X,
  Check,
  AlertCircle,
  Info,
  Maximize2,
  Minimize2,
  RefreshCw,
  Power,
  Signal
} from 'lucide-react';

interface CollaborativeWorkspaceProps {
  projectId: string;
  userId: string;
  supabaseUrl: string;
  supabaseKey: string;
  className?: string;
  onUserAction?: (action: string, data: any) => void;
  onConflictResolution?: (conflictId: string, resolution: any) => void;
}

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: number;
  type: 'text' | 'system' | 'mention' | 'reaction';
  metadata?: {
    trackId?: string;
    position?: number;
    replyTo?: string;
    reactions?: { [emoji: string]: string[] };
  };
}

interface VoiceState {
  isEnabled: boolean;
  isMuted: boolean;
  isDeafened: boolean;
  volume: number;
  inputLevel: number;
  outputLevel: number;
  isTransmitting: boolean;
  quality: 'low' | 'medium' | 'high';
}

interface VideoState {
  isEnabled: boolean;
  isVisible: boolean;
  quality: 'low' | 'medium' | 'high';
  layout: 'grid' | 'focus' | 'sidebar';
  participants: string[];
}

type WorkspaceView = 'overview' | 'users' | 'chat' | 'voice' | 'conflicts' | 'metrics';

export default function CollaborativeWorkspace({
  projectId,
  userId,
  supabaseUrl,
  supabaseKey,
  className = '',
  onUserAction,
  onConflictResolution
}: CollaborativeWorkspaceProps) {
  const [engine, setEngine] = useState<RealTimeEngine | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState('disconnected');
  const [currentView, setCurrentView] = useState<WorkspaceView>('overview');
  
  // Collaboration state
  const [users, setUsers] = useState<CollaborationUser[]>([]);
  const [presenceStates, setPresenceStates] = useState<Map<string, PresenceState>>(new Map());
  const [conflicts, setConflicts] = useState<ConflictInfo[]>([]);
  const [metrics, setMetrics] = useState<SyncMetrics>({
    operationsPerSecond: 0,
    averageLatency: 0,
    conflictRate: 0,
    bandwidthUsage: 0,
    connectionQuality: 1,
    syncErrors: 0,
    lastSyncTime: 0,
    queueSize: 0,
  });
  
  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState<string[]>([]);
  
  // Voice/Video state
  const [voiceState, setVoiceState] = useState<VoiceState>({
    isEnabled: false,
    isMuted: true,
    isDeafened: false,
    volume: 0.8,
    inputLevel: 0,
    outputLevel: 0,
    isTransmitting: false,
    quality: 'medium',
  });
  
  const [videoState, setVideoState] = useState<VideoState>({
    isEnabled: false,
    isVisible: false,
    quality: 'medium',
    layout: 'grid',
    participants: [],
  });
  
  // UI state
  const [showSettings, setShowSettings] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);
  
  // Refs
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Initialize real-time engine
  useEffect(() => {
    const initEngine = async () => {
      try {
        const rtEngine = new RealTimeEngine(supabaseUrl, supabaseKey, projectId, userId);
        
        // Set up event listeners
        rtEngine.on('connection', handleConnectionEvent);
        rtEngine.on('user_joined', handleUserJoined);
        rtEngine.on('user_left', handleUserLeft);
        rtEngine.on('user_updated', handleUserUpdated);
        rtEngine.on('presence_sync', handlePresenceSync);
        rtEngine.on('operation_applied', handleOperationApplied);
        rtEngine.on('conflict', handleConflict);
        rtEngine.on('conflict_resolved', handleConflictResolved);
        rtEngine.on('metrics_update', handleMetricsUpdate);
        rtEngine.on('error', handleError);
        
        await rtEngine.connect();
        setEngine(rtEngine);
        setIsConnected(true);
        setConnectionState('connected');
        
        console.log('Collaborative workspace initialized');
      } catch (error) {
        console.error('Failed to initialize collaborative workspace:', error);
        setConnectionState('error');
      }
    };

    initEngine();

    return () => {
      if (engine) {
        engine.disconnect();
      }
    };
  }, [projectId, userId, supabaseUrl, supabaseKey]);

  // Event handlers
  const handleConnectionEvent = useCallback((event: CollaborationEvent) => {
    setIsConnected(event.data.type === 'connected');
    setConnectionState(event.data.type);
    
    if (event.data.type === 'connected') {
      addNotification('Connected to collaboration server', 'success');
    } else if (event.data.type === 'disconnected') {
      addNotification('Disconnected from collaboration server', 'warning');
    }
  }, []);

  const handleUserJoined = useCallback((event: CollaborationEvent) => {
    setUsers(event.data.users);
    const joinedUser = event.data.users.find((u: CollaborationUser) => u.id === event.userId);
    if (joinedUser && joinedUser.id !== userId) {
      addNotification(`${joinedUser.username} joined the session`, 'info');
      addChatMessage({
        type: 'system',
        message: `${joinedUser.username} joined the session`,
        userId: 'system',
        username: 'System',
      });
    }
  }, [userId]);

  const handleUserLeft = useCallback((event: CollaborationEvent) => {
    setUsers(event.data.users);
    addNotification(`User left the session`, 'info');
    addChatMessage({
      type: 'system',
      message: `User left the session`,
      userId: 'system',
      username: 'System',
    });
  }, []);

  const handleUserUpdated = useCallback((event: CollaborationEvent) => {
    setUsers(prev => prev.map(user => 
      user.id === event.data.user.id ? event.data.user : user
    ));
  }, []);

  const handlePresenceSync = useCallback((event: CollaborationEvent) => {
    setPresenceStates(new Map(event.data.presences));
  }, []);

  const handleOperationApplied = useCallback((event: CollaborationEvent) => {
    if (onUserAction) {
      onUserAction('operation_applied', event.data.operation);
    }
  }, [onUserAction]);

  const handleConflict = useCallback((event: CollaborationEvent) => {
    setConflicts(prev => [...prev, event.data.conflict]);
    addNotification(`Conflict detected: ${event.data.conflict.description}`, 'warning');
  }, []);

  const handleConflictResolved = useCallback((event: CollaborationEvent) => {
    setConflicts(prev => prev.filter(c => c.conflictId !== event.data.conflict.conflictId));
    addNotification(`Conflict resolved: ${event.data.conflict.description}`, 'success');
  }, []);

  const handleMetricsUpdate = useCallback((event: CollaborationEvent) => {
    setMetrics(event.data.metrics);
  }, []);

  const handleError = useCallback((event: CollaborationEvent) => {
    console.error('Collaboration error:', event.data.error);
    addNotification(`Error: ${event.data.error}`, 'error');
  }, []);

  // Chat functions
  const addChatMessage = useCallback((message: Partial<ChatMessage>) => {
    const fullMessage: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      type: 'text',
      ...message,
    } as ChatMessage;

    setChatMessages(prev => [...prev, fullMessage]);
    
    // Auto-scroll to bottom
    setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }, 100);
  }, []);

  const sendChatMessage = useCallback(() => {
    if (!newMessage.trim() || !engine) return;

    const message: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      username: users.find(u => u.id === userId)?.username || `User ${userId}`,
      message: newMessage.trim(),
      timestamp: Date.now(),
      type: 'text',
    };

    addChatMessage(message);
    setNewMessage('');
    
    // TODO: Broadcast message to other users
    // engine.sendOperation({ type: 'chat.message', data: message });
  }, [newMessage, engine, userId, users, addChatMessage]);

  const handleTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // TODO: Broadcast typing indicator
    
    typingTimeoutRef.current = setTimeout(() => {
      // TODO: Stop typing indicator
    }, 3000);
  }, []);

  // Voice/Video functions
  const toggleVoice = useCallback(async () => {
    if (!voiceState.isEnabled) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setVoiceState(prev => ({ ...prev, isEnabled: true, isMuted: false }));
        // TODO: Set up voice communication
      } catch (error) {
        console.error('Failed to enable voice:', error);
        addNotification('Failed to enable voice', 'error');
      }
    } else {
      setVoiceState(prev => ({ ...prev, isEnabled: false, isMuted: true }));
      // TODO: Disable voice communication
    }
  }, [voiceState.isEnabled]);

  const toggleMute = useCallback(() => {
    setVoiceState(prev => ({ ...prev, isMuted: !prev.isMuted }));
    // TODO: Mute/unmute audio stream
  }, []);

  const toggleVideo = useCallback(async () => {
    if (!videoState.isEnabled) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setVideoState(prev => ({ ...prev, isEnabled: true, isVisible: true }));
        // TODO: Set up video communication
      } catch (error) {
        console.error('Failed to enable video:', error);
        addNotification('Failed to enable video', 'error');
      }
    } else {
      setVideoState(prev => ({ ...prev, isEnabled: false, isVisible: false }));
      // TODO: Disable video communication
    }
  }, [videoState.isEnabled]);

  // Conflict resolution
  const resolveConflict = useCallback(async (conflictId: string, resolution: any) => {
    if (!engine) return;

    try {
      await engine.resolveConflict(conflictId, resolution);
      if (onConflictResolution) {
        onConflictResolution(conflictId, resolution);
      }
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
      addNotification('Failed to resolve conflict', 'error');
    }
  }, [engine, onConflictResolution]);

  // Notifications
  const addNotification = useCallback((message: string, type: 'info' | 'success' | 'warning' | 'error') => {
    const notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      message,
      type,
      timestamp: Date.now(),
    };

    setNotifications(prev => [...prev, notification]);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  }, []);

  // User presence helpers
  const getUserPresence = useCallback((userId: string): PresenceState | null => {
    return presenceStates.get(userId) || null;
  }, [presenceStates]);

  const getOnlineUsers = useMemo(() => {
    return users.filter(user => user.status === 'online');
  }, [users]);

  const getActiveUsers = useMemo(() => {
    return users.filter(user => {
      const presence = getUserPresence(user.id);
      return presence && Date.now() - presence.lastUpdate < 30000; // Active in last 30 seconds
    });
  }, [users, getUserPresence]);

  // Render user avatar
  const renderUserAvatar = useCallback((user: CollaborationUser, size: 'sm' | 'md' | 'lg' = 'md') => {
    const presence = getUserPresence(user.id);
    const isActive = presence && Date.now() - presence.lastUpdate < 30000;
    
    const sizeClasses = {
      sm: 'w-6 h-6 text-xs',
      md: 'w-8 h-8 text-sm',
      lg: 'w-12 h-12 text-base',
    };

    return (
      <div className={`relative ${sizeClasses[size]} rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium`}>
        {user.avatar ? (
          <img src={user.avatar} alt={user.username} className="w-full h-full rounded-full object-cover" />
        ) : (
          <span>{user.username.charAt(0).toUpperCase()}</span>
        )}
        
        {/* Status indicator */}
        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
          user.status === 'online' ? 'bg-green-400' :
          user.status === 'away' ? 'bg-yellow-400' :
          user.status === 'busy' ? 'bg-red-400' :
          'bg-gray-400'
        }`} />
        
        {/* Activity indicator */}
        {isActive && (
          <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-blue-400 animate-pulse" />
        )}
        
        {/* Role indicator */}
        {user.role === 'owner' && (
          <Crown size={10} className="absolute -top-1 -left-1 text-yellow-400" />
        )}
        {user.role === 'admin' && (
          <Shield size={10} className="absolute -top-1 -left-1 text-blue-400" />
        )}
      </div>
    );
  }, [getUserPresence]);

  // Render overview
  const renderOverview = () => (
    <div className="space-y-4">
      {/* Connection status */}
      <div className={`flex items-center gap-2 p-3 rounded-lg ${
        isConnected ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'
      }`}>
        {isConnected ? <Wifi size={16} /> : <WifiOff size={16} />}
        <span className="text-sm font-medium">
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
        <span className="text-xs opacity-60">({connectionState})</span>
      </div>

      {/* Active users */}
      <div className="bg-white/5 rounded-lg p-4">
        <h3 className="text-white font-medium mb-3 flex items-center gap-2">
          <Users size={16} />
          Active Users ({getActiveUsers.length})
        </h3>
        
        <div className="flex flex-wrap gap-2">
          {getActiveUsers.map(user => (
            <div
              key={user.id}
              className="flex items-center gap-2 bg-white/10 rounded-lg p-2 cursor-pointer hover:bg-white/20 transition-colors"
              onClick={() => setSelectedUser(user.id)}
            >
              {renderUserAvatar(user, 'sm')}
              <span className="text-white text-sm">{user.username}</span>
              <span className="text-white/60 text-xs">({user.role})</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/5 rounded-lg p-3">
          <div className="text-white/60 text-xs">Latency</div>
          <div className="text-white font-medium">{metrics.averageLatency.toFixed(0)}ms</div>
        </div>
        
        <div className="bg-white/5 rounded-lg p-3">
          <div className="text-white/60 text-xs">Operations/sec</div>
          <div className="text-white font-medium">{metrics.operationsPerSecond}</div>
        </div>
        
        <div className="bg-white/5 rounded-lg p-3">
          <div className="text-white/60 text-xs">Conflicts</div>
          <div className="text-white font-medium">{conflicts.length}</div>
        </div>
        
        <div className="bg-white/5 rounded-lg p-3">
          <div className="text-white/60 text-xs">Queue Size</div>
          <div className="text-white font-medium">{metrics.queueSize}</div>
        </div>
      </div>

      {/* Recent conflicts */}
      {conflicts.length > 0 && (
        <div className="bg-yellow-600/20 rounded-lg p-4">
          <h3 className="text-yellow-400 font-medium mb-2 flex items-center gap-2">
            <AlertTriangle size={16} />
            Active Conflicts
          </h3>
          
          <div className="space-y-2">
            {conflicts.slice(0, 3).map(conflict => (
              <div key={conflict.conflictId} className="flex items-center justify-between bg-white/10 rounded p-2">
                <div>
                  <div className="text-white text-sm">{conflict.description}</div>
                  <div className="text-white/60 text-xs">{conflict.type}</div>
                </div>
                
                <button
                  onClick={() => setCurrentView('conflicts')}
                  className="px-2 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-white text-xs transition-colors"
                >
                  Resolve
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Render users panel
  const renderUsers = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-medium">Users ({users.length})</h3>
        <button className="p-1 rounded text-white/60 hover:text-white transition-colors">
          <MoreHorizontal size={16} />
        </button>
      </div>

      <div className="space-y-2">
        {users.map(user => {
          const presence = getUserPresence(user.id);
          const isActive = presence && Date.now() - presence.lastUpdate < 30000;
          
          return (
            <div
              key={user.id}
              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                selectedUser === user.id ? 'bg-blue-600/20' : 'bg-white/5 hover:bg-white/10'
              }`}
              onClick={() => setSelectedUser(selectedUser === user.id ? null : user.id)}
            >
              {renderUserAvatar(user)}
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">{user.username}</span>
                  {user.id === userId && (
                    <span className="text-xs bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded">You</span>
                  )}
                </div>
                
                <div className="flex items-center gap-2 text-xs text-white/60">
                  <span>{user.role}</span>
                  <span>•</span>
                  <span>{user.status}</span>
                  {presence && (
                    <>
                      <span>•</span>
                      <span>{presence.activity.mode}</span>
                    </>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                {voiceState.isEnabled && (
                  <div className={`p-1 rounded ${user.id === userId && !voiceState.isMuted ? 'bg-green-600/20 text-green-400' : 'text-white/40'}`}>
                    {user.id === userId && voiceState.isMuted ? <MicOff size={12} /> : <Mic size={12} />}
                  </div>
                )}
                
                {videoState.isEnabled && videoState.participants.includes(user.id) && (
                  <div className="p-1 rounded bg-blue-600/20 text-blue-400">
                    <Camera size={12} />
                  </div>
                )}
                
                {isActive && (
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // Render chat panel
  const renderChat = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <h3 className="text-white font-medium">Chat</h3>
        <div className="flex items-center gap-2">
          <button className="p-1 rounded text-white/60 hover:text-white transition-colors">
            <Settings size={14} />
          </button>
        </div>
      </div>

      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-3 space-y-3"
        style={{ maxHeight: '300px' }}
      >
        {chatMessages.map(message => (
          <div
            key={message.id}
            className={`flex gap-2 ${message.type === 'system' ? 'justify-center' : ''}`}
          >
            {message.type !== 'system' && (
              <div className="flex-shrink-0">
                {renderUserAvatar(
                  users.find(u => u.id === message.userId) || {
                    id: message.userId,
                    username: message.username,
                    role: 'viewer',
                    status: 'offline',
                    lastSeen: 0,
                    permissions: {} as any,
                    preferences: {} as any,
                    metadata: {},
                  },
                  'sm'
                )}
              </div>
            )}
            
            <div className={`flex-1 ${message.type === 'system' ? 'text-center' : ''}`}>
              {message.type !== 'system' && (
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white text-sm font-medium">{message.username}</span>
                  <span className="text-white/40 text-xs">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              )}
              
              <div className={`text-sm ${
                message.type === 'system' 
                  ? 'text-white/60 italic' 
                  : 'text-white bg-white/10 rounded-lg p-2'
              }`}>
                {message.message}
              </div>
            </div>
          </div>
        ))}
        
        {isTyping.length > 0 && (
          <div className="flex items-center gap-2 text-white/60 text-sm">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
              <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
            <span>{isTyping.join(', ')} {isTyping.length === 1 ? 'is' : 'are'} typing...</span>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-white/10">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                sendChatMessage();
              }
            }}
            placeholder="Type a message..."
            className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:border-blue-400"
          />
          
          <button
            onClick={sendChatMessage}
            disabled={!newMessage.trim()}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 rounded-lg text-white transition-colors"
          >
            <MessageCircle size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  // Render voice panel
  const renderVoice = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-medium">Voice & Video</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleVoice}
            className={`p-2 rounded transition-colors ${
              voiceState.isEnabled ? 'bg-green-600 text-white' : 'bg-white/10 text-white/60 hover:text-white'
            }`}
          >
            {voiceState.isEnabled ? <Mic size={16} /> : <MicOff size={16} />}
          </button>
          
          <button
            onClick={toggleVideo}
            className={`p-2 rounded transition-colors ${
              videoState.isEnabled ? 'bg-blue-600 text-white' : 'bg-white/10 text-white/60 hover:text-white'
            }`}
          >
            {videoState.isEnabled ? <Camera size={16} /> : <CameraOff size={16} />}
          </button>
        </div>
      </div>

      {/* Voice controls */}
      {voiceState.isEnabled && (
        <div className="bg-white/5 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-white text-sm">Microphone</span>
            <button
              onClick={toggleMute}
              className={`p-1 rounded transition-colors ${
                voiceState.isMuted ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
              }`}
            >
              {voiceState.isMuted ? <MicOff size={14} /> : <Mic size={14} />}
            </button>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/60">Input Level</span>
              <span className="text-white">{Math.round(voiceState.inputLevel * 100)}%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <div 
                className="bg-green-400 h-2 rounded-full transition-all"
                style={{ width: `${voiceState.inputLevel * 100}%` }}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/60">Volume</span>
              <span className="text-white">{Math.round(voiceState.volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={voiceState.volume}
              onChange={(e) => setVoiceState(prev => ({ ...prev, volume: parseFloat(e.target.value) }))}
              className="w-full"
            />
          </div>
        </div>
      )}

      {/* Video participants */}
      {videoState.isEnabled && (
        <div className="bg-white/5 rounded-lg p-4">
          <h4 className="text-white text-sm font-medium mb-3">Video Participants</h4>
          
          <div className="grid grid-cols-2 gap-2">
            {videoState.participants.map(participantId => {
              const user = users.find(u => u.id === participantId);
              return user ? (
                <div key={participantId} className="bg-white/10 rounded-lg p-2 flex items-center gap-2">
                  {renderUserAvatar(user, 'sm')}
                  <span className="text-white text-sm">{user.username}</span>
                </div>
              ) : null;
            })}
          </div>
        </div>
      )}
    </div>
  );

  // Render conflicts panel
  const renderConflicts = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-medium">Conflicts ({conflicts.length})</h3>
        <button className="p-1 rounded text-white/60 hover:text-white transition-colors">
          <RefreshCw size={14} />
        </button>
      </div>

      {conflicts.length === 0 ? (
        <div className="text-center py-8 text-white/60">
          <CheckCircle size={48} className="mx-auto mb-4 opacity-50" />
          <p>No conflicts detected</p>
        </div>
      ) : (
        <div className="space-y-3">
          {conflicts.map(conflict => (
            <div key={conflict.conflictId} className="bg-white/5 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="text-white font-medium">{conflict.description}</h4>
                  <p className="text-white/60 text-sm">{conflict.type}</p>
                </div>
                
                <div className={`px-2 py-1 rounded text-xs ${
                  conflict.severity === 'critical' ? 'bg-red-600/20 text-red-400' :
                  conflict.severity === 'high' ? 'bg-orange-600/20 text-orange-400' :
                  conflict.severity === 'medium' ? 'bg-yellow-600/20 text-yellow-400' :
                  'bg-blue-600/20 text-blue-400'
                }`}>
                  {conflict.severity}
                </div>
              </div>
              
              <div className="mb-3">
                <p className="text-white/80 text-sm mb-2">Suggested Resolution:</p>
                <p className="text-white/60 text-sm">{conflict.suggestedResolution.reasoning}</p>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => resolveConflict(conflict.conflictId, conflict.suggestedResolution)}
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-white text-sm transition-colors"
                >
                  Accept
                </button>
                
                <button
                  onClick={() => resolveConflict(conflict.conflictId, { ...conflict.suggestedResolution, action: 'reject' })}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-white text-sm transition-colors"
                >
                  Reject
                </button>
                
                <button className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-white text-sm transition-colors">
                  Manual
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Render metrics panel
  const renderMetrics = () => (
    <div className="space-y-4">
      <h3 className="text-white font-medium">Performance Metrics</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/5 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Activity size={14} className="text-blue-400" />
            <span className="text-white/80 text-sm">Latency</span>
          </div>
          <div className="text-white text-lg font-medium">{metrics.averageLatency.toFixed(0)}ms</div>
          <div className={`text-xs ${metrics.averageLatency < 100 ? 'text-green-400' : metrics.averageLatency < 300 ? 'text-yellow-400' : 'text-red-400'}`}>
            {metrics.averageLatency < 100 ? 'Excellent' : metrics.averageLatency < 300 ? 'Good' : 'Poor'}
          </div>
        </div>
        
        <div className="bg-white/5 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={14} className="text-green-400" />
            <span className="text-white/80 text-sm">Operations/sec</span>
          </div>
          <div className="text-white text-lg font-medium">{metrics.operationsPerSecond}</div>
          <div className="text-white/60 text-xs">Real-time sync</div>
        </div>
        
        <div className="bg-white/5 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={14} className="text-yellow-400" />
            <span className="text-white/80 text-sm">Conflict Rate</span>
          </div>
          <div className="text-white text-lg font-medium">{(metrics.conflictRate * 100).toFixed(1)}%</div>
          <div className={`text-xs ${metrics.conflictRate < 0.05 ? 'text-green-400' : metrics.conflictRate < 0.15 ? 'text-yellow-400' : 'text-red-400'}`}>
            {metrics.conflictRate < 0.05 ? 'Low' : metrics.conflictRate < 0.15 ? 'Medium' : 'High'}
          </div>
        </div>
        
        <div className="bg-white/5 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Signal size={14} className="text-purple-400" />
            <span className="text-white/80 text-sm">Connection</span>
          </div>
          <div className="text-white text-lg font-medium">{(metrics.connectionQuality * 100).toFixed(0)}%</div>
          <div className={`text-xs ${metrics.connectionQuality > 0.8 ? 'text-green-400' : metrics.connectionQuality > 0.5 ? 'text-yellow-400' : 'text-red-400'}`}>
            {metrics.connectionQuality > 0.8 ? 'Stable' : metrics.connectionQuality > 0.5 ? 'Unstable' : 'Poor'}
          </div>
        </div>
      </div>
      
      <div className="bg-white/5 rounded-lg p-4">
        <h4 className="text-white text-sm font-medium mb-3">Bandwidth Usage</h4>
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/60 text-sm">Current</span>
          <span className="text-white text-sm">{(metrics.bandwidthUsage / 1024).toFixed(1)} KB/s</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2">
          <div 
            className="bg-blue-400 h-2 rounded-full transition-all"
            style={{ width: `${Math.min(metrics.bandwidthUsage / 10240 * 100, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );

  if (isMinimized) {
    return (
      <div className={`fixed bottom-4 right-4 bg-black/90 backdrop-blur-md border border-white/10 rounded-lg p-3 ${className}`}>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
          <span className="text-white text-sm">{getActiveUsers.length} users</span>
          <button
            onClick={() => setIsMinimized(false)}
            className="p-1 rounded text-white/60 hover:text-white transition-colors"
          >
            <Maximize2 size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-black/90 backdrop-blur-md border border-white/10 rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Users size={18} className="text-blue-400" />
            Collaboration
          </h2>
          
          <div className="flex items-center gap-2">
            {/* Voice/Video controls */}
            <button
              onClick={toggleVoice}
              className={`p-2 rounded transition-colors ${
                voiceState.isEnabled ? 'bg-green-600 text-white' : 'bg-white/10 text-white/60 hover:text-white'
              }`}
            >
              {voiceState.isEnabled && !voiceState.isMuted ? <Mic size={14} /> : <MicOff size={14} />}
            </button>
            
            <button
              onClick={toggleVideo}
              className={`p-2 rounded transition-colors ${
                videoState.isEnabled ? 'bg-blue-600 text-white' : 'bg-white/10 text-white/60 hover:text-white'
              }`}
            >
              {videoState.isEnabled ? <Camera size={14} /> : <CameraOff size={14} />}
            </button>
            
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <Settings size={14} />
            </button>
            
            <button
              onClick={() => setIsMinimized(true)}
              className="p-2 rounded bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <Minimize2 size={14} />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-1 mt-4 bg-white/10 rounded-lg p-1">
          {[
            { id: 'overview', name: 'Overview', icon: Activity },
            { id: 'users', name: 'Users', icon: Users },
            { id: 'chat', name: 'Chat', icon: MessageCircle },
            { id: 'voice', name: 'Voice', icon: Mic },
            { id: 'conflicts', name: 'Conflicts', icon: AlertTriangle },
            { id: 'metrics', name: 'Metrics', icon: BarChart3 },
          ].map(({ id, name, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setCurrentView(id as WorkspaceView)}
              className={`flex items-center gap-1 px-3 py-1 rounded text-sm transition-colors ${
                currentView === id ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white'
              }`}
            >
              <Icon size={12} />
              {name}
              {id === 'conflicts' && conflicts.length > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {conflicts.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4" style={{ height: '400px', overflowY: 'auto' }}>
        {currentView === 'overview' && renderOverview()}
        {currentView === 'users' && renderUsers()}
        {currentView === 'chat' && renderChat()}
        {currentView === 'voice' && renderVoice()}
        {currentView === 'conflicts' && renderConflicts()}
        {currentView === 'metrics' && renderMetrics()}
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 space-y-2 z-50">
          {notifications.map(notification => (
            <div
              key={notification.id}
              className={`p-3 rounded-lg shadow-lg max-w-sm ${
                notification.type === 'success' ? 'bg-green-600 text-white' :
                notification.type === 'warning' ? 'bg-yellow-600 text-white' :
                notification.type === 'error' ? 'bg-red-600 text-white' :
                'bg-blue-600 text-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm">{notification.message}</span>
                <button
                  onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
                  className="ml-2 text-white/80 hover:text-white"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
