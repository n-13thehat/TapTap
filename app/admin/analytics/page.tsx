"use client";

import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Music, 
  DollarSign,
  Eye,
  Play,
  Download,
  Calendar,
  Filter,
  RefreshCw,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

interface AnalyticsData {
  overview: {
    totalUsers: number;
    totalTracks: number;
    totalPlays: number;
    totalRevenue: number;
    userGrowth: number;
    trackGrowth: number;
    playGrowth: number;
    revenueGrowth: number;
  };
  userMetrics: {
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    monthlyActiveUsers: number;
    newSignups: number;
    retentionRate: number;
  };
  contentMetrics: {
    tracksUploaded: number;
    totalDuration: number;
    avgTrackLength: number;
    topGenres: Array<{ genre: string; count: number }>;
  };
  engagementMetrics: {
    totalPlays: number;
    avgSessionDuration: number;
    bounceRate: number;
    topTracks: Array<{ title: string; artist: string; plays: number }>;
  };
  revenueMetrics: {
    totalRevenue: number;
    subscriptionRevenue: number;
    transactionRevenue: number;
    avgRevenuePerUser: number;
  };
}

const MetricCard = ({ 
  icon, 
  title, 
  value, 
  change, 
  color = "blue" 
}: {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  change?: number;
  color?: string;
}) => (
  <div className={`rounded-xl border border-${color}-400/30 bg-${color}-400/10 p-6`}>
    <div className="flex items-center justify-between mb-4">
      <div className={`rounded-lg bg-${color}-400/20 p-2 text-${color}-300`}>
        {icon}
      </div>
      {change !== undefined && (
        <div className={`flex items-center gap-1 text-sm font-medium ${
          change >= 0 ? 'text-green-400' : 'text-red-400'
        }`}>
          {change >= 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
          {Math.abs(change)}%
        </div>
      )}
    </div>
    <div className="text-3xl font-bold text-white mb-1">{value}</div>
    <div className="text-sm text-white/70">{title}</div>
  </div>
);

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setRefreshing(true);
      const response = await fetch(`/api/admin/analytics?range=${timeRange}`);
      if (response.ok) {
        const analyticsData = await response.json();
        setData(analyticsData);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400 mx-auto mb-4"></div>
          <p className="text-white/60">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white px-6 py-6">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-indigo-400" />
            <div>
              <div className="text-sm uppercase tracking-[0.2em] text-indigo-200">Platform Analytics</div>
              <h1 className="text-4xl font-bold text-white">Data Insights</h1>
              <p className="text-white/60">Comprehensive platform metrics and performance data</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="rounded-lg bg-white/10 border border-white/20 px-4 py-2 text-white focus:outline-none focus:border-indigo-400"
            >
              <option value="1d">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            <button
              onClick={fetchAnalytics}
              disabled={refreshing}
              className="flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </header>

        {/* Overview Metrics */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              icon={<Users className="h-6 w-6" />}
              title="Total Users"
              value={data?.overview.totalUsers?.toLocaleString() || 0}
              change={data?.overview.userGrowth}
              color="blue"
            />
            <MetricCard
              icon={<Music className="h-6 w-6" />}
              title="Total Tracks"
              value={data?.overview.totalTracks?.toLocaleString() || 0}
              change={data?.overview.trackGrowth}
              color="purple"
            />
            <MetricCard
              icon={<Play className="h-6 w-6" />}
              title="Total Plays"
              value={data?.overview.totalPlays?.toLocaleString() || 0}
              change={data?.overview.playGrowth}
              color="green"
            />
            <MetricCard
              icon={<DollarSign className="h-6 w-6" />}
              title="Total Revenue"
              value={`$${data?.overview.totalRevenue?.toLocaleString() || 0}`}
              change={data?.overview.revenueGrowth}
              color="yellow"
            />
          </div>
        </div>

        {/* User Metrics */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">User Engagement</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="text-2xl font-bold text-white">{data?.userMetrics.dailyActiveUsers?.toLocaleString() || 0}</div>
              <div className="text-sm text-white/70">Daily Active Users</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="text-2xl font-bold text-white">{data?.userMetrics.weeklyActiveUsers?.toLocaleString() || 0}</div>
              <div className="text-sm text-white/70">Weekly Active Users</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="text-2xl font-bold text-white">{data?.userMetrics.monthlyActiveUsers?.toLocaleString() || 0}</div>
              <div className="text-sm text-white/70">Monthly Active Users</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="text-2xl font-bold text-white">{data?.userMetrics.newSignups?.toLocaleString() || 0}</div>
              <div className="text-sm text-white/70">New Signups</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="text-2xl font-bold text-white">{data?.userMetrics.retentionRate || 0}%</div>
              <div className="text-sm text-white/70">Retention Rate</div>
            </div>
          </div>
        </div>

        {/* Content & Engagement */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Content Metrics */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Content Metrics</h2>
            <div className="space-y-4">
              <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-2xl font-bold text-white">{data?.contentMetrics.tracksUploaded?.toLocaleString() || 0}</div>
                    <div className="text-sm text-white/70">Tracks Uploaded</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{Math.round((data?.contentMetrics.totalDuration || 0) / 3600)}h</div>
                    <div className="text-sm text-white/70">Total Duration</div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Top Genres</h3>
                <div className="space-y-2">
                  {data?.contentMetrics.topGenres?.slice(0, 5).map((genre, index) => (
                    <div key={genre.genre} className="flex items-center justify-between">
                      <span className="text-white/70">{genre.genre}</span>
                      <span className="text-white font-medium">{genre.count}</span>
                    </div>
                  )) || (
                    <div className="text-white/50 text-center py-4">No genre data available</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Engagement Metrics */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Engagement</h2>
            <div className="space-y-4">
              <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-2xl font-bold text-white">{Math.round((data?.engagementMetrics.avgSessionDuration || 0) / 60)}m</div>
                    <div className="text-sm text-white/70">Avg Session</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{data?.engagementMetrics.bounceRate || 0}%</div>
                    <div className="text-sm text-white/70">Bounce Rate</div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Top Tracks</h3>
                <div className="space-y-3">
                  {data?.engagementMetrics.topTracks?.slice(0, 5).map((track, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <div className="text-white font-medium">{track.title}</div>
                        <div className="text-white/50 text-sm">{track.artist}</div>
                      </div>
                      <div className="text-white/70">{track.plays.toLocaleString()}</div>
                    </div>
                  )) || (
                    <div className="text-white/50 text-center py-4">No track data available</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Metrics */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">Revenue Breakdown</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-green-400/30 bg-green-400/10 p-6">
              <div className="text-3xl font-bold text-white">${data?.revenueMetrics.totalRevenue?.toLocaleString() || 0}</div>
              <div className="text-sm text-green-100">Total Revenue</div>
            </div>
            <div className="rounded-xl border border-blue-400/30 bg-blue-400/10 p-6">
              <div className="text-3xl font-bold text-white">${data?.revenueMetrics.subscriptionRevenue?.toLocaleString() || 0}</div>
              <div className="text-sm text-blue-100">Subscriptions</div>
            </div>
            <div className="rounded-xl border border-purple-400/30 bg-purple-400/10 p-6">
              <div className="text-3xl font-bold text-white">${data?.revenueMetrics.transactionRevenue?.toLocaleString() || 0}</div>
              <div className="text-sm text-purple-100">Transactions</div>
            </div>
            <div className="rounded-xl border border-yellow-400/30 bg-yellow-400/10 p-6">
              <div className="text-3xl font-bold text-white">${data?.revenueMetrics.avgRevenuePerUser?.toFixed(2) || 0}</div>
              <div className="text-sm text-yellow-100">ARPU</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
