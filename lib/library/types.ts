/**
 * Library Types and Interfaces
 * Comprehensive type definitions for the TapTap library system
 */

import { Track } from '@/types/track';

export interface LibraryItem {
  id: string;
  type: 'track' | 'playlist' | 'album' | 'artist';
  addedAt: number;
  lastPlayed?: number;
  playCount: number;
  isFavorite: boolean;
  tags: string[];
  metadata: Record<string, any>;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  coverImage?: string;
  tracks: Track[];
  createdAt: number;
  updatedAt: number;
  isPublic: boolean;
  isCollaborative: boolean;
  createdBy: string;
  collaborators: string[];
  tags: string[];
  totalDuration: number;
  playCount: number;
  likeCount: number;
  shareCount: number;
  metadata: {
    mood?: string;
    genre?: string[];
    energy?: number; // 1-10
    tempo?: 'slow' | 'medium' | 'fast';
    activity?: string; // workout, study, party, etc.
  };
}

export interface SmartPlaylist extends Omit<Playlist, 'tracks'> {
  isSmartPlaylist: true;
  rules: SmartPlaylistRule[];
  autoUpdate: boolean;
  maxTracks?: number;
  sortBy: SortOption;
  lastUpdated: number;
}

export interface SmartPlaylistRule {
  id: string;
  field: 'genre' | 'artist' | 'duration' | 'playCount' | 'addedAt' | 'lastPlayed' | 'energy' | 'mood' | 'tags';
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan' | 'between' | 'in' | 'notIn';
  value: any;
  logic: 'AND' | 'OR';
}

export interface LibraryFilter {
  search?: string;
  genres?: string[];
  artists?: string[];
  moods?: string[];
  tags?: string[];
  dateRange?: {
    start: number;
    end: number;
  };
  playCountRange?: {
    min: number;
    max: number;
  };
  durationRange?: {
    min: number; // seconds
    max: number; // seconds
  };
  energyRange?: {
    min: number; // 1-10
    max: number; // 1-10
  };
  isFavorite?: boolean;
  hasBeenPlayed?: boolean;
  addedRecently?: boolean; // last 7 days
}

export interface SortOption {
  field: 'name' | 'artist' | 'addedAt' | 'lastPlayed' | 'playCount' | 'duration' | 'energy' | 'random';
  direction: 'asc' | 'desc';
}

export interface LibraryView {
  id: string;
  name: string;
  type: 'grid' | 'list' | 'compact' | 'detailed';
  itemsPerPage: number;
  showMetadata: boolean;
  showPlayCount: boolean;
  showAddedDate: boolean;
  showDuration: boolean;
  showTags: boolean;
}

export interface LibraryStats {
  totalTracks: number;
  totalPlaylists: number;
  totalDuration: number; // seconds
  totalPlayCount: number;
  favoriteCount: number;
  genreDistribution: Record<string, number>;
  moodDistribution: Record<string, number>;
  recentlyAdded: number; // last 7 days
  recentlyPlayed: number; // last 7 days
  averageTrackDuration: number;
  mostPlayedGenre: string;
  mostPlayedArtist: string;
  libraryGrowth: {
    thisWeek: number;
    thisMonth: number;
    thisYear: number;
  };
}

export interface SocialPlaylist {
  id: string;
  playlist: Playlist;
  owner: {
    id: string;
    name: string;
    avatar?: string;
  };
  isFollowing: boolean;
  canEdit: boolean;
  activity: PlaylistActivity[];
}

export interface PlaylistActivity {
  id: string;
  type: 'track_added' | 'track_removed' | 'playlist_shared' | 'playlist_liked' | 'collaborator_added';
  userId: string;
  userName: string;
  timestamp: number;
  data: Record<string, any>;
}

export interface LibraryRecommendation {
  id: string;
  type: 'track' | 'playlist' | 'artist' | 'genre';
  title: string;
  description: string;
  items: Track[] | Playlist[];
  reason: string;
  confidence: number; // 0-1
  source: 'listening_history' | 'similar_users' | 'trending' | 'new_releases' | 'mood_based';
  createdAt: number;
}

export interface LibraryImport {
  id: string;
  source: 'spotify' | 'apple_music' | 'youtube_music' | 'soundcloud' | 'file_upload';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  totalItems: number;
  processedItems: number;
  failedItems: number;
  startedAt: number;
  completedAt?: number;
  errors: string[];
}

export interface LibraryExport {
  id: string;
  format: 'json' | 'csv' | 'xml' | 'm3u' | 'pls';
  includeMetadata: boolean;
  includePlaylists: boolean;
  includePlayCounts: boolean;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  createdAt: number;
  expiresAt: number;
}
