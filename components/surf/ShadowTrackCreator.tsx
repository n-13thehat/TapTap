"use client";

import { useState } from 'react';
import { useShadowTrackCreation } from '@/hooks/useSurf';
import { ShadowTrackCreation } from '@/lib/surf/types';
import { 
  X, 
  Plus, 
  ExternalLink, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Youtube,
  Music,
  Cloud,
  Sparkles
} from 'lucide-react';

interface ShadowTrackCreatorProps {
  onClose: () => void;
  onCreated: () => void;
}

export default function ShadowTrackCreator({ onClose, onCreated }: ShadowTrackCreatorProps) {
  const [url, setUrl] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { creations, createTrack, getCreationStatus } = useShadowTrackCreation();

  const supportedPlatforms = [
    {
      name: 'YouTube',
      icon: <Youtube size={20} className="text-red-400" />,
      pattern: 'youtube.com/watch?v= or youtu.be/',
      example: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
    },
    {
      name: 'Spotify',
      icon: <Music size={20} className="text-green-400" />,
      pattern: 'open.spotify.com/track/',
      example: 'https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh',
    },
    {
      name: 'SoundCloud',
      icon: <Cloud size={20} className="text-orange-400" />,
      pattern: 'soundcloud.com/artist/track',
      example: 'https://soundcloud.com/artist/track-name',
    },
    {
      name: 'Apple Music',
      icon: <Music size={20} className="text-gray-400" />,
      pattern: 'music.apple.com/album/track',
      example: 'https://music.apple.com/us/album/track/123456789',
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsCreating(true);
    try {
      await createTrack(url.trim());
      setUrl('');
      onCreated();
    } catch (error) {
      console.error('Failed to create shadow track:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const detectPlatform = (url: string) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube';
    if (url.includes('spotify.com')) return 'Spotify';
    if (url.includes('soundcloud.com')) return 'SoundCloud';
    if (url.includes('music.apple.com')) return 'Apple Music';
    return null;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock size={16} className="text-yellow-400" />;
      case 'processing': return <Clock size={16} className="text-blue-400 animate-spin" />;
      case 'completed': return <CheckCircle size={16} className="text-green-400" />;
      case 'failed': return <AlertCircle size={16} className="text-red-400" />;
      default: return <Clock size={16} className="text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-400';
      case 'processing': return 'text-blue-400';
      case 'completed': return 'text-green-400';
      case 'failed': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const detectedPlatform = detectPlatform(url);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-black/90 border border-white/20 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Sparkles size={24} className="text-purple-400" />
            <h2 className="text-xl font-semibold text-white">Create Shadow Track</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={20} className="text-white/60" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Description */}
          <div className="bg-purple-600/20 border border-purple-600/30 rounded-lg p-4">
            <h3 className="font-medium text-purple-300 mb-2">What are Shadow Tracks?</h3>
            <p className="text-white/80 text-sm">
              Shadow tracks allow you to import music from external platforms into TapTap. 
              We'll extract the metadata and create a playable track in your library.
            </p>
          </div>

          {/* URL Input */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Track URL
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Paste a track URL from any supported platform..."
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-purple-400"
                  required
                />
                {detectedPlatform && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="bg-green-600/20 text-green-300 px-2 py-1 rounded text-xs">
                      {detectedPlatform} detected
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={!url.trim() || isCreating}
              className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3 rounded-lg font-medium transition-colors"
            >
              {isCreating ? (
                <>
                  <Clock size={16} className="animate-spin" />
                  Creating Shadow Track...
                </>
              ) : (
                <>
                  <Plus size={16} />
                  Create Shadow Track
                </>
              )}
            </button>
          </form>

          {/* Supported Platforms */}
          <div>
            <h3 className="font-medium text-white mb-3">Supported Platforms</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {supportedPlatforms.map((platform) => (
                <div key={platform.name} className="bg-white/5 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    {platform.icon}
                    <span className="font-medium text-white">{platform.name}</span>
                  </div>
                  <div className="text-xs text-white/60 mb-1">
                    Pattern: {platform.pattern}
                  </div>
                  <div className="text-xs text-white/40">
                    Example: {platform.example}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Creations */}
          {creations.length > 0 && (
            <div>
              <h3 className="font-medium text-white mb-3">Recent Shadow Tracks</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {creations.slice(-5).reverse().map((creation) => (
                  <div key={creation.id} className="bg-white/5 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(creation.status)}
                        <span className={`text-sm font-medium ${getStatusColor(creation.status)}`}>
                          {creation.status.charAt(0).toUpperCase() + creation.status.slice(1)}
                        </span>
                      </div>
                      <a
                        href={creation.original_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white/40 hover:text-white/60 transition-colors"
                      >
                        <ExternalLink size={14} />
                      </a>
                    </div>
                    
                    {creation.title && creation.artist ? (
                      <div>
                        <div className="font-medium text-white text-sm">{creation.title}</div>
                        <div className="text-white/60 text-xs">{creation.artist}</div>
                      </div>
                    ) : (
                      <div className="text-white/60 text-sm">
                        {creation.source_platform} • {new Date(creation.created_at).toLocaleTimeString()}
                      </div>
                    )}
                    
                    {creation.error_message && (
                      <div className="text-red-300 text-xs mt-1">
                        Error: {creation.error_message}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Beta Notice */}
          <div className="bg-blue-600/20 border border-blue-600/30 rounded-lg p-4">
            <h3 className="font-medium text-blue-300 mb-2">Beta Feature</h3>
            <p className="text-white/80 text-sm">
              Shadow track creation is currently in beta. Processing times may vary, 
              and some tracks may fail to extract. We're continuously improving the system.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-4 py-2 text-white/80 hover:text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
