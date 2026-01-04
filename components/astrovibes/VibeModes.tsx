"use client";

import { useState } from 'react';
import { Moon, Sun, Star, Zap, Heart, Target, Play, Pause, Shuffle } from 'lucide-react';

interface VibeModesProps {
  onModeSelect?: (mode: any) => void;
}

export default function VibeModes({ onModeSelect }: VibeModesProps) {
  const [selectedMode, setSelectedMode] = useState('cosmic');
  const [isPlaying, setIsPlaying] = useState(false);

  const vibeModes = [
    {
      id: 'cosmic',
      name: 'Cosmic Flow',
      description: 'Music aligned with current planetary transits',
      icon: <Star size={24} className="text-purple-400" />,
      color: 'from-purple-600 to-blue-600',
      energy: 'Transcendent',
      duration: '∞',
      tracks: 247,
      currentTrack: 'Stellar Meditation - Cosmic Collective'
    },
    {
      id: 'lunar',
      name: 'Lunar Cycles',
      description: 'Rhythms that match the moon phases',
      icon: <Moon size={24} className="text-blue-400" />,
      color: 'from-blue-600 to-cyan-600',
      energy: 'Intuitive',
      duration: '29.5 days',
      tracks: 89,
      currentTrack: 'Moonrise Serenade - Luna Waves'
    },
    {
      id: 'solar',
      name: 'Solar Power',
      description: 'High-energy tracks for your sun sign',
      icon: <Sun size={24} className="text-yellow-400" />,
      color: 'from-yellow-600 to-orange-600',
      energy: 'Radiant',
      duration: '12 hours',
      tracks: 156,
      currentTrack: 'Solar Flare - Fire Element'
    },
    {
      id: 'elemental',
      name: 'Elemental Balance',
      description: 'Music matching your elemental composition',
      icon: <Zap size={24} className="text-green-400" />,
      color: 'from-green-600 to-teal-600',
      energy: 'Balanced',
      duration: 'Adaptive',
      tracks: 312,
      currentTrack: 'Earth Wind Fire Water - Elements United'
    },
    {
      id: 'transit',
      name: 'Transit Vibes',
      description: 'Real-time music for current astrological transits',
      icon: <Target size={24} className="text-red-400" />,
      color: 'from-red-600 to-pink-600',
      energy: 'Dynamic',
      duration: 'Live',
      tracks: 423,
      currentTrack: 'Mercury Retrograde Blues - Cosmic Chaos'
    },
    {
      id: 'compatibility',
      name: 'Astro Match',
      description: 'Music for astrological compatibility',
      icon: <Heart size={24} className="text-pink-400" />,
      color: 'from-pink-600 to-purple-600',
      energy: 'Harmonious',
      duration: 'Synced',
      tracks: 198,
      currentTrack: 'Venus Trine Mars - Love Frequency'
    }
  ];

  const currentMode = vibeModes.find(mode => mode.id === selectedMode);

  const handleModeSelect = (mode: any) => {
    setSelectedMode(mode.id);
    if (onModeSelect) {
      onModeSelect(mode);
    }
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="space-y-6">
      {/* Current Mode Player */}
      {currentMode && (
        <div className={`bg-gradient-to-r ${currentMode.color} rounded-lg p-6`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {currentMode.icon}
              <div>
                <h3 className="text-xl font-semibold text-white">{currentMode.name}</h3>
                <p className="text-white/90">{currentMode.description}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-white/90 text-sm">Energy: {currentMode.energy}</div>
              <div className="text-white/90 text-sm">{currentMode.tracks} tracks</div>
            </div>
          </div>

          <div className="bg-white/10 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-white font-medium">{currentMode.currentTrack}</div>
                <div className="text-white/80 text-sm">Now playing in {currentMode.name}</div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePlayPause}
                  className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                >
                  {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                </button>
                <button className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors">
                  <Shuffle size={16} />
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-between text-white/90 text-sm">
            <span>Duration: {currentMode.duration}</span>
            <span>Astro-tuned • Real-time</span>
          </div>
        </div>
      )}

      {/* Mode Selection Grid */}
      <div className="bg-white/5 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Choose Your Vibe Mode</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vibeModes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => handleModeSelect(mode)}
              className={`p-4 rounded-lg text-left transition-all ${
                selectedMode === mode.id
                  ? 'bg-white/20 border-2 border-white/40'
                  : 'bg-white/5 hover:bg-white/10 border-2 border-transparent'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                {mode.icon}
                <h4 className="font-medium text-white">{mode.name}</h4>
              </div>
              <p className="text-white/80 text-sm mb-3">{mode.description}</p>
              <div className="flex justify-between text-xs text-white/60">
                <span>{mode.tracks} tracks</span>
                <span>{mode.energy}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Mode Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/5 rounded-lg p-6">
          <h4 className="text-white font-medium mb-4">How Vibe Modes Work</h4>
          <div className="space-y-3 text-sm text-white/80">
            <div className="flex items-start gap-2">
              <Star size={16} className="text-purple-400 mt-0.5" />
              <div>
                <div className="font-medium text-white">Cosmic Flow</div>
                <div>Adapts to current planetary positions and aspects</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Moon size={16} className="text-blue-400 mt-0.5" />
              <div>
                <div className="font-medium text-white">Lunar Cycles</div>
                <div>Changes with moon phases - new, waxing, full, waning</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Sun size={16} className="text-yellow-400 mt-0.5" />
              <div>
                <div className="font-medium text-white">Solar Power</div>
                <div>Matches your sun sign energy and daily solar transits</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/5 rounded-lg p-6">
          <h4 className="text-white font-medium mb-4">Current Astro Influences</h4>
          <div className="space-y-3">
            <div className="bg-white/5 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <span className="text-white/80">Mercury Direct</span>
                <span className="text-green-400 text-sm">Communication ↗</span>
              </div>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <span className="text-white/80">Venus in Taurus</span>
                <span className="text-pink-400 text-sm">Sensual vibes ↗</span>
              </div>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <span className="text-white/80">Full Moon in Leo</span>
                <span className="text-yellow-400 text-sm">Creative energy ↗</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Personalization Settings */}
      <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-600/30 rounded-lg p-6">
        <h4 className="text-white font-medium mb-4">Personalize Your Vibes</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h5 className="text-white/80 font-medium mb-2">Intensity Level</h5>
            <input type="range" min="1" max="10" defaultValue="7" className="w-full" />
            <div className="flex justify-between text-xs text-white/60 mt-1">
              <span>Subtle</span>
              <span>Intense</span>
            </div>
          </div>
          <div>
            <h5 className="text-white/80 font-medium mb-2">Update Frequency</h5>
            <select className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm">
              <option value="realtime">Real-time</option>
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
