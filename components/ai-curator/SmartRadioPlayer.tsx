"use client";

import { useState, useEffect } from 'react';
import { 
  Radio, 
  Play, 
  Pause, 
  SkipForward, 
  Heart, 
  X,
  Volume2,
  Shuffle,
  Repeat,
  TrendingUp,
  Zap,
  Settings,
  Music
} from 'lucide-react';

interface SmartRadioPlayerProps {
  onTrackChange?: (track: any) => void;
  onStationChange?: (station: any) => void;
}

const RADIO_STATIONS = [
  {
    id: 'discovery',
    name: 'Discovery Radio',
    description: 'AI-curated new music based on your taste',
    color: 'from-purple-600 to-blue-600',
    icon: '??',
  },
  {
    id: 'astro',
    name: 'Astro Vibes',
    description: 'Music aligned with your astrological profile',
    color: 'from-pink-600 to-purple-600',
    icon: '?',
  },
  {
    id: 'trending',
    name: 'Trending Now',
    description: "What's hot in the TapTap community",
    color: 'from-orange-600 to-red-600',
    icon: '??',
  },
  {
    id: 'focus',
    name: 'Focus Flow',
    description: 'Adaptive music for productivity',
    color: 'from-green-600 to-teal-600',
    icon: '??',
  },
  {
    id: 'chill',
    name: 'Chill Waves',
    description: 'Relaxing vibes for any time',
    color: 'from-blue-600 to-cyan-600',
    icon: '??',
  },
];

const MOCK_TRACK = {
  id: 'track_001',
  title: 'Neural Pathways',
  artist: 'Digital Consciousness',
  album: 'AI Dreams',
  duration: '4:23',
  currentTime: '1:47',
  progress: 40,
  artwork: '/api/placeholder/300/300',
  isLiked: false,
};

export default function SmartRadioPlayer({ onTrackChange, onStationChange }: SmartRadioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [currentStation, setCurrentStation] = useState<any>(null);
  const [volume, setVolume] = useState(75);
  const [isLiked, setIsLiked] = useState(false);
  const [adaptiveMode, setAdaptiveMode] = useState(true);

  useEffect(() => {
    // Initialize with first station and mock track
    if (!currentStation && RADIO_STATIONS.length > 0) {
      setCurrentStation(RADIO_STATIONS[0]);
      setCurrentTrack(MOCK_TRACK);
    }
  }, [currentStation]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    // Simulate next track
    const nextTrack = {
      ...MOCK_TRACK,
      id: `track_${Date.now()}`,
      title: `AI Track ${Math.floor(Math.random() * 1000)}`,
      artist: `Generated Artist ${Math.floor(Math.random() * 100)}`,
      currentTime: '0:00',
      progress: 0,
    };
    setCurrentTrack(nextTrack);
    if (onTrackChange) onTrackChange(nextTrack);
  };

  const handleStationChange = (station: any) => {
    setCurrentStation(station);
    handleNext(); // Load new track for new station
    if (onStationChange) onStationChange(station);
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    if (currentTrack) {
      setCurrentTrack({ ...currentTrack, isLiked: !isLiked });
    }
  };

  const handleDislike = () => {
    // Skip to next track when disliked
    handleNext();
  };

  return (
    <div className="space-y-6">
      {/* Station Selector */}
      <div className="bg-white/5 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Radio size={20} className="text-blue-400" />
          Smart Radio Stations
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {RADIO_STATIONS.map((station) => (
            <button
              key={station.id}
              onClick={() => handleStationChange(station)}
              className={`p-4 rounded-lg text-left transition-all ${
                currentStation?.id === station.id
                  ? `bg-gradient-to-r ${station.color} shadow-lg`
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{station.icon}</span>
                <h4 className="font-medium text-white">{station.name}</h4>
              </div>
              <p className="text-sm text-white/80">{station.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Current Player */}
      {currentTrack && currentStation && (
        <div className="bg-white/5 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Radio size={16} className="text-blue-400" />
            <span className="text-sm text-blue-400 font-medium">{currentStation.name}</span>
            {adaptiveMode && (
              <span className="text-xs bg-purple-600/20 text-purple-400 px-2 py-1 rounded">
                Adaptive
              </span>
            )}
          </div>

          <div className="flex items-center gap-6">
            {/* Artwork */}
            <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <Music size={32} className="text-white" />
            </div>

            {/* Track Info */}
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white">{currentTrack.title}</h3>
              <p className="text-white/80">{currentTrack.artist}</p>
              <p className="text-white/60 text-sm">{currentTrack.album}</p>
              
              {/* Progress Bar */}
              <div className="mt-3">
                <div className="flex justify-between text-xs text-white/60 mb-1">
                  <span>{currentTrack.currentTime}</span>
                  <span>{currentTrack.duration}</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-1">
                  <div 
                    className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                    style={{ width: `${currentTrack.progress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleDislike}
                className="w-10 h-10 bg-white/10 hover:bg-red-600/20 rounded-full flex items-center justify-center transition-colors"
                title="Dislike & Skip"
              >
                <X size={16} className="text-white/80" />
              </button>
              
              <button
                onClick={handlePlayPause}
                className="w-12 h-12 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center transition-colors"
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </button>
              
              <button
                onClick={handleNext}
                className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
              >
                <SkipForward size={16} className="text-white/80" />
              </button>
              
              <button
                onClick={handleLike}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  isLiked 
                    ? 'bg-red-600 text-white' 
                    : 'bg-white/10 hover:bg-red-600/20 text-white/80'
                }`}
              >
                <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
              </button>
            </div>
          </div>

          {/* Volume Control */}
          <div className="mt-6 flex items-center gap-4">
            <Volume2 size={16} className="text-white/60" />
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => setVolume(parseInt(e.target.value))}
              className="flex-1"
            />
            <span className="text-sm text-white/60 w-8">{volume}</span>
          </div>

          {/* Adaptive Settings */}
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-purple-400" />
                <span className="text-sm text-white/80">Adaptive Learning</span>
              </div>
              <button
                onClick={() => setAdaptiveMode(!adaptiveMode)}
                className={`w-12 h-6 rounded-full relative transition-colors ${
                  adaptiveMode ? 'bg-purple-600' : 'bg-white/20'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                  adaptiveMode ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </div>
            <p className="text-xs text-white/60 mt-1">
              AI learns from your likes/skips to improve recommendations
            </p>
          </div>
        </div>
      )}

      {/* Radio Stats */}
      <div className="bg-white/5 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Radio Insights</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">127</div>
            <div className="text-sm text-white/60">Tracks Played</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">89%</div>
            <div className="text-sm text-white/60">Match Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">23</div>
            <div className="text-sm text-white/60">New Discoveries</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-400">4.2h</div>
            <div className="text-sm text-white/60">Listen Time</div>
          </div>
        </div>
      </div>
    </div>
  );
}
