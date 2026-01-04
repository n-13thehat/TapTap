"use client";

import { useState } from 'react';
import { LibraryFilter, SortOption } from '@/lib/library/types';
import { 
  Search, 
  Calendar, 
  Clock, 
  Heart, 
  Play, 
  X, 
  ChevronDown,
  SortAsc,
  SortDesc
} from 'lucide-react';

interface LibraryFiltersProps {
  filter: LibraryFilter;
  onFilterChange: (filter: Partial<LibraryFilter>) => void;
  onClearFilter: () => void;
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
}

export default function LibraryFilters({
  filter,
  onFilterChange,
  onClearFilter,
  sort,
  onSortChange,
}: LibraryFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const sortOptions = [
    { field: 'name' as const, label: 'Name' },
    { field: 'artist' as const, label: 'Artist' },
    { field: 'addedAt' as const, label: 'Date Added' },
    { field: 'lastPlayed' as const, label: 'Last Played' },
    { field: 'playCount' as const, label: 'Play Count' },
    { field: 'duration' as const, label: 'Duration' },
    { field: 'random' as const, label: 'Random' },
  ];

  const genres = [
    'Electronic', 'Hip Hop', 'Rock', 'Pop', 'Jazz', 'Classical', 
    'Ambient', 'Techno', 'House', 'Dubstep', 'Trap', 'Lo-Fi'
  ];

  const moods = [
    'Energetic', 'Chill', 'Happy', 'Sad', 'Aggressive', 'Peaceful',
    'Romantic', 'Motivational', 'Nostalgic', 'Dark', 'Uplifting'
  ];

  const hasActiveFilters = Object.keys(filter).some(key => {
    const value = filter[key as keyof LibraryFilter];
    return value !== undefined && value !== '' && 
           (!Array.isArray(value) || value.length > 0);
  });

  return (
    <div className="bg-white/5 rounded-lg p-4 space-y-4">
      {/* Search and Quick Filters */}
      <div className="flex flex-wrap gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-64">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search tracks, artists..."
            value={filter.search || ''}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-purple-400"
          />
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <select
            value={sort.field}
            onChange={(e) => onSortChange({ ...sort, field: e.target.value as any })}
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-400"
          >
            {sortOptions.map((option) => (
              <option key={option.field} value={option.field} className="bg-black">
                {option.label}
              </option>
            ))}
          </select>
          
          <button
            onClick={() => onSortChange({ 
              ...sort, 
              direction: sort.direction === 'asc' ? 'desc' : 'asc' 
            })}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          >
            {sort.direction === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />}
          </button>
        </div>

        {/* Quick Filters */}
        <button
          onClick={() => onFilterChange({ isFavorite: filter.isFavorite ? undefined : true })}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
            filter.isFavorite 
              ? 'bg-red-600 text-white' 
              : 'bg-white/10 text-white/80 hover:bg-white/20'
          }`}
        >
          <Heart size={16} />
          Favorites
        </button>

        <button
          onClick={() => onFilterChange({ hasBeenPlayed: filter.hasBeenPlayed ? undefined : true })}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
            filter.hasBeenPlayed 
              ? 'bg-green-600 text-white' 
              : 'bg-white/10 text-white/80 hover:bg-white/20'
          }`}
        >
          <Play size={16} />
          Played
        </button>

        <button
          onClick={() => onFilterChange({ addedRecently: filter.addedRecently ? undefined : true })}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
            filter.addedRecently 
              ? 'bg-blue-600 text-white' 
              : 'bg-white/10 text-white/80 hover:bg-white/20'
          }`}
        >
          <Calendar size={16} />
          Recent
        </button>

        {/* Advanced Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
        >
          Advanced
          <ChevronDown size={16} className={`transform transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
        </button>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={onClearFilter}
            className="flex items-center gap-2 px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-300 rounded-lg transition-colors"
          >
            <X size={16} />
            Clear
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-white/10">
          {/* Genres */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Genres</label>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {genres.map((genre) => (
                <label key={genre} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={filter.genres?.includes(genre) || false}
                    onChange={(e) => {
                      const currentGenres = filter.genres || [];
                      const newGenres = e.target.checked
                        ? [...currentGenres, genre]
                        : currentGenres.filter(g => g !== genre);
                      onFilterChange({ genres: newGenres.length > 0 ? newGenres : undefined });
                    }}
                    className="rounded border-white/20 bg-white/10 text-purple-600 focus:ring-purple-400"
                  />
                  <span className="text-white/80">{genre}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Moods */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Moods</label>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {moods.map((mood) => (
                <label key={mood} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={filter.moods?.includes(mood) || false}
                    onChange={(e) => {
                      const currentMoods = filter.moods || [];
                      const newMoods = e.target.checked
                        ? [...currentMoods, mood]
                        : currentMoods.filter(m => m !== mood);
                      onFilterChange({ moods: newMoods.length > 0 ? newMoods : undefined });
                    }}
                    className="rounded border-white/20 bg-white/10 text-purple-600 focus:ring-purple-400"
                  />
                  <span className="text-white/80">{mood}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Duration Range */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Duration</label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-white/40" />
                <span className="text-xs text-white/60">Min</span>
                <input
                  type="number"
                  placeholder="0"
                  value={filter.durationRange?.min ? Math.floor(filter.durationRange.min / 60) : ''}
                  onChange={(e) => {
                    const min = e.target.value ? parseInt(e.target.value) * 60 : undefined;
                    const max = filter.durationRange?.max;
                    onFilterChange({ 
                      durationRange: min !== undefined || max !== undefined 
                        ? { min: min || 0, max: max || 3600 } 
                        : undefined 
                    });
                  }}
                  className="w-16 bg-white/10 border border-white/20 rounded px-2 py-1 text-sm text-white"
                />
                <span className="text-xs text-white/60">min</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-white/40" />
                <span className="text-xs text-white/60">Max</span>
                <input
                  type="number"
                  placeholder="60"
                  value={filter.durationRange?.max ? Math.floor(filter.durationRange.max / 60) : ''}
                  onChange={(e) => {
                    const max = e.target.value ? parseInt(e.target.value) * 60 : undefined;
                    const min = filter.durationRange?.min;
                    onFilterChange({ 
                      durationRange: min !== undefined || max !== undefined 
                        ? { min: min || 0, max: max || 3600 } 
                        : undefined 
                    });
                  }}
                  className="w-16 bg-white/10 border border-white/20 rounded px-2 py-1 text-sm text-white"
                />
                <span className="text-xs text-white/60">min</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
          {filter.search && (
            <span className="bg-purple-600/20 text-purple-300 px-2 py-1 rounded text-xs">
              Search: "{filter.search}"
            </span>
          )}
          {filter.genres?.map(genre => (
            <span key={genre} className="bg-blue-600/20 text-blue-300 px-2 py-1 rounded text-xs">
              Genre: {genre}
            </span>
          ))}
          {filter.moods?.map(mood => (
            <span key={mood} className="bg-green-600/20 text-green-300 px-2 py-1 rounded text-xs">
              Mood: {mood}
            </span>
          ))}
          {filter.isFavorite && (
            <span className="bg-red-600/20 text-red-300 px-2 py-1 rounded text-xs">
              Favorites Only
            </span>
          )}
          {filter.hasBeenPlayed && (
            <span className="bg-yellow-600/20 text-yellow-300 px-2 py-1 rounded text-xs">
              Played Tracks
            </span>
          )}
          {filter.addedRecently && (
            <span className="bg-teal-600/20 text-teal-300 px-2 py-1 rounded text-xs">
              Added Recently
            </span>
          )}
        </div>
      )}
    </div>
  );
}
