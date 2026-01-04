"use client";

import { useState } from 'react';
import { Music, Play, Pause, Volume2, Settings, Trash2, Plus } from 'lucide-react';

interface AudioTrackListProps {
  tracks?: any[];
  onTrackSelect?: (track: any) => void;
  onTrackDelete?: (trackId: string) => void;
}

export default function AudioTrackList({ tracks = [], onTrackSelect, onTrackDelete }: AudioTrackListProps) {
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);

  const mockTracks = tracks.length > 0 ? tracks : [
    {
      id: '1',
      name: 'Neural Pathways.wav',
      duration: '3:24',
      size: '32.4 MB',
      format: 'WAV',
      sampleRate: '44.1 kHz',
      bitDepth: '24-bit',
      channels: 'Stereo',
      waveform: [0.2, 0.5, 0.8, 0.3, 0.7, 0.4, 0.9, 0.1, 0.6, 0.8],
      processing: {
        effects: ['EQ', 'Compressor'],
        spatialAudio: true,
        aiEnhanced: true
      }
    },
    {
      id: '2',
      name: 'Digital Dreams.mp3',
      duration: '4:12',
      size: '9.8 MB',
      format: 'MP3',
      sampleRate: '44.1 kHz',
      bitDepth: '16-bit',
      channels: 'Stereo',
      waveform: [0.1, 0.3, 0.6, 0.9, 0.4, 0.7, 0.2, 0.8, 0.5, 0.3],
      processing: {
        effects: ['Reverb', 'Delay'],
        spatialAudio: false,
        aiEnhanced: false
      }
    },
    {
      id: '3',
      name: 'Quantum Beat.flac',
      duration: '3:58',
      size: '41.2 MB',
      format: 'FLAC',
      sampleRate: '96 kHz',
      bitDepth: '24-bit',
      channels: 'Stereo',
      waveform: [0.4, 0.7, 0.2, 0.9, 0.1, 0.6, 0.8, 0.3, 0.5, 0.7],
      processing: {
        effects: ['EQ', 'Compressor', 'Limiter'],
        spatialAudio: true,
        aiEnhanced: true
      }
    }
  ];

  const handleTrackSelect = (track: any) => {
    setSelectedTrack(track.id);
    if (onTrackSelect) {
      onTrackSelect(track);
    }
  };

  const handlePlayPause = (trackId: string) => {
    if (playingTrack === trackId) {
      setPlayingTrack(null);
    } else {
      setPlayingTrack(trackId);
    }
  };

  const handleDelete = (trackId: string) => {
    if (onTrackDelete) {
      onTrackDelete(trackId);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Music size={20} className="text-blue-400" />
          Audio Tracks ({mockTracks.length})
        </h3>
        <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white flex items-center gap-2 transition-colors">
          <Plus size={16} />
          Add Track
        </button>
      </div>

      {/* Track List */}
      <div className="space-y-2">
        {mockTracks.map((track) => (
          <div
            key={track.id}
            onClick={() => handleTrackSelect(track)}
            className={`bg-white/5 rounded-lg p-4 cursor-pointer transition-all hover:bg-white/10 ${
              selectedTrack === track.id ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            <div className="flex items-center gap-4">
              {/* Play Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlayPause(track.id);
                }}
                className="w-10 h-10 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center transition-colors"
              >
                {playingTrack === track.id ? <Pause size={16} /> : <Play size={16} />}
              </button>

              {/* Track Info */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-white font-medium">{track.name}</h4>
                  <div className="flex items-center gap-2">
                    {track.processing.aiEnhanced && (
                      <span className="bg-purple-600/20 text-purple-400 px-2 py-1 rounded text-xs">
                        AI Enhanced
                      </span>
                    )}
                    {track.processing.spatialAudio && (
                      <span className="bg-green-600/20 text-green-400 px-2 py-1 rounded text-xs">
                        Spatial
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-white/60">
                  <div className="flex items-center gap-4">
                    <span>{track.duration}</span>
                    <span>{track.format}</span>
                    <span>{track.sampleRate}</span>
                    <span>{track.bitDepth}</span>
                    <span>{track.size}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Volume2 size={14} />
                    <span>{track.channels}</span>
                  </div>
                </div>

                {/* Waveform Preview */}
                <div className="mt-3 flex items-end gap-1 h-8">
                  {track.waveform.map((amplitude: number, index: number) => (
                    <div
                      key={index}
                      className="bg-blue-500 rounded-t flex-1 transition-all duration-300"
                      style={{ height: `${amplitude * 100}%` }}
                    />
                  ))}
                </div>

                {/* Effects */}
                {track.processing.effects.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {track.processing.effects.map((effect: string, index: number) => (
                      <span key={index} className="bg-white/10 text-white/80 px-2 py-1 rounded text-xs">
                        {effect}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Handle settings
                  }}
                  className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded flex items-center justify-center transition-colors"
                >
                  <Settings size={14} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(track.id);
                  }}
                  className="w-8 h-8 bg-red-600/20 hover:bg-red-600/40 rounded flex items-center justify-center transition-colors"
                >
                  <Trash2 size={14} className="text-red-400" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {mockTracks.length === 0 && (
        <div className="text-center py-12">
          <Music size={48} className="mx-auto mb-4 text-white/20" />
          <p className="text-white/60 mb-4">No audio tracks loaded</p>
          <button className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg text-white transition-colors">
            Upload Your First Track
          </button>
        </div>
      )}

      {/* Selected Track Details */}
      {selectedTrack && (
        <div className="bg-white/5 rounded-lg p-4">
          <h4 className="text-white font-medium mb-3">Track Details</h4>
          {(() => {
            const track = mockTracks.find(t => t.id === selectedTrack);
            if (!track) return null;
            
            return (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-white/60">Format</div>
                  <div className="text-white">{track.format}</div>
                </div>
                <div>
                  <div className="text-white/60">Sample Rate</div>
                  <div className="text-white">{track.sampleRate}</div>
                </div>
                <div>
                  <div className="text-white/60">Bit Depth</div>
                  <div className="text-white">{track.bitDepth}</div>
                </div>
                <div>
                  <div className="text-white/60">Channels</div>
                  <div className="text-white">{track.channels}</div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
