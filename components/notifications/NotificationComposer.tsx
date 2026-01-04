"use client";

import { useState } from 'react';
import { Send, Users, Bell, Calendar, Settings } from 'lucide-react';

interface NotificationComposerProps {
  onSend?: (notification: any) => void;
  onCancel?: () => void;
}

export default function NotificationComposer({ onSend, onCancel }: NotificationComposerProps) {
  const [notification, setNotification] = useState({
    title: '',
    message: '',
    type: 'info',
    recipients: 'all',
    scheduledFor: '',
    priority: 'normal',
    channels: {
      push: true,
      email: false,
      inApp: true
    }
  });

  const notificationTypes = [
    { id: 'info', name: 'Information', color: 'blue' },
    { id: 'success', name: 'Success', color: 'green' },
    { id: 'warning', name: 'Warning', color: 'yellow' },
    { id: 'error', name: 'Error', color: 'red' }
  ];

  const recipientOptions = [
    { id: 'all', name: 'All Users' },
    { id: 'active', name: 'Active Users' },
    { id: 'premium', name: 'Premium Users' },
    { id: 'creators', name: 'Content Creators' },
    { id: 'custom', name: 'Custom Group' }
  ];

  const handleSend = () => {
    if (notification.title && notification.message) {
      const newNotification = {
        ...notification,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        status: notification.scheduledFor ? 'scheduled' : 'sent'
      };
      
      if (onSend) {
        onSend(newNotification);
      }
    }
  };

  const updateChannel = (channel: string, enabled: boolean) => {
    setNotification(prev => ({
      ...prev,
      channels: {
        ...prev.channels,
        [channel]: enabled
      }
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Bell size={20} className="text-blue-400" />
          Compose Notification
        </h3>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-white/60 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={!notification.title || !notification.message}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Send size={16} />
            {notification.scheduledFor ? 'Schedule' : 'Send Now'}
          </button>
        </div>
      </div>

      <div className="bg-white/5 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-white/80 mb-2">Title</label>
              <input
                type="text"
                value={notification.title}
                onChange={(e) => setNotification(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Notification title"
                className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white placeholder-white/40"
              />
            </div>

            <div>
              <label className="block text-sm text-white/80 mb-2">Message</label>
              <textarea
                value={notification.message}
                onChange={(e) => setNotification(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Notification message"
                rows={4}
                className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white placeholder-white/40"
              />
            </div>

            <div>
              <label className="block text-sm text-white/80 mb-2">Type</label>
              <div className="grid grid-cols-2 gap-2">
                {notificationTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setNotification(prev => ({ ...prev, type: type.id }))}
                    className={`p-2 rounded-lg text-sm transition-colors ${
                      notification.type === type.id
                        ? `bg-${type.color}-600 text-white`
                        : 'bg-white/10 text-white/60 hover:bg-white/20'
                    }`}
                  >
                    {type.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Targeting & Scheduling */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-white/80 mb-2">Recipients</label>
              <select
                value={notification.recipients}
                onChange={(e) => setNotification(prev => ({ ...prev, recipients: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white"
              >
                {recipientOptions.map((option) => (
                  <option key={option.id} value={option.id} className="bg-gray-800">
                    {option.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-white/80 mb-2">Priority</label>
              <select
                value={notification.priority}
                onChange={(e) => setNotification(prev => ({ ...prev, priority: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-white/80 mb-2">Schedule For (Optional)</label>
              <input
                type="datetime-local"
                value={notification.scheduledFor}
                onChange={(e) => setNotification(prev => ({ ...prev, scheduledFor: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-sm text-white/80 mb-3">Delivery Channels</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={notification.channels.push}
                    onChange={(e) => updateChannel('push', e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-white/80">Push Notification</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={notification.channels.email}
                    onChange={(e) => updateChannel('email', e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-white/80">Email</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={notification.channels.inApp}
                    onChange={(e) => updateChannel('inApp', e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-white/80">In-App Notification</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="mt-6 pt-6 border-t border-white/10">
          <h4 className="text-white font-medium mb-3">Preview</h4>
          <div className={`bg-white/5 rounded-lg p-4 border-l-4 ${
            notification.type === 'info' ? 'border-blue-500' :
            notification.type === 'success' ? 'border-green-500' :
            notification.type === 'warning' ? 'border-yellow-500' :
            'border-red-500'
          }`}>
            <div className="flex items-start gap-3">
              <Bell size={20} className={
                notification.type === 'info' ? 'text-blue-400' :
                notification.type === 'success' ? 'text-green-400' :
                notification.type === 'warning' ? 'text-yellow-400' :
                'text-red-400'
              } />
              <div>
                <h5 className="text-white font-medium">
                  {notification.title || 'Notification Title'}
                </h5>
                <p className="text-white/80 text-sm mt-1">
                  {notification.message || 'Notification message will appear here...'}
                </p>
                <div className="flex items-center gap-4 text-xs text-white/60 mt-2">
                  <span>To: {recipientOptions.find(r => r.id === notification.recipients)?.name}</span>
                  <span>Priority: {notification.priority}</span>
                  {notification.scheduledFor && (
                    <span>Scheduled: {new Date(notification.scheduledFor).toLocaleString()}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
