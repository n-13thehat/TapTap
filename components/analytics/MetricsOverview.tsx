"use client";

import { useState } from 'react';
import { BarChart3, TrendingUp, Users, Music, Play, Heart, Share2, DollarSign } from 'lucide-react';

interface MetricsOverviewProps {
  timeRange?: string;
  onTimeRangeChange?: (range: string) => void;
}

export default function MetricsOverview({ timeRange = '7d', onTimeRangeChange }: MetricsOverviewProps) {
  const [selectedMetric, setSelectedMetric] = useState('plays');

  const metrics = {
    plays: {
      value: '2.4M',
      change: '+12.5%',
      trend: 'up',
      icon: <Play size={20} className="text-blue-400" />,
      color: 'blue'
    },
    listeners: {
      value: '847K',
      change: '+8.3%',
      trend: 'up',
      icon: <Users size={20} className="text-green-400" />,
      color: 'green'
    },
    tracks: {
      value: '1,234',
      change: '+23',
      trend: 'up',
      icon: <Music size={20} className="text-purple-400" />,
      color: 'purple'
    },
    likes: {
      value: '156K',
      change: '+15.7%',
      trend: 'up',
      icon: <Heart size={20} className="text-red-400" />,
      color: 'red'
    },
    shares: {
      value: '89K',
      change: '+22.1%',
      trend: 'up',
      icon: <Share2 size={20} className="text-yellow-400" />,
      color: 'yellow'
    },
    revenue: {
      value: '$12.4K',
      change: '+18.9%',
      trend: 'up',
      icon: <DollarSign size={20} className="text-green-400" />,
      color: 'green'
    }
  };

  const timeRanges = [
    { value: '24h', label: '24 Hours' },
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
    { value: '1y', label: '1 Year' }
  ];

  const chartData = [
    { day: 'Mon', value: 120 },
    { day: 'Tue', value: 150 },
    { day: 'Wed', value: 180 },
    { day: 'Thu', value: 140 },
    { day: 'Fri', value: 220 },
    { day: 'Sat', value: 280 },
    { day: 'Sun', value: 240 }
  ];

  const maxValue = Math.max(...chartData.map(d => d.value));

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <BarChart3 size={20} className="text-blue-400" />
          Metrics Overview
        </h3>
        <div className="flex gap-2">
          {timeRanges.map((range) => (
            <button
              key={range.value}
              onClick={() => onTimeRangeChange && onTimeRangeChange(range.value)}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                timeRange === range.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Object.entries(metrics).map(([key, metric]) => (
          <div
            key={key}
            onClick={() => setSelectedMetric(key)}
            className={`bg-white/5 rounded-lg p-4 cursor-pointer transition-all hover:bg-white/10 ${
              selectedMetric === key ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              {metric.icon}
              <div className={`text-xs px-2 py-1 rounded ${
                metric.trend === 'up' ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'
              }`}>
                {metric.change}
              </div>
            </div>
            <div className="text-2xl font-bold text-white">{metric.value}</div>
            <div className="text-sm text-white/60 capitalize">{key}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white/5 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-white font-medium capitalize">{selectedMetric} Trend</h4>
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-green-400" />
            <span className="text-green-400 text-sm">
              {metrics[selectedMetric as keyof typeof metrics].change}
            </span>
          </div>
        </div>

        {/* Simple Bar Chart */}
        <div className="flex items-end justify-between h-40 gap-2">
          {chartData.map((data, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div
                className={`w-full bg-gradient-to-t from-${metrics[selectedMetric as keyof typeof metrics].color}-600 to-${metrics[selectedMetric as keyof typeof metrics].color}-400 rounded-t transition-all duration-500`}
                style={{ height: `${(data.value / maxValue) * 100}%` }}
              />
              <div className="text-xs text-white/60 mt-2">{data.day}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Performers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/5 rounded-lg p-6">
          <h4 className="text-white font-medium mb-4">Top Tracks</h4>
          <div className="space-y-3">
            {[
              { title: 'Neural Pathways', plays: '234K', change: '+12%' },
              { title: 'Digital Dreams', plays: '189K', change: '+8%' },
              { title: 'Quantum Beat', plays: '156K', change: '+15%' },
              { title: 'Cyber Waves', plays: '134K', change: '+5%' },
              { title: 'Matrix Flow', plays: '112K', change: '+22%' }
            ].map((track, index) => (
              <div key={index} className="flex items-center justify-between">
                <div>
                  <div className="text-white font-medium">{track.title}</div>
                  <div className="text-white/60 text-sm">{track.plays} plays</div>
                </div>
                <div className="text-green-400 text-sm">{track.change}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/5 rounded-lg p-6">
          <h4 className="text-white font-medium mb-4">Top Regions</h4>
          <div className="space-y-3">
            {[
              { region: 'United States', percentage: 35, listeners: '296K' },
              { region: 'United Kingdom', percentage: 18, listeners: '152K' },
              { region: 'Germany', percentage: 12, listeners: '102K' },
              { region: 'Canada', percentage: 10, listeners: '85K' },
              { region: 'Australia', percentage: 8, listeners: '68K' }
            ].map((region, index) => (
              <div key={index} className="flex items-center justify-between">
                <div>
                  <div className="text-white font-medium">{region.region}</div>
                  <div className="text-white/60 text-sm">{region.listeners} listeners</div>
                </div>
                <div className="text-blue-400 text-sm">{region.percentage}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Key Insights */}
      <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-600/30 rounded-lg p-6">
        <h4 className="text-white font-medium mb-4">Key Insights</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <TrendingUp size={16} className="text-green-400 mt-0.5" />
            <div>
              <div className="text-white font-medium">Growth Acceleration</div>
              <div className="text-white/80 text-sm">
                Your content is gaining momentum with 22% increase in engagement
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Users size={16} className="text-blue-400 mt-0.5" />
            <div>
              <div className="text-white font-medium">Audience Expansion</div>
              <div className="text-white/80 text-sm">
                Reaching 15% more unique listeners compared to last period
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
