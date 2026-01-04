/**
 * Dashboard Builder
 * Visual dashboard builder with drag-and-drop widgets and real-time updates
 */

import { 
  AnalyticsDashboard, 
  DashboardWidget, 
  AnalyticsMetric,
  WidgetConfig,
  TimeRange 
} from './types';

export class DashboardBuilder {
  private dashboard: AnalyticsDashboard | null = null;
  private availableMetrics: Map<string, AnalyticsMetric> = new Map();
  private widgetTemplates: Map<string, WidgetTemplate> = new Map();

  constructor() {
    this.initializeWidgetTemplates();
  }

  /**
   * Create new dashboard
   */
  createDashboard(name: string, type: AnalyticsDashboard['type'] = 'custom'): AnalyticsDashboard {
    this.dashboard = {
      id: this.generateId(),
      name,
      type,
      layout: {
        columns: 12,
        rows: 8,
        grid_size: 60,
        responsive: true,
      },
      widgets: [],
      refresh_interval: 30,
      auto_refresh: true,
      time_range: {
        type: 'relative',
        period: 'last_24h',
      },
      visibility: 'private',
      shared_with: [],
      created_by: 'user',
      created_at: Date.now(),
      updated_at: Date.now(),
      last_viewed_at: Date.now(),
      view_count: 0,
      export_formats: ['json', 'csv', 'pdf', 'png'],
      scheduled_exports: [],
    };

    return this.dashboard;
  }

  /**
   * Add widget to dashboard
   */
  addWidget(
    type: DashboardWidget['type'],
    title: string,
    position: { x: number; y: number },
    size: { width: number; height: number },
    config: Partial<WidgetConfig> = {}
  ): string {
    if (!this.dashboard) {
      throw new Error('No dashboard created');
    }

    const widget: DashboardWidget = {
      id: this.generateId(),
      type,
      title,
      position,
      size,
      config: this.getDefaultWidgetConfig(type, config),
      metric_ids: [],
      filters: [],
      refresh_interval: 30,
      show_legend: true,
      show_title: true,
      clickable: false,
    };

    this.dashboard.widgets.push(widget);
    this.dashboard.updated_at = Date.now();

    return widget.id;
  }

  /**
   * Update widget configuration
   */
  updateWidget(widgetId: string, updates: Partial<DashboardWidget>): void {
    if (!this.dashboard) {
      throw new Error('No dashboard created');
    }

    const widgetIndex = this.dashboard.widgets.findIndex(w => w.id === widgetId);
    if (widgetIndex === -1) {
      throw new Error('Widget not found');
    }

    this.dashboard.widgets[widgetIndex] = {
      ...this.dashboard.widgets[widgetIndex],
      ...updates,
    };

    this.dashboard.updated_at = Date.now();
  }

  /**
   * Remove widget from dashboard
   */
  removeWidget(widgetId: string): void {
    if (!this.dashboard) {
      throw new Error('No dashboard created');
    }

    this.dashboard.widgets = this.dashboard.widgets.filter(w => w.id !== widgetId);
    this.dashboard.updated_at = Date.now();
  }

  /**
   * Add metric to widget
   */
  addMetricToWidget(widgetId: string, metricId: string): void {
    if (!this.dashboard) {
      throw new Error('No dashboard created');
    }

    const widget = this.dashboard.widgets.find(w => w.id === widgetId);
    if (!widget) {
      throw new Error('Widget not found');
    }

    if (!widget.metric_ids.includes(metricId)) {
      widget.metric_ids.push(metricId);
      this.dashboard.updated_at = Date.now();
    }
  }

  /**
   * Create widget from template
   */
  createWidgetFromTemplate(
    templateId: string,
    position: { x: number; y: number },
    customConfig: Partial<WidgetConfig> = {}
  ): string {
    const template = this.widgetTemplates.get(templateId);
    if (!template) {
      throw new Error('Widget template not found');
    }

    const config = { ...template.defaultConfig, ...customConfig };
    
    return this.addWidget(
      template.type,
      template.title,
      position,
      template.defaultSize,
      config
    );
  }

  /**
   * Auto-layout widgets
   */
  autoLayout(): void {
    if (!this.dashboard) {
      throw new Error('No dashboard created');
    }

    const { columns, grid_size } = this.dashboard.layout;
    let currentX = 0;
    let currentY = 0;
    let maxHeightInRow = 0;

    this.dashboard.widgets.forEach(widget => {
      // Check if widget fits in current row
      if (currentX + widget.size.width > columns) {
        // Move to next row
        currentX = 0;
        currentY += maxHeightInRow;
        maxHeightInRow = 0;
      }

      // Position widget
      widget.position = { x: currentX, y: currentY };
      
      // Update position for next widget
      currentX += widget.size.width;
      maxHeightInRow = Math.max(maxHeightInRow, widget.size.height);
    });

    this.dashboard.updated_at = Date.now();
  }

  /**
   * Optimize dashboard layout
   */
  optimizeLayout(): void {
    if (!this.dashboard) {
      throw new Error('No dashboard created');
    }

    // Sort widgets by importance (metric count, size, etc.)
    const sortedWidgets = [...this.dashboard.widgets].sort((a, b) => {
      const scoreA = this.calculateWidgetImportance(a);
      const scoreB = this.calculateWidgetImportance(b);
      return scoreB - scoreA;
    });

    // Reposition widgets
    this.dashboard.widgets = sortedWidgets;
    this.autoLayout();
  }

  /**
   * Validate dashboard configuration
   */
  validateDashboard(): { isValid: boolean; errors: string[] } {
    if (!this.dashboard) {
      return { isValid: false, errors: ['No dashboard created'] };
    }

    const errors: string[] = [];

    // Check dashboard name
    if (!this.dashboard.name || this.dashboard.name.trim().length === 0) {
      errors.push('Dashboard name is required');
    }

    // Check widget positions
    const positions = new Set<string>();
    this.dashboard.widgets.forEach(widget => {
      const posKey = `${widget.position.x},${widget.position.y}`;
      if (positions.has(posKey)) {
        errors.push(`Widget overlap detected at position ${posKey}`);
      }
      positions.add(posKey);

      // Check if widget is within bounds
      if (widget.position.x + widget.size.width > this.dashboard!.layout.columns) {
        errors.push(`Widget "${widget.title}" extends beyond dashboard width`);
      }

      // Check widget configuration
      if (widget.metric_ids.length === 0 && widget.type !== 'text' && widget.type !== 'image') {
        errors.push(`Widget "${widget.title}" has no metrics assigned`);
      }
    });

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Export dashboard configuration
   */
  exportDashboard(): AnalyticsDashboard | null {
    return this.dashboard ? { ...this.dashboard } : null;
  }

  /**
   * Import dashboard configuration
   */
  importDashboard(dashboardData: AnalyticsDashboard): void {
    this.dashboard = { ...dashboardData };
  }

  /**
   * Get widget suggestions based on metrics
   */
  getWidgetSuggestions(metricIds: string[]): WidgetSuggestion[] {
    const suggestions: WidgetSuggestion[] = [];

    metricIds.forEach(metricId => {
      const metric = this.availableMetrics.get(metricId);
      if (!metric) return;

      // Suggest appropriate widget types based on metric type
      switch (metric.type) {
        case 'counter':
          suggestions.push({
            type: 'metric',
            title: `${metric.display_name} Counter`,
            description: 'Display current count value',
            config: { chart_type: 'bar' },
            metricIds: [metricId],
            priority: 'high',
          });
          break;

        case 'gauge':
          suggestions.push({
            type: 'chart',
            title: `${metric.display_name} Gauge`,
            description: 'Display current value as gauge',
            config: { chart_type: 'doughnut' },
            metricIds: [metricId],
            priority: 'medium',
          });
          break;

        case 'histogram':
          suggestions.push({
            type: 'chart',
            title: `${metric.display_name} Distribution`,
            description: 'Display value distribution',
            config: { chart_type: 'bar' },
            metricIds: [metricId],
            priority: 'medium',
          });
          break;

        case 'rate':
          suggestions.push({
            type: 'chart',
            title: `${metric.display_name} Trend`,
            description: 'Display rate over time',
            config: { chart_type: 'line' },
            metricIds: [metricId],
            priority: 'high',
          });
          break;
      }
    });

    // Suggest comparison widgets for multiple metrics
    if (metricIds.length > 1) {
      suggestions.push({
        type: 'chart',
        title: 'Metrics Comparison',
        description: 'Compare multiple metrics',
        config: { chart_type: 'line' },
        metricIds,
        priority: 'medium',
      });
    }

    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  // Private methods
  private initializeWidgetTemplates(): void {
    // Metric display template
    this.widgetTemplates.set('metric_display', {
      id: 'metric_display',
      type: 'metric',
      title: 'Metric Display',
      description: 'Display a single metric value',
      defaultSize: { width: 3, height: 2 },
      defaultConfig: {
        show_data_labels: true,
        font_size: 24,
        alignment: 'center',
      },
    });

    // Line chart template
    this.widgetTemplates.set('line_chart', {
      id: 'line_chart',
      type: 'chart',
      title: 'Line Chart',
      description: 'Display trends over time',
      defaultSize: { width: 6, height: 4 },
      defaultConfig: {
        chart_type: 'line',
        show_grid: true,
        animation_enabled: true,
        color_scheme: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'],
      },
    });

    // Bar chart template
    this.widgetTemplates.set('bar_chart', {
      id: 'bar_chart',
      type: 'chart',
      title: 'Bar Chart',
      description: 'Compare values across categories',
      defaultSize: { width: 6, height: 4 },
      defaultConfig: {
        chart_type: 'bar',
        show_data_labels: true,
        color_scheme: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'],
      },
    });

    // Pie chart template
    this.widgetTemplates.set('pie_chart', {
      id: 'pie_chart',
      type: 'chart',
      title: 'Pie Chart',
      description: 'Show proportional data',
      defaultSize: { width: 4, height: 4 },
      defaultConfig: {
        chart_type: 'pie',
        show_data_labels: true,
        color_scheme: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
      },
    });

    // Data table template
    this.widgetTemplates.set('data_table', {
      id: 'data_table',
      type: 'table',
      title: 'Data Table',
      description: 'Display data in tabular format',
      defaultSize: { width: 8, height: 4 },
      defaultConfig: {
        pagination: true,
        sorting: true,
        columns: [
          { field: 'name', title: 'Name', type: 'string', sortable: true },
          { field: 'value', title: 'Value', type: 'number', sortable: true },
          { field: 'change', title: 'Change', type: 'number', sortable: true },
        ],
      },
    });

    // Text widget template
    this.widgetTemplates.set('text_widget', {
      id: 'text_widget',
      type: 'text',
      title: 'Text Widget',
      description: 'Display custom text content',
      defaultSize: { width: 4, height: 2 },
      defaultConfig: {
        content: 'Enter your text here...',
        font_size: 16,
        alignment: 'left',
      },
    });
  }

  private getDefaultWidgetConfig(type: DashboardWidget['type'], customConfig: Partial<WidgetConfig>): WidgetConfig {
    const baseConfig: WidgetConfig = {};

    switch (type) {
      case 'chart':
        Object.assign(baseConfig, {
          chart_type: 'line',
          color_scheme: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'],
          show_data_labels: false,
          show_grid: true,
          animation_enabled: true,
        });
        break;

      case 'table':
        Object.assign(baseConfig, {
          columns: [
            { field: 'name', title: 'Name', type: 'string', sortable: true },
            { field: 'value', title: 'Value', type: 'number', sortable: true },
          ],
          pagination: true,
          sorting: true,
        });
        break;

      case 'text':
        Object.assign(baseConfig, {
          content: 'Text content',
          font_size: 16,
          alignment: 'left',
        });
        break;

      case 'metric':
        Object.assign(baseConfig, {
          font_size: 24,
          alignment: 'center',
          show_data_labels: true,
        });
        break;
    }

    return { ...baseConfig, ...customConfig };
  }

  private calculateWidgetImportance(widget: DashboardWidget): number {
    let score = 0;
    
    // More metrics = higher importance
    score += widget.metric_ids.length * 10;
    
    // Larger widgets = higher importance
    score += (widget.size.width * widget.size.height) * 2;
    
    // Chart widgets are more important than text
    if (widget.type === 'chart') score += 20;
    if (widget.type === 'metric') score += 15;
    if (widget.type === 'table') score += 10;
    
    return score;
  }

  private generateId(): string {
    return `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Supporting interfaces
interface WidgetTemplate {
  id: string;
  type: DashboardWidget['type'];
  title: string;
  description: string;
  defaultSize: { width: number; height: number };
  defaultConfig: WidgetConfig;
}

interface WidgetSuggestion {
  type: DashboardWidget['type'];
  title: string;
  description: string;
  config: WidgetConfig;
  metricIds: string[];
  priority: 'low' | 'medium' | 'high';
}
