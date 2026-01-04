/**
 * TapTap Matrix Music Analysis Service
 * AI-powered music analysis and discovery engine
 */

import { Track } from '@/stores/unifiedPlayer';

export interface MusicAnalysis {
  trackId: string;
  mood: MoodType;
  energy: EnergyLevel;
  tempo: TempoRange;
  characteristics: string[];
  emotionalTone: EmotionalTone;
  timeOfDayScore: TimeOfDayScores;
  activityScore: ActivityScores;
  tags: string[];
}

export type MoodType = 'energetic' | 'chill' | 'melancholic' | 'uplifting' | 'mysterious' | 'dreamy' | 'intense' | 'peaceful';
export type EnergyLevel = 'low' | 'medium' | 'high' | 'very-high';
export type TempoRange = 'slow' | 'moderate' | 'fast' | 'very-fast';
export type EmotionalTone = 'happy' | 'sad' | 'neutral' | 'excited' | 'contemplative' | 'nostalgic' | 'futuristic';

export interface TimeOfDayScores {
  morning: number;    // 0-1 score for morning listening
  afternoon: number;  // 0-1 score for afternoon
  evening: number;    // 0-1 score for evening
  night: number;      // 0-1 score for late night
}

export interface ActivityScores {
  work: number;       // 0-1 score for work/focus
  workout: number;    // 0-1 score for exercise
  relax: number;      // 0-1 score for relaxation
  social: number;     // 0-1 score for social settings
  creative: number;   // 0-1 score for creative work
  commute: number;    // 0-1 score for travel/commute
}

export class MusicAnalysisService {
  /**
   * Analyze Music For The Future tracks with AI-powered insights
   */
  static getMusicForTheFutureAnalysis(): Record<string, MusicAnalysis> {
    return {
      // Based on track titles and the futuristic electronic nature
      'MHMH': {
        trackId: 'MHMH',
        mood: 'energetic',
        energy: 'high',
        tempo: 'fast',
        characteristics: ['electronic', 'rhythmic', 'catchy', 'modern'],
        emotionalTone: 'excited',
        timeOfDayScore: {
          morning: 0.8,
          afternoon: 0.9,
          evening: 0.7,
          night: 0.6
        },
        activityScore: {
          work: 0.7,
          workout: 0.9,
          relax: 0.3,
          social: 0.8,
          creative: 0.8,
          commute: 0.9
        },
        tags: ['upbeat', 'electronic', 'energizing', 'modern', 'catchy']
      },

      'Lost (Stay Frosty)': {
        trackId: 'Lost (Stay Frosty)',
        mood: 'mysterious',
        energy: 'medium',
        tempo: 'moderate',
        characteristics: ['atmospheric', 'electronic', 'introspective', 'layered'],
        emotionalTone: 'contemplative',
        timeOfDayScore: {
          morning: 0.4,
          afternoon: 0.6,
          evening: 0.8,
          night: 0.9
        },
        activityScore: {
          work: 0.8,
          workout: 0.4,
          relax: 0.7,
          social: 0.5,
          creative: 0.9,
          commute: 0.7
        },
        tags: ['atmospheric', 'mysterious', 'electronic', 'thoughtful', 'immersive']
      },

      'life is worth the wait 2.0': {
        trackId: 'life is worth the wait 2.0',
        mood: 'uplifting',
        energy: 'medium',
        tempo: 'moderate',
        characteristics: ['inspirational', 'electronic', 'hopeful', 'evolving'],
        emotionalTone: 'happy',
        timeOfDayScore: {
          morning: 0.9,
          afternoon: 0.8,
          evening: 0.6,
          night: 0.4
        },
        activityScore: {
          work: 0.6,
          workout: 0.7,
          relax: 0.8,
          social: 0.7,
          creative: 0.8,
          commute: 0.8
        },
        tags: ['uplifting', 'hopeful', 'electronic', 'inspirational', 'positive']
      },

      'deep end': {
        trackId: 'deep end',
        mood: 'intense',
        energy: 'high',
        tempo: 'fast',
        characteristics: ['powerful', 'electronic', 'driving', 'immersive'],
        emotionalTone: 'excited',
        timeOfDayScore: {
          morning: 0.6,
          afternoon: 0.8,
          evening: 0.9,
          night: 0.8
        },
        activityScore: {
          work: 0.5,
          workout: 0.9,
          relax: 0.2,
          social: 0.8,
          creative: 0.7,
          commute: 0.7
        },
        tags: ['intense', 'powerful', 'electronic', 'driving', 'energetic']
      },

      '2Horns': {
        trackId: '2Horns',
        mood: 'dreamy',
        energy: 'low',
        tempo: 'slow',
        characteristics: ['ambient', 'electronic', 'expansive', 'cinematic'],
        emotionalTone: 'contemplative',
        timeOfDayScore: {
          morning: 0.3,
          afternoon: 0.5,
          evening: 0.8,
          night: 0.9
        },
        activityScore: {
          work: 0.9,
          workout: 0.2,
          relax: 0.9,
          social: 0.4,
          creative: 0.9,
          commute: 0.6
        },
        tags: ['ambient', 'dreamy', 'electronic', 'expansive', 'meditative']
      }
    };
  }

  /**
   * Get tracks by mood
   */
  static getTracksByMood(mood: MoodType, tracks: Track[]): Track[] {
    const analysis = this.getMusicForTheFutureAnalysis();
    return tracks.filter(track => {
      const trackAnalysis = analysis[track.title];
      return trackAnalysis?.mood === mood;
    });
  }

  /**
   * Get tracks by energy level
   */
  static getTracksByEnergy(energy: EnergyLevel, tracks: Track[]): Track[] {
    const analysis = this.getMusicForTheFutureAnalysis();
    return tracks.filter(track => {
      const trackAnalysis = analysis[track.title];
      return trackAnalysis?.energy === energy;
    });
  }

  /**
   * Get tracks suitable for time of day
   */
  static getTracksForTimeOfDay(timeOfDay: keyof TimeOfDayScores, tracks: Track[]): Track[] {
    const analysis = this.getMusicForTheFutureAnalysis();
    return tracks
      .map(track => ({
        track,
        score: analysis[track.title]?.timeOfDayScore[timeOfDay] || 0
      }))
      .filter(item => item.score > 0.6)
      .sort((a, b) => b.score - a.score)
      .map(item => item.track);
  }

  /**
   * Get tracks suitable for activity
   */
  static getTracksForActivity(activity: keyof ActivityScores, tracks: Track[]): Track[] {
    const analysis = this.getMusicForTheFutureAnalysis();
    return tracks
      .map(track => ({
        track,
        score: analysis[track.title]?.activityScore[activity] || 0
      }))
      .filter(item => item.score > 0.6)
      .sort((a, b) => b.score - a.score)
      .map(item => item.track);
  }

  /**
   * Get similar tracks based on characteristics
   */
  static getSimilarTracks(targetTrack: Track, tracks: Track[]): Track[] {
    const analysis = this.getMusicForTheFutureAnalysis();
    const targetAnalysis = analysis[targetTrack.title];
    
    if (!targetAnalysis) return [];

    return tracks
      .filter(track => track.id !== targetTrack.id)
      .map(track => {
        const trackAnalysis = analysis[track.title];
        if (!trackAnalysis) return { track, similarity: 0 };

        let similarity = 0;
        
        // Mood similarity
        if (trackAnalysis.mood === targetAnalysis.mood) similarity += 0.3;
        
        // Energy similarity
        if (trackAnalysis.energy === targetAnalysis.energy) similarity += 0.3;
        
        // Emotional tone similarity
        if (trackAnalysis.emotionalTone === targetAnalysis.emotionalTone) similarity += 0.2;
        
        // Tag overlap
        const commonTags = trackAnalysis.tags.filter(tag => 
          targetAnalysis.tags.includes(tag)
        );
        similarity += (commonTags.length / Math.max(trackAnalysis.tags.length, targetAnalysis.tags.length)) * 0.2;

        return { track, similarity };
      })
      .sort((a, b) => b.similarity - a.similarity)
      .map(item => item.track);
  }

  /**
   * Get track analysis
   */
  static getTrackAnalysis(track: Track): MusicAnalysis | null {
    const analysis = this.getMusicForTheFutureAnalysis();
    return analysis[track.title] || null;
  }
}
