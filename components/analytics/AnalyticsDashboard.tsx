"use client";

import { useState, useEffect } from 'react';
import { useAnalyticsContext } from '@/providers/AnalyticsProvider';
import { KPI_DEFINITIONS, KPI_CATEGORIES, getKPIsByCategory, checkKPIThreshold } from '@/lib/analytics/kpiDefinitions';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Zap, 
  Music,
  Eye,
  EyeOff,
  Settings,
  Download,
  RefreshCw
} from 'lucide-react';

interface KPICardProps {
  kpi: any;
  value: number;
  trend?: number;
}

function KPICard({ kpi, value, trend }: KPICardProps) {
  const definition = KPI_DEFINITIONS[kpi.id];
  const threshold = definition ? checkKPIThreshold(kpi.id, value) : 'good';
  const category = KPI_CATEGORIES[kpi.category as keyof typeof KPI_CATEGORIES];

  const formatValue = (val: number, unit: string) => {
    switch (unit) {
      case 'duration':
        return val < 1000 ? `${val}ms` : val < 60000 ? `${(val/1000).toFixed(1)}s` : `${(val/60000).toFixed(1)}m`;
      case 'percentage':
        return `${val.toFixed(1)}%`;
      case 'currency':
        return `$${val.toLocaleString()}`;
      case 'bytes':
        return val < 1024 ? `${val}B` : val < 1048576 ? `${(val/1024).toFixed(1)}KB` : `${(val/1048576).toFixed(1)}MB`;
      default:
        return val.toLocaleString();
    }
  };

  const getThresholdColor = (threshold: string) => {
    switch (threshold) {
      case 'critical': return 'border-red-500 bg-red-500/10';
      case 'warning': return 'border-yellow-500 bg-yellow-500/10';
      default: return 'border-green-500 bg-green-500/10';
    }
  };

  return (
    <div className={`p-4 rounded-lg border ${getThresholdColor(threshold)}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{category?.icon}</span>
          <h3 className="font-medium text-white text-sm">{kpi.name}</h3>
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs ${
            trend > 0 ? 'text-green-400' : trend < 0 ? 'text-red-400' : 'text-white/60'
          }`}>
            <TrendingUp size={12} className={trend < 0 ? 'rotate-180' : ''} />
            <span>{Math.abs(trend).toFixed(1)}%</span>
          </div>
        )}
      </div>
      
      <div className="text-2xl font-bold text-white mb-1">
        {formatValue(value, definition?.unit || 'count')}
      </div>
      
      {definition?.target && (
        <div className="text-xs text-white/60">
          Target: {formatValue(definition.target, definition.unit)}
        </div>
      )}
    </div>
  );
}

export default function AnalyticsDashboard() {
  const { analytics, dashboardData, consentLevel } = useAnalyticsContext();
  const [selectedCategory, setSelectedCategory] = useState<string>('engagement');
  const [showRawData, setShowRawData] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    if (analytics) {
      await analytics.flush();
    }
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleExport = () => {
    if (!dashboardData) return;
    
    const data = {
      timestamp: new Date().toISOString(),
      events: dashboardData.events,
      kpis: dashboardData.kpis,
      sessionStats: dashboardData.sessionStats,
      userStats: dashboardData.userStats,
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `taptap-analytics-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const categoryKPIs = dashboardData?.kpis?.filter((kpi: any) => kpi.category === selectedCategory) || [];
  const recentEvents = dashboardData?.events?.slice(-10) || [];

  if (consentLevel === 'none') {
    return (
      <div className="text-center py-12">
        <EyeOff size={48} className="mx-auto mb-4 text-white/20" />
        <h2 className="text-xl font-semibold text-white mb-2">Analytics Disabled</h2>
        <p className="text-white/60 mb-4">
          Analytics tracking is disabled. Enable analytics to view dashboard.
        </p>
        <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors">
          Enable Analytics
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 size={32} className="text-blue-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">Prism Analytics</h1>
            <p className="text-white/60">Real-time insights and KPI tracking</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => setShowRawData(!showRawData)}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg transition-colors"
          >
            {showRawData ? <EyeOff size={16} /> : <Eye size={16} />}
            {showRawData ? 'Hide' : 'Show'} Raw Data
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-3 py-2 rounded-lg transition-colors"
          >
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {/* Consent Level Notice */}
      <div className="bg-blue-600/20 border border-blue-600/30 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Settings size={16} className="text-blue-400" />
          <span className="font-medium text-blue-300">Analytics Consent: {consentLevel}</span>
        </div>
        <p className="text-sm text-white/80">
          {consentLevel === 'basic' && 'Basic analytics enabled. System and performance metrics only.'}
          {consentLevel === 'enhanced' && 'Enhanced analytics enabled. User behavior tracking included.'}
          {consentLevel === 'full' && 'Full analytics enabled. All metrics and business data tracked.'}
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {Object.entries(KPI_CATEGORIES).map(([key, category]) => (
          <button
            key={key}
            onClick={() => setSelectedCategory(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              selectedCategory === key
                ? 'bg-white/20 text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            <span>{category.icon}</span>
            <span>{category.name}</span>
          </button>
        ))}
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {categoryKPIs.map((kpi: any, index: number) => (
          <KPICard
            key={kpi.id}
            kpi={kpi}
            value={kpi.value}
            trend={Math.random() * 20 - 10} // Mock trend data
          />
        ))}
        
        {categoryKPIs.length === 0 && (
          <div className="col-span-full text-center py-8 text-white/60">
            <BarChart3 size={48} className="mx-auto mb-4 text-white/20" />
            <p>No KPIs available for {KPI_CATEGORIES[selectedCategory as keyof typeof KPI_CATEGORIES]?.name}</p>
            <p className="text-sm">Data will appear as events are tracked</p>
          </div>
        )}
      </div>

      {/* Session Stats */}
      {dashboardData?.sessionStats && (
        <div className="bg-white/5 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Current Session</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{dashboardData.sessionStats.eventCount}</div>
              <div className="text-sm text-white/60">Events</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {Math.round(dashboardData.sessionStats.duration / 1000 / 60)}m
              </div>
              <div className="text-sm text-white/60">Duration</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {Object.keys(dashboardData.sessionStats.categories || {}).length}
              </div>
              <div className="text-sm text-white/60">Categories</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-400">
                {dashboardData.sessionStats.sessionId?.slice(-8) || 'N/A'}
              </div>
              <div className="text-sm text-white/60">Session ID</div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Events */}
      <div className="bg-white/5 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Recent Events</h2>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {recentEvents.map((event: any, index: number) => (
            <div key={event.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${
                  event.category === 'user' ? 'bg-blue-400' :
                  event.category === 'engagement' ? 'bg-green-400' :
                  event.category === 'business' ? 'bg-yellow-400' :
                  event.category === 'performance' ? 'bg-red-400' :
                  'bg-purple-400'
                }`} />
                <div>
                  <div className="font-medium text-white">{event.type}</div>
                  <div className="text-sm text-white/60">{event.category}</div>
                </div>
              </div>
              <div className="text-sm text-white/60">
                {new Date(event.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))}
          
          {recentEvents.length === 0 && (
            <div className="text-center py-8 text-white/60">
              <BarChart3 size={48} className="mx-auto mb-4 text-white/20" />
              <p>No recent events</p>
              <p className="text-sm">Events will appear as you interact with TapTap</p>
            </div>
          )}
        </div>
      </div>

      {/* Raw Data */}
      {showRawData && dashboardData && (
        <div className="bg-white/5 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Raw Analytics Data</h2>
          <pre className="bg-black/50 p-4 rounded-lg text-xs text-white/80 overflow-auto max-h-96">
            {JSON.stringify(dashboardData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
