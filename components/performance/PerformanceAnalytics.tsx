"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  performanceTester, 
  BenchmarkResult, 
  LoadTestResult 
} from '@/lib/performance/PerformanceTester';
import { 
  bundleOptimizer, 
  BundleAnalysis 
} from '@/lib/performance/BundleOptimizer';
import {
  BarChart3,
  LineChart,
  PieChart,
  TrendingUp,
  TrendingDown,
  Zap,
  Clock,
  MemoryStick,
  Cpu,
  Network,
  AlertTriangle,
  CheckCircle,
  Target,
  Download,
  Upload,
  Activity,
  Settings,
  RefreshCw,
  Play,
  Pause,
  FileText,
  Layers,
  Package
} from 'lucide-react';

interface PerformanceAnalyticsProps {
  className?: string;
}

type AnalyticsView = 'overview' | 'benchmarks' | 'loadtests' | 'bundles' | 'trends';

export default function PerformanceAnalytics({ className = '' }: PerformanceAnalyticsProps) {
  const [activeView, setActiveView] = useState<AnalyticsView>('overview');
  const [benchmarkHistory, setBenchmarkHistory] = useState<Map<string, BenchmarkResult[]>>(new Map());
  const [loadTestHistory, setLoadTestHistory] = useState<LoadTestResult[]>([]);
  const [bundleAnalysis, setBundleAnalysis] = useState<BundleAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      const benchmarks = performanceTester.getBenchmarkHistory() as Map<string, BenchmarkResult[]>;
      setBenchmarkHistory(benchmarks);
      
      const loadTests = performanceTester.getLoadTestHistory();
      setLoadTestHistory(loadTests);
      
      try {
        const analysis = await bundleOptimizer.analyzeBundles();
        setBundleAnalysis(analysis);
      } catch (error) {
        console.warn('Bundle analysis failed:', error);
      }
    };

    loadData();
  }, []);

  // Refresh data
  const refreshData = async () => {
    setIsAnalyzing(true);
    try {
      const benchmarks = performanceTester.getBenchmarkHistory() as Map<string, BenchmarkResult[]>;
      setBenchmarkHistory(benchmarks);
      
      const loadTests = performanceTester.getLoadTestHistory();
      setLoadTestHistory(loadTests);
      
      const analysis = await bundleOptimizer.analyzeBundles();
      setBundleAnalysis(analysis);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Calculate overview stats
  const overviewStats = useMemo(() => {
    const totalBenchmarks = Array.from(benchmarkHistory.values()).reduce((sum, results) => sum + results.length, 0);
    const totalLoadTests = loadTestHistory.length;
    
    const avgBenchmarkTime = Array.from(benchmarkHistory.values())
      .flat()
      .reduce((sum, result, _, arr) => sum + result.averageTime / arr.length, 0);
    
    const avgLoadTestResponseTime = loadTestHistory.length > 0
      ? loadTestHistory.reduce((sum, test) => sum + test.averageResponseTime, 0) / loadTestHistory.length
      : 0;
    
    const bundleSize = bundleAnalysis?.totalSize || 0;
    const bundleRecommendations = bundleAnalysis?.recommendations.length || 0;

    return {
      totalBenchmarks,
      totalLoadTests,
      avgBenchmarkTime,
      avgLoadTestResponseTime,
      bundleSize,
      bundleRecommendations,
    };
  }, [benchmarkHistory, loadTestHistory, bundleAnalysis]);

  // Format helpers
  const formatTime = (ms: number) => {
    if (ms < 1) return `${(ms * 1000).toFixed(2)}μs`;
    if (ms < 1000) return `${ms.toFixed(2)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)}GB`;
  };

  const formatNumber = (num: number) => {
    if (num < 1000) return num.toString();
    if (num < 1000000) return `${(num / 1000).toFixed(1)}K`;
    return `${(num / 1000000).toFixed(1)}M`;
  };

  // Render overview
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target size={16} className="text-blue-400" />
            <span className="text-white/80 text-sm">Benchmarks</span>
          </div>
          <div className="text-2xl font-bold text-white">{overviewStats.totalBenchmarks}</div>
          <div className="text-white/60 text-xs">
            Avg: {formatTime(overviewStats.avgBenchmarkTime)}
          </div>
        </div>
        
        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity size={16} className="text-green-400" />
            <span className="text-white/80 text-sm">Load Tests</span>
          </div>
          <div className="text-2xl font-bold text-white">{overviewStats.totalLoadTests}</div>
          <div className="text-white/60 text-xs">
            Avg: {formatTime(overviewStats.avgLoadTestResponseTime)}
          </div>
        </div>
        
        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Package size={16} className="text-purple-400" />
            <span className="text-white/80 text-sm">Bundle Size</span>
          </div>
          <div className="text-2xl font-bold text-white">{formatBytes(overviewStats.bundleSize)}</div>
          <div className="text-white/60 text-xs">
            {overviewStats.bundleRecommendations} recommendations
          </div>
        </div>
      </div>

      {/* Recent Performance Trends */}
      <div className="bg-white/5 rounded-lg p-6">
        <h3 className="text-white font-medium mb-4 flex items-center gap-2">
          <TrendingUp size={18} />
          Performance Trends
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Benchmark Trends */}
          <div>
            <h4 className="text-white/80 text-sm mb-3">Benchmark Performance</h4>
            <div className="space-y-2">
              {Array.from(benchmarkHistory.entries()).slice(0, 5).map(([name, results]) => {
                const latest = results[results.length - 1];
                const previous = results[results.length - 2];
                const trend = previous ? ((latest.averageTime - previous.averageTime) / previous.averageTime) * 100 : 0;
                
                return (
                  <div key={name} className="flex items-center justify-between p-2 bg-white/5 rounded">
                    <span className="text-white/80 text-sm truncate">{name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm">{formatTime(latest.averageTime)}</span>
                      <div className={`flex items-center gap-1 ${trend > 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {trend > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        <span className="text-xs">{Math.abs(trend).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Load Test Trends */}
          <div>
            <h4 className="text-white/80 text-sm mb-3">Load Test Results</h4>
            <div className="space-y-2">
              {loadTestHistory.slice(-5).map((test, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-white/5 rounded">
                  <span className="text-white/80 text-sm">
                    {test.config.targetRPS} RPS • {test.config.duration / 1000}s
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm">{formatTime(test.averageResponseTime)}</span>
                    <div className={`px-2 py-1 rounded text-xs ${
                      test.errorRate < 1 ? 'bg-green-600/20 text-green-400' :
                      test.errorRate < 5 ? 'bg-yellow-600/20 text-yellow-400' :
                      'bg-red-600/20 text-red-400'
                    }`}>
                      {test.errorRate.toFixed(1)}% errors
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bundle Analysis Summary */}
      {bundleAnalysis && (
        <div className="bg-white/5 rounded-lg p-6">
          <h3 className="text-white font-medium mb-4 flex items-center gap-2">
            <Layers size={18} />
            Bundle Analysis
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-white/80 text-sm mb-3">Bundle Composition</h4>
              <div className="space-y-2">
                {bundleAnalysis.chunks.slice(0, 5).map((chunk, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-white/5 rounded">
                    <span className="text-white/80 text-sm">{chunk.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm">{formatBytes(chunk.size)}</span>
                      <div className={`px-2 py-1 rounded text-xs ${
                        chunk.priority === 'high' ? 'bg-red-600/20 text-red-400' :
                        chunk.priority === 'medium' ? 'bg-yellow-600/20 text-yellow-400' :
                        'bg-green-600/20 text-green-400'
                      }`}>
                        {chunk.priority}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-white/80 text-sm mb-3">Optimization Opportunities</h4>
              <div className="space-y-2">
                {bundleAnalysis.recommendations.slice(0, 5).map((rec, index) => (
                  <div key={index} className="p-2 bg-white/5 rounded">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white/80 text-sm">{rec.type.replace('-', ' ')}</span>
                      <span className="text-green-400 text-xs">
                        -{formatBytes(rec.estimatedSavings)}
                      </span>
                    </div>
                    <p className="text-white/60 text-xs">{rec.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Render benchmarks
  const renderBenchmarks = () => (
    <div className="space-y-6">
      <div className="bg-white/5 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h3 className="text-white font-medium">Benchmark Results</h3>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {Array.from(benchmarkHistory.entries()).map(([name, results]) => (
            <div key={name} className="border-b border-white/10 last:border-b-0">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-white font-medium">{name}</h4>
                  <span className="text-white/60 text-sm">{results.length} runs</span>
                </div>
                
                {results.slice(-3).map((result, index) => (
                  <div key={index} className="mb-3 last:mb-0 p-3 bg-white/5 rounded">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-white/60">Average Time</div>
                        <div className="text-white font-medium">{formatTime(result.averageTime)}</div>
                      </div>
                      <div>
                        <div className="text-white/60">Operations/sec</div>
                        <div className="text-white font-medium">{formatNumber(result.operationsPerSecond)}</div>
                      </div>
                      <div>
                        <div className="text-white/60">Memory Usage</div>
                        <div className="text-white font-medium">{formatBytes(result.memoryUsage.peak)}</div>
                      </div>
                      <div>
                        <div className="text-white/60">Std Deviation</div>
                        <div className="text-white font-medium">{formatTime(result.standardDeviation)}</div>
                      </div>
                    </div>
                    
                    <div className="mt-2 text-white/40 text-xs">
                      {new Date(result.timestamp).toLocaleString()} • {result.iterations} iterations
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          {benchmarkHistory.size === 0 && (
            <div className="p-8 text-center text-white/60">
              <Target size={48} className="mx-auto mb-4 opacity-50" />
              <p>No benchmark results available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Render load tests
  const renderLoadTests = () => (
    <div className="space-y-6">
      <div className="bg-white/5 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h3 className="text-white font-medium">Load Test Results</h3>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {loadTestHistory.map((test, index) => (
            <div key={index} className="p-4 border-b border-white/10 last:border-b-0">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-white font-medium">
                    {test.config.targetRPS} RPS • {test.config.duration / 1000}s duration
                  </div>
                  <div className="text-white/60 text-sm">
                    {test.config.concurrency} concurrent users
                  </div>
                </div>
                <div className={`px-3 py-1 rounded text-sm ${
                  test.errorRate < 1 ? 'bg-green-600/20 text-green-400' :
                  test.errorRate < 5 ? 'bg-yellow-600/20 text-yellow-400' :
                  'bg-red-600/20 text-red-400'
                }`}>
                  {test.errorRate.toFixed(1)}% error rate
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                <div className="text-center">
                  <div className="text-white font-medium">{test.totalRequests}</div>
                  <div className="text-white/60 text-sm">Total Requests</div>
                </div>
                <div className="text-center">
                  <div className="text-white font-medium">{formatTime(test.averageResponseTime)}</div>
                  <div className="text-white/60 text-sm">Avg Response</div>
                </div>
                <div className="text-center">
                  <div className="text-white font-medium">{test.requestsPerSecond.toFixed(1)}</div>
                  <div className="text-white/60 text-sm">RPS Achieved</div>
                </div>
                <div className="text-center">
                  <div className="text-white font-medium">{formatTime(test.responseTimePercentiles.p95)}</div>
                  <div className="text-white/60 text-sm">95th Percentile</div>
                </div>
              </div>
              
              {Object.keys(test.errors).length > 0 && (
                <div className="mt-3 p-2 bg-red-600/10 rounded">
                  <div className="text-red-400 text-sm font-medium mb-1">Errors:</div>
                  <div className="text-white/60 text-xs">
                    {Object.entries(test.errors).map(([error, count]) => (
                      <span key={error} className="mr-3">{error}: {count}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {loadTestHistory.length === 0 && (
            <div className="p-8 text-center text-white/60">
              <Activity size={48} className="mx-auto mb-4 opacity-50" />
              <p>No load test results available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Render bundle analysis
  const renderBundles = () => (
    <div className="space-y-6">
      {bundleAnalysis ? (
        <>
          {/* Bundle Overview */}
          <div className="bg-white/5 rounded-lg p-6">
            <h3 className="text-white font-medium mb-4">Bundle Overview</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{formatBytes(bundleAnalysis.totalSize)}</div>
                <div className="text-white/60 text-sm">Total Size</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{formatBytes(bundleAnalysis.gzippedSize)}</div>
                <div className="text-white/60 text-sm">Gzipped</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{bundleAnalysis.chunks.length}</div>
                <div className="text-white/60 text-sm">Chunks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{bundleAnalysis.recommendations.length}</div>
                <div className="text-white/60 text-sm">Recommendations</div>
              </div>
            </div>
            
            <div className="w-full bg-white/10 rounded-full h-2">
              <div 
                className="bg-blue-400 h-2 rounded-full"
                style={{ width: `${(bundleAnalysis.gzippedSize / bundleAnalysis.totalSize) * 100}%` }}
              />
            </div>
            <div className="text-white/60 text-sm mt-1">
              Compression ratio: {((bundleAnalysis.gzippedSize / bundleAnalysis.totalSize) * 100).toFixed(1)}%
            </div>
          </div>

          {/* Chunks */}
          <div className="bg-white/5 rounded-lg p-6">
            <h3 className="text-white font-medium mb-4">Chunks</h3>
            
            <div className="space-y-2">
              {bundleAnalysis.chunks.map((chunk, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded">
                  <div className="flex items-center gap-3">
                    <div className={`px-2 py-1 rounded text-xs ${
                      chunk.priority === 'high' ? 'bg-red-600/20 text-red-400' :
                      chunk.priority === 'medium' ? 'bg-yellow-600/20 text-yellow-400' :
                      'bg-green-600/20 text-green-400'
                    }`}>
                      {chunk.priority}
                    </div>
                    <span className="text-white font-medium">{chunk.name}</span>
                    {chunk.isAsync && (
                      <span className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-xs">async</span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-white">{formatBytes(chunk.size)}</span>
                    <span className="text-white/60">({formatBytes(chunk.gzippedSize)} gzipped)</span>
                    <span className="text-white/60">{formatTime(chunk.loadTime)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-white/5 rounded-lg p-6">
            <h3 className="text-white font-medium mb-4">Optimization Recommendations</h3>
            
            <div className="space-y-3">
              {bundleAnalysis.recommendations.map((rec, index) => (
                <div key={index} className="p-4 bg-white/5 rounded">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`px-2 py-1 rounded text-xs ${
                        rec.priority === 'high' ? 'bg-red-600/20 text-red-400' :
                        rec.priority === 'medium' ? 'bg-yellow-600/20 text-yellow-400' :
                        'bg-green-600/20 text-green-400'
                      }`}>
                        {rec.priority}
                      </div>
                      <span className="text-white font-medium">{rec.type.replace('-', ' ')}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-green-400 text-sm">-{formatBytes(rec.estimatedSavings)}</span>
                      <div className={`px-2 py-1 rounded text-xs ${
                        rec.effort === 'low' ? 'bg-green-600/20 text-green-400' :
                        rec.effort === 'medium' ? 'bg-yellow-600/20 text-yellow-400' :
                        'bg-red-600/20 text-red-400'
                      }`}>
                        {rec.effort} effort
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-white/80 text-sm mb-2">{rec.description}</p>
                  <p className="text-white/60 text-xs">{rec.implementation}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white/5 rounded-lg p-8 text-center">
          <Package size={48} className="mx-auto mb-4 text-white/30" />
          <p className="text-white/60">Bundle analysis not available</p>
          <button
            onClick={refreshData}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm transition-colors"
          >
            Analyze Bundles
          </button>
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
            <BarChart3 size={20} className="text-green-400" />
            Performance Analytics
          </h2>
          
          <button
            onClick={refreshData}
            disabled={isAnalyzing}
            className="flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 rounded-lg text-white text-sm transition-colors"
          >
            <RefreshCw size={14} className={isAnalyzing ? 'animate-spin' : ''} />
            {isAnalyzing ? 'Analyzing...' : 'Refresh'}
          </button>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-1 mt-4">
          {[
            { id: 'overview', name: 'Overview', icon: BarChart3 },
            { id: 'benchmarks', name: 'Benchmarks', icon: Target },
            { id: 'loadtests', name: 'Load Tests', icon: Activity },
            { id: 'bundles', name: 'Bundles', icon: Package },
          ].map(({ id, name, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveView(id as AnalyticsView)}
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
      </div>

      {/* Content */}
      <div className="p-4 max-h-96 overflow-y-auto">
        {activeView === 'overview' && renderOverview()}
        {activeView === 'benchmarks' && renderBenchmarks()}
        {activeView === 'loadtests' && renderLoadTests()}
        {activeView === 'bundles' && renderBundles()}
      </div>
    </div>
  );
}
