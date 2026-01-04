"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  performanceMonitor, 
  PerformanceMetric, 
  PerformanceAlert, 
  PerformanceReport,
  ResourceUsage 
} from '@/lib/performance/PerformanceMonitor';
import { 
  optimizationEngine, 
  OptimizationRule, 
  OptimizationResult 
} from '@/lib/performance/OptimizationEngine';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Cpu,
  Database,
  Download,
  Eye,
  EyeOff,
  Filter,
  HardDrive,
  MemoryStick,
  Monitor,
  Network,
  Play,
  Pause,
  RefreshCw,
  Settings,
  TrendingUp,
  TrendingDown,
  Wifi,
  Zap,
  BarChart3,
  LineChart,
  PieChart,
  Target,
  AlertCircle,
  Info,
  X,
  ChevronDown,
  ChevronUp,
  Search,
  Calendar,
  FileText,
  Maximize2,
  Minimize2
} from 'lucide-react';

interface PerformanceDashboardProps {
  className?: string;
  onClose?: () => void;
}

type MetricCategory = 'all' | 'render' | 'network' | 'memory' | 'audio' | 'user' | 'system';
type TimeRange = '1h' | '6h' | '24h' | '7d' | '30d';
type ViewMode = 'overview' | 'metrics' | 'alerts' | 'optimization' | 'reports';

export default function PerformanceDashboard({ className = '', onClose }: PerformanceDashboardProps) {
  // State
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [activeView, setActiveView] = useState<ViewMode>('overview');
  const [selectedCategory, setSelectedCategory] = useState<MetricCategory>('all');
  const [timeRange, setTimeRange] = useState<TimeRange>('1h');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  
  // Data state
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [resourceUsage, setResourceUsage] = useState<ResourceUsage | null>(null);
  const [optimizationRules, setOptimizationRules] = useState<OptimizationRule[]>([]);
  const [optimizationResults, setOptimizationResults] = useState<OptimizationResult[]>([]);
  const [currentReport, setCurrentReport] = useState<PerformanceReport | null>(null);

  // Update data
  const updateData = useCallback(() => {
    const timeRangeMs = {
      '1h': 3600000,
      '6h': 21600000,
      '24h': 86400000,
      '7d': 604800000,
      '30d': 2592000000,
    }[timeRange];

    const now = Date.now();
    const startTime = now - timeRangeMs;

    // Get metrics
    const newMetrics = performanceMonitor.getMetrics({
      category: selectedCategory === 'all' ? undefined : selectedCategory,
      timeRange: { start: startTime, end: now },
      limit: 1000,
    });
    setMetrics(newMetrics);

    // Get alerts
    const newAlerts = performanceMonitor.getAlerts();
    setAlerts(newAlerts);

    // Get resource usage
    const usage = performanceMonitor.getResourceUsage();
    setResourceUsage(usage);

    // Get optimization data
    const rules = optimizationEngine.getRules();
    setOptimizationRules(rules);

    const results = optimizationEngine.getResults();
    setOptimizationResults(results);

    // Generate report
    const report = performanceMonitor.generateReport({ start: startTime, end: now });
    setCurrentReport(report);
  }, [selectedCategory, timeRange]);

  // Setup real-time updates
  useEffect(() => {
    updateData();
    
    const interval = setInterval(updateData, 5000); // Update every 5 seconds
    
    // Listen for new metrics and alerts
    const handleMetric = (metric: PerformanceMetric) => {
      setMetrics(prev => [...prev.slice(-999), metric]);
    };
    
    const handleAlert = (alert: PerformanceAlert) => {
      setAlerts(prev => [...prev, alert]);
    };
    
    performanceMonitor.on('metric', handleMetric);
    performanceMonitor.on('alert', handleAlert);
    
    return () => {
      clearInterval(interval);
      performanceMonitor.off('metric', handleMetric);
      performanceMonitor.off('alert', handleAlert);
    };
  }, [updateData]);

  // Filtered data
  const filteredMetrics = useMemo(() => {
    let filtered = metrics;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(metric => 
        metric.name.toLowerCase().includes(query) ||
        metric.category.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [metrics, searchQuery]);

  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => !alert.acknowledged);
  }, [alerts]);

  // Statistics
  const stats = useMemo(() => {
    const totalMetrics = metrics.length;
    const criticalAlerts = alerts.filter(a => a.severity === 'critical' && !a.acknowledged).length;
    const warningAlerts = alerts.filter(a => a.severity === 'warning' && !a.acknowledged).length;
    
    const avgResponseTime = metrics
      .filter(m => m.category === 'network')
      .reduce((sum, m, _, arr) => sum + m.value / arr.length, 0);
    
    const memoryUsage = resourceUsage?.memory.percentage || 0;
    const cpuUsage = resourceUsage?.cpu.usage || 0;
    
    return {
      totalMetrics,
      criticalAlerts,
      warningAlerts,
      avgResponseTime,
      memoryUsage,
      cpuUsage,
    };
  }, [metrics, alerts, resourceUsage]);

  // Handlers
  const handleToggleMonitoring = useCallback(() => {
    setIsMonitoring(!isMonitoring);
    // In a real implementation, this would start/stop monitoring
  }, [isMonitoring]);

  const handleAcknowledgeAlert = useCallback((alertId: string) => {
    performanceMonitor.acknowledgeAlert(alertId);
    updateData();
  }, [updateData]);

  const handleRunOptimization = useCallback(async (ruleId: string) => {
    try {
      await optimizationEngine.executeRule(ruleId);
      updateData();
    } catch (error) {
      console.error('Optimization failed:', error);
    }
  }, [updateData]);

  const handleToggleRule = useCallback((ruleId: string, enabled: boolean) => {
    if (enabled) {
      optimizationEngine.enableRule(ruleId);
    } else {
      optimizationEngine.disableRule(ruleId);
    }
    updateData();
  }, [updateData]);

  // Format helpers
  const formatValue = useCallback((value: number, unit: string) => {
    switch (unit) {
      case 'ms':
        return `${value.toFixed(1)}ms`;
      case 'bytes':
        if (value > 1000000) return `${(value / 1000000).toFixed(1)}MB`;
        if (value > 1000) return `${(value / 1000).toFixed(1)}KB`;
        return `${value}B`;
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'fps':
        return `${value.toFixed(1)} FPS`;
      default:
        return value.toString();
    }
  }, []);

  const formatTime = useCallback((timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  }, []);

  const getSeverityColor = useCallback((severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-400 bg-red-600/20';
      case 'warning': return 'text-yellow-400 bg-yellow-600/20';
      default: return 'text-green-400 bg-green-600/20';
    }
  }, []);

  // Render components
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity size={16} className="text-blue-400" />
            <span className="text-white/80 text-sm">Total Metrics</span>
          </div>
          <div className="text-2xl font-bold text-white">{stats.totalMetrics}</div>
        </div>
        
        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-red-400" />
            <span className="text-white/80 text-sm">Critical Alerts</span>
          </div>
          <div className="text-2xl font-bold text-red-400">{stats.criticalAlerts}</div>
        </div>
        
        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <MemoryStick size={16} className="text-green-400" />
            <span className="text-white/80 text-sm">Memory Usage</span>
          </div>
          <div className="text-2xl font-bold text-white">{stats.memoryUsage.toFixed(1)}%</div>
        </div>
        
        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Cpu size={16} className="text-purple-400" />
            <span className="text-white/80 text-sm">CPU Usage</span>
          </div>
          <div className="text-2xl font-bold text-white">{stats.cpuUsage.toFixed(1)}%</div>
        </div>
      </div>

      {/* Resource Usage */}
      {resourceUsage && (
        <div className="bg-white/5 rounded-lg p-6">
          <h3 className="text-white font-medium mb-4 flex items-center gap-2">
            <Monitor size={18} />
            System Resources
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Memory */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/80 text-sm">Memory</span>
                <span className="text-white text-sm">{formatValue(resourceUsage.memory.used, 'bytes')} / {formatValue(resourceUsage.memory.total, 'bytes')}</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div 
                  className="bg-green-400 h-2 rounded-full transition-all"
                  style={{ width: `${resourceUsage.memory.percentage}%` }}
                />
              </div>
            </div>
            
            {/* CPU */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/80 text-sm">CPU</span>
                <span className="text-white text-sm">{resourceUsage.cpu.usage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div 
                  className="bg-blue-400 h-2 rounded-full transition-all"
                  style={{ width: `${resourceUsage.cpu.usage}%` }}
                />
              </div>
            </div>
            
            {/* Network */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/80 text-sm">Network</span>
                <span className="text-white text-sm">{resourceUsage.network.effectiveType}</span>
              </div>
              <div className="text-white/60 text-xs">
                {resourceUsage.network.downloadSpeed}Mbps • {resourceUsage.network.latency}ms
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Alerts */}
      {filteredAlerts.length > 0 && (
        <div className="bg-white/5 rounded-lg p-6">
          <h3 className="text-white font-medium mb-4 flex items-center gap-2">
            <AlertTriangle size={18} />
            Recent Alerts
          </h3>
          
          <div className="space-y-3">
            {filteredAlerts.slice(0, 5).map(alert => (
              <div key={alert.id} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                <div className={`p-1 rounded ${getSeverityColor(alert.severity)}`}>
                  {alert.severity === 'critical' ? <AlertCircle size={14} /> : <Info size={14} />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-medium">{alert.message}</div>
                  <div className="text-white/60 text-xs">{formatTime(alert.timestamp)}</div>
                </div>
                
                <button
                  onClick={() => handleAcknowledgeAlert(alert.id)}
                  className="p-1 text-white/60 hover:text-white transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderMetrics = () => (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search metrics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-green-400"
          />
        </div>
        
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value as MetricCategory)}
          className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
        >
          <option value="all">All Categories</option>
          <option value="render">Render</option>
          <option value="network">Network</option>
          <option value="memory">Memory</option>
          <option value="audio">Audio</option>
          <option value="user">User</option>
          <option value="system">System</option>
        </select>
      </div>

      {/* Metrics List */}
      <div className="bg-white/5 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h3 className="text-white font-medium">Performance Metrics</h3>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {filteredMetrics.length > 0 ? (
            <div className="divide-y divide-white/10">
              {filteredMetrics.slice(-50).reverse().map((metric, index) => (
                <div key={`${metric.name}-${metric.timestamp}-${index}`} className="p-4 hover:bg-white/5 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`px-2 py-1 rounded text-xs ${getSeverityColor(metric.severity)}`}>
                        {metric.category}
                      </div>
                      <span className="text-white font-medium">{metric.name}</span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <span className="text-white">{formatValue(metric.value, metric.unit)}</span>
                      <span className="text-white/60 text-sm">{formatTime(metric.timestamp)}</span>
                    </div>
                  </div>
                  
                  {metric.metadata && Object.keys(metric.metadata).length > 0 && (
                    <div className="mt-2 text-white/60 text-xs">
                      {Object.entries(metric.metadata).map(([key, value]) => (
                        <span key={key} className="mr-4">
                          {key}: {typeof value === 'object' ? JSON.stringify(value) : value}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-white/60">
              <BarChart3 size={48} className="mx-auto mb-4 opacity-50" />
              <p>No metrics found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderAlerts = () => (
    <div className="space-y-6">
      <div className="bg-white/5 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h3 className="text-white font-medium">Active Alerts</h3>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {filteredAlerts.length > 0 ? (
            <div className="divide-y divide-white/10">
              {filteredAlerts.map(alert => (
                <div key={alert.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded ${getSeverityColor(alert.severity)}`}>
                      {alert.severity === 'critical' ? <AlertCircle size={16} /> : <Info size={16} />}
                    </div>
                    
                    <div className="flex-1">
                      <div className="text-white font-medium mb-1">{alert.message}</div>
                      <div className="text-white/60 text-sm mb-2">
                        {alert.type.replace('_', ' ')} • {formatTime(alert.timestamp)}
                      </div>
                      
                      {alert.metric && (
                        <div className="bg-white/5 rounded p-2 text-sm">
                          <span className="text-white/80">{alert.metric.name}: </span>
                          <span className="text-white">{formatValue(alert.metric.value, alert.metric.unit)}</span>
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={() => handleAcknowledgeAlert(alert.id)}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-white text-sm transition-colors"
                    >
                      Acknowledge
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-white/60">
              <CheckCircle size={48} className="mx-auto mb-4 opacity-50" />
              <p>No active alerts</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderOptimization = () => (
    <div className="space-y-6">
      {/* Optimization Rules */}
      <div className="bg-white/5 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h3 className="text-white font-medium">Optimization Rules</h3>
        </div>
        
        <div className="divide-y divide-white/10">
          {optimizationRules.map(rule => (
            <div key={rule.id} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className={`px-2 py-1 rounded text-xs ${
                    rule.priority === 'critical' ? 'bg-red-600/20 text-red-400' :
                    rule.priority === 'high' ? 'bg-orange-600/20 text-orange-400' :
                    rule.priority === 'medium' ? 'bg-yellow-600/20 text-yellow-400' :
                    'bg-green-600/20 text-green-400'
                  }`}>
                    {rule.priority}
                  </div>
                  <span className="text-white font-medium">{rule.name}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleRule(rule.id, !rule.enabled)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      rule.enabled ? 'bg-green-600' : 'bg-white/20'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      rule.enabled ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                  
                  <button
                    onClick={() => handleRunOptimization(rule.id)}
                    disabled={!rule.enabled}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 rounded text-white text-sm transition-colors"
                  >
                    Run
                  </button>
                </div>
              </div>
              
              <p className="text-white/60 text-sm mb-2">{rule.description}</p>
              
              <div className="flex items-center gap-4 text-xs text-white/40">
                <span>Category: {rule.category}</span>
                {rule.lastExecuted && (
                  <span>Last run: {formatTime(rule.lastExecuted)}</span>
                )}
                {rule.cooldown && (
                  <span>Cooldown: {rule.cooldown / 1000}s</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Optimization Results */}
      <div className="bg-white/5 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h3 className="text-white font-medium">Recent Results</h3>
        </div>
        
        <div className="max-h-64 overflow-y-auto">
          {optimizationResults.length > 0 ? (
            <div className="divide-y divide-white/10">
              {optimizationResults.slice(-10).reverse().map((result, index) => (
                <div key={`${result.ruleId}-${result.timestamp}-${index}`} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-1 rounded ${result.success ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'}`}>
                        {result.success ? <CheckCircle size={14} /> : <X size={14} />}
                      </div>
                      <span className="text-white">{result.ruleId}</span>
                    </div>
                    
                    <span className="text-white/60 text-sm">{formatTime(result.timestamp)}</span>
                  </div>
                  
                  {result.improvement && (
                    <div className="mt-2 text-sm">
                      <span className="text-white/80">{result.improvement.metric}: </span>
                      <span className="text-green-400">
                        {result.improvement.percentage.toFixed(1)}% improvement
                      </span>
                    </div>
                  )}
                  
                  {result.error && (
                    <div className="mt-2 text-red-400 text-sm">{result.error}</div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-white/60">
              <Target size={48} className="mx-auto mb-4 opacity-50" />
              <p>No optimization results yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-6">
      {currentReport && (
        <div className="bg-white/5 rounded-lg p-6">
          <h3 className="text-white font-medium mb-4 flex items-center gap-2">
            <FileText size={18} />
            Performance Report
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{currentReport.summary.totalMetrics}</div>
              <div className="text-white/60 text-sm">Total Metrics</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{currentReport.summary.criticals}</div>
              <div className="text-white/60 text-sm">Critical Issues</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{currentReport.summary.warnings}</div>
              <div className="text-white/60 text-sm">Warnings</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{currentReport.summary.averageResponseTime.toFixed(0)}ms</div>
              <div className="text-white/60 text-sm">Avg Response</div>
            </div>
          </div>
          
          {currentReport.recommendations.length > 0 && (
            <div>
              <h4 className="text-white/80 font-medium mb-3">Recommendations</h4>
              <div className="space-y-2">
                {currentReport.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-white/80">{recommendation}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className={`bg-black/90 backdrop-blur-md border border-white/10 rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity size={20} className="text-green-400" />
            Performance Dashboard
          </h2>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleMonitoring}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                isMonitoring 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              {isMonitoring ? <Pause size={14} className="inline mr-1" /> : <Play size={14} className="inline mr-1" />}
              {isMonitoring ? 'Monitoring' : 'Stopped'}
            </button>
            
            <button
              onClick={updateData}
              className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              <RefreshCw size={16} />
            </button>
            
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Settings size={16} />
            </button>
            
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-1 mt-4">
          {[
            { id: 'overview', name: 'Overview', icon: Monitor },
            { id: 'metrics', name: 'Metrics', icon: BarChart3 },
            { id: 'alerts', name: 'Alerts', icon: AlertTriangle },
            { id: 'optimization', name: 'Optimization', icon: Zap },
            { id: 'reports', name: 'Reports', icon: FileText },
          ].map(({ id, name, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveView(id as ViewMode)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                activeView === id
                  ? 'bg-white/20 text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon size={14} />
              {name}
            </button>
          ))}
        </div>

        {/* Time Range */}
        <div className="flex items-center gap-2 mt-4">
          <span className="text-white/60 text-sm">Time Range:</span>
          <div className="flex items-center gap-1">
            {(['1h', '6h', '24h', '7d', '30d'] as TimeRange[]).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  timeRange === range
                    ? 'bg-green-600 text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-h-96 overflow-y-auto">
        {activeView === 'overview' && renderOverview()}
        {activeView === 'metrics' && renderMetrics()}
        {activeView === 'alerts' && renderAlerts()}
        {activeView === 'optimization' && renderOptimization()}
        {activeView === 'reports' && renderReports()}
      </div>
    </div>
  );
}
