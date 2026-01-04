/**
 * Library Manager
 * Core library management system with advanced filtering and smart playlists
 */

import { Track } from '@/types/track';
import { 
  LibraryItem, 
  Playlist, 
  SmartPlaylist, 
  LibraryFilter, 
  SortOption, 
  LibraryStats,
  SmartPlaylistRule,
  LibraryRecommendation
} from './types';
import { eventBus, EventTypes } from '../eventBus';

export class LibraryManager {
  private tracks: Map<string, LibraryItem> = new Map();
  private playlists: Map<string, Playlist> = new Map();
  private smartPlaylists: Map<string, SmartPlaylist> = new Map();
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
    this.loadFromStorage();
  }

  /**
   * Add track to library
   */
  async addTrack(track: Track, metadata?: Record<string, any>): Promise<void> {
    const libraryItem: LibraryItem = {
      id: track.id,
      type: 'track',
      addedAt: Date.now(),
      playCount: 0,
      isFavorite: false,
      tags: [],
      metadata: {
        track,
        ...metadata,
      },
    };

    this.tracks.set(track.id, libraryItem);
    await this.persistToStorage();

    // Emit event
    eventBus.emit(EventTypes.TRACK_SAVED, {
      trackId: track.id,
      title: track.title,
      artist: this.getArtistName(track),
    }, {
      userId: this.userId,
      source: 'library-manager',
    });

    // Update smart playlists
    await this.updateSmartPlaylists();

    console.log(`Track added to library: ${track.title}`);
  }

  /**
   * Remove track from library
   */
  async removeTrack(trackId: string): Promise<void> {
    const item = this.tracks.get(trackId);
    if (!item) return;

    this.tracks.delete(trackId);
    
    // Remove from all playlists
    for (const playlist of this.playlists.values()) {
      playlist.tracks = playlist.tracks.filter(t => t.id !== trackId);
      playlist.updatedAt = Date.now();
    }

    await this.persistToStorage();
    console.log(`Track removed from library: ${trackId}`);
  }

  /**
   * Create playlist
   */
  async createPlaylist(
    name: string,
    description?: string,
    isPublic = false,
    tracks: Track[] = []
  ): Promise<Playlist> {
    const playlist: Playlist = {
      id: `playlist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      tracks,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isPublic,
      isCollaborative: false,
      createdBy: this.userId,
      collaborators: [],
      tags: [],
      totalDuration: tracks.reduce((sum, track) => sum + (track.duration || 0), 0),
      playCount: 0,
      likeCount: 0,
      shareCount: 0,
      metadata: {},
    };

    this.playlists.set(playlist.id, playlist);
    await this.persistToStorage();

    // Emit event
    eventBus.emit(EventTypes.PLAYLIST_CREATED, {
      playlistId: playlist.id,
      name: playlist.name,
      trackCount: tracks.length,
    }, {
      userId: this.userId,
      source: 'library-manager',
    });

    console.log(`Playlist created: ${name}`);
    return playlist;
  }

  /**
   * Create smart playlist
   */
  async createSmartPlaylist(
    name: string,
    rules: SmartPlaylistRule[],
    sortBy: SortOption,
    maxTracks = 100
  ): Promise<SmartPlaylist> {
    const smartPlaylist: SmartPlaylist = {
      id: `smart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description: `Smart playlist with ${rules.length} rules`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isPublic: false,
      isCollaborative: false,
      createdBy: this.userId,
      collaborators: [],
      tags: ['smart'],
      totalDuration: 0,
      playCount: 0,
      likeCount: 0,
      shareCount: 0,
      metadata: {},
      isSmartPlaylist: true,
      rules,
      autoUpdate: true,
      maxTracks,
      sortBy,
      lastUpdated: Date.now(),
    };

    this.smartPlaylists.set(smartPlaylist.id, smartPlaylist);
    await this.updateSmartPlaylist(smartPlaylist.id);
    await this.persistToStorage();

    console.log(`Smart playlist created: ${name}`);
    return smartPlaylist;
  }

  /**
   * Filter library tracks
   */
  filterTracks(filter: LibraryFilter, sort?: SortOption): Track[] {
    let tracks = Array.from(this.tracks.values())
      .map(item => item.metadata.track as Track)
      .filter(track => track);

    // Apply filters
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      tracks = tracks.filter(track => 
        track.title.toLowerCase().includes(searchLower) ||
        this.getArtistName(track).toLowerCase().includes(searchLower)
      );
    }

    if (filter.genres?.length) {
      tracks = tracks.filter(track => 
        filter.genres!.some(genre => track.genre?.toLowerCase().includes(genre.toLowerCase()))
      );
    }

      if (filter.artists?.length) {
        tracks = tracks.filter(track => 
          filter.artists!.some(artist => 
            this.getArtistName(track).toLowerCase().includes(artist.toLowerCase())
          )
        );
    }

    if (filter.durationRange) {
      tracks = tracks.filter(track => {
        const duration = track.duration || 0;
        return duration >= filter.durationRange!.min && duration <= filter.durationRange!.max;
      });
    }

    if (filter.isFavorite !== undefined) {
      tracks = tracks.filter(track => {
        const item = this.tracks.get(track.id);
        return item?.isFavorite === filter.isFavorite;
      });
    }

    if (filter.hasBeenPlayed !== undefined) {
      tracks = tracks.filter(track => {
        const item = this.tracks.get(track.id);
        return filter.hasBeenPlayed ? (item?.playCount || 0) > 0 : (item?.playCount || 0) === 0;
      });
    }

    if (filter.addedRecently) {
      const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      tracks = tracks.filter(track => {
        const item = this.tracks.get(track.id);
        return (item?.addedAt || 0) > weekAgo;
      });
    }

    // Apply sorting
    if (sort) {
      tracks = this.sortTracks(tracks, sort);
    }

    return tracks;
  }

  /**
   * Sort tracks
   */
  private getArtistName(track: Track): string {
    return track.artist?.stageName || track.artistId || 'Unknown Artist';
  }

  private sortTracks(tracks: Track[], sort: SortOption): Track[] {
    return tracks.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sort.field) {
        case 'name':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'artist':
          aValue = this.getArtistName(a).toLowerCase();
          bValue = this.getArtistName(b).toLowerCase();
          break;
        case 'duration':
          aValue = a.duration || 0;
          bValue = b.duration || 0;
          break;
        case 'addedAt':
          aValue = this.tracks.get(a.id)?.addedAt || 0;
          bValue = this.tracks.get(b.id)?.addedAt || 0;
          break;
        case 'playCount':
          aValue = this.tracks.get(a.id)?.playCount || 0;
          bValue = this.tracks.get(b.id)?.playCount || 0;
          break;
        case 'random':
          return Math.random() - 0.5;
        default:
          return 0;
      }

      if (sort.direction === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }

  /**
   * Update smart playlist
   */
  private async updateSmartPlaylist(playlistId: string): Promise<void> {
    const smartPlaylist = this.smartPlaylists.get(playlistId);
    if (!smartPlaylist || !smartPlaylist.autoUpdate) return;

    // Apply rules to get matching tracks
    const matchingTracks = this.applySmartPlaylistRules(smartPlaylist.rules);
    
    // Sort and limit
    const sortedTracks = this.sortTracks(matchingTracks, smartPlaylist.sortBy);
    const limitedTracks = smartPlaylist.maxTracks 
      ? sortedTracks.slice(0, smartPlaylist.maxTracks)
      : sortedTracks;

    // Update playlist
    const playlist: Playlist = {
      ...smartPlaylist,
      tracks: limitedTracks,
      totalDuration: limitedTracks.reduce((sum, track) => sum + (track.duration || 0), 0),
      updatedAt: Date.now(),
    };

    this.playlists.set(playlistId, playlist);
    smartPlaylist.lastUpdated = Date.now();

    console.log(`Smart playlist updated: ${smartPlaylist.name} (${limitedTracks.length} tracks)`);
  }

  /**
   * Apply smart playlist rules
   */
  private applySmartPlaylistRules(rules: SmartPlaylistRule[]): Track[] {
    const allTracks = Array.from(this.tracks.values())
      .map(item => item.metadata.track as Track)
      .filter(track => track);

    return allTracks.filter(track => {
      let result = true;
      let hasOrCondition = false;

      for (const rule of rules) {
        const ruleResult = this.evaluateRule(track, rule);
        
        if (rule.logic === 'AND') {
          result = result && ruleResult;
        } else if (rule.logic === 'OR') {
          if (!hasOrCondition) {
            result = ruleResult;
            hasOrCondition = true;
          } else {
            result = result || ruleResult;
          }
        }
      }

      return result;
    });
  }

  /**
   * Evaluate smart playlist rule
   */
  private evaluateRule(track: Track, rule: SmartPlaylistRule): boolean {
    const item = this.tracks.get(track.id);
    let fieldValue: any;

    switch (rule.field) {
      case 'genre':
        fieldValue = track.genre || '';
        break;
      case 'artist':
        fieldValue = this.getArtistName(track);
        break;
      case 'duration':
        fieldValue = track.duration || 0;
        break;
      case 'playCount':
        fieldValue = item?.playCount || 0;
        break;
      case 'addedAt':
        fieldValue = item?.addedAt || 0;
        break;
      case 'lastPlayed':
        fieldValue = item?.lastPlayed || 0;
        break;
      case 'tags':
        fieldValue = item?.tags || [];
        break;
      default:
        return false;
    }

    switch (rule.operator) {
      case 'equals':
        return fieldValue === rule.value;
      case 'contains':
        return String(fieldValue).toLowerCase().includes(String(rule.value).toLowerCase());
      case 'greaterThan':
        return Number(fieldValue) > Number(rule.value);
      case 'lessThan':
        return Number(fieldValue) < Number(rule.value);
      case 'in':
        return Array.isArray(rule.value) && rule.value.includes(fieldValue);
      case 'notIn':
        return Array.isArray(rule.value) && !rule.value.includes(fieldValue);
      default:
        return false;
    }
  }

  /**
   * Update all smart playlists
   */
  private async updateSmartPlaylists(): Promise<void> {
    for (const smartPlaylist of this.smartPlaylists.values()) {
      if (smartPlaylist.autoUpdate) {
        await this.updateSmartPlaylist(smartPlaylist.id);
      }
    }
  }

  /**
   * Get library statistics
   */
  getStats(): LibraryStats {
    const tracks = Array.from(this.tracks.values());
    const trackObjects = tracks.map(item => item.metadata.track as Track).filter(Boolean);
    
    const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const monthAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const yearAgo = Date.now() - (365 * 24 * 60 * 60 * 1000);

    const genreDistribution = trackObjects.reduce((acc, track) => {
      const genre = track.genre || 'Unknown';
      acc[genre] = (acc[genre] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalTracks: tracks.length,
      totalPlaylists: this.playlists.size,
      totalDuration: trackObjects.reduce((sum, track) => sum + (track.duration || 0), 0),
      totalPlayCount: tracks.reduce((sum, item) => sum + item.playCount, 0),
      favoriteCount: tracks.filter(item => item.isFavorite).length,
      genreDistribution,
      moodDistribution: {}, // Would be populated with mood analysis
      recentlyAdded: tracks.filter(item => item.addedAt > weekAgo).length,
      recentlyPlayed: tracks.filter(item => (item.lastPlayed || 0) > weekAgo).length,
      averageTrackDuration: trackObjects.length > 0 
        ? trackObjects.reduce((sum, track) => sum + (track.duration || 0), 0) / trackObjects.length 
        : 0,
      mostPlayedGenre: Object.keys(genreDistribution).reduce((a, b) => 
        genreDistribution[a] > genreDistribution[b] ? a : b, 'Unknown'),
      mostPlayedArtist: 'Unknown', // Would be calculated from play counts
      libraryGrowth: {
        thisWeek: tracks.filter(item => item.addedAt > weekAgo).length,
        thisMonth: tracks.filter(item => item.addedAt > monthAgo).length,
        thisYear: tracks.filter(item => item.addedAt > yearAgo).length,
      },
    };
  }

  /**
   * Get all tracks
   */
  getAllTracks(): Track[] {
    return Array.from(this.tracks.values())
      .map(item => item.metadata.track as Track)
      .filter(track => track);
  }

  /**
   * Get all playlists
   */
  getAllPlaylists(): Playlist[] {
    return Array.from(this.playlists.values());
  }

  /**
   * Get playlist by ID
   */
  getPlaylist(id: string): Playlist | undefined {
    return this.playlists.get(id);
  }

  /**
   * Toggle favorite status
   */
  async toggleFavorite(trackId: string): Promise<boolean> {
    const item = this.tracks.get(trackId);
    if (!item) return false;

    item.isFavorite = !item.isFavorite;
    await this.persistToStorage();

    console.log(`Track ${item.isFavorite ? 'added to' : 'removed from'} favorites: ${trackId}`);
    return item.isFavorite;
  }

  /**
   * Increment play count
   */
  async incrementPlayCount(trackId: string): Promise<void> {
    const item = this.tracks.get(trackId);
    if (!item) return;

    item.playCount++;
    item.lastPlayed = Date.now();
    await this.persistToStorage();

    // Update smart playlists that might depend on play count
    await this.updateSmartPlaylists();
  }

  // Storage methods
  private async persistToStorage(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      const data = {
        tracks: Array.from(this.tracks.entries()),
        playlists: Array.from(this.playlists.entries()),
        smartPlaylists: Array.from(this.smartPlaylists.entries()),
      };

      localStorage.setItem(`taptap_library_${this.userId}`, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to persist library:', error);
    }
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(`taptap_library_${this.userId}`);
      if (stored) {
        const data = JSON.parse(stored);
        
        this.tracks = new Map(data.tracks || []);
        this.playlists = new Map(data.playlists || []);
        this.smartPlaylists = new Map(data.smartPlaylists || []);

        console.log(`Library loaded: ${this.tracks.size} tracks, ${this.playlists.size} playlists`);
      }
    } catch (error) {
      console.error('Failed to load library:', error);
    }
  }
}
