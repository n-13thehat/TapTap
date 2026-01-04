"use client";

import { useState } from 'react';
import { ChordProgression, MusicalKey } from '@/lib/music-theory/types';
import { useChordProgressions } from '@/hooks/useMusicTheory';
import { 
  Music, 
  Play, 
  Pause, 
  Plus, 
  BarChart3, 
  Target, 
  Zap,
  Settings,
  TrendingUp,
  Volume2
} from 'lucide-react';

interface ChordProgressionAnalyzerProps {
  progressions: ChordProgression[];
  selectedProgression: string | null;
  currentKey: string;
  onKeyChange: (key: string) => void;
}

export default function ChordProgressionAnalyzer({
  progressions,
  selectedProgression,
  currentKey,
  onKeyChange
}: ChordProgressionAnalyzerProps) {
  const [chordInput, setChordInput] = useState('C Am F G');
  const [isPlaying, setIsPlaying] = useState(false);
  const [generationParams, setGenerationParams] = useState({
    length: 8,
    style: 'pop',
    complexity: 0.5,
  });

  const { analyzeProgression, generateProgression, getCurrentProgression } = useChordProgressions();

  const currentProgression = getCurrentProgression();

  const handleAnalyzeChords = async () => {
    const chords = chordInput.split(' ').filter(c => c.trim());
    if (chords.length > 0) {
      await analyzeProgression(chords);
    }
  };

  const handleGenerateProgression = async () => {
    await generateProgression({
      length: generationParams.length,
      style: generationParams.style,
      complexity: generationParams.complexity,
    });
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const getChordSymbols = (progression: ChordProgression) => {
    return progression.chords.map(chord => 
      chord.root.pitch_class + (chord.quality === 'minor' ? 'm' : '')
    );
  };

  const getRomanNumerals = (progression: ChordProgression) => {
    return progression.roman_numeral_analysis || [];
  };

  const getHarmonicFunctions = (progression: ChordProgression) => {
    return progression.functional_analysis?.functional_sequence || [];
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="bg-white/5 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Chord Progression Analysis</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Manual Input */}
          <div>
            <h4 className="font-medium text-white mb-3">Analyze Chord Sequence</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-white/80 mb-2">Chord Symbols</label>
                <input
                  type="text"
                  value={chordInput}
                  onChange={(e) => setChordInput(e.target.value)}
                  placeholder="C Am F G Em Am Dm G"
                  className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white placeholder-white/40"
                />
              </div>
              
              <div>
                <label className="block text-sm text-white/80 mb-2">Key Context</label>
                <select 
                  value={currentKey}
                  onChange={(e) => onKeyChange(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white"
                >
                  <option value="C major">C Major</option>
                  <option value="G major">G Major</option>
                  <option value="D major">D Major</option>
                  <option value="A major">A Major</option>
                  <option value="E major">E Major</option>
                  <option value="B major">B Major</option>
                  <option value="F major">F Major</option>
                  <option value="Bb major">Bb Major</option>
                  <option value="Eb major">Eb Major</option>
                  <option value="Ab major">Ab Major</option>
                  <option value="A minor">A Minor</option>
                  <option value="E minor">E Minor</option>
                  <option value="B minor">B Minor</option>
                  <option value="F# minor">F# Minor</option>
                  <option value="C# minor">C# Minor</option>
                  <option value="G# minor">G# Minor</option>
                  <option value="D minor">D Minor</option>
                  <option value="G minor">G Minor</option>
                  <option value="C minor">C Minor</option>
                  <option value="F minor">F Minor</option>
                </select>
              </div>
              
              <button
                onClick={handleAnalyzeChords}
                className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <BarChart3 size={16} />
                Analyze Progression
              </button>
            </div>
          </div>

          {/* AI Generation */}
          <div>
            <h4 className="font-medium text-white mb-3">Generate New Progression</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-white/80 mb-2">Length (chords)</label>
                <input
                  type="range"
                  min="4"
                  max="16"
                  value={generationParams.length}
                  onChange={(e) => setGenerationParams(prev => ({ ...prev, length: parseInt(e.target.value) }))}
                  className="w-full"
                />
                <div className="text-center text-sm text-white/60">{generationParams.length} chords</div>
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
                </select>
              </div>
              
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
              
              <button
                onClick={handleGenerateProgression}
                className="w-full bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Zap size={16} />
                Generate Progression
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Current Progression Display */}
      {currentProgression && (
        <div className="bg-white/5 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white">{currentProgression.name}</h3>
            <div className="flex items-center gap-3">
              <button
                onClick={handlePlayPause}
                className="w-10 h-10 bg-purple-600 hover:bg-purple-700 rounded-full flex items-center justify-center transition-colors"
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <div className="flex items-center gap-2">
                <Volume2 size={16} className="text-white/60" />
                <input type="range" min="0" max="100" defaultValue="75" className="w-20" />
              </div>
            </div>
          </div>

          {/* Chord Analysis Display */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Chord Symbols */}
            <div className="bg-white/5 rounded-lg p-4">
              <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                <Music size={16} className="text-blue-400" />
                Chord Symbols
              </h4>
              <div className="flex flex-wrap gap-2">
                {getChordSymbols(currentProgression).map((chord, index) => (
                  <div key={index} className="bg-blue-600/20 border border-blue-600/30 px-3 py-1 rounded text-blue-400 font-mono">
                    {chord}
                  </div>
                ))}
              </div>
            </div>

            {/* Roman Numerals */}
            <div className="bg-white/5 rounded-lg p-4">
              <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                <Target size={16} className="text-green-400" />
                Roman Numerals
              </h4>
              <div className="flex flex-wrap gap-2">
                {getRomanNumerals(currentProgression).map((numeral, index) => (
                  <div key={index} className="bg-green-600/20 border border-green-600/30 px-3 py-1 rounded text-green-400 font-mono">
                    {numeral}
                  </div>
                ))}
              </div>
            </div>

            {/* Harmonic Functions */}
            <div className="bg-white/5 rounded-lg p-4">
              <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                <TrendingUp size={16} className="text-orange-400" />
                Functions
              </h4>
              <div className="flex flex-wrap gap-2">
                {getHarmonicFunctions(currentProgression).map((func, index) => (
                  <div key={index} className="bg-orange-600/20 border border-orange-600/30 px-3 py-1 rounded text-orange-400 text-sm">
                    {func.charAt(0).toUpperCase()}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Progression Details */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/5 rounded-lg p-4">
              <h4 className="font-medium text-white mb-3">Analysis Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/80">Key:</span>
                  <span className="text-purple-400">{currentProgression.key.tonic.pitch_class} {currentProgression.key.mode.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/80">Confidence:</span>
                  <span className="text-blue-400">{Math.round(currentProgression.confidence * 100)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/80">Difficulty:</span>
                  <span className="text-green-400">{currentProgression.difficulty_level}/10</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/80">Style Period:</span>
                  <span className="text-orange-400">{currentProgression.style_period.name}</span>
                </div>
              </div>
            </div>

            <div className="bg-white/5 rounded-lg p-4">
              <h4 className="font-medium text-white mb-3">Harmonic Analysis</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/80">Voice Leading:</span>
                  <span className="text-blue-400">{Math.round(currentProgression.voice_leading_analysis.overall_smoothness * 100)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/80">Tonal Stability:</span>
                  <span className="text-green-400">{Math.round(currentProgression.tonal_plan.tonal_stability * 100)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/80">Cadences:</span>
                  <span className="text-purple-400">{currentProgression.cadences.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/80">Modulations:</span>
                  <span className="text-orange-400">{currentProgression.tonal_plan.modulations.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progression Library */}
      <div className="bg-white/5 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Progression Library</h3>
        
        {progressions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {progressions.map((progression) => (
              <div key={progression.id} className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-white truncate">{progression.name}</h4>
                  <div className="flex items-center gap-1">
                    {progression.generated_by === 'ai' && <Zap size={12} className="text-purple-400" />}
                    <span className="text-xs text-white/60">{progression.chords.length}</span>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-1 mb-2">
                  {getChordSymbols(progression).slice(0, 4).map((chord, index) => (
                    <span key={index} className="text-xs bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded">
                      {chord}
                    </span>
                  ))}
                  {progression.chords.length > 4 && (
                    <span className="text-xs text-white/60">+{progression.chords.length - 4}</span>
                  )}
                </div>
                
                <div className="flex justify-between text-xs text-white/60">
                  <span>{progression.key.tonic.pitch_class} {progression.key.mode.name}</span>
                  <span>{Math.round(progression.confidence * 100)}%</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Music size={48} className="mx-auto mb-4 text-white/20" />
            <p className="text-white/60 mb-4">No chord progressions analyzed yet</p>
            <p className="text-sm text-white/40">
              Enter chord symbols above or generate a new progression to get started
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
