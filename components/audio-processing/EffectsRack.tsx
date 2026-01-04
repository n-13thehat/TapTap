"use client";

import { useState } from 'react';
import { Sliders, Power, Settings, Plus, Trash2, RotateCcw } from 'lucide-react';

type EffectParams = Record<string, number>;

interface EffectConfig {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  params: EffectParams;
}

interface EffectsRackProps {
  onEffectChange?: (effectId: string, params: any) => void;
}

export default function EffectsRack({ onEffectChange }: EffectsRackProps) {
  const [effects, setEffects] = useState<EffectConfig[]>([
    {
      id: 'eq',
      name: 'Parametric EQ',
      type: 'equalizer',
      enabled: true,
      params: {
        lowGain: 0,
        midGain: 2,
        highGain: -1,
        lowFreq: 100,
        midFreq: 1000,
        highFreq: 8000
      }
    },
    {
      id: 'compressor',
      name: 'Compressor',
      type: 'dynamics',
      enabled: true,
      params: {
        threshold: -12,
        ratio: 4,
        attack: 10,
        release: 100,
        makeupGain: 3
      }
    },
    {
      id: 'reverb',
      name: 'Hall Reverb',
      type: 'spatial',
      enabled: false,
      params: {
        roomSize: 0.7,
        damping: 0.5,
        wetLevel: 0.3,
        dryLevel: 0.8,
        predelay: 20
      }
    }
  ]);

  const availableEffects = [
    { id: 'delay', name: 'Delay', type: 'time' },
    { id: 'chorus', name: 'Chorus', type: 'modulation' },
    { id: 'distortion', name: 'Distortion', type: 'saturation' },
    { id: 'limiter', name: 'Limiter', type: 'dynamics' },
    { id: 'phaser', name: 'Phaser', type: 'modulation' },
    { id: 'flanger', name: 'Flanger', type: 'modulation' }
  ];

  const toggleEffect = (effectId: string) => {
    setEffects(prev => prev.map(effect => 
      effect.id === effectId 
        ? { ...effect, enabled: !effect.enabled }
        : effect
    ));
  };

  const updateEffectParam = (effectId: string, paramName: string, value: number) => {
    setEffects(prev => prev.map(effect => 
      effect.id === effectId 
        ? { ...effect, params: { ...effect.params, [paramName]: value } }
        : effect
    ));

    if (onEffectChange) {
      const effect = effects.find(e => e.id === effectId);
      if (effect) {
        onEffectChange(effectId, { ...effect.params, [paramName]: value });
      }
    }
  };

  const removeEffect = (effectId: string) => {
    setEffects(prev => prev.filter(effect => effect.id !== effectId));
  };

  const addEffect = (effectType: { id: string; name: string; type: string }) => {
    const newEffect = {
      id: `${effectType.id}_${Date.now()}`,
      name: effectType.name,
      type: effectType.type,
      enabled: true,
      params: getDefaultParams(effectType.id)
    };
    setEffects(prev => [...prev, newEffect]);
  };

  const getDefaultParams = (effectType: string): EffectParams => {
    switch (effectType) {
      case 'delay':
        return { time: 250, feedback: 0.3, wetLevel: 0.2 };
      case 'chorus':
        return { rate: 1.5, depth: 0.3, wetLevel: 0.5 };
      case 'distortion':
        return { drive: 0.5, tone: 0.5, level: 0.8 };
      case 'limiter':
        return { threshold: -1, release: 50 };
      case 'phaser':
        return { rate: 0.5, depth: 0.7, feedback: 0.3 };
      case 'flanger':
        return { rate: 0.3, depth: 0.8, feedback: 0.4 };
      default:
        return {};
    }
  };

  const renderEffectControls = (effect: EffectConfig) => {
    switch (effect.type) {
      case 'equalizer':
        return (
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-white/60 mb-1">Low ({effect.params.lowFreq}Hz)</label>
              <input
                type="range"
                min="-12"
                max="12"
                step="0.1"
                value={effect.params.lowGain}
                onChange={(e) => updateEffectParam(effect.id, 'lowGain', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-white/80 text-center">{effect.params.lowGain.toFixed(1)}dB</div>
            </div>
            <div>
              <label className="block text-xs text-white/60 mb-1">Mid ({effect.params.midFreq}Hz)</label>
              <input
                type="range"
                min="-12"
                max="12"
                step="0.1"
                value={effect.params.midGain}
                onChange={(e) => updateEffectParam(effect.id, 'midGain', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-white/80 text-center">{effect.params.midGain.toFixed(1)}dB</div>
            </div>
            <div>
              <label className="block text-xs text-white/60 mb-1">High ({effect.params.highFreq}Hz)</label>
              <input
                type="range"
                min="-12"
                max="12"
                step="0.1"
                value={effect.params.highGain}
                onChange={(e) => updateEffectParam(effect.id, 'highGain', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-white/80 text-center">{effect.params.highGain.toFixed(1)}dB</div>
            </div>
          </div>
        );

      case 'dynamics':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-white/60 mb-1">Threshold</label>
              <input
                type="range"
                min="-40"
                max="0"
                step="0.1"
                value={effect.params.threshold}
                onChange={(e) => updateEffectParam(effect.id, 'threshold', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-white/80 text-center">{effect.params.threshold}dB</div>
            </div>
            <div>
              <label className="block text-xs text-white/60 mb-1">Ratio</label>
              <input
                type="range"
                min="1"
                max="20"
                step="0.1"
                value={effect.params.ratio}
                onChange={(e) => updateEffectParam(effect.id, 'ratio', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-white/80 text-center">{effect.params.ratio}:1</div>
            </div>
            <div>
              <label className="block text-xs text-white/60 mb-1">Attack</label>
              <input
                type="range"
                min="0.1"
                max="100"
                step="0.1"
                value={effect.params.attack}
                onChange={(e) => updateEffectParam(effect.id, 'attack', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-white/80 text-center">{effect.params.attack}ms</div>
            </div>
            <div>
              <label className="block text-xs text-white/60 mb-1">Release</label>
              <input
                type="range"
                min="10"
                max="1000"
                step="1"
                value={effect.params.release}
                onChange={(e) => updateEffectParam(effect.id, 'release', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-white/80 text-center">{effect.params.release}ms</div>
            </div>
          </div>
        );

      case 'spatial':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-white/60 mb-1">Room Size</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={effect.params.roomSize}
                onChange={(e) => updateEffectParam(effect.id, 'roomSize', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-white/80 text-center">{Math.round(effect.params.roomSize * 100)}%</div>
            </div>
            <div>
              <label className="block text-xs text-white/60 mb-1">Damping</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={effect.params.damping}
                onChange={(e) => updateEffectParam(effect.id, 'damping', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-white/80 text-center">{Math.round(effect.params.damping * 100)}%</div>
            </div>
            <div>
              <label className="block text-xs text-white/60 mb-1">Wet Level</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={effect.params.wetLevel}
                onChange={(e) => updateEffectParam(effect.id, 'wetLevel', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-white/80 text-center">{Math.round(effect.params.wetLevel * 100)}%</div>
            </div>
            <div>
              <label className="block text-xs text-white/60 mb-1">Dry Level</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={effect.params.dryLevel}
                onChange={(e) => updateEffectParam(effect.id, 'dryLevel', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-white/80 text-center">{Math.round(effect.params.dryLevel * 100)}%</div>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center text-white/60 py-4">
            Effect controls not implemented
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Sliders size={20} className="text-green-400" />
          Effects Rack
        </h3>
        <div className="relative">
          <select
            onChange={(e) => {
              const effectType = availableEffects.find(ef => ef.id === e.target.value);
              if (effectType) {
                addEffect(effectType);
                e.target.value = '';
              }
            }}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-white transition-colors"
            defaultValue=""
          >
            <option value="" disabled>Add Effect</option>
            {availableEffects.map((effect) => (
              <option key={effect.id} value={effect.id} className="bg-gray-800">
                {effect.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {effects.map((effect, index) => (
          <div key={effect.id} className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleEffect(effect.id)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                    effect.enabled 
                      ? 'bg-green-600 text-white' 
                      : 'bg-white/20 text-white/60'
                  }`}
                >
                  <Power size={14} />
                </button>
                <div>
                  <h4 className="text-white font-medium">{effect.name}</h4>
                  <div className="text-white/60 text-sm capitalize">{effect.type}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    // Reset to defaults
                    const defaultParams = getDefaultParams(effect.type);
                    setEffects(prev => prev.map(e => 
                      e.id === effect.id ? { ...e, params: defaultParams } : e
                    ));
                  }}
                  className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded flex items-center justify-center transition-colors"
                >
                  <RotateCcw size={14} />
                </button>
                <button
                  onClick={() => removeEffect(effect.id)}
                  className="w-8 h-8 bg-red-600/20 hover:bg-red-600/40 rounded flex items-center justify-center transition-colors"
                >
                  <Trash2 size={14} className="text-red-400" />
                </button>
              </div>
            </div>

            {effect.enabled && (
              <div className="border-t border-white/10 pt-4">
                {renderEffectControls(effect)}
              </div>
            )}
          </div>
        ))}
      </div>

      {effects.length === 0 && (
        <div className="text-center py-8">
          <Sliders size={48} className="mx-auto mb-4 text-white/20" />
          <p className="text-white/60 mb-4">No effects loaded</p>
          <p className="text-white/40 text-sm">Add effects from the dropdown above</p>
        </div>
      )}
    </div>
  );
}
