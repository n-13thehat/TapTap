"use client";

import { useState } from 'react';
import { useAdvancedNotifications, useNotificationPreferences } from '@/hooks/useAdvancedNotifications';
import NotificationsList from './NotificationsList';
import NotificationPreferences from './NotificationPreferences';
import NotificationComposer from './NotificationComposer';
import {
  Bell,
  Settings,
  Plus,
  Filter,
  Check,
  Archive,
  Trash2,
  Mail,
  MessageSquare,
  Shield,
  Zap
} from 'lucide-react';

export default function NotificationsInterface() {
  const [selectedView, setSelectedView] = useState<'inbox' | 'preferences' | 'compose'>('inbox');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const { 
    isInitialized, 
    notifications, 
    unreadCount, 
    markAllAsRead,
    getNotificationsByCategory 
  } = useAdvancedNotifications();

  const { preferences } = useNotificationPreferences();

  const categories = [
    { id: 'all', name: 'All', icon: Bell, count: notifications.length },
    { id: 'social', name: 'Social', icon: MessageSquare, count: getNotificationsByCategory('social').length },
    { id: 'music', name: 'Music', icon: Mail, count: getNotificationsByCategory('music').length },
    { id: 'battle', name: 'Battles', icon: Zap, count: getNotificationsByCategory('battle').length },
    { id: 'system', name: 'System', icon: Shield, count: getNotificationsByCategory('system').length },
  ];

  const getViewIcon = (view: string) => {
    switch (view) {
      case 'inbox': return <Bell size={16} />;
      case 'preferences': return <Settings size={16} />;
      case 'compose': return <Plus size={16} />;
      default: return <Bell size={16} />;
    }
  };

  const filteredNotifications = selectedCategory === 'all' 
    ? notifications 
    : getNotificationsByCategory(selectedCategory as any);

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Bell size={48} className="mx-auto mb-4 text-white/20 animate-pulse" />
          <p className="text-white/60">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell size={32} className="text-blue-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">Notifications</h1>
            <p className="text-white/60">
              Manage your notifications and preferences
            </p>
          </div>
        </div>
        
        <div className="flex gap-3">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
            >
              <Check size={16} />
              Mark All Read
            </button>
          )}
          
          <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg transition-colors">
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Bell size={24} className="text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-400">{notifications.length}</div>
          <div className="text-sm text-white/60">Total</div>
        </div>

        <div className="bg-orange-500/20 border border-orange-500/30 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Mail size={24} className="text-orange-400" />
          </div>
          <div className="text-2xl font-bold text-orange-400">{unreadCount}</div>
          <div className="text-sm text-white/60">Unread</div>
        </div>

        <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Shield size={24} className="text-green-400" />
          </div>
          <div className="text-2xl font-bold text-green-400">
            {preferences?.channels.push.enabled ? 'On' : 'Off'}
          </div>
          <div className="text-sm text-white/60">Push Enabled</div>
        </div>

        <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Zap size={24} className="text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-400">
            {preferences?.quiet_hours.enabled ? 'On' : 'Off'}
          </div>
          <div className="text-sm text-white/60">Quiet Hours</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {[
          { id: 'inbox', name: 'Inbox', count: notifications.length },
          { id: 'preferences', name: 'Preferences', count: 0 },
          { id: 'compose', name: 'Compose', count: 0 },
        ].map((view) => (
          <button
            key={view.id}
            onClick={() => setSelectedView(view.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              selectedView === view.id
                ? 'bg-blue-600 text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            {getViewIcon(view.id)}
            <span>{view.name}</span>
            {view.count > 0 && (
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                {view.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="space-y-6">
        {selectedView === 'inbox' && (
          <div className="space-y-4">
            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-purple-600 text-white'
                      : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  <category.icon size={14} />
                  <span>{category.name}</span>
                  {category.count > 0 && (
                    <span className="bg-white/20 px-1.5 py-0.5 rounded-full text-xs">
                      {category.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Notifications List */}
            <NotificationsList 
              notifications={filteredNotifications}
              category={selectedCategory}
            />
          </div>
        )}

        {selectedView === 'preferences' && (
          <NotificationPreferences />
        )}

        {selectedView === 'compose' && (
          <NotificationComposer />
        )}
      </div>

      {/* Real-time Indicator */}
      <div className="fixed bottom-6 right-6">
        <div className="bg-green-600/20 border border-green-600/30 rounded-lg p-3 flex items-center gap-2">
          <Zap size={16} className="text-green-400 animate-pulse" />
          <span className="text-green-400 text-sm font-medium">Real-time Active</span>
        </div>
      </div>
    </div>
  );
}
