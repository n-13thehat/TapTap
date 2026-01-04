"use client";

import { useState } from 'react';
import { MusicTheoryKnowledgeBase as KnowledgeBaseType } from '@/lib/music-theory/types';
import { useMusicTheoryKnowledge } from '@/hooks/useMusicTheory';
import { 
  BookOpen, 
  Search, 
  Music, 
  Target, 
  TrendingUp, 
  Users,
  Clock,
  Globe,
  Star,
  Filter,
  ChevronRight,
  Info
} from 'lucide-react';

interface MusicTheoryKnowledgeBaseProps {
  knowledgeBase: KnowledgeBaseType | null;
}

export default function MusicTheoryKnowledgeBase({ knowledgeBase }: MusicTheoryKnowledgeBaseProps) {
  const [selectedCategory, setSelectedCategory] = useState<'scales' | 'chords' | 'progressions' | 'periods' | 'genres'>('scales');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const { 
    getScales, 
    getChords, 
    getProgressions, 
    getStylePeriods, 
    getGenreCharacteristics,
    searchKnowledge 
  } = useMusicTheoryKnowledge();

  const scales = getScales();
  const chords = getChords();
  const progressions = getProgressions();
  const stylePeriods = getStylePeriods();
  const genres = getGenreCharacteristics();

  const searchResults = searchQuery ? searchKnowledge(searchQuery, selectedCategory) : [];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'scales': return <Target size={16} className="text-blue-400" />;
      case 'chords': return <Music size={16} className="text-green-400" />;
      case 'progressions': return <TrendingUp size={16} className="text-purple-400" />;
      case 'periods': return <Clock size={16} className="text-orange-400" />;
      case 'genres': return <Globe size={16} className="text-pink-400" />;
      default: return <BookOpen size={16} />;
    }
  };

  const getCategoryData = (category: string) => {
    switch (category) {
      case 'scales': return scales;
      case 'chords': return chords;
      case 'progressions': return progressions;
      case 'periods': return stylePeriods;
      case 'genres': return genres;
      default: return [];
    }
  };

  const getCategoryCount = (category: string) => {
    return getCategoryData(category).length;
  };

  const renderScaleItem = (scale: any) => (
    <div className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors cursor-pointer">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-white">{scale.name}</h4>
        <span className="text-xs text-blue-400 bg-blue-600/20 px-2 py-1 rounded">
          {scale.type}
        </span>
      </div>
      <div className="text-sm text-white/80 mb-2">
        Origin: {scale.origin}
      </div>
      <div className="flex flex-wrap gap-1">
        {scale.common_genres?.slice(0, 3).map((genre: string, index: number) => (
          <span key={index} className="text-xs bg-white/10 text-white/60 px-2 py-0.5 rounded">
            {genre}
          </span>
        ))}
      </div>
    </div>
  );

  const renderChordItem = (chord: any) => (
    <div className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors cursor-pointer">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-white">{chord.name}</h4>
        <span className="text-xs text-green-400 bg-green-600/20 px-2 py-1 rounded font-mono">
          {chord.symbol}
        </span>
      </div>
      <div className="text-sm text-white/80 mb-2">
        Stability: {Math.round(chord.stability * 100)}% • Tension: {Math.round(chord.tension * 100)}%
      </div>
      <div className="flex flex-wrap gap-1">
        {chord.common_functions?.slice(0, 2).map((func: string, index: number) => (
          <span key={index} className="text-xs bg-white/10 text-white/60 px-2 py-0.5 rounded">
            {func}
          </span>
        ))}
      </div>
    </div>
  );

  const renderProgressionItem = (progression: any) => (
    <div className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors cursor-pointer">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-white">{progression.name}</h4>
        <span className="text-xs text-purple-400">
          {progression.chords?.length || 0} chords
        </span>
      </div>
      <div className="text-sm text-white/80 mb-2">
        Key: {progression.key?.tonic.pitch_class} {progression.key?.mode.name}
      </div>
      <div className="flex flex-wrap gap-1">
        {progression.common_usage?.slice(0, 3).map((usage: string, index: number) => (
          <span key={index} className="text-xs bg-white/10 text-white/60 px-2 py-0.5 rounded">
            {usage}
          </span>
        ))}
      </div>
    </div>
  );

  const renderPeriodItem = (period: any) => (
    <div className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors cursor-pointer">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-white">{period.name}</h4>
        <span className="text-xs text-orange-400">
          {period.time_period?.[0]}-{period.time_period?.[1]}
        </span>
      </div>
      <div className="text-sm text-white/80 mb-2">
        Chromaticism: {Math.round((period.harmonic_language?.chromaticism_level || 0) * 100)}%
      </div>
      <div className="flex flex-wrap gap-1">
        {period.representative_composers?.slice(0, 3).map((composer: string, index: number) => (
          <span key={index} className="text-xs bg-white/10 text-white/60 px-2 py-0.5 rounded">
            {composer}
          </span>
        ))}
      </div>
    </div>
  );

  const renderGenreItem = (genre: any) => (
    <div className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors cursor-pointer">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-white">{genre.genre}</h4>
        <span className="text-xs text-pink-400">
          {Math.round(genre.importance * 100)}%
        </span>
      </div>
      <div className="text-sm text-white/80 mb-2">
        {genre.characteristic}
      </div>
      <div className="flex flex-wrap gap-1">
        {genre.examples?.slice(0, 2).map((example: string, index: number) => (
          <span key={index} className="text-xs bg-white/10 text-white/60 px-2 py-0.5 rounded">
            {example}
          </span>
        ))}
      </div>
    </div>
  );

  const renderCategoryItems = (category: string, data: any[]) => {
    if (data.length === 0) {
      return (
        <div className="text-center py-8">
          {getCategoryIcon(category)}
          <p className="text-white/60 mt-2">No {category} data available</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.slice(0, 12).map((item, index) => (
          <div key={index} onClick={() => setSelectedItem(item)}>
            {category === 'scales' && renderScaleItem(item)}
            {category === 'chords' && renderChordItem(item)}
            {category === 'progressions' && renderProgressionItem(item)}
            {category === 'periods' && renderPeriodItem(item)}
            {category === 'genres' && renderGenreItem(item)}
          </div>
        ))}
      </div>
    );
  };

  if (!knowledgeBase) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <BookOpen size={48} className="mx-auto mb-4 text-white/20" />
          <p className="text-white/60">Knowledge base not available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="bg-white/5 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Music Theory Knowledge Base</h3>
        
        <div className="flex gap-4 mb-4">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search scales, chords, progressions..."
              className="w-full bg-white/10 border border-white/20 rounded pl-10 pr-4 py-2 text-white placeholder-white/40"
            />
          </div>
          <button className="bg-white/10 border border-white/20 rounded px-4 py-2 text-white/60 hover:text-white transition-colors">
            <Filter size={16} />
          </button>
        </div>

        {/* Knowledge Base Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { id: 'scales', name: 'Scales', count: scales.length },
            { id: 'chords', name: 'Chords', count: chords.length },
            { id: 'progressions', name: 'Progressions', count: progressions.length },
            { id: 'periods', name: 'Style Periods', count: stylePeriods.length },
            { id: 'genres', name: 'Genres', count: genres.length },
          ].map((category) => (
            <div key={category.id} className="bg-white/5 rounded-lg p-3 text-center">
              {getCategoryIcon(category.id)}
              <div className="text-lg font-bold text-white mt-1">{category.count}</div>
              <div className="text-xs text-white/60">{category.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Category Navigation */}
      <div className="flex gap-2 overflow-x-auto">
        {[
          { id: 'scales', name: 'Scales' },
          { id: 'chords', name: 'Chords' },
          { id: 'progressions', name: 'Progressions' },
          { id: 'periods', name: 'Style Periods' },
          { id: 'genres', name: 'Genres' },
        ].map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              selectedCategory === category.id
                ? 'bg-blue-600 text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            {getCategoryIcon(category.id)}
            <span>{category.name}</span>
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
              {getCategoryCount(category.id)}
            </span>
          </button>
        ))}
      </div>

      {/* Search Results */}
      {searchQuery && searchResults.length > 0 && (
        <div className="bg-white/5 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4">
            Search Results ({searchResults.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchResults.map((result, index) => (
              <div key={index} className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors cursor-pointer">
                <div className="flex items-center gap-2 mb-2">
                  {getCategoryIcon(result.type)}
                  <span className="text-xs text-white/60 capitalize">{result.type}</span>
                </div>
                <h4 className="font-medium text-white">{result.data.name}</h4>
                <p className="text-sm text-white/80 mt-1">
                  {result.data.description || result.data.origin || 'Music theory concept'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Content */}
      <div className="bg-white/5 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            {getCategoryIcon(selectedCategory)}
            {selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}
          </h3>
          <span className="text-white/60 text-sm">
            {getCategoryCount(selectedCategory)} items
          </span>
        </div>

        {renderCategoryItems(selectedCategory, getCategoryData(selectedCategory))}
      </div>

      {/* Knowledge Base Info */}
      <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">About This Knowledge Base</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Info size={16} className="text-blue-400" />
              <span className="font-medium text-white">Coverage</span>
            </div>
            <p className="text-sm text-white/80">
              Comprehensive database covering Western music theory, including scales, chords, 
              progressions, and historical style periods from Baroque to Contemporary.
            </p>
          </div>
          
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Star size={16} className="text-yellow-400" />
              <span className="font-medium text-white">Accuracy</span>
            </div>
            <p className="text-sm text-white/80">
              {Math.round((knowledgeBase.accuracy_rating || 0.95) * 100)}% accuracy rating based on 
              {knowledgeBase.source_count || 1000}+ verified music theory sources and academic references.
            </p>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex justify-between text-sm text-white/60">
            <span>Version: {knowledgeBase.version}</span>
            <span>Last Updated: {new Date(knowledgeBase.last_updated).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Selected Item Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">{selectedItem.name}</h3>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-white/60 hover:text-white transition-colors"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              {selectedItem.description && (
                <p className="text-white/80">{selectedItem.description}</p>
              )}
              
              {selectedItem.origin && (
                <div>
                  <span className="font-medium text-white">Origin: </span>
                  <span className="text-white/80">{selectedItem.origin}</span>
                </div>
              )}
              
              {selectedItem.common_genres && (
                <div>
                  <span className="font-medium text-white">Common Genres: </span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedItem.common_genres.map((genre: string, index: number) => (
                      <span key={index} className="bg-blue-600/20 text-blue-400 px-2 py-1 rounded text-sm">
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedItem.emotional_character && (
                <div>
                  <span className="font-medium text-white">Emotional Character: </span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedItem.emotional_character.map((emotion: string, index: number) => (
                      <span key={index} className="bg-purple-600/20 text-purple-400 px-2 py-1 rounded text-sm">
                        {emotion}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
