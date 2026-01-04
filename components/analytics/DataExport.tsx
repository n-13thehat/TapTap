"use client";

import { useState } from 'react';
import { Download, FileText, Calendar, Filter, CheckCircle, Clock } from 'lucide-react';

interface DataExportProps {
  onExport?: (config: any) => void;
}

export default function DataExport({ onExport }: DataExportProps) {
  const [exportConfig, setExportConfig] = useState({
    format: 'csv',
    dateRange: '30d',
    dataTypes: {
      plays: true,
      listeners: true,
      demographics: false,
      engagement: true,
      revenue: false,
      social: true
    },
    includeMetadata: true,
    aggregation: 'daily'
  });

  const [exportHistory, setExportHistory] = useState([
    {
      id: '1',
      name: 'Monthly Analytics Report',
      format: 'CSV',
      size: '2.4 MB',
      status: 'completed',
      createdAt: '2024-01-15T10:30:00Z',
      downloadUrl: '#'
    },
    {
      id: '2',
      name: 'Engagement Data Export',
      format: 'JSON',
      size: '1.8 MB',
      status: 'completed',
      createdAt: '2024-01-14T15:45:00Z',
      downloadUrl: '#'
    },
    {
      id: '3',
      name: 'Revenue Analytics',
      format: 'Excel',
      size: '3.2 MB',
      status: 'processing',
      createdAt: '2024-01-14T09:20:00Z',
      downloadUrl: null
    }
  ]);

  const formats = [
    { value: 'csv', label: 'CSV', description: 'Comma-separated values' },
    { value: 'json', label: 'JSON', description: 'JavaScript Object Notation' },
    { value: 'excel', label: 'Excel', description: 'Microsoft Excel format' },
    { value: 'pdf', label: 'PDF', description: 'Formatted report' }
  ];

  const dateRanges = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: '1y', label: 'Last year' },
    { value: 'custom', label: 'Custom range' }
  ];

  const aggregations = [
    { value: 'hourly', label: 'Hourly' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' }
  ];

  const handleExport = () => {
    const newExport = {
      id: Date.now().toString(),
      name: `Analytics Export ${new Date().toLocaleDateString()}`,
      format: exportConfig.format.toUpperCase(),
      size: 'Processing...',
      status: 'processing',
      createdAt: new Date().toISOString(),
      downloadUrl: null
    };

    setExportHistory(prev => [newExport, ...prev]);

    // Simulate processing
    setTimeout(() => {
      setExportHistory(prev => prev.map(exp => 
        exp.id === newExport.id 
          ? { ...exp, status: 'completed', size: '2.1 MB', downloadUrl: '#' }
          : exp
      ));
    }, 3000);

    if (onExport) {
      onExport(exportConfig);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} className="text-green-400" />;
      case 'processing':
        return <Clock size={16} className="text-yellow-400" />;
      default:
        return <FileText size={16} className="text-white/60" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Export Configuration */}
      <div className="bg-white/5 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Download size={20} className="text-blue-400" />
          Data Export Configuration
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-3">Export Format</label>
            <div className="space-y-2">
              {formats.map((format) => (
                <label key={format.value} className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 cursor-pointer">
                  <input
                    type="radio"
                    name="format"
                    value={format.value}
                    checked={exportConfig.format === format.value}
                    onChange={(e) => setExportConfig(prev => ({ ...prev, format: e.target.value }))}
                    className="text-blue-500"
                  />
                  <div>
                    <div className="text-white font-medium">{format.label}</div>
                    <div className="text-white/60 text-sm">{format.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-3">Date Range</label>
            <select
              value={exportConfig.dateRange}
              onChange={(e) => setExportConfig(prev => ({ ...prev, dateRange: e.target.value }))}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white mb-4"
            >
              {dateRanges.map((range) => (
                <option key={range.value} value={range.value} className="bg-gray-800">
                  {range.label}
                </option>
              ))}
            </select>

            <label className="block text-sm font-medium text-white/80 mb-3">Data Aggregation</label>
            <select
              value={exportConfig.aggregation}
              onChange={(e) => setExportConfig(prev => ({ ...prev, aggregation: e.target.value }))}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
            >
              {aggregations.map((agg) => (
                <option key={agg.value} value={agg.value} className="bg-gray-800">
                  {agg.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Data Types */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-white/80 mb-3">Data Types to Include</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(exportConfig.dataTypes).map(([type, enabled]) => (
              <label key={type} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setExportConfig(prev => ({
                    ...prev,
                    dataTypes: { ...prev.dataTypes, [type]: e.target.checked }
                  }))}
                  className="rounded"
                />
                <span className="text-white/80 capitalize">{type}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Additional Options */}
        <div className="mt-6 pt-4 border-t border-white/10">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={exportConfig.includeMetadata}
              onChange={(e) => setExportConfig(prev => ({ ...prev, includeMetadata: e.target.checked }))}
              className="rounded"
            />
            <span className="text-white/80">Include metadata and column descriptions</span>
          </label>
        </div>

        {/* Export Button */}
        <button
          onClick={handleExport}
          className="w-full mt-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-6 py-3 rounded-lg font-medium text-white transition-colors flex items-center justify-center gap-2"
        >
          <Download size={16} />
          Export Data
        </button>
      </div>

      {/* Export History */}
      <div className="bg-white/5 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <FileText size={20} className="text-green-400" />
          Export History
        </h3>

        <div className="space-y-3">
          {exportHistory.map((export_item) => (
            <div key={export_item.id} className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(export_item.status)}
                  <div>
                    <div className="text-white font-medium">{export_item.name}</div>
                    <div className="text-white/60 text-sm">
                      {export_item.format} • {export_item.size} • {new Date(export_item.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded ${
                    export_item.status === 'completed' ? 'bg-green-600/20 text-green-400' :
                    export_item.status === 'processing' ? 'bg-yellow-600/20 text-yellow-400' :
                    'bg-gray-600/20 text-gray-400'
                  }`}>
                    {export_item.status}
                  </span>
                  {export_item.status === 'completed' && export_item.downloadUrl && (
                    <button className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm text-white transition-colors">
                      Download
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {exportHistory.length === 0 && (
          <div className="text-center py-8">
            <FileText size={48} className="mx-auto mb-4 text-white/20" />
            <p className="text-white/60">No exports yet</p>
            <p className="text-white/40 text-sm">Create your first data export above</p>
          </div>
        )}
      </div>

      {/* Export Guidelines */}
      <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-600/30 rounded-lg p-6">
        <h4 className="text-white font-medium mb-4">Export Guidelines</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-white/80">
          <div>
            <h5 className="font-medium text-white mb-2">Data Retention</h5>
            <ul className="space-y-1">
              <li>• Exports are available for 30 days</li>
              <li>• Maximum file size: 100MB</li>
              <li>• Up to 10 exports per day</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium text-white mb-2">Privacy & Security</h5>
            <ul className="space-y-1">
              <li>• All exports are encrypted</li>
              <li>• Personal data is anonymized</li>
              <li>• GDPR compliant exports</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
