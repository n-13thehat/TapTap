"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  AdvancedEffectsProcessor, 
  AdvancedAudioEffect, 
  EffectParameter, 
  EffectPreset 
} from '@/lib/audio/effects/AdvancedEffectsProcessor';
import {
  Sliders,
  Power,
  Settings,
  Save,
  FolderOpen,
  Download,
  Upload,
  Copy,
  Trash2,
  RotateCcw,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Zap,
  Cpu,
  Clock,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  MoreHorizontal,
  Star,
  Heart,
  Share2,
  Info,
  AlertTriangle,
  CheckCircle,
  Maximize2,
  Minimize2,
  Grid,
  List,
  Filter,
  Search,
  Shuffle,
  Target,
  Layers,
  Activity
} from 'lucide-react';

interface ProfessionalEffectsRackProps {
  processor: AdvancedEffectsProcessor;
  className?: string;
  onEffectChange?: (effectId: string, parameter: string, value: number) => void;
}

type ViewMode = 'rack' | 'grid' | 'list';
type EffectSize = 'compact' | 'normal' | 'expanded';

export default function ProfessionalEffectsRack({ 
  processor, 
  className = '', 
  onEffectChange 
}: ProfessionalEffectsRackProps) {
  const [effects, setEffects] = useState<AdvancedAudioEffect[]>([]);
  const [effectChain, setEffectChain] = useState<string[]>([]);
  const [selectedEffect, setSelectedEffect] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('rack');
  const [effectSize, setEffectSize] = useState<EffectSize>('normal');
  const [showPresets, setShowPresets] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [cpuUsage, setCpuUsage] = useState(0);
  const [totalLatency, setTotalLatency] = useState(0);
  const [draggedEffect, setDraggedEffect] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Load effects and setup event handlers
  useEffect(() => {
    const loadEffects = () => {
      setEffects(processor.getEffects());
      setEffectChain(processor.getEffectChain());
    };

    loadEffects();

    // Setup event handlers
    processor.setEventHandlers({
      onEffectChange: (effectId, parameter, value) => {
        loadEffects();
        if (onEffectChange) {
          onEffectChange(effectId, parameter, value);
        }
      },
      onCPUUsageChange: setCpuUsage,
      onLatencyChange: setTotalLatency,
    });

    // Update every second
    const interval = setInterval(loadEffects, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [processor, onEffectChange]);

  // Filter effects based on search
  const filteredEffects = useMemo(() => {
    if (!searchQuery) return effects;
    
    const query = searchQuery.toLowerCase();
    return effects.filter(effect => 
      effect.name.toLowerCase().includes(query) ||
      effect.type.toLowerCase().includes(query) ||
      effect.category.toLowerCase().includes(query)
    );
  }, [effects, searchQuery]);

  // Handle effect parameter changes
  const handleParameterChange = useCallback((effectId: string, parameterId: string, value: number) => {
    processor.setEffectParameter(effectId, parameterId, value);
  }, [processor]);

  // Handle effect enable/disable
  const handleEffectToggle = useCallback((effectId: string) => {
    const effect = effects.find(e => e.id === effectId);
    if (effect) {
      if (effect.enabled) {
        processor.disableEffect(effectId);
      } else {
        processor.enableEffect(effectId);
      }
    }
  }, [processor, effects]);

  // Handle effect bypass
  const handleEffectBypass = useCallback((effectId: string) => {
    const effect = effects.find(e => e.id === effectId);
    if (effect) {
      processor.bypassEffect(effectId, !effect.bypassed);
    }
  }, [processor, effects]);

  // Handle preset loading
  const handleLoadPreset = useCallback((effectId: string, presetId: string) => {
    processor.loadPreset(effectId, presetId);
    setShowPresets(null);
  }, [processor]);

  // Handle drag and drop
  const handleDragStart = useCallback((e: React.DragEvent, effectId: string) => {
    setDraggedEffect(effectId);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedEffect) {
      const fromIndex = effectChain.indexOf(draggedEffect);
      if (fromIndex !== -1 && fromIndex !== dropIndex) {
        processor.moveEffect(fromIndex, dropIndex);
      }
    }
    
    setDraggedEffect(null);
    setDragOverIndex(null);
  }, [draggedEffect, effectChain, processor]);

  // Format parameter value
  const formatParameterValue = useCallback((parameter: EffectParameter) => {
    const { value, unit, step } = parameter;
    const decimals = step < 1 ? 2 : step < 0.1 ? 3 : 1;
    return `${value.toFixed(decimals)}${unit}`;
  }, []);

  // Get parameter display value (0-1 for sliders)
  const getParameterDisplayValue = useCallback((parameter: EffectParameter) => {
    return (parameter.value - parameter.min) / (parameter.max - parameter.min);
  }, []);

  // Set parameter from display value (0-1 from sliders)
  const setParameterFromDisplayValue = useCallback((parameter: EffectParameter, displayValue: number) => {
    return parameter.min + (displayValue * (parameter.max - parameter.min));
  }, []);

  // Render parameter control
  const renderParameterControl = useCallback((effect: AdvancedAudioEffect, parameter: EffectParameter) => {
    const displayValue = getParameterDisplayValue(parameter);
    
    return (
      <div key={parameter.id} className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <label className="text-white/80 text-sm font-medium">{parameter.name}</label>
          <span className="text-white/60 text-xs font-mono">
            {formatParameterValue(parameter)}
          </span>
        </div>
        
        <div className="relative">
          <input
            type="range"
            min="0"
            max="1"
            step="0.001"
            value={displayValue}
            onChange={(e) => {
              const newValue = setParameterFromDisplayValue(parameter, parseFloat(e.target.value));
              handleParameterChange(effect.id, parameter.id, newValue);
            }}
            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
          />
          
          {/* Automation indicator */}
          {parameter.automation?.enabled && (
            <div className="absolute top-0 right-0 w-2 h-2 bg-green-400 rounded-full" />
          )}
          
          {/* Modulation indicator */}
          {parameter.modulation && (
            <div className="absolute top-0 right-2 w-2 h-2 bg-blue-400 rounded-full" />
          )}
        </div>
        
        <div className="flex items-center justify-between mt-1 text-xs text-white/40">
          <span>{parameter.min}{parameter.unit}</span>
          <span>{parameter.max}{parameter.unit}</span>
        </div>
      </div>
    );
  }, [getParameterDisplayValue, setParameterFromDisplayValue, formatParameterValue, handleParameterChange]);

  // Render effect preset selector
  const renderPresetSelector = useCallback((effect: AdvancedAudioEffect) => {
    if (showPresets !== effect.id) return null;

    return (
      <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-black/90 backdrop-blur-md border border-white/20 rounded-lg shadow-xl max-h-64 overflow-y-auto">
        <div className="p-3 border-b border-white/10">
          <h4 className="text-white font-medium">Presets</h4>
        </div>
        
        <div className="p-2">
          {effect.presets.map(preset => (
            <button
              key={preset.id}
              onClick={() => handleLoadPreset(effect.id, preset.id)}
              className="w-full text-left p-3 rounded-lg hover:bg-white/10 transition-colors group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-white font-medium">{preset.name}</span>
                <div className="flex items-center gap-1">
                  <Star size={12} className="text-yellow-400" />
                  <span className="text-white/60 text-xs">{preset.rating}</span>
                </div>
              </div>
              
              <p className="text-white/60 text-sm mb-2">{preset.description}</p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {preset.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="px-2 py-1 bg-white/10 rounded text-xs text-white/60">
                      {tag}
                    </span>
                  ))}
                </div>
                
                <div className="flex items-center gap-1 text-xs text-white/40">
                  <Download size={10} />
                  <span>{preset.downloads}</span>
                </div>
              </div>
            </button>
          ))}
          
          {effect.presets.length === 0 && (
            <div className="text-center py-6 text-white/40">
              <Settings size={24} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No presets available</p>
            </div>
          )}
        </div>
      </div>
    );
  }, [showPresets, handleLoadPreset]);

  // Render effect unit
  const renderEffectUnit = useCallback((effect: AdvancedAudioEffect, index: number) => {
    const isSelected = selectedEffect === effect.id;
    const isDraggedOver = dragOverIndex === index;
    const isEnabled = effect.enabled && !effect.bypassed;

    return (
      <div
        key={effect.id}
        draggable
        onDragStart={(e) => handleDragStart(e, effect.id)}
        onDragOver={(e) => handleDragOver(e, index)}
        onDrop={(e) => handleDrop(e, index)}
        className={`relative bg-gradient-to-br from-gray-900 to-gray-800 border rounded-lg transition-all duration-200 ${
          isSelected 
            ? 'border-green-400 shadow-lg shadow-green-400/20' 
            : isEnabled
            ? 'border-white/20 hover:border-white/40'
            : 'border-white/10 opacity-60'
        } ${isDraggedOver ? 'border-blue-400' : ''} ${
          effectSize === 'compact' ? 'p-3' : effectSize === 'expanded' ? 'p-6' : 'p-4'
        }`}
        onClick={() => setSelectedEffect(isSelected ? null : effect.id)}
      >
        {/* Effect header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEffectToggle(effect.id);
              }}
              className={`p-1 rounded transition-colors ${
                effect.enabled ? 'text-green-400 hover:text-green-300' : 'text-white/40 hover:text-white/60'
              }`}
            >
              <Power size={16} />
            </button>
            
            <div>
              <h3 className="text-white font-medium text-sm">{effect.name}</h3>
              <p className="text-white/60 text-xs">{effect.category}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {/* CPU usage indicator */}
            {effect.cpuUsage > 0 && (
              <div className="flex items-center gap-1 text-xs text-white/60">
                <Cpu size={10} />
                <span>{effect.cpuUsage.toFixed(1)}%</span>
              </div>
            )}
            
            {/* Latency indicator */}
            {effect.latency > 0 && (
              <div className="flex items-center gap-1 text-xs text-white/60">
                <Clock size={10} />
                <span>{effect.latency.toFixed(1)}ms</span>
              </div>
            )}
            
            {/* AI indicator */}
            {effect.aiAssisted && (
              <div className="p-1 bg-purple-600/20 rounded text-purple-400">
                <Zap size={10} />
              </div>
            )}
            
            {/* Bypass button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEffectBypass(effect.id);
              }}
              className={`p-1 rounded transition-colors ${
                effect.bypassed ? 'text-yellow-400 hover:text-yellow-300' : 'text-white/40 hover:text-white/60'
              }`}
              title={effect.bypassed ? 'Bypassed' : 'Active'}
            >
              {effect.bypassed ? <VolumeX size={12} /> : <Volume2 size={12} />}
            </button>
            
            {/* Preset selector */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPresets(showPresets === effect.id ? null : effect.id);
                }}
                className="p-1 rounded text-white/40 hover:text-white/60 transition-colors"
              >
                <FolderOpen size={12} />
              </button>
              
              {renderPresetSelector(effect)}
            </div>
            
            {/* More options */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Show more options menu
              }}
              className="p-1 rounded text-white/40 hover:text-white/60 transition-colors"
            >
              <MoreHorizontal size={12} />
            </button>
          </div>
        </div>

        {/* Effect parameters */}
        {(isSelected || effectSize === 'expanded') && (
          <div className="space-y-2">
            {effect.parameters.slice(0, effectSize === 'compact' ? 3 : effectSize === 'expanded' ? 12 : 6).map(parameter => 
              renderParameterControl(effect, parameter)
            )}
            
            {effect.parameters.length > 6 && effectSize !== 'expanded' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEffectSize('expanded');
                }}
                className="w-full py-2 text-white/60 hover:text-white text-sm transition-colors"
              >
                Show {effect.parameters.length - 6} more parameters...
              </button>
            )}
          </div>
        )}

        {/* Wet/Dry mix */}
        {(isSelected || effectSize === 'expanded') && (
          <div className="mt-4 pt-3 border-t border-white/10">
            <div className="flex items-center justify-between mb-2">
              <label className="text-white/80 text-sm">Wet/Dry Mix</label>
              <span className="text-white/60 text-xs">{(effect.wetDryMix * 100).toFixed(0)}%</span>
            </div>
            
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={effect.wetDryMix}
              onChange={(e) => {
                // This would need to be implemented in the processor
                console.log('Wet/Dry mix change:', parseFloat(e.target.value));
              }}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        )}

        {/* Effect quality indicator */}
        <div className="absolute top-2 right-2">
          <div className={`w-2 h-2 rounded-full ${
            effect.quality === 'ultra' ? 'bg-green-400' :
            effect.quality === 'high' ? 'bg-blue-400' :
            effect.quality === 'good' ? 'bg-yellow-400' :
            'bg-gray-400'
          }`} title={`Quality: ${effect.quality}`} />
        </div>
      </div>
    );
  }, [
    selectedEffect, dragOverIndex, effectSize, handleDragStart, handleDragOver, handleDrop,
    handleEffectToggle, handleEffectBypass, showPresets, renderPresetSelector, renderParameterControl
  ]);

  return (
    <div className={`bg-black/90 backdrop-blur-md border border-white/10 rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sliders size={20} className="text-green-400" />
            Professional Effects Rack
          </h2>
          
          <div className="flex items-center gap-2">
            {/* Performance indicators */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1 text-white/60">
                <Cpu size={14} />
                <span>{cpuUsage.toFixed(1)}%</span>
              </div>
              
              <div className="flex items-center gap-1 text-white/60">
                <Clock size={14} />
                <span>{totalLatency.toFixed(1)}ms</span>
              </div>
            </div>
            
            {/* View mode selector */}
            <div className="flex items-center gap-1 bg-white/10 rounded-lg p-1">
              {[
                { mode: 'rack' as ViewMode, icon: Layers },
                { mode: 'grid' as ViewMode, icon: Grid },
                { mode: 'list' as ViewMode, icon: List },
              ].map(({ mode, icon: Icon }) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`p-1 rounded transition-colors ${
                    viewMode === mode ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white'
                  }`}
                >
                  <Icon size={14} />
                </button>
              ))}
            </div>
            
            {/* Effect size selector */}
            <div className="flex items-center gap-1 bg-white/10 rounded-lg p-1">
              {[
                { size: 'compact' as EffectSize, icon: Minimize2 },
                { size: 'normal' as EffectSize, icon: Target },
                { size: 'expanded' as EffectSize, icon: Maximize2 },
              ].map(({ size, icon: Icon }) => (
                <button
                  key={size}
                  onClick={() => setEffectSize(size)}
                  className={`p-1 rounded transition-colors ${
                    effectSize === size ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white'
                  }`}
                >
                  <Icon size={14} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Search and filters */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search effects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-green-400"
            />
          </div>
          
          <button className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white/60 text-sm transition-colors">
            <Filter size={14} className="inline mr-1" />
            Filter
          </button>
          
          <button className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white text-sm transition-colors">
            <Plus size={14} className="inline mr-1" />
            Add Effect
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-h-96 overflow-y-auto">
        <div className="space-y-4">
          {filteredEffects.map((effect, index) => renderEffectUnit(effect, index))}
          
          {filteredEffects.length === 0 && (
            <div className="text-center py-12 text-white/60">
              <Sliders size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No effects found</p>
              <p className="text-sm">Try adjusting your search or add some effects</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
