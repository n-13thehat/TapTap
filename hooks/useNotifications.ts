"use client";

import { useState, useEffect, useCallback } from 'react';
import { notificationSystem } from '@/lib/notificationSystem';
import { NotificationSettings } from '@/lib/notificationSystem';
import type { AgentMessage } from '@/lib/aiAgents';
import { useAuth } from './useAuth';

/**
 * Hook for managing user notifications
 */
export function useNotifications() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const userId = user?.id;

  // Load messages and subscribe to updates
  useEffect(() => {
    if (!userId) {
      setMessages([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    // Initialize user and load messages
    notificationSystem.initializeUser(userId);
    const userMessages = notificationSystem.getMessages(userId);
    const unread = notificationSystem.getUnreadCount(userId);
    
    setMessages(userMessages);
    setUnreadCount(unread);
    setLoading(false);

    // Subscribe to new messages
    const unsubscribe = notificationSystem.subscribe((messageUserId, message) => {
      if (messageUserId === userId) {
        setMessages(prev => [message, ...prev.slice(0, 49)]); // Keep last 50
        setUnreadCount(prev => prev + 1);
      }
    });

    return unsubscribe;
  }, [userId]);

  const markAsRead = useCallback((messageId: string) => {
    if (!userId) return;
    
    notificationSystem.markAsRead(userId, messageId);
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId ? { ...msg, read: true } : msg
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, [userId]);

  const markAllAsRead = useCallback(() => {
    if (!userId) return;
    
    notificationSystem.markAllAsRead(userId);
    setMessages(prev => prev.map(msg => ({ ...msg, read: true })));
    setUnreadCount(0);
  }, [userId]);

  const dismissMessage = useCallback((messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
    markAsRead(messageId);
  }, [markAsRead]);

  return {
    messages,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    dismissMessage,
  };
}

/**
 * Hook for notification settings
 */
export function useNotificationSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const userId = user?.id;

  useEffect(() => {
    if (!userId) {
      setSettings(null);
      setLoading(false);
      return;
    }

    const userSettings = notificationSystem.getSettings(userId);
    setSettings(userSettings);
    setLoading(false);
  }, [userId]);

  const updateSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    if (!userId || !settings) return;

    const updatedSettings = { ...settings, ...newSettings };
    notificationSystem.updateSettings(userId, newSettings);
    setSettings(updatedSettings);
  }, [userId, settings]);

  const toggleAgent = useCallback((agentId: string, enabled: boolean) => {
    if (!settings) return;

    const updatedAgents = {
      ...settings.agents,
      [agentId]: {
        ...settings.agents[agentId],
        enabled,
      },
    };

    updateSettings({ agents: updatedAgents });
  }, [settings, updateSettings]);

  const updateAgentSettings = useCallback((agentId: string, agentSettings: Partial<any>) => {
    if (!settings) return;

    const updatedAgents = {
      ...settings.agents,
      [agentId]: {
        ...settings.agents[agentId],
        ...agentSettings,
      },
    };

    updateSettings({ agents: updatedAgents });
  }, [settings, updateSettings]);

  return {
    settings,
    loading,
    updateSettings,
    toggleAgent,
    updateAgentSettings,
  };
}

/**
 * Hook for agent-specific functionality
 */
export function useAgentMessages(agentId?: string) {
  const { messages } = useNotifications();

  const agentMessages = agentId 
    ? messages.filter(msg => msg.agentId === agentId)
    : messages;

  const getMessagesByAgent = useCallback(() => {
    const grouped = messages.reduce((acc, msg) => {
      if (!acc[msg.agentId]) {
        acc[msg.agentId] = [];
      }
      acc[msg.agentId].push(msg);
      return acc;
    }, {} as Record<string, AgentMessage[]>);

    return grouped;
  }, [messages]);

  return {
    agentMessages,
    getMessagesByAgent,
  };
}

/**
 * Hook for notification actions
 */
export function useNotificationActions() {
  const handleAction = useCallback(async (action: string, data?: Record<string, any>) => {
    switch (action) {
      case 'save_track':
        if (data?.trackId) {
          // Implementation would call track save API
          console.log('Saving track:', data.trackId);
        }
        break;
        
      case 'add_to_playlist':
        if (data?.trackId) {
          // Implementation would open playlist selector
          console.log('Adding to playlist:', data.trackId);
        }
        break;
        
      case 'view_battle':
        if (data?.battleId) {
          window.location.href = `/battles/${data.battleId}`;
        }
        break;
        
      case 'view_transaction':
        if (data?.transactionId) {
          window.location.href = `/wallet/transactions/${data.transactionId}`;
        }
        break;
        
      case 'expand_batch':
        if (data?.batchId) {
          // Implementation would expand batch to show individual messages
          console.log('Expanding batch:', data.batchId);
        }
        break;
        
      case 'dismiss':
        // Message will be dismissed by the calling component
        break;
        
      default:
        console.warn('Unknown notification action:', action);
    }
  }, []);

  return { handleAction };
}
