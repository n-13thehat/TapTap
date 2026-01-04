"use client";

import { useState } from 'react';
import { Music, Play, Pause, Volume2, Settings, Save, Undo, Redo } from 'lucide-react';

interface TrackEditorProps {
  track?: any;
  onTrackUpdate?: (track: any) => void;
}

export default function TrackEditor({ track, onTrackUpdate }: TrackEditorProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(75);

  const mockTrack = track || {
    id: '1',
    name: 'Collaborative Beat',
    duration: 240,
    tracks: [
      { id: 'drums', name: 'Drums', volume: 80, muted: false, solo: false },
      { id: 'bass', name: 'Bass', volume: 70, muted: false, solo: false },
      { id: 'synth', name: 'Synth', volume: 60, muted: false, solo: false },
      { id: 'vocals', name: 'Vocals', volume: 85, muted: false, solo: false }
    ]
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleTrackVolumeChange = (trackId: string, volume: number) => {
    // Update track volume
    console.log(`Track ${trackId} volume: ${volume}`);
  };

  const handleTrackMute = (trackId: string) => {
    // Toggle track mute
    console.log(`Toggle mute for track ${trackId}`);
  };

  const handleTrackSolo = (trackId: string) => {
    // Toggle track solo
    console.log(`Toggle solo for track ${trackId}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Music size={20} className="text-green-400" />
          Track Editor - {mockTrack.name}
        </h3>
        <div className="flex items-center gap-2">
          <button className="bg-white/10 hover:bg-white/20 p-2 rounded transition-colors">
            <Undo size={16} />
          </button>
          <button className="bg-white/10 hover:bg-white/20 p-2 rounded transition-colors">
            <Redo size={16} />
          </button>
          <button className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white transition-colors">
            <Save size={16} className="inline mr-2" />
            Save
          </button>
        </div>
      </div>

      {/* Transport Controls */}
      <div className="bg-white/5 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handlePlayPause}
              className="w-12 h-12 bg-green-600 hover:bg-green-700 rounded-full flex items-center justify-center transition-colors"
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>
            <div className="text-white">
              {Math.floor(currentTime / 60)}:{(currentTime % 60).toString().padStart(2, '0')} / 
              {Math.floor(mockTrack.duration / 60)}:{(mockTrack.duration % 60).toString().padStart(2, '0')}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Volume2 size={16} className="text-white/60" />
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => setVolume(parseInt(e.target.value))}
              className="w-24"
            />
            <span className="text-white/60 text-sm w-8">{volume}</span>
          </div>
        </div>

        {/* Timeline */}
        <div className="mt-4">
          <div className="w-full bg-white/10 rounded-full h-2 cursor-pointer">
            <div 
              className="bg-green-500 h-2 rounded-full"
              style={{ width: `${(currentTime / mockTrack.duration) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Track Mixer */}
      <div className="bg-white/5 rounded-lg p-6">
        <h4 className="text-white font-medium mb-4">Track Mixer</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {mockTrack.tracks.map((track: any) => (
            <div key={track.id} className="bg-white/5 rounded-lg p-4">
              <div className="text-center mb-4">
                <h5 className="text-white font-medium mb-2">{track.name}</h5>
                
                {/* Volume Fader */}
                <div className="flex flex-col items-center h-32 mb-4">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={track.volume}
                    onChange={(e) => handleTrackVolumeChange(track.id, parseInt(e.target.value))}
                    className="h-24 slider-vertical"
                  />
                  <div className="text-xs text-white/60 mt-2">{track.volume}</div>
                </div>

                {/* Track Controls */}
                <div className="space-y-2">
                  <button
                    onClick={() => handleTrackMute(track.id)}
                    className={`w-full px-3 py-1 rounded text-sm transition-colors ${
                      track.muted 
                        ? 'bg-red-600 text-white' 
                        : 'bg-white/10 text-white/80 hover:bg-white/20'
                    }`}
                  >
                    MUTE
                  </button>
                  <button
                    onClick={() => handleTrackSolo(track.id)}
                    className={`w-full px-3 py-1 rounded text-sm transition-colors ${
                      track.solo 
                        ? 'bg-yellow-600 text-white' 
                        : 'bg-white/10 text-white/80 hover:bg-white/20'
                    }`}
                  >
                    SOLO
                  </button>
                  <button className="w-full bg-white/10 hover:bg-white/20 px-3 py-1 rounded text-white/80 text-sm transition-colors">
                    <Settings size={14} className="inline mr-1" />
                    FX
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Waveform Display */}
      <div className="bg-white/5 rounded-lg p-6">
        <h4 className="text-white font-medium mb-4">Waveform</h4>
        <div className="h-32 bg-black/20 rounded-lg flex items-center justify-center">
          <div className="flex items-end gap-1 h-16">
            {Array.from({ length: 100 }, (_, i) => (
              <div
                key={i}
                className="bg-green-500 rounded-t flex-1"
                style={{ height: `${Math.random() * 100}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
