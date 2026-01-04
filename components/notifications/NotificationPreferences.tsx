"use client";

import { useState } from 'react';
import { Bell, Mail, Smartphone, Volume2, Settings } from 'lucide-react';

interface NotificationPreferencesProps {
  onPreferencesUpdate?: (preferences: any) => void;
}

export default function NotificationPreferences({ onPreferencesUpdate }: NotificationPreferencesProps) {
  const [preferences, setPreferences] = useState({
    email: {
      enabled: true,
      frequency: 'immediate',
      types: {
        battles: true,
        collaborations: true,
        social: false,
        system: true,
        marketing: false
      }
    },
    push: {
      enabled: true,
      types: {
        battles: true,
        collaborations: true,
        social: true,
        system: true,
        marketing: false
      }
    },
    inApp: {
      enabled: true,
      sound: true,
      types: {
        battles: true,
        collaborations: true,
        social: true,
        system: true,
        marketing: false
      }
    },
    quietHours: {
      enabled: true,
      start: '22:00',
      end: '08:00'
    }
  });

  const updatePreference = (category: string, key: string, value: any) => {
    const newPreferences = {
      ...preferences,
      [category]: {
        ...preferences[category as keyof typeof preferences],
        [key]: value
      }
    };
    setPreferences(newPreferences);
    if (onPreferencesUpdate) {
      onPreferencesUpdate(newPreferences);
    }
  };

  const updateTypePreference = (category: string, type: string, value: boolean) => {
    const newPreferences = {
      ...preferences,
      [category]: {
        ...preferences[category as keyof typeof preferences],
        types: {
          ...(preferences[category as keyof typeof preferences] as any).types,
          [type]: value
        }
      }
    };
    setPreferences(newPreferences);
    if (onPreferencesUpdate) {
      onPreferencesUpdate(newPreferences);
    }
  };

  const notificationTypes = [
    { id: 'battles', name: 'Battle Updates', description: 'New battles, submissions, results' },
    { id: 'collaborations', name: 'Collaborations', description: 'Project invites, updates, comments' },
    { id: 'social', name: 'Social Activity', description: 'Likes, follows, mentions, shares' },
    { id: 'system', name: 'System Notifications', description: 'Account, security, important updates' },
    { id: 'marketing', name: 'Marketing', description: 'Promotions, features, newsletters' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Settings size={20} className="text-blue-400" />
          Notification Preferences
        </h3>
        <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white text-sm transition-colors">
          Save Changes
        </button>
      </div>

      {/* Email Notifications */}
      <div className="bg-white/5 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-white font-medium flex items-center gap-2">
            <Mail size={18} className="text-green-400" />
            Email Notifications
          </h4>
          <button
            onClick={() => updatePreference('email', 'enabled', !preferences.email.enabled)}
            className={`w-12 h-6 rounded-full relative transition-colors ${
              preferences.email.enabled ? 'bg-green-600' : 'bg-white/20'
            }`}
          >
            <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
              preferences.email.enabled ? 'translate-x-6' : 'translate-x-0.5'
            }`} />
          </button>
        </div>

        {preferences.email.enabled && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-white/80 mb-2">Email Frequency</label>
              <select
                value={preferences.email.frequency}
                onChange={(e) => updatePreference('email', 'frequency', e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white"
              >
                <option value="immediate">Immediate</option>
                <option value="hourly">Hourly Digest</option>
                <option value="daily">Daily Digest</option>
                <option value="weekly">Weekly Summary</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-white/80 mb-3">Email Types</label>
              <div className="space-y-2">
                {notificationTypes.map((type) => (
                  <label key={type.id} className="flex items-center justify-between">
                    <div>
                      <div className="text-white font-medium">{type.name}</div>
                      <div className="text-white/60 text-sm">{type.description}</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.email.types[type.id as keyof typeof preferences.email.types]}
                      onChange={(e) => updateTypePreference('email', type.id, e.target.checked)}
                      className="rounded"
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Push Notifications */}
      <div className="bg-white/5 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-white font-medium flex items-center gap-2">
            <Smartphone size={18} className="text-blue-400" />
            Push Notifications
          </h4>
          <button
            onClick={() => updatePreference('push', 'enabled', !preferences.push.enabled)}
            className={`w-12 h-6 rounded-full relative transition-colors ${
              preferences.push.enabled ? 'bg-blue-600' : 'bg-white/20'
            }`}
          >
            <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
              preferences.push.enabled ? 'translate-x-6' : 'translate-x-0.5'
            }`} />
          </button>
        </div>

        {preferences.push.enabled && (
          <div>
            <label className="block text-sm text-white/80 mb-3">Push Notification Types</label>
            <div className="space-y-2">
              {notificationTypes.map((type) => (
                <label key={type.id} className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium">{type.name}</div>
                    <div className="text-white/60 text-sm">{type.description}</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.push.types[type.id as keyof typeof preferences.push.types]}
                    onChange={(e) => updateTypePreference('push', type.id, e.target.checked)}
                    className="rounded"
                  />
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* In-App Notifications */}
      <div className="bg-white/5 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-white font-medium flex items-center gap-2">
            <Bell size={18} className="text-purple-400" />
            In-App Notifications
          </h4>
          <button
            onClick={() => updatePreference('inApp', 'enabled', !preferences.inApp.enabled)}
            className={`w-12 h-6 rounded-full relative transition-colors ${
              preferences.inApp.enabled ? 'bg-purple-600' : 'bg-white/20'
            }`}
          >
            <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
              preferences.inApp.enabled ? 'translate-x-6' : 'translate-x-0.5'
            }`} />
          </button>
        </div>

        {preferences.inApp.enabled && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 size={16} className="text-white/60" />
                <span className="text-white/80">Sound Notifications</span>
              </div>
              <button
                onClick={() => updatePreference('inApp', 'sound', !preferences.inApp.sound)}
                className={`w-12 h-6 rounded-full relative transition-colors ${
                  preferences.inApp.sound ? 'bg-green-600' : 'bg-white/20'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                  preferences.inApp.sound ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </div>

            <div>
              <label className="block text-sm text-white/80 mb-3">In-App Notification Types</label>
              <div className="space-y-2">
                {notificationTypes.map((type) => (
                  <label key={type.id} className="flex items-center justify-between">
                    <div>
                      <div className="text-white font-medium">{type.name}</div>
                      <div className="text-white/60 text-sm">{type.description}</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.inApp.types[type.id as keyof typeof preferences.inApp.types]}
                      onChange={(e) => updateTypePreference('inApp', type.id, e.target.checked)}
                      className="rounded"
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quiet Hours */}
      <div className="bg-white/5 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-white font-medium">Quiet Hours</h4>
          <button
            onClick={() => updatePreference('quietHours', 'enabled', !preferences.quietHours.enabled)}
            className={`w-12 h-6 rounded-full relative transition-colors ${
              preferences.quietHours.enabled ? 'bg-yellow-600' : 'bg-white/20'
            }`}
          >
            <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
              preferences.quietHours.enabled ? 'translate-x-6' : 'translate-x-0.5'
            }`} />
          </button>
        </div>

        {preferences.quietHours.enabled && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/80 mb-2">Start Time</label>
              <input
                type="time"
                value={preferences.quietHours.start}
                onChange={(e) => updatePreference('quietHours', 'start', e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-white/80 mb-2">End Time</label>
              <input
                type="time"
                value={preferences.quietHours.end}
                onChange={(e) => updatePreference('quietHours', 'end', e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
