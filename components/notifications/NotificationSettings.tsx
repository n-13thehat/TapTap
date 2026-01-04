"use client";

import { useNotificationSettings } from '@/hooks/useNotifications';
import { AI_AGENTS } from '@/lib/aiAgents';
import { 
  Bell, 
  BellOff, 
  Clock, 
  Mail, 
  Smartphone,
  Volume2,
  VolumeX,
  Settings,
  Loader2
} from 'lucide-react';

export default function NotificationSettings() {
  const { settings, loading, updateSettings, toggleAgent, updateAgentSettings } = useNotificationSettings();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin" size={24} />
        <span className="ml-2 text-white/60">Loading settings...</span>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-12 text-white/60">
        <Bell size={48} className="mx-auto mb-4 text-white/20" />
        <p>Unable to load notification settings</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Global Settings */}
      <div className="bg-white/5 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <Settings size={20} />
          Global Settings
        </h2>
        
        <div className="space-y-6">
          {/* Master Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-white">Enable Notifications</h3>
              <p className="text-sm text-white/60">Receive messages from your AI agents</p>
            </div>
            <button
              onClick={() => updateSettings({ globalEnabled: !settings.globalEnabled })}
              className={`
                relative w-12 h-6 rounded-full transition-colors duration-200
                ${settings.globalEnabled ? 'bg-teal-600' : 'bg-white/20'}
              `}
            >
              <div className={`
                absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200
                ${settings.globalEnabled ? 'translate-x-7' : 'translate-x-1'}
              `} />
            </button>
          </div>

          {/* Delivery Frequency */}
          <div>
            <h3 className="font-medium text-white mb-3">Delivery Frequency</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'immediate', label: 'Immediate', desc: 'Get messages right away' },
                { value: 'batched', label: 'Batched', desc: 'Group messages every 5 minutes' },
                { value: 'digest', label: 'Daily Digest', desc: 'One summary per day' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => updateSettings({ frequency: option.value as any })}
                  className={`
                    p-3 rounded-lg border text-left transition-colors
                    ${settings.frequency === option.value
                      ? 'border-teal-300 bg-teal-600/20 text-teal-300'
                      : 'border-white/20 bg-white/5 text-white/80 hover:bg-white/10'
                    }
                  `}
                >
                  <div className="font-medium text-sm">{option.label}</div>
                  <div className="text-xs opacity-75">{option.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Channels */}
          <div>
            <h3 className="font-medium text-white mb-3">Notification Channels</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell size={16} className="text-blue-400" />
                  <div>
                    <div className="font-medium text-white">In-App</div>
                    <div className="text-sm text-white/60">Show notifications in TapTap</div>
                  </div>
                </div>
                <button
                  onClick={() => updateSettings({ 
                    channels: { ...settings.channels, inApp: !settings.channels.inApp }
                  })}
                  className={`
                    relative w-10 h-5 rounded-full transition-colors
                    ${settings.channels.inApp ? 'bg-blue-600' : 'bg-white/20'}
                  `}
                >
                  <div className={`
                    absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform
                    ${settings.channels.inApp ? 'translate-x-5' : 'translate-x-0.5'}
                  `} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Smartphone size={16} className="text-green-400" />
                  <div>
                    <div className="font-medium text-white">Push Notifications</div>
                    <div className="text-sm text-white/60">Browser push notifications</div>
                  </div>
                </div>
                <button
                  onClick={() => updateSettings({ 
                    channels: { ...settings.channels, push: !settings.channels.push }
                  })}
                  className={`
                    relative w-10 h-5 rounded-full transition-colors
                    ${settings.channels.push ? 'bg-green-600' : 'bg-white/20'}
                  `}
                >
                  <div className={`
                    absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform
                    ${settings.channels.push ? 'translate-x-5' : 'translate-x-0.5'}
                  `} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail size={16} className="text-purple-400" />
                  <div>
                    <div className="font-medium text-white">Email</div>
                    <div className="text-sm text-white/60">Important updates via email</div>
                  </div>
                </div>
                <button
                  onClick={() => updateSettings({ 
                    channels: { ...settings.channels, email: !settings.channels.email }
                  })}
                  className={`
                    relative w-10 h-5 rounded-full transition-colors
                    ${settings.channels.email ? 'bg-purple-600' : 'bg-white/20'}
                  `}
                >
                  <div className={`
                    absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform
                    ${settings.channels.email ? 'translate-x-5' : 'translate-x-0.5'}
                  `} />
                </button>
              </div>
            </div>
          </div>

          {/* Quiet Hours */}
          <div>
            <h3 className="font-medium text-white mb-3">Quiet Hours</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock size={16} className="text-orange-400" />
                  <div>
                    <div className="font-medium text-white">Enable Quiet Hours</div>
                    <div className="text-sm text-white/60">Pause notifications during specified hours</div>
                  </div>
                </div>
                <button
                  onClick={() => updateSettings({ 
                    quietHours: { ...settings.quietHours, enabled: !settings.quietHours.enabled }
                  })}
                  className={`
                    relative w-10 h-5 rounded-full transition-colors
                    ${settings.quietHours.enabled ? 'bg-orange-600' : 'bg-white/20'}
                  `}
                >
                  <div className={`
                    absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform
                    ${settings.quietHours.enabled ? 'translate-x-5' : 'translate-x-0.5'}
                  `} />
                </button>
              </div>

              {settings.quietHours.enabled && (
                <div className="grid grid-cols-2 gap-4 ml-7">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">Start Time</label>
                    <input
                      type="time"
                      value={settings.quietHours.start}
                      onChange={(e) => updateSettings({
                        quietHours: { ...settings.quietHours, start: e.target.value }
                      })}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">End Time</label>
                    <input
                      type="time"
                      value={settings.quietHours.end}
                      onChange={(e) => updateSettings({
                        quietHours: { ...settings.quietHours, end: e.target.value }
                      })}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AI Agents Settings */}
      <div className="bg-white/5 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-6">AI Agent Settings</h2>
        
        <div className="space-y-4">
          {Object.entries(AI_AGENTS).map(([agentId, agent]) => {
            const agentSettings = settings.agents[agentId];
            
            return (
              <div key={agentId} className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                      style={{ backgroundColor: agent.color + '20', color: agent.color }}
                    >
                      {agent.emoji}
                    </div>
                    <div>
                      <h3 className="font-medium text-white">{agent.name}</h3>
                      <p className="text-sm text-white/60">{agent.specialties.join(', ')}</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => toggleAgent(agentId, !agentSettings.enabled)}
                    className={`
                      relative w-10 h-5 rounded-full transition-colors
                      ${agentSettings.enabled ? 'bg-teal-600' : 'bg-white/20'}
                    `}
                  >
                    <div className={`
                      absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform
                      ${agentSettings.enabled ? 'translate-x-5' : 'translate-x-0.5'}
                    `} />
                  </button>
                </div>
                
                {agentSettings.enabled && (
                  <div className="space-y-3 ml-13">
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">Message Frequency</label>
                      <select
                        value={agentSettings.customization.frequency}
                        onChange={(e) => updateAgentSettings(agentId, {
                          customization: { 
                            ...agentSettings.customization, 
                            frequency: e.target.value 
                          }
                        })}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                      >
                        <option value="all">All Messages</option>
                        <option value="important">Important Only</option>
                        <option value="minimal">Minimal</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">Personality Style</label>
                      <select
                        value={agentSettings.customization.personality}
                        onChange={(e) => updateAgentSettings(agentId, {
                          customization: { 
                            ...agentSettings.customization, 
                            personality: e.target.value 
                          }
                        })}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                      >
                        <option value="default">Default</option>
                        <option value="casual">Casual</option>
                        <option value="professional">Professional</option>
                        <option value="enthusiastic">Enthusiastic</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
