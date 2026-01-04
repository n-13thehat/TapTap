"use client";

import { useState } from 'react';
import { useAdvancedAnalytics, useDashboard } from '@/hooks/useAdvancedAnalytics';
import DashboardBuilder from './DashboardBuilder';
import MetricsOverview from './MetricsOverview';
import TrendAnalysis from './TrendAnalysis';
import DataExport from './DataExport';
import { 
  BarChart3, 
  TrendingUp, 
  Download, 
  Settings, 
  Plus,
  Eye,
  Calendar,
  Users,
  Activity,
  Target,
  Zap
} from 'lucide-react';

export default function AnalyticsInterface() {
  const [selectedView, setSelectedView] = useState<'overview' | 'dashboards' | 'trends' | 'export'>('overview');
  const [showDashboardBuilder, setShowDashboardBuilder] = useState(false);

  const { 
    isInitialized, 
    metrics, 
    getOverview,
    refreshMetrics 
  } = useAdvancedAnalytics();

  const { dashboard, createDashboard } = useDashboard();

  const overview = getOverview();

  const getViewIcon = (view: string) => {
    switch (view) {
      case 'overview': return <Activity size={16} />;
      case 'dashboards': return <BarChart3 size={16} />;
      case 'trends': return <TrendingUp size={16} />;
      case 'export': return <Download size={16} />;
      default: return <BarChart3 size={16} />;
    }
  };

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <BarChart3 size={48} className="mx-auto mb-4 text-white/20 animate-pulse" />
          <p className="text-white/60">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 size={32} className="text-purple-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">Analytics</h1>
            <p className="text-white/60">
              Real-time insights and data visualization
            </p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => setShowDashboardBuilder(true)}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={16} />
            New Dashboard
          </button>
          
          <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg transition-colors">
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Activity size={24} className="text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-blue-400">{overview.totalEvents}</div>
            <div className="text-sm text-white/60">Total Events</div>
          </div>

          <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Users size={24} className="text-green-400" />
            </div>
            <div className="text-2xl font-bold text-green-400">
              {overview.activeSession ? 1 : 0}
            </div>
            <div className="text-sm text-white/60">Active Sessions</div>
          </div>

          <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Target size={24} className="text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-purple-400">{overview.topMetrics.length}</div>
            <div className="text-sm text-white/60">Active Metrics</div>
          </div>

          <div className="bg-orange-500/20 border border-orange-500/30 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp size={24} className="text-orange-400" />
            </div>
            <div className="text-2xl font-bold text-orange-400">{overview.recentTrends.length}</div>
            <div className="text-sm text-white/60">Recent Trends</div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {[
          { id: 'overview', name: 'Overview', count: overview?.totalEvents || 0 },
          { id: 'dashboards', name: 'Dashboards', count: dashboard ? 1 : 0 },
          { id: 'trends', name: 'Trends', count: overview?.recentTrends.length || 0 },
          { id: 'export', name: 'Export', count: 0 },
        ].map((view) => (
          <button
            key={view.id}
            onClick={() => setSelectedView(view.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              selectedView === view.id
                ? 'bg-purple-600 text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            {getViewIcon(view.id)}
            <span>{view.name}</span>
            {view.count > 0 && (
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                {view.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="space-y-6">
        {selectedView === 'overview' && (
          <MetricsOverview />
        )}

        {selectedView === 'dashboards' && (
          <div className="space-y-4">
            {dashboard ? (
              <div className="bg-white/5 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">{dashboard.name}</h3>
                  <div className="flex gap-2">
                    <button className="flex items-center gap-1 bg-white/10 hover:bg-white/20 px-3 py-1 rounded text-sm transition-colors">
                      <Eye size={14} />
                      View
                    </button>
                    <button className="flex items-center gap-1 bg-white/10 hover:bg-white/20 px-3 py-1 rounded text-sm transition-colors">
                      <Settings size={14} />
                      Edit
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white/5 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-white">{dashboard.widgets.length}</div>
                    <div className="text-sm text-white/60">Widgets</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-white">{dashboard.view_count}</div>
                    <div className="text-sm text-white/60">Views</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-white">
                      {new Date(dashboard.last_viewed_at).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-white/60">Last Viewed</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-white">{dashboard.refresh_interval}s</div>
                    <div className="text-sm text-white/60">Refresh Rate</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <BarChart3 size={64} className="mx-auto mb-4 text-white/20" />
                <h3 className="text-xl font-semibold text-white mb-2">No dashboards yet</h3>
                <p className="text-white/60 mb-4">
                  Create your first dashboard to visualize your analytics data
                </p>
                <button
                  onClick={() => setShowDashboardBuilder(true)}
                  className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-lg transition-colors"
                >
                  Create Dashboard
                </button>
              </div>
            )}
          </div>
        )}

        {selectedView === 'trends' && (
          <TrendAnalysis />
        )}

        {selectedView === 'export' && (
          <DataExport />
        )}
      </div>

      {/* Real-time Indicators */}
      <div className="fixed bottom-6 right-6 space-y-2">
        <div className="bg-green-600/20 border border-green-600/30 rounded-lg p-3 flex items-center gap-2">
          <Zap size={16} className="text-green-400 animate-pulse" />
          <span className="text-green-400 text-sm font-medium">Real-time Active</span>
        </div>
        
        {overview?.activeSession && (
          <div className="bg-blue-600/20 border border-blue-600/30 rounded-lg p-3 flex items-center gap-2">
            <Calendar size={16} className="text-blue-400" />
            <span className="text-blue-400 text-sm">
              Session: {Math.floor((Date.now() - overview.activeSession.started_at) / 60000)}m
            </span>
          </div>
        )}
      </div>

      {/* Dashboard Builder Modal */}
      {showDashboardBuilder && (
        <DashboardBuilder
          onClose={() => setShowDashboardBuilder(false)}
          onComplete={(dashboardData) => {
            setShowDashboardBuilder(false);
            refreshMetrics();
          }}
        />
      )}
    </div>
  );
}
