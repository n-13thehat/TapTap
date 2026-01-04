/**
 * Advanced Music Theory Types and Interfaces
 * Music theory analysis, chord progression generation, harmonic analysis, and AI composition
 */

export interface MusicTheoryEngine {
  id: string;
  name: string;
  version: string;
  
  // Engine capabilities
  chord_analysis: boolean;
  scale_detection: boolean;
  progression_generation: boolean;
  harmonic_analysis: boolean;
  voice_leading: boolean;
  counterpoint: boolean;
  ai_composition: boolean;
  
  // Supported music systems
  temperament: Temperament;
  tuning_systems: TuningSystem[];
  notation_systems: NotationSystem[];
  
  // Analysis settings
  analysis_depth: 'basic' | 'intermediate' | 'advanced' | 'expert';
  context_awareness: boolean;
  style_recognition: boolean;
  
  // Performance
  analysis_speed: number; // analyses per second
  generation_speed: number; // progressions per second
  accuracy: number; // 0-1
  
  // Status
  is_active: boolean;
  processed_analyses: number;
  generated_progressions: number;
  
  // Metadata
  created_at: number;
  updated_at: number;
}

export interface Temperament {
  name: string;
  type: 'equal' | 'just' | 'pythagorean' | 'meantone' | 'well' | 'custom';
  divisions_per_octave: number;
  cent_deviations: number[]; // cents from equal temperament
  historical_period?: string;
  description?: string;
}

export interface TuningSystem {
  name: string;
  reference_frequency: number; // A4 frequency in Hz
  temperament: string;
  cultural_origin?: string;
  common_usage: string[];
}

export interface NotationSystem {
  name: string;
  type: 'western' | 'roman_numeral' | 'nashville' | 'solfege' | 'tablature' | 'custom';
  symbols: NotationSymbol[];
  rules: NotationRule[];
}

export interface NotationSymbol {
  symbol: string;
  meaning: string;
  context: string;
  alternatives: string[];
}

export interface NotationRule {
  rule: string;
  description: string;
  examples: string[];
  exceptions: string[];
}

export interface MusicalKey {
  tonic: Note;
  mode: Mode;
  signature: KeySignature;
  
  // Scale information
  scale: Scale;
  degrees: ScaleDegree[];
  
  // Harmonic context
  primary_chords: Chord[];
  secondary_chords: Chord[];
  borrowed_chords: Chord[];
  
  // Functional harmony
  tonal_functions: TonicFunction[];
  cadences: Cadence[];
  
  // Analysis
  confidence: number; // 0-1
  stability: number; // 0-1
  brightness: number; // 0-1 (major vs minor tendency)
  
  // Metadata
  detected_at: number;
  analysis_method: string;
  context_clues: string[];
}

export interface Note {
  pitch_class: PitchClass;
  octave: number;
  frequency: number; // Hz
  midi_number: number;
  
  // Enharmonic information
  enharmonic_equivalents: Note[];
  preferred_spelling: string;
  
  // Context
  accidental?: Accidental;
  duration?: Duration;
  velocity?: number; // 0-127 for MIDI
  
  // Analysis
  harmonic_function?: HarmonicFunction;
  voice_leading_tendency?: VoiceLeadingTendency;
}

export type PitchClass = 'C' | 'C#' | 'Db' | 'D' | 'D#' | 'Eb' | 'E' | 'F' | 'F#' | 'Gb' | 'G' | 'G#' | 'Ab' | 'A' | 'A#' | 'Bb' | 'B';

export type Accidental = 'natural' | 'sharp' | 'flat' | 'double_sharp' | 'double_flat';

export interface Duration {
  note_value: NoteValue;
  dots: number;
  tuplet?: Tuplet;
  tied: boolean;
}

export type NoteValue = 'whole' | 'half' | 'quarter' | 'eighth' | 'sixteenth' | 'thirty_second' | 'sixty_fourth';

export interface Tuplet {
  ratio: [number, number]; // e.g., [3, 2] for triplet
  bracket: boolean;
  number_display: boolean;
}

export interface Mode {
  name: string;
  type: 'major' | 'minor' | 'modal' | 'exotic' | 'synthetic';
  intervals: Interval[];
  characteristic_degrees: number[];
  
  // Modal characteristics
  brightness: number; // 0-1
  stability: number; // 0-1
  tension: number; // 0-1
  
  // Cultural context
  origin: string;
  common_usage: string[];
  related_modes: string[];
}

export interface Interval {
  semitones: number;
  name: string;
  quality: IntervalQuality;
  direction: 'ascending' | 'descending' | 'unison';
  
  // Harmonic properties
  consonance: number; // 0-1
  stability: number; // 0-1
  tension: number; // 0-1
  
  // Voice leading
  resolution_tendency?: Note;
  voice_leading_smoothness: number; // 0-1
}

export type IntervalQuality = 'perfect' | 'major' | 'minor' | 'augmented' | 'diminished' | 'doubly_augmented' | 'doubly_diminished';

export interface KeySignature {
  sharps: number;
  flats: number;
  accidentals: PitchClass[];
  
  // Enharmonic information
  enharmonic_equivalent?: KeySignature;
  theoretical: boolean; // true for keys with many accidentals
}

export interface Scale {
  name: string;
  type: ScaleType;
  root: Note;
  notes: Note[];
  intervals: Interval[];
  
  // Scale properties
  symmetrical: boolean;
  modes: Mode[];
  parent_scale?: string;
  
  // Harmonic analysis
  available_tensions: number[];
  avoid_notes: number[];
  characteristic_chords: Chord[];
  
  // Cultural context
  origin: string;
  common_genres: string[];
  emotional_character: string[];
}

export type ScaleType = 
  | 'major' | 'minor' | 'chromatic' | 'pentatonic' | 'blues' | 'whole_tone'
  | 'diminished' | 'augmented' | 'harmonic_minor' | 'melodic_minor'
  | 'dorian' | 'phrygian' | 'lydian' | 'mixolydian' | 'aeolian' | 'locrian'
  | 'bebop' | 'altered' | 'synthetic' | 'exotic';

export interface ScaleDegree {
  degree: number; // 1-7 (or more for extended scales)
  note: Note;
  function: DegreeFunction;
  
  // Harmonic tendencies
  stability: number; // 0-1
  resolution_tendency?: number; // target degree
  voice_leading_tendencies: VoiceLeadingTendency[];
  
  // Chord building
  triad_quality: ChordQuality;
  seventh_chord_quality: ChordQuality;
  available_extensions: number[];
}

export type DegreeFunction = 
  | 'tonic' | 'supertonic' | 'mediant' | 'subdominant' | 'dominant' | 'submediant' | 'leading_tone' | 'subtonic';

export interface Chord {
  root: Note;
  quality: ChordQuality;
  inversion: number;
  bass_note: Note;
  
  // Chord tones
  chord_tones: Note[];
  extensions: Note[];
  alterations: ChordAlteration[];
  
  // Voicing
  voicing: ChordVoicing;
  voice_leading: VoiceLeading;
  
  // Harmonic analysis
  roman_numeral: string;
  function: HarmonicFunction;
  tension_level: number; // 0-1
  stability: number; // 0-1
  
  // Context
  key_context: MusicalKey;
  preceding_chord?: Chord;
  following_chord?: Chord;
  
  // Analysis metadata
  confidence: number; // 0-1
  analysis_method: string;
  alternative_interpretations: ChordInterpretation[];
}

export type ChordQuality = 
  | 'major' | 'minor' | 'diminished' | 'augmented' | 'dominant' | 'major7' | 'minor7'
  | 'diminished7' | 'half_diminished7' | 'augmented7' | 'major_add9' | 'minor_add9'
  | 'sus2' | 'sus4' | 'power' | 'altered' | 'extended' | 'polychord';

export interface ChordAlteration {
  degree: number;
  alteration: 'sharp' | 'flat' | 'natural';
  note: Note;
}

export interface ChordVoicing {
  type: VoicingType;
  voices: Voice[];
  spacing: VoiceSpacing;
  doubling: VoiceDoubling[];
  
  // Voicing characteristics
  range: [Note, Note]; // lowest to highest
  density: number; // notes per octave
  color: VoicingColor;
  
  // Performance considerations
  playability: number; // 0-1
  instrument_suitability: Record<string, number>;
}

export type VoicingType = 
  | 'close' | 'open' | 'drop2' | 'drop3' | 'spread' | 'cluster' | 'quartal' | 'quintal' | 'polychord';

export interface Voice {
  note: Note;
  voice_number: number; // 1=bass, 2=tenor, 3=alto, 4=soprano
  chord_tone_function: ChordToneFunction;
  
  // Voice leading
  previous_note?: Note;
  next_note?: Note;
  motion_type?: MotionType;
  interval_to_previous?: Interval;
}

export type ChordToneFunction = 'root' | 'third' | 'fifth' | 'seventh' | 'ninth' | 'eleventh' | 'thirteenth' | 'extension' | 'alteration';

export type MotionType = 'step' | 'skip' | 'leap' | 'static' | 'octave';

export interface VoiceSpacing {
  type: 'close' | 'open' | 'mixed';
  intervals_between_voices: Interval[];
  largest_gap: Interval;
  voice_crossing: boolean;
}

export interface VoiceDoubling {
  chord_tone: ChordToneFunction;
  voices: number[];
  octave_displacement: boolean;
}

export type VoicingColor = 'bright' | 'dark' | 'warm' | 'cool' | 'rich' | 'thin' | 'dense' | 'sparse';

export interface VoiceLeading {
  type: VoiceLeadingType;
  smoothness: number; // 0-1
  total_motion: number; // semitones moved across all voices
  
  // Voice leading principles
  parallel_motion: ParallelMotion[];
  contrary_motion: boolean;
  oblique_motion: boolean;
  
  // Voice leading errors
  parallel_fifths: boolean;
  parallel_octaves: boolean;
  hidden_parallels: boolean;
  voice_crossing: boolean;
  
  // Resolution quality
  resolution_quality: number; // 0-1
  tendency_tone_resolution: TendencyToneResolution[];
}

export type VoiceLeadingType = 'smooth' | 'stepwise' | 'chromatic' | 'diatonic' | 'angular' | 'static';

export interface ParallelMotion {
  voices: [number, number];
  interval: Interval;
  direction: 'ascending' | 'descending';
  acceptable: boolean;
}

export interface TendencyToneResolution {
  tendency_tone: Note;
  resolution: Note;
  voice: number;
  resolved_correctly: boolean;
  resolution_strength: number; // 0-1
}

export interface VoiceLeadingTendency {
  from_note: Note;
  to_note: Note;
  strength: number; // 0-1
  context: string;
}

export type HarmonicFunction = 
  | 'tonic' | 'predominant' | 'dominant' | 'subdominant' | 'supertonic' | 'mediant' | 'submediant'
  | 'leading_tone' | 'neapolitan' | 'augmented_sixth' | 'secondary_dominant' | 'borrowed' | 'chromatic';

export interface TonicFunction {
  chord: Chord;
  function_type: 'primary_tonic' | 'tonic_substitute' | 'relative_tonic';
  stability: number; // 0-1
  resolution_strength: number; // 0-1
}

export interface Cadence {
  type: CadenceType;
  chords: Chord[];
  strength: number; // 0-1
  finality: number; // 0-1
  
  // Cadence analysis
  voice_leading_quality: number; // 0-1
  harmonic_rhythm: number[]; // beat positions
  melodic_contour: MelodicContour;
  
  // Context
  position_in_phrase: 'beginning' | 'middle' | 'end';
  structural_importance: number; // 0-1
}

export type CadenceType = 
  | 'authentic' | 'plagal' | 'half' | 'deceptive' | 'phrygian' | 'landini' | 'modal' | 'evaded';

export interface MelodicContour {
  direction: 'ascending' | 'descending' | 'arch' | 'inverted_arch' | 'static' | 'complex';
  highest_point: Note;
  lowest_point: Note;
  range: Interval;
  
  // Contour analysis
  tension_curve: number[]; // tension values over time
  climax_position: number; // 0-1 (position of highest tension)
  resolution_quality: number; // 0-1
}

export interface ChordProgression {
  id: string;
  name: string;
  chords: Chord[];
  key: MusicalKey;
  
  // Progression analysis
  harmonic_rhythm: HarmonicRhythm;
  tonal_plan: TonalPlan;
  voice_leading_analysis: VoiceLeadingAnalysis;
  
  // Functional analysis
  roman_numeral_analysis: string[];
  functional_analysis: FunctionalAnalysis;
  cadences: Cadence[];
  
  // Style and genre
  style_period: StylePeriod;
  genre_characteristics: GenreCharacteristic[];
  common_usage: string[];
  
  // Generation metadata
  generated_by: 'user' | 'ai' | 'analysis';
  generation_algorithm?: string;
  confidence: number; // 0-1
  
  // Performance
  difficulty_level: number; // 1-10
  instrument_suitability: Record<string, number>;
  tempo_suggestions: TempoSuggestion[];
  
  // Variations
  variations: ProgressionVariation[];
  related_progressions: string[];
  
  // Metadata
  created_at: number;
  updated_at: number;
  usage_count: number;
  rating: number; // 1-5
}

export interface HarmonicRhythm {
  chord_durations: number[]; // in beats
  pattern: string;
  acceleration: boolean;
  deceleration: boolean;
  
  // Rhythm analysis
  syncopation: number; // 0-1
  regularity: number; // 0-1
  complexity: number; // 0-1
}

export interface TonalPlan {
  starting_key: MusicalKey;
  ending_key: MusicalKey;
  modulations: Modulation[];
  tonal_centers: TonalCenter[];
  
  // Tonal analysis
  tonal_stability: number; // 0-1
  chromatic_content: number; // 0-1
  modal_mixture: boolean;
}

export interface Modulation {
  from_key: MusicalKey;
  to_key: MusicalKey;
  type: ModulationType;
  pivot_chord?: Chord;
  transition_chords: Chord[];
  
  // Modulation analysis
  smoothness: number; // 0-1
  surprise_factor: number; // 0-1
  structural_importance: number; // 0-1
}

export type ModulationType = 
  | 'pivot_chord' | 'common_tone' | 'chromatic' | 'enharmonic' | 'direct' | 'sequential' | 'deceptive';

export interface TonalCenter {
  key: MusicalKey;
  start_position: number; // beat position
  end_position: number;
  strength: number; // 0-1
  establishment_method: string;
}

export interface VoiceLeadingAnalysis {
  overall_smoothness: number; // 0-1
  voice_independence: number; // 0-1
  contrapuntal_quality: number; // 0-1
  
  // Voice leading issues
  parallel_motion_issues: ParallelMotion[];
  voice_crossing_instances: number;
  large_leaps: LargeLeap[];
  
  // Voice leading strengths
  smooth_connections: number;
  contrary_motion_instances: number;
  stepwise_motion_percentage: number;
}

export interface LargeLeap {
  voice: number;
  from_note: Note;
  to_note: Note;
  interval: Interval;
  justified: boolean;
  justification?: string;
}

export interface FunctionalAnalysis {
  tonic_areas: TonalArea[];
  predominant_areas: TonalArea[];
  dominant_areas: TonalArea[];
  
  // Functional relationships
  functional_sequence: HarmonicFunction[];
  circle_of_fifths_motion: boolean;
  chromatic_mediant_relationships: ChromaticMediant[];
  
  // Harmonic innovations
  borrowed_chords: BorrowedChord[];
  secondary_dominants: SecondaryDominant[];
  augmented_sixth_chords: AugmentedSixthChord[];
  neapolitan_chords: NeapolitanChord[];
}

export interface TonalArea {
  function: HarmonicFunction;
  chords: Chord[];
  duration: number; // in beats
  strength: number; // 0-1
}

export interface ChromaticMediant {
  from_chord: Chord;
  to_chord: Chord;
  relationship_type: 'upper' | 'lower' | 'double';
  common_tones: Note[];
}

export interface BorrowedChord {
  chord: Chord;
  borrowed_from: MusicalKey;
  function_in_borrowed_key: HarmonicFunction;
  effect: string;
}

export interface SecondaryDominant {
  chord: Chord;
  target_chord: Chord;
  resolution_quality: number; // 0-1
  tonicization_strength: number; // 0-1
}

export interface AugmentedSixthChord {
  chord: Chord;
  type: 'italian' | 'french' | 'german' | 'swiss';
  resolution: Chord;
  voice_leading_quality: number; // 0-1
}

export interface NeapolitanChord {
  chord: Chord;
  inversion: number;
  resolution: Chord;
  preparation_quality: number; // 0-1
}

export interface StylePeriod {
  name: string;
  time_period: [number, number]; // years
  characteristics: StyleCharacteristic[];
  representative_composers: string[];
  harmonic_language: HarmonicLanguage;
}

export interface StyleCharacteristic {
  aspect: string;
  description: string;
  examples: string[];
  importance: number; // 0-1
}

export interface HarmonicLanguage {
  chromaticism_level: number; // 0-1
  dissonance_treatment: DissonanceTreatment;
  modulation_frequency: number; // 0-1
  chord_vocabulary: ChordType[];
  voice_leading_style: VoiceLeadingStyle;
}

export interface DissonanceTreatment {
  preparation_required: boolean;
  resolution_required: boolean;
  acceptable_dissonances: Interval[];
  treatment_methods: string[];
}

export type ChordType = 'triad' | 'seventh' | 'ninth' | 'eleventh' | 'thirteenth' | 'altered' | 'added_tone' | 'suspended';

export interface VoiceLeadingStyle {
  smoothness_preference: number; // 0-1
  independence_level: number; // 0-1
  contrapuntal_complexity: number; // 0-1
  acceptable_parallels: Interval[];
}

export interface GenreCharacteristic {
  genre: string;
  characteristic: string;
  importance: number; // 0-1
  examples: string[];
}

export interface TempoSuggestion {
  bpm_range: [number, number];
  character: string;
  style_context: string;
  reasoning: string;
}

export interface ProgressionVariation {
  id: string;
  name: string;
  type: VariationType;
  modified_chords: Chord[];
  description: string;
  
  // Variation analysis
  similarity_to_original: number; // 0-1
  complexity_change: number; // -1 to 1
  harmonic_interest: number; // 0-1
}

export type VariationType = 
  | 'substitution' | 'extension' | 'reharmonization' | 'inversion' | 'voicing' | 'rhythm' | 'modal_interchange';

export interface ChordInterpretation {
  chord: Chord;
  confidence: number; // 0-1
  context: string;
  reasoning: string;
  alternative_symbols: string[];
}

export interface CompositionAssistant {
  id: string;
  name: string;
  type: AssistantType;
  
  // AI capabilities
  style_modeling: boolean;
  harmonic_analysis: boolean;
  melodic_generation: boolean;
  rhythmic_generation: boolean;
  form_analysis: boolean;
  
  // Training data
  training_corpus: TrainingCorpus;
  style_models: StyleModel[];
  
  // Generation settings
  creativity_level: number; // 0-1
  style_adherence: number; // 0-1
  harmonic_complexity: number; // 0-1
  melodic_complexity: number; // 0-1
  
  // Performance
  generation_speed: number; // compositions per minute
  analysis_accuracy: number; // 0-1
  user_satisfaction: number; // 0-1
  
  // Status
  is_active: boolean;
  generated_compositions: number;
  analyzed_pieces: number;
  
  // Metadata
  version: string;
  last_updated: number;
}

export type AssistantType = 
  | 'harmonic_analyzer' | 'progression_generator' | 'melody_composer' | 'rhythm_generator'
  | 'form_analyzer' | 'style_classifier' | 'counterpoint_assistant' | 'orchestration_helper';

export interface TrainingCorpus {
  name: string;
  size: number; // number of pieces
  genres: string[];
  time_periods: string[];
  composers: string[];
  
  // Corpus statistics
  total_chords: number;
  total_progressions: number;
  unique_chord_types: number;
  harmonic_complexity_distribution: number[];
}

export interface StyleModel {
  name: string;
  style_period: StylePeriod;
  genre: string;
  
  // Model parameters
  chord_transition_probabilities: Record<string, Record<string, number>>;
  harmonic_rhythm_patterns: HarmonicRhythmPattern[];
  voice_leading_preferences: VoiceLeadingPreference[];
  cadence_preferences: CadencePreference[];
  
  // Model performance
  accuracy: number; // 0-1
  perplexity: number;
  training_loss: number;
  validation_loss: number;
  
  // Metadata
  training_date: number;
  training_duration: number; // hours
  model_size: number; // parameters
}

export interface HarmonicRhythmPattern {
  pattern: number[]; // chord durations in beats
  frequency: number; // 0-1
  context: string;
  style_period: string;
}

export interface VoiceLeadingPreference {
  from_chord: string;
  to_chord: string;
  preferred_voice_leading: VoiceLeading;
  frequency: number; // 0-1
  style_context: string;
}

export interface CadencePreference {
  cadence_type: CadenceType;
  chord_progression: string[];
  frequency: number; // 0-1
  structural_position: string;
  style_period: string;
}

export interface AnalysisSession {
  id: string;
  input_type: 'audio' | 'midi' | 'score' | 'chord_symbols';
  input_data: any;
  
  // Analysis configuration
  analysis_types: AnalysisType[];
  depth_level: 'basic' | 'intermediate' | 'advanced' | 'expert';
  style_context?: string;
  
  // Progress
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number; // 0-1
  estimated_time_remaining: number; // seconds
  
  // Results
  results: AnalysisResult[];
  
  // Performance
  processing_time: number; // milliseconds
  accuracy_estimate: number; // 0-1
  confidence_scores: Record<string, number>;
  
  // Metadata
  started_at: number;
  completed_at?: number;
  analysis_version: string;
}

export type AnalysisType = 
  | 'key_detection' | 'chord_analysis' | 'harmonic_function' | 'voice_leading'
  | 'form_analysis' | 'style_classification' | 'cadence_detection' | 'modulation_analysis'
  | 'melodic_analysis' | 'rhythmic_analysis' | 'counterpoint_analysis' | 'orchestration_analysis';

export interface AnalysisResult {
  type: AnalysisType;
  data: any;
  confidence: number; // 0-1
  processing_time: number; // milliseconds
  method: string;
  
  // Alternative interpretations
  alternatives: AlternativeInterpretation[];
  
  // Metadata
  timestamp: number;
  version: string;
}

export interface AlternativeInterpretation {
  interpretation: any;
  confidence: number; // 0-1
  reasoning: string;
  context: string;
}

export interface GenerationRequest {
  id: string;
  type: GenerationType;
  parameters: GenerationParameters;
  
  // Context
  style_context?: string;
  harmonic_context?: MusicalKey;
  existing_material?: any;
  
  // Constraints
  constraints: GenerationConstraint[];
  preferences: GenerationPreference[];
  
  // Progress
  status: 'pending' | 'generating' | 'completed' | 'failed';
  progress: number; // 0-1
  
  // Results
  generated_content: any;
  alternatives: any[];
  
  // Quality metrics
  quality_score: number; // 0-1
  style_adherence: number; // 0-1
  creativity_score: number; // 0-1
  
  // Metadata
  requested_at: number;
  completed_at?: number;
  generation_time: number; // milliseconds
}

export type GenerationType = 
  | 'chord_progression' | 'melody' | 'bass_line' | 'harmony' | 'rhythm'
  | 'counterpoint' | 'variation' | 'development' | 'orchestration' | 'complete_piece';

export interface GenerationParameters {
  length?: number; // measures or beats
  tempo?: number; // BPM
  time_signature?: [number, number];
  key?: MusicalKey;
  style?: string;
  complexity?: number; // 0-1
  creativity?: number; // 0-1
  
  // Specific parameters by type
  harmonic_rhythm?: number[]; // for chord progressions
  melodic_range?: [Note, Note]; // for melodies
  voice_count?: number; // for counterpoint
  instrumentation?: string[]; // for orchestration
}

export interface GenerationConstraint {
  type: ConstraintType;
  description: string;
  parameters: Record<string, any>;
  importance: number; // 0-1
}

export type ConstraintType = 
  | 'harmonic' | 'melodic' | 'rhythmic' | 'formal' | 'voice_leading' | 'range' | 'style' | 'technical';

export interface GenerationPreference {
  aspect: string;
  preference: any;
  weight: number; // 0-1
  reasoning?: string;
}

export interface MusicTheoryKnowledgeBase {
  scales: Scale[];
  chords: ChordDefinition[];
  progressions: ChordProgression[];
  cadences: CadenceDefinition[];
  voice_leading_rules: VoiceLeadingRule[];
  harmonic_functions: HarmonicFunctionDefinition[];
  
  // Style-specific knowledge
  style_periods: StylePeriod[];
  genre_characteristics: GenreDefinition[];
  composer_styles: ComposerStyle[];
  
  // Theoretical concepts
  counterpoint_rules: CounterpointRule[];
  form_templates: FormTemplate[];
  orchestration_guidelines: OrchestrationGuideline[];
  
  // Cultural and historical context
  cultural_contexts: CulturalContext[];
  historical_developments: HistoricalDevelopment[];
  
  // Metadata
  version: string;
  last_updated: number;
  source_count: number;
  accuracy_rating: number; // 0-1
}

export interface ChordDefinition {
  name: string;
  symbol: string;
  intervals: Interval[];
  chord_tones: number[];
  extensions: number[];
  alterations: number[];
  
  // Harmonic properties
  stability: number; // 0-1
  tension: number; // 0-1
  color: string;
  
  // Usage context
  common_functions: HarmonicFunction[];
  typical_progressions: string[];
  style_associations: string[];
  
  // Voice leading
  common_voicings: ChordVoicing[];
  resolution_tendencies: ResolutionTendency[];
}

export interface ResolutionTendency {
  target_chord: string;
  strength: number; // 0-1
  voice_leading: VoiceLeading;
  context: string;
}

export interface CadenceDefinition {
  name: string;
  type: CadenceType;
  chord_progression: string[];
  harmonic_functions: HarmonicFunction[];
  
  // Cadence properties
  finality: number; // 0-1
  strength: number; // 0-1
  common_contexts: string[];
  
  // Style associations
  style_periods: string[];
  genres: string[];
  
  // Voice leading requirements
  voice_leading_rules: string[];
  melodic_requirements: string[];
}

export interface VoiceLeadingRule {
  name: string;
  description: string;
  rule_type: 'prohibition' | 'preference' | 'requirement';
  
  // Rule parameters
  applies_to: string[]; // voice types, chord types, etc.
  exceptions: string[];
  strength: number; // 0-1
  
  // Context
  style_periods: string[];
  counterpoint_species?: number;
  
  // Examples
  good_examples: VoiceLeadingExample[];
  bad_examples: VoiceLeadingExample[];
}

export interface VoiceLeadingExample {
  description: string;
  chord_progression: Chord[];
  voice_leading: VoiceLeading;
  explanation: string;
}

export interface HarmonicFunctionDefinition {
  name: string;
  function: HarmonicFunction;
  description: string;
  
  // Functional properties
  stability: number; // 0-1
  tension: number; // 0-1
  resolution_tendency: HarmonicFunction[];
  
  // Chord associations
  primary_chords: string[];
  substitute_chords: string[];
  
  // Context
  tonal_contexts: string[];
  modal_contexts: string[];
  style_associations: string[];
}

export interface GenreDefinition {
  name: string;
  time_period: [number, number];
  cultural_origin: string;
  
  // Musical characteristics
  harmonic_language: HarmonicLanguage;
  rhythmic_characteristics: RhythmicCharacteristic[];
  melodic_characteristics: MelodicCharacteristic[];
  formal_characteristics: FormalCharacteristic[];
  
  // Instrumentation
  typical_instruments: string[];
  ensemble_types: string[];
  
  // Representative works
  representative_pieces: RepresentativePiece[];
  key_composers: string[];
}

export interface RhythmicCharacteristic {
  aspect: string;
  description: string;
  examples: string[];
  importance: number; // 0-1
}

export interface MelodicCharacteristic {
  aspect: string;
  description: string;
  typical_intervals: Interval[];
  range_preferences: [Note, Note];
  contour_preferences: string[];
}

export interface FormalCharacteristic {
  form_type: string;
  description: string;
  typical_proportions: number[];
  key_relationships: string[];
  developmental_techniques: string[];
}

export interface RepresentativePiece {
  title: string;
  composer: string;
  year: number;
  significance: string;
  analysis_notes: string[];
}

export interface ComposerStyle {
  composer: string;
  life_span: [number, number];
  style_periods: string[];
  
  // Harmonic characteristics
  harmonic_language: HarmonicLanguage;
  favorite_progressions: string[];
  harmonic_innovations: string[];
  
  // Melodic characteristics
  melodic_style: MelodicStyle;
  motivic_techniques: string[];
  
  // Formal preferences
  preferred_forms: string[];
  formal_innovations: string[];
  
  // Orchestration style
  orchestration_characteristics: string[];
  instrumental_preferences: string[];
  
  // Influence and context
  influences: string[];
  influenced: string[];
  historical_significance: string;
}

export interface MelodicStyle {
  range_preferences: Record<string, [Note, Note]>; // by instrument
  interval_preferences: Interval[];
  contour_characteristics: string[];
  rhythmic_characteristics: string[];
  ornamental_style: string[];
}

export interface CounterpointRule {
  name: string;
  species: number; // 1-5 for species counterpoint
  description: string;
  rule_type: 'melodic' | 'harmonic' | 'rhythmic' | 'formal';
  
  // Rule specifics
  prohibition?: string;
  requirement?: string;
  preference?: string;
  
  // Context
  voice_types: string[];
  exceptions: string[];
  
  // Examples
  examples: CounterpointExample[];
}

export interface CounterpointExample {
  description: string;
  cantus_firmus: Note[];
  counterpoint: Note[];
  analysis: string;
  quality: 'excellent' | 'good' | 'acceptable' | 'poor';
}

export interface FormTemplate {
  name: string;
  type: FormType;
  description: string;
  
  // Structure
  sections: FormSection[];
  proportions: number[];
  key_relationships: KeyRelationship[];
  
  // Characteristics
  typical_length: [number, number]; // measures
  complexity_level: number; // 1-10
  historical_period: string[];
  
  // Usage
  common_genres: string[];
  representative_pieces: RepresentativePiece[];
}

export type FormType = 
  | 'binary' | 'ternary' | 'rondo' | 'sonata' | 'theme_and_variations' | 'fugue'
  | 'passacaglia' | 'chaconne' | 'suite' | 'concerto' | 'symphony' | 'song_form';

export interface FormSection {
  name: string;
  function: SectionFunction;
  typical_length: [number, number]; // measures
  harmonic_plan: string;
  thematic_content: string;
  
  // Relationships
  related_sections: string[];
  developmental_techniques: string[];
}

export type SectionFunction = 
  | 'exposition' | 'development' | 'recapitulation' | 'coda' | 'introduction'
  | 'transition' | 'episode' | 'refrain' | 'verse' | 'chorus' | 'bridge';

export interface KeyRelationship {
  from_section: string;
  to_section: string;
  relationship: string;
  modulation_type?: ModulationType;
}

export interface OrchestrationGuideline {
  instrument: string;
  family: InstrumentFamily;
  
  // Technical characteristics
  range: [Note, Note];
  transposition?: Interval;
  clef: string[];
  
  // Timbral characteristics
  timbral_qualities: string[];
  dynamic_range: [string, string];
  articulation_capabilities: string[];
  
  // Usage guidelines
  effective_registers: EffectiveRegister[];
  doubling_recommendations: DoublingRecommendation[];
  balance_considerations: string[];
  
  // Style considerations
  period_usage: Record<string, string>; // period -> usage description
  genre_suitability: Record<string, number>; // genre -> suitability (0-1)
}

export type InstrumentFamily = 
  | 'strings' | 'woodwinds' | 'brass' | 'percussion' | 'keyboard' | 'harp' | 'voice' | 'electronic';

export interface EffectiveRegister {
  range: [Note, Note];
  character: string;
  dynamic_effectiveness: string;
  recommended_usage: string[];
}

export interface DoublingRecommendation {
  with_instrument: string;
  interval?: Interval;
  effectiveness: number; // 0-1
  context: string;
  notes: string;
}

export interface CulturalContext {
  culture: string;
  time_period: [number, number];
  geographical_region: string;
  
  // Musical characteristics
  scale_systems: Scale[];
  rhythmic_systems: RhythmicSystem[];
  harmonic_concepts: HarmonicConcept[];
  formal_structures: string[];
  
  // Cultural significance
  social_functions: string[];
  religious_significance?: string;
  ceremonial_usage?: string[];
  
  // Influence
  influenced_by: string[];
  influenced: string[];
  
  // Modern relevance
  contemporary_usage: string;
  preservation_status: string;
}

export interface RhythmicSystem {
  name: string;
  description: string;
  basic_patterns: RhythmicPattern[];
  complexity_levels: string[];
  cultural_significance: string;
}

export interface RhythmicPattern {
  name: string;
  pattern: number[]; // durations
  accent_pattern: boolean[];
  cultural_context: string;
  variations: RhythmicPattern[];
}

export interface HarmonicConcept {
  name: string;
  description: string;
  theoretical_basis: string;
  practical_application: string[];
  cultural_significance: string;
}

export interface HistoricalDevelopment {
  period: string;
  time_span: [number, number];
  key_developments: KeyDevelopment[];
  influential_figures: InfluentialFigure[];
  
  // Musical changes
  harmonic_innovations: string[];
  formal_innovations: string[];
  instrumental_developments: string[];
  
  // Cultural context
  social_factors: string[];
  technological_factors: string[];
  aesthetic_movements: string[];
  
  // Legacy
  lasting_influence: string[];
  modern_relevance: string;
}

export interface KeyDevelopment {
  development: string;
  description: string;
  significance: string;
  key_figures: string[];
  representative_works: string[];
}

export interface InfluentialFigure {
  name: string;
  life_span: [number, number];
  contributions: string[];
  innovations: string[];
  influence_on_successors: string[];
  representative_works: string[];
}
