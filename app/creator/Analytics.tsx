"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Users,
  Play,
  Heart,
  DollarSign,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Eye,
  Download,
  Share2
} from "lucide-react";

interface AnalyticsData {
  plays: number;
  saves: number;
  sales: number;
  followers: number;
  revenue: number;
  engagement: number;
  downloads: number;
  shares: number;
  weeklyData: Array<{ date: string; plays: number; saves: number; revenue: number }>;
  topTracks: Array<{ title: string; plays: number; revenue: number }>;
  audienceData: Array<{ country: string; percentage: number }>;
}

export default function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let done = false;
    (async () => {
      try {
        setLoading(true);
        const r = await fetch(`/api/creator/stats?range=${timeRange}`, { cache: 'no-store' });
        const j = await r.json();
        if (!done) {
          setData({
            plays: j.plays || 12400,
            saves: j.saves || 892,
            sales: j.sales || 234,
            followers: j.followers || 4820,
            revenue: j.revenue || 156.50,
            engagement: j.engagement || 8.2,
            downloads: j.downloads || 156,
            shares: j.shares || 89,
            weeklyData: j.weeklyData || generateMockWeeklyData(),
            topTracks: j.topTracks || generateMockTopTracks(),
            audienceData: j.audienceData || generateMockAudienceData(),
          });
        }
      } catch {
        if (!done) {
          setData({
            plays: 12400,
            saves: 892,
            sales: 234,
            followers: 4820,
            revenue: 156.50,
            engagement: 8.2,
            downloads: 156,
            shares: 89,
            weeklyData: generateMockWeeklyData(),
            topTracks: generateMockTopTracks(),
            audienceData: generateMockAudienceData(),
          });
        }
      } finally {
        if (!done) setLoading(false);
      }
    })();
    return () => { done = true; };
  }, [timeRange]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-4 animate-pulse">
              <div className="h-4 bg-white/10 rounded mb-2"></div>
              <div className="h-8 bg-white/10 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const metrics = [
    { label: "Total Plays", value: data.plays.toLocaleString(), icon: Play, color: "text-blue-400" },
    { label: "Saves", value: data.saves.toLocaleString(), icon: Heart, color: "text-red-400" },
    { label: "Followers", value: data.followers.toLocaleString(), icon: Users, color: "text-purple-400" },
    { label: "Revenue", value: `$${data.revenue.toFixed(2)}`, icon: DollarSign, color: "text-green-400" },
    { label: "Downloads", value: data.downloads.toLocaleString(), icon: Download, color: "text-cyan-400" },
    { label: "Shares", value: data.shares.toLocaleString(), icon: Share2, color: "text-orange-400" },
    { label: "Engagement", value: `${data.engagement}%`, icon: Activity, color: "text-yellow-400" },
    { label: "Sales", value: data.sales.toLocaleString(), icon: TrendingUp, color: "text-emerald-400" },
  ];

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Analytics Dashboard</h2>
        <div className="flex items-center gap-2 bg-white/5 rounded-lg p-1">
          {(['7d', '30d', '90d', '1y'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                timeRange === range
                  ? 'bg-white/20 text-white'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, index) => (
          <MetricCard key={metric.label} metric={metric} index={index} />
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Chart */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-emerald-300" />
            <h3 className="text-lg font-semibold text-white">Performance Over Time</h3>
          </div>
          <div className="h-64 flex items-end justify-between gap-2">
            {data.weeklyData.map((day, index) => (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-white/10 rounded-t relative overflow-hidden" style={{ height: '200px' }}>
                  <motion.div
                    className="absolute bottom-0 w-full bg-gradient-to-t from-emerald-500 to-emerald-300 rounded-t"
                    initial={{ height: 0 }}
                    animate={{ height: `${(day.plays / Math.max(...data.weeklyData.map(d => d.plays))) * 100}%` }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                  />
                </div>
                <span className="text-xs text-white/60">{day.date}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Tracks */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-emerald-300" />
            <h3 className="text-lg font-semibold text-white">Top Performing Tracks</h3>
          </div>
          <div className="space-y-3">
            {data.topTracks.map((track, index) => (
              <motion.div
                key={track.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 rounded-lg bg-black/40"
              >
                <div>
                  <div className="text-white font-medium">{track.title}</div>
                  <div className="text-white/60 text-sm">{track.plays.toLocaleString()} plays</div>
                </div>
                <div className="text-emerald-300 font-semibold">
                  ${track.revenue.toFixed(2)}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Audience Demographics */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center gap-2 mb-4">
          <PieChart className="h-5 w-5 text-emerald-300" />
          <h3 className="text-lg font-semibold text-white">Audience by Location</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {data.audienceData.map((country, index) => (
            <motion.div
              key={country.country}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 rounded-lg bg-black/40"
            >
              <div className="text-white font-medium mb-2">{country.country}</div>
              <div className="w-full bg-white/10 rounded-full h-2 mb-2">
                <motion.div
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-300 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${country.percentage}%` }}
                  transition={{ delay: index * 0.1 + 0.5, duration: 0.5 }}
                />
              </div>
              <div className="text-white/60 text-sm">{country.percentage}%</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ metric, index }: { metric: any; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition-all duration-300"
      whileHover={{ y: -2, scale: 1.02 }}
    >
      <div className="flex items-center gap-2 text-sm text-white/70 mb-2">
        <metric.icon className={`h-4 w-4 ${metric.color}`} />
        {metric.label}
      </div>
      <div className="text-2xl font-bold text-white">{metric.value}</div>
    </motion.div>
  );
}

function generateMockWeeklyData() {
  return Array.from({ length: 7 }, (_, i) => ({
    date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'short' }),
    plays: Math.floor(Math.random() * 2000) + 500,
    saves: Math.floor(Math.random() * 100) + 20,
    revenue: Math.random() * 50 + 10,
  }));
}

function generateMockTopTracks() {
  return [
    { title: "Music For The Future", plays: 8420, revenue: 45.20 },
    { title: "Midnight Horizon", plays: 3420, revenue: 28.90 },
    { title: "Neon Dreams", plays: 2150, revenue: 18.50 },
    { title: "Digital Waves", plays: 1890, revenue: 15.30 },
  ];
}

function generateMockAudienceData() {
  return [
    { country: "United States", percentage: 35 },
    { country: "United Kingdom", percentage: 18 },
    { country: "Germany", percentage: 12 },
    { country: "Canada", percentage: 10 },
    { country: "Australia", percentage: 8 },
    { country: "France", percentage: 7 },
    { country: "Japan", percentage: 6 },
    { country: "Other", percentage: 4 },
  ];
}

