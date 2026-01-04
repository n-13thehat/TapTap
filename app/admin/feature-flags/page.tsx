"use client";

import { useState } from 'react';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { 
  Settings, 
  ToggleLeft, 
  ToggleRight, 
  RefreshCw, 
  AlertTriangle,
  Info,
  Users,
  Clock,
  Percent
} from 'lucide-react';

export default function FeatureFlagsAdminPage() {
  const { config, loading, isEnabled, refresh, override, clearOverrides } = useFeatureFlags();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEnabled, setFilterEnabled] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});

  const filteredFlags = Object.entries(config.flags).filter(([key, flag]) => {
    const matchesSearch = key.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         flag.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterEnabled === 'all' ||
                         (filterEnabled === 'enabled' && isEnabled(key)) ||
                         (filterEnabled === 'disabled' && !isEnabled(key));
    
    return matchesSearch && matchesFilter;
  });

  const handleOverride = (flagKey: string, enabled: boolean) => {
    override(flagKey, enabled);
    setOverrides(prev => ({ ...prev, [flagKey]: enabled }));
  };

  const handleClearOverrides = () => {
    clearOverrides();
    setOverrides({});
  };

  const getFlagStatus = (flagKey: string) => {
    const enabled = isEnabled(flagKey);
    const hasOverride = flagKey in overrides;
    
    return {
      enabled,
      hasOverride,
      status: enabled ? 'enabled' : 'disabled',
      color: enabled ? 'text-green-400' : 'text-red-400'
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex items-center gap-3">
          <RefreshCw className="animate-spin" size={20} />
          <span>Loading feature flags...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Settings size={32} className="text-teal-400" />
            <div>
              <h1 className="text-3xl font-bold">Feature Flags Admin</h1>
              <p className="text-white/60">
                Manage feature flags and rollouts • Version {config.version}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleClearOverrides}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-sm transition-colors"
            >
              Clear Overrides
            </button>
            <button
              onClick={refresh}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/5 rounded-lg p-4">
            <div className="text-2xl font-bold text-white">{Object.keys(config.flags).length}</div>
            <div className="text-sm text-white/60">Total Flags</div>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-400">
              {Object.keys(config.flags).filter(key => isEnabled(key)).length}
            </div>
            <div className="text-sm text-white/60">Enabled</div>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <div className="text-2xl font-bold text-red-400">
              {Object.keys(config.flags).filter(key => !isEnabled(key)).length}
            </div>
            <div className="text-sm text-white/60">Disabled</div>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-400">{Object.keys(overrides).length}</div>
            <div className="text-sm text-white/60">Overrides</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search flags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/50 focus:border-teal-300 focus:outline-none"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'enabled', 'disabled'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setFilterEnabled(filter)}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  filterEnabled === filter
                    ? 'bg-teal-600 text-white'
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Feature Flags List */}
        <div className="space-y-3">
          {filteredFlags.map(([key, flag]) => {
            const status = getFlagStatus(key);
            
            return (
              <div key={key} className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium text-white truncate">{key}</h3>
                      <div className={`text-sm font-medium ${status.color}`}>
                        {status.status.toUpperCase()}
                      </div>
                      {status.hasOverride && (
                        <div className="text-xs bg-yellow-600 text-black px-2 py-1 rounded">
                          OVERRIDE
                        </div>
                      )}
                    </div>
                    
                    <p className="text-sm text-white/70 mb-3">{flag.description}</p>
                    
                    <div className="flex flex-wrap gap-4 text-xs text-white/60">
                      {flag.rolloutPercentage !== undefined && (
                        <div className="flex items-center gap-1">
                          <Percent size={12} />
                          <span>Rollout: {flag.rolloutPercentage}%</span>
                        </div>
                      )}
                      
                      {flag.userGroups && flag.userGroups.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Users size={12} />
                          <span>Groups: {flag.userGroups.join(', ')}</span>
                        </div>
                      )}
                      
                      {flag.expiresAt && (
                        <div className="flex items-center gap-1">
                          <Clock size={12} />
                          <span>Expires: {new Date(flag.expiresAt).toLocaleDateString()}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-1">
                        <Info size={12} />
                        <span>Env: {flag.environment}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleOverride(key, !status.enabled)}
                      className="flex items-center gap-2 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm"
                    >
                      {status.enabled ? (
                        <ToggleRight className="text-green-400" size={16} />
                      ) : (
                        <ToggleLeft className="text-red-400" size={16} />
                      )}
                      Toggle
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredFlags.length === 0 && (
          <div className="text-center py-12 text-white/60">
            <AlertTriangle size={48} className="mx-auto mb-4 text-white/40" />
            <p>No feature flags match your search criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}
