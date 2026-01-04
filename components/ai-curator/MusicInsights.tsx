"use client";

import { useState } from 'react';
import { BarChart3, TrendingUp, Music, Clock, Heart, Zap } from 'lucide-react';

interface MusicInsightsProps {
  userProfile?: any;
}

export default function MusicInsights({ userProfile }: MusicInsightsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  const insights = {
    listeningTime: {
      total: '24.5 hours',
      change: '+12%',
      trend: 'up'
    },
    topGenres: [
      { name: 'Electronic', percentage: 35, color: 'bg-purple-500' },
      { name: 'Hip Hop', percentage: 28, color: 'bg-blue-500' },
      { name: 'Pop', percentage: 22, color: 'bg-green-500' },
      { name: 'Rock', percentage: 15, color: 'bg-orange-500' }
    ],
    discoveryRate: {
      newTracks: 47,
      percentage: 23,
      trend: 'up'
    },
    moodAnalysis: {
      dominant: 'Energetic',
      distribution: [
        { mood: 'Energetic', value: 40 },
        { mood: 'Chill', value: 30 },
        { mood: 'Focus', value: 20 },
        { mood: 'Social', value: 10 }
      ]
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/5 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <BarChart3 size={20} className="text-blue-400" />
            Music Insights
          </h3>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="bg-white/10 border border-white/20 rounded px-3 py-1 text-white text-sm"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Listening Time */}
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={16} className="text-blue-400" />
              <span className="text-sm text-white/80">Listening Time</span>
            </div>
            <div className="text-2xl font-bold text-white">{insights.listeningTime.total}</div>
            <div className="text-sm text-green-400">{insights.listeningTime.change} from last week</div>
          </div>

          {/* Discovery Rate */}
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={16} className="text-purple-400" />
              <span className="text-sm text-white/80">New Discoveries</span>
            </div>
            <div className="text-2xl font-bold text-white">{insights.discoveryRate.newTracks}</div>
            <div className="text-sm text-purple-400">{insights.discoveryRate.percentage}% of total plays</div>
          </div>

          {/* Top Mood */}
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Heart size={16} className="text-pink-400" />
              <span className="text-sm text-white/80">Dominant Mood</span>
            </div>
            <div className="text-2xl font-bold text-white">{insights.moodAnalysis.dominant}</div>
            <div className="text-sm text-pink-400">40% of listening time</div>
          </div>

          {/* Variety Score */}
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Music size={16} className="text-green-400" />
              <span className="text-sm text-white/80">Variety Score</span>
            </div>
            <div className="text-2xl font-bold text-white">8.2/10</div>
            <div className="text-sm text-green-400">Diverse taste profile</div>
          </div>
        </div>

        {/* Genre Distribution */}
        <div className="mt-8">
          <h4 className="text-white font-medium mb-4">Top Genres</h4>
          <div className="space-y-3">
            {insights.topGenres.map((genre, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-16 text-sm text-white/80">{genre.name}</div>
                <div className="flex-1 bg-white/10 rounded-full h-2">
                  <div 
                    className={`${genre.color} h-2 rounded-full transition-all duration-500`}
                    style={{ width: `${genre.percentage}%` }}
                  />
                </div>
                <div className="w-12 text-sm text-white/60 text-right">{genre.percentage}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* Mood Distribution */}
        <div className="mt-8">
          <h4 className="text-white font-medium mb-4">Mood Analysis</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {insights.moodAnalysis.distribution.map((mood, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center mb-2">
                  <span className="text-white font-bold">{mood.value}%</span>
                </div>
                <div className="text-sm text-white/80">{mood.mood}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
