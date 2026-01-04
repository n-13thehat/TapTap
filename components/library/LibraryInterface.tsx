"use client";

import { useState } from 'react';
import { useLibraryView, usePlaylistManager, useLibraryStats } from '@/hooks/useLibrary';
import LibraryFilters from './LibraryFilters';
import LibraryGrid from './LibraryGrid';
import LibraryStats from './LibraryStats';
// import PlaylistManager from './PlaylistManager';
import SmartPlaylistCreator from './SmartPlaylistCreator';
import { 
  Music, 
  Filter, 
  BarChart3, 
  Plus, 
  Grid3X3, 
  List, 
  Search,
  Settings,
  Sparkles
} from 'lucide-react';

type LibraryView = 'tracks' | 'playlists' | 'stats' | 'smart-playlists';

export default function LibraryInterface() {
  const [currentView, setCurrentView] = useState<LibraryView>('tracks');
  const [showFilters, setShowFilters] = useState(false);
  const [showSmartPlaylistCreator, setShowSmartPlaylistCreator] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const { tracks, filter, sort, updateFilter, clearFilter, updateSort, isLoaded } = useLibraryView();
  const { playlists, createPlaylist, createSmartPlaylist } = usePlaylistManager();
  const { stats } = useLibraryStats();

  const views = [
    {
      id: 'tracks' as const,
      name: 'Tracks',
      icon: <Music size={16} />,
      count: tracks.length,
    },
    {
      id: 'playlists' as const,
      name: 'Playlists',
      icon: <List size={16} />,
      count: playlists.length,
    },
    {
      id: 'stats' as const,
      name: 'Statistics',
      icon: <BarChart3 size={16} />,
      count: stats?.totalTracks || 0,
    },
    {
      id: 'smart-playlists' as const,
      name: 'Smart Playlists',
      icon: <Sparkles size={16} />,
      count: playlists.filter(p => 'isSmartPlaylist' in p).length,
    },
  ];

  const handleCreateSmartPlaylist = async (name: string, rules: any[], sortBy: any) => {
    await createSmartPlaylist(name, rules, sortBy);
    setShowSmartPlaylistCreator(false);
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Music size={48} className="mx-auto mb-4 text-white/20 animate-pulse" />
          <p className="text-white/60">Loading your library...</p>
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
            <h1 className="text-2xl font-bold text-white">Your Library</h1>
            <p className="text-white/60">
              {stats?.totalTracks || 0} tracks • {stats?.totalPlaylists || 0} playlists
            </p>
          </div>
        </div>
        
        <div className="flex gap-3">
          {currentView === 'tracks' && (
            <>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  showFilters 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                }`}
              >
                <Filter size={16} />
                Filters
              </button>
              
              <div className="flex bg-white/10 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded transition-colors ${
                    viewMode === 'grid' ? 'bg-white/20 text-white' : 'text-white/60'
                  }`}
                >
                  <Grid3X3 size={16} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded transition-colors ${
                    viewMode === 'list' ? 'bg-white/20 text-white' : 'text-white/60'
                  }`}
                >
                  <List size={16} />
                </button>
              </div>
            </>
          )}
          
          {currentView === 'smart-playlists' && (
            <button
              onClick={() => setShowSmartPlaylistCreator(true)}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 px-3 py-2 rounded-lg transition-colors"
            >
              <Plus size={16} />
              Create Smart Playlist
            </button>
          )}
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {views.map((view) => (
          <button
            key={view.id}
            onClick={() => setCurrentView(view.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              currentView === view.id
                ? 'bg-purple-600 text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            {view.icon}
            <span>{view.name}</span>
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
              {view.count}
            </span>
          </button>
        ))}
      </div>

      {/* Filters */}
      {showFilters && currentView === 'tracks' && (
        <LibraryFilters
          filter={filter}
          onFilterChange={updateFilter}
          onClearFilter={clearFilter}
          sort={sort}
          onSortChange={updateSort}
        />
      )}

      {/* Content */}
      <div className="min-h-[400px]">
        {currentView === 'tracks' && (
          <LibraryGrid
            tracks={tracks}
            viewMode={viewMode}
            filter={filter}
            sort={sort}
          />
        )}
        
        {currentView === 'playlists' && (
          <div className="text-center py-12">
            <List size={64} className="mx-auto mb-4 text-white/20" />
            <h3 className="text-xl font-semibold text-white mb-2">Playlists</h3>
            <p className="text-white/60">
              {playlists.filter(p => !('isSmartPlaylist' in p)).length} regular playlists
            </p>
          </div>
        )}

        {currentView === 'smart-playlists' && (
          <div className="text-center py-12">
            <Sparkles size={64} className="mx-auto mb-4 text-white/20" />
            <h3 className="text-xl font-semibold text-white mb-2">Smart Playlists</h3>
            <p className="text-white/60">
              {playlists.filter(p => 'isSmartPlaylist' in p).length} smart playlists
            </p>
          </div>
        )}
        
        {currentView === 'stats' && stats && (
          <LibraryStats stats={stats} />
        )}
      </div>

      {/* Smart Playlist Creator Modal */}
      {showSmartPlaylistCreator && (
        <SmartPlaylistCreator
          onClose={() => setShowSmartPlaylistCreator(false)}
          onCreate={handleCreateSmartPlaylist}
        />
      )}
    </div>
  );
}
