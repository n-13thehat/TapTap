"use client";

import { useState } from 'react';
import { Headphones, Volume2, RotateCcw, Settings } from 'lucide-react';

interface SpatialAudioControlsProps {
  onSpatialChange?: (params: any) => void;
}

export default function SpatialAudioControls({ onSpatialChange }: SpatialAudioControlsProps) {
  const [spatialParams, setSpatialParams] = useState({
    enabled: true,
    roomSize: 0.7,
    distance: 0.5,
    azimuth: 0,
    elevation: 0,
    width: 0.8,
    depth: 0.6,
    height: 0.4,
    reverbLevel: 0.3,
    directLevel: 0.8
  });

  const updateParam = (param: string, value: number) => {
    const newParams = { ...spatialParams, [param]: value };
    setSpatialParams(newParams);
    if (onSpatialChange) {
      onSpatialChange(newParams);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Headphones size={20} className="text-purple-400" />
          Spatial Audio Controls
        </h3>
        <button
          onClick={() => updateParam('enabled', spatialParams.enabled ? 0 : 1)}
          className={`px-4 py-2 rounded-lg transition-colors ${
            spatialParams.enabled
              ? 'bg-purple-600 text-white'
              : 'bg-white/20 text-white/60'
          }`}
        >
          {spatialParams.enabled ? 'Enabled' : 'Disabled'}
        </button>
      </div>

      {spatialParams.enabled && (
        <>
          {/* 3D Position Controls */}
          <div className="bg-white/5 rounded-lg p-6">
            <h4 className="text-white font-medium mb-4">3D Position</h4>
            
            {/* Visual 3D Space */}
            <div className="relative w-full h-48 bg-gradient-to-b from-blue-900/20 to-purple-900/20 rounded-lg mb-6 overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 border-2 border-white/20 rounded-full relative">
                  <div
                    className="absolute w-4 h-4 bg-purple-500 rounded-full transform -translate-x-2 -translate-y-2"
                    style={{
                      left: `${50 + spatialParams.azimuth * 40}%`,
                      top: `${50 - spatialParams.elevation * 40}%`,
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-white/40 text-xs">
                    Listener
                  </div>
                </div>
              </div>
              <div className="absolute bottom-2 left-2 text-xs text-white/60">
                Azimuth: {Math.round(spatialParams.azimuth * 180)}° | 
                Elevation: {Math.round(spatialParams.elevation * 90)}°
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-white/80 mb-2">Azimuth (Left/Right)</label>
                <input
                  type="range"
                  min="-1"
                  max="1"
                  step="0.01"
                  value={spatialParams.azimuth}
                  onChange={(e) => updateParam('azimuth', parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="text-xs text-white/60 text-center mt-1">
                  {Math.round(spatialParams.azimuth * 180)}°
                </div>
              </div>

              <div>
                <label className="block text-sm text-white/80 mb-2">Elevation (Up/Down)</label>
                <input
                  type="range"
                  min="-1"
                  max="1"
                  step="0.01"
                  value={spatialParams.elevation}
                  onChange={(e) => updateParam('elevation', parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="text-xs text-white/60 text-center mt-1">
                  {Math.round(spatialParams.elevation * 90)}°
                </div>
              </div>

              <div>
                <label className="block text-sm text-white/80 mb-2">Distance</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={spatialParams.distance}
                  onChange={(e) => updateParam('distance', parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="text-xs text-white/60 text-center mt-1">
                  {Math.round(spatialParams.distance * 100)}%
                </div>
              </div>

              <div>
                <label className="block text-sm text-white/80 mb-2">Room Size</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={spatialParams.roomSize}
                  onChange={(e) => updateParam('roomSize', parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="text-xs text-white/60 text-center mt-1">
                  {Math.round(spatialParams.roomSize * 100)}%
                </div>
              </div>
            </div>
          </div>

          {/* Spatial Dimensions */}
          <div className="bg-white/5 rounded-lg p-6">
            <h4 className="text-white font-medium mb-4">Spatial Dimensions</h4>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-white/80 mb-2">Width</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={spatialParams.width}
                  onChange={(e) => updateParam('width', parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="text-xs text-white/60 text-center mt-1">
                  {Math.round(spatialParams.width * 100)}%
                </div>
              </div>

              <div>
                <label className="block text-sm text-white/80 mb-2">Depth</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={spatialParams.depth}
                  onChange={(e) => updateParam('depth', parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="text-xs text-white/60 text-center mt-1">
                  {Math.round(spatialParams.depth * 100)}%
                </div>
              </div>

              <div>
                <label className="block text-sm text-white/80 mb-2">Height</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={spatialParams.height}
                  onChange={(e) => updateParam('height', parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="text-xs text-white/60 text-center mt-1">
                  {Math.round(spatialParams.height * 100)}%
                </div>
              </div>
            </div>
          </div>

          {/* Audio Levels */}
          <div className="bg-white/5 rounded-lg p-6">
            <h4 className="text-white font-medium mb-4">Audio Levels</h4>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-white/80 mb-2">Direct Level</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={spatialParams.directLevel}
                  onChange={(e) => updateParam('directLevel', parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="text-xs text-white/60 text-center mt-1">
                  {Math.round(spatialParams.directLevel * 100)}%
                </div>
              </div>

              <div>
                <label className="block text-sm text-white/80 mb-2">Reverb Level</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={spatialParams.reverbLevel}
                  onChange={(e) => updateParam('reverbLevel', parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="text-xs text-white/60 text-center mt-1">
                  {Math.round(spatialParams.reverbLevel * 100)}%
                </div>
              </div>
            </div>
          </div>

          {/* Presets */}
          <div className="bg-white/5 rounded-lg p-6">
            <h4 className="text-white font-medium mb-4">Spatial Presets</h4>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { name: 'Concert Hall', params: { roomSize: 0.9, width: 0.8, depth: 0.9, height: 0.7, reverbLevel: 0.6 } },
                { name: 'Studio', params: { roomSize: 0.3, width: 0.6, depth: 0.4, height: 0.3, reverbLevel: 0.2 } },
                { name: 'Cathedral', params: { roomSize: 1.0, width: 0.9, depth: 1.0, height: 0.9, reverbLevel: 0.8 } },
                { name: 'Intimate', params: { roomSize: 0.2, width: 0.4, depth: 0.3, height: 0.2, reverbLevel: 0.1 } }
              ].map((preset, index) => (
                <button
                  key={index}
                  onClick={() => {
                    Object.entries(preset.params).forEach(([key, value]) => {
                      updateParam(key, value);
                    });
                  }}
                  className="bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg text-white text-sm transition-colors"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
