"use client";

import { useState } from 'react';
import { useAstroVibes, useAstroSettings, useZodiacInfo } from '@/hooks/useAstroVibes';
import AstroOnboarding from './AstroOnboarding';
import VibeProfile from './VibeProfile';
import VibeModes from './VibeModes';
import AstroCompatibility from './AstroCompatibility';
import { 
  Sparkles, 
  Moon, 
  Sun, 
  Star, 
  Settings, 
  Music,
  Heart,
  Zap,
  Eye,
  EyeOff,
  Calendar,
  Users
} from 'lucide-react';

export default function AstroVibesInterface() {
  const [selectedView, setSelectedView] = useState<'profile' | 'vibes' | 'modes' | 'compatibility' | 'settings'>('profile');
  const [showOnboarding, setShowOnboarding] = useState(false);

  const { 
    isInitialized, 
    profile, 
    currentVibe, 
    vibeModes,
    getMusicRecommendations 
  } = useAstroVibes();

  const { settings } = useAstroSettings();
  const { getSignInfo } = useZodiacInfo();

  const musicRecommendations = getMusicRecommendations();

  const getViewIcon = (view: string) => {
    switch (view) {
      case 'profile': return <Star size={16} />;
      case 'vibes': return <Zap size={16} />;
      case 'modes': return <Music size={16} />;
      case 'compatibility': return <Heart size={16} />;
      case 'settings': return <Settings size={16} />;
      default: return <Star size={16} />;
    }
  };

  const getZodiacEmoji = (sign: string) => {
    const emojiMap: Record<string, string> = {
      aries: '♈', taurus: '♉', gemini: '♊', cancer: '♋',
      leo: '♌', virgo: '♍', libra: '♎', scorpio: '♏',
      sagittarius: '♐', capricorn: '♑', aquarius: '♒', pisces: '♓'
    };
    return emojiMap[sign] || '⭐';
  };

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Sparkles size={48} className="mx-auto mb-4 text-purple-400 animate-pulse" />
          <p className="text-white/60">Loading AstroVibes...</p>
        </div>
      </div>
    );
  }

  if (!profile && !showOnboarding) {
    return (
      <div className="text-center py-12">
        <div className="mb-6">
          <Sparkles size={64} className="mx-auto mb-4 text-purple-400" />
          <h2 className="text-2xl font-bold text-white mb-2">Welcome to AstroVibes</h2>
          <p className="text-white/60 mb-6">
            Discover how the cosmos influences your music taste and create personalized vibe modes
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-6">
            <Star size={32} className="mx-auto mb-3 text-purple-400" />
            <h3 className="font-semibold text-white mb-2">Astrological Profile</h3>
            <p className="text-sm text-white/60">
              Create your birth chart and discover your cosmic musical DNA
            </p>
          </div>
          
          <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-6">
            <Zap size={32} className="mx-auto mb-3 text-blue-400" />
            <h3 className="font-semibold text-white mb-2">Daily Vibes</h3>
            <p className="text-sm text-white/60">
              Get personalized music recommendations based on current planetary transits
            </p>
          </div>
          
          <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-6">
            <Music size={32} className="mx-auto mb-3 text-green-400" />
            <h3 className="font-semibold text-white mb-2">Vibe Modes</h3>
            <p className="text-sm text-white/60">
              Auto-activate music modes based on astrological events and moon phases
            </p>
          </div>
        </div>
        
        <button
          onClick={() => setShowOnboarding(true)}
          className="bg-purple-600 hover:bg-purple-700 px-8 py-3 rounded-lg font-semibold transition-colors"
        >
          Create Your Astrological Profile
        </button>
      </div>
    );
  }

  if (showOnboarding) {
    return (
      <AstroOnboarding 
        onComplete={() => {
          setShowOnboarding(false);
          setSelectedView('profile');
        }}
        onCancel={() => setShowOnboarding(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles size={32} className="text-purple-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">AstroVibes</h1>
            <p className="text-white/60">
              Your cosmic music companion
            </p>
          </div>
        </div>
        
        <div className="flex gap-3">
          {profile && (
            <div className="flex items-center gap-2 bg-purple-600/20 border border-purple-600/30 px-4 py-2 rounded-lg">
              <span className="text-2xl">{getZodiacEmoji(profile.sun_sign)}</span>
              <div className="text-sm">
                <div className="text-white font-medium">{profile.sun_sign.charAt(0).toUpperCase() + profile.sun_sign.slice(1)}</div>
                <div className="text-white/60">Sun Sign</div>
              </div>
            </div>
          )}
          
          <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg transition-colors">
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* Current Vibe Overview */}
      {currentVibe && (
        <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Today's Cosmic Vibe</h2>
            <div className="flex items-center gap-2">
              <Moon size={16} className="text-blue-400" />
              <span className="text-sm text-white/80">Updated daily</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{currentVibe.energy_level}%</div>
              <div className="text-sm text-white/60">Energy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{currentVibe.creativity_boost}%</div>
              <div className="text-sm text-white/60">Creativity</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{currentVibe.social_inclination}%</div>
              <div className="text-sm text-white/60">Social</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-400">{currentVibe.emotional_intensity}%</div>
              <div className="text-sm text-white/60">Emotion</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mb-3">
            <span className="text-white/80">Primary Theme:</span>
            <span className="bg-purple-600/30 px-3 py-1 rounded-full text-sm font-medium text-purple-300">
              {currentVibe.primary_theme.charAt(0).toUpperCase() + currentVibe.primary_theme.slice(1)}
            </span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {currentVibe.mood_tags.slice(0, 5).map((tag, index) => (
              <span
                key={index}
                className="bg-white/10 px-2 py-1 rounded-full text-xs text-white/70"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Music Recommendations */}
      {musicRecommendations.length > 0 && (
        <div className="bg-white/5 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Cosmic Music Recommendations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {musicRecommendations.slice(0, 4).map((rec, index) => (
              <div key={index} className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-white">{rec.value}</span>
                  <span className="text-sm text-green-400">{rec.confidence}%</span>
                </div>
                <p className="text-sm text-white/60 mb-2">{rec.reason}</p>
                <div className="flex flex-wrap gap-1">
                  {rec.astrological_basis.map((basis, i) => (
                    <span key={i} className="bg-purple-600/20 px-2 py-0.5 rounded text-xs text-purple-300">
                      {basis}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {[
          { id: 'profile', name: 'Profile', count: profile ? 1 : 0 },
          { id: 'vibes', name: 'Daily Vibes', count: currentVibe ? 1 : 0 },
          { id: 'modes', name: 'Vibe Modes', count: vibeModes.length },
          { id: 'compatibility', name: 'Compatibility', count: 0 },
          { id: 'settings', name: 'Settings', count: 0 },
        ].map((view) => (
          <button
            key={view.id}
            onClick={() => setSelectedView(view.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              selectedView === view.id
                ? 'bg-purple-600 text-white'
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
        {selectedView === 'profile' && profile && (
          <VibeProfile profile={profile} />
        )}

        {selectedView === 'vibes' && currentVibe && (
          <div className="bg-white/5 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Today's Astrological Influences</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-white mb-3">Energy Levels</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-white/80">Energy</span>
                      <span className="text-purple-400">{currentVibe.energy_level}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div 
                        className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${currentVibe.energy_level}%` }}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-white/80">Creativity</span>
                      <span className="text-blue-400">{currentVibe.creativity_boost}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${currentVibe.creativity_boost}%` }}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-white/80">Social Inclination</span>
                      <span className="text-green-400">{currentVibe.social_inclination}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${currentVibe.social_inclination}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-white mb-3">Musical Preferences</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-white/80">Tempo Preference:</span>
                    <span className="text-white font-medium">{currentVibe.tempo_preference}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/80">Primary Theme:</span>
                    <span className="text-purple-400 font-medium">{currentVibe.primary_theme}</span>
                  </div>
                </div>
                
                <div className="mt-4">
                  <h5 className="text-sm font-medium text-white/80 mb-2">Mood Tags</h5>
                  <div className="flex flex-wrap gap-2">
                    {currentVibe.mood_tags.map((tag, index) => (
                      <span
                        key={index}
                        className="bg-white/10 px-2 py-1 rounded-full text-xs text-white/70"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedView === 'modes' && (
          <VibeModes />
        )}

        {selectedView === 'compatibility' && (
          <AstroCompatibility />
        )}

        {selectedView === 'settings' && settings && (
          <div className="bg-white/5 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-4">AstroVibes Settings</h3>
            
            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-white mb-3">Privacy Settings</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white/80">Profile Visibility</span>
                    <select 
                      value={settings.profile_visibility}
                      className="bg-white/10 border border-white/20 rounded px-3 py-1 text-white"
                    >
                      <option value="private">Private</option>
                      <option value="friends">Friends Only</option>
                      <option value="public">Public</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-white/80">Show Compatibility</span>
                    <button className={`w-12 h-6 rounded-full transition-colors ${
                      settings.show_compatibility ? 'bg-purple-600' : 'bg-white/20'
                    }`}>
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        settings.show_compatibility ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-white mb-3">Notifications</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white/80">Daily Insights</span>
                    <button className={`w-12 h-6 rounded-full transition-colors ${
                      settings.daily_insights ? 'bg-purple-600' : 'bg-white/20'
                    }`}>
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        settings.daily_insights ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-white/80">Transit Alerts</span>
                    <button className={`w-12 h-6 rounded-full transition-colors ${
                      settings.transit_alerts ? 'bg-purple-600' : 'bg-white/20'
                    }`}>
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        settings.transit_alerts ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-white mb-3">Music Integration</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white/80">Integration Level</span>
                    <select 
                      value={settings.music_integration_level}
                      className="bg-white/10 border border-white/20 rounded px-3 py-1 text-white"
                    >
                      <option value="subtle">Subtle</option>
                      <option value="moderate">Moderate</option>
                      <option value="immersive">Immersive</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-white/80">Auto Vibe Modes</span>
                    <button className={`w-12 h-6 rounded-full transition-colors ${
                      settings.auto_vibe_modes ? 'bg-purple-600' : 'bg-white/20'
                    }`}>
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        settings.auto_vibe_modes ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Real-time Cosmic Indicator */}
      <div className="fixed bottom-6 right-6">
        <div className="bg-purple-600/20 border border-purple-600/30 rounded-lg p-3 flex items-center gap-2">
          <Sparkles size={16} className="text-purple-400 animate-pulse" />
          <span className="text-purple-400 text-sm font-medium">Cosmic Sync Active</span>
        </div>
      </div>
    </div>
  );
}
