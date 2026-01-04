"use client";

import { useState } from 'react';
import { useMusicTheory, useChordProgressions, useHarmonicAnalysis, useCompositionAssistant } from '@/hooks/useMusicTheory';
import ChordProgressionAnalyzer from './ChordProgressionAnalyzer';
import HarmonicAnalysisPanel from './HarmonicAnalysisPanel';
import CompositionAssistantPanel from './CompositionAssistantPanel';
import MusicTheoryKnowledgeBase from './MusicTheoryKnowledgeBase';
import { 
  Music, 
  Brain, 
  BookOpen, 
  Zap, 
  BarChart3, 
  Settings, 
  Plus,
  Play,
  Pause,
  Volume2,
  Activity,
  Lightbulb,
  Target
} from 'lucide-react';

export default function MusicTheoryInterface() {
  const [selectedView, setSelectedView] = useState<'progressions' | 'analysis' | 'composition' | 'knowledge' | 'settings'>('progressions');
  const [selectedKey, setSelectedKey] = useState<string>('C major');
  const [isPlaying, setIsPlaying] = useState(false);

  const { 
    isInitialized, 
    chordProgressions, 
    analysisSessions,
    generationRequests,
    knowledgeBase
  } = useMusicTheory();

  const { 
    selectedProgression,
    getCurrentProgression 
  } = useChordProgressions();

  const { 
    analysisResults,
    isAnalyzing 
  } = useHarmonicAnalysis();

  const { 
    activeRequests 
  } = useCompositionAssistant();

  const currentProgression = getCurrentProgression();

  const getViewIcon = (view: string) => {
    switch (view) {
      case 'progressions': return <Music size={16} />;
      case 'analysis': return <BarChart3 size={16} />;
      case 'composition': return <Brain size={16} />;
      case 'knowledge': return <BookOpen size={16} />;
      case 'settings': return <Settings size={16} />;
      default: return <Music size={16} />;
    }
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Music size={48} className="mx-auto mb-4 text-purple-400 animate-pulse" />
          <p className="text-white/60">Loading Music Theory Engine...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Music size={32} className="text-purple-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">Advanced Music Theory</h1>
            <p className="text-white/60">
              AI-powered music theory analysis, chord progression generation, and composition assistance
            </p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <div className="flex items-center gap-2 bg-purple-600/20 border border-purple-600/30 px-4 py-2 rounded-lg">
            <Target size={16} className="text-purple-400" />
            <div className="text-sm">
              <div className="text-white font-medium">{selectedKey}</div>
              <div className="text-white/60">Current Key</div>
            </div>
          </div>
          
          <button className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors">
            <Plus size={16} />
            New Analysis
          </button>
        </div>
      </div>

      {/* Playback Controls */}
      {currentProgression && (
        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handlePlayPause}
                className="w-12 h-12 bg-purple-600 hover:bg-purple-700 rounded-full flex items-center justify-center transition-colors"
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </button>
              
              <div>
                <h3 className="font-medium text-white">{currentProgression.name}</h3>
                <p className="text-sm text-white/60">
                  {currentProgression.chords.length} chords • {currentProgression.key.tonic.pitch_class} {currentProgression.key.mode.name}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Volume2 size={16} className="text-white/60" />
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  defaultValue="75"
                  className="w-24"
                />
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Activity size={16} className="text-green-400" />
                <span className="text-white/80">
                  Confidence: {Math.round(currentProgression.confidence * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Processing Status */}
      {(isAnalyzing || activeRequests.some(r => r.status === 'generating')) && (
        <div className="bg-blue-600/20 border border-blue-600/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={16} className="text-blue-400 animate-pulse" />
            <span className="font-medium text-white">
              {isAnalyzing ? 'Analyzing Harmony...' : 'Generating Composition...'}
            </span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: '60%' }}
            />
          </div>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-4 text-center">
          <Music size={24} className="mx-auto mb-2 text-purple-400" />
          <div className="text-2xl font-bold text-purple-400">{chordProgressions.length}</div>
          <div className="text-sm text-white/60">Progressions</div>
        </div>

        <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4 text-center">
          <BarChart3 size={24} className="mx-auto mb-2 text-blue-400" />
          <div className="text-2xl font-bold text-blue-400">{analysisSessions.length}</div>
          <div className="text-sm text-white/60">Analyses</div>
        </div>

        <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 text-center">
          <Brain size={24} className="mx-auto mb-2 text-green-400" />
          <div className="text-2xl font-bold text-green-400">{generationRequests.length}</div>
          <div className="text-sm text-white/60">AI Requests</div>
        </div>

        <div className="bg-orange-500/20 border border-orange-500/30 rounded-lg p-4 text-center">
          <BookOpen size={24} className="mx-auto mb-2 text-orange-400" />
          <div className="text-2xl font-bold text-orange-400">{knowledgeBase?.scales.length || 0}</div>
          <div className="text-sm text-white/60">Scales</div>
        </div>

        <div className="bg-pink-500/20 border border-pink-500/30 rounded-lg p-4 text-center">
          <Lightbulb size={24} className="mx-auto mb-2 text-pink-400" />
          <div className="text-2xl font-bold text-pink-400">{knowledgeBase?.chords.length || 0}</div>
          <div className="text-sm text-white/60">Chord Types</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {[
          { id: 'progressions', name: 'Chord Progressions', count: chordProgressions.length },
          { id: 'analysis', name: 'Harmonic Analysis', count: analysisSessions.length },
          { id: 'composition', name: 'AI Composition', count: activeRequests.length },
          { id: 'knowledge', name: 'Knowledge Base', count: knowledgeBase?.scales.length || 0 },
          { id: 'settings', name: 'Theory Settings', count: 0 },
        ].map((view) => (
          <button
            key={view.id}
            onClick={() => setSelectedView(view.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              selectedView === view.id
                ? 'bg-purple-600 text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            {getViewIcon(view.id)}
            <span>{view.name}</span>
            {view.count > 0 && (
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                {view.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="space-y-6">
        {selectedView === 'progressions' && (
          <ChordProgressionAnalyzer 
            progressions={chordProgressions}
            selectedProgression={selectedProgression}
            currentKey={selectedKey}
            onKeyChange={setSelectedKey}
          />
        )}

        {selectedView === 'analysis' && (
          <HarmonicAnalysisPanel 
            analysisSessions={analysisSessions}
            analysisResults={analysisResults}
            isAnalyzing={isAnalyzing}
            currentKey={selectedKey}
          />
        )}

        {selectedView === 'composition' && (
          <CompositionAssistantPanel 
            generationRequests={generationRequests}
            activeRequests={activeRequests}
            currentKey={selectedKey}
          />
        )}

        {selectedView === 'knowledge' && (
          <MusicTheoryKnowledgeBase 
            knowledgeBase={knowledgeBase}
          />
        )}

        {selectedView === 'settings' && (
          <div className="bg-white/5 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Music Theory Engine Settings</h3>
            
            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-white mb-3">Analysis Configuration</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-white/80 mb-2">Analysis Depth</label>
                    <select className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white">
                      <option value="basic">Basic</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced" selected>Advanced</option>
                      <option value="expert">Expert</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-white/80 mb-2">Temperament</label>
                    <select className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white">
                      <option value="equal" selected>Equal Temperament</option>
                      <option value="just">Just Intonation</option>
                      <option value="pythagorean">Pythagorean</option>
                      <option value="meantone">Meantone</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-white mb-3">Generation Settings</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white/80">Context Awareness</span>
                    <button className="w-12 h-6 bg-green-600 rounded-full relative">
                      <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5" />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-white/80">Style Recognition</span>
                    <button className="w-12 h-6 bg-blue-600 rounded-full relative">
                      <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5" />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-white/80">Voice Leading Analysis</span>
                    <button className="w-12 h-6 bg-purple-600 rounded-full relative">
                      <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5" />
                    </button>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-white mb-3">AI Composition</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-white/80 mb-2">Creativity Level</label>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      defaultValue="70"
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-white/60 mt-1">
                      <span>Conservative</span>
                      <span>Balanced</span>
                      <span>Creative</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-white/80 mb-2">Style Adherence</label>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      defaultValue="80"
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-white/60 mt-1">
                      <span>Flexible</span>
                      <span>Moderate</span>
                      <span>Strict</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-white/80 mb-2">Harmonic Complexity</label>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      defaultValue="60"
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-white/60 mt-1">
                      <span>Simple</span>
                      <span>Moderate</span>
                      <span>Complex</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Engine Status Indicator */}
      <div className="fixed bottom-6 right-6">
        <div className="bg-purple-600/20 border border-purple-600/30 rounded-lg p-3 flex items-center gap-2">
          <Activity size={16} className="text-purple-400" />
          <div className="text-sm">
            <div className="text-purple-400 font-medium">Theory Engine Active</div>
            <div className="text-white/60">
              {chordProgressions.length} progressions • {analysisSessions.length} analyses
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
