"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  useEnhancedPlayerStore, 
  useCurrentTrack, 
  useSocial, 
  ChatMessage 
} from '@/stores/enhancedPlayer';
import { 
  Users, 
  MessageCircle, 
  Heart, 
  Smile, 
  ThumbsUp, 
  Flame,
  Star, 
  Send, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Cast, 
  Cast,
  Share2, 
  Copy, 
  ExternalLink, 
  Settings, 
  Crown, 
  Shield, 
  Volume2, 
  VolumeX, 
  Radio, 
  Headphones, 
  Music, 
  Play, 
  Pause, 
  SkipForward, 
  Plus,
  Minus,
  Eye,
  EyeOff,
  Bell,
  BellOff
} from 'lucide-react';

interface SocialPlayerProps {
  className?: string;
  onClose?: () => void;
}

interface Listener {
  id: string;
  username: string;
  avatar?: string;
  role: 'host' | 'moderator' | 'listener';
  isOnline: boolean;
  joinedAt: number;
  permissions: {
    canControl: boolean;
    canAddTracks: boolean;
    canModerate: boolean;
  };
}

interface Reaction {
  id: string;
  emoji: string;
  userId: string;
  username: string;
  timestamp: number;
  trackTime: number;
}

export default function SocialPlayer({ className = '', onClose }: SocialPlayerProps) {
  const currentTrack = useCurrentTrack();
  const social = useSocial();
  
  const {
    toggleLiveChat,
    sendChatMessage,
    addReaction,
    shareTrack,
    startBroadcast,
    stopBroadcast
  } = useEnhancedPlayerStore();

  // Local state
  const [activeTab, setActiveTab] = useState<'chat' | 'listeners' | 'reactions' | 'settings'>('chat');
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [listeners, setListeners] = useState<Listener[]>([
    {
      id: 'host',
      username: 'DJ_Master',
      avatar: '/avatars/dj.jpg',
      role: 'host',
      isOnline: true,
      joinedAt: Date.now() - 3600000,
      permissions: { canControl: true, canAddTracks: true, canModerate: true }
    },
    {
      id: 'user1',
      username: 'MusicLover42',
      avatar: '/avatars/user1.jpg',
      role: 'listener',
      isOnline: true,
      joinedAt: Date.now() - 1800000,
      permissions: { canControl: false, canAddTracks: false, canModerate: false }
    },
    {
      id: 'user2',
      username: 'BeatDropper',
      avatar: '/avatars/user2.jpg',
      role: 'moderator',
      isOnline: true,
      joinedAt: Date.now() - 900000,
      permissions: { canControl: false, canAddTracks: true, canModerate: true }
    }
  ]);
  
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [broadcastSettings, setBroadcastSettings] = useState({
    isPublic: true,
    allowRequests: true,
    autoModeration: true,
    maxListeners: 100,
    requireAuth: false
  });

  const chatRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [social.chatMessages]);

  // Handle message input
  const handleSendMessage = useCallback(() => {
    if (messageInput.trim()) {
      sendChatMessage(messageInput.trim());
      setMessageInput('');
      setIsTyping(false);
    }
  }, [messageInput, sendChatMessage]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Handle reactions
  const handleReaction = useCallback((emoji: string) => {
    addReaction(emoji);
    
    // Add to local reactions for animation
    const reaction: Reaction = {
      id: Date.now().toString(),
      emoji,
      userId: 'current-user',
      username: 'You',
      timestamp: Date.now(),
      trackTime: 0 // Would get from player state
    };
    
    setReactions(prev => [...prev, reaction]);
    
    // Remove reaction after animation
    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== reaction.id));
    }, 3000);
    
    setShowEmojiPicker(false);
  }, [addReaction]);

  // Format time helper
  const formatTime = useCallback((timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  }, []);

  // Render chat messages
  const renderChatMessage = useCallback((message: ChatMessage, index: number) => {
    const isSystem = message.type === 'system';
    const isReaction = message.type === 'reaction';
    const isCurrentUser = message.userId === 'current-user';

    return (
      <div
        key={message.id}
        className={`mb-3 ${isCurrentUser ? 'text-right' : 'text-left'}`}
      >
        {isSystem ? (
          <div className="text-center text-white/40 text-xs italic">
            {message.message}
          </div>
        ) : isReaction ? (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-2xl">{message.message}</span>
            <span className="text-white/60">{message.username}</span>
            {message.trackTime && (
              <span className="text-white/40 text-xs">
                at {Math.floor(message.trackTime / 60)}:{Math.floor(message.trackTime % 60).toString().padStart(2, '0')}
              </span>
            )}
          </div>
        ) : (
          <div className={`max-w-xs ${isCurrentUser ? 'ml-auto' : 'mr-auto'}`}>
            <div className="flex items-start gap-2">
              {!isCurrentUser && (
                <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                  {message.username[0].toUpperCase()}
                </div>
              )}
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white/80 text-xs font-medium">
                    {message.username}
                  </span>
                  <span className="text-white/40 text-xs">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
                
                <div className={`p-3 rounded-lg text-sm ${
                  isCurrentUser 
                    ? 'bg-green-600 text-white' 
                    : 'bg-white/10 text-white'
                }`}>
                  {message.message}
                </div>
              </div>
              
              {isCurrentUser && (
                <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-xs font-bold text-white">
                  You
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }, [formatTime]);

  // Render listener item
  const renderListener = useCallback((listener: Listener) => {
    const getRoleIcon = (role: Listener['role']) => {
      switch (role) {
        case 'host': return <Crown size={14} className="text-yellow-400" />;
        case 'moderator': return <Shield size={14} className="text-blue-400" />;
        default: return <Headphones size={14} className="text-white/60" />;
      }
    };

    const getRoleColor = (role: Listener['role']) => {
      switch (role) {
        case 'host': return 'text-yellow-400';
        case 'moderator': return 'text-blue-400';
        default: return 'text-white/60';
      }
    };

    return (
      <div key={listener.id} className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg transition-colors">
        <div className="relative">
          {listener.avatar ? (
            <img 
              src={listener.avatar} 
              alt={listener.username}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
              {listener.username[0].toUpperCase()}
            </div>
          )}
          
          <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-black ${
            listener.isOnline ? 'bg-green-400' : 'bg-gray-400'
          }`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-white font-medium truncate">{listener.username}</span>
            {getRoleIcon(listener.role)}
          </div>
          <div className={`text-xs ${getRoleColor(listener.role)} capitalize`}>
            {listener.role} • joined {formatTime(listener.joinedAt)}
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          {listener.permissions.canControl && (
            <div className="w-2 h-2 bg-green-400 rounded-full" title="Can control playback" />
          )}
          {listener.permissions.canAddTracks && (
            <div className="w-2 h-2 bg-blue-400 rounded-full" title="Can add tracks" />
          )}
          {listener.permissions.canModerate && (
            <div className="w-2 h-2 bg-purple-400 rounded-full" title="Can moderate" />
          )}
        </div>
      </div>
    );
  }, [formatTime]);

  const commonEmojis = ['❤️', '🔥', '👍', '🎵', '🎉', '😍', '🤩', '💯', '🙌', '👏'];

  return (
    <div className={`bg-black/90 backdrop-blur-md border border-white/10 rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users size={20} className="text-green-400" />
            Social Player
          </h2>
          
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              ×
            </button>
          )}
        </div>

        {/* Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${social.broadcasting ? 'bg-red-500' : 'bg-gray-500'}`} />
              <span className="text-white/80">
                {social.broadcasting ? 'Broadcasting' : 'Not broadcasting'}
              </span>
            </div>
            
            <div className="flex items-center gap-1 text-white/60">
              <Users size={14} />
              <span>{social.listeners} listeners</span>
            </div>
          </div>
          
          <button
            onClick={social.broadcasting ? stopBroadcast : startBroadcast}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              social.broadcasting
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {social.broadcasting ? (
              <>
                <CastOff size={14} className="inline mr-1" />
                Stop
              </>
            ) : (
              <>
                <Cast size={14} className="inline mr-1" />
                Start
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        {[
          { id: 'chat', name: 'Chat', icon: MessageCircle },
          { id: 'listeners', name: 'Listeners', icon: Users },
          { id: 'reactions', name: 'Reactions', icon: Heart },
          { id: 'settings', name: 'Settings', icon: Settings }
        ].map(({ id, name, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 transition-colors ${
              activeTab === id
                ? 'bg-white/10 text-white border-b-2 border-green-400'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Icon size={16} />
            <span className="text-sm font-medium">{name}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="h-96 overflow-hidden">
        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <div className="h-full flex flex-col">
            {/* Messages */}
            <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-2">
              {social.chatMessages.length > 0 ? (
                social.chatMessages.map((message, index) => renderChatMessage(message, index))
              ) : (
                <div className="text-center py-8 text-white/60">
                  <MessageCircle size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No messages yet</p>
                  <p className="text-xs">Start the conversation!</p>
                </div>
              )}
            </div>
            
            {/* Message Input */}
            <div className="p-4 border-t border-white/10">
              <div className="flex items-center gap-2">
                <input
                  ref={messageInputRef}
                  type="text"
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={(e) => {
                    setMessageInput(e.target.value);
                    setIsTyping(e.target.value.length > 0);
                  }}
                  onKeyPress={handleKeyPress}
                  className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:border-green-400"
                />
                
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Smile size={16} />
                </button>
                
                <button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
                  className="p-2 rounded-lg bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 text-white transition-colors"
                >
                  <Send size={16} />
                </button>
              </div>
              
              {/* Emoji Picker */}
              {showEmojiPicker && (
                <div className="mt-2 p-3 bg-white/10 rounded-lg">
                  <div className="grid grid-cols-5 gap-2">
                    {commonEmojis.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => {
                          setMessageInput(prev => prev + emoji);
                          setShowEmojiPicker(false);
                        }}
                        className="p-2 text-xl hover:bg-white/10 rounded transition-colors"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Listeners Tab */}
        {activeTab === 'listeners' && (
          <div className="h-full overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-medium">
                  Listeners ({listeners.length})
                </h3>
                
                <button className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-white/60 text-sm transition-colors">
                  Invite Friends
                </button>
              </div>
              
              <div className="space-y-1">
                {listeners.map(renderListener)}
              </div>
            </div>
          </div>
        )}

        {/* Reactions Tab */}
        {activeTab === 'reactions' && (
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto p-4">
              <h3 className="text-white font-medium mb-4">Quick Reactions</h3>
              
              <div className="grid grid-cols-5 gap-3 mb-6">
                {commonEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleReaction(emoji)}
                    className="aspect-square bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center text-2xl transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              
              <h4 className="text-white/80 font-medium mb-3">Recent Reactions</h4>
              
              <div className="space-y-2">
                {reactions.slice(-10).map((reaction) => (
                  <div key={reaction.id} className="flex items-center gap-3 p-2 bg-white/5 rounded-lg">
                    <span className="text-xl">{reaction.emoji}</span>
                    <div className="flex-1">
                      <div className="text-white/80 text-sm">{reaction.username}</div>
                      <div className="text-white/40 text-xs">
                        {formatTime(reaction.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
                
                {reactions.length === 0 && (
                  <div className="text-center py-8 text-white/60">
                    <Heart size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No reactions yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="h-full overflow-y-auto p-4">
            <h3 className="text-white font-medium mb-4">Broadcast Settings</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white/80">Public Broadcast</div>
                  <div className="text-white/40 text-sm">Allow anyone to join</div>
                </div>
                <button
                  onClick={() => setBroadcastSettings(prev => ({ ...prev, isPublic: !prev.isPublic }))}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    broadcastSettings.isPublic ? 'bg-green-600' : 'bg-white/20'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    broadcastSettings.isPublic ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white/80">Allow Requests</div>
                  <div className="text-white/40 text-sm">Let listeners request tracks</div>
                </div>
                <button
                  onClick={() => setBroadcastSettings(prev => ({ ...prev, allowRequests: !prev.allowRequests }))}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    broadcastSettings.allowRequests ? 'bg-green-600' : 'bg-white/20'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    broadcastSettings.allowRequests ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white/80">Auto Moderation</div>
                  <div className="text-white/40 text-sm">Automatically filter inappropriate content</div>
                </div>
                <button
                  onClick={() => setBroadcastSettings(prev => ({ ...prev, autoModeration: !prev.autoModeration }))}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    broadcastSettings.autoModeration ? 'bg-green-600' : 'bg-white/20'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    broadcastSettings.autoModeration ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
              
              <div>
                <div className="text-white/80 mb-2">Max Listeners</div>
                <input
                  type="range"
                  min="10"
                  max="1000"
                  step="10"
                  value={broadcastSettings.maxListeners}
                  onChange={(e) => setBroadcastSettings(prev => ({ ...prev, maxListeners: Number(e.target.value) }))}
                  className="w-full accent-green-400"
                />
                <div className="text-white/60 text-sm mt-1">{broadcastSettings.maxListeners} listeners</div>
              </div>
              
              <div className="pt-4 border-t border-white/10">
                <h4 className="text-white/80 font-medium mb-3">Share Session</h4>
                
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="text"
                    value="https://taptap.matrix/listen/abc123"
                    readOnly
                    className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white/60 text-sm"
                  />
                  <button className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white/60 transition-colors">
                    <Copy size={16} />
                  </button>
                </div>
                
                <div className="flex gap-2">
                  <button className="flex-1 p-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm transition-colors">
                    Share on Twitter
                  </button>
                  <button className="flex-1 p-2 bg-green-600 hover:bg-green-700 rounded-lg text-white text-sm transition-colors">
                    Share on WhatsApp
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Reactions */}
      <div className="fixed inset-0 pointer-events-none z-50">
        {reactions.map((reaction) => (
          <div
            key={reaction.id}
            className="absolute animate-bounce"
            style={{
              left: `${Math.random() * 80 + 10}%`,
              top: `${Math.random() * 80 + 10}%`,
              animationDuration: '3s',
              animationFillMode: 'forwards'
            }}
          >
            <div className="text-4xl opacity-80 animate-pulse">
              {reaction.emoji}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
