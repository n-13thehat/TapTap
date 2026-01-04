/**
 * Dynamic Difficulty Scaling System for Stemstation
 * Analyzes song complexity and generates appropriate difficulty curves
 */

import { BeatAnalysisResult } from '../audio/analysis/AdvancedBeatDetector';
import { AdvancedNote } from './AdvancedChartFeatures';

export interface SongComplexityAnalysis {
  tempo_complexity: number;      // 0-1, based on BPM and tempo changes
  rhythmic_complexity: number;   // 0-1, based on beat patterns
  harmonic_complexity: number;   // 0-1, based on chord changes
  structural_complexity: number; // 0-1, based on song sections
  overall_complexity: number;    // 0-1, weighted average
  
  // Detailed metrics
  bpm_range: [number, number];
  tempo_changes: number;
  time_signature_changes: number;
  key_changes: number;
  section_count: number;
  dynamic_range: number;
}

export interface DifficultyProfile {
  name: string;
  note_density_multiplier: number;    // Base note frequency
  complexity_threshold: number;       // Min complexity for advanced features
  advanced_feature_chance: number;    // Probability of special notes
  timing_window_modifier: number;     // Hit timing tolerance
  lane_usage_pattern: number[];       // Which lanes to emphasize [0-3]
  max_simultaneous_notes: number;     // Chord complexity
  feature_weights: FeatureWeights;
}

export interface FeatureWeights {
  hold_notes: number;
  slides: number;
  hammer_pulls: number;
  chords: number;
  special_effects: number;
  ghost_notes: number;
  accents: number;
}

export interface AdaptiveDifficultySettings {
  base_difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  adaptation_strength: number;        // 0-1, how much to adapt
  player_skill_estimate: number;      // 0-1, estimated player ability
  learning_curve_steepness: number;   // How quickly difficulty ramps
  section_based_scaling: boolean;     // Scale difficulty per song section
  real_time_adaptation: boolean;      // Adapt based on player performance
}

export class DynamicDifficultyScaler {
  private readonly DIFFICULTY_PROFILES: Record<string, DifficultyProfile> = {
    'Easy': {
      name: 'Easy',
      note_density_multiplier: 0.3,
      complexity_threshold: 0.1,
      advanced_feature_chance: 0.05,
      timing_window_modifier: 1.5,
      lane_usage_pattern: [0.4, 0.4, 0.15, 0.05],
      max_simultaneous_notes: 1,
      feature_weights: {
        hold_notes: 0.3,
        slides: 0.1,
        hammer_pulls: 0.05,
        chords: 0.0,
        special_effects: 0.1,
        ghost_notes: 0.0,
        accents: 0.2
      }
    },
    'Medium': {
      name: 'Medium',
      note_density_multiplier: 0.5,
      complexity_threshold: 0.3,
      advanced_feature_chance: 0.15,
      timing_window_modifier: 1.2,
      lane_usage_pattern: [0.3, 0.3, 0.25, 0.15],
      max_simultaneous_notes: 2,
      feature_weights: {
        hold_notes: 0.5,
        slides: 0.2,
        hammer_pulls: 0.15,
        chords: 0.1,
        special_effects: 0.2,
        ghost_notes: 0.1,
        accents: 0.3
      }
    },
    'Hard': {
      name: 'Hard',
      note_density_multiplier: 0.75,
      complexity_threshold: 0.5,
      advanced_feature_chance: 0.3,
      timing_window_modifier: 1.0,
      lane_usage_pattern: [0.25, 0.25, 0.25, 0.25],
      max_simultaneous_notes: 3,
      feature_weights: {
        hold_notes: 0.7,
        slides: 0.4,
        hammer_pulls: 0.3,
        chords: 0.3,
        special_effects: 0.4,
        ghost_notes: 0.2,
        accents: 0.5
      }
    },
    'Expert': {
      name: 'Expert',
      note_density_multiplier: 0.9,
      complexity_threshold: 0.7,
      advanced_feature_chance: 0.5,
      timing_window_modifier: 0.8,
      lane_usage_pattern: [0.25, 0.25, 0.25, 0.25],
      max_simultaneous_notes: 4,
      feature_weights: {
        hold_notes: 0.8,
        slides: 0.6,
        hammer_pulls: 0.5,
        chords: 0.6,
        special_effects: 0.6,
        ghost_notes: 0.4,
        accents: 0.7
      }
    }
  };

  /**
   * Analyze song complexity to inform difficulty scaling
   */
  analyzeSongComplexity(
    beatAnalysis: BeatAnalysisResult,
    audioFeatures?: any,
    songStructure?: any[]
  ): SongComplexityAnalysis {
    // Tempo complexity analysis
    const tempo_complexity = this.calculateTempoComplexity(beatAnalysis);
    
    // Rhythmic complexity from beat patterns
    const rhythmic_complexity = beatAnalysis.rhythmic_complexity;
    
    // Harmonic complexity (simplified - would use actual harmonic analysis)
    const harmonic_complexity = audioFeatures?.harmonic_complexity || 0.5;
    
    // Structural complexity from song sections
    const structural_complexity = this.calculateStructuralComplexity(songStructure);
    
    // Weighted overall complexity
    const overall_complexity = (
      tempo_complexity * 0.25 +
      rhythmic_complexity * 0.35 +
      harmonic_complexity * 0.25 +
      structural_complexity * 0.15
    );
    
    return {
      tempo_complexity,
      rhythmic_complexity,
      harmonic_complexity,
      structural_complexity,
      overall_complexity,
      bpm_range: [beatAnalysis.bpm * 0.9, beatAnalysis.bpm * 1.1],
      tempo_changes: beatAnalysis.tempo_changes.length,
      time_signature_changes: 0, // Would be detected from analysis
      key_changes: 0, // Would be detected from harmonic analysis
      section_count: songStructure?.length || 4,
      dynamic_range: 0.7 // Would be calculated from audio analysis
    };
  }

  /**
   * Generate adaptive difficulty chart based on song complexity
   */
  generateAdaptiveDifficulty(
    baseNotes: AdvancedNote[],
    complexity: SongComplexityAnalysis,
    settings: AdaptiveDifficultySettings
  ): AdvancedNote[] {
    const profile = this.DIFFICULTY_PROFILES[settings.base_difficulty];
    const adaptedProfile = this.adaptProfileToComplexity(profile, complexity, settings);

    let adaptedNotes = this.scaleNoteDensity(baseNotes, adaptedProfile);
    adaptedNotes = this.adjustLaneUsage(adaptedNotes, adaptedProfile);
    adaptedNotes = this.addAdaptiveFeatures(adaptedNotes, adaptedProfile, complexity);

    if (settings.section_based_scaling) {
      adaptedNotes = this.applySectionBasedScaling(adaptedNotes, complexity);
    }

    return adaptedNotes.sort((a, b) => a.timeMs - b.timeMs);
  }

  /**
   * Adapt difficulty profile based on song complexity
   */
  private adaptProfileToComplexity(
    baseProfile: DifficultyProfile,
    complexity: SongComplexityAnalysis,
    settings: AdaptiveDifficultySettings
  ): DifficultyProfile {
    const adaptationFactor = settings.adaptation_strength;
    const complexityBonus = complexity.overall_complexity * adaptationFactor;

    return {
      ...baseProfile,
      note_density_multiplier: Math.min(1.0,
        baseProfile.note_density_multiplier + complexityBonus * 0.3
      ),
      advanced_feature_chance: Math.min(0.8,
        baseProfile.advanced_feature_chance + complexityBonus * 0.4
      ),
      timing_window_modifier: Math.max(0.5,
        baseProfile.timing_window_modifier - complexityBonus * 0.2
      ),
      feature_weights: {
        ...baseProfile.feature_weights,
        hold_notes: Math.min(1.0, baseProfile.feature_weights.hold_notes + complexityBonus * 0.2),
        slides: Math.min(1.0, baseProfile.feature_weights.slides + complexityBonus * 0.3),
        hammer_pulls: Math.min(1.0, baseProfile.feature_weights.hammer_pulls + complexityBonus * 0.4),
        chords: Math.min(1.0, baseProfile.feature_weights.chords + complexityBonus * 0.5)
      }
    };
  }

  /**
   * Scale note density based on difficulty profile
   */
  private scaleNoteDensity(notes: AdvancedNote[], profile: DifficultyProfile): AdvancedNote[] {
    const targetDensity = profile.note_density_multiplier;
    const currentDensity = 1.0; // Assume base notes are at 100% density

    if (targetDensity >= currentDensity) {
      return notes; // Don't add more notes, just keep existing
    }

    // Remove notes to match target density
    const keepRatio = targetDensity / currentDensity;
    const filteredNotes: AdvancedNote[] = [];

    for (let i = 0; i < notes.length; i++) {
      if (Math.random() < keepRatio) {
        filteredNotes.push(notes[i]);
      }
    }

    return filteredNotes;
  }

  /**
   * Adjust lane usage patterns
   */
  private adjustLaneUsage(notes: AdvancedNote[], profile: DifficultyProfile): AdvancedNote[] {
    const { lane_usage_pattern } = profile;

    return notes.map(note => {
      // Reassign lanes based on usage pattern
      const random = Math.random();
      let cumulativeProbability = 0;

      for (let lane = 0; lane < lane_usage_pattern.length; lane++) {
        cumulativeProbability += lane_usage_pattern[lane];
        if (random < cumulativeProbability) {
          return { ...note, lane };
        }
      }

      return note; // Fallback
    });
  }

  /**
   * Add adaptive features based on complexity and profile
   */
  private addAdaptiveFeatures(
    notes: AdvancedNote[],
    profile: DifficultyProfile,
    complexity: SongComplexityAnalysis
  ): AdvancedNote[] {
    const { feature_weights, advanced_feature_chance } = profile;

    return notes.map(note => {
      if (Math.random() > advanced_feature_chance) {
        return note; // No advanced features
      }

      const adaptedNote = { ...note };

      // Add hold notes
      if (Math.random() < feature_weights.hold_notes && !adaptedNote.duration) {
        adaptedNote.type = 'hold';
        adaptedNote.duration = 500 + Math.random() * 1000;
      }

      // Add slides for high complexity songs
      if (complexity.rhythmic_complexity > 0.6 && Math.random() < feature_weights.slides) {
        adaptedNote.type = 'slide';
        adaptedNote.slide_direction = Math.random() < 0.5 ? 'up' : 'down';
        adaptedNote.slide_distance = 1 + Math.floor(Math.random() * 2);
      }

      // Add hammer-ons/pull-offs
      if (Math.random() < feature_weights.hammer_pulls) {
        adaptedNote.type = Math.random() < 0.5 ? 'hammer' : 'pull';
      }

      // Add accents for rhythmically complex sections
      if (complexity.rhythmic_complexity > 0.7 && Math.random() < feature_weights.accents) {
        adaptedNote.type = 'accent';
        adaptedNote.velocity = Math.min(1.0, adaptedNote.velocity * 1.3);
      }

      return adaptedNote;
    });
  }

  /**
   * Apply section-based difficulty scaling
   */
  private applySectionBasedScaling(
    notes: AdvancedNote[],
    complexity: SongComplexityAnalysis
  ): AdvancedNote[] {
    // Simplified section detection - would use actual song structure analysis
    const songDuration = Math.max(...notes.map(n => n.timeMs));
    const sectionDuration = songDuration / 4; // 4 main sections

    return notes.map(note => {
      const sectionIndex = Math.floor(note.timeMs / sectionDuration);
      const sectionMultiplier = this.getSectionDifficultyMultiplier(sectionIndex);

      return {
        ...note,
        velocity: Math.min(1.0, note.velocity * sectionMultiplier)
      };
    });
  }

  /**
   * Calculate tempo complexity from beat analysis
   */
  private calculateTempoComplexity(beatAnalysis: BeatAnalysisResult): number {
    const { bpm, tempo_changes, swing_factor } = beatAnalysis;

    let complexity = 0;

    // BPM complexity (extreme tempos are harder)
    if (bpm < 80 || bpm > 180) complexity += 0.3;
    if (bpm < 60 || bpm > 200) complexity += 0.5;

    // Tempo changes add complexity
    complexity += Math.min(0.4, tempo_changes.length * 0.1);

    // Swing adds rhythmic complexity
    complexity += swing_factor * 0.3;

    return Math.min(1.0, complexity);
  }

  /**
   * Calculate structural complexity from song sections
   */
  private calculateStructuralComplexity(songStructure?: any[]): number {
    if (!songStructure) return 0.5;

    let complexity = 0;

    // More sections = more complexity
    complexity += Math.min(0.4, songStructure.length * 0.05);

    // Different section types add variety
    const sectionTypes = new Set(songStructure.map(s => s.type));
    complexity += Math.min(0.3, sectionTypes.size * 0.1);

    // Rapid section changes add complexity
    const avgSectionLength = songStructure.reduce((sum, s) =>
      sum + (s.end_time - s.start_time), 0) / songStructure.length;

    if (avgSectionLength < 30000) complexity += 0.3; // Sections < 30s

    return Math.min(1.0, complexity);
  }

  /**
   * Get difficulty multiplier for different song sections
   */
  private getSectionDifficultyMultiplier(sectionIndex: number): number {
    // Typical song structure difficulty curve
    const multipliers = [0.8, 1.0, 1.2, 1.0]; // Intro, Verse, Chorus, Outro
    return multipliers[sectionIndex] || 1.0;
  }

  /**
   * Real-time difficulty adaptation based on player performance
   */
  adaptToPlayerPerformance(
    notes: AdvancedNote[],
    playerStats: {
      accuracy: number;
      combo: number;
      missed_notes: number;
      perfect_hits: number;
    }
  ): AdvancedNote[] {
    const performanceScore = this.calculatePerformanceScore(playerStats);

    // Adjust upcoming notes based on performance
    const adjustmentFactor = (performanceScore - 0.5) * 0.3; // -0.15 to +0.15

    return notes.map(note => {
      // Adjust timing windows
      const timingAdjustment = 1 + adjustmentFactor;

      // Adjust note complexity
      if (adjustmentFactor < -0.1 && note.type !== 'tap') {
        // Simplify for struggling players
        return { ...note, type: 'tap' };
      } else if (adjustmentFactor > 0.1 && note.type === 'tap' && Math.random() < 0.2) {
        // Add complexity for skilled players
        return { ...note, type: 'hold', duration: 500 };
      }

      return note;
    });
  }

  /**
   * Calculate overall player performance score
   */
  private calculatePerformanceScore(playerStats: {
    accuracy: number;
    combo: number;
    missed_notes: number;
    perfect_hits: number;
  }): number {
    const { accuracy, combo, missed_notes, perfect_hits } = playerStats;

    // Weighted performance calculation
    const accuracyScore = accuracy * 0.4;
    const comboScore = Math.min(1.0, combo / 50) * 0.3;
    const missScore = Math.max(0, 1 - missed_notes / 20) * 0.2;
    const perfectScore = Math.min(1.0, perfect_hits / 30) * 0.1;

    return accuracyScore + comboScore + missScore + perfectScore;
  }
}
