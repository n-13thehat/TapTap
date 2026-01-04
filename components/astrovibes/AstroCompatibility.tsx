"use client";

import { useState } from 'react';
import { Heart, Users, Star, Zap, Target, TrendingUp } from 'lucide-react';

interface AstroCompatibilityProps {
  userProfile?: any;
}

export default function AstroCompatibility({ userProfile }: AstroCompatibilityProps) {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [compatibilityType, setCompatibilityType] = useState('musical');

  const compatibilityMatches = [
    {
      id: '1',
      username: 'CosmicBeats',
      avatar: '🌟',
      signs: { sun: 'Sagittarius', moon: 'Aquarius', rising: 'Leo' },
      compatibility: 92,
      musicMatch: 88,
      vibeSync: 95,
      sharedGenres: ['Electronic', 'Ambient', 'Jazz'],
      connectionType: 'Cosmic Twin',
      lastActive: '2 hours ago'
    },
    {
      id: '2',
      username: 'LunarMelodies',
      avatar: '🌙',
      signs: { sun: 'Cancer', moon: 'Pisces', rising: 'Scorpio' },
      compatibility: 87,
      musicMatch: 91,
      vibeSync: 83,
      sharedGenres: ['Indie', 'Folk', 'Classical'],
      connectionType: 'Soul Resonance',
      lastActive: '1 day ago'
    },
    {
      id: '3',
      username: 'FireElement',
      avatar: '🔥',
      signs: { sun: 'Aries', moon: 'Leo', rising: 'Sagittarius' },
      compatibility: 85,
      musicMatch: 79,
      vibeSync: 91,
      sharedGenres: ['Rock', 'Hip Hop', 'Electronic'],
      connectionType: 'Energy Match',
      lastActive: '30 minutes ago'
    },
    {
      id: '4',
      username: 'EarthVibes',
      avatar: '🌍',
      signs: { sun: 'Taurus', moon: 'Virgo', rising: 'Capricorn' },
      compatibility: 78,
      musicMatch: 85,
      vibeSync: 71,
      sharedGenres: ['Blues', 'Country', 'R&B'],
      connectionType: 'Grounded Harmony',
      lastActive: '3 hours ago'
    }
  ];

  const compatibilityTypes = [
    { id: 'musical', name: 'Musical Compatibility', icon: <Heart size={16} /> },
    { id: 'astrological', name: 'Astrological Synastry', icon: <Star size={16} /> },
    { id: 'elemental', name: 'Elemental Balance', icon: <Zap size={16} /> },
    { id: 'energy', name: 'Energy Matching', icon: <TrendingUp size={16} /> }
  ];

  const getCompatibilityColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 80) return 'text-blue-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getCompatibilityBg = (score: number) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 80) return 'bg-blue-500';
    if (score >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const selectedMatch = compatibilityMatches.find(match => match.id === selectedUser);

  return (
    <div className="space-y-6">
      {/* Compatibility Type Selector */}
      <div className="bg-white/5 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Users size={20} className="text-pink-400" />
          Astro Compatibility Matching
        </h3>

        <div className="flex flex-wrap gap-2 mb-6">
          {compatibilityTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setCompatibilityType(type.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                compatibilityType === type.id
                  ? 'bg-pink-600 text-white'
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              {type.icon}
              {type.name}
            </button>
          ))}
        </div>

        {/* Compatibility Matches */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {compatibilityMatches.map((match) => (
            <button
              key={match.id}
              onClick={() => setSelectedUser(match.id)}
              className={`p-4 rounded-lg text-left transition-all ${
                selectedUser === match.id
                  ? 'bg-white/20 border-2 border-pink-500'
                  : 'bg-white/5 hover:bg-white/10 border-2 border-transparent'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{match.avatar}</span>
                  <div>
                    <div className="text-white font-medium">{match.username}</div>
                    <div className="text-white/60 text-sm">{match.connectionType}</div>
                  </div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getCompatibilityColor(match.compatibility)}`}>
                    {match.compatibility}%
                  </div>
                  <div className="text-white/60 text-xs">Match</div>
                </div>
              </div>

              <div className="flex justify-between text-sm mb-3">
                <span className="text-white/80">Music: {match.musicMatch}%</span>
                <span className="text-white/80">Vibe: {match.vibeSync}%</span>
              </div>

              <div className="flex flex-wrap gap-1 mb-2">
                {match.sharedGenres.slice(0, 3).map((genre, index) => (
                  <span key={index} className="bg-pink-600/20 text-pink-400 px-2 py-1 rounded text-xs">
                    {genre}
                  </span>
                ))}
              </div>

              <div className="text-white/60 text-xs">{match.lastActive}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Detailed Compatibility Analysis */}
      {selectedMatch && (
        <div className="bg-white/5 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl">{selectedMatch.avatar}</span>
            <div>
              <h3 className="text-xl font-semibold text-white">{selectedMatch.username}</h3>
              <p className="text-pink-400">{selectedMatch.connectionType}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Compatibility Scores */}
            <div>
              <h4 className="text-white font-medium mb-4">Compatibility Breakdown</h4>
              <div className="space-y-4">
                {[
                  { label: 'Overall Match', score: selectedMatch.compatibility },
                  { label: 'Musical Taste', score: selectedMatch.musicMatch },
                  { label: 'Vibe Sync', score: selectedMatch.vibeSync }
                ].map((item, index) => (
                  <div key={index}>
                    <div className="flex justify-between mb-2">
                      <span className="text-white/80">{item.label}</span>
                      <span className={`font-bold ${getCompatibilityColor(item.score)}`}>
                        {item.score}%
                      </span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${getCompatibilityBg(item.score)}`}
                        style={{ width: `${item.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Astrological Synastry */}
            <div>
              <h4 className="text-white font-medium mb-4">Astrological Synastry</h4>
              <div className="space-y-3">
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-white/80">Sun Signs</span>
                    <span className="text-yellow-400">{selectedMatch.signs.sun}</span>
                  </div>
                  <div className="text-white/60 text-sm">Compatible fire energy</div>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-white/80">Moon Signs</span>
                    <span className="text-blue-400">{selectedMatch.signs.moon}</span>
                  </div>
                  <div className="text-white/60 text-sm">Emotional harmony</div>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-white/80">Rising Signs</span>
                    <span className="text-green-400">{selectedMatch.signs.rising}</span>
                  </div>
                  <div className="text-white/60 text-sm">Natural attraction</div>
                </div>
              </div>
            </div>
          </div>

          {/* Shared Musical Interests */}
          <div className="mt-6">
            <h4 className="text-white font-medium mb-4">Shared Musical Universe</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h5 className="text-white/80 font-medium mb-2">Common Genres</h5>
                <div className="flex flex-wrap gap-2">
                  {selectedMatch.sharedGenres.map((genre, index) => (
                    <span key={index} className="bg-pink-600/20 text-pink-400 px-3 py-1 rounded-full text-sm">
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h5 className="text-white/80 font-medium mb-2">Collaboration Potential</h5>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-white/80 text-sm">Playlist Creation</span>
                    <span className="text-green-400 text-sm">High</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/80 text-sm">Music Discovery</span>
                    <span className="text-blue-400 text-sm">Excellent</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/80 text-sm">Creative Synergy</span>
                    <span className="text-purple-400 text-sm">Strong</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex gap-3">
            <button className="bg-pink-600 hover:bg-pink-700 px-4 py-2 rounded-lg text-white transition-colors">
              Connect
            </button>
            <button className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-white transition-colors">
              Create Playlist Together
            </button>
            <button className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-white transition-colors">
              View Full Chart
            </button>
          </div>
        </div>
      )}

      {/* Compatibility Insights */}
      <div className="bg-gradient-to-r from-pink-600/20 to-purple-600/20 border border-pink-600/30 rounded-lg p-6">
        <h4 className="text-white font-medium mb-4">Compatibility Insights</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <Heart size={16} className="text-pink-400 mt-0.5" />
            <div>
              <div className="text-white font-medium">Musical Soul Mates</div>
              <div className="text-white/80 text-sm">
                Find users whose astrological profiles complement your musical taste
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Star size={16} className="text-yellow-400 mt-0.5" />
            <div>
              <div className="text-white font-medium">Cosmic Collaborations</div>
              <div className="text-white/80 text-sm">
                Discover creative partnerships written in the stars
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
