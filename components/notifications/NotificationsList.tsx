"use client";

import { useState } from 'react';
import { useAdvancedNotifications } from '@/hooks/useAdvancedNotifications';
import { Notification } from '@/lib/notifications/types';
import { 
  Bell, 
  Heart, 
  MessageCircle, 
  Share, 
  UserPlus, 
  Trophy,
  Shield,
  Mail,
  Clock,
  ExternalLink,
  MoreHorizontal,
  Archive,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';

interface NotificationsListProps {
  notifications: Notification[];
  category: string;
}

export default function NotificationsList({ notifications, category }: NotificationsListProps) {
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());
  const { markAsRead, dismiss, archive } = useAdvancedNotifications();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like': return <Heart size={16} className="text-red-400" />;
      case 'comment': return <MessageCircle size={16} className="text-blue-400" />;
      case 'share': return <Share size={16} className="text-green-400" />;
      case 'follow': return <UserPlus size={16} className="text-purple-400" />;
      case 'battle_result': return <Trophy size={16} className="text-yellow-400" />;
      case 'achievement_unlocked': return <Trophy size={16} className="text-orange-400" />;
      case 'security_alert': return <Shield size={16} className="text-red-400" />;
      case 'newsletter': return <Mail size={16} className="text-blue-400" />;
      default: return <Bell size={16} className="text-white/60" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'border-l-red-500';
      case 'high': return 'border-l-orange-500';
      case 'normal': return 'border-l-blue-500';
      case 'low': return 'border-l-gray-500';
      default: return 'border-l-blue-500';
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    // Handle action URL
    if (notification.action_url) {
      window.open(notification.action_url, '_blank');
    }
  };

  const handleSelectNotification = (notificationId: string) => {
    const newSelected = new Set(selectedNotifications);
    if (newSelected.has(notificationId)) {
      newSelected.delete(notificationId);
    } else {
      newSelected.add(notificationId);
    }
    setSelectedNotifications(newSelected);
  };

  const handleBulkAction = (action: 'read' | 'archive' | 'dismiss') => {
    selectedNotifications.forEach(id => {
      switch (action) {
        case 'read':
          markAsRead(id);
          break;
        case 'archive':
          archive(id);
          break;
        case 'dismiss':
          dismiss(id);
          break;
      }
    });
    setSelectedNotifications(new Set());
  };

  if (notifications.length === 0) {
    return (
      <div className="text-center py-12">
        <Bell size={64} className="mx-auto mb-4 text-white/20" />
        <h3 className="text-lg font-semibold text-white mb-2">No notifications</h3>
        <p className="text-white/60">
          {category === 'all' 
            ? "You're all caught up! No new notifications."
            : `No ${category} notifications at the moment.`
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bulk Actions */}
      {selectedNotifications.size > 0 && (
        <div className="bg-white/5 rounded-lg p-4 flex items-center justify-between">
          <span className="text-white/80">
            {selectedNotifications.size} notification{selectedNotifications.size > 1 ? 's' : ''} selected
          </span>
          
          <div className="flex gap-2">
            <button
              onClick={() => handleBulkAction('read')}
              className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm transition-colors"
            >
              <Eye size={14} />
              Mark Read
            </button>
            <button
              onClick={() => handleBulkAction('archive')}
              className="flex items-center gap-1 bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm transition-colors"
            >
              <Archive size={14} />
              Archive
            </button>
            <button
              onClick={() => handleBulkAction('dismiss')}
              className="flex items-center gap-1 bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm transition-colors"
            >
              <Trash2 size={14} />
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Notifications */}
      <div className="space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`bg-white/5 border-l-4 ${getPriorityColor(notification.priority)} rounded-lg p-4 hover:bg-white/10 transition-colors cursor-pointer ${
              !notification.is_read ? 'bg-blue-500/10' : ''
            }`}
            onClick={() => handleNotificationClick(notification)}
          >
            <div className="flex items-start gap-3">
              {/* Selection Checkbox */}
              <input
                type="checkbox"
                checked={selectedNotifications.has(notification.id)}
                onChange={(e) => {
                  e.stopPropagation();
                  handleSelectNotification(notification.id);
                }}
                className="mt-1 rounded border-white/20 bg-white/10 text-blue-600 focus:ring-blue-500"
              />

              {/* Icon */}
              <div className="flex-shrink-0 mt-1">
                {getNotificationIcon(notification.type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className={`font-medium ${notification.is_read ? 'text-white/80' : 'text-white'}`}>
                      {notification.title}
                    </h4>
                    <p className={`text-sm mt-1 ${notification.is_read ? 'text-white/60' : 'text-white/80'}`}>
                      {notification.message}
                    </p>
                    
                    {/* Summary */}
                    {notification.summary && (
                      <p className="text-xs text-white/50 mt-1">
                        {notification.summary}
                      </p>
                    )}

                    {/* Tags */}
                    {notification.tags.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {notification.tags.slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-0.5 bg-white/10 rounded-full text-xs text-white/60"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Timestamp and Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    <div className="flex items-center gap-1 text-xs text-white/50">
                      <Clock size={12} />
                      {formatTimeAgo(notification.created_at)}
                    </div>

                    {/* Priority Indicator */}
                    {notification.priority === 'urgent' && (
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    )}

                    {/* Unread Indicator */}
                    {!notification.is_read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}

                    {/* Actions Menu */}
                    <div className="relative">
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 hover:bg-white/10 rounded transition-colors"
                      >
                        <MoreHorizontal size={14} className="text-white/60" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {notification.actions.length > 0 && (
                  <div className="flex gap-2 mt-3">
                    {notification.actions.slice(0, 2).map((action) => (
                      <button
                        key={action.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (action.type === 'link') {
                            window.open(action.action, '_blank');
                          }
                        }}
                        className={`flex items-center gap-1 px-3 py-1 rounded text-xs transition-colors ${
                          action.style === 'primary'
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : action.style === 'destructive'
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'bg-white/10 hover:bg-white/20 text-white/80'
                        }`}
                      >
                        {action.type === 'link' && <ExternalLink size={10} />}
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Delivery Status */}
                {notification.delivery_status.overall_status !== 'delivered' && (
                  <div className="mt-2 text-xs">
                    <span className={`px-2 py-0.5 rounded-full ${
                      notification.delivery_status.overall_status === 'pending'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : notification.delivery_status.overall_status === 'failed'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-orange-500/20 text-orange-400'
                    }`}>
                      {notification.delivery_status.overall_status}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load More */}
      {notifications.length >= 50 && (
        <div className="text-center pt-4">
          <button className="bg-white/10 hover:bg-white/20 px-6 py-2 rounded-lg transition-colors">
            Load More
          </button>
        </div>
      )}
    </div>
  );
}
