"use client";

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  X, 
  SlidersHorizontal,
  Calendar,
  Tag,
  Star,
  TrendingUp,
  Clock
} from 'lucide-react';

interface FilterOption {
  id: string;
  label: string;
  value: string;
  count?: number;
}

interface SearchFilters {
  category?: string;
  dateRange?: string;
  rating?: string;
  sortBy?: string;
  tags?: string[];
}

interface EnhancedSearchProps {
  placeholder?: string;
  onSearch: (query: string, filters: SearchFilters) => void;
  categories?: FilterOption[];
  tags?: FilterOption[];
  showFilters?: boolean;
  initialQuery?: string;
  initialFilters?: SearchFilters;
}

export default function EnhancedSearch({
  placeholder = "Search...",
  onSearch,
  categories = [],
  tags = [],
  showFilters = true,
  initialQuery = "",
  initialFilters = {}
}: EnhancedSearchProps) {
  const [query, setQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>(initialFilters.tags || []);

  const handleSearch = useCallback(() => {
    onSearch(query, { ...filters, tags: selectedTags });
  }, [query, filters, selectedTags, onSearch]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const clearFilters = () => {
    setFilters({});
    setSelectedTags([]);
    setQuery("");
    onSearch("", {});
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.category) count++;
    if (filters.dateRange) count++;
    if (filters.rating) count++;
    if (filters.sortBy) count++;
    if (selectedTags.length > 0) count++;
    return count;
  }, [filters, selectedTags]);

  return (
    <div className="w-full space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-3 h-4 w-4 text-white/40" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            className="w-full rounded-lg border border-white/10 bg-white/5 pl-10 pr-20 py-3 text-white placeholder-white/40 focus:border-teal-400/50 focus:outline-none focus:ring-1 focus:ring-teal-400/50"
          />
          <div className="absolute right-2 flex items-center gap-2">
            {showFilters && (
              <button
                onClick={() => setShowFilterPanel(!showFilterPanel)}
                className={`rounded-md border p-2 transition-colors ${
                  showFilterPanel || activeFilterCount > 0
                    ? 'border-teal-400/50 bg-teal-400/10 text-teal-300'
                    : 'border-white/10 bg-white/5 text-white/40 hover:bg-white/10'
                }`}
              >
                <SlidersHorizontal className="h-4 w-4" />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-teal-400 text-xs text-black flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            )}
            <button
              onClick={handleSearch}
              className="rounded-md border border-teal-400/50 bg-teal-400/10 px-4 py-2 text-sm text-teal-300 hover:bg-teal-400/20 transition-colors"
            >
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilterPanel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-lg border border-white/10 bg-white/5 p-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Filters</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={clearFilters}
                  className="text-xs text-white/60 hover:text-white transition-colors"
                >
                  Clear all
                </button>
                <button
                  onClick={() => setShowFilterPanel(false)}
                  className="rounded-md border border-white/10 bg-white/5 p-1 text-white/40 hover:bg-white/10"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Category Filter */}
              {categories.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-white/70 mb-2">
                    <Tag className="inline h-3 w-3 mr-1" />
                    Category
                  </label>
                  <select
                    value={filters.category || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value || undefined }))}
                    className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-teal-400/50 focus:outline-none"
                  >
                    <option value="">All categories</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.value}>
                        {cat.label} {cat.count && `(${cat.count})`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Date Range Filter */}
              <div>
                <label className="block text-xs font-medium text-white/70 mb-2">
                  <Calendar className="inline h-3 w-3 mr-1" />
                  Date Range
                </label>
                <select
                  value={filters.dateRange || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value || undefined }))}
                  className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-teal-400/50 focus:outline-none"
                >
                  <option value="">Any time</option>
                  <option value="today">Today</option>
                  <option value="week">This week</option>
                  <option value="month">This month</option>
                  <option value="year">This year</option>
                </select>
              </div>

              {/* Rating Filter */}
              <div>
                <label className="block text-xs font-medium text-white/70 mb-2">
                  <Star className="inline h-3 w-3 mr-1" />
                  Rating
                </label>
                <select
                  value={filters.rating || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, rating: e.target.value || undefined }))}
                  className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-teal-400/50 focus:outline-none"
                >
                  <option value="">Any rating</option>
                  <option value="5">5 stars</option>
                  <option value="4+">4+ stars</option>
                  <option value="3+">3+ stars</option>
                </select>
              </div>

              {/* Sort By Filter */}
              <div>
                <label className="block text-xs font-medium text-white/70 mb-2">
                  <TrendingUp className="inline h-3 w-3 mr-1" />
                  Sort By
                </label>
                <select
                  value={filters.sortBy || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value || undefined }))}
                  className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-teal-400/50 focus:outline-none"
                >
                  <option value="">Relevance</option>
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="popular">Most popular</option>
                  <option value="rating">Highest rated</option>
                </select>
              </div>
            </div>

            {/* Tags */}
            {tags.length > 0 && (
              <div className="mt-4">
                <label className="block text-xs font-medium text-white/70 mb-2">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => toggleTag(tag.id)}
                      className={`rounded-full px-3 py-1 text-xs transition-colors ${
                        selectedTags.includes(tag.id)
                          ? 'bg-teal-400/20 text-teal-300 border border-teal-400/50'
                          : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {tag.label}
                      {tag.count && ` (${tag.count})`}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
