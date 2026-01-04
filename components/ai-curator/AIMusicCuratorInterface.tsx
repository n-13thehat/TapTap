"use client";

import { useState } from 'react';
import { useAIMusicCurator, usePlaylistGeneration, useMusicInsights } from '@/hooks/useAIMusicCurator';
import PlaylistGenerator from './PlaylistGenerator';
import SmartRadioPlayer from './SmartRadioPlayer';
import MusicInsights from './MusicInsights';
import UserProfileAnalysis from './UserProfileAnalysis';
import { 
  Brain, 
  Music, 
  Radio, 
  BarChart3, 
  User, 
  Sparkles,
  Zap,
  TrendingUp,
  Settings,
  Play,
  Shuffle
} from 'lucide-react';

export default function AIMusicCuratorInterface() {
  const [selectedView, setSelectedView] = useState<'generator' | 'radio' | 'insights' | 'profile' | 'settings'>('generator');

  const { 
    isInitialized, 
    userProfile, 
    playlists, 
    smartRadios,
    analyzeUserBehavior 
  } = useAIMusicCurator();

  const { generateAIPlaylist, isGenerating } = usePlaylistGeneration();
  const { insights, loadInsights } = useMusicInsights();

  const getViewIcon = (view: string) => {
    switch (view) {
      case 'generator': return <Sparkles size={16} />;
      case 'radio': return <Radio size={16} />;
      case 'insights': return <BarChart3 size={16} />;
      case 'profile': return <User size={16} />;
      case 'settings': return <Settings size={16} />;
      default: return <Brain size={16} />;
    }
  };

  const handleQuickGenerate = async (type: 'discovery' | 'mood' | 'workout' | 'focus') => {
    const inputs = {
      discovery: {
        novelty_preference: 0.8,
        diversity_preference: 0.9,
        target_duration: 3600,
      },
      mood: {
        target_mood: 'energetic',
        target_duration: 2400,
      },
      workout: {
        target_context: 'workout',
        target_features: {
          energy: { min: 0.7, max: 1.0, preferred: 0.85, tolerance: 0.1 },
          tempo: { min: 120, max: 180, preferred: 140, tolerance: 20 },
        },
        target_duration: 3000,
      },
      focus: {
        target_context: 'study',
        target_features: {
          energy: { min: 0.3, max: 0.7, preferred: 0.5, tolerance: 0.1 },
          instrumentalness: { min: 0.7, max: 1.0, preferred: 0.9, tolerance: 0.1 },
        },
        target_duration: 7200,
      },
    };

    await generateAIPlaylist(inputs[type]);
  };

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Brain size={48} className="mx-auto mb-4 text-blue-400 animate-pulse" />
          <p className="text-white/60">Loading AI Music Curator...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain size={32} className="text-blue-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">AI Music Curator</h1>
            <p className="text-white/60">
              Intelligent playlists powered by machine learning
            </p>
          </div>
        </div>
        
        <div className="flex gap-3">
          {userProfile && (
            <div className="flex items-center gap-2 bg-blue-600/20 border border-blue-600/30 px-4 py-2 rounded-lg">
              <TrendingUp size={16} className="text-blue-400" />
              <div className="text-sm">
                <div className="text-white font-medium">{userProfile.confidence_score}%</div>
                <div className="text-white/60">Profile Confidence</div>
              </div>
            </div>
          )}
          
          <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg transition-colors">
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white/5 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Quick Generate</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => handleQuickGenerate('discovery')}
            disabled={isGenerating}
            className="bg-purple-600/20 border border-purple-600/30 rounded-lg p-4 hover:bg-purple-600/30 transition-colors disabled:opacity-50"
          >
            <Sparkles size={24} className="mx-auto mb-2 text-purple-400" />
            <div className="text-sm font-medium text-white">Discovery Mix</div>
            <div className="text-xs text-white/60">New music exploration</div>
          </button>
          
          <button
            onClick={() => handleQuickGenerate('mood')}
            disabled={isGenerating}
            className="bg-green-600/20 border border-green-600/30 rounded-lg p-4 hover:bg-green-600/30 transition-colors disabled:opacity-50"
          >
            <Music size={24} className="mx-auto mb-2 text-green-400" />
            <div className="text-sm font-medium text-white">Mood Booster</div>
            <div className="text-xs text-white/60">Energetic vibes</div>
          </button>
          
          <button
            onClick={() => handleQuickGenerate('workout')}
            disabled={isGenerating}
            className="bg-red-600/20 border border-red-600/30 rounded-lg p-4 hover:bg-red-600/30 transition-colors disabled:opacity-50"
          >
            <Zap size={24} className="mx-auto mb-2 text-red-400" />
            <div className="text-sm font-medium text-white">Workout Power</div>
            <div className="text-xs text-white/60">High-energy tracks</div>
          </button>
          
          <button
            onClick={() => handleQuickGenerate('focus')}
            disabled={isGenerating}
            className="bg-blue-600/20 border border-blue-600/30 rounded-lg p-4 hover:bg-blue-600/30 transition-colors disabled:opacity-50"
          >
            <Brain size={24} className="mx-auto mb-2 text-blue-400" />
            <div className="text-sm font-medium text-white">Focus Flow</div>
            <div className="text-xs text-white/60">Concentration music</div>
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Sparkles size={24} className="text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-400">{playlists.length}</div>
          <div className="text-sm text-white/60">AI Playlists</div>
        </div>

        <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Radio size={24} className="text-green-400" />
          </div>
          <div className="text-2xl font-bold text-green-400">{smartRadios.length}</div>
          <div className="text-sm text-white/60">Smart Radios</div>
        </div>

        <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <TrendingUp size={24} className="text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-400">
            {userProfile ? Math.round(userProfile.discovery_rate * 100) : 0}%
          </div>
          <div className="text-sm text-white/60">Discovery Rate</div>
        </div>

        <div className="bg-orange-500/20 border border-orange-500/30 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <BarChart3 size={24} className="text-orange-400" />
          </div>
          <div className="text-2xl font-bold text-orange-400">
            {userProfile ? userProfile.genre_preferences.length : 0}
          </div>
          <div className="text-sm text-white/60">Genres Analyzed</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {[
          { id: 'generator', name: 'Playlist Generator', count: playlists.length },
          { id: 'radio', name: 'Smart Radio', count: smartRadios.length },
          { id: 'insights', name: 'Music Insights', count: insights ? 1 : 0 },
          { id: 'profile', name: 'Profile Analysis', count: userProfile ? 1 : 0 },
          { id: 'settings', name: 'AI Settings', count: 0 },
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
        {selectedView === 'generator' && (
          <PlaylistGenerator />
        )}

        {selectedView === 'radio' && (
          <SmartRadioPlayer />
        )}

        {selectedView === 'insights' && (
          <MusicInsights />
        )}

        {selectedView === 'profile' && userProfile && (
          <UserProfileAnalysis />
        )}

        {selectedView === 'settings' && (
          <div className="bg-white/5 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-4">AI Curator Settings</h3>
            
            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-white mb-3">Recommendation Preferences</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white/80">Discovery Level</span>
                    <select className="bg-white/10 border border-white/20 rounded px-3 py-1 text-white">
                      <option value="conservative">Conservative</option>
                      <option value="balanced">Balanced</option>
                      <option value="adventurous">Adventurous</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-white/80">Playlist Diversity</span>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      defaultValue="70"
                      className="w-32"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-white/80">Novelty Factor</span>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      defaultValue="50"
                      className="w-32"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-white mb-3">Learning Settings</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white/80">Auto-Learn from Listening</span>
                    <button className="w-12 h-6 bg-blue-600 rounded-full relative">
                      <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5" />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-white/80">Social Influence</span>
                    <button className="w-12 h-6 bg-white/20 rounded-full relative">
                      <div className="w-5 h-5 bg-white rounded-full absolute left-0.5 top-0.5" />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-white/80">Context Awareness</span>
                    <button className="w-12 h-6 bg-blue-600 rounded-full relative">
                      <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5" />
                    </button>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-white mb-3">Model Performance</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-sm text-white/60">Recommendation Accuracy</div>
                    <div className="text-lg font-semibold text-green-400">87%</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-sm text-white/60">User Satisfaction</div>
                    <div className="text-lg font-semibold text-blue-400">4.2/5</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-sm text-white/60">Discovery Success</div>
                    <div className="text-lg font-semibold text-purple-400">73%</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-sm text-white/60">Model Version</div>
                    <div className="text-lg font-semibold text-orange-400">v2.1</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Generation Progress */}
      {isGenerating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 text-center">
            <Brain size={48} className="mx-auto mb-4 text-blue-400 animate-pulse" />
            <h3 className="text-lg font-semibold text-white mb-2">Generating AI Playlist</h3>
            <p className="text-white/60 mb-4">Analyzing your taste and finding perfect tracks...</p>
            <div className="w-64 bg-white/20 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: '60%' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* AI Status Indicator */}
      <div className="fixed bottom-6 right-6">
        <div className="bg-blue-600/20 border border-blue-600/30 rounded-lg p-3 flex items-center gap-2">
          <Brain size={16} className="text-blue-400 animate-pulse" />
          <span className="text-blue-400 text-sm font-medium">AI Learning Active</span>
        </div>
      </div>
    </div>
  );
}
