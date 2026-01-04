"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { AnalyticsManager } from '@/lib/analytics/analyticsManager';
import { DashboardBuilder } from '@/lib/analytics/dashboardBuilder';
import { 
  AnalyticsMetric, 
  AnalyticsDashboard, 
  AnalyticsTrend,
  AnalyticsExport 
} from '@/lib/analytics/types';
import { useAuth } from './useAuth';

/**
 * Hook for advanced analytics functionality
 */
export function useAdvancedAnalytics() {
  const { user } = useAuth();
  const analyticsManager = useRef<AnalyticsManager | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [metrics, setMetrics] = useState<AnalyticsMetric[]>([]);

  const loadMetrics = useCallback(() => {
    if (analyticsManager.current) {
      // In a real implementation, this would fetch from the manager
      setMetrics([]);
    }
  }, []);

  // Initialize analytics manager
  useEffect(() => {
    if (!analyticsManager.current) {
      analyticsManager.current = new AnalyticsManager(user?.id);
      setIsInitialized(true);
    }
    loadMetrics();
  }, [loadMetrics, user?.id]);

  const track = useCallback((type: string, properties: Record<string, any> = {}) => {
    if (!analyticsManager.current) return;
    analyticsManager.current.track(type, properties);
  }, []);

  const createMetric = useCallback(async (metricData: Omit<AnalyticsMetric, 'id' | 'created_at' | 'updated_at'>) => {
    if (!analyticsManager.current) return null;

    try {
      const metricId = analyticsManager.current.createMetric(metricData);
      loadMetrics();
      return metricId;
    } catch (error) {
      console.error('Failed to create metric:', error);
      throw error;
    }
  }, [loadMetrics]);

  const getMetricValue = useCallback(async (metricId: string, timeRange?: { start: number; end: number }) => {
    if (!analyticsManager.current) return 0;

    try {
      return await analyticsManager.current.getMetricValue(metricId, timeRange);
    } catch (error) {
      console.error('Failed to get metric value:', error);
      return 0;
    }
  }, []);

  const generateTrend = useCallback(async (metricId: string, period: 'hour' | 'day' | 'week' | 'month') => {
    if (!analyticsManager.current) return null;

    try {
      return await analyticsManager.current.generateTrend(metricId, period);
    } catch (error) {
      console.error('Failed to generate trend:', error);
      return null;
    }
  }, []);

  const exportData = useCallback(async (
    format: 'json' | 'csv' | 'excel',
    options: {
      metrics?: string[];
      timeRange?: { start: number; end: number };
      filters?: any[];
    }
  ) => {
    if (!analyticsManager.current) return null;

    try {
      return await analyticsManager.current.exportData(format, options);
    } catch (error) {
      console.error('Failed to export data:', error);
      throw error;
    }
  }, []);

  const getOverview = useCallback(() => {
    if (!analyticsManager.current) return null;
    return analyticsManager.current.getOverview();
  }, []);

  return {
    isInitialized,
    metrics,
    track,
    createMetric,
    getMetricValue,
    generateTrend,
    exportData,
    getOverview,
    refreshMetrics: loadMetrics,
  };
}

/**
 * Hook for real-time metric monitoring
 */
export function useRealTimeMetric(metricId: string) {
  const { isInitialized } = useAdvancedAnalytics();
  const analyticsManager = useRef<AnalyticsManager | null>(null);
  const [value, setValue] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isInitialized || !metricId) return;

    setLoading(true);
    setError(null);

    // Get analytics manager instance
    if (!analyticsManager.current) {
      analyticsManager.current = new AnalyticsManager();
    }

    // Subscribe to real-time updates
    const unsubscribe = analyticsManager.current.subscribeToMetric(metricId, (newValue) => {
      setValue(newValue);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [isInitialized, metricId]);

  return { value, loading, error };
}

/**
 * Hook for dashboard management
 */
export function useDashboard() {
  const dashboardBuilder = useRef<DashboardBuilder>(new DashboardBuilder());
  const [dashboard, setDashboard] = useState<AnalyticsDashboard | null>(null);
  const [widgets, setWidgets] = useState<any[]>([]);

  const createDashboard = useCallback((name: string, type: AnalyticsDashboard['type'] = 'custom') => {
    const newDashboard = dashboardBuilder.current.createDashboard(name, type);
    setDashboard(newDashboard);
    setWidgets(newDashboard.widgets);
    return newDashboard;
  }, []);

  const addWidget = useCallback((
    type: any,
    title: string,
    position: { x: number; y: number },
    size: { width: number; height: number },
    config: any = {}
  ) => {
    const widgetId = dashboardBuilder.current.addWidget(type, title, position, size, config);
    const updatedDashboard = dashboardBuilder.current.exportDashboard();
    if (updatedDashboard) {
      setDashboard(updatedDashboard);
      setWidgets(updatedDashboard.widgets);
    }
    return widgetId;
  }, []);

  const updateWidget = useCallback((widgetId: string, updates: any) => {
    dashboardBuilder.current.updateWidget(widgetId, updates);
    const updatedDashboard = dashboardBuilder.current.exportDashboard();
    if (updatedDashboard) {
      setDashboard(updatedDashboard);
      setWidgets(updatedDashboard.widgets);
    }
  }, []);

  const removeWidget = useCallback((widgetId: string) => {
    dashboardBuilder.current.removeWidget(widgetId);
    const updatedDashboard = dashboardBuilder.current.exportDashboard();
    if (updatedDashboard) {
      setDashboard(updatedDashboard);
      setWidgets(updatedDashboard.widgets);
    }
  }, []);

  const autoLayout = useCallback(() => {
    dashboardBuilder.current.autoLayout();
    const updatedDashboard = dashboardBuilder.current.exportDashboard();
    if (updatedDashboard) {
      setDashboard(updatedDashboard);
      setWidgets(updatedDashboard.widgets);
    }
  }, []);

  return {
    dashboard,
    widgets,
    createDashboard,
    addWidget,
    updateWidget,
    removeWidget,
    autoLayout,
  };
}
