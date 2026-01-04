"use client";

import { useState } from 'react';
import { User, TrendingUp, Music, Star, Target, Zap } from 'lucide-react';

interface UserProfileAnalysisProps {
  onProfileUpdate?: (profile: any) => void;
}

export default function UserProfileAnalysis({ onProfileUpdate }: UserProfileAnalysisProps) {
  const [profile, setProfile] = useState({
    musicPersonality: 'Explorer',
    tasteProfile: {
      adventurous: 85,
      mainstream: 45,
      nostalgic: 60,
      social: 70
    },
    preferences: {
      energy: 75,
      valence: 65,
      danceability: 80,
      acousticness: 30
    },
    discoveryStyle: 'Curator-guided',
    socialInfluence: 'Medium'
  });

  const personalityTypes = [
    {
      type: 'Explorer',
      description: 'Always seeking new sounds and artists',
      traits: ['High discovery rate', 'Genre diversity', 'Early adopter'],
      color: 'from-purple-600 to-blue-600'
    },
    {
      type: 'Curator',
      description: 'Carefully curated, high-quality selections',
      traits: ['Quality over quantity', 'Deep listening', 'Playlist maker'],
      color: 'from-green-600 to-teal-600'
    },
    {
      type: 'Social',
      description: 'Music taste influenced by community',
      traits: ['Trending tracks', 'Social sharing', 'Collaborative playlists'],
      color: 'from-pink-600 to-red-600'
    },
    {
      type: 'Nostalgic',
      description: 'Strong connection to familiar favorites',
      traits: ['Repeat listening', 'Classic tracks', 'Emotional connection'],
      color: 'from-orange-600 to-yellow-600'
    }
  ];

  const currentPersonality = personalityTypes.find(p => p.type === profile.musicPersonality);

  return (
    <div className="space-y-6">
      {/* Music Personality */}
      <div className="bg-white/5 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <User size={20} className="text-green-400" />
          Music Personality Profile
        </h3>

        {currentPersonality && (
          <div className={`bg-gradient-to-r ${currentPersonality.color} rounded-lg p-6 mb-6`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Star size={20} className="text-white" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-white">{currentPersonality.type}</h4>
                <p className="text-white/90">{currentPersonality.description}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {currentPersonality.traits.map((trait, index) => (
                <span key={index} className="bg-white/20 text-white px-3 py-1 rounded-full text-sm">
                  {trait}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Personality Type Selector */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {personalityTypes.map((type) => (
            <button
              key={type.type}
              onClick={() => setProfile(prev => ({ ...prev, musicPersonality: type.type }))}
              className={`p-4 rounded-lg text-left transition-all ${
                profile.musicPersonality === type.type
                  ? 'bg-white/20 border-2 border-white/40'
                  : 'bg-white/5 hover:bg-white/10 border-2 border-transparent'
              }`}
            >
              <h4 className="font-medium text-white mb-1">{type.type}</h4>
              <p className="text-sm text-white/80">{type.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Taste Profile */}
      <div className="bg-white/5 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Target size={20} className="text-blue-400" />
          Taste Profile Analysis
        </h3>

        <div className="space-y-4">
          {Object.entries(profile.tasteProfile).map(([trait, value]) => (
            <div key={trait}>
              <div className="flex justify-between mb-2">
                <span className="text-white/80 capitalize">{trait}</span>
                <span className="text-white/60">{value}%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Audio Preferences */}
      <div className="bg-white/5 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Music size={20} className="text-purple-400" />
          Audio Feature Preferences
        </h3>

        <div className="grid grid-cols-2 gap-6">
          {Object.entries(profile.preferences).map(([feature, value]) => (
            <div key={feature} className="text-center">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center mb-3">
                <span className="text-white font-bold text-lg">{value}%</span>
              </div>
              <h4 className="text-white font-medium capitalize">{feature}</h4>
              <p className="text-white/60 text-sm">
                {feature === 'energy' && 'High-energy vs calm tracks'}
                {feature === 'valence' && 'Positive vs melancholic mood'}
                {feature === 'danceability' && 'Danceable vs contemplative'}
                {feature === 'acousticness' && 'Acoustic vs electronic'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Discovery & Social */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/5 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Zap size={20} className="text-yellow-400" />
            Discovery Style
          </h3>
          <div className="space-y-3">
            {['Algorithm-driven', 'Curator-guided', 'Social-influenced', 'Self-directed'].map((style) => (
              <label key={style} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="discoveryStyle"
                  value={style}
                  checked={profile.discoveryStyle === style}
                  onChange={(e) => setProfile(prev => ({ ...prev, discoveryStyle: e.target.value }))}
                  className="text-yellow-500"
                />
                <span className="text-white/80">{style}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="bg-white/5 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-pink-400" />
            Social Influence
          </h3>
          <div className="space-y-3">
            {['Low', 'Medium', 'High'].map((level) => (
              <label key={level} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="socialInfluence"
                  value={level}
                  checked={profile.socialInfluence === level}
                  onChange={(e) => setProfile(prev => ({ ...prev, socialInfluence: e.target.value }))}
                  className="text-pink-500"
                />
                <span className="text-white/80">{level}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Profile Actions */}
      <div className="bg-white/5 rounded-lg p-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-white font-medium">Profile Analysis Complete</h3>
            <p className="text-white/60 text-sm">Your music profile helps AI curate better recommendations</p>
          </div>
          <button
            onClick={() => onProfileUpdate && onProfileUpdate(profile)}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 px-6 py-2 rounded-lg text-white font-medium transition-colors"
          >
            Update Profile
          </button>
        </div>
      </div>
    </div>
  );
}
