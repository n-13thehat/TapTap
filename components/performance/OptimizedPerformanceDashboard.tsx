"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getPerformanceManager } from '@/lib/performance/PerformanceManager';
import { getAudioOptimizer } from '@/lib/performance/AudioOptimizer';
import {
  Activity,
  Zap,
  Cpu,
  HardDrive,
  HardDrive,
  Wifi,
  Volume2,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  LineChart,
  PieChart,
  Settings,
  RefreshCw,
  Download,
  Upload,
  Monitor,
  Smartphone,
  Headphones,
  Mic,
  Speaker,
  Play,
  Pause,
  Square,
  SkipForward,
  Rewind,
  FastForward,
  Target,
  Gauge,
  Thermometer,
  Battery,
  Signal,
  Globe,
  Server,
  Database,
  Cloud,
  Eye,
  EyeOff,
  Filter,
  Search,
  Calendar,
  Info,
  AlertCircle,
  XCircle,
  Plus,
  Minus,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  X,
  Check
} from 'lucide-react';

interface OptimizedPerformanceDashboardProps {
  className?: string;
  onOptimizationApplied?: (optimization: string) => void;
}

type DashboardView = 'overview' | 'audio' | 'memory' | 'network' | 'react' | 'recommendations';
type TimeRange = '5m' | '15m' | '1h' | '6h' | '24h';

export default function OptimizedPerformanceDashboard({ 
  className = '', 
  onOptimizationApplied 
}: OptimizedPerformanceDashboardProps) {
  const [currentView, setCurrentView] = useState<DashboardView>('overview');
  const [timeRange, setTimeRange] = useState<TimeRange>('15m');
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [autoOptimize, setAutoOptimize] = useState(false);
  
  // Performance data
  const [performanceMetrics, setPerformanceMetrics] = useState<any[]>([]);
  const [audioMetrics, setAudioMetrics] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [resourceUsage, setResourceUsage] = useState<any>({});
  
  // UI state
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Initialize managers
  const performanceManager = useMemo(() => getPerformanceManager(), []);
  const audioOptimizer = useMemo(() => getAudioOptimizer(), []);

  // Load performance data
  const loadPerformanceData = useCallback(() => {
    if (!isMonitoring) return;

    try {
      // Load performance metrics
      const perfMetrics = performanceManager.getMetrics();
      setPerformanceMetrics(perfMetrics);
      
      // Load audio metrics
      const audMetrics = audioOptimizer.getMetrics();
      setAudioMetrics(audMetrics);
      
      // Load alerts
      const perfAlerts = performanceManager.getAlerts();
      setAlerts(perfAlerts);
      
      // Load recommendations
      const recs = performanceManager.getRecommendations();
      setRecommendations(recs);
      
      // Load resource usage
      const usage = performanceManager.getResourceUsage();
      setResourceUsage(usage);
      
    } catch (error) {
      console.error('Failed to load performance data:', error);
    }
  }, [isMonitoring, performanceManager, audioOptimizer]);

  // Auto-refresh data
  useEffect(() => {
    loadPerformanceData();
    
    const interval = setInterval(loadPerformanceData, 5000); // Every 5 seconds
    return () => clearInterval(interval);
  }, [loadPerformanceData]);

  // Filter metrics by time range
  const filteredMetrics = useMemo(() => {
    const now = Date.now();
    const timeRangeMs = {
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
    }[timeRange];

    return performanceMetrics.filter(metric => now - metric.timestamp < timeRangeMs);
  }, [performanceMetrics, timeRange]);

  // Calculate performance score
  const performanceScore = useMemo(() => {
    if (filteredMetrics.length === 0) return 100;

    const latest = filteredMetrics[filteredMetrics.length - 1];
    let score = 100;

    // Core Web Vitals penalties
    if (latest.lcp > 2500) score -= 20;
    if (latest.fid > 100) score -= 15;
    if (latest.cls > 0.1) score -= 15;

    // Audio performance penalties
    if (latest.audioLatency > 50) score -= 20;
    if (latest.audioDropouts > 0) score -= 30;

    // Memory penalties
    if (latest.memoryUsage > 512) score -= 15;

    // Network penalties
    if (latest.networkLatency > 1000) score -= 10;

    return Math.max(0, Math.min(100, score));
  }, [filteredMetrics]);

  // Apply optimization
  const applyOptimization = useCallback(async (recommendationId: string) => {
    setIsOptimizing(true);
    
    try {
      const recommendation = recommendations.find(r => r.id === recommendationId);
      if (!recommendation) return;

      // Simulate optimization application
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (onOptimizationApplied) {
        onOptimizationApplied(recommendation.title);
      }

      // Refresh data
      loadPerformanceData();
      
    } catch (error) {
      console.error('Failed to apply optimization:', error);
    } finally {
      setIsOptimizing(false);
    }
  }, [recommendations, onOptimizationApplied, loadPerformanceData]);

  // Render performance score
  const renderPerformanceScore = () => {
    const getScoreColor = (score: number) => {
      if (score >= 90) return 'text-green-400';
      if (score >= 70) return 'text-yellow-400';
      if (score >= 50) return 'text-orange-400';
      return 'text-red-400';
    };

    const getScoreIcon = (score: number) => {
      if (score >= 90) return <CheckCircle className="text-green-400" size={24} />;
      if (score >= 70) return <AlertTriangle className="text-yellow-400" size={24} />;
      return <XCircle className="text-red-400" size={24} />;
    };

    return (
      <div className="bg-white/5 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-medium">Performance Score</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoOptimize(!autoOptimize)}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                autoOptimize ? 'bg-green-600 text-white' : 'bg-white/10 text-white/60 hover:text-white'
              }`}
            >
              Auto-Optimize
            </button>
            <button
              onClick={loadPerformanceData}
              className="p-2 rounded bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {getScoreIcon(performanceScore)}
          <div>
            <div className={`text-3xl font-bold ${getScoreColor(performanceScore)}`}>
              {performanceScore.toFixed(0)}
            </div>
            <div className="text-white/60 text-sm">out of 100</div>
          </div>
        </div>
        
        <div className="mt-4 w-full bg-white/10 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${
              performanceScore >= 90 ? 'bg-green-400' :
              performanceScore >= 70 ? 'bg-yellow-400' :
              performanceScore >= 50 ? 'bg-orange-400' :
              'bg-red-400'
            }`}
            style={{ width: `${performanceScore}%` }}
          />
        </div>
      </div>
    );
  };

  // Render overview
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Performance Score */}
      {renderPerformanceScore()}
      
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={16} className="text-blue-400" />
            <span className="text-white/80 text-sm">LCP</span>
          </div>
          <div className="text-white text-2xl font-bold">
            {filteredMetrics.length > 0 ? 
              `${filteredMetrics[filteredMetrics.length - 1].lcp.toFixed(0)}ms` : 
              '0ms'
            }
          </div>
          <div className={`text-xs ${
            filteredMetrics.length > 0 && filteredMetrics[filteredMetrics.length - 1].lcp < 2500 ? 
            'text-green-400' : 'text-red-400'
          }`}>
            {filteredMetrics.length > 0 && filteredMetrics[filteredMetrics.length - 1].lcp < 2500 ? 'Good' : 'Needs Work'}
          </div>
        </div>
        
        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Volume2 size={16} className="text-purple-400" />
            <span className="text-white/80 text-sm">Audio Latency</span>
          </div>
          <div className="text-white text-2xl font-bold">
            {filteredMetrics.length > 0 ? 
              `${filteredMetrics[filteredMetrics.length - 1].audioLatency.toFixed(0)}ms` : 
              '0ms'
            }
          </div>
          <div className={`text-xs ${
            filteredMetrics.length > 0 && filteredMetrics[filteredMetrics.length - 1].audioLatency < 50 ? 
            'text-green-400' : 'text-red-400'
          }`}>
            {filteredMetrics.length > 0 && filteredMetrics[filteredMetrics.length - 1].audioLatency < 50 ? 'Excellent' : 'High'}
          </div>
        </div>
        
        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Memory size={16} className="text-green-400" />
            <span className="text-white/80 text-sm">Memory</span>
          </div>
          <div className="text-white text-2xl font-bold">
            {resourceUsage.memory ? 
              `${resourceUsage.memory.used.toFixed(0)}MB` : 
              '0MB'
            }
          </div>
          <div className={`text-xs ${
            resourceUsage.memory && resourceUsage.memory.percentage < 70 ? 
            'text-green-400' : 'text-yellow-400'
          }`}>
            {resourceUsage.memory ? `${resourceUsage.memory.percentage.toFixed(0)}% used` : '0% used'}
          </div>
        </div>
        
        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Wifi size={16} className="text-orange-400" />
            <span className="text-white/80 text-sm">Network</span>
          </div>
          <div className="text-white text-2xl font-bold">
            {filteredMetrics.length > 0 ? 
              `${filteredMetrics[filteredMetrics.length - 1].networkLatency.toFixed(0)}ms` : 
              '0ms'
            }
          </div>
          <div className={`text-xs ${
            filteredMetrics.length > 0 && filteredMetrics[filteredMetrics.length - 1].networkLatency < 500 ? 
            'text-green-400' : 'text-yellow-400'
          }`}>
            {filteredMetrics.length > 0 && filteredMetrics[filteredMetrics.length - 1].networkLatency < 500 ? 'Fast' : 'Slow'}
          </div>
        </div>
      </div>
      
      {/* Performance Chart */}
      <div className="bg-white/5 rounded-lg p-4">
        <h3 className="text-white font-medium mb-4">Performance Trends</h3>
        
        <div className="h-64 flex items-end justify-between gap-1">
          {filteredMetrics.slice(-20).map((metric, index) => {
            const height = Math.max(10, (100 - metric.lcp / 50) * 2); // Scale LCP to chart height
            return (
              <div
                key={index}
                className="bg-blue-400 rounded-t transition-all duration-300 hover:bg-blue-300 cursor-pointer"
                style={{ height: `${height}%`, minWidth: '8px' }}
                onClick={() => setSelectedMetric(metric.timestamp.toString())}
                title={`LCP: ${metric.lcp.toFixed(0)}ms at ${new Date(metric.timestamp).toLocaleTimeString()}`}
              />
            );
          })}
        </div>
        
        <div className="mt-4 flex items-center justify-between text-sm text-white/60">
          <span>Last {timeRange}</span>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-400 rounded" />
              <span>LCP (ms)</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Active Alerts */}
      {alerts.length > 0 && (
        <div className="bg-white/5 rounded-lg p-4">
          <h3 className="text-white font-medium mb-4">Performance Alerts</h3>
          
          <div className="space-y-3">
            {alerts.slice(0, 5).map(alert => (
              <div
                key={alert.id}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  alert.severity === 'critical' ? 'bg-red-600/20' :
                  alert.severity === 'high' ? 'bg-orange-600/20' :
                  alert.severity === 'medium' ? 'bg-yellow-600/20' :
                  'bg-blue-600/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle size={16} className={
                    alert.severity === 'critical' ? 'text-red-400' :
                    alert.severity === 'high' ? 'text-orange-400' :
                    alert.severity === 'medium' ? 'text-yellow-400' :
                    'text-blue-400'
                  } />
                  <div>
                    <div className="text-white font-medium">{alert.message}</div>
                    <div className="text-white/60 text-sm">
                      {new Date(alert.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs ${
                    alert.severity === 'critical' ? 'bg-red-600 text-white' :
                    alert.severity === 'high' ? 'bg-orange-600 text-white' :
                    alert.severity === 'medium' ? 'bg-yellow-600 text-white' :
                    'bg-blue-600 text-white'
                  }`}>
                    {alert.severity}
                  </span>
                  
                  {!alert.resolved && (
                    <button
                      onClick={() => performanceManager.resolveAlert(alert.id)}
                      className="p-1 rounded text-white/60 hover:text-white transition-colors"
                    >
                      <Check size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Render audio performance
  const renderAudioPerformance = () => (
    <div className="space-y-6">
      {/* Audio Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={16} className="text-purple-400" />
            <span className="text-white/80 text-sm">Latency</span>
          </div>
          <div className="text-white text-2xl font-bold">
            {audioMetrics.length > 0 ? 
              `${audioMetrics[audioMetrics.length - 1].latency.toFixed(1)}ms` : 
              '0ms'
            }
          </div>
        </div>
        
        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Cpu size={16} className="text-red-400" />
            <span className="text-white/80 text-sm">CPU Load</span>
          </div>
          <div className="text-white text-2xl font-bold">
            {audioMetrics.length > 0 ? 
              `${audioMetrics[audioMetrics.length - 1].cpuUsage.toFixed(1)}%` : 
              '0%'
            }
          </div>
        </div>
        
        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-yellow-400" />
            <span className="text-white/80 text-sm">Dropouts</span>
          </div>
          <div className="text-white text-2xl font-bold">
            {audioMetrics.length > 0 ? 
              audioMetrics[audioMetrics.length - 1].dropouts : 
              0
            }
          </div>
        </div>
        
        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity size={16} className="text-green-400" />
            <span className="text-white/80 text-sm">Tracks</span>
          </div>
          <div className="text-white text-2xl font-bold">
            {audioMetrics.length > 0 ? 
              audioMetrics[audioMetrics.length - 1].concurrentTracks : 
              0
            }
          </div>
        </div>
      </div>
      
      {/* Audio Optimization Controls */}
      <div className="bg-white/5 rounded-lg p-4">
        <h3 className="text-white font-medium mb-4">Audio Optimization</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-white/80 text-sm mb-2">Optimization Level</label>
            <select
              value={audioOptimizer.getOptimizationLevel()}
              onChange={(e) => audioOptimizer.setOptimizationLevel(parseInt(e.target.value))}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-400"
            >
              <option value={0}>Minimum (High Compatibility)</option>
              <option value={1}>Low (Balanced)</option>
              <option value={2}>Medium (Recommended)</option>
              <option value={3}>High (Maximum Performance)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-white/80 text-sm mb-2">Features</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={true}
                  onChange={(e) => audioOptimizer.enableAdaptiveQuality(e.target.checked)}
                  className="rounded"
                />
                <span className="text-white text-sm">Adaptive Quality</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={true}
                  onChange={(e) => audioOptimizer.enableDynamicBuffering(e.target.checked)}
                  className="rounded"
                />
                <span className="text-white text-sm">Dynamic Buffering</span>
              </label>
            </div>
          </div>
        </div>
      </div>
      
      {/* Audio Capabilities */}
      <div className="bg-white/5 rounded-lg p-4">
        <h3 className="text-white font-medium mb-4">Audio Capabilities</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(audioOptimizer.getCapabilities()).map(([capability, supported]) => (
            <div key={capability} className="flex items-center gap-2">
              {supported ? (
                <CheckCircle size={16} className="text-green-400" />
              ) : (
                <XCircle size={16} className="text-red-400" />
              )}
              <span className="text-white/80 text-sm capitalize">
                {capability.replace(/([A-Z])/g, ' $1').trim()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Render recommendations
  const renderRecommendations = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-medium">Optimization Recommendations</h3>
        <button
          onClick={loadPerformanceData}
          className="p-2 rounded bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          <RefreshCw size={16} />
        </button>
      </div>
      
      {recommendations.length === 0 ? (
        <div className="text-center py-8 text-white/60">
          <CheckCircle size={48} className="mx-auto mb-4 opacity-50" />
          <p>No optimization recommendations at this time</p>
        </div>
      ) : (
        <div className="space-y-4">
          {recommendations.map(recommendation => (
            <div key={recommendation.id} className="bg-white/5 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="text-white font-medium">{recommendation.title}</h4>
                  <p className="text-white/60 text-sm mt-1">{recommendation.description}</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs ${
                    recommendation.priority === 'critical' ? 'bg-red-600 text-white' :
                    recommendation.priority === 'high' ? 'bg-orange-600 text-white' :
                    recommendation.priority === 'medium' ? 'bg-yellow-600 text-white' :
                    'bg-blue-600 text-white'
                  }`}>
                    {recommendation.priority}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <div className="text-white/60 text-xs">Impact</div>
                  <div className={`text-sm font-medium ${
                    recommendation.impact === 'high' ? 'text-green-400' :
                    recommendation.impact === 'medium' ? 'text-yellow-400' :
                    'text-blue-400'
                  }`}>
                    {recommendation.impact}
                  </div>
                </div>
                
                <div>
                  <div className="text-white/60 text-xs">Effort</div>
                  <div className={`text-sm font-medium ${
                    recommendation.effort === 'low' ? 'text-green-400' :
                    recommendation.effort === 'medium' ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {recommendation.effort}
                  </div>
                </div>
                
                <div>
                  <div className="text-white/60 text-xs">Improvement</div>
                  <div className="text-green-400 text-sm font-medium">
                    +{recommendation.estimatedImprovement}%
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="text-white/60 text-xs mb-1">Implementation</div>
                <div className="text-white/80 text-sm">{recommendation.implementation}</div>
              </div>
              
              <button
                onClick={() => applyOptimization(recommendation.id)}
                disabled={isOptimizing}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 rounded text-white text-sm transition-colors"
              >
                {isOptimizing ? 'Applying...' : 'Apply Optimization'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className={`bg-black/90 backdrop-blur-md border border-white/10 rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Activity size={24} className="text-blue-400" />
            Performance Dashboard
          </h1>
          
          <div className="flex items-center gap-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as TimeRange)}
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-400"
            >
              <option value="5m">Last 5 minutes</option>
              <option value="15m">Last 15 minutes</option>
              <option value="1h">Last hour</option>
              <option value="6h">Last 6 hours</option>
              <option value="24h">Last 24 hours</option>
            </select>
            
            <button
              onClick={() => setIsMonitoring(!isMonitoring)}
              className={`p-2 rounded transition-colors ${
                isMonitoring ? 'bg-green-600 text-white' : 'bg-white/10 text-white/60 hover:text-white'
              }`}
            >
              {isMonitoring ? <Pause size={16} /> : <Play size={16} />}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-1 bg-white/10 rounded-lg p-1">
          {[
            { id: 'overview', name: 'Overview', icon: BarChart3 },
            { id: 'audio', name: 'Audio', icon: Volume2 },
            { id: 'memory', name: 'Memory', icon: Memory },
            { id: 'network', name: 'Network', icon: Wifi },
            { id: 'react', name: 'React', icon: Zap },
            { id: 'recommendations', name: 'Optimize', icon: Target },
          ].map(({ id, name, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setCurrentView(id as DashboardView)}
              className={`flex items-center gap-2 px-4 py-2 rounded text-sm transition-colors ${
                currentView === id ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white'
              }`}
            >
              <Icon size={16} />
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {currentView === 'overview' && renderOverview()}
        {currentView === 'audio' && renderAudioPerformance()}
        {currentView === 'memory' && renderOverview()} {/* Placeholder */}
        {currentView === 'network' && renderOverview()} {/* Placeholder */}
        {currentView === 'react' && renderOverview()} {/* Placeholder */}
        {currentView === 'recommendations' && renderRecommendations()}
      </div>
    </div>
  );
}
