"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AdvancedAudioEffects, AudioEffect, EffectParameter, EffectPreset } from '@/lib/audio/effects/AdvancedAudioEffects';
import { 
  Sliders, 
  Power, 
  Settings, 
  RotateCcw, 
  Save, 
  Upload,
  Download,
  Copy,
  Trash2,
  ChevronDown,
  ChevronUp,
  Volume2,
  Cpu,
  Clock,
  Eye,
  EyeOff,
  Move,
  Plus,
  Minus
} from 'lucide-react';

interface AdvancedEffectsRackProps {
  audioContext?: AudioContext;
  onEffectsChange?: (effects: AdvancedAudioEffects) => void;
  className?: string;
}

interface EffectChainItem {
  id: string;
  effect: AudioEffect;
  expanded: boolean;
  visible: boolean;
}

export default function AdvancedEffectsRack({ 
  audioContext, 
  onEffectsChange, 
  className = '' 
}: AdvancedEffectsRackProps) {
  const effectsRef = useRef<AdvancedAudioEffects | null>(null);
  const [effectChain, setEffectChain] = useState<EffectChainItem[]>([]);
  const [availableEffects, setAvailableEffects] = useState<AudioEffect[]>([]);
  const [selectedEffect, setSelectedEffect] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    cpuUsage: [],
    latency: [],
    activeEffects: 0,
    totalEffects: 0
  });
  const [draggedEffect, setDraggedEffect] = useState<string | null>(null);

  // Initialize effects processor
  useEffect(() => {
    if (!audioContext) return;

    effectsRef.current = new AdvancedAudioEffects(audioContext);
    
    // Get all available effects
    const effects = effectsRef.current.getAllEffects();
    setAvailableEffects(effects);
    
    // Initialize empty chain
    setEffectChain([]);

    // Notify parent
    if (onEffectsChange) {
      onEffectsChange(effectsRef.current);
    }

    // Start performance monitoring
    const metricsInterval = setInterval(() => {
      if (effectsRef.current) {
        const metrics = effectsRef.current.getPerformanceMetrics();
        setPerformanceMetrics(metrics);
      }
    }, 100);

    return () => {
      clearInterval(metricsInterval);
      if (effectsRef.current) {
        effectsRef.current.disconnect();
      }
    };
  }, [audioContext, onEffectsChange]);

  // Add effect to chain
  const addEffectToChain = useCallback((effectId: string) => {
    if (!effectsRef.current) return;

    const effect = effectsRef.current.getEffect(effectId);
    if (!effect) return;

    // Create a copy for the chain
    const chainItem: EffectChainItem = {
      id: `${effectId}-${Date.now()}`,
      effect: { ...effect },
      expanded: true,
      visible: true
    };

    setEffectChain(prev => [...prev, chainItem]);
    setShowAddMenu(false);

    // Update effect chain order
    const newChainOrder = [...effectChain.map(item => item.id), chainItem.id];
    effectsRef.current.setEffectChainOrder(newChainOrder);
  }, [effectChain]);

  // Remove effect from chain
  const removeEffectFromChain = useCallback((chainItemId: string) => {
    setEffectChain(prev => prev.filter(item => item.id !== chainItemId));
    
    if (effectsRef.current) {
      const newChainOrder = effectChain
        .filter(item => item.id !== chainItemId)
        .map(item => item.id);
      effectsRef.current.setEffectChainOrder(newChainOrder);
    }
  }, [effectChain]);

  // Toggle effect enabled state
  const toggleEffect = useCallback((chainItemId: string) => {
    if (!effectsRef.current) return;

    setEffectChain(prev => prev.map(item => {
      if (item.id === chainItemId) {
        const newEnabled = !item.effect.enabled;
        item.effect.enabled = newEnabled;
        
        if (newEnabled) {
          effectsRef.current!.enableEffect(item.effect.id);
        } else {
          effectsRef.current!.disableEffect(item.effect.id);
        }
      }
      return item;
    }));
  }, []);

  // Toggle effect bypass
  const toggleBypass = useCallback((chainItemId: string) => {
    if (!effectsRef.current) return;

    setEffectChain(prev => prev.map(item => {
      if (item.id === chainItemId) {
        const newBypassed = !item.effect.bypassed;
        item.effect.bypassed = newBypassed;
        effectsRef.current!.bypassEffect(item.effect.id, newBypassed);
      }
      return item;
    }));
  }, []);

  // Update effect parameter
  const updateParameter = useCallback((chainItemId: string, parameterId: string, value: number) => {
    if (!effectsRef.current) return;

    setEffectChain(prev => prev.map(item => {
      if (item.id === chainItemId) {
        const parameter = item.effect.parameters.find(p => p.id === parameterId);
        if (parameter) {
          parameter.value = value;
          effectsRef.current!.setEffectParameter(item.effect.id, parameterId, value);
        }
      }
      return item;
    }));
  }, []);

  // Load preset
  const loadPreset = useCallback((chainItemId: string, presetId: string) => {
    if (!effectsRef.current) return;

    const chainItem = effectChain.find(item => item.id === chainItemId);
    if (!chainItem) return;

    effectsRef.current.loadPreset(chainItem.effect.id, presetId);
    
    // Update local state
    const preset = chainItem.effect.presets.find(p => p.id === presetId);
    if (preset) {
      setEffectChain(prev => prev.map(item => {
        if (item.id === chainItemId) {
          Object.entries(preset.parameters).forEach(([paramId, value]) => {
            const parameter = item.effect.parameters.find(p => p.id === paramId);
            if (parameter) {
              parameter.value = value;
            }
          });
        }
        return item;
      }));
    }
  }, [effectChain]);

  // Drag and drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, chainItemId: string) => {
    setDraggedEffect(chainItemId);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    
    if (!draggedEffect || draggedEffect === targetId) return;

    const draggedIndex = effectChain.findIndex(item => item.id === draggedEffect);
    const targetIndex = effectChain.findIndex(item => item.id === targetId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;

    // Reorder chain
    const newChain = [...effectChain];
    const [draggedItem] = newChain.splice(draggedIndex, 1);
    newChain.splice(targetIndex, 0, draggedItem);
    
    setEffectChain(newChain);
    setDraggedEffect(null);

    // Update effect processor
    if (effectsRef.current) {
      const newChainOrder = newChain.map(item => item.id);
      effectsRef.current.setEffectChainOrder(newChainOrder);
    }
  }, [draggedEffect, effectChain]);

  // Render parameter control
  const renderParameterControl = (chainItemId: string, parameter: EffectParameter) => {
    const formatValue = (value: number) => {
      if (parameter.unit === 'Hz' && value >= 1000) {
        return `${(value / 1000).toFixed(1)}k${parameter.unit}`;
      }
      return `${value.toFixed(parameter.step < 1 ? 2 : 0)}${parameter.unit}`;
    };

    return (
      <div key={parameter.id} className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-white/80 text-sm font-medium">
            {parameter.name}
          </label>
          <span className="text-white/60 text-xs font-mono">
            {formatValue(parameter.value)}
          </span>
        </div>
        <input
          type="range"
          min={parameter.min}
          max={parameter.max}
          step={parameter.step}
          value={parameter.value}
          onChange={(e) => updateParameter(chainItemId, parameter.id, Number(e.target.value))}
          className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
        />
      </div>
    );
  };

  // Render effect card
  const renderEffectCard = (chainItem: EffectChainItem, index: number) => {
    const { id, effect, expanded, visible } = chainItem;
    
    if (!visible) return null;

    return (
      <div
        key={id}
        draggable
        onDragStart={(e) => handleDragStart(e, id)}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, id)}
        className={`bg-white/5 rounded-lg border transition-all duration-200 ${
          effect.enabled && !effect.bypassed
            ? 'border-green-500/50 shadow-green-500/20 shadow-lg'
            : effect.enabled
            ? 'border-yellow-500/50'
            : 'border-white/10'
        } ${draggedEffect === id ? 'opacity-50' : ''}`}
      >
        {/* Effect Header */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => toggleEffect(id)}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  effect.enabled
                    ? 'bg-green-600 text-white'
                    : 'bg-white/20 text-white/60'
                }`}
                title={effect.enabled ? 'Disable effect' : 'Enable effect'}
              >
                <Power size={14} />
              </button>
              
              <div>
                <h3 className="text-white font-medium">{effect.name}</h3>
                <div className="flex items-center gap-2 text-xs text-white/60">
                  <span className="capitalize">{effect.category}</span>
                  {effect.bypassed && (
                    <span className="bg-yellow-600 px-2 py-0.5 rounded text-yellow-100">
                      BYPASSED
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Performance indicators */}
              <div className="flex items-center gap-1 text-xs text-white/60">
                <Cpu size={12} />
                <span>{effect.cpuUsage.toFixed(1)}%</span>
              </div>
              
              <div className="flex items-center gap-1 text-xs text-white/60">
                <Clock size={12} />
                <span>{effect.latency.toFixed(1)}ms</span>
              </div>

              {/* Bypass button */}
              <button
                onClick={() => toggleBypass(id)}
                className={`p-1 rounded transition-colors ${
                  effect.bypassed
                    ? 'bg-yellow-600 text-white'
                    : 'text-white/60 hover:text-white'
                }`}
                title={effect.bypassed ? 'Un-bypass' : 'Bypass'}
              >
                {effect.bypassed ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>

              {/* Expand/collapse */}
              <button
                onClick={() => {
                  setEffectChain(prev => prev.map(item =>
                    item.id === id ? { ...item, expanded: !item.expanded } : item
                  ));
                }}
                className="p-1 text-white/60 hover:text-white transition-colors"
              >
                {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {/* Remove button */}
              <button
                onClick={() => removeEffectFromChain(id)}
                className="p-1 text-red-400 hover:text-red-300 transition-colors"
                title="Remove effect"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Effect Controls */}
        {expanded && (
          <div className="p-4 space-y-4">
            {/* Presets */}
            {effect.presets.length > 0 && (
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Presets
                </label>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      loadPreset(id, e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="w-full bg-white/10 text-white rounded px-3 py-2 text-sm"
                  defaultValue=""
                >
                  <option value="" disabled>Select preset...</option>
                  {effect.presets.map(preset => (
                    <option key={preset.id} value={preset.id} className="bg-gray-800">
                      {preset.name} - {preset.description}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Parameters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {effect.parameters.map(parameter => 
                renderParameterControl(id, parameter)
              )}
            </div>

            {/* Wet/Dry Mix */}
            <div className="pt-4 border-t border-white/10">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-white/80 text-sm font-medium">
                    Wet/Dry Mix
                  </label>
                  <span className="text-white/60 text-xs font-mono">
                    {(effect.wetDryMix * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={effect.wetDryMix}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    setEffectChain(prev => prev.map(item =>
                      item.id === id ? { ...item, effect: { ...item.effect, wetDryMix: value } } : item
                    ));
                  }}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Sliders size={24} className="text-green-400" />
            Effects Rack
          </h2>
          
          {/* Performance metrics */}
          <div className="flex items-center gap-4 text-sm text-white/60">
            <div className="flex items-center gap-1">
              <Cpu size={14} />
              <span>{performanceMetrics.activeEffects}/{performanceMetrics.totalEffects}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Add effect button */}
          <div className="relative">
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-white flex items-center gap-2 transition-colors"
            >
              <Plus size={16} />
              Add Effect
            </button>

            {/* Add effect menu */}
            {showAddMenu && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-black/90 backdrop-blur-sm rounded-lg border border-white/10 shadow-xl z-50">
                <div className="p-2">
                  <h3 className="text-white font-medium mb-2 px-2">Available Effects</h3>
                  <div className="space-y-1 max-h-64 overflow-y-auto">
                    {availableEffects.map(effect => (
                      <button
                        key={effect.id}
                        onClick={() => addEffectToChain(effect.id)}
                        className="w-full text-left px-3 py-2 rounded text-white/80 hover:bg-white/10 transition-colors"
                      >
                        <div className="font-medium">{effect.name}</div>
                        <div className="text-xs text-white/60 capitalize">{effect.category}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Chain controls */}
          <button
            onClick={() => {
              setEffectChain([]);
              if (effectsRef.current) {
                effectsRef.current.setEffectChainOrder([]);
              }
            }}
            className="p-2 text-white/60 hover:text-white transition-colors"
            title="Clear all effects"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Effect Chain */}
      <div className="space-y-3">
        {effectChain.length === 0 ? (
          <div className="text-center py-12 text-white/60">
            <Sliders size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No Effects in Chain</p>
            <p className="text-sm">Add effects to start processing audio</p>
          </div>
        ) : (
          effectChain.map((chainItem, index) => renderEffectCard(chainItem, index))
        )}
      </div>

      {/* Click outside to close menu */}
      {showAddMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowAddMenu(false)}
        />
      )}
    </div>
  );
}
