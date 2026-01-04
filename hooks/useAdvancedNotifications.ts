"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { NotificationManager } from '@/lib/notifications/notificationManager';
import { 
  Notification, 
  NotificationPreferences, 
  NotificationType,
  NotificationDigest 
} from '@/lib/notifications/types';
import { useAuth } from './useAuth';

/**
 * Hook for advanced notification functionality
 */
export function useAdvancedNotifications() {
  const { user } = useAuth();
  const notificationManager = useRef<NotificationManager | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = useCallback(() => {
    if (!notificationManager.current || !user?.id) return;

    const userNotifications = notificationManager.current.getNotifications(user.id, {
      limit: 50,
    });
    
    setNotifications(userNotifications);
    setUnreadCount(notificationManager.current.getUnreadCount(user.id));
  }, [user?.id]);

  // Initialize notification manager
  useEffect(() => {
    if (!notificationManager.current) {
      notificationManager.current = new NotificationManager(user?.id);
      setIsInitialized(true);
    }
    loadNotifications();
  }, [loadNotifications, user?.id]);

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!notificationManager.current || !user?.id) return;

    const unsubscribe = notificationManager.current.subscribe(user.id, (notification) => {
      setNotifications(prev => [notification, ...prev]);
      if (!notification.is_read) {
        setUnreadCount(prev => prev + 1);
      }
    });

    return unsubscribe;
  }, [user?.id, isInitialized]);

  const sendNotification = useCallback(async (notificationData: {
    type: NotificationType;
    category: Notification['category'];
    priority?: Notification['priority'];
    title: string;
    message: string;
    userId: string;
    actionUrl?: string;
    customData?: Record<string, any>;
  }) => {
    if (!notificationManager.current) return null;

    try {
      const notificationId = await notificationManager.current.send({
        type: notificationData.type,
        category: notificationData.category,
        priority: notificationData.priority || 'normal',
        title: notificationData.title,
        message: notificationData.message,
        user_id: notificationData.userId,
        channels: [
          {
            type: 'in_app',
            enabled: true,
            config: { display_duration: 5000, position: 'top', style: 'toast' },
            delivery_status: 'pending',
          },
          {
            type: 'push',
            enabled: true,
            config: { sound: 'default', badge_count: 1 },
            delivery_status: 'pending',
          },
        ],
        actions: notificationData.actionUrl ? [{
          id: 'view',
          label: 'View',
          type: 'link',
          action: notificationData.actionUrl,
          style: 'primary',
        }] : [],
        source: 'app',
        tags: [],
        custom_data: notificationData.customData || {},
      });

      loadNotifications();
      return notificationId;
    } catch (error) {
      console.error('Failed to send notification:', error);
      throw error;
    }
  }, [loadNotifications]);

  const markAsRead = useCallback((notificationId: string) => {
    if (!notificationManager.current) return;

    notificationManager.current.markAsRead(notificationId);
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, is_read: true, read_at: Date.now() } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    if (!notificationManager.current || !user?.id) return;

    const unreadNotifications = notifications.filter(n => !n.is_read);
    unreadNotifications.forEach(n => {
      notificationManager.current!.markAsRead(n.id);
    });

    setNotifications(prev => 
      prev.map(n => ({ ...n, is_read: true, read_at: Date.now() }))
    );
    setUnreadCount(0);
  }, [notifications, user?.id]);

  const dismiss = useCallback((notificationId: string) => {
    if (!notificationManager.current) return;

    notificationManager.current.dismiss(notificationId);
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, is_dismissed: true, dismissed_at: Date.now() } : n)
    );
  }, []);

  const archive = useCallback((notificationId: string) => {
    if (!notificationManager.current) return;

    notificationManager.current.archive(notificationId);
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  const getNotificationsByCategory = useCallback((category: Notification['category']) => {
    return notifications.filter(n => n.category === category);
  }, [notifications]);

  const getNotificationsByType = useCallback((type: NotificationType) => {
    return notifications.filter(n => n.type === type);
  }, [notifications]);

  return {
    isInitialized,
    notifications,
    unreadCount,
    sendNotification,
    markAsRead,
    markAllAsRead,
    dismiss,
    archive,
    getNotificationsByCategory,
    getNotificationsByType,
    refreshNotifications: loadNotifications,
  };
}

/**
 * Hook for notification preferences
 */
export function useNotificationPreferences() {
  const { user } = useAuth();
  const notificationManager = useRef<NotificationManager | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  const loadPreferences = useCallback(() => {
    if (!notificationManager.current || !user?.id) return;

    setLoading(true);
    try {
      const userPreferences = notificationManager.current.getPreferences(user.id);
      setPreferences(userPreferences);
    } catch (error) {
      console.error('Failed to load preferences:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!notificationManager.current) {
      notificationManager.current = new NotificationManager(user?.id);
    }

    if (user?.id) {
      loadPreferences();
    }
  }, [loadPreferences, user?.id]);

  const updatePreferences = useCallback(async (updates: Partial<NotificationPreferences>) => {
    if (!notificationManager.current || !user?.id) return;

    try {
      notificationManager.current.updatePreferences(user.id, updates);
      loadPreferences();
    } catch (error) {
      console.error('Failed to update preferences:', error);
      throw error;
    }
  }, [user?.id, loadPreferences]);

  const toggleChannel = useCallback(async (channel: keyof NotificationPreferences['channels']) => {
    if (!preferences) return;

    const currentEnabled = preferences.channels[channel]?.enabled || false;
    await updatePreferences({
      channels: {
        ...preferences.channels,
        [channel]: {
          ...preferences.channels[channel],
          enabled: !currentEnabled,
        },
      },
    });
  }, [preferences, updatePreferences]);

  return {
    preferences,
    loading,
    updatePreferences,
    toggleChannel,
    refreshPreferences: loadPreferences,
  };
}
