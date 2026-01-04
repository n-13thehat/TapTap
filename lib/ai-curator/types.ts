/**
 * AI Music Curator Types and Interfaces
 * Advanced ML-powered music recommendation and playlist generation system
 */

export interface UserMusicProfile {
  id: string;
  user_id: string;
  
  // Listening behavior
  total_listening_time: number; // seconds
  average_session_length: number; // seconds
  preferred_listening_times: TimeSlot[];
  skip_rate: number; // 0-1
  repeat_rate: number; // 0-1
  discovery_rate: number; // 0-1 (new vs familiar music)
  
  // Musical preferences
  genre_preferences: GenrePreference[];
  artist_preferences: ArtistPreference[];
  audio_features: AudioFeatureProfile;
  mood_preferences: MoodPreference[];
  
  // Behavioral patterns
  listening_contexts: ListeningContext[];
  seasonal_patterns: SeasonalPattern[];
  social_listening_patterns: SocialPattern[];
  
  // ML model data
  embedding_vector: number[]; // User embedding from collaborative filtering
  preference_clusters: string[]; // Cluster assignments
  similarity_scores: UserSimilarity[];
  
  // Metadata
  created_at: number;
  updated_at: number;
  last_analysis: number;
  confidence_score: number; // 0-100
}

export interface GenrePreference {
  genre: string;
  affinity_score: number; // 0-100
  listening_frequency: number; // times per week
  time_spent: number; // total seconds
  discovery_openness: number; // 0-1
  context_associations: string[]; // workout, study, etc.
}

export interface ArtistPreference {
  artist_id: string;
  artist_name: string;
  affinity_score: number; // 0-100
  play_count: number;
  skip_rate: number; // 0-1
  favorite_tracks: string[];
  similar_artists: string[];
  discovery_date: number;
}

export interface AudioFeatureProfile {
  // Spotify-style audio features
  acousticness: FeatureRange;
  danceability: FeatureRange;
  energy: FeatureRange;
  instrumentalness: FeatureRange;
  liveness: FeatureRange;
  loudness: FeatureRange;
  speechiness: FeatureRange;
  valence: FeatureRange; // musical positivity
  
  // Temporal features
  tempo: FeatureRange; // BPM
  time_signature: number[];
  key: string[];
  mode: ('major' | 'minor')[];
  
  // Advanced features
  complexity_preference: number; // 0-1
  novelty_preference: number; // 0-1
  familiarity_preference: number; // 0-1
}

export interface FeatureRange {
  min: number;
  max: number;
  preferred: number;
  tolerance: number;
}

export interface MoodPreference {
  mood: string;
  affinity_score: number; // 0-100
  associated_genres: string[];
  typical_contexts: string[];
  time_associations: TimeSlot[];
  audio_characteristics: Partial<AudioFeatureProfile>;
}

export interface TimeSlot {
  start_hour: number; // 0-23
  end_hour: number; // 0-23
  days: number[]; // 0-6, Sunday = 0
  weight: number; // 0-1
}

export interface ListeningContext {
  context: string; // workout, study, commute, party, etc.
  frequency: number; // 0-1
  preferred_genres: string[];
  preferred_features: Partial<AudioFeatureProfile>;
  typical_duration: number; // seconds
  social_setting: 'solo' | 'small_group' | 'large_group';
}

export interface SeasonalPattern {
  season: 'spring' | 'summer' | 'fall' | 'winter';
  genre_shifts: GenreShift[];
  mood_shifts: MoodShift[];
  activity_changes: string[];
}

export interface GenreShift {
  genre: string;
  change_factor: number; // multiplier for normal preference
  reason: string;
}

export interface MoodShift {
  mood: string;
  change_factor: number;
  reason: string;
}

export interface SocialPattern {
  social_context: 'solo' | 'friends' | 'family' | 'romantic' | 'party';
  music_preferences: Partial<UserMusicProfile>;
  influence_factor: number; // how much others influence choices
  leadership_factor: number; // how much user influences others
}

export interface UserSimilarity {
  user_id: string;
  similarity_score: number; // 0-1
  shared_preferences: string[];
  complementary_preferences: string[];
  calculated_at: number;
}

export interface AIPlaylist {
  id: string;
  name: string;
  description: string;
  user_id: string;
  
  // Generation parameters
  generation_algorithm: 'collaborative' | 'content_based' | 'hybrid' | 'deep_learning';
  seed_tracks: string[];
  target_features: Partial<AudioFeatureProfile>;
  target_mood: string;
  target_context: string;
  target_duration: number; // seconds
  
  // Tracks and metadata
  tracks: PlaylistTrack[];
  total_duration: number;
  genre_distribution: GenreDistribution[];
  mood_progression: MoodProgression[];
  energy_curve: EnergyCurve[];
  
  // Performance metrics
  user_rating: number; // 1-5
  completion_rate: number; // 0-1
  skip_rate: number; // 0-1
  save_rate: number; // 0-1
  share_rate: number; // 0-1
  
  // ML metrics
  confidence_score: number; // 0-100
  diversity_score: number; // 0-100
  novelty_score: number; // 0-100
  coherence_score: number; // 0-100
  
  // Metadata
  created_at: number;
  last_played: number;
  play_count: number;
  is_public: boolean;
  tags: string[];
}

export interface PlaylistTrack {
  track_id: string;
  position: number;
  confidence_score: number; // 0-100
  reasoning: string[];
  audio_features: AudioFeatures;
  predicted_user_rating: number; // 1-5
  novelty_factor: number; // 0-1
  transition_score: number; // how well it flows from previous track
}

export interface AudioFeatures {
  acousticness: number;
  danceability: number;
  energy: number;
  instrumentalness: number;
  liveness: number;
  loudness: number;
  speechiness: number;
  valence: number;
  tempo: number;
  time_signature: number;
  key: number;
  mode: number;
  duration_ms: number;
}

export interface GenreDistribution {
  genre: string;
  percentage: number;
  track_count: number;
}

export interface MoodProgression {
  position: number; // 0-1 (start to end of playlist)
  mood: string;
  intensity: number; // 0-1
}

export interface EnergyCurve {
  position: number; // 0-1
  energy_level: number; // 0-1
  tempo: number;
  valence: number;
}

export interface RecommendationEngine {
  id: string;
  name: string;
  type: 'collaborative_filtering' | 'content_based' | 'matrix_factorization' | 'deep_neural' | 'ensemble';
  
  // Model parameters
  model_config: ModelConfig;
  training_data: TrainingDataset;
  performance_metrics: ModelMetrics;
  
  // Recommendation settings
  diversity_weight: number; // 0-1
  novelty_weight: number; // 0-1
  popularity_weight: number; // 0-1
  serendipity_factor: number; // 0-1
  
  // Status
  is_active: boolean;
  last_trained: number;
  next_training: number;
  version: string;
}

export interface ModelConfig {
  // Collaborative filtering
  num_factors?: number;
  regularization?: number;
  learning_rate?: number;
  iterations?: number;
  
  // Content-based
  feature_weights?: Record<string, number>;
  similarity_threshold?: number;
  
  // Deep learning
  hidden_layers?: number[];
  dropout_rate?: number;
  batch_size?: number;
  epochs?: number;
  
  // Ensemble
  model_weights?: Record<string, number>;
  voting_strategy?: 'weighted' | 'majority' | 'rank_fusion';
}

export interface TrainingDataset {
  user_interactions: UserInteraction[];
  track_features: TrackFeatures[];
  implicit_feedback: ImplicitFeedback[];
  contextual_data: ContextualData[];
  
  // Dataset statistics
  total_users: number;
  total_tracks: number;
  total_interactions: number;
  sparsity_ratio: number;
  
  // Data quality
  data_quality_score: number; // 0-100
  last_updated: number;
}

export interface UserInteraction {
  user_id: string;
  track_id: string;
  interaction_type: 'play' | 'skip' | 'like' | 'save' | 'share' | 'repeat';
  rating: number; // explicit or implicit rating
  context: string;
  timestamp: number;
  session_id: string;
  duration_played: number; // seconds
}

export interface TrackFeatures {
  track_id: string;
  audio_features: AudioFeatures;
  metadata: TrackMetadata;
  genre_tags: string[];
  mood_tags: string[];
  lyrical_features?: LyricalFeatures;
  popularity_score: number;
  release_date: number;
}

export interface TrackMetadata {
  title: string;
  artist: string;
  album: string;
  year: number;
  duration_ms: number;
  explicit: boolean;
  language: string;
}

export interface LyricalFeatures {
  sentiment_score: number; // -1 to 1
  emotion_scores: Record<string, number>;
  topic_distribution: Record<string, number>;
  complexity_score: number; // 0-1
  explicit_content: boolean;
  language: string;
}

export interface ImplicitFeedback {
  user_id: string;
  track_id: string;
  play_count: number;
  total_play_time: number;
  skip_count: number;
  completion_rate: number; // 0-1
  last_played: number;
  context_plays: Record<string, number>;
}

export interface ContextualData {
  user_id: string;
  timestamp: number;
  context: string;
  location?: string;
  weather?: string;
  time_of_day: string;
  day_of_week: number;
  social_context: string;
  device_type: string;
}

export interface ModelMetrics {
  // Accuracy metrics
  precision: number;
  recall: number;
  f1_score: number;
  auc_roc: number;
  
  // Ranking metrics
  ndcg: number; // Normalized Discounted Cumulative Gain
  map: number; // Mean Average Precision
  mrr: number; // Mean Reciprocal Rank
  
  // Diversity metrics
  intra_list_diversity: number;
  catalog_coverage: number;
  novelty: number;
  serendipity: number;
  
  // Business metrics
  user_satisfaction: number;
  engagement_lift: number;
  discovery_rate: number;
  retention_impact: number;
  
  // Evaluation metadata
  test_set_size: number;
  evaluation_date: number;
  cross_validation_folds: number;
}

export interface CurationSession {
  id: string;
  user_id: string;
  session_type: 'auto_playlist' | 'mood_based' | 'context_based' | 'discovery' | 'similar_artists';
  
  // Input parameters
  input_parameters: CurationInput;
  
  // Generation process
  algorithm_used: string;
  processing_steps: ProcessingStep[];
  candidate_tracks: CandidateTrack[];
  final_selection: string[];
  
  // Results
  generated_playlist: AIPlaylist;
  user_feedback: UserFeedback;
  
  // Performance
  generation_time: number; // milliseconds
  confidence_score: number;
  
  // Metadata
  created_at: number;
  completed_at: number;
}

export interface CurationInput {
  seed_tracks?: string[];
  seed_artists?: string[];
  seed_genres?: string[];
  target_mood?: string;
  target_context?: string;
  target_duration?: number;
  target_features?: Partial<AudioFeatureProfile>;
  diversity_preference?: number; // 0-1
  novelty_preference?: number; // 0-1
  explicit_content?: boolean;
  language_preference?: string[];
}

export interface ProcessingStep {
  step_name: string;
  algorithm: string;
  input_size: number;
  output_size: number;
  processing_time: number;
  confidence_score: number;
  parameters: Record<string, any>;
}

export interface CandidateTrack {
  track_id: string;
  score: number;
  reasoning: string[];
  feature_matches: Record<string, number>;
  similarity_sources: string[];
  novelty_factor: number;
  diversity_contribution: number;
}

export interface UserFeedback {
  overall_rating: number; // 1-5
  track_ratings: Record<string, number>;
  feedback_comments: string;
  improvement_suggestions: string[];
  would_recommend: boolean;
  feedback_timestamp: number;
}

export interface SmartRadio {
  id: string;
  name: string;
  user_id: string;
  
  // Radio configuration
  seed_type: 'track' | 'artist' | 'genre' | 'mood' | 'user_taste';
  seed_values: string[];
  exploration_factor: number; // 0-1 (familiar vs discovery)
  tempo_variance: number; // 0-1
  genre_variance: number; // 0-1
  
  // Adaptive behavior
  learning_enabled: boolean;
  feedback_weight: number; // how much user feedback affects future selections
  context_awareness: boolean;
  social_influence: boolean;
  
  // Current state
  current_track_index: number;
  played_tracks: string[];
  upcoming_tracks: string[];
  user_feedback_history: RadioFeedback[];
  
  // Performance
  average_rating: number;
  skip_rate: number;
  session_length: number;
  
  // Metadata
  created_at: number;
  last_played: number;
  total_plays: number;
  is_active: boolean;
}

export interface RadioFeedback {
  track_id: string;
  feedback_type: 'thumbs_up' | 'thumbs_down' | 'skip' | 'save' | 'share';
  timestamp: number;
  context: string;
}

export interface CuratorInsights {
  user_id: string;
  period: 'week' | 'month' | 'quarter' | 'year';
  
  // Listening insights
  total_listening_time: number;
  genre_breakdown: GenreDistribution[];
  mood_patterns: MoodPattern[];
  discovery_stats: DiscoveryStats;
  
  // Preference evolution
  taste_evolution: TasteEvolution[];
  new_discoveries: Discovery[];
  forgotten_favorites: string[];
  
  // Social insights
  similarity_to_friends: UserSimilarity[];
  influence_network: InfluenceNetwork;
  shared_discoveries: SharedDiscovery[];
  
  // Recommendations performance
  recommendation_accuracy: number;
  playlist_satisfaction: number;
  discovery_success_rate: number;
  
  // Generated insights
  insights: GeneratedInsight[];
  
  // Metadata
  generated_at: number;
  data_period: [number, number]; // start and end timestamps
}

export interface MoodPattern {
  mood: string;
  frequency: number;
  time_patterns: TimeSlot[];
  context_associations: string[];
  seasonal_variation: number;
}

export interface DiscoveryStats {
  new_artists_discovered: number;
  new_genres_explored: number;
  discovery_rate: number; // new vs familiar content ratio
  successful_discoveries: number; // liked new content
  discovery_sources: Record<string, number>; // playlist, radio, recommendations, etc.
}

export interface TasteEvolution {
  feature: string; // genre, mood, audio feature, etc.
  previous_value: number;
  current_value: number;
  change_rate: number;
  trend_direction: 'increasing' | 'decreasing' | 'stable';
  confidence: number;
}

export interface Discovery {
  track_id: string;
  artist_id: string;
  discovery_date: number;
  discovery_source: string;
  initial_rating: number;
  current_rating: number;
  play_count: number;
  shared_count: number;
}

export interface InfluenceNetwork {
  influencers: UserInfluence[]; // users who influence this user
  influenced: UserInfluence[]; // users influenced by this user
  mutual_influences: UserInfluence[]; // bidirectional influence
}

export interface UserInfluence {
  user_id: string;
  influence_strength: number; // 0-1
  shared_discoveries: number;
  taste_similarity: number;
  interaction_frequency: number;
}

export interface SharedDiscovery {
  track_id: string;
  shared_with: string[];
  discovery_date: number;
  adoption_rate: number; // how many adopted it
  viral_coefficient: number; // how much it spread
}

export interface GeneratedInsight {
  type: 'taste_change' | 'new_discovery' | 'seasonal_pattern' | 'social_influence' | 'recommendation_success';
  title: string;
  description: string;
  confidence: number; // 0-100
  actionable_suggestions: string[];
  supporting_data: Record<string, any>;
  generated_at: number;
}
