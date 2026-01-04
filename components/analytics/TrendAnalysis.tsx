"use client";

import { useState } from 'react';
import { TrendingUp, TrendingDown, BarChart3, Zap, Target, Clock } from 'lucide-react';

interface TrendAnalysisProps {
  data?: any;
}

export default function TrendAnalysis({ data }: TrendAnalysisProps) {
  const [selectedTrend, setSelectedTrend] = useState('engagement');

  const trends = {
    engagement: {
      name: 'Engagement Rate',
      value: '8.4%',
      change: '+2.1%',
      trend: 'up',
      data: [65, 72, 68, 75, 82, 78, 84],
      color: 'blue'
    },
    discovery: {
      name: 'Discovery Rate',
      value: '23%',
      change: '+5.2%',
      trend: 'up',
      data: [18, 20, 19, 22, 25, 23, 23],
      color: 'purple'
    },
    retention: {
      name: 'Listener Retention',
      value: '67%',
      change: '-1.3%',
      trend: 'down',
      data: [70, 68, 69, 67, 65, 66, 67],
      color: 'green'
    },
    virality: {
      name: 'Viral Coefficient',
      value: '1.8',
      change: '+0.4',
      trend: 'up',
      data: [1.2, 1.4, 1.3, 1.6, 1.9, 1.7, 1.8],
      color: 'orange'
    }
  };

  const insights = [
    {
      type: 'opportunity',
      title: 'Peak Engagement Hours',
      description: 'Your audience is most active between 7-9 PM EST',
      action: 'Schedule releases during peak hours',
      icon: <Clock size={16} className="text-blue-400" />
    },
    {
      type: 'trend',
      title: 'Genre Momentum',
      description: 'Electronic music showing 34% growth in your network',
      action: 'Consider exploring electronic collaborations',
      icon: <TrendingUp size={16} className="text-green-400" />
    },
    {
      type: 'alert',
      title: 'Retention Dip',
      description: 'Slight decrease in repeat listeners this week',
      action: 'Focus on playlist placement and follow-up content',
      icon: <Target size={16} className="text-yellow-400" />
    }
  ];

  const currentTrend = trends[selectedTrend as keyof typeof trends];

  return (
    <div className="space-y-6">
      {/* Trend Selector */}
      <div className="bg-white/5 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <BarChart3 size={20} className="text-purple-400" />
          Trend Analysis
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {Object.entries(trends).map(([key, trend]) => (
            <button
              key={key}
              onClick={() => setSelectedTrend(key)}
              className={`p-4 rounded-lg text-left transition-all ${
                selectedTrend === key
                  ? 'bg-white/20 border-2 border-white/40'
                  : 'bg-white/5 hover:bg-white/10 border-2 border-transparent'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-2xl font-bold text-white">{trend.value}</div>
                <div className={`flex items-center gap-1 text-sm ${
                  trend.trend === 'up' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {trend.trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {trend.change}
                </div>
              </div>
              <div className="text-sm text-white/80">{trend.name}</div>
            </button>
          ))}
        </div>

        {/* Trend Chart */}
        <div className="bg-white/5 rounded-lg p-6">
          <h4 className="text-white font-medium mb-4">{currentTrend.name} - 7 Day Trend</h4>
          <div className="flex items-end justify-between h-32 gap-2">
            {currentTrend.data.map((value, index) => {
              const maxValue = Math.max(...currentTrend.data);
              const height = (value / maxValue) * 100;
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div
                    className={`w-full bg-gradient-to-t from-${currentTrend.color}-600 to-${currentTrend.color}-400 rounded-t transition-all duration-500`}
                    style={{ height: `${height}%` }}
                  />
                  <div className="text-xs text-white/60 mt-2">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index]}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Insights & Recommendations */}
      <div className="bg-white/5 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Zap size={20} className="text-yellow-400" />
          AI Insights & Recommendations
        </h3>

        <div className="space-y-4">
          {insights.map((insight, index) => (
            <div key={index} className="bg-white/5 rounded-lg p-4">
              <div className="flex items-start gap-3">
                {insight.icon}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-white font-medium">{insight.title}</h4>
                    <span className={`text-xs px-2 py-1 rounded ${
                      insight.type === 'opportunity' ? 'bg-blue-600/20 text-blue-400' :
                      insight.type === 'trend' ? 'bg-green-600/20 text-green-400' :
                      'bg-yellow-600/20 text-yellow-400'
                    }`}>
                      {insight.type}
                    </span>
                  </div>
                  <p className="text-white/80 text-sm mb-2">{insight.description}</p>
                  <p className="text-white/60 text-sm italic">💡 {insight.action}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comparative Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/5 rounded-lg p-6">
          <h4 className="text-white font-medium mb-4">vs. Similar Artists</h4>
          <div className="space-y-4">
            {[
              { metric: 'Engagement Rate', you: 8.4, average: 6.2, better: true },
              { metric: 'Discovery Rate', you: 23, average: 18, better: true },
              { metric: 'Retention Rate', you: 67, average: 72, better: false },
              { metric: 'Growth Rate', you: 12.5, average: 8.9, better: true }
            ].map((comparison, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="text-white/80">{comparison.metric}</div>
                <div className="flex items-center gap-3">
                  <div className="text-white font-medium">{comparison.you}%</div>
                  <div className="text-white/60">vs {comparison.average}%</div>
                  <div className={`text-sm ${comparison.better ? 'text-green-400' : 'text-red-400'}`}>
                    {comparison.better ? '↗' : '↘'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/5 rounded-lg p-6">
          <h4 className="text-white font-medium mb-4">Trend Predictions</h4>
          <div className="space-y-4">
            {[
              { period: 'Next Week', prediction: '+15% engagement', confidence: 85 },
              { period: 'Next Month', prediction: '+8% new listeners', confidence: 72 },
              { period: 'Next Quarter', prediction: '+25% total plays', confidence: 68 }
            ].map((prediction, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-white/80">{prediction.period}</span>
                  <span className="text-green-400">{prediction.prediction}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-white/10 rounded-full h-1">
                    <div 
                      className="bg-blue-500 h-1 rounded-full"
                      style={{ width: `${prediction.confidence}%` }}
                    />
                  </div>
                  <span className="text-xs text-white/60">{prediction.confidence}% confidence</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
