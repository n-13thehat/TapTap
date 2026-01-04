"use client";

import { useState, useEffect } from 'react';
import { useSurf, useSurfFeed, useTapPass } from '@/hooks/useSurf';
import SurfFeedGrid from './SurfFeedGrid';
import TapPassGate from './TapPassGate';
import ShadowTrackCreator from './ShadowTrackCreator';
import { 
  Waves, 
  Zap, 
  Crown, 
  Plus, 
  Filter, 
  Shuffle,
  TrendingUp,
  Clock,
  Sparkles,
  Settings
} from 'lucide-react';

export default function SurfInterface() {
  const [selectedFeed, setSelectedFeed] = useState<string>('trending');
  const [showShadowCreator, setShowShadowCreator] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  const { 
    isInitialized, 
    currentSession, 
    availableFeeds, 
    startSession, 
    endSession,
    saveTrack,
    skipTrack 
  } = useSurf();
  
  const { tracks, loading, error, refreshTracks } = useSurfFeed(selectedFeed);
  const { tapPassStatus, hasFeature } = useTapPass();

  // Auto-start session when component mounts
  useEffect(() => {
    if (isInitialized && !currentSession) {
      startSession().catch(console.error);
    }
  }, [isInitialized, currentSession, startSession]);

  // Cleanup session on unmount
  useEffect(() => {
    return () => {
      if (currentSession) {
        endSession();
      }
    };
  }, [currentSession, endSession]);

  const handleTrackSave = async (trackId: string) => {
    try {
      await saveTrack(trackId);
    } catch (error) {
      console.error('Failed to save track:', error);
    }
  };

  const handleTrackSkip = async (trackId: string, reason?: string) => {
    try {
      await skipTrack(trackId, reason);
    } catch (error) {
      console.error('Failed to skip track:', error);
    }
  };

  const getFeedIcon = (feedType: string) => {
    switch (feedType) {
      case 'trending': return <TrendingUp size={16} />;
      case 'fresh': return <Clock size={16} />;
      case 'curated': return <Crown size={16} />;
      case 'personalized': return <Sparkles size={16} />;
      default: return <Waves size={16} />;
    }
  };

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Waves size={48} className="mx-auto mb-4 text-white/20 animate-pulse" />
          <p className="text-white/60">Initializing Surf...</p>
        </div>
      </div>
    );
  }

  // Show TapPass gate for premium feeds
  if (error?.type === 'tappass_required') {
    return <TapPassGate error={error} onUpgrade={() => window.location.reload()} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Waves size={32} className="text-blue-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">Surf</h1>
            <p className="text-white/60">
              Discover new music from across the web
            </p>
          </div>
        </div>
        
        <div className="flex gap-3">
          {hasFeature('beta_access') && (
            <button
              onClick={() => setShowShadowCreator(true)}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 px-3 py-2 rounded-lg transition-colors"
            >
              <Plus size={16} />
              Create Shadow Track
            </button>
          )}
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              showFilters 
                ? 'bg-blue-600 text-white' 
                : 'bg-white/10 text-white/80 hover:bg-white/20'
            }`}
          >
            <Filter size={16} />
            Filters
          </button>
          
          <button
            onClick={refreshTracks}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg transition-colors"
          >
            <Shuffle size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* Session Stats */}
      {currentSession && (
        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-400">{currentSession.tracks_surfed}</div>
                <div className="text-xs text-white/60">Surfed</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-400">{currentSession.tracks_saved}</div>
                <div className="text-xs text-white/60">Saved</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-orange-400">{currentSession.tracks_skipped}</div>
                <div className="text-xs text-white/60">Skipped</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-400">
                  {Math.round((Date.now() - currentSession.started_at) / 1000 / 60)}m
                </div>
                <div className="text-xs text-white/60">Duration</div>
              </div>
            </div>
            
            {/* TapPass Status */}
            <div className="flex items-center gap-2">
              {tapPassStatus.has_tappass ? (
                <div className="flex items-center gap-2 bg-yellow-600/20 text-yellow-300 px-3 py-1 rounded-lg">
                  <Crown size={14} />
                  <span className="text-sm">{tapPassStatus.tier.toUpperCase()}</span>
                </div>
              ) : (
                <div className="text-sm text-white/60">
                  {tapPassStatus.daily_surf_used}/{tapPassStatus.daily_surf_limit} daily surfs
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Feed Tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {availableFeeds.map((feed) => (
          <button
            key={feed.id}
            onClick={() => setSelectedFeed(feed.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              selectedFeed === feed.id
                ? 'bg-blue-600 text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            {getFeedIcon(feed.type)}
            <span>{feed.name}</span>
            {feed.type === 'curated' && (
              <Crown size={12} className="text-yellow-400" />
            )}
            {feed.name.includes('Beta') && (
              <Sparkles size={12} className="text-purple-400" />
            )}
          </button>
        ))}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white/5 rounded-lg p-4">
          <h3 className="font-medium text-white mb-3">Filters</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <select className="bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm">
              <option value="">All Genres</option>
              <option value="electronic">Electronic</option>
              <option value="hip-hop">Hip Hop</option>
              <option value="rock">Rock</option>
              <option value="pop">Pop</option>
            </select>
            
            <select className="bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm">
              <option value="">All Sources</option>
              <option value="youtube">YouTube</option>
              <option value="spotify">Spotify</option>
              <option value="soundcloud">SoundCloud</option>
              <option value="taptap">TapTap</option>
            </select>
            
            <select className="bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm">
              <option value="">All Moods</option>
              <option value="energetic">Energetic</option>
              <option value="chill">Chill</option>
              <option value="dark">Dark</option>
              <option value="uplifting">Uplifting</option>
            </select>
            
            <select className="bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm">
              <option value="">Sort By</option>
              <option value="discovery_score">Discovery Score</option>
              <option value="trending_score">Trending</option>
              <option value="freshness_score">Freshness</option>
              <option value="random">Random</option>
            </select>
          </div>
        </div>
      )}

      {/* Tracks Grid */}
      <div className="space-y-4">
        {loading && (
          <div className="text-center py-8">
            <Waves size={32} className="mx-auto mb-4 text-blue-400 animate-pulse" />
            <p className="text-white/60">Loading tracks...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-600/20 border border-red-600/30 rounded-lg p-4">
            <h3 className="font-medium text-red-300 mb-2">Error</h3>
            <p className="text-red-200 text-sm">{error.message}</p>
            {error.retry_after && (
              <p className="text-red-200/80 text-xs mt-1">
                Retry after: {new Date(error.retry_after).toLocaleTimeString()}
              </p>
            )}
          </div>
        )}

        {tracks.length > 0 && (
          <SurfFeedGrid
            tracks={tracks}
            onSave={handleTrackSave}
            onSkip={handleTrackSkip}
            tapPassStatus={tapPassStatus}
          />
        )}

        {!loading && !error && tracks.length === 0 && (
          <div className="text-center py-12">
            <Waves size={64} className="mx-auto mb-4 text-white/20" />
            <h3 className="text-xl font-semibold text-white mb-2">No tracks found</h3>
            <p className="text-white/60 mb-4">
              Try refreshing or selecting a different feed.
            </p>
            <button
              onClick={refreshTracks}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
            >
              Refresh Feed
            </button>
          </div>
        )}
      </div>

      {/* Shadow Track Creator Modal */}
      {showShadowCreator && (
        <ShadowTrackCreator
          onClose={() => setShowShadowCreator(false)}
          onCreated={() => {
            setShowShadowCreator(false);
            refreshTracks();
          }}
        />
      )}
    </div>
  );
}
