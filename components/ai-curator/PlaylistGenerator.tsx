"use client";

import { useState } from 'react';
import { 
  Music, 
  Sparkles, 
  Play, 
  Plus, 
  Settings,
  Shuffle,
  Clock,
  TrendingUp,
  Heart,
  Zap
} from 'lucide-react';

interface PlaylistGeneratorProps {
  onPlaylistGenerated?: (playlist: any) => void;
}

export default function PlaylistGenerator({ onPlaylistGenerated }: PlaylistGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlaylist, setGeneratedPlaylist] = useState<any>(null);
  const [generationParams, setGenerationParams] = useState({
    mood: 'energetic',
    genre: 'any',
    duration: 60,
    style: 'discovery',
    includeUserTaste: true,
    astroInfluence: true,
  });

  const moods = [
    { id: 'energetic', name: 'Energetic', icon: '⚡' },
    { id: 'chill', name: 'Chill', icon: '🌊' },
    { id: 'focus', name: 'Focus', icon: '🎯' },
    { id: 'social', name: 'Social', icon: '🎉' },
    { id: 'romantic', name: 'Romantic', icon: '💕' },
    { id: 'workout', name: 'Workout', icon: '💪' },
  ];

  const genres = [
    { id: 'any', name: 'Any Genre' },
    { id: 'pop', name: 'Pop' },
    { id: 'rock', name: 'Rock' },
    { id: 'hip-hop', name: 'Hip Hop' },
    { id: 'electronic', name: 'Electronic' },
    { id: 'indie', name: 'Indie' },
    { id: 'jazz', name: 'Jazz' },
    { id: 'classical', name: 'Classical' },
  ];

  const styles = [
    { id: 'discovery', name: 'Discovery', description: 'Mix of familiar and new tracks' },
    { id: 'favorites', name: 'Favorites', description: 'Based on your liked songs' },
    { id: 'trending', name: 'Trending', description: 'Popular tracks right now' },
    { id: 'deep-cuts', name: 'Deep Cuts', description: 'Hidden gems and rarities' },
  ];

  const handleGeneratePlaylist = async () => {
    setIsGenerating(true);
    
    // Simulate AI playlist generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const mockPlaylist = {
      id: `playlist_${Date.now()}`,
      name: `AI ${generationParams.mood} Mix`,
      description: `Generated ${generationParams.style} playlist for ${generationParams.mood} vibes`,
      tracks: [
        { id: '1', title: 'Midnight Drive', artist: 'Neon Dreams', duration: '3:24' },
        { id: '2', title: 'Electric Pulse', artist: 'Cyber Waves', duration: '4:12' },
        { id: '3', title: 'Digital Horizon', artist: 'Matrix Sound', duration: '3:45' },
        { id: '4', title: 'Quantum Beat', artist: 'Future Bass', duration: '3:58' },
        { id: '5', title: 'Neural Network', artist: 'AI Collective', duration: '4:33' },
      ],
      totalDuration: '19:52',
      mood: generationParams.mood,
      genre: generationParams.genre,
      astroInfluenced: generationParams.astroInfluence,
      generatedAt: Date.now(),
    };
    
    setGeneratedPlaylist(mockPlaylist);
    setIsGenerating(false);
    
    if (onPlaylistGenerated) {
      onPlaylistGenerated(mockPlaylist);
    }
  };

  return (
    <div className="space-y-6">
      {/* Generation Parameters */}
      <div className="bg-white/5 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Sparkles size={20} className="text-purple-400" />
          AI Playlist Generator
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Mood Selection */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-3">Mood</label>
            <div className="grid grid-cols-2 gap-2">
              {moods.map((mood) => (
                <button
                  key={mood.id}
                  onClick={() => setGenerationParams(prev => ({ ...prev, mood: mood.id }))}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    generationParams.mood === mood.id
                      ? 'bg-purple-600 text-white'
                      : 'bg-white/10 text-white/80 hover:bg-white/20'
                  }`}
                >
                  <span>{mood.icon}</span>
                  <span>{mood.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Genre Selection */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-3">Genre</label>
            <select
              value={generationParams.genre}
              onChange={(e) => setGenerationParams(prev => ({ ...prev, genre: e.target.value }))}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
            >
              {genres.map((genre) => (
                <option key={genre.id} value={genre.id} className="bg-gray-800">
                  {genre.name}
                </option>
              ))}
            </select>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-3">
              Duration: {generationParams.duration} minutes
            </label>
            <input
              type="range"
              min="15"
              max="180"
              step="15"
              value={generationParams.duration}
              onChange={(e) => setGenerationParams(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-white/60 mt-1">
              <span>15 min</span>
              <span>3 hours</span>
            </div>
          </div>

          {/* Style */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-3">Style</label>
            <div className="space-y-2">
              {styles.map((style) => (
                <label key={style.id} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="style"
                    value={style.id}
                    checked={generationParams.style === style.id}
                    onChange={(e) => setGenerationParams(prev => ({ ...prev, style: e.target.value }))}
                    className="text-purple-600"
                  />
                  <div>
                    <div className="text-white text-sm">{style.name}</div>
                    <div className="text-white/60 text-xs">{style.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Advanced Options */}
        <div className="mt-6 pt-4 border-t border-white/10">
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={generationParams.includeUserTaste}
                onChange={(e) => setGenerationParams(prev => ({ ...prev, includeUserTaste: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm text-white/80">Include my taste profile</span>
            </label>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={generationParams.astroInfluence}
                onChange={(e) => setGenerationParams(prev => ({ ...prev, astroInfluence: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm text-white/80">Astro-influenced recommendations</span>
            </label>
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGeneratePlaylist}
          disabled={isGenerating}
          className="w-full mt-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 px-6 py-3 rounded-lg font-medium text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              Generating Playlist...
            </>
          ) : (
            <>
              <Zap size={16} />
              Generate AI Playlist
            </>
          )}
        </button>
      </div>

      {/* Generated Playlist */}
      {generatedPlaylist && (
        <div className="bg-white/5 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white">{generatedPlaylist.name}</h3>
              <p className="text-white/60 text-sm">{generatedPlaylist.description}</p>
            </div>
            <div className="flex gap-2">
              <button className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-white flex items-center gap-2 transition-colors">
                <Play size={16} />
                Play
              </button>
              <button className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-white flex items-center gap-2 transition-colors">
                <Plus size={16} />
                Save
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {generatedPlaylist.tracks.map((track: any, index: number) => (
              <div key={track.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors">
                <div className="w-8 h-8 bg-purple-600/20 rounded flex items-center justify-center text-purple-400 text-sm">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="text-white font-medium">{track.title}</div>
                  <div className="text-white/60 text-sm">{track.artist}</div>
                </div>
                <div className="text-white/60 text-sm">{track.duration}</div>
                <button className="text-white/60 hover:text-white transition-colors">
                  <Heart size={16} />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-white/10 flex justify-between text-sm text-white/60">
            <span>{generatedPlaylist.tracks.length} tracks • {generatedPlaylist.totalDuration}</span>
            <span>Generated with {generatedPlaylist.astroInfluenced ? 'Astro' : 'AI'} influence</span>
          </div>
        </div>
      )}
    </div>
  );
}
