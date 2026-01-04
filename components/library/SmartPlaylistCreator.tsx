"use client";

import { useState } from 'react';
import { SmartPlaylistRule, SortOption } from '@/lib/library/types';
import { X, Plus, Trash2, Sparkles, Play } from 'lucide-react';

interface SmartPlaylistCreatorProps {
  onClose: () => void;
  onCreate: (name: string, rules: SmartPlaylistRule[], sortBy: SortOption, maxTracks?: number) => void;
}

export default function SmartPlaylistCreator({ onClose, onCreate }: SmartPlaylistCreatorProps) {
  const [name, setName] = useState('');
  const [rules, setRules] = useState<SmartPlaylistRule[]>([
    {
      id: '1',
      field: 'genre',
      operator: 'contains',
      value: '',
      logic: 'AND',
    },
  ]);
  const [sortBy, setSortBy] = useState<SortOption>({ field: 'addedAt', direction: 'desc' });
  const [maxTracks, setMaxTracks] = useState(100);

  const fieldOptions = [
    { value: 'genre', label: 'Genre' },
    { value: 'artist', label: 'Artist' },
    { value: 'duration', label: 'Duration (seconds)' },
    { value: 'playCount', label: 'Play Count' },
    { value: 'addedAt', label: 'Date Added' },
    { value: 'lastPlayed', label: 'Last Played' },
    { value: 'tags', label: 'Tags' },
  ];

  const operatorOptions = {
    genre: [
      { value: 'contains', label: 'contains' },
      { value: 'equals', label: 'equals' },
      { value: 'startsWith', label: 'starts with' },
    ],
    artist: [
      { value: 'contains', label: 'contains' },
      { value: 'equals', label: 'equals' },
      { value: 'startsWith', label: 'starts with' },
    ],
    duration: [
      { value: 'greaterThan', label: 'greater than' },
      { value: 'lessThan', label: 'less than' },
      { value: 'equals', label: 'equals' },
    ],
    playCount: [
      { value: 'greaterThan', label: 'greater than' },
      { value: 'lessThan', label: 'less than' },
      { value: 'equals', label: 'equals' },
    ],
    addedAt: [
      { value: 'greaterThan', label: 'after' },
      { value: 'lessThan', label: 'before' },
    ],
    lastPlayed: [
      { value: 'greaterThan', label: 'after' },
      { value: 'lessThan', label: 'before' },
    ],
    tags: [
      { value: 'contains', label: 'contains' },
      { value: 'in', label: 'includes any of' },
    ],
  };

  const sortOptions = [
    { value: 'name', label: 'Name' },
    { value: 'artist', label: 'Artist' },
    { value: 'addedAt', label: 'Date Added' },
    { value: 'lastPlayed', label: 'Last Played' },
    { value: 'playCount', label: 'Play Count' },
    { value: 'duration', label: 'Duration' },
    { value: 'random', label: 'Random' },
  ];

  const addRule = () => {
    const newRule: SmartPlaylistRule = {
      id: Date.now().toString(),
      field: 'genre',
      operator: 'contains',
      value: '',
      logic: 'AND',
    };
    setRules([...rules, newRule]);
  };

  const removeRule = (id: string) => {
    setRules(rules.filter(rule => rule.id !== id));
  };

  const updateRule = (id: string, updates: Partial<SmartPlaylistRule>) => {
    setRules(rules.map(rule => 
      rule.id === id ? { ...rule, ...updates } : rule
    ));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && rules.length > 0) {
      onCreate(name.trim(), rules, sortBy, maxTracks);
    }
  };

  const getInputType = (field: string) => {
    if (field === 'duration' || field === 'playCount') return 'number';
    if (field === 'addedAt' || field === 'lastPlayed') return 'date';
    return 'text';
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-black/90 border border-white/20 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Sparkles size={24} className="text-purple-400" />
            <h2 className="text-xl font-semibold text-white">Create Smart Playlist</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={20} className="text-white/60" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Playlist Name */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Playlist Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Smart Playlist"
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:border-purple-400"
              required
            />
          </div>

          {/* Rules */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-medium text-white/80">Rules</label>
              <button
                type="button"
                onClick={addRule}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded-lg text-sm transition-colors"
              >
                <Plus size={14} />
                Add Rule
              </button>
            </div>

            <div className="space-y-3">
              {rules.map((rule, index) => (
                <div key={rule.id} className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    {index > 0 && (
                      <select
                        value={rule.logic}
                        onChange={(e) => updateRule(rule.id, { logic: e.target.value as 'AND' | 'OR' })}
                        className="bg-white/10 border border-white/20 rounded px-2 py-1 text-sm text-white"
                      >
                        <option value="AND">AND</option>
                        <option value="OR">OR</option>
                      </select>
                    )}
                    
                    <select
                      value={rule.field}
                      onChange={(e) => updateRule(rule.id, { 
                        field: e.target.value as any,
                        operator: operatorOptions[e.target.value as keyof typeof operatorOptions]?.[0]?.value as any
                      })}
                      className="bg-white/10 border border-white/20 rounded px-3 py-2 text-white flex-1"
                    >
                      {fieldOptions.map(option => (
                        <option key={option.value} value={option.value} className="bg-black">
                          {option.label}
                        </option>
                      ))}
                    </select>

                    <select
                      value={rule.operator}
                      onChange={(e) => updateRule(rule.id, { operator: e.target.value as any })}
                      className="bg-white/10 border border-white/20 rounded px-3 py-2 text-white flex-1"
                    >
                      {operatorOptions[rule.field as keyof typeof operatorOptions]?.map(option => (
                        <option key={option.value} value={option.value} className="bg-black">
                          {option.label}
                        </option>
                      ))}
                    </select>

                    <input
                      type={getInputType(rule.field)}
                      value={rule.value}
                      onChange={(e) => updateRule(rule.id, { value: e.target.value })}
                      placeholder="Value"
                      className="bg-white/10 border border-white/20 rounded px-3 py-2 text-white flex-1"
                    />

                    {rules.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRule(rule.id)}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-600/20 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-white/60">
                    {index === 0 ? 'Include tracks where' : rule.logic === 'AND' ? 'and' : 'or'} {' '}
                    <span className="text-purple-300">{rule.field}</span> {' '}
                    <span className="text-blue-300">{operatorOptions[rule.field as keyof typeof operatorOptions]?.find(op => op.value === rule.operator)?.label}</span> {' '}
                    <span className="text-green-300">"{rule.value}"</span>
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Sort & Limit */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Sort By
              </label>
              <div className="flex gap-2">
                <select
                  value={sortBy.field}
                  onChange={(e) => setSortBy({ ...sortBy, field: e.target.value as any })}
                  className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value} className="bg-black">
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  value={sortBy.direction}
                  onChange={(e) => setSortBy({ ...sortBy, direction: e.target.value as 'asc' | 'desc' })}
                  className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                >
                  <option value="asc" className="bg-black">Ascending</option>
                  <option value="desc" className="bg-black">Descending</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Max Tracks
              </label>
              <input
                type="number"
                value={maxTracks}
                onChange={(e) => setMaxTracks(parseInt(e.target.value) || 100)}
                min="1"
                max="1000"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
              />
            </div>
          </div>

          {/* Preview */}
          <div className="bg-blue-600/20 border border-blue-600/30 rounded-lg p-4">
            <h3 className="font-medium text-blue-300 mb-2">Preview</h3>
            <p className="text-sm text-white/80">
              This smart playlist will automatically include tracks that match your rules and update as you add new music to your library.
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-white/80 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || rules.length === 0}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg transition-colors"
          >
            <Sparkles size={16} />
            Create Smart Playlist
          </button>
        </div>
      </div>
    </div>
  );
}
