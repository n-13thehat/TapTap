/**
 * Multi-Instrument Chart Generator for Stemstation
 * Creates instrument-specific note patterns like Guitar Hero/Rock Band
 */

import { BeatAnalysisResult } from '../audio/analysis/AdvancedBeatDetector';

export type InstrumentType = 'drums' | 'bass' | 'melody' | 'vocals';
export type Difficulty = 'Easy' | 'Medium' | 'Hard' | 'Expert';

export interface InstrumentNote {
  id: string;
  timeMs: number;
  lane: number;
  type: 'tap' | 'hold' | 'slide' | 'hammer' | 'pull' | 'chord';
  duration?: number;
  velocity: number;
  pitch?: number;
  instrument: InstrumentType;
  special_effects?: string[];
}

export interface InstrumentChart {
  instrument: InstrumentType;
  difficulty: Difficulty;
  notes: InstrumentNote[];
  metadata: {
    complexity_score: number;
    note_density: number;
    technique_variety: number;
    musical_accuracy: number;
  };
}

export interface StemAnalysis {
  instrument: InstrumentType;
  dominant_frequencies: number[];
  rhythmic_patterns: RhythmicPattern[];
  harmonic_content: number[];
  energy_profile: number[];
  note_events: NoteEvent[];
}

export interface RhythmicPattern {
  pattern: number[];
  confidence: number;
  complexity: number;
  swing_factor: number;
}

export interface NoteEvent {
  time: number;
  pitch: number;
  velocity: number;
  duration: number;
  confidence: number;
}

export class InstrumentChartGenerator {
  private readonly LANE_COUNT = 4;
  private readonly NOTE_TRAVEL_MS = 2000;
  
  // Instrument-specific lane mappings
  private readonly DRUM_LANES = {
    kick: 0,
    snare: 1,
    hihat: 2,
    crash: 3
  };
  
  private readonly GUITAR_LANES = {
    low: 0,    // Low strings (E, A)
    mid_low: 1, // D string
    mid_high: 2, // G string  
    high: 3    // High strings (B, E)
  };

  /**
   * Generate instrument-specific charts from stem analysis
   */
  async generateInstrumentCharts(
    stemAnalyses: StemAnalysis[],
    beatAnalysis: BeatAnalysisResult,
    difficulties: Difficulty[] = ['Easy', 'Medium', 'Hard', 'Expert']
  ): Promise<InstrumentChart[]> {
    const charts: InstrumentChart[] = [];
    
    for (const stemAnalysis of stemAnalyses) {
      for (const difficulty of difficulties) {
        const chart = await this.generateInstrumentChart(
          stemAnalysis,
          beatAnalysis,
          difficulty
        );
        charts.push(chart);
      }
    }
    
    return charts;
  }

  /**
   * Generate chart for specific instrument and difficulty
   */
  private async generateInstrumentChart(
    stemAnalysis: StemAnalysis,
    beatAnalysis: BeatAnalysisResult,
    difficulty: Difficulty
  ): Promise<InstrumentChart> {
    const { instrument, note_events, rhythmic_patterns } = stemAnalysis;
    const { beats, downbeats, bpm } = beatAnalysis;
    
    let notes: InstrumentNote[];
    
    switch (instrument) {
      case 'drums':
        notes = this.generateDrumChart(note_events, beats, difficulty, bpm);
        break;
      case 'bass':
        notes = this.generateBassChart(note_events, beats, difficulty, bpm);
        break;
      case 'melody':
        notes = this.generateMelodyChart(note_events, beats, difficulty, bpm);
        break;
      case 'vocals':
        notes = this.generateVocalChart(note_events, beats, difficulty, bpm);
        break;
      default:
        notes = [];
    }
    
    // Calculate metadata
    const metadata = this.calculateChartMetadata(notes, beats.length);
    
    return {
      instrument,
      difficulty,
      notes: notes.sort((a, b) => a.timeMs - b.timeMs),
      metadata
    };
  }

  /**
   * Generate drum-specific chart with kick, snare, hi-hat patterns
   */
  private generateDrumChart(
    noteEvents: NoteEvent[],
    beats: number[],
    difficulty: Difficulty,
    bpm: number
  ): InstrumentNote[] {
    const notes: InstrumentNote[] = [];
    const densityMultiplier = this.getDifficultyDensity(difficulty);
    
    // Kick drum pattern (lane 0) - follows downbeats and strong beats
    beats.forEach((beat, index) => {
      if (index % 4 === 0 || (difficulty !== 'Easy' && index % 2 === 0)) {
        if (Math.random() < densityMultiplier) {
          notes.push({
            id: `drum-kick-${index}`,
            timeMs: beat * 1000 + this.NOTE_TRAVEL_MS,
            lane: this.DRUM_LANES.kick,
            type: 'tap',
            velocity: 0.8,
            instrument: 'drums'
          });
        }
      }
    });
    
    // Snare pattern (lane 1) - backbeat emphasis
    beats.forEach((beat, index) => {
      if (index % 4 === 2 || (difficulty === 'Expert' && index % 4 === 1)) {
        if (Math.random() < densityMultiplier) {
          notes.push({
            id: `drum-snare-${index}`,
            timeMs: beat * 1000 + this.NOTE_TRAVEL_MS,
            lane: this.DRUM_LANES.snare,
            type: 'tap',
            velocity: 0.9,
            instrument: 'drums'
          });
        }
      }
    });
    
    // Hi-hat pattern (lane 2) - steady rhythm
    if (difficulty !== 'Easy') {
      beats.forEach((beat, index) => {
        if (Math.random() < densityMultiplier * 0.7) {
          notes.push({
            id: `drum-hihat-${index}`,
            timeMs: beat * 1000 + this.NOTE_TRAVEL_MS,
            lane: this.DRUM_LANES.hihat,
            type: 'tap',
            velocity: 0.6,
            instrument: 'drums'
          });
        }
      });
    }
    
    // Crash cymbals (lane 3) - accents and fills
    if (difficulty === 'Hard' || difficulty === 'Expert') {
      beats.forEach((beat, index) => {
        if (index % 16 === 0 && Math.random() < 0.8) { // Measure starts
          notes.push({
            id: `drum-crash-${index}`,
            timeMs: beat * 1000 + this.NOTE_TRAVEL_MS,
            lane: this.DRUM_LANES.crash,
            type: 'tap',
            velocity: 1.0,
            instrument: 'drums'
          });
        }
      });
    }
    
    return notes;
  }

  /**
   * Generate bass-specific chart with root notes and walking patterns
   */
  private generateBassChart(
    noteEvents: NoteEvent[],
    beats: number[],
    difficulty: Difficulty,
    bpm: number
  ): InstrumentNote[] {
    const notes: InstrumentNote[] = [];
    const densityMultiplier = this.getDifficultyDensity(difficulty);

    // Bass follows chord changes and provides rhythmic foundation
    beats.forEach((beat, index) => {
      const shouldPlace = Math.random() < densityMultiplier;
      if (!shouldPlace) return;

      // Determine lane based on pitch range simulation
      let lane = 0; // Default to lowest lane

      // Add variety for higher difficulties
      if (difficulty === 'Medium' || difficulty === 'Hard') {
        if (index % 8 === 4) lane = 1; // Fifth of chord
      }
      if (difficulty === 'Expert') {
        if (index % 4 === 2) lane = 2; // Walking bass
        if (index % 16 === 12) lane = 3; // Octave jumps
      }

      const noteType = (difficulty === 'Expert' && Math.random() < 0.2) ? 'hold' : 'tap';
      const duration = noteType === 'hold' ? (60000 / bpm) * 2 : undefined;

      notes.push({
        id: `bass-${index}`,
        timeMs: beat * 1000 + this.NOTE_TRAVEL_MS,
        lane,
        type: noteType,
        duration,
        velocity: 0.8,
        instrument: 'bass'
      });
    });

    return notes;
  }

  /**
   * Generate melody chart with chord progressions and lead lines
   */
  private generateMelodyChart(
    noteEvents: NoteEvent[],
    beats: number[],
    difficulty: Difficulty,
    bpm: number
  ): InstrumentNote[] {
    const notes: InstrumentNote[] = [];
    const densityMultiplier = this.getDifficultyDensity(difficulty);

    beats.forEach((beat, index) => {
      const shouldPlace = Math.random() < densityMultiplier;
      if (!shouldPlace) return;

      // Melody uses all lanes with musical patterns
      const lane = this.getMelodyLane(index, difficulty);

      // Add hammer-ons and pull-offs for guitar-like gameplay
      let noteType: InstrumentNote['type'] = 'tap';
      if (difficulty === 'Hard' || difficulty === 'Expert') {
        if (Math.random() < 0.15) noteType = 'hammer';
        else if (Math.random() < 0.1) noteType = 'pull';
        else if (Math.random() < 0.05) noteType = 'slide';
      }

      // Chord notes for complex sections
      if (difficulty === 'Expert' && index % 8 === 0 && Math.random() < 0.3) {
        noteType = 'chord';
      }

      notes.push({
        id: `melody-${index}`,
        timeMs: beat * 1000 + this.NOTE_TRAVEL_MS,
        lane,
        type: noteType,
        velocity: 0.7,
        instrument: 'melody',
        special_effects: noteType === 'slide' ? ['slide_up'] : undefined
      });
    });

    return notes;
  }

  /**
   * Generate vocal chart with pitch-based lanes
   */
  private generateVocalChart(
    noteEvents: NoteEvent[],
    beats: number[],
    difficulty: Difficulty,
    bpm: number
  ): InstrumentNote[] {
    const notes: InstrumentNote[] = [];
    const densityMultiplier = this.getDifficultyDensity(difficulty);

    // Vocals have longer sustained notes
    let currentPhrase = 0;
    const phraseLength = Math.floor(beats.length / 8); // 8 phrases per song

    for (let phrase = 0; phrase < 8; phrase++) {
      const phraseStart = phrase * phraseLength;
      const phraseEnd = Math.min((phrase + 1) * phraseLength, beats.length);

      if (Math.random() < densityMultiplier) {
        const startBeat = beats[phraseStart];
        const endBeat = beats[Math.min(phraseEnd - 1, beats.length - 1)];
        const duration = (endBeat - startBeat) * 1000;

        // Vocal lane based on pitch range
        const lane = Math.floor(Math.random() * 4);

        notes.push({
          id: `vocal-phrase-${phrase}`,
          timeMs: startBeat * 1000 + this.NOTE_TRAVEL_MS,
          lane,
          type: 'hold',
          duration,
          velocity: 0.6,
          instrument: 'vocals'
        });
      }
    }

    return notes;
  }

  /**
   * Get difficulty-based note density multiplier
   */
  private getDifficultyDensity(difficulty: Difficulty): number {
    const densityMap = {
      'Easy': 0.3,
      'Medium': 0.5,
      'Hard': 0.75,
      'Expert': 0.9
    };
    return densityMap[difficulty];
  }

  /**
   * Get melody lane based on musical patterns
   */
  private getMelodyLane(beatIndex: number, difficulty: Difficulty): number {
    // Create musical patterns that feel natural
    const patterns = {
      'Easy': [0, 1, 0, 1], // Simple alternating
      'Medium': [0, 1, 2, 1], // Scale-like
      'Hard': [0, 2, 1, 3, 2, 1], // More complex
      'Expert': [0, 1, 3, 2, 0, 3, 1, 2] // Full range
    };

    const pattern = patterns[difficulty];
    return pattern[beatIndex % pattern.length];
  }

  /**
   * Calculate chart metadata for quality assessment
   */
  private calculateChartMetadata(notes: InstrumentNote[], totalBeats: number): {
    complexity_score: number;
    note_density: number;
    technique_variety: number;
    musical_accuracy: number;
  } {
    const noteCount = notes.length;
    const note_density = noteCount / totalBeats;

    // Count different note types
    const noteTypes = new Set(notes.map(n => n.type));
    const technique_variety = noteTypes.size / 6; // Max 6 types

    // Calculate complexity based on lane changes and timing
    let complexity_score = 0;
    for (let i = 1; i < notes.length; i++) {
      const timeDiff = notes[i].timeMs - notes[i-1].timeMs;
      const laneDiff = Math.abs(notes[i].lane - notes[i-1].lane);

      if (timeDiff < 200) complexity_score += 0.1; // Fast notes
      if (laneDiff > 1) complexity_score += 0.05; // Lane jumps
    }
    complexity_score = Math.min(1.0, complexity_score);

    // Musical accuracy (simplified - would use actual audio analysis)
    const musical_accuracy = 0.85; // Placeholder

    return {
      complexity_score,
      note_density,
      technique_variety,
      musical_accuracy
    };
  }
}
