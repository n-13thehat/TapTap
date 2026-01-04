"use client";

import { LibraryStats } from '@/lib/library/types';
import { 
  Music, 
  Clock, 
  Heart, 
  Play, 
  TrendingUp, 
  Calendar,
  Headphones,
  Star,
  BarChart3
} from 'lucide-react';

interface LibraryStatsProps {
  stats: LibraryStats;
}

export default function LibraryStatsComponent({ stats }: LibraryStatsProps) {
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const topGenres = Object.entries(stats.genreDistribution)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const totalGenres = Object.keys(stats.genreDistribution).length;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-purple-600/20 border border-purple-600/30 rounded-lg p-4 text-center">
          <Music size={32} className="mx-auto mb-2 text-purple-400" />
          <div className="text-2xl font-bold text-white">{formatNumber(stats.totalTracks)}</div>
          <div className="text-sm text-white/60">Total Tracks</div>
        </div>

        <div className="bg-blue-600/20 border border-blue-600/30 rounded-lg p-4 text-center">
          <Clock size={32} className="mx-auto mb-2 text-blue-400" />
          <div className="text-2xl font-bold text-white">{formatDuration(stats.totalDuration)}</div>
          <div className="text-sm text-white/60">Total Duration</div>
        </div>

        <div className="bg-red-600/20 border border-red-600/30 rounded-lg p-4 text-center">
          <Heart size={32} className="mx-auto mb-2 text-red-400" />
          <div className="text-2xl font-bold text-white">{formatNumber(stats.favoriteCount)}</div>
          <div className="text-sm text-white/60">Favorites</div>
        </div>

        <div className="bg-green-600/20 border border-green-600/30 rounded-lg p-4 text-center">
          <Play size={32} className="mx-auto mb-2 text-green-400" />
          <div className="text-2xl font-bold text-white">{formatNumber(stats.totalPlayCount)}</div>
          <div className="text-sm text-white/60">Total Plays</div>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Library Growth */}
        <div className="bg-white/5 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-green-400" />
            Library Growth
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-white/80">This Week</span>
              <div className="flex items-center gap-2">
                <div className="w-24 bg-white/10 rounded-full h-2">
                  <div 
                    className="bg-green-400 h-2 rounded-full" 
                    style={{ width: `${Math.min(100, (stats.libraryGrowth.thisWeek / 50) * 100)}%` }}
                  ></div>
                </div>
                <span className="text-green-400 font-medium w-8 text-right">
                  {stats.libraryGrowth.thisWeek}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-white/80">This Month</span>
              <div className="flex items-center gap-2">
                <div className="w-24 bg-white/10 rounded-full h-2">
                  <div 
                    className="bg-blue-400 h-2 rounded-full" 
                    style={{ width: `${Math.min(100, (stats.libraryGrowth.thisMonth / 200) * 100)}%` }}
                  ></div>
                </div>
                <span className="text-blue-400 font-medium w-8 text-right">
                  {stats.libraryGrowth.thisMonth}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-white/80">This Year</span>
              <div className="flex items-center gap-2">
                <div className="w-24 bg-white/10 rounded-full h-2">
                  <div 
                    className="bg-purple-400 h-2 rounded-full" 
                    style={{ width: `${Math.min(100, (stats.libraryGrowth.thisYear / 1000) * 100)}%` }}
                  ></div>
                </div>
                <span className="text-purple-400 font-medium w-8 text-right">
                  {stats.libraryGrowth.thisYear}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Genres */}
        <div className="bg-white/5 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 size={20} className="text-purple-400" />
            Top Genres
          </h3>
          
          <div className="space-y-3">
            {topGenres.map(([genre, count], index) => {
              const percentage = (count / stats.totalTracks) * 100;
              const colors = ['text-purple-400', 'text-blue-400', 'text-green-400', 'text-yellow-400', 'text-red-400'];
              
              return (
                <div key={genre} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-lg ${colors[index]}`}>#{index + 1}</span>
                    <span className="text-white/80">{genre}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-white/10 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${colors[index].replace('text-', 'bg-')}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-white/60 text-sm w-8 text-right">{count}</span>
                  </div>
                </div>
              );
            })}
            
            {totalGenres > 5 && (
              <div className="text-center pt-2 border-t border-white/10">
                <span className="text-white/60 text-sm">
                  +{totalGenres - 5} more genres
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <Calendar size={20} className="text-orange-400" />
            <span className="font-medium text-white">Recent Activity</span>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-white/60">Added this week</span>
              <span className="text-orange-400">{stats.recentlyAdded}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Played this week</span>
              <span className="text-orange-400">{stats.recentlyPlayed}</span>
            </div>
          </div>
        </div>

        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <Headphones size={20} className="text-teal-400" />
            <span className="font-medium text-white">Listening Habits</span>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-white/60">Avg. track length</span>
              <span className="text-teal-400">{formatDuration(stats.averageTrackDuration)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Most played genre</span>
              <span className="text-teal-400">{stats.mostPlayedGenre}</span>
            </div>
          </div>
        </div>

        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <Star size={20} className="text-yellow-400" />
            <span className="font-medium text-white">Collection</span>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-white/60">Playlists</span>
              <span className="text-yellow-400">{stats.totalPlaylists}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Favorite ratio</span>
              <span className="text-yellow-400">
                {((stats.favoriteCount / stats.totalTracks) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-600/30 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Library Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-purple-300 mb-2">Music Discovery</h4>
            <ul className="space-y-1 text-white/80">
              <li>• You've explored {totalGenres} different genres</li>
              <li>• {stats.recentlyAdded} new tracks added this week</li>
              <li>• Your library has grown {stats.libraryGrowth.thisYear} tracks this year</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-blue-300 mb-2">Listening Patterns</h4>
            <ul className="space-y-1 text-white/80">
              <li>• Average play count: {(stats.totalPlayCount / stats.totalTracks).toFixed(1)} per track</li>
              <li>• {((stats.favoriteCount / stats.totalTracks) * 100).toFixed(1)}% of tracks are favorites</li>
              <li>• Most loved genre: {stats.mostPlayedGenre}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
