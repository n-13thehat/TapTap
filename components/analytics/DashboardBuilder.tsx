"use client";

import { useState } from 'react';
import { useDashboard } from '@/hooks/useAdvancedAnalytics';
import { AnalyticsDashboard } from '@/lib/analytics/types';
import { 
  X, 
  Plus, 
  BarChart3, 
  LineChart, 
  PieChart, 
  Table,
  Type,
  Image,
  Grid,
  Layout,
  Save,
  Eye,
  Settings
} from 'lucide-react';

interface DashboardBuilderProps {
  onClose: () => void;
  onComplete: (dashboard: AnalyticsDashboard) => void;
  initialDashboard?: AnalyticsDashboard;
}

export default function DashboardBuilder({ onClose, onComplete, initialDashboard }: DashboardBuilderProps) {
  const { 
    dashboard, 
    widgets, 
    createDashboard, 
    addWidget, 
    updateWidget, 
    removeWidget, 
    autoLayout 
  } = useDashboard();

  const [dashboardName, setDashboardName] = useState(initialDashboard?.name || '');
  const [selectedWidgetType, setSelectedWidgetType] = useState<string>('');
  const [showWidgetPalette, setShowWidgetPalette] = useState(false);

  const widgetTypes = [
    { id: 'metric', name: 'Metric Display', icon: BarChart3, description: 'Show a single metric value' },
    { id: 'chart', name: 'Chart', icon: LineChart, description: 'Line, bar, or area charts' },
    { id: 'pie', name: 'Pie Chart', icon: PieChart, description: 'Pie or doughnut charts' },
    { id: 'table', name: 'Data Table', icon: Table, description: 'Tabular data display' },
    { id: 'text', name: 'Text Widget', icon: Type, description: 'Custom text content' },
    { id: 'image', name: 'Image', icon: Image, description: 'Static images or logos' },
  ];

  const handleCreateDashboard = () => {
    if (!dashboardName.trim()) return;
    
    createDashboard(dashboardName, 'custom');
  };

  const handleAddWidget = (type: string) => {
    if (!dashboard) return;

    const position = { x: 0, y: 0 };
    const size = { width: 4, height: 3 };
    
    addWidget(type, `New ${type} Widget`, position, size);
    setShowWidgetPalette(false);
  };

  const handleSave = () => {
    if (dashboard) {
      onComplete(dashboard);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-black/90 border border-white/20 rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <BarChart3 size={24} className="text-purple-400" />
            <h2 className="text-xl font-semibold text-white">
              {dashboard ? 'Edit Dashboard' : 'Create Dashboard'}
            </h2>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={20} className="text-white/60" />
          </button>
        </div>

        {/* Content */}
        <div className="flex h-[calc(90vh-120px)]">
          {/* Sidebar */}
          <div className="w-80 border-r border-white/10 p-6 space-y-6">
            {/* Dashboard Settings */}
            {!dashboard ? (
              <div className="space-y-4">
                <h3 className="font-medium text-white">Dashboard Settings</h3>
                <div>
                  <label className="block text-sm text-white/80 mb-2">Dashboard Name</label>
                  <input
                    type="text"
                    value={dashboardName}
                    onChange={(e) => setDashboardName(e.target.value)}
                    placeholder="Enter dashboard name..."
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40"
                  />
                </div>
                <button
                  onClick={handleCreateDashboard}
                  disabled={!dashboardName.trim()}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg transition-colors"
                >
                  Create Dashboard
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-white">Dashboard: {dashboard.name}</h3>
                  <div className="flex gap-1">
                    <button className="p-1 hover:bg-white/10 rounded">
                      <Settings size={14} className="text-white/60" />
                    </button>
                    <button className="p-1 hover:bg-white/10 rounded">
                      <Eye size={14} className="text-white/60" />
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-white/5 rounded p-2 text-center">
                    <div className="font-bold text-white">{widgets.length}</div>
                    <div className="text-white/60">Widgets</div>
                  </div>
                  <div className="bg-white/5 rounded p-2 text-center">
                    <div className="font-bold text-white">{dashboard.layout.columns}x{dashboard.layout.rows}</div>
                    <div className="text-white/60">Grid</div>
                  </div>
                </div>
              </div>
            )}

            {/* Widget Palette */}
            {dashboard && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-white">Add Widgets</h3>
                  <button
                    onClick={() => setShowWidgetPalette(!showWidgetPalette)}
                    className="p-1 hover:bg-white/10 rounded"
                  >
                    <Plus size={16} className="text-white/60" />
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  {widgetTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => handleAddWidget(type.id)}
                      className="flex flex-col items-center gap-2 p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <type.icon size={20} className="text-purple-400" />
                      <span className="text-xs text-white/80">{type.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Layout Tools */}
            {dashboard && widgets.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-medium text-white">Layout Tools</h3>
                <div className="space-y-2">
                  <button
                    onClick={autoLayout}
                    className="w-full flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg transition-colors"
                  >
                    <Layout size={16} />
                    Auto Layout
                  </button>
                  <button className="w-full flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg transition-colors">
                    <Grid size={16} />
                    Grid Settings
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Canvas */}
          <div className="flex-1 p-6">
            {!dashboard ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <BarChart3 size={64} className="mx-auto mb-4 text-white/20" />
                  <h3 className="text-lg font-semibold text-white mb-2">Create Your Dashboard</h3>
                  <p className="text-white/60">
                    Enter a name for your dashboard to get started
                  </p>
                </div>
              </div>
            ) : widgets.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Plus size={64} className="mx-auto mb-4 text-white/20" />
                  <h3 className="text-lg font-semibold text-white mb-2">Add Your First Widget</h3>
                  <p className="text-white/60 mb-4">
                    Choose from the widget palette to start building your dashboard
                  </p>
                  <button
                    onClick={() => setShowWidgetPalette(true)}
                    className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors"
                  >
                    Add Widget
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full bg-white/5 rounded-lg p-4">
                <div className="grid grid-cols-12 gap-4 h-full">
                  {widgets.map((widget) => (
                    <div
                      key={widget.id}
                      className="bg-white/10 border border-white/20 rounded-lg p-4 flex flex-col"
                      style={{
                        gridColumn: `span ${widget.size.width}`,
                        gridRow: `span ${widget.size.height}`,
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-white text-sm">{widget.title}</h4>
                        <div className="flex gap-1">
                          <button
                            onClick={() => updateWidget(widget.id, { title: 'Updated Widget' })}
                            className="p-1 hover:bg-white/10 rounded"
                          >
                            <Settings size={12} className="text-white/60" />
                          </button>
                          <button
                            onClick={() => removeWidget(widget.id)}
                            className="p-1 hover:bg-white/10 rounded"
                          >
                            <X size={12} className="text-white/60" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex-1 flex items-center justify-center bg-white/5 rounded">
                        <div className="text-center">
                          <BarChart3 size={32} className="mx-auto mb-2 text-white/40" />
                          <div className="text-xs text-white/60">{widget.type} Widget</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        {dashboard && (
          <div className="flex items-center justify-between p-6 border-t border-white/10">
            <div className="text-sm text-white/60">
              {widgets.length} widget{widgets.length !== 1 ? 's' : ''} • Last updated {new Date().toLocaleTimeString()}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-white/80 hover:text-white transition-colors"
              >
                Cancel
              </button>
              
              <button
                onClick={handleSave}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-lg transition-colors"
              >
                <Save size={16} />
                Save Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
