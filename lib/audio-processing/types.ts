/**
 * Advanced Audio Processing Types and Interfaces
 * Real-time audio analysis, effects processing, spatial audio, and AI-powered enhancement
 */

export interface AudioProcessingEngine {
  id: string;
  name: string;
  version: string;
  
  // Engine configuration
  sample_rate: number;
  buffer_size: number;
  bit_depth: number;
  channels: number;
  latency: number; // milliseconds
  
  // Processing capabilities
  supported_formats: AudioFormat[];
  max_tracks: number;
  real_time_processing: boolean;
  offline_processing: boolean;
  
  // AI capabilities
  ai_enhancement: boolean;
  ai_mastering: boolean;
  ai_separation: boolean;
  ai_restoration: boolean;
  
  // Status
  is_active: boolean;
  cpu_usage: number; // 0-100
  memory_usage: number; // bytes
  processing_load: number; // 0-100
  
  // Performance metrics
  processed_samples: number;
  dropped_samples: number;
  processing_time: number; // total milliseconds
  average_latency: number;
}

export interface AudioFormat {
  name: string;
  extension: string;
  mime_type: string;
  sample_rates: number[];
  bit_depths: number[];
  max_channels: number;
  compression: 'lossless' | 'lossy' | 'uncompressed';
  quality_range: [number, number]; // for lossy formats
}

export interface AudioTrack {
  id: string;
  name: string;
  description?: string;
  
  // Audio data
  audio_buffer: AudioBuffer;
  sample_rate: number;
  channels: number;
  duration: number; // seconds
  bit_depth: number;
  
  // Processing chain
  effects_chain: AudioEffect[];
  routing: AudioRouting;
  
  // Analysis data
  waveform: WaveformData;
  spectrum: SpectrumData;
  features: AudioFeatures;
  
  // Metadata
  created_at: number;
  updated_at: number;
  file_size: number;
  checksum: string;
  
  // Status
  is_muted: boolean;
  is_solo: boolean;
  is_armed: boolean;
  is_playing: boolean;
  
  // Levels
  input_gain: number; // dB
  output_gain: number; // dB
  pan: number; // -1 to 1
  
  // Monitoring
  peak_level: number; // dB
  rms_level: number; // dB
  lufs: number; // loudness
}

export interface AudioBuffer {
  data: Float32Array[];
  length: number;
  sample_rate: number;
  channels: number;
  duration: number;
}

export interface AudioEffect {
  id: string;
  name: string;
  type: EffectType;
  category: EffectCategory;
  
  // Effect configuration
  parameters: EffectParameter[];
  presets: EffectPreset[];
  current_preset?: string;
  
  // Processing
  is_enabled: boolean;
  is_bypassed: boolean;
  wet_dry_mix: number; // 0-1
  
  // AI features
  ai_assisted: boolean;
  auto_parameters: boolean;
  learning_enabled: boolean;
  
  // Performance
  cpu_usage: number;
  latency: number; // samples
  
  // Metadata
  version: string;
  manufacturer: string;
  created_at: number;
}

export type EffectType = 
  | 'equalizer' | 'compressor' | 'limiter' | 'gate' | 'expander'
  | 'reverb' | 'delay' | 'chorus' | 'flanger' | 'phaser'
  | 'distortion' | 'overdrive' | 'saturation' | 'bitcrusher'
  | 'filter' | 'resonator' | 'formant' | 'vocoder'
  | 'pitch_shift' | 'time_stretch' | 'granular' | 'spectral'
  | 'spatial' | 'binaural' | 'ambisonic' | 'surround'
  | 'ai_enhancer' | 'ai_mastering' | 'ai_restoration' | 'ai_separation';

export type EffectCategory = 
  | 'dynamics' | 'eq' | 'modulation' | 'time_based' | 'distortion'
  | 'filter' | 'pitch' | 'spatial' | 'ai' | 'utility' | 'creative';

export interface EffectParameter {
  id: string;
  name: string;
  display_name: string;
  type: ParameterType;
  
  // Value constraints
  min_value: number;
  max_value: number;
  default_value: number;
  current_value: number;
  
  // Display
  unit: string;
  scale: 'linear' | 'logarithmic' | 'exponential';
  precision: number;
  
  // Automation
  is_automatable: boolean;
  automation_curve?: AutomationCurve;
  
  // AI assistance
  ai_suggested_value?: number;
  ai_confidence?: number; // 0-1
  
  // Metadata
  description: string;
  category: string;
}

export type ParameterType = 
  | 'float' | 'integer' | 'boolean' | 'enum' | 'string'
  | 'frequency' | 'time' | 'gain' | 'ratio' | 'percentage';

export interface EffectPreset {
  id: string;
  name: string;
  description: string;
  category: string;
  
  // Parameter values
  parameter_values: Record<string, number>;
  
  // Metadata
  created_by: string;
  created_at: number;
  tags: string[];
  rating: number; // 1-5
  usage_count: number;
  
  // AI features
  ai_generated: boolean;
  ai_optimized: boolean;
  target_genre?: string;
  target_mood?: string;
}

export interface AutomationCurve {
  id: string;
  parameter_id: string;
  
  // Curve data
  points: AutomationPoint[];
  interpolation: 'linear' | 'cubic' | 'step' | 'smooth';
  
  // Timing
  start_time: number; // seconds
  end_time: number; // seconds
  loop: boolean;
  
  // AI features
  ai_generated: boolean;
  ai_smoothed: boolean;
  
  // Metadata
  created_at: number;
  updated_at: number;
}

export interface AutomationPoint {
  time: number; // seconds
  value: number;
  curve_type: 'linear' | 'ease_in' | 'ease_out' | 'ease_in_out' | 'bezier';
  tension?: number; // for bezier curves
}

export interface AudioRouting {
  id: string;
  track_id: string;
  
  // Input routing
  input_source: AudioSource;
  input_channels: number[];
  
  // Output routing
  output_destination: AudioDestination;
  output_channels: number[];
  
  // Send/return routing
  sends: AudioSend[];
  returns: AudioReturn[];
  
  // Sidechain routing
  sidechain_source?: string; // track ID
  sidechain_enabled: boolean;
  
  // Monitoring
  monitor_mode: 'off' | 'input' | 'tape' | 'auto';
  monitor_level: number; // dB
}

export interface AudioSource {
  type: 'microphone' | 'line_input' | 'digital_input' | 'track' | 'bus' | 'virtual';
  device_id?: string;
  channel_offset: number;
  gain: number; // dB
  phantom_power?: boolean; // for microphones
}

export interface AudioDestination {
  type: 'speakers' | 'headphones' | 'line_output' | 'digital_output' | 'track' | 'bus' | 'file';
  device_id?: string;
  channel_offset: number;
  gain: number; // dB
}

export interface AudioSend {
  id: string;
  destination: string; // bus or effect ID
  level: number; // dB
  pre_post: 'pre_fader' | 'post_fader';
  is_enabled: boolean;
}

export interface AudioReturn {
  id: string;
  source: string; // bus or effect ID
  level: number; // dB
  pan: number; // -1 to 1
  is_enabled: boolean;
}

export interface WaveformData {
  peaks: number[];
  rms: number[];
  resolution: number; // samples per pixel
  zoom_levels: WaveformZoomLevel[];
  
  // Visual properties
  color_scheme: WaveformColorScheme;
  display_mode: 'peaks' | 'rms' | 'both' | 'spectral';
  
  // Analysis
  zero_crossings: number[];
  transients: number[];
  silence_regions: TimeRange[];
  
  // Metadata
  generated_at: number;
  cache_key: string;
}

export interface WaveformZoomLevel {
  level: number;
  samples_per_pixel: number;
  peaks: number[];
  rms: number[];
}

export interface WaveformColorScheme {
  positive_peak: string;
  negative_peak: string;
  rms: string;
  background: string;
  grid: string;
  selection: string;
}

export interface TimeRange {
  start: number; // seconds
  end: number; // seconds
  confidence?: number; // 0-1
}

export interface SpectrumData {
  frequencies: number[];
  magnitudes: number[][];
  phases: number[][];
  
  // Analysis parameters
  fft_size: number;
  window_type: 'hann' | 'hamming' | 'blackman' | 'rectangular';
  overlap: number; // 0-1
  
  // Time-frequency representation
  spectrogram: number[][];
  time_bins: number[];
  frequency_bins: number[];
  
  // Features
  spectral_centroid: number[];
  spectral_rolloff: number[];
  spectral_flux: number[];
  mfcc: number[][]; // Mel-frequency cepstral coefficients
  
  // Metadata
  generated_at: number;
  cache_key: string;
}

export interface AudioFeatures {
  // Temporal features
  tempo: number; // BPM
  tempo_confidence: number; // 0-1
  beat_positions: number[]; // seconds
  downbeat_positions: number[]; // seconds
  time_signature: [number, number]; // [numerator, denominator]
  
  // Tonal features
  key: string; // e.g., "C major", "A minor"
  key_confidence: number; // 0-1
  chroma: number[]; // 12-dimensional chroma vector
  harmonic_change_detection: number[]; // seconds
  
  // Spectral features
  spectral_centroid: number; // Hz
  spectral_bandwidth: number; // Hz
  spectral_rolloff: number; // Hz
  zero_crossing_rate: number;
  
  // Perceptual features
  loudness: number; // LUFS
  dynamic_range: number; // dB
  punch: number; // 0-1
  warmth: number; // 0-1
  brightness: number; // 0-1
  
  // Rhythm features
  onset_strength: number[];
  rhythm_patterns: RhythmPattern[];
  syncopation: number; // 0-1
  groove: number; // 0-1
  
  // Harmonic features
  harmonicity: number; // 0-1
  inharmonicity: number; // 0-1
  consonance: number; // 0-1
  tension: number; // 0-1
  
  // AI-derived features
  genre_predictions: GenrePrediction[];
  mood_predictions: MoodPrediction[];
  instrument_predictions: InstrumentPrediction[];
  vocal_presence: number; // 0-1
  
  // Quality metrics
  signal_to_noise_ratio: number; // dB
  total_harmonic_distortion: number; // percentage
  dynamic_range_db: number;
  peak_to_average_ratio: number;
  
  // Metadata
  analysis_version: string;
  computed_at: number;
  computation_time: number; // milliseconds
}

export interface RhythmPattern {
  pattern: number[]; // beat strength values
  period: number; // beats
  confidence: number; // 0-1
  start_time: number; // seconds
  end_time: number; // seconds
}

export interface GenrePrediction {
  genre: string;
  confidence: number; // 0-1
  subgenres: string[];
}

export interface MoodPrediction {
  mood: string;
  valence: number; // -1 to 1 (negative to positive)
  arousal: number; // 0-1 (calm to energetic)
  confidence: number; // 0-1
}

export interface InstrumentPrediction {
  instrument: string;
  confidence: number; // 0-1
  time_ranges: TimeRange[];
  fundamental_frequency: number; // Hz
}

export interface SpatialAudio {
  id: string;
  name: string;
  type: SpatialAudioType;
  
  // Spatial configuration
  format: SpatialFormat;
  channel_layout: ChannelLayout;
  speaker_configuration: SpeakerConfiguration;
  
  // 3D positioning
  sources: SpatialSource[];
  listener: SpatialListener;
  room: SpatialRoom;
  
  // Processing
  hrtf_enabled: boolean;
  room_simulation: boolean;
  distance_modeling: boolean;
  doppler_effect: boolean;
  
  // Binaural processing
  binaural_renderer: BinauralRenderer;
  head_tracking: boolean;
  personalized_hrtf: boolean;
  
  // Ambisonics
  ambisonic_order: number;
  ambisonic_format: 'fuma' | 'ambix' | 'sn3d';
  rotation: [number, number, number]; // yaw, pitch, roll in degrees
  
  // Performance
  cpu_usage: number;
  latency: number; // samples
  quality_level: 'low' | 'medium' | 'high' | 'ultra';
}

export type SpatialAudioType = 'stereo' | 'surround' | 'binaural' | 'ambisonic' | 'object_based';

export type SpatialFormat = 
  | 'stereo' | '5.1' | '7.1' | '7.1.4' | '9.1.6' | '22.2'
  | 'binaural' | 'ambisonic_1st' | 'ambisonic_2nd' | 'ambisonic_3rd'
  | 'dolby_atmos' | 'dts_x' | 'sony_360';

export interface ChannelLayout {
  channels: SpatialChannel[];
  total_channels: number;
  lfe_channels: number[];
  height_channels: number[];
}

export interface SpatialChannel {
  index: number;
  name: string;
  position: [number, number, number]; // x, y, z
  azimuth: number; // degrees
  elevation: number; // degrees
  distance: number; // meters
  is_lfe: boolean;
}

export interface SpeakerConfiguration {
  speakers: Speaker[];
  room_correction: boolean;
  delay_compensation: boolean;
  level_matching: boolean;
}

export interface Speaker {
  id: string;
  name: string;
  position: [number, number, number]; // x, y, z in meters
  orientation: [number, number, number]; // yaw, pitch, roll in degrees
  frequency_response: FrequencyResponse;
  delay: number; // milliseconds
  gain: number; // dB
  is_active: boolean;
}

export interface FrequencyResponse {
  frequencies: number[]; // Hz
  magnitudes: number[]; // dB
  phases: number[]; // degrees
}

export interface SpatialSource {
  id: string;
  name: string;
  track_id: string;
  
  // 3D position
  position: [number, number, number]; // x, y, z in meters
  velocity: [number, number, number]; // m/s for doppler
  orientation: [number, number, number]; // yaw, pitch, roll in degrees
  
  // Spatial properties
  size: number; // meters (source extent)
  directivity: DirectivityPattern;
  distance_model: DistanceModel;
  
  // Audio properties
  gain: number; // dB
  low_pass_cutoff: number; // Hz (distance filtering)
  high_pass_cutoff: number; // Hz
  
  // Animation
  position_automation: PositionAutomation;
  is_moving: boolean;
  
  // Occlusion/obstruction
  occlusion_level: number; // 0-1
  obstruction_level: number; // 0-1
}

export interface DirectivityPattern {
  type: 'omnidirectional' | 'cardioid' | 'figure_8' | 'shotgun' | 'custom';
  pattern_data?: number[]; // for custom patterns
  frequency_dependent: boolean;
  patterns_by_frequency?: Record<number, number[]>;
}

export interface DistanceModel {
  type: 'linear' | 'inverse' | 'exponential' | 'custom';
  reference_distance: number; // meters
  max_distance: number; // meters
  rolloff_factor: number;
  custom_curve?: number[]; // for custom models
}

export interface PositionAutomation {
  keyframes: PositionKeyframe[];
  interpolation: 'linear' | 'cubic' | 'bezier';
  loop: boolean;
  duration: number; // seconds
}

export interface PositionKeyframe {
  time: number; // seconds
  position: [number, number, number];
  velocity?: [number, number, number];
  easing: 'linear' | 'ease_in' | 'ease_out' | 'ease_in_out';
}

export interface SpatialListener {
  position: [number, number, number]; // x, y, z in meters
  orientation: [number, number, number]; // yaw, pitch, roll in degrees
  velocity: [number, number, number]; // m/s for doppler
  
  // Head model
  head_radius: number; // meters
  ear_distance: number; // meters
  hrtf_profile: string;
  
  // Tracking
  head_tracking_enabled: boolean;
  position_tracking_enabled: boolean;
  tracking_device?: string;
}

export interface SpatialRoom {
  dimensions: [number, number, number]; // width, height, depth in meters
  materials: RoomMaterial[];
  
  // Acoustic properties
  reverb_time: number; // seconds (RT60)
  early_reflections: EarlyReflection[];
  diffusion: number; // 0-1
  absorption: number; // 0-1
  
  // Simulation
  ray_tracing_enabled: boolean;
  reflection_order: number;
  diffraction_enabled: boolean;
  
  // Presets
  room_type: 'studio' | 'concert_hall' | 'church' | 'chamber' | 'outdoor' | 'custom';
  acoustic_treatment: AcousticTreatment[];
}

export interface RoomMaterial {
  surface: 'floor' | 'ceiling' | 'wall_front' | 'wall_back' | 'wall_left' | 'wall_right';
  material_type: string;
  absorption_coefficients: number[]; // by frequency band
  scattering_coefficients: number[]; // by frequency band
}

export interface EarlyReflection {
  delay: number; // milliseconds
  gain: number; // dB
  direction: [number, number, number]; // unit vector
  frequency_response: number[]; // by frequency band
}

export interface AcousticTreatment {
  type: 'absorber' | 'diffuser' | 'bass_trap' | 'reflector';
  position: [number, number, number];
  size: [number, number, number];
  effectiveness: number; // 0-1
  frequency_range: [number, number]; // Hz
}

export interface BinauralRenderer {
  hrtf_database: string;
  interpolation_method: 'nearest' | 'linear' | 'cubic';
  personalization_enabled: boolean;
  head_circumference?: number; // cm
  ear_canal_length?: number; // mm
  
  // Processing options
  crossfeed_enabled: boolean;
  crossfeed_amount: number; // 0-1
  room_simulation: boolean;
  externalization_enhancement: boolean;
  
  // Quality settings
  hrtf_resolution: number; // degrees
  processing_quality: 'draft' | 'good' | 'high' | 'ultra';
}

export interface AIAudioProcessor {
  id: string;
  name: string;
  type: AIProcessorType;
  model_version: string;
  
  // AI configuration
  model_path: string;
  input_features: string[];
  output_features: string[];
  processing_mode: 'real_time' | 'offline' | 'hybrid';
  
  // Performance
  inference_time: number; // milliseconds
  memory_usage: number; // bytes
  gpu_acceleration: boolean;
  batch_size: number;
  
  // Training data
  training_dataset: string;
  training_date: number;
  model_accuracy: number; // 0-1
  validation_score: number; // 0-1
  
  // Capabilities
  supported_sample_rates: number[];
  max_channels: number;
  max_duration: number; // seconds
  
  // Status
  is_loaded: boolean;
  is_processing: boolean;
  queue_size: number;
  
  // Settings
  confidence_threshold: number; // 0-1
  quality_vs_speed: number; // 0-1 (speed to quality)
  adaptive_processing: boolean;
}

export type AIProcessorType = 
  | 'source_separation' | 'noise_reduction' | 'enhancement' | 'mastering'
  | 'pitch_correction' | 'time_alignment' | 'restoration' | 'upmixing'
  | 'genre_classification' | 'mood_analysis' | 'instrument_recognition'
  | 'transcription' | 'beat_tracking' | 'key_detection';

export interface AISourceSeparation {
  processor_id: string;
  
  // Separation targets
  target_sources: SeparationTarget[];
  isolation_quality: number; // 0-1
  artifact_suppression: number; // 0-1
  
  // Results
  separated_tracks: SeparatedTrack[];
  separation_confidence: Record<string, number>;
  processing_time: number; // milliseconds
  
  // Configuration
  model_type: 'vocals_instrumental' | 'full_band' | 'custom';
  post_processing: boolean;
  real_time_mode: boolean;
}

export interface SeparationTarget {
  name: string;
  type: 'vocals' | 'drums' | 'bass' | 'guitar' | 'piano' | 'strings' | 'brass' | 'other';
  priority: number; // 1-10
  quality_preference: 'speed' | 'balanced' | 'quality';
}

export interface SeparatedTrack {
  source_name: string;
  audio_data: AudioBuffer;
  confidence: number; // 0-1
  artifacts_level: number; // 0-1
  isolation_quality: number; // 0-1
}

export interface AIEnhancement {
  processor_id: string;
  
  // Enhancement types
  enhancement_targets: EnhancementTarget[];
  
  // Processing settings
  enhancement_strength: number; // 0-1
  preserve_dynamics: boolean;
  frequency_selective: boolean;
  adaptive_processing: boolean;
  
  // Results
  enhanced_audio: AudioBuffer;
  enhancement_map: EnhancementMap;
  quality_improvement: number; // 0-1
  processing_artifacts: number; // 0-1
}

export interface EnhancementTarget {
  type: 'clarity' | 'warmth' | 'presence' | 'depth' | 'width' | 'punch' | 'air';
  strength: number; // 0-1
  frequency_range?: [number, number]; // Hz
  time_range?: [number, number]; // seconds
}

export interface EnhancementMap {
  time_bins: number[];
  frequency_bins: number[];
  enhancement_values: number[][]; // time x frequency
  confidence_map: number[][]; // time x frequency
}

export interface AIMastering {
  processor_id: string;
  
  // Mastering targets
  target_loudness: number; // LUFS
  target_dynamic_range: number; // dB
  target_genre: string;
  reference_track?: string;
  
  // Processing chain
  eq_adjustments: EQAdjustment[];
  compression_settings: CompressionSettings;
  limiting_settings: LimitingSettings;
  stereo_enhancement: StereoEnhancement;
  
  // Results
  mastered_audio: AudioBuffer;
  processing_report: MasteringReport;
  before_after_analysis: BeforeAfterAnalysis;
}

export interface EQAdjustment {
  frequency: number; // Hz
  gain: number; // dB
  q_factor: number;
  filter_type: 'bell' | 'high_shelf' | 'low_shelf' | 'high_pass' | 'low_pass';
  confidence: number; // 0-1
}

export interface CompressionSettings {
  threshold: number; // dB
  ratio: number;
  attack: number; // milliseconds
  release: number; // milliseconds
  knee: number; // dB
  makeup_gain: number; // dB
  adaptive: boolean;
}

export interface LimitingSettings {
  ceiling: number; // dB
  release: number; // milliseconds
  isr: number; // internal sample rate multiplier
  lookahead: number; // milliseconds
  character: 'transparent' | 'warm' | 'aggressive';
}

export interface StereoEnhancement {
  width: number; // 0-2 (0=mono, 1=normal, 2=wide)
  bass_mono: boolean;
  high_frequency_enhancement: number; // 0-1
  mid_side_processing: boolean;
}

export interface MasteringReport {
  loudness_before: number; // LUFS
  loudness_after: number; // LUFS
  dynamic_range_before: number; // dB
  dynamic_range_after: number; // dB
  peak_level: number; // dB
  true_peak_level: number; // dB
  
  // Frequency analysis
  frequency_balance: FrequencyBalance;
  spectral_changes: SpectralChange[];
  
  // Quality metrics
  distortion_level: number; // 0-1
  artifacts_level: number; // 0-1
  overall_quality: number; // 0-1
  
  // Recommendations
  suggested_adjustments: string[];
  genre_compliance: number; // 0-1
  streaming_readiness: StreamingReadiness;
}

export interface FrequencyBalance {
  sub_bass: number; // 20-60 Hz
  bass: number; // 60-250 Hz
  low_mids: number; // 250-500 Hz
  mids: number; // 500-2000 Hz
  high_mids: number; // 2000-4000 Hz
  presence: number; // 4000-6000 Hz
  brilliance: number; // 6000-20000 Hz
}

export interface SpectralChange {
  frequency: number; // Hz
  magnitude_change: number; // dB
  phase_change: number; // degrees
  confidence: number; // 0-1
}

export interface StreamingReadiness {
  spotify_ready: boolean;
  apple_music_ready: boolean;
  youtube_ready: boolean;
  tidal_ready: boolean;
  
  // Compliance details
  loudness_compliance: boolean;
  peak_compliance: boolean;
  dynamic_range_ok: boolean;
  
  // Recommendations
  platform_specific_adjustments: Record<string, string[]>;
}

export interface BeforeAfterAnalysis {
  waveform_comparison: WaveformComparison;
  spectrum_comparison: SpectrumComparison;
  feature_comparison: FeatureComparison;
  perceptual_difference: number; // 0-1
}

export interface WaveformComparison {
  peak_difference: number; // dB
  rms_difference: number; // dB
  dynamic_range_change: number; // dB
  correlation: number; // -1 to 1
}

export interface SpectrumComparison {
  frequency_response_change: number[]; // dB by frequency bin
  spectral_centroid_change: number; // Hz
  spectral_rolloff_change: number; // Hz
  harmonic_distortion_change: number; // percentage
}

export interface FeatureComparison {
  loudness_change: number; // LUFS
  punch_change: number; // 0-1
  warmth_change: number; // 0-1
  brightness_change: number; // 0-1
  width_change: number; // 0-1
  clarity_change: number; // 0-1
}

export interface AudioAnalysisSession {
  id: string;
  track_id: string;
  
  // Analysis configuration
  analysis_types: AnalysisType[];
  real_time: boolean;
  quality_level: 'fast' | 'balanced' | 'accurate' | 'research';
  
  // Progress
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number; // 0-1
  estimated_time_remaining: number; // seconds
  
  // Results
  results: AnalysisResult[];
  
  // Performance
  processing_time: number; // milliseconds
  cpu_usage_peak: number; // 0-1
  memory_usage_peak: number; // bytes
  
  // Metadata
  started_at: number;
  completed_at?: number;
  analysis_version: string;
}

export type AnalysisType = 
  | 'waveform' | 'spectrum' | 'features' | 'tempo' | 'key' | 'chords'
  | 'structure' | 'genre' | 'mood' | 'instruments' | 'vocals'
  | 'quality' | 'loudness' | 'dynamics' | 'spatial';

export interface AnalysisResult {
  type: AnalysisType;
  data: any;
  confidence: number; // 0-1
  processing_time: number; // milliseconds
  version: string;
}

export interface AudioProcessingPipeline {
  id: string;
  name: string;
  description: string;
  
  // Pipeline configuration
  stages: ProcessingStage[];
  parallel_processing: boolean;
  real_time_capable: boolean;
  
  // Input/output
  input_format: AudioFormat;
  output_format: AudioFormat;
  
  // Performance
  total_latency: number; // samples
  cpu_usage: number; // 0-1
  memory_usage: number; // bytes
  
  // Status
  is_active: boolean;
  is_processing: boolean;
  queue_size: number;
  
  // Statistics
  processed_files: number;
  total_processing_time: number; // milliseconds
  average_processing_speed: number; // realtime factor
  
  // Error handling
  error_recovery: boolean;
  retry_attempts: number;
  fallback_pipeline?: string;
}

export interface ProcessingStage {
  id: string;
  name: string;
  type: 'effect' | 'analysis' | 'ai_processor' | 'routing' | 'utility';
  
  // Configuration
  processor_id: string;
  parameters: Record<string, any>;
  is_enabled: boolean;
  is_bypassed: boolean;
  
  // Dependencies
  depends_on: string[]; // stage IDs
  parallel_with: string[]; // stage IDs
  
  // Performance
  processing_time: number; // milliseconds
  cpu_usage: number; // 0-1
  memory_usage: number; // bytes
  latency: number; // samples
  
  // Error handling
  error_tolerance: 'strict' | 'lenient' | 'ignore';
  fallback_processor?: string;
}

export interface AudioProcessingMetrics {
  // Performance metrics
  cpu_usage: number; // 0-1
  memory_usage: number; // bytes
  disk_io: number; // bytes per second
  network_io: number; // bytes per second
  
  // Processing metrics
  real_time_factor: number; // processing speed vs real time
  buffer_underruns: number;
  buffer_overruns: number;
  dropped_samples: number;
  
  // Latency metrics
  input_latency: number; // milliseconds
  processing_latency: number; // milliseconds
  output_latency: number; // milliseconds
  total_latency: number; // milliseconds
  
  // Quality metrics
  signal_to_noise_ratio: number; // dB
  total_harmonic_distortion: number; // percentage
  dynamic_range: number; // dB
  frequency_response_flatness: number; // dB
  
  // Throughput metrics
  samples_processed: number;
  files_processed: number;
  processing_time: number; // milliseconds
  queue_size: number;
  
  // Error metrics
  processing_errors: number;
  recovery_attempts: number;
  failed_operations: number;
  
  // Timestamp
  measured_at: number;
  measurement_duration: number; // milliseconds
}
