"use client";

import { useState } from 'react';
import { GenerationRequest } from '@/lib/music-theory/types';
import { useCompositionAssistant } from '@/hooks/useMusicTheory';
import { 
  Brain, 
  Music, 
  Users, 
  Lightbulb, 
  Zap,
  Play,
  Download,
  RefreshCw,
  Settings,
  CheckCircle,
  Clock,
  AlertCircle,
  Activity
} from 'lucide-react';

interface CompositionAssistantPanelProps {
  generationRequests: GenerationRequest[];
  activeRequests: GenerationRequest[];
  currentKey: string;
}

export default function CompositionAssistantPanel({
  generationRequests,
  activeRequests,
  currentKey
}: CompositionAssistantPanelProps) {
  const [selectedType, setSelectedType] = useState<'chord_progression' | 'melody' | 'harmony' | 'complete_piece'>('chord_progression');
  const [generationParams, setGenerationParams] = useState({
    key: currentKey,
    length: 8,
    style: 'pop',
    complexity: 0.5,
    tempo: 120,
    voice_count: 4,
  });

  const { 
    generateChords, 
    generateMelody, 
    generateHarmony,
    getRequestStatus,
    getRequestProgress,
    getRequestResult
  } = useCompositionAssistant();

  const handleGenerate = async () => {
    switch (selectedType) {
      case 'chord_progression':
        await generateChords({
          key: generationParams.key,
          length: generationParams.length,
          style: generationParams.style,
          complexity: generationParams.complexity,
        });
        break;
      case 'melody':
        await generateMelody({
          key: generationParams.key,
          length: generationParams.length * 4, // 4 notes per chord
          style: generationParams.style,
        });
        break;
      case 'harmony':
        await generateHarmony({
          key: generationParams.key,
          style: generationParams.style,
          voice_count: generationParams.voice_count,
        });
        break;
    }
  };

  const getRequestStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle size={16} className="text-green-400" />;
      case 'generating': return <Activity size={16} className="text-blue-400 animate-pulse" />;
      case 'failed': return <AlertCircle size={16} className="text-red-400" />;
      default: return <Clock size={16} className="text-yellow-400" />;
    }
  };

  const getRequestStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'generating': return 'text-blue-400';
      case 'failed': return 'text-red-400';
      default: return 'text-yellow-400';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'chord_progression': return <Music size={16} className="text-purple-400" />;
      case 'melody': return <Music size={16} className="text-blue-400" />;
      case 'harmony': return <Users size={16} className="text-green-400" />;
      case 'complete_piece': return <Lightbulb size={16} className="text-orange-400" />;
      default: return <Brain size={16} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Generation Controls */}
      <div className="bg-white/5 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">AI Composition Assistant</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Generation Type Selection */}
          <div>
            <h4 className="font-medium text-white mb-3">Composition Type</h4>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                { id: 'chord_progression', name: 'Chord Progression', icon: <Music size={16} /> },
                { id: 'melody', name: 'Melody', icon: <Music size={16} /> },
                { id: 'harmony', name: 'Harmony', icon: <Users size={16} /> },
                { id: 'complete_piece', name: 'Complete Piece', icon: <Lightbulb size={16} /> },
              ].map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id as any)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedType === type.id
                      ? 'bg-purple-600 text-white'
                      : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  {type.icon}
                  {type.name}
                </button>
              ))}
            </div>

            {/* Parameters */}
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-white/80 mb-2">Key</label>
                <select 
                  value={generationParams.key}
                  onChange={(e) => setGenerationParams(prev => ({ ...prev, key: e.target.value }))}
                  className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white"
                >
                  <option value="C major">C Major</option>
                  <option value="G major">G Major</option>
                  <option value="D major">D Major</option>
                  <option value="A major">A Major</option>
                  <option value="F major">F Major</option>
                  <option value="A minor">A Minor</option>
                  <option value="E minor">E Minor</option>
                  <option value="B minor">B Minor</option>
                  <option value="D minor">D Minor</option>
                  <option value="G minor">G Minor</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-white/80 mb-2">Style</label>
                <select 
                  value={generationParams.style}
                  onChange={(e) => setGenerationParams(prev => ({ ...prev, style: e.target.value }))}
                  className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white"
                >
                  <option value="pop">Pop</option>
                  <option value="rock">Rock</option>
                  <option value="jazz">Jazz</option>
                  <option value="classical">Classical</option>
                  <option value="blues">Blues</option>
                  <option value="folk">Folk</option>
                  <option value="electronic">Electronic</option>
                  <option value="r&b">R&B</option>
                  <option value="country">Country</option>
                </select>
              </div>

              {(selectedType === 'chord_progression' || selectedType === 'melody') && (
                <div>
                  <label className="block text-sm text-white/80 mb-2">
                    Length ({selectedType === 'chord_progression' ? 'chords' : 'measures'})
                  </label>
                  <input
                    type="range"
                    min="4"
                    max="32"
                    value={generationParams.length}
                    onChange={(e) => setGenerationParams(prev => ({ ...prev, length: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                  <div className="text-center text-sm text-white/60">{generationParams.length}</div>
                </div>
              )}

              {selectedType === 'harmony' && (
                <div>
                  <label className="block text-sm text-white/80 mb-2">Voice Count</label>
                  <input
                    type="range"
                    min="2"
                    max="8"
                    value={generationParams.voice_count}
                    onChange={(e) => setGenerationParams(prev => ({ ...prev, voice_count: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                  <div className="text-center text-sm text-white/60">{generationParams.voice_count} voices</div>
                </div>
              )}

              <div>
                <label className="block text-sm text-white/80 mb-2">Complexity</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={generationParams.complexity}
                  onChange={(e) => setGenerationParams(prev => ({ ...prev, complexity: parseFloat(e.target.value) }))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-white/60">
                  <span>Simple</span>
                  <span>Complex</span>
                </div>
              </div>
            </div>
          </div>

          {/* Generation Preview */}
          <div>
            <h4 className="font-medium text-white mb-3">Generation Preview</h4>
            <div className="bg-white/5 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                {getTypeIcon(selectedType)}
                <span className="font-medium text-white capitalize">
                  {selectedType.replace('_', ' ')}
                </span>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/80">Key:</span>
                  <span className="text-purple-400">{generationParams.key}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/80">Style:</span>
                  <span className="text-blue-400 capitalize">{generationParams.style}</span>
                </div>
                {(selectedType === 'chord_progression' || selectedType === 'melody') && (
                  <div className="flex justify-between">
                    <span className="text-white/80">Length:</span>
                    <span className="text-green-400">
                      {generationParams.length} {selectedType === 'chord_progression' ? 'chords' : 'measures'}
                    </span>
                  </div>
                )}
                {selectedType === 'harmony' && (
                  <div className="flex justify-between">
                    <span className="text-white/80">Voices:</span>
                    <span className="text-green-400">{generationParams.voice_count}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-white/80">Complexity:</span>
                  <span className="text-orange-400">
                    {Math.round(generationParams.complexity * 100)}%
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              className="w-full bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Brain size={16} />
              Generate {selectedType.replace('_', ' ')}
            </button>
          </div>
        </div>
      </div>

      {/* Active Requests */}
      {activeRequests.length > 0 && (
        <div className="bg-white/5 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Active Generation Requests</h3>
          
          <div className="space-y-3">
            {activeRequests.map((request) => (
              <div key={request.id} className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getRequestStatusIcon(request.status)}
                    <span className="font-medium text-white capitalize">
                      {request.type.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className={getRequestStatusColor(request.status)}>
                      {request.status}
                    </span>
                    {request.status === 'generating' && (
                      <span className="text-white/60">
                        {Math.round(request.progress * 100)}%
                      </span>
                    )}
                  </div>
                </div>
                
                {request.status === 'generating' && (
                  <div className="mb-3">
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div 
                        className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${request.progress * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {request.status === 'completed' && request.generated_content && (
                  <div className="mt-3">
                    <div className="bg-green-600/20 border border-green-600/30 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-green-400 font-medium">Generation Complete</span>
                        <div className="flex gap-2">
                          <button className="text-green-400 hover:text-green-300 transition-colors">
                            <Play size={14} />
                          </button>
                          <button className="text-green-400 hover:text-green-300 transition-colors">
                            <Download size={14} />
                          </button>
                        </div>
                      </div>
                      
                      {request.type === 'chord_progression' && request.generated_content.chords && (
                        <div className="flex flex-wrap gap-2">
                          {request.generated_content.chords.map((chord: string, index: number) => (
                            <span key={index} className="bg-green-600/20 text-green-400 px-2 py-1 rounded text-sm font-mono">
                              {chord}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {request.type === 'melody' && request.generated_content.notes && (
                        <div className="flex flex-wrap gap-1">
                          {request.generated_content.notes.slice(0, 8).map((note: string, index: number) => (
                            <span key={index} className="bg-blue-600/20 text-blue-400 px-2 py-1 rounded text-xs font-mono">
                              {note}
                            </span>
                          ))}
                          {request.generated_content.notes.length > 8 && (
                            <span className="text-white/60 text-xs">+{request.generated_content.notes.length - 8} more</span>
                          )}
                        </div>
                      )}
                      
                      <div className="flex justify-between text-xs text-white/60 mt-2">
                        <span>Quality: {Math.round(request.quality_score * 100)}%</span>
                        <span>Style: {Math.round(request.style_adherence * 100)}%</span>
                        <span>Creativity: {Math.round(request.creativity_score * 100)}%</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-between text-xs text-white/60 mt-2">
                  <span>
                    {request.completed_at 
                      ? `Completed ${new Date(request.completed_at).toLocaleTimeString()}`
                      : `Started ${new Date(request.requested_at).toLocaleTimeString()}`
                    }
                  </span>
                  {request.generation_time > 0 && (
                    <span>{(request.generation_time / 1000).toFixed(1)}s</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generation History */}
      <div className="bg-white/5 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Generation History</h3>
        
        {generationRequests.length > 0 ? (
          <div className="space-y-3">
            {generationRequests.slice(0, 10).map((request) => (
              <div key={request.id} className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(request.type)}
                    <span className="font-medium text-white capitalize">
                      {request.type.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getRequestStatusIcon(request.status)}
                    <span className={`text-sm ${getRequestStatusColor(request.status)}`}>
                      {request.status}
                    </span>
                  </div>
                </div>
                
                {request.status === 'completed' && (
                  <div className="flex justify-between text-xs text-white/60">
                    <span>Quality: {Math.round(request.quality_score * 100)}%</span>
                    <span>Generated {new Date(request.completed_at!).toLocaleString()}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Brain size={48} className="mx-auto mb-4 text-white/20" />
            <p className="text-white/60 mb-4">No compositions generated yet</p>
            <p className="text-sm text-white/40">
              Use the AI assistant above to generate your first composition
            </p>
          </div>
        )}
      </div>

      {/* AI Assistant Tips */}
      <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">AI Composition Tips</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Lightbulb size={16} className="text-yellow-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-white text-sm">Start Simple</h4>
                <p className="text-xs text-white/70">
                  Begin with basic chord progressions and gradually increase complexity
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <RefreshCw size={16} className="text-blue-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-white text-sm">Iterate</h4>
                <p className="text-xs text-white/70">
                  Generate multiple variations and combine the best elements
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Settings size={16} className="text-green-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-white text-sm">Experiment</h4>
                <p className="text-xs text-white/70">
                  Try different styles and keys to discover new musical ideas
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Music size={16} className="text-purple-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-white text-sm">Combine</h4>
                <p className="text-xs text-white/70">
                  Use generated progressions as foundation for complete compositions
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
