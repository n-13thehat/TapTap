/**
 * TapTap Matrix Smart Playlist Service
 * AI-powered dynamic playlist generation
 */

import { Track } from '@/stores/unifiedPlayer';
import { MusicAnalysisService, MoodType, EnergyLevel } from './musicAnalysisService';

export interface SmartPlaylist {
  id: string;
  title: string;
  description: string;
  tracks: Track[];
  type: PlaylistType;
  icon: string;
  color: string;
  autoUpdate: boolean;
  criteria: PlaylistCriteria;
}

export type PlaylistType = 'mood' | 'activity' | 'time' | 'energy' | 'discovery' | 'personal';

export interface PlaylistCriteria {
  mood?: MoodType;
  energy?: EnergyLevel;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  activity?: 'work' | 'workout' | 'relax' | 'social' | 'creative' | 'commute';
  tags?: string[];
  minScore?: number;
}

export class SmartPlaylistService {
  /**
   * Generate all smart playlists for Music For The Future
   */
  static generateAllSmartPlaylists(tracks: Track[]): SmartPlaylist[] {
    const playlists: SmartPlaylist[] = [];

    // Time-based playlists
    playlists.push(...this.generateTimeBasedPlaylists(tracks));
    
    // Activity-based playlists
    playlists.push(...this.generateActivityBasedPlaylists(tracks));
    
    // Mood-based playlists
    playlists.push(...this.generateMoodBasedPlaylists(tracks));
    
    // Energy-based playlists
    playlists.push(...this.generateEnergyBasedPlaylists(tracks));
    
    // Discovery playlists
    playlists.push(...this.generateDiscoveryPlaylists(tracks));

    return playlists;
  }

  /**
   * Generate time-based playlists
   */
  private static generateTimeBasedPlaylists(tracks: Track[]): SmartPlaylist[] {
    return [
      {
        id: 'morning-energy',
        title: 'Morning Energy',
        description: 'Start your day with uplifting electronic vibes from the future',
        tracks: MusicAnalysisService.getTracksForTimeOfDay('morning', tracks),
        type: 'time',
        icon: '🌅',
        color: 'from-yellow-400 to-orange-500',
        autoUpdate: true,
        criteria: { timeOfDay: 'morning', minScore: 0.6 }
      },
      {
        id: 'afternoon-flow',
        title: 'Afternoon Flow',
        description: 'Keep the momentum going with perfect afternoon tracks',
        tracks: MusicAnalysisService.getTracksForTimeOfDay('afternoon', tracks),
        type: 'time',
        icon: '☀️',
        color: 'from-blue-400 to-cyan-500',
        autoUpdate: true,
        criteria: { timeOfDay: 'afternoon', minScore: 0.6 }
      },
      {
        id: 'evening-vibes',
        title: 'Evening Vibes',
        description: 'Wind down with atmospheric electronic soundscapes',
        tracks: MusicAnalysisService.getTracksForTimeOfDay('evening', tracks),
        type: 'time',
        icon: '🌆',
        color: 'from-purple-400 to-pink-500',
        autoUpdate: true,
        criteria: { timeOfDay: 'evening', minScore: 0.6 }
      },
      {
        id: 'late-night-dreams',
        title: 'Late Night Dreams',
        description: 'Deep, contemplative tracks for late-night listening',
        tracks: MusicAnalysisService.getTracksForTimeOfDay('night', tracks),
        type: 'time',
        icon: '🌙',
        color: 'from-indigo-500 to-purple-600',
        autoUpdate: true,
        criteria: { timeOfDay: 'night', minScore: 0.6 }
      }
    ];
  }

  /**
   * Generate activity-based playlists
   */
  private static generateActivityBasedPlaylists(tracks: Track[]): SmartPlaylist[] {
    return [
      {
        id: 'focus-mode',
        title: 'Focus Mode',
        description: 'Electronic tracks perfect for deep work and concentration',
        tracks: MusicAnalysisService.getTracksForActivity('work', tracks),
        type: 'activity',
        icon: '🎯',
        color: 'from-green-400 to-teal-500',
        autoUpdate: true,
        criteria: { activity: 'work', minScore: 0.7 }
      },
      {
        id: 'workout-energy',
        title: 'Workout Energy',
        description: 'High-energy electronic beats to power your workout',
        tracks: MusicAnalysisService.getTracksForActivity('workout', tracks),
        type: 'activity',
        icon: '💪',
        color: 'from-red-400 to-orange-500',
        autoUpdate: true,
        criteria: { activity: 'workout', minScore: 0.7 }
      },
      {
        id: 'creative-flow',
        title: 'Creative Flow',
        description: 'Inspiring electronic music for creative projects',
        tracks: MusicAnalysisService.getTracksForActivity('creative', tracks),
        type: 'activity',
        icon: '🎨',
        color: 'from-pink-400 to-purple-500',
        autoUpdate: true,
        criteria: { activity: 'creative', minScore: 0.7 }
      },
      {
        id: 'chill-relax',
        title: 'Chill & Relax',
        description: 'Peaceful electronic soundscapes for relaxation',
        tracks: MusicAnalysisService.getTracksForActivity('relax', tracks),
        type: 'activity',
        icon: '🧘',
        color: 'from-blue-300 to-cyan-400',
        autoUpdate: true,
        criteria: { activity: 'relax', minScore: 0.7 }
      }
    ];
  }

  /**
   * Generate mood-based playlists
   */
  private static generateMoodBasedPlaylists(tracks: Track[]): SmartPlaylist[] {
    return [
      {
        id: 'energetic-vibes',
        title: 'Energetic Vibes',
        description: 'High-energy electronic tracks to boost your mood',
        tracks: MusicAnalysisService.getTracksByMood('energetic', tracks),
        type: 'mood',
        icon: '⚡',
        color: 'from-yellow-400 to-red-500',
        autoUpdate: true,
        criteria: { mood: 'energetic' }
      },
      {
        id: 'uplifting-moments',
        title: 'Uplifting Moments',
        description: 'Feel-good electronic music to lift your spirits',
        tracks: MusicAnalysisService.getTracksByMood('uplifting', tracks),
        type: 'mood',
        icon: '🌟',
        color: 'from-green-400 to-blue-500',
        autoUpdate: true,
        criteria: { mood: 'uplifting' }
      },
      {
        id: 'mysterious-depths',
        title: 'Mysterious Depths',
        description: 'Atmospheric electronic tracks with mysterious vibes',
        tracks: MusicAnalysisService.getTracksByMood('mysterious', tracks),
        type: 'mood',
        icon: '🌫️',
        color: 'from-gray-500 to-purple-600',
        autoUpdate: true,
        criteria: { mood: 'mysterious' }
      },
      {
        id: 'dreamy-landscapes',
        title: 'Dreamy Landscapes',
        description: 'Ethereal electronic soundscapes for dreamy moments',
        tracks: MusicAnalysisService.getTracksByMood('dreamy', tracks),
        type: 'mood',
        icon: '☁️',
        color: 'from-purple-300 to-pink-400',
        autoUpdate: true,
        criteria: { mood: 'dreamy' }
      }
    ];
  }

  /**
   * Generate energy-based playlists
   */
  private static generateEnergyBasedPlaylists(tracks: Track[]): SmartPlaylist[] {
    return [
      {
        id: 'high-energy',
        title: 'High Energy',
        description: 'Maximum energy electronic tracks for peak performance',
        tracks: MusicAnalysisService.getTracksByEnergy('high', tracks),
        type: 'energy',
        icon: '🔥',
        color: 'from-red-500 to-orange-600',
        autoUpdate: true,
        criteria: { energy: 'high' }
      },
      {
        id: 'medium-energy',
        title: 'Balanced Energy',
        description: 'Perfectly balanced electronic tracks for any activity',
        tracks: MusicAnalysisService.getTracksByEnergy('medium', tracks),
        type: 'energy',
        icon: '⚖️',
        color: 'from-blue-400 to-green-500',
        autoUpdate: true,
        criteria: { energy: 'medium' }
      },
      {
        id: 'low-energy',
        title: 'Calm Energy',
        description: 'Gentle electronic tracks for peaceful moments',
        tracks: MusicAnalysisService.getTracksByEnergy('low', tracks),
        type: 'energy',
        icon: '🕯️',
        color: 'from-indigo-400 to-purple-500',
        autoUpdate: true,
        criteria: { energy: 'low' }
      }
    ];
  }

  /**
   * Generate discovery playlists
   */
  private static generateDiscoveryPlaylists(tracks: Track[]): SmartPlaylist[] {
    return [
      {
        id: 'hidden-gems',
        title: 'Hidden Gems',
        description: 'Discover the deeper cuts from Music For The Future',
        tracks: this.shuffleArray([...tracks]).slice(0, 3),
        type: 'discovery',
        icon: '💎',
        color: 'from-cyan-400 to-teal-500',
        autoUpdate: true,
        criteria: { tags: ['electronic', 'futuristic'] }
      },
      {
        id: 'daily-discovery',
        title: 'Daily Discovery',
        description: 'A fresh selection of tracks updated daily',
        tracks: this.getRandomTracks(tracks, 4),
        type: 'discovery',
        icon: '🎲',
        color: 'from-pink-400 to-red-500',
        autoUpdate: true,
        criteria: { minScore: 0.5 }
      },
      {
        id: 'complete-journey',
        title: 'Complete Journey',
        description: 'Experience the full Music For The Future collection',
        tracks: tracks,
        type: 'discovery',
        icon: '🚀',
        color: 'from-teal-400 to-blue-600',
        autoUpdate: false,
        criteria: {}
      }
    ];
  }

  /**
   * Get playlist by ID
   */
  static getPlaylistById(id: string, tracks: Track[]): SmartPlaylist | null {
    const playlists = this.generateAllSmartPlaylists(tracks);
    return playlists.find(playlist => playlist.id === id) || null;
  }

  /**
   * Get playlists by type
   */
  static getPlaylistsByType(type: PlaylistType, tracks: Track[]): SmartPlaylist[] {
    const playlists = this.generateAllSmartPlaylists(tracks);
    return playlists.filter(playlist => playlist.type === type);
  }

  /**
   * Utility: Shuffle array
   */
  private static shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Utility: Get random tracks
   */
  private static getRandomTracks(tracks: Track[], count: number): Track[] {
    const shuffled = this.shuffleArray(tracks);
    return shuffled.slice(0, Math.min(count, tracks.length));
  }
}
