"use client";

import { useState } from 'react';
import { Brain, Zap, Settings, Play, Download, RefreshCw } from 'lucide-react';

interface AIProcessingPanelProps {
  onProcessingStart?: (type: string, params: any) => void;
}

export default function AIProcessingPanel({ onProcessingStart }: AIProcessingPanelProps) {
  const [selectedProcessing, setSelectedProcessing] = useState('enhance');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);

  const processingTypes = [
    {
      id: 'enhance',
      name: 'AI Enhancement',
      description: 'Automatically improve audio quality using AI',
      icon: '✨',
      params: {
        intensity: 0.7,
        preserveOriginal: true,
        targetLoudness: -14,
        stereoWidth: 0.8
      }
    },
    {
      id: 'denoise',
      name: 'Noise Reduction',
      description: 'Remove background noise and artifacts',
      icon: '🔇',
      params: {
        sensitivity: 0.6,
        preserveMusic: true,
        adaptiveMode: true,
        spectralGating: 0.5
      }
    },
    {
      id: 'master',
      name: 'AI Mastering',
      description: 'Professional mastering with AI analysis',
      icon: '🎛️',
      params: {
        genre: 'electronic',
        loudness: -14,
        dynamics: 0.7,
        brightness: 0.5
      }
    },
    {
      id: 'separate',
      name: 'Source Separation',
      description: 'Isolate vocals, drums, bass, and other instruments',
      icon: '🎵',
      params: {
        outputFormat: 'stems',
        quality: 'high',
        includeVocals: true,
        includeDrums: true,
        includeBass: true,
        includeOther: true
      }
    },
    {
      id: 'restore',
      name: 'Audio Restoration',
      description: 'Repair damaged or degraded audio',
      icon: '🔧',
      params: {
        repairClicks: true,
        repairClips: true,
        repairHum: true,
        enhanceClarity: 0.6
      }
    }
  ];

  const currentProcessing = processingTypes.find(p => p.id === selectedProcessing);

  const handleStartProcessing = async () => {
    if (!currentProcessing) return;

    setIsProcessing(true);
    setProcessingProgress(0);

    // Simulate AI processing
    const interval = setInterval(() => {
      setProcessingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsProcessing(false);
          return 100;
        }
        return prev + Math.random() * 10;
      });
    }, 500);

    if (onProcessingStart) {
      onProcessingStart(selectedProcessing, currentProcessing.params);
    }
  };

  const renderProcessingParams = (processing: any) => {
    switch (processing.id) {
      case 'enhance':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-white/80 mb-2">Enhancement Intensity</label>
              <input type="range" min="0" max="1" step="0.1" defaultValue="0.7" className="w-full" />
            </div>
            <div>
              <label className="block text-sm text-white/80 mb-2">Target Loudness (LUFS)</label>
              <input type="range" min="-23" max="-6" step="1" defaultValue="-14" className="w-full" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="rounded" />
              <span className="text-white/80 text-sm">Preserve original dynamics</span>
            </div>
          </div>
        );

      case 'denoise':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-white/80 mb-2">Noise Sensitivity</label>
              <input type="range" min="0" max="1" step="0.1" defaultValue="0.6" className="w-full" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="rounded" />
              <span className="text-white/80 text-sm">Preserve musical content</span>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="rounded" />
              <span className="text-white/80 text-sm">Adaptive mode</span>
            </div>
          </div>
        );

      case 'master':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-white/80 mb-2">Genre</label>
              <select className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white">
                <option value="electronic">Electronic</option>
                <option value="rock">Rock</option>
                <option value="pop">Pop</option>
                <option value="hip-hop">Hip Hop</option>
                <option value="jazz">Jazz</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-white/80 mb-2">Target Loudness (LUFS)</label>
              <input type="range" min="-23" max="-6" step="1" defaultValue="-14" className="w-full" />
            </div>
            <div>
              <label className="block text-sm text-white/80 mb-2">Dynamic Range</label>
              <input type="range" min="0" max="1" step="0.1" defaultValue="0.7" className="w-full" />
            </div>
          </div>
        );

      case 'separate':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-white/80 mb-2">Output Quality</label>
              <select className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white">
                <option value="high">High Quality</option>
                <option value="medium">Medium Quality</option>
                <option value="fast">Fast Processing</option>
              </select>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="rounded" />
                <span className="text-white/80 text-sm">Extract Vocals</span>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="rounded" />
                <span className="text-white/80 text-sm">Extract Drums</span>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="rounded" />
                <span className="text-white/80 text-sm">Extract Bass</span>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="rounded" />
                <span className="text-white/80 text-sm">Extract Other Instruments</span>
              </div>
            </div>
          </div>
        );

      case 'restore':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="rounded" />
                <span className="text-white/80 text-sm">Repair clicks and pops</span>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="rounded" />
                <span className="text-white/80 text-sm">Repair clipping</span>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="rounded" />
                <span className="text-white/80 text-sm">Remove hum and buzz</span>
              </div>
            </div>
            <div>
              <label className="block text-sm text-white/80 mb-2">Clarity Enhancement</label>
              <input type="range" min="0" max="1" step="0.1" defaultValue="0.6" className="w-full" />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Brain size={20} className="text-purple-400" />
          AI Audio Processing
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-white/60">Powered by Neural Networks</span>
          <Zap size={16} className="text-yellow-400" />
        </div>
      </div>

      {/* Processing Type Selection */}
      <div className="bg-white/5 rounded-lg p-6">
        <h4 className="text-white font-medium mb-4">Select Processing Type</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {processingTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedProcessing(type.id)}
              className={`p-4 rounded-lg text-left transition-all ${
                selectedProcessing === type.id
                  ? 'bg-purple-600/20 border-2 border-purple-500'
                  : 'bg-white/5 hover:bg-white/10 border-2 border-transparent'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{type.icon}</span>
                <h5 className="font-medium text-white">{type.name}</h5>
              </div>
              <p className="text-white/70 text-sm">{type.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Processing Parameters */}
      {currentProcessing && (
        <div className="bg-white/5 rounded-lg p-6">
          <h4 className="text-white font-medium mb-4">{currentProcessing.name} Settings</h4>
          {renderProcessingParams(currentProcessing)}
        </div>
      )}

      {/* Processing Controls */}
      <div className="bg-white/5 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-white font-medium">Processing Controls</h4>
          <div className="flex items-center gap-2">
            <button
              onClick={handleStartProcessing}
              disabled={isProcessing}
              className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-lg text-white font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Play size={16} />
                  Start Processing
                </>
              )}
            </button>
          </div>
        </div>

        {isProcessing && (
          <div className="space-y-3">
            <div className="flex justify-between text-sm text-white/80">
              <span>Processing {currentProcessing?.name}...</span>
              <span>{Math.round(processingProgress)}%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <div 
                className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${processingProgress}%` }}
              />
            </div>
          </div>
        )}

        {processingProgress === 100 && !isProcessing && (
          <div className="bg-green-600/20 border border-green-600/30 rounded-lg p-4 mt-4">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="text-green-400 font-medium">Processing Complete!</h5>
                <p className="text-white/80 text-sm">Your audio has been processed successfully.</p>
              </div>
              <button className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-white flex items-center gap-2 transition-colors">
                <Download size={16} />
                Download
              </button>
            </div>
          </div>
        )}
      </div>

      {/* AI Processing Info */}
      <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-600/30 rounded-lg p-6">
        <h4 className="text-white font-medium mb-4">AI Processing Features</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <Brain size={16} className="text-purple-400 mt-0.5" />
            <div>
              <div className="text-white font-medium">Neural Enhancement</div>
              <div className="text-white/80 text-sm">
                Advanced neural networks trained on millions of audio samples
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Zap size={16} className="text-yellow-400 mt-0.5" />
            <div>
              <div className="text-white font-medium">Real-time Processing</div>
              <div className="text-white/80 text-sm">
                GPU-accelerated processing for fast results
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
