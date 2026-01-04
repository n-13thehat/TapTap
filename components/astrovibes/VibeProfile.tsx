"use client";

import { useState } from 'react';
import { Star, Moon, Sun, Zap, Heart, Target, TrendingUp } from 'lucide-react';

interface VibeProfileProps {
  profile?: any;
  onUpdate?: (profile: any) => void;
}

export default function VibeProfile({ profile, onUpdate }: VibeProfileProps) {
  const [activeTab, setActiveTab] = useState('chart');

  const mockProfile = {
    sun: { sign: 'Leo', element: 'Fire', quality: 'Fixed' },
    moon: { sign: 'Pisces', element: 'Water', quality: 'Mutable' },
    rising: { sign: 'Gemini', element: 'Air', quality: 'Mutable' },
    venus: { sign: 'Cancer', element: 'Water', quality: 'Cardinal' },
    mars: { sign: 'Aries', element: 'Fire', quality: 'Cardinal' },
    musicPersonality: 'Cosmic Explorer',
    vibeScore: 8.7,
    compatibility: {
      fire: 85,
      earth: 45,
      air: 70,
      water: 90
    },
    currentTransits: [
      { planet: 'Mercury', aspect: 'Trine', influence: 'Communication boost' },
      { planet: 'Venus', aspect: 'Square', influence: 'Creative tension' },
      { planet: 'Mars', aspect: 'Conjunction', influence: 'Energy surge' }
    ]
  };

  const currentProfile = profile || mockProfile;

  const getElementColor = (element: string) => {
    switch (element.toLowerCase()) {
      case 'fire': return 'text-red-400';
      case 'earth': return 'text-green-400';
      case 'air': return 'text-blue-400';
      case 'water': return 'text-cyan-400';
      default: return 'text-white';
    }
  };

  const getElementIcon = (element: string) => {
    switch (element.toLowerCase()) {
      case 'fire': return '🔥';
      case 'earth': return '🌍';
      case 'air': return '💨';
      case 'water': return '🌊';
      default: return '✨';
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-600/30 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-white">{currentProfile.musicPersonality}</h3>
            <p className="text-white/80">Your cosmic musical identity</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-400">{currentProfile.vibeScore}</div>
            <div className="text-sm text-white/60">Vibe Score</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <Sun size={24} className="mx-auto mb-2 text-yellow-400" />
            <div className="text-white font-medium">{currentProfile.sun.sign}</div>
            <div className="text-white/60 text-sm">Sun Sign</div>
          </div>
          <div className="text-center">
            <Moon size={24} className="mx-auto mb-2 text-blue-400" />
            <div className="text-white font-medium">{currentProfile.moon.sign}</div>
            <div className="text-white/60 text-sm">Moon Sign</div>
          </div>
          <div className="text-center">
            <TrendingUp size={24} className="mx-auto mb-2 text-green-400" />
            <div className="text-white font-medium">{currentProfile.rising.sign}</div>
            <div className="text-white/60 text-sm">Rising Sign</div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2">
        {[
          { id: 'chart', name: 'Birth Chart', icon: <Star size={16} /> },
          { id: 'compatibility', name: 'Element Compatibility', icon: <Heart size={16} /> },
          { id: 'transits', name: 'Current Transits', icon: <Zap size={16} /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-purple-600 text-white'
                : 'bg-white/10 text-white/60 hover:bg-white/20'
            }`}
          >
            {tab.icon}
            {tab.name}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'chart' && (
        <div className="bg-white/5 rounded-lg p-6">
          <h4 className="text-white font-medium mb-4">Your Astrological Profile</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Major Placements */}
            <div className="space-y-4">
              {[
                { planet: 'Sun', sign: currentProfile.sun.sign, element: currentProfile.sun.element, description: 'Core identity & ego' },
                { planet: 'Moon', sign: currentProfile.moon.sign, element: currentProfile.moon.element, description: 'Emotions & instincts' },
                { planet: 'Rising', sign: currentProfile.rising.sign, element: currentProfile.rising.element, description: 'Outer personality' },
                { planet: 'Venus', sign: currentProfile.venus.sign, element: currentProfile.venus.element, description: 'Love & aesthetics' },
                { planet: 'Mars', sign: currentProfile.mars.sign, element: currentProfile.mars.element, description: 'Drive & passion' }
              ].map((placement, index) => (
                <div key={index} className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getElementIcon(placement.element)}</span>
                      <span className="text-white font-medium">{placement.planet}</span>
                    </div>
                    <span className={`font-medium ${getElementColor(placement.element)}`}>
                      {placement.sign}
                    </span>
                  </div>
                  <p className="text-white/60 text-sm">{placement.description}</p>
                </div>
              ))}
            </div>

            {/* Element Distribution */}
            <div>
              <h5 className="text-white font-medium mb-4">Element Distribution</h5>
              <div className="space-y-3">
              {Object.entries(currentProfile.compatibility as Record<string, number>).map(([element, percentage]) => (
                  <div key={element}>
                    <div className="flex justify-between mb-1">
                      <span className="text-white/80 capitalize flex items-center gap-2">
                        <span>{getElementIcon(element)}</span>
                        {element}
                      </span>
                      <span className="text-white/60">{percentage}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                          element === 'fire' ? 'bg-red-500' :
                          element === 'earth' ? 'bg-green-500' :
                          element === 'air' ? 'bg-blue-500' :
                          'bg-cyan-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'compatibility' && (
        <div className="bg-white/5 rounded-lg p-6">
          <h4 className="text-white font-medium mb-4">Musical Element Compatibility</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(currentProfile.compatibility as Record<string, number>).map(([element, score]) => (
              <div key={element} className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getElementIcon(element)}</span>
                    <span className={`font-medium capitalize ${getElementColor(element)}`}>
                      {element}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-white">{score}%</div>
                </div>
                
                <div className="w-full bg-white/10 rounded-full h-2 mb-3">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${
                      element === 'fire' ? 'bg-red-500' :
                      element === 'earth' ? 'bg-green-500' :
                      element === 'air' ? 'bg-blue-500' :
                      'bg-cyan-500'
                    }`}
                    style={{ width: `${score}%` }}
                  />
                </div>
                
                <p className="text-white/60 text-sm">
                  {element === 'fire' && 'High-energy, passionate music resonates with your fiery nature'}
                  {element === 'earth' && 'Grounded, rhythmic music aligns with your earthy essence'}
                  {element === 'air' && 'Intellectual, airy melodies match your mental agility'}
                  {element === 'water' && 'Emotional, flowing music connects with your intuitive side'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'transits' && (
        <div className="bg-white/5 rounded-lg p-6">
          <h4 className="text-white font-medium mb-4">Current Planetary Influences</h4>
          
          <div className="space-y-4">
            {currentProfile.currentTransits.map((transit: { planet: string; aspect: string; influence: string }, index: number) => (
              <div key={index} className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Zap size={16} className="text-yellow-400" />
                    <span className="text-white font-medium">{transit.planet}</span>
                    <span className="text-purple-400">{transit.aspect}</span>
                  </div>
                  <Target size={16} className="text-blue-400" />
                </div>
                <p className="text-white/80">{transit.influence}</p>
                <div className="mt-2 text-xs text-white/60">
                  This transit influences your musical preferences and creative energy
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-600/30 rounded-lg p-4">
            <h5 className="text-white font-medium mb-2">Today's Musical Forecast</h5>
            <p className="text-white/80 text-sm">
              With Mercury in trine, your communication through music is enhanced. 
              Venus square brings creative tension - perfect for discovering new genres. 
              Mars conjunction amplifies your energy - time for high-tempo tracks!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
