/**
 * Advanced Chart Features for Stemstation
 * Implements Guitar Hero/Rock Band style mechanics
 */

export type AdvancedNoteType = 
  | 'tap' | 'hold' | 'slide' | 'hammer' | 'pull' | 'chord' 
  | 'tremolo' | 'bend' | 'vibrato' | 'ghost' | 'accent';

export interface AdvancedNote {
  id: string;
  timeMs: number;
  lane: number;
  type: AdvancedNoteType;
  duration?: number;
  velocity: number;
  
  // Advanced properties
  slide_direction?: 'up' | 'down' | 'horizontal';
  slide_distance?: number;
  chord_notes?: number[]; // Additional lanes for chord
  hammer_pull_chain?: string[]; // Connected note IDs
  bend_amount?: number; // Semitones
  vibrato_rate?: number; // Hz
  special_effects?: SpecialEffect[];
  
  // Visual properties
  color_override?: string;
  glow_intensity?: number;
  particle_effect?: string;
  trail_effect?: boolean;
}

export interface SpecialEffect {
  type: 'star_power' | 'overdrive' | 'whammy' | 'tilt' | 'solo_boost';
  intensity: number;
  duration?: number;
  trigger_condition?: string;
}

export interface ChartSection {
  name: string;
  start_time: number;
  end_time: number;
  type: 'intro' | 'verse' | 'chorus' | 'bridge' | 'solo' | 'outro';
  difficulty_modifier: number;
  special_mechanics?: string[];
}

export interface ComboChain {
  notes: string[]; // Note IDs in sequence
  bonus_multiplier: number;
  chain_type: 'hammer_pull' | 'slide_chain' | 'chord_progression';
  timing_window: number; // ms tolerance
}

export class AdvancedChartFeatures {
  private readonly HAMMER_PULL_WINDOW = 150; // ms
  private readonly SLIDE_DURATION_MIN = 200; // ms
  private readonly CHORD_TOLERANCE = 50; // ms
  
  /**
   * Process basic notes into advanced chart features
   */
  processAdvancedFeatures(
    basicNotes: any[],
    instrument: string,
    difficulty: string,
    songStructure?: ChartSection[]
  ): AdvancedNote[] {
    let advancedNotes = this.convertToAdvancedNotes(basicNotes);
    
    // Apply instrument-specific processing
    switch (instrument) {
      case 'guitar':
      case 'melody':
        advancedNotes = this.addGuitarMechanics(advancedNotes, difficulty);
        break;
      case 'drums':
        advancedNotes = this.addDrumMechanics(advancedNotes, difficulty);
        break;
      case 'bass':
        advancedNotes = this.addBassMechanics(advancedNotes, difficulty);
        break;
      case 'vocals':
        advancedNotes = this.addVocalMechanics(advancedNotes, difficulty);
        break;
    }
    
    // Add section-based modifiers
    if (songStructure) {
      advancedNotes = this.applySectionModifiers(advancedNotes, songStructure);
    }
    
    // Create combo chains
    const comboChains = this.createComboChains(advancedNotes);
    
    // Add special effects
    advancedNotes = this.addSpecialEffects(advancedNotes, comboChains);
    
    return advancedNotes.sort((a, b) => a.timeMs - b.timeMs);
  }

  /**
   * Convert basic notes to advanced note format
   */
  private convertToAdvancedNotes(basicNotes: any[]): AdvancedNote[] {
    return basicNotes.map(note => ({
      id: note.id,
      timeMs: note.timeMs,
      lane: note.lane,
      type: note.type as AdvancedNoteType,
      duration: note.duration,
      velocity: note.velocity || 0.8,
      special_effects: []
    }));
  }

  /**
   * Add guitar-specific mechanics (hammer-ons, pull-offs, slides)
   */
  private addGuitarMechanics(notes: AdvancedNote[], difficulty: string): AdvancedNote[] {
    const processed = [...notes];
    
    // Add hammer-ons and pull-offs
    for (let i = 0; i < processed.length - 1; i++) {
      const current = processed[i];
      const next = processed[i + 1];
      
      const timeDiff = next.timeMs - current.timeMs;
      const laneDiff = Math.abs(next.lane - current.lane);
      
      // Hammer-on: ascending lane within timing window
      if (timeDiff < this.HAMMER_PULL_WINDOW && 
          next.lane > current.lane && 
          laneDiff === 1 &&
          this.shouldAddHammerPull(difficulty)) {
        
        next.type = 'hammer';
        next.hammer_pull_chain = [current.id];
        current.special_effects?.push({
          type: 'overdrive',
          intensity: 0.3
        });
      }
      
      // Pull-off: descending lane within timing window
      if (timeDiff < this.HAMMER_PULL_WINDOW && 
          next.lane < current.lane && 
          laneDiff === 1 &&
          this.shouldAddHammerPull(difficulty)) {
        
        next.type = 'pull';
        next.hammer_pull_chain = [current.id];
        current.special_effects?.push({
          type: 'overdrive',
          intensity: 0.3
        });
      }
    }
    
    // Add slides for longer note sequences
    this.addSlides(processed, difficulty);
    
    // Add chords for expert difficulty
    if (difficulty === 'Expert') {
      this.addChords(processed);
    }
    
    return processed;
  }

  /**
   * Add drum-specific mechanics (ghost notes, accents, rolls)
   */
  private addDrumMechanics(notes: AdvancedNote[], difficulty: string): AdvancedNote[] {
    const processed = [...notes];
    
    for (const note of processed) {
      // Add ghost notes (low velocity hits)
      if (note.velocity < 0.4 && Math.random() < 0.3) {
        note.type = 'ghost';
        note.glow_intensity = 0.3;
      }
      
      // Add accents (high velocity hits)
      if (note.velocity > 0.8 && Math.random() < 0.4) {
        note.type = 'accent';
        note.glow_intensity = 1.5;
        note.particle_effect = 'spark';
      }
      
      // Add drum rolls for expert
      if (difficulty === 'Expert' && note.lane === 1) { // Snare
        if (Math.random() < 0.1) {
          note.type = 'tremolo';
          note.duration = 500;
        }
      }
    }
    
    return processed;
  }

  /**
   * Add bass-specific mechanics (slap, pop, slides)
   */
  private addBassMechanics(notes: AdvancedNote[], difficulty: string): AdvancedNote[] {
    const processed = [...notes];
    
    // Add bass slides between distant notes
    for (let i = 0; i < processed.length - 1; i++) {
      const current = processed[i];
      const next = processed[i + 1];
      
      const timeDiff = next.timeMs - current.timeMs;
      const laneDiff = Math.abs(next.lane - current.lane);
      
      if (timeDiff > this.SLIDE_DURATION_MIN && 
          timeDiff < 1000 && 
          laneDiff > 1 &&
          Math.random() < 0.2) {
        
        current.type = 'slide';
        current.slide_direction = next.lane > current.lane ? 'up' : 'down';
        current.slide_distance = laneDiff;
        current.duration = timeDiff;
      }
    }
    
    return processed;
  }

  /**
   * Add vocal-specific mechanics (pitch bends, vibrato)
   */
  private addVocalMechanics(notes: AdvancedNote[], difficulty: string): AdvancedNote[] {
    const processed = [...notes];
    
    for (const note of processed) {
      if (note.type === 'hold' && note.duration && note.duration > 1000) {
        // Add vibrato to long held notes
        if (Math.random() < 0.4) {
          note.type = 'vibrato';
          note.vibrato_rate = 4 + Math.random() * 3; // 4-7 Hz
        }
        
        // Add pitch bends
        if (Math.random() < 0.3) {
          note.type = 'bend';
          note.bend_amount = (Math.random() - 0.5) * 2; // ±1 semitone
        }
      }
    }
    
    return processed;
  }

  /**
   * Add slide mechanics between notes
   */
  private addSlides(notes: AdvancedNote[], difficulty: string): void {
    const slideChance = difficulty === 'Expert' ? 0.15 : difficulty === 'Hard' ? 0.1 : 0.05;

    for (let i = 0; i < notes.length - 1; i++) {
      const current = notes[i];
      const next = notes[i + 1];

      const timeDiff = next.timeMs - current.timeMs;
      const laneDiff = Math.abs(next.lane - current.lane);

      if (timeDiff > this.SLIDE_DURATION_MIN &&
          timeDiff < 800 &&
          laneDiff >= 2 &&
          Math.random() < slideChance) {

        current.type = 'slide';
        current.slide_direction = next.lane > current.lane ? 'up' : 'down';
        current.slide_distance = laneDiff;
        current.duration = timeDiff;
        current.trail_effect = true;
      }
    }
  }

  /**
   * Add chord notes for complex sections
   */
  private addChords(notes: AdvancedNote[]): void {
    // Group notes that occur within chord tolerance
    const chordGroups: AdvancedNote[][] = [];
    let currentGroup: AdvancedNote[] = [];

    for (let i = 0; i < notes.length; i++) {
      const note = notes[i];

      if (currentGroup.length === 0) {
        currentGroup.push(note);
      } else {
        const lastNote = currentGroup[currentGroup.length - 1];
        const timeDiff = note.timeMs - lastNote.timeMs;

        if (timeDiff <= this.CHORD_TOLERANCE) {
          currentGroup.push(note);
        } else {
          if (currentGroup.length > 1) {
            chordGroups.push([...currentGroup]);
          }
          currentGroup = [note];
        }
      }
    }

    // Convert groups to chords
    for (const group of chordGroups) {
      if (group.length >= 2) {
        const rootNote = group[0];
        rootNote.type = 'chord';
        rootNote.chord_notes = group.slice(1).map(n => n.lane);
        rootNote.glow_intensity = 1.2;

        // Remove other notes in the chord from the main array
        for (let i = 1; i < group.length; i++) {
          const index = notes.indexOf(group[i]);
          if (index > -1) {
            notes.splice(index, 1);
          }
        }
      }
    }
  }

  /**
   * Apply section-based difficulty modifiers
   */
  private applySectionModifiers(notes: AdvancedNote[], sections: ChartSection[]): AdvancedNote[] {
    for (const note of notes) {
      const section = sections.find(s =>
        note.timeMs >= s.start_time && note.timeMs <= s.end_time
      );

      if (section) {
        // Apply section-specific modifiers
        switch (section.type) {
          case 'solo':
            note.velocity *= 1.2;
            note.glow_intensity = (note.glow_intensity || 1) * 1.5;
            if (Math.random() < 0.3) {
              note.special_effects?.push({
                type: 'solo_boost',
                intensity: 1.0
              });
            }
            break;

          case 'chorus':
            if (Math.random() < 0.2) {
              note.special_effects?.push({
                type: 'star_power',
                intensity: 0.8
              });
            }
            break;

          case 'bridge':
            note.velocity *= 0.8; // Quieter section
            break;
        }
      }
    }

    return notes;
  }

  /**
   * Create combo chains for connected notes
   */
  private createComboChains(notes: AdvancedNote[]): ComboChain[] {
    const chains: ComboChain[] = [];

    // Find hammer-pull chains
    const hammerPullChains = this.findHammerPullChains(notes);
    chains.push(...hammerPullChains);

    // Find slide chains
    const slideChains = this.findSlideChains(notes);
    chains.push(...slideChains);

    return chains;
  }

  /**
   * Find hammer-on/pull-off chains
   */
  private findHammerPullChains(notes: AdvancedNote[]): ComboChain[] {
    const chains: ComboChain[] = [];
    let currentChain: string[] = [];

    for (const note of notes) {
      if (note.type === 'hammer' || note.type === 'pull') {
        if (note.hammer_pull_chain) {
          currentChain.push(...note.hammer_pull_chain);
        }
        currentChain.push(note.id);
      } else {
        if (currentChain.length > 1) {
          chains.push({
            notes: [...currentChain],
            bonus_multiplier: 1.5,
            chain_type: 'hammer_pull',
            timing_window: this.HAMMER_PULL_WINDOW
          });
        }
        currentChain = [];
      }
    }

    return chains;
  }

  /**
   * Find slide chains
   */
  private findSlideChains(notes: AdvancedNote[]): ComboChain[] {
    const chains: ComboChain[] = [];

    for (const note of notes) {
      if (note.type === 'slide' && note.duration) {
        chains.push({
          notes: [note.id],
          bonus_multiplier: 1.3,
          chain_type: 'slide_chain',
          timing_window: note.duration
        });
      }
    }

    return chains;
  }

  /**
   * Add special effects based on note patterns and chains
   */
  private addSpecialEffects(notes: AdvancedNote[], chains: ComboChain[]): AdvancedNote[] {
    // Add star power sections (every 8 measures approximately)
    const starPowerInterval = 8000; // 8 seconds
    let lastStarPower = 0;

    for (const note of notes) {
      if (note.timeMs - lastStarPower > starPowerInterval) {
        note.special_effects?.push({
          type: 'star_power',
          intensity: 1.0,
          duration: 2000
        });
        lastStarPower = note.timeMs;
      }

      // Add overdrive for high-velocity notes
      if (note.velocity > 0.9) {
        note.special_effects?.push({
          type: 'overdrive',
          intensity: note.velocity
        });
      }
    }

    return notes;
  }

  /**
   * Determine if hammer-on/pull-off should be added based on difficulty
   */
  private shouldAddHammerPull(difficulty: string): boolean {
    const chances = {
      'Easy': 0.05,
      'Medium': 0.15,
      'Hard': 0.25,
      'Expert': 0.4
    };
    return Math.random() < (chances[difficulty as keyof typeof chances] || 0.1);
  }

  /**
   * Calculate note complexity score for balancing
   */
  calculateComplexityScore(notes: AdvancedNote[]): number {
    let score = 0;

    for (const note of notes) {
      // Base score
      score += 1;

      // Advanced note type bonuses
      switch (note.type) {
        case 'hold': score += 0.5; break;
        case 'slide': score += 1.0; break;
        case 'hammer': score += 0.8; break;
        case 'pull': score += 0.8; break;
        case 'chord': score += 1.5; break;
        case 'tremolo': score += 1.2; break;
        case 'bend': score += 0.7; break;
        case 'vibrato': score += 0.6; break;
      }

      // Special effects bonus
      if (note.special_effects && note.special_effects.length > 0) {
        score += note.special_effects.length * 0.3;
      }
    }

    return score / notes.length; // Average complexity per note
  }
}
