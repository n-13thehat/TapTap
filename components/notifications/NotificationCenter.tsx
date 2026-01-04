"use client";

import { useState } from 'react';
import { useNotifications, useNotificationActions } from '@/hooks/useNotifications';
import { AI_AGENTS, type AgentMessage } from '@/lib/aiAgents';
import { 
  Bell, 
  BellOff, 
  X, 
  Check, 
  CheckCheck,
  Clock,
  Sparkles,
  ExternalLink
} from 'lucide-react';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const { messages, unreadCount, markAsRead, markAllAsRead, dismissMessage } = useNotifications();
  const { handleAction } = useNotificationActions();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filteredMessages = filter === 'unread' 
    ? messages.filter(msg => !msg.read)
    : messages;

  const handleMessageAction = async (message: AgentMessage, actionId: string) => {
    const action = message.actions?.find(a => a.id === actionId);
    if (!action) return;

    if (action.type === 'dismiss') {
      dismissMessage(message.id);
    } else if (action.type === 'link') {
      window.location.href = action.action;
      markAsRead(message.id);
    } else {
      await handleAction(action.action, action.data);
      markAsRead(message.id);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'border-red-500 bg-red-500/10';
      case 'high': return 'border-orange-500 bg-orange-500/10';
      case 'medium': return 'border-yellow-500 bg-yellow-500/10';
      default: return 'border-white/20 bg-white/5';
    }
  };

  const getTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end pt-16 pr-4">
      <div className="w-full max-w-md bg-black/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Bell size={20} className="text-teal-400" />
            <div>
              <h2 className="font-semibold text-white">Agent Messages</h2>
              <p className="text-xs text-white/60">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                title="Mark all as read"
              >
                <CheckCheck size={16} className="text-white/60" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X size={16} className="text-white/60" />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex border-b border-white/10">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              filter === 'all' 
                ? 'text-teal-300 border-b-2 border-teal-300' 
                : 'text-white/60 hover:text-white/80'
            }`}
          >
            All ({messages.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              filter === 'unread' 
                ? 'text-teal-300 border-b-2 border-teal-300' 
                : 'text-white/60 hover:text-white/80'
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>

        {/* Messages List */}
        <div className="max-h-96 overflow-y-auto">
          {filteredMessages.length > 0 ? (
            <div className="space-y-1 p-2">
              {filteredMessages.map((message) => {
                const agent = AI_AGENTS[message.agentId];
                
                return (
                  <div
                    key={message.id}
                    className={`
                      relative p-4 rounded-lg border transition-all duration-200 hover:bg-white/5
                      ${getPriorityColor(message.priority)}
                      ${!message.read ? 'ring-1 ring-teal-300/30' : ''}
                    `}
                  >
                    {/* Agent Avatar & Info */}
                    <div className="flex items-start gap-3 mb-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
                        style={{ backgroundColor: agent?.color + '20', color: agent?.color }}
                      >
                        {agent?.emoji}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-medium text-white text-sm truncate">
                            {message.title}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-white/50">
                            {!message.read && (
                              <div className="w-2 h-2 bg-teal-400 rounded-full"></div>
                            )}
                            <Clock size={12} />
                            <span>{getTimeAgo(message.timestamp)}</span>
                          </div>
                        </div>
                        
                        <p className="text-sm text-white/80 leading-relaxed">
                          {message.message}
                        </p>
                        
                        <div className="flex items-center gap-1 mt-2 text-xs text-white/50">
                          <Sparkles size={12} />
                          <span>from {agent?.name}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    {message.actions && message.actions.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {message.actions.map((action: NonNullable<AgentMessage['actions']>[number]) => (
                          <button
                            key={action.id}
                            onClick={() => handleMessageAction(message, action.id)}
                            className={`
                              px-3 py-1 rounded-lg text-xs font-medium transition-colors
                              ${action.type === 'dismiss' 
                                ? 'bg-white/10 text-white/70 hover:bg-white/20' 
                                : action.type === 'link'
                                ? 'bg-blue-600/20 text-blue-300 hover:bg-blue-600/30'
                                : 'bg-teal-600/20 text-teal-300 hover:bg-teal-600/30'
                              }
                            `}
                          >
                            {action.type === 'link' && <ExternalLink size={12} className="inline mr-1" />}
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Mark as read button */}
                    {!message.read && (
                      <button
                        onClick={() => markAsRead(message.id)}
                        className="absolute top-2 right-2 p-1 hover:bg-white/10 rounded transition-colors"
                        title="Mark as read"
                      >
                        <Check size={12} className="text-white/40" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 px-4">
              <BellOff size={48} className="mx-auto mb-4 text-white/20" />
              <h3 className="font-medium text-white/60 mb-2">
                {filter === 'unread' ? 'No unread messages' : 'No messages yet'}
              </h3>
              <p className="text-sm text-white/40">
                {filter === 'unread' 
                  ? 'All caught up! Your agents will notify you when something interesting happens.'
                  : 'Your AI agents will send you personalized messages about your TapTap activity.'
                }
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={() => {/* TODO: Open notification settings */}}
            className="w-full text-sm text-teal-300 hover:text-teal-200 transition-colors"
          >
            Manage notification settings
          </button>
        </div>
      </div>
    </div>
  );
}
