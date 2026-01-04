"use client";

import { useState } from 'react';
import { AnalysisSession } from '@/lib/music-theory/types';
import { useHarmonicAnalysis } from '@/hooks/useMusicTheory';
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  Zap, 
  Play,
  Settings,
  Activity,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';

interface HarmonicAnalysisPanelProps {
  analysisSessions: AnalysisSession[];
  analysisResults: any;
  isAnalyzing: boolean;
  currentKey: string;
}

export default function HarmonicAnalysisPanel({
  analysisSessions,
  analysisResults,
  isAnalyzing,
  currentKey
}: HarmonicAnalysisPanelProps) {
  const [analysisInput, setAnalysisInput] = useState('Cmaj7 Am7 Dm7 G7');
  const [analysisTypes, setAnalysisTypes] = useState({
    key_detection: true,
    chord_analysis: true,
    harmonic_function: true,
    voice_leading: true,
    cadence_detection: false,
    style_classification: false,
  });

  const { performHarmonicAnalysis, clearResults } = useHarmonicAnalysis();

  const handleAnalyze = async () => {
    const chords = analysisInput.split(' ').filter(c => c.trim());
    if (chords.length > 0) {
      await performHarmonicAnalysis({
        chords,
        include_voice_leading: analysisTypes.voice_leading,
      });
    }
  };

  const getSessionStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle size={16} className="text-green-400" />;
      case 'running': return <Activity size={16} className="text-blue-400 animate-pulse" />;
      case 'failed': return <AlertCircle size={16} className="text-red-400" />;
      default: return <Clock size={16} className="text-yellow-400" />;
    }
  };

  const getSessionStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'running': return 'text-blue-400';
      case 'failed': return 'text-red-400';
      default: return 'text-yellow-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Analysis Input */}
      <div className="bg-white/5 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Harmonic Analysis</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Input Section */}
          <div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white/80 mb-2">Chord Sequence</label>
                <input
                  type="text"
                  value={analysisInput}
                  onChange={(e) => setAnalysisInput(e.target.value)}
                  placeholder="Cmaj7 Am7 Dm7 G7 Em7 Am7"
                  className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white placeholder-white/40"
                />
              </div>
              
              <div>
                <label className="block text-sm text-white/80 mb-2">Analysis Types</label>
                <div className="space-y-2">
                  {Object.entries(analysisTypes).map(([type, enabled]) => (
                    <label key={type} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(e) => setAnalysisTypes(prev => ({ ...prev, [type]: e.target.checked }))}
                        className="rounded"
                      />
                      <span className="text-sm text-white/80 capitalize">
                        {type.replace(/_/g, ' ')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <BarChart3 size={16} />
                {isAnalyzing ? 'Analyzing...' : 'Analyze Harmony'}
              </button>
            </div>
          </div>

          {/* Analysis Progress */}
          <div>
            <h4 className="font-medium text-white mb-3">Analysis Status</h4>
            {isAnalyzing ? (
              <div className="bg-blue-600/20 border border-blue-600/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Activity size={16} className="text-blue-400 animate-pulse" />
                  <span className="text-blue-400 font-medium">Analyzing Harmony...</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full transition-all duration-300" style={{ width: '60%' }} />
                </div>
                <div className="text-xs text-white/60 mt-2">Processing harmonic functions and voice leading...</div>
              </div>
            ) : analysisResults ? (
              <div className="bg-green-600/20 border border-green-600/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle size={16} className="text-green-400" />
                  <span className="text-green-400 font-medium">Analysis Complete</span>
                </div>
                <div className="text-sm text-white/80">
                  Key: {analysisResults.key?.tonic.pitch_class} {analysisResults.key?.mode.name}
                </div>
                <div className="text-sm text-white/80">
                  Chords analyzed: {analysisResults.chords?.length || 0}
                </div>
              </div>
            ) : (
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <BarChart3 size={32} className="mx-auto mb-2 text-white/20" />
                <p className="text-white/60 text-sm">No analysis performed yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Analysis Results */}
      {analysisResults && (
        <div className="bg-white/5 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white">Analysis Results</h3>
            <button
              onClick={clearResults}
              className="text-sm text-white/60 hover:text-white transition-colors"
            >
              Clear Results
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Key Analysis */}
            {analysisResults.key && (
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                  <Target size={16} className="text-purple-400" />
                  Key Analysis
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/80">Detected Key:</span>
                    <span className="text-purple-400 font-mono">
                      {analysisResults.key.tonic.pitch_class} {analysisResults.key.mode.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/80">Confidence:</span>
                    <span className="text-blue-400">
                      {Math.round(analysisResults.key.confidence * 100)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/80">Stability:</span>
                    <span className="text-green-400">
                      {Math.round(analysisResults.key.stability * 100)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/80">Brightness:</span>
                    <span className="text-orange-400">
                      {Math.round(analysisResults.key.brightness * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Harmonic Functions */}
            {analysisResults.harmonic_functions && (
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                  <TrendingUp size={16} className="text-blue-400" />
                  Harmonic Functions
                </h4>
                <div className="space-y-2">
                  {analysisResults.harmonic_functions.map((func: string, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-white/80 text-sm">Chord {index + 1}:</span>
                      <span className={`text-sm px-2 py-1 rounded ${
                        func === 'tonic' ? 'bg-green-600/20 text-green-400' :
                        func === 'dominant' ? 'bg-red-600/20 text-red-400' :
                        func === 'predominant' ? 'bg-blue-600/20 text-blue-400' :
                        'bg-gray-600/20 text-gray-400'
                      }`}>
                        {func.charAt(0).toUpperCase() + func.slice(1)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Voice Leading */}
            {analysisResults.voice_leading && (
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                  <Activity size={16} className="text-green-400" />
                  Voice Leading
                </h4>
                <div className="space-y-2 text-sm">
                  {analysisResults.voice_leading.map((vl: any, index: number) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-white/80">Connection {index + 1}:</span>
                        <span className="text-green-400">
                          {Math.round(vl.smoothness * 100)}% smooth
                        </span>
                      </div>
                      <div className="text-xs text-white/60">
                        Motion: {vl.total_motion} semitones
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Chord Details */}
          {analysisResults.chords && (
            <div className="mt-6">
              <h4 className="font-medium text-white mb-3">Chord Analysis Details</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-2 text-white/80">Chord</th>
                      <th className="text-left py-2 text-white/80">Quality</th>
                      <th className="text-left py-2 text-white/80">Function</th>
                      <th className="text-left py-2 text-white/80">Tension</th>
                      <th className="text-left py-2 text-white/80">Stability</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysisResults.chords.map((chord: any, index: number) => (
                      <tr key={index} className="border-b border-white/5">
                        <td className="py-2 text-blue-400 font-mono">
                          {chord.root.pitch_class}{chord.quality === 'minor' ? 'm' : ''}
                        </td>
                        <td className="py-2 text-white/80 capitalize">
                          {chord.quality.replace(/_/g, ' ')}
                        </td>
                        <td className="py-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            chord.function === 'tonic' ? 'bg-green-600/20 text-green-400' :
                            chord.function === 'dominant' ? 'bg-red-600/20 text-red-400' :
                            chord.function === 'predominant' ? 'bg-blue-600/20 text-blue-400' :
                            'bg-gray-600/20 text-gray-400'
                          }`}>
                            {chord.function}
                          </span>
                        </td>
                        <td className="py-2">
                          <div className="w-16 bg-white/10 rounded-full h-2">
                            <div 
                              className="bg-red-500 h-2 rounded-full"
                              style={{ width: `${chord.tension_level * 100}%` }}
                            />
                          </div>
                        </td>
                        <td className="py-2">
                          <div className="w-16 bg-white/10 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${chord.stability * 100}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Analysis Sessions History */}
      <div className="bg-white/5 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Analysis Sessions</h3>
        
        {analysisSessions.length > 0 ? (
          <div className="space-y-3">
            {analysisSessions.map((session) => (
              <div key={session.id} className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getSessionStatusIcon(session.status)}
                    <span className="font-medium text-white">
                      {session.analysis_types.length} Analysis Types
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className={getSessionStatusColor(session.status)}>
                      {session.status}
                    </span>
                    {session.status === 'running' && (
                      <span className="text-white/60">
                        {Math.round(session.progress * 100)}%
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-2">
                  {session.analysis_types.map((type, index) => (
                    <span key={index} className="text-xs bg-blue-600/20 text-blue-400 px-2 py-1 rounded">
                      {type.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
                
                <div className="flex justify-between text-xs text-white/60">
                  <span>Depth: {session.depth_level}</span>
                  <span>
                    {session.completed_at 
                      ? `Completed ${new Date(session.completed_at).toLocaleTimeString()}`
                      : `Started ${new Date(session.started_at).toLocaleTimeString()}`
                    }
                  </span>
                </div>
                
                {session.status === 'running' && (
                  <div className="mt-2">
                    <div className="w-full bg-white/10 rounded-full h-1">
                      <div 
                        className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                        style={{ width: `${session.progress * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <BarChart3 size={48} className="mx-auto mb-4 text-white/20" />
            <p className="text-white/60 mb-4">No analysis sessions yet</p>
            <p className="text-sm text-white/40">
              Start an analysis above to see session history
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
