"use client";

import { useState } from 'react';
import { BarChart3, Activity, Zap, Volume2 } from 'lucide-react';

interface AudioAnalysisPanelProps {
  audioData?: any;
}

export default function AudioAnalysisPanel({ audioData }: AudioAnalysisPanelProps) {
  const [analysisType, setAnalysisType] = useState('spectrum');

  const mockAnalysis = {
    spectrum: {
      frequencies: [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000],
      magnitudes: [0.2, 0.4, 0.8, 0.6, 0.9, 0.7, 0.5, 0.3, 0.2, 0.1]
    },
    dynamics: {
      peak: -3.2,
      rms: -18.4,
      lufs: -14.2,
      dynamicRange: 12.8
    },
    temporal: {
      tempo: 128,
      timeSignature: '4/4',
      key: 'C major',
      energy: 0.75
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <BarChart3 size={20} className="text-blue-400" />
          Audio Analysis
        </h3>
        <div className="flex gap-2">
          {['spectrum', 'dynamics', 'temporal'].map((type) => (
            <button
              key={type}
              onClick={() => setAnalysisType(type)}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                analysisType === type
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {analysisType === 'spectrum' && (
        <div className="bg-white/5 rounded-lg p-6">
          <h4 className="text-white font-medium mb-4">Frequency Spectrum</h4>
          <div className="flex items-end justify-between h-32 gap-1">
            {mockAnalysis.spectrum.magnitudes.map((magnitude, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t transition-all duration-500"
                  style={{ height: `${magnitude * 100}%` }}
                />
                <div className="text-xs text-white/60 mt-2 transform -rotate-45 origin-left">
                  {mockAnalysis.spectrum.frequencies[index]}Hz
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {analysisType === 'dynamics' && (
        <div className="bg-white/5 rounded-lg p-6">
          <h4 className="text-white font-medium mb-4">Dynamic Analysis</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{mockAnalysis.dynamics.peak}dB</div>
              <div className="text-sm text-white/60">Peak Level</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{mockAnalysis.dynamics.rms}dB</div>
              <div className="text-sm text-white/60">RMS Level</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{mockAnalysis.dynamics.lufs}</div>
              <div className="text-sm text-white/60">LUFS</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{mockAnalysis.dynamics.dynamicRange}</div>
              <div className="text-sm text-white/60">Dynamic Range</div>
            </div>
          </div>
        </div>
      )}

      {analysisType === 'temporal' && (
        <div className="bg-white/5 rounded-lg p-6">
          <h4 className="text-white font-medium mb-4">Temporal Analysis</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{mockAnalysis.temporal.tempo}</div>
              <div className="text-sm text-white/60">BPM</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-pink-400">{mockAnalysis.temporal.timeSignature}</div>
              <div className="text-sm text-white/60">Time Signature</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-400">{mockAnalysis.temporal.key}</div>
              <div className="text-sm text-white/60">Key</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400">{Math.round(mockAnalysis.temporal.energy * 100)}%</div>
              <div className="text-sm text-white/60">Energy</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
