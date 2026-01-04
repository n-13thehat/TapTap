/**
 * AI Music Curator
 * Advanced ML-powered music recommendation and playlist generation system
 */

import { 
  UserMusicProfile, 
  AIPlaylist, 
  RecommendationEngine,
  CurationSession,
  SmartRadio,
  CuratorInsights,
  UserInteraction,
  TrackFeatures,
  AudioFeatures,
  CurationInput,
  PlaylistTrack,
  ModelMetrics
} from './types';
import { eventBus, EventTypes } from '../eventBus';

export class AIMusicCurator {
  private userProfiles: Map<string, UserMusicProfile> = new Map();
  private playlists: Map<string, AIPlaylist> = new Map();
  private engines: Map<string, RecommendationEngine> = new Map();
  private sessions: Map<string, CurationSession> = new Map();
  private radios: Map<string, SmartRadio> = new Map();
  private insights: Map<string, CuratorInsights> = new Map();
  
  private trackFeatures: Map<string, TrackFeatures> = new Map();
  private userInteractions: Map<string, UserInteraction[]> = new Map();
  
  private learningTimer: NodeJS.Timeout | null = null;
  private insightsTimer: NodeJS.Timeout | null = null;
  
  private userId?: string;
  private isInitialized = false;

  constructor(userId?: string) {
    this.userId = userId;
    this.initializeRecommendationEngines();
    this.initializeMockData();
    this.startLearningProcess();
    this.loadFromStorage();
    this.isInitialized = true;
  }

  /**
   * Analyze user listening behavior and build music profile
   */
  async analyzeUserBehavior(userId: string, interactions: UserInteraction[]): Promise<UserMusicProfile> {
    const existingProfile = this.userProfiles.get(userId);
    
    // Calculate listening statistics
    const totalListeningTime = interactions.reduce((sum, i) => sum + (i.duration_played || 0), 0);
    const totalSessions = new Set(interactions.map(i => i.session_id)).size;
    const averageSessionLength = totalSessions > 0 ? totalListeningTime / totalSessions : 0;
    
    // Calculate skip and repeat rates
    const playInteractions = interactions.filter(i => i.interaction_type === 'play');
    const skipInteractions = interactions.filter(i => i.interaction_type === 'skip');
    const repeatInteractions = interactions.filter(i => i.interaction_type === 'repeat');
    
    const skipRate = playInteractions.length > 0 ? skipInteractions.length / playInteractions.length : 0;
    const repeatRate = playInteractions.length > 0 ? repeatInteractions.length / playInteractions.length : 0;
    
    // Analyze genre preferences
    const genrePreferences = await this.analyzeGenrePreferences(interactions);
    
    // Analyze audio feature preferences
    const audioFeatures = await this.analyzeAudioFeaturePreferences(interactions);
    
    // Calculate user embedding using collaborative filtering
    const embeddingVector = await this.calculateUserEmbedding(userId, interactions);
    
    // Find similar users
    const similarityScores = await this.findSimilarUsers(userId, embeddingVector);
    
    const profile: UserMusicProfile = {
      id: this.generateId(),
      user_id: userId,
      total_listening_time: totalListeningTime,
      average_session_length: averageSessionLength,
      preferred_listening_times: await this.analyzeListeningTimes(interactions),
      skip_rate: skipRate,
      repeat_rate: repeatRate,
      discovery_rate: await this.calculateDiscoveryRate(interactions),
      genre_preferences: genrePreferences,
      artist_preferences: await this.analyzeArtistPreferences(interactions),
      audio_features: audioFeatures,
      mood_preferences: await this.analyzeMoodPreferences(interactions),
      listening_contexts: await this.analyzeListeningContexts(interactions),
      seasonal_patterns: [],
      social_listening_patterns: [],
      embedding_vector: embeddingVector,
      preference_clusters: await this.assignPreferenceClusters(embeddingVector),
      similarity_scores: similarityScores,
      created_at: existingProfile?.created_at || Date.now(),
      updated_at: Date.now(),
      last_analysis: Date.now(),
      confidence_score: this.calculateProfileConfidence(interactions.length, totalListeningTime),
    };

    this.userProfiles.set(userId, profile);
    this.persistToStorage();

    console.log(`User music profile updated: ${genrePreferences.length} genres, ${profile.confidence_score}% confidence`);
    return profile;
  }

  /**
   * Generate AI-powered playlist
   */
  async generatePlaylist(userId: string, input: CurationInput): Promise<AIPlaylist> {
    const userProfile = this.userProfiles.get(userId);
    if (!userProfile) {
      throw new Error('User profile not found. Please analyze user behavior first.');
    }

    const sessionId = this.generateId();
    const session: CurationSession = {
      id: sessionId,
      user_id: userId,
      session_type: this.determineSessionType(input),
      input_parameters: input,
      algorithm_used: 'hybrid',
      processing_steps: [],
      candidate_tracks: [],
      final_selection: [],
      generated_playlist: {} as AIPlaylist,
      user_feedback: {} as any,
      generation_time: 0,
      confidence_score: 0,
      created_at: Date.now(),
      completed_at: 0,
    };

    const startTime = Date.now();

    try {
      // Step 1: Generate candidate tracks using multiple algorithms
      const candidateTracks = await this.generateCandidateTracks(userProfile, input);
      session.candidate_tracks = candidateTracks;
      session.processing_steps.push({
        step_name: 'candidate_generation',
        algorithm: 'hybrid',
        input_size: 0,
        output_size: candidateTracks.length,
        processing_time: Date.now() - startTime,
        confidence_score: 85,
        parameters: input,
      });

      // Step 2: Score and rank tracks
      const rankedTracks = await this.scoreAndRankTracks(candidateTracks, userProfile, input);
      session.processing_steps.push({
        step_name: 'scoring_ranking',
        algorithm: 'ensemble',
        input_size: candidateTracks.length,
        output_size: rankedTracks.length,
        processing_time: Date.now() - startTime,
        confidence_score: 90,
        parameters: { diversity_weight: 0.3, novelty_weight: 0.2 },
      });

      // Step 3: Select final tracks with diversity optimization
      const finalTracks = await this.selectFinalTracks(rankedTracks, input);
      session.final_selection = finalTracks.map(t => t.track_id);
      session.processing_steps.push({
        step_name: 'final_selection',
        algorithm: 'diversity_optimization',
        input_size: rankedTracks.length,
        output_size: finalTracks.length,
        processing_time: Date.now() - startTime,
        confidence_score: 88,
        parameters: { target_duration: input.target_duration },
      });

      // Step 4: Create playlist object
      const playlist = await this.createPlaylistObject(userId, input, finalTracks, session);
      session.generated_playlist = playlist;
      session.generation_time = Date.now() - startTime;
      session.completed_at = Date.now();
      session.confidence_score = playlist.confidence_score;

      this.sessions.set(sessionId, session);
      this.playlists.set(playlist.id, playlist);
      this.persistToStorage();

      // Emit playlist generation event
      eventBus.emit(EventTypes.PLAYLIST_CREATED, {
        playlistId: playlist.id,
        userId,
        algorithm: session.algorithm_used,
        trackCount: finalTracks.length,
        confidenceScore: playlist.confidence_score,
      }, {
        userId,
        source: 'ai-music-curator',
      });

      console.log(`AI playlist generated: ${playlist.name} with ${finalTracks.length} tracks (${session.confidence_score}% confidence)`);
      return playlist;

    } catch (error) {
      console.error('Playlist generation failed:', error);
      throw error;
    }
  }

  /**
   * Create smart radio station
   */
  async createSmartRadio(userId: string, config: {
    name: string;
    seed_type: 'track' | 'artist' | 'genre' | 'mood' | 'user_taste';
    seed_values: string[];
    exploration_factor?: number;
  }): Promise<SmartRadio> {
    const userProfile = this.userProfiles.get(userId);
    if (!userProfile) {
      throw new Error('User profile not found');
    }

    const radio: SmartRadio = {
      id: this.generateId(),
      name: config.name,
      user_id: userId,
      seed_type: config.seed_type,
      seed_values: config.seed_values,
      exploration_factor: config.exploration_factor || 0.3,
      tempo_variance: 0.2,
      genre_variance: 0.3,
      learning_enabled: true,
      feedback_weight: 0.7,
      context_awareness: true,
      social_influence: false,
      current_track_index: 0,
      played_tracks: [],
      upcoming_tracks: await this.generateRadioQueue(userProfile, config),
      user_feedback_history: [],
      average_rating: 0,
      skip_rate: 0,
      session_length: 0,
      created_at: Date.now(),
      last_played: 0,
      total_plays: 0,
      is_active: true,
    };

    this.radios.set(radio.id, radio);
    this.persistToStorage();

    console.log(`Smart radio created: ${radio.name} with ${radio.upcoming_tracks.length} queued tracks`);
    return radio;
  }

  /**
   * Get next track from smart radio
   */
  async getNextRadioTrack(radioId: string, feedback?: { track_id: string; feedback_type: string }): Promise<string | null> {
    const radio = this.radios.get(radioId);
    if (!radio || !radio.is_active) return null;

    // Process feedback if provided
    if (feedback) {
      radio.user_feedback_history.push({
        track_id: feedback.track_id,
        feedback_type: feedback.feedback_type as any,
        timestamp: Date.now(),
        context: 'radio_playback',
      });

      // Update radio parameters based on feedback
      if (radio.learning_enabled) {
        await this.updateRadioFromFeedback(radio, feedback);
      }
    }

    // Get next track
    if (radio.upcoming_tracks.length === 0) {
      // Generate more tracks
      const userProfile = this.userProfiles.get(radio.user_id);
      if (userProfile) {
        const newTracks = await this.generateRadioQueue(userProfile, {
          seed_type: radio.seed_type,
          seed_values: radio.seed_values,
          exploration_factor: radio.exploration_factor,
        });
        radio.upcoming_tracks = newTracks;
      }
    }

    if (radio.upcoming_tracks.length === 0) return null;

    const nextTrack = radio.upcoming_tracks.shift()!;
    radio.played_tracks.push(nextTrack);
    radio.current_track_index++;
    radio.last_played = Date.now();
    radio.total_plays++;

    // Keep only last 50 played tracks
    if (radio.played_tracks.length > 50) {
      radio.played_tracks = radio.played_tracks.slice(-50);
    }

    this.persistToStorage();
    return nextTrack;
  }

  /**
   * Generate curator insights
   */
  async generateInsights(userId: string, period: 'week' | 'month' | 'quarter' | 'year'): Promise<CuratorInsights> {
    const userProfile = this.userProfiles.get(userId);
    const userInteractions = this.userInteractions.get(userId) || [];
    
    if (!userProfile) {
      throw new Error('User profile not found');
    }

    const periodMs = this.getPeriodMilliseconds(period);
    const periodStart = Date.now() - periodMs;
    const periodInteractions = userInteractions.filter(i => i.timestamp >= periodStart);

    const insights: CuratorInsights = {
      user_id: userId,
      period,
      total_listening_time: periodInteractions.reduce((sum, i) => sum + (i.duration_played || 0), 0),
      genre_breakdown: await this.calculateGenreBreakdown(periodInteractions),
      mood_patterns: await this.analyzeMoodPatterns(periodInteractions),
      discovery_stats: await this.calculateDiscoveryStats(periodInteractions),
      taste_evolution: await this.analyzeTasteEvolution(userId, period),
      new_discoveries: await this.findNewDiscoveries(periodInteractions),
      forgotten_favorites: await this.findForgottenFavorites(userId, periodInteractions),
      similarity_to_friends: userProfile.similarity_scores.slice(0, 5),
      influence_network: await this.analyzeInfluenceNetwork(userId),
      shared_discoveries: await this.findSharedDiscoveries(userId, periodInteractions),
      recommendation_accuracy: await this.calculateRecommendationAccuracy(userId, period),
      playlist_satisfaction: await this.calculatePlaylistSatisfaction(userId, period),
      discovery_success_rate: await this.calculateDiscoverySuccessRate(periodInteractions),
      insights: await this.generateTextualInsights(userId, periodInteractions),
      generated_at: Date.now(),
      data_period: [periodStart, Date.now()],
    };

    this.insights.set(`${userId}_${period}`, insights);
    this.persistToStorage();

    console.log(`Curator insights generated for ${period}: ${insights.insights.length} insights`);
    return insights;
  }

  /**
   * Get user's music profile
   */
  getUserProfile(userId: string): UserMusicProfile | null {
    return this.userProfiles.get(userId) || null;
  }

  /**
   * Get user's playlists
   */
  getUserPlaylists(userId: string): AIPlaylist[] {
    return Array.from(this.playlists.values()).filter(p => p.user_id === userId);
  }

  /**
   * Get user's smart radios
   */
  getUserRadios(userId: string): SmartRadio[] {
    return Array.from(this.radios.values()).filter(r => r.user_id === userId);
  }

  /**
   * Rate playlist
   */
  async ratePlaylist(playlistId: string, rating: number, feedback?: string): Promise<void> {
    const playlist = this.playlists.get(playlistId);
    if (!playlist) {
      throw new Error('Playlist not found');
    }

    playlist.user_rating = rating;
    
    // Update session feedback if exists
    const session = Array.from(this.sessions.values()).find(s => s.generated_playlist.id === playlistId);
    if (session) {
      session.user_feedback = {
        overall_rating: rating,
        track_ratings: {},
        feedback_comments: feedback || '',
        improvement_suggestions: [],
        would_recommend: rating >= 4,
        feedback_timestamp: Date.now(),
      };
    }

    // Use feedback to improve future recommendations
    await this.incorporateFeedback(playlist.user_id, playlistId, rating, feedback);

    this.persistToStorage();
    console.log(`Playlist rated: ${rating}/5 stars`);
  }

  // Private methods
  private async generateCandidateTracks(profile: UserMusicProfile, input: CurationInput): Promise<any[]> {
    const candidates = [];
    
    // Content-based recommendations
    if (input.seed_tracks?.length) {
      const contentBased = await this.getContentBasedRecommendations(input.seed_tracks, profile);
      candidates.push(...contentBased);
    }
    
    // Collaborative filtering recommendations
    const collaborative = await this.getCollaborativeRecommendations(profile);
    candidates.push(...collaborative);
    
    // Genre-based recommendations
    if (input.seed_genres?.length) {
      const genreBased = await this.getGenreBasedRecommendations(input.seed_genres, profile);
      candidates.push(...genreBased);
    }
    
    // Mood-based recommendations
    if (input.target_mood) {
      const moodBased = await this.getMoodBasedRecommendations(input.target_mood, profile);
      candidates.push(...moodBased);
    }

    // Remove duplicates and return
    const uniqueCandidates = candidates.filter((track, index, self) => 
      index === self.findIndex(t => t.track_id === track.track_id)
    );

    return uniqueCandidates.slice(0, 200); // Limit candidates
  }

  private async getContentBasedRecommendations(seedTracks: string[], profile: UserMusicProfile): Promise<any[]> {
    // Mock content-based recommendations
    const recommendations = [];
    
    for (const trackId of seedTracks) {
      const trackFeatures = this.trackFeatures.get(trackId);
      if (trackFeatures) {
        // Find similar tracks based on audio features
        const similarTracks = await this.findSimilarTracks(trackFeatures, profile);
        recommendations.push(...similarTracks);
      }
    }
    
    return recommendations;
  }

  private async getCollaborativeRecommendations(profile: UserMusicProfile): Promise<any[]> {
    // Mock collaborative filtering recommendations
    const recommendations = [];
    
    // Use similar users' preferences
    for (const similarity of profile.similarity_scores.slice(0, 10)) {
      const similarUserProfile = this.userProfiles.get(similarity.user_id);
      if (similarUserProfile) {
        // Get top tracks from similar user
        const topGenres = similarUserProfile.genre_preferences
          .sort((a, b) => b.affinity_score - a.affinity_score)
          .slice(0, 3);
        
        for (const genre of topGenres) {
          const genreTracks = await this.getTracksForGenre(genre.genre);
          recommendations.push(...genreTracks.slice(0, 5));
        }
      }
    }
    
    return recommendations;
  }

  private async getGenreBasedRecommendations(genres: string[], profile: UserMusicProfile): Promise<any[]> {
    const recommendations = [];
    
    for (const genre of genres) {
      const tracks = await this.getTracksForGenre(genre);
      // Filter by user's audio feature preferences
      const filteredTracks = tracks.filter(track => 
        this.matchesAudioFeaturePreferences(track, profile.audio_features)
      );
      recommendations.push(...filteredTracks.slice(0, 10));
    }
    
    return recommendations;
  }

  private async getMoodBasedRecommendations(mood: string, profile: UserMusicProfile): Promise<any[]> {
    // Mock mood-based recommendations
    const moodPreference = profile.mood_preferences.find(m => m.mood === mood);
    if (!moodPreference) return [];
    
    const recommendations = [];
    
    // Get tracks that match the mood's audio characteristics
    for (const genre of moodPreference.associated_genres) {
      const tracks = await this.getTracksForGenre(genre);
      const moodTracks = tracks.filter(track => 
        this.matchesMoodCharacteristics(track, moodPreference)
      );
      recommendations.push(...moodTracks.slice(0, 8));
    }
    
    return recommendations;
  }

  private async scoreAndRankTracks(candidates: any[], profile: UserMusicProfile, input: CurationInput): Promise<any[]> {
    // Score each candidate track
    const scoredTracks = candidates.map(candidate => {
      let score = 0;
      
      // Base preference score
      score += this.calculatePreferenceScore(candidate, profile) * 0.4;
      
      // Audio feature match score
      score += this.calculateFeatureMatchScore(candidate, profile.audio_features) * 0.3;
      
      // Novelty score
      score += this.calculateTrackNoveltyScore(candidate, profile) * 0.2;
      
      // Context relevance score
      if (input.target_context) {
        score += this.calculateContextScore(candidate, input.target_context, profile) * 0.1;
      }
      
      return {
        ...candidate,
        score: Math.min(100, Math.max(0, score)),
      };
    });
    
    // Sort by score
    return scoredTracks.sort((a, b) => b.score - a.score);
  }

  private async selectFinalTracks(rankedTracks: any[], input: CurationInput): Promise<PlaylistTrack[]> {
    const finalTracks: PlaylistTrack[] = [];
    const targetDuration = input.target_duration || 3600; // 1 hour default
    const targetCount = Math.floor(targetDuration / 210); // ~3.5 min average track length
    
    let currentDuration = 0;
    let position = 0;
    
    // Diversity optimization: avoid too many tracks from same artist/genre
    const artistCounts: Record<string, number> = {};
    const genreCounts: Record<string, number> = {};
    
    for (const track of rankedTracks) {
      if (finalTracks.length >= targetCount || currentDuration >= targetDuration) {
        break;
      }
      
      // Check diversity constraints
      const artistId = track.artist_id || 'unknown';
      const genre = track.genre || 'unknown';
      
      if ((artistCounts[artistId] || 0) >= 3) continue; // Max 3 tracks per artist
      if ((genreCounts[genre] || 0) >= Math.ceil(targetCount * 0.4)) continue; // Max 40% from one genre
      
      const trackFeatures = this.trackFeatures.get(track.track_id);
      const duration = trackFeatures?.audio_features?.duration_ms || 210000;
      
      if (currentDuration + duration <= targetDuration * 1.1) { // 10% tolerance
        finalTracks.push({
          track_id: track.track_id,
          position: position++,
          confidence_score: track.score,
          reasoning: track.reasoning || [`Score: ${track.score.toFixed(1)}`],
          audio_features: trackFeatures?.audio_features || {} as AudioFeatures,
          predicted_user_rating: this.predictUserRating(track, track.score),
          novelty_factor: track.novelty_factor || 0.5,
          transition_score: this.calculateTransitionScore(finalTracks, track),
        });
        
        currentDuration += duration;
        artistCounts[artistId] = (artistCounts[artistId] || 0) + 1;
        genreCounts[genre] = (genreCounts[genre] || 0) + 1;
      }
    }
    
    return finalTracks;
  }

  private async createPlaylistObject(userId: string, input: CurationInput, tracks: PlaylistTrack[], session: CurationSession): Promise<AIPlaylist> {
    const totalDuration = tracks.reduce((sum, t) => sum + (t.audio_features.duration_ms || 0), 0);
    
    const playlist: AIPlaylist = {
      id: this.generateId(),
      name: this.generatePlaylistName(input),
      description: this.generatePlaylistDescription(input, tracks),
      user_id: userId,
      generation_algorithm: 'hybrid',
      seed_tracks: input.seed_tracks || [],
      target_features: input.target_features || {},
      target_mood: input.target_mood || '',
      target_context: input.target_context || '',
      target_duration: input.target_duration || 0,
      tracks,
      total_duration: totalDuration,
      genre_distribution: this.calculateGenreDistribution(tracks),
      mood_progression: this.calculateMoodProgression(tracks),
      energy_curve: this.calculateEnergyCurve(tracks),
      user_rating: 0,
      completion_rate: 0,
      skip_rate: 0,
      save_rate: 0,
      share_rate: 0,
      confidence_score: session.confidence_score,
      diversity_score: this.calculateDiversityScore(tracks),
      novelty_score: this.calculatePlaylistNoveltyScore(tracks),
      coherence_score: this.calculateCoherenceScore(tracks),
      created_at: Date.now(),
      last_played: 0,
      play_count: 0,
      is_public: false,
      tags: this.generatePlaylistTags(input, tracks),
    };
    
    return playlist;
  }

  private async analyzeGenrePreferences(interactions: UserInteraction[]): Promise<any[]> {
    const genreStats: Record<string, { plays: number, time: number, skips: number }> = {};
    
    for (const interaction of interactions) {
      const trackFeatures = this.trackFeatures.get(interaction.track_id);
      if (trackFeatures && trackFeatures.genre_tags.length > 0) {
        const genre = trackFeatures.genre_tags[0]; // Primary genre
        
        if (!genreStats[genre]) {
          genreStats[genre] = { plays: 0, time: 0, skips: 0 };
        }
        
        if (interaction.interaction_type === 'play') {
          genreStats[genre].plays++;
          genreStats[genre].time += interaction.duration_played || 0;
        } else if (interaction.interaction_type === 'skip') {
          genreStats[genre].skips++;
        }
      }
    }
    
    return Object.entries(genreStats).map(([genre, stats]) => ({
      genre,
      affinity_score: Math.min(100, (stats.plays * 10) + (stats.time / 1000) - (stats.skips * 5)),
      listening_frequency: stats.plays / 7, // per week
      time_spent: stats.time,
      discovery_openness: 0.5, // Default
      context_associations: ['general'],
    })).filter(g => g.affinity_score > 0);
  }

  private async analyzeAudioFeaturePreferences(interactions: UserInteraction[]): Promise<any> {
    const features: {
      acousticness: number[];
      danceability: number[];
      energy: number[];
      instrumentalness: number[];
      liveness: number[];
      loudness: number[];
      speechiness: number[];
      valence: number[];
      tempo: number[];
    } = {
      acousticness: [],
      danceability: [],
      energy: [],
      instrumentalness: [],
      liveness: [],
      loudness: [],
      speechiness: [],
      valence: [],
      tempo: [],
    };
    
    for (const interaction of interactions) {
      if (interaction.interaction_type === 'play' && interaction.duration_played > 30000) { // 30+ seconds
        const trackFeatures = this.trackFeatures.get(interaction.track_id);
        if (trackFeatures?.audio_features) {
          const af = trackFeatures.audio_features;
          features.acousticness.push(af.acousticness);
          features.danceability.push(af.danceability);
          features.energy.push(af.energy);
          features.instrumentalness.push(af.instrumentalness);
          features.liveness.push(af.liveness);
          features.loudness.push(af.loudness);
          features.speechiness.push(af.speechiness);
          features.valence.push(af.valence);
          features.tempo.push(af.tempo);
        }
      }
    }
    
    // Calculate preferences for each feature
    const audioFeatureProfile: any = {};
    
    for (const [feature, values] of Object.entries(features)) {
      if (values.length > 0) {
        const sorted = values.sort((a, b) => a - b);
        const min = sorted[0];
        const max = sorted[sorted.length - 1];
        const preferred = sorted[Math.floor(sorted.length / 2)]; // Median
        const tolerance = (max - min) / 4; // 25% of range
        
        audioFeatureProfile[feature] = {
          min: Math.max(0, preferred - tolerance),
          max: Math.min(feature === 'tempo' ? 200 : 1, preferred + tolerance),
          preferred,
          tolerance,
        };
      }
    }
    
    return audioFeatureProfile;
  }

  private async calculateUserEmbedding(userId: string, interactions: UserInteraction[]): Promise<number[]> {
    // Mock user embedding calculation
    // In a real implementation, this would use matrix factorization or neural networks
    const embedding = new Array(50).fill(0).map(() => Math.random() * 2 - 1); // Random embedding
    return embedding;
  }

  private async findSimilarUsers(userId: string, embedding: number[]): Promise<any[]> {
    // Mock similarity calculation
    const similarities = [];
    
    for (const [otherUserId, profile] of this.userProfiles.entries()) {
      if (otherUserId !== userId && profile.embedding_vector.length > 0) {
        const similarity = this.calculateCosineSimilarity(embedding, profile.embedding_vector);
        if (similarity > 0.5) {
          similarities.push({
            user_id: otherUserId,
            similarity_score: similarity,
            shared_preferences: ['rock', 'electronic'], // Mock
            complementary_preferences: ['jazz', 'classical'], // Mock
            calculated_at: Date.now(),
          });
        }
      }
    }
    
    return similarities.sort((a, b) => b.similarity_score - a.similarity_score).slice(0, 20);
  }

  private calculateCosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private generatePlaylistName(input: CurationInput): string {
    if (input.target_mood) {
      return `${input.target_mood.charAt(0).toUpperCase() + input.target_mood.slice(1)} Vibes`;
    }
    if (input.target_context) {
      return `${input.target_context.charAt(0).toUpperCase() + input.target_context.slice(1)} Mix`;
    }
    if (input.seed_genres?.length) {
      return `${input.seed_genres[0].charAt(0).toUpperCase() + input.seed_genres[0].slice(1)} Discovery`;
    }
    return 'AI Curated Mix';
  }

  private generatePlaylistDescription(input: CurationInput, tracks: PlaylistTrack[]): string {
    const trackCount = tracks.length;
    const duration = Math.round(tracks.reduce((sum, t) => sum + (t.audio_features.duration_ms || 0), 0) / 60000);
    
    let description = `AI-curated playlist with ${trackCount} tracks (${duration} minutes). `;
    
    if (input.target_mood) {
      description += `Perfect for ${input.target_mood} moments. `;
    }
    if (input.target_context) {
      description += `Ideal for ${input.target_context}. `;
    }
    
    description += 'Personalized based on your music taste and listening history.';
    
    return description;
  }

  private calculateGenreDistribution(tracks: PlaylistTrack[]): any[] {
    const genreCounts: Record<string, number> = {};
    
    tracks.forEach(track => {
      const trackFeatures = this.trackFeatures.get(track.track_id);
      if (trackFeatures?.genre_tags.length) {
        const genre = trackFeatures.genre_tags[0];
        genreCounts[genre] = (genreCounts[genre] || 0) + 1;
      }
    });
    
    return Object.entries(genreCounts).map(([genre, count]) => ({
      genre,
      percentage: (count / tracks.length) * 100,
      track_count: count,
    }));
  }

  private calculateMoodProgression(tracks: PlaylistTrack[]): any[] {
    return tracks.map((track, index) => ({
      position: index / (tracks.length - 1),
      mood: this.inferMoodFromFeatures(track.audio_features),
      intensity: track.audio_features.energy || 0.5,
    }));
  }

  private calculateEnergyCurve(tracks: PlaylistTrack[]): any[] {
    return tracks.map((track, index) => ({
      position: index / (tracks.length - 1),
      energy_level: track.audio_features.energy || 0.5,
      tempo: track.audio_features.tempo || 120,
      valence: track.audio_features.valence || 0.5,
    }));
  }

  private inferMoodFromFeatures(features: AudioFeatures): string {
    const energy = features.energy || 0.5;
    const valence = features.valence || 0.5;
    
    if (energy > 0.7 && valence > 0.7) return 'energetic';
    if (energy < 0.3 && valence < 0.3) return 'melancholic';
    if (energy > 0.6 && valence < 0.4) return 'aggressive';
    if (energy < 0.4 && valence > 0.6) return 'peaceful';
    return 'neutral';
  }

  private calculateDiversityScore(tracks: PlaylistTrack[]): number {
    // Calculate diversity based on audio features variance
    const features = ['energy', 'valence', 'danceability', 'acousticness'];
    let totalVariance = 0;
    
    features.forEach(feature => {
      const values = tracks.map(t => (t.audio_features as any)[feature] || 0.5);
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
      totalVariance += variance;
    });
    
    return Math.min(100, totalVariance * 400); // Scale to 0-100
  }

  private calculatePlaylistNoveltyScore(tracks: PlaylistTrack[]): number {
    // Average novelty factor of all tracks
    const avgNovelty = tracks.reduce((sum, t) => sum + t.novelty_factor, 0) / tracks.length;
    return avgNovelty * 100;
  }

  private calculateCoherenceScore(tracks: PlaylistTrack[]): number {
    // Calculate how well tracks flow together
    let totalTransitionScore = 0;
    
    for (let i = 1; i < tracks.length; i++) {
      totalTransitionScore += tracks[i].transition_score;
    }
    
    return tracks.length > 1 ? (totalTransitionScore / (tracks.length - 1)) * 100 : 100;
  }

  private calculateTransitionScore(existingTracks: PlaylistTrack[], newTrack: any): number {
    if (existingTracks.length === 0) return 1.0;
    
    const lastTrack = existingTracks[existingTracks.length - 1];
    const lastFeatures = lastTrack.audio_features;
    const newFeatures = this.trackFeatures.get(newTrack.track_id)?.audio_features;
    
    if (!newFeatures) return 0.5;
    
    // Calculate similarity in key features for smooth transitions
    const tempoDiff = Math.abs(lastFeatures.tempo - newFeatures.tempo) / 200;
    const energyDiff = Math.abs(lastFeatures.energy - newFeatures.energy);
    const valenceDiff = Math.abs(lastFeatures.valence - newFeatures.valence);
    
    const transitionScore = 1 - ((tempoDiff + energyDiff + valenceDiff) / 3);
    return Math.max(0, Math.min(1, transitionScore));
  }

  private generatePlaylistTags(input: CurationInput, tracks: PlaylistTrack[]): string[] {
    const tags = ['ai-curated'];
    
    if (input.target_mood) tags.push(input.target_mood);
    if (input.target_context) tags.push(input.target_context);
    if (input.seed_genres) tags.push(...input.seed_genres);
    
    // Add dominant genre
    const genreDistribution = this.calculateGenreDistribution(tracks);
    if (genreDistribution.length > 0) {
      tags.push(genreDistribution[0].genre);
    }
    
    // Add energy level tag
    const avgEnergy = tracks.reduce((sum, t) => sum + (t.audio_features.energy || 0.5), 0) / tracks.length;
    if (avgEnergy > 0.7) tags.push('high-energy');
    else if (avgEnergy < 0.3) tags.push('low-energy');
    else tags.push('medium-energy');
    
    return [...new Set(tags)]; // Remove duplicates
  }

  private predictUserRating(track: any, score: number): number {
    // Convert score (0-100) to rating (1-5)
    return Math.max(1, Math.min(5, 1 + (score / 25)));
  }

  private determineSessionType(input: CurationInput): any {
    if (input.target_mood) return 'mood_based';
    if (input.target_context) return 'context_based';
    if (input.seed_artists?.length) return 'similar_artists';
    if (input.novelty_preference && input.novelty_preference > 0.7) return 'discovery';
    return 'auto_playlist';
  }

  private async generateRadioQueue(profile: UserMusicProfile, config: any): Promise<string[]> {
    // Mock radio queue generation
    const queue = [];
    
    // Start with seed-based tracks
    if (config.seed_type === 'genre' && config.seed_values.length > 0) {
      for (const genre of config.seed_values) {
        const tracks = await this.getTracksForGenre(genre);
        queue.push(...tracks.slice(0, 5).map(t => t.track_id));
      }
    }
    
    // Add user preference-based tracks
    const topGenres = profile.genre_preferences
      .sort((a, b) => b.affinity_score - a.affinity_score)
      .slice(0, 3);
    
    for (const genre of topGenres) {
      const tracks = await this.getTracksForGenre(genre.genre);
      queue.push(...tracks.slice(0, 3).map(t => t.track_id));
    }
    
    // Shuffle and return
    return this.shuffleArray(queue).slice(0, 20);
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private async getTracksForGenre(genre: string): Promise<any[]> {
    // Mock track retrieval for genre
    return Array.from({ length: 20 }, (_, i) => ({
      track_id: `${genre}_track_${i}`,
      artist_id: `${genre}_artist_${i % 5}`,
      genre,
      score: Math.random() * 100,
      novelty_factor: Math.random(),
      reasoning: [`Popular ${genre} track`],
    }));
  }

  private matchesAudioFeaturePreferences(track: any, preferences: any): boolean {
    // Mock audio feature matching
    return Math.random() > 0.3; // 70% match rate
  }

  private matchesMoodCharacteristics(track: any, moodPreference: any): boolean {
    // Mock mood matching
    return Math.random() > 0.4; // 60% match rate
  }

  private calculatePreferenceScore(track: any, profile: UserMusicProfile): number {
    // Mock preference scoring
    return Math.random() * 100;
  }

  private calculateFeatureMatchScore(track: any, audioFeatures: any): number {
    // Mock feature matching score
    return Math.random() * 100;
  }

  private calculateTrackNoveltyScore(track: any, profile: UserMusicProfile): number {
    // Mock novelty scoring
    return Math.random() * 100;
  }

  private calculateContextScore(track: any, context: string, profile: UserMusicProfile): number {
    // Mock context scoring
    return Math.random() * 100;
  }

  private async findSimilarTracks(trackFeatures: TrackFeatures, profile: UserMusicProfile): Promise<any[]> {
    // Mock similar track finding
    return Array.from({ length: 10 }, (_, i) => ({
      track_id: `similar_${trackFeatures.track_id}_${i}`,
      score: Math.random() * 100,
      reasoning: ['Similar audio features'],
    }));
  }

  private async updateRadioFromFeedback(radio: SmartRadio, feedback: any): Promise<void> {
    // Mock radio learning from feedback
    if (feedback.feedback_type === 'thumbs_down' || feedback.feedback_type === 'skip') {
      radio.exploration_factor = Math.min(1, radio.exploration_factor + 0.1);
    } else if (feedback.feedback_type === 'thumbs_up') {
      radio.exploration_factor = Math.max(0, radio.exploration_factor - 0.05);
    }
  }

  private async incorporateFeedback(userId: string, playlistId: string, rating: number, feedback?: string): Promise<void> {
    // Mock feedback incorporation for future improvements
    console.log(`Incorporating feedback: ${rating}/5 for playlist ${playlistId}`);
  }

  private getPeriodMilliseconds(period: string): number {
    switch (period) {
      case 'week': return 7 * 24 * 60 * 60 * 1000;
      case 'month': return 30 * 24 * 60 * 60 * 1000;
      case 'quarter': return 90 * 24 * 60 * 60 * 1000;
      case 'year': return 365 * 24 * 60 * 60 * 1000;
      default: return 7 * 24 * 60 * 60 * 1000;
    }
  }

  // Mock analysis methods
  private async analyzeListeningTimes(interactions: UserInteraction[]): Promise<any[]> {
    return [{ start_hour: 9, end_hour: 17, days: [1, 2, 3, 4, 5], weight: 0.8 }];
  }

  private async calculateDiscoveryRate(interactions: UserInteraction[]): Promise<number> {
    return Math.random() * 0.3; // 0-30% discovery rate
  }

  private async analyzeArtistPreferences(interactions: UserInteraction[]): Promise<any[]> {
    return [];
  }

  private async analyzeMoodPreferences(interactions: UserInteraction[]): Promise<any[]> {
    return [];
  }

  private async analyzeListeningContexts(interactions: UserInteraction[]): Promise<any[]> {
    return [];
  }

  private async assignPreferenceClusters(embedding: number[]): Promise<string[]> {
    return ['cluster_1', 'cluster_3'];
  }

  private calculateProfileConfidence(interactionCount: number, totalTime: number): number {
    return Math.min(100, (interactionCount * 2) + (totalTime / 3600000)); // Hours to confidence
  }

  private async calculateGenreBreakdown(interactions: UserInteraction[]): Promise<any[]> {
    return [
      { genre: 'rock', percentage: 35, track_count: 15 },
      { genre: 'electronic', percentage: 25, track_count: 10 },
      { genre: 'indie', percentage: 20, track_count: 8 },
    ];
  }

  private async analyzeMoodPatterns(interactions: UserInteraction[]): Promise<any[]> {
    return [];
  }

  private async calculateDiscoveryStats(interactions: UserInteraction[]): Promise<any> {
    return {
      new_artists_discovered: 5,
      new_genres_explored: 2,
      discovery_rate: 0.15,
      successful_discoveries: 3,
      discovery_sources: { playlist: 2, radio: 1, recommendations: 2 },
    };
  }

  private async analyzeTasteEvolution(userId: string, period: string): Promise<any[]> {
    return [];
  }

  private async findNewDiscoveries(interactions: UserInteraction[]): Promise<any[]> {
    return [];
  }

  private async findForgottenFavorites(userId: string, interactions: UserInteraction[]): Promise<string[]> {
    return [];
  }

  private async analyzeInfluenceNetwork(userId: string): Promise<any> {
    return { influencers: [], influenced: [], mutual_influences: [] };
  }

  private async findSharedDiscoveries(userId: string, interactions: UserInteraction[]): Promise<any[]> {
    return [];
  }

  private async calculateRecommendationAccuracy(userId: string, period: string): Promise<number> {
    return Math.random() * 0.3 + 0.7; // 70-100%
  }

  private async calculatePlaylistSatisfaction(userId: string, period: string): Promise<number> {
    return Math.random() * 1.5 + 3.5; // 3.5-5.0
  }

  private async calculateDiscoverySuccessRate(interactions: UserInteraction[]): Promise<number> {
    return Math.random() * 0.4 + 0.4; // 40-80%
  }

  private async generateTextualInsights(userId: string, interactions: UserInteraction[]): Promise<any[]> {
    return [
      {
        type: 'taste_change',
        title: 'Your taste is evolving',
        description: 'You\'ve been exploring more electronic music lately',
        confidence: 85,
        actionable_suggestions: ['Try ambient electronic', 'Explore techno subgenres'],
        supporting_data: { genre_shift: 'rock -> electronic' },
        generated_at: Date.now(),
      },
    ];
  }

  private initializeRecommendationEngines(): void {
    // Initialize default recommendation engines
    const collaborativeEngine: RecommendationEngine = {
      id: 'collaborative_v1',
      name: 'Collaborative Filtering',
      type: 'collaborative_filtering',
      model_config: {
        num_factors: 50,
        regularization: 0.01,
        learning_rate: 0.01,
        iterations: 100,
      },
      training_data: {} as any,
      performance_metrics: {
        precision: 0.75,
        recall: 0.68,
        f1_score: 0.71,
        auc_roc: 0.82,
        ndcg: 0.78,
        map: 0.72,
        mrr: 0.85,
        intra_list_diversity: 0.65,
        catalog_coverage: 0.45,
        novelty: 0.55,
        serendipity: 0.35,
        user_satisfaction: 4.2,
        engagement_lift: 0.15,
        discovery_rate: 0.25,
        retention_impact: 0.12,
        test_set_size: 10000,
        evaluation_date: Date.now(),
        cross_validation_folds: 5,
      },
      diversity_weight: 0.3,
      novelty_weight: 0.2,
      popularity_weight: 0.3,
      serendipity_factor: 0.2,
      is_active: true,
      last_trained: Date.now(),
      next_training: Date.now() + (7 * 24 * 60 * 60 * 1000),
      version: '1.0.0',
    };

    this.engines.set(collaborativeEngine.id, collaborativeEngine);
  }

  private initializeMockData(): void {
    // Initialize mock track features
    const genres = ['rock', 'electronic', 'indie', 'pop', 'jazz', 'classical', 'hip-hop', 'country'];
    
    for (let i = 0; i < 1000; i++) {
      const genre = genres[i % genres.length];
      const trackFeatures: TrackFeatures = {
        track_id: `track_${i}`,
        audio_features: {
          acousticness: Math.random(),
          danceability: Math.random(),
          energy: Math.random(),
          instrumentalness: Math.random(),
          liveness: Math.random(),
          loudness: Math.random() * -60,
          speechiness: Math.random(),
          valence: Math.random(),
          tempo: 60 + Math.random() * 140,
          time_signature: 4,
          key: Math.floor(Math.random() * 12),
          mode: Math.random() > 0.5 ? 1 : 0,
          duration_ms: 180000 + Math.random() * 240000,
        },
        metadata: {
          title: `Track ${i}`,
          artist: `Artist ${Math.floor(i / 5)}`,
          album: `Album ${Math.floor(i / 10)}`,
          year: 2000 + Math.floor(Math.random() * 24),
          duration_ms: 180000 + Math.random() * 240000,
          explicit: Math.random() > 0.8,
          language: 'en',
        },
        genre_tags: [genre],
        mood_tags: ['energetic', 'happy', 'melancholic', 'peaceful'][Math.floor(Math.random() * 4)] ? [['energetic', 'happy', 'melancholic', 'peaceful'][Math.floor(Math.random() * 4)]] : [],
        popularity_score: Math.random() * 100,
        release_date: Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000,
      };
      
      this.trackFeatures.set(trackFeatures.track_id, trackFeatures);
    }
  }

  private startLearningProcess(): void {
    // Start periodic learning and model updates
    this.learningTimer = setInterval(() => {
      this.updateModels();
    }, 60 * 60 * 1000); // Every hour

    this.insightsTimer = setInterval(() => {
      this.generatePeriodicInsights();
    }, 24 * 60 * 60 * 1000); // Daily
  }

  private async updateModels(): Promise<void> {
    // Mock model updating
    console.log('Updating recommendation models...');
  }

  private async generatePeriodicInsights(): Promise<void> {
    // Generate insights for all users
    for (const userId of this.userProfiles.keys()) {
      try {
        await this.generateInsights(userId, 'week');
      } catch (error) {
        console.error(`Failed to generate insights for user ${userId}:`, error);
      }
    }
  }

  private generateId(): string {
    return `ai_curator_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Storage methods
  private async persistToStorage(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      const data = {
        userProfiles: Array.from(this.userProfiles.entries()),
        playlists: Array.from(this.playlists.entries()),
        engines: Array.from(this.engines.entries()),
        sessions: Array.from(this.sessions.entries()),
        radios: Array.from(this.radios.entries()),
        insights: Array.from(this.insights.entries()),
        trackFeatures: Array.from(this.trackFeatures.entries()),
        userInteractions: Array.from(this.userInteractions.entries()),
      };

      localStorage.setItem(`taptap_ai_curator_${this.userId || 'anonymous'}`, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to persist AI Curator data:', error);
    }
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(`taptap_ai_curator_${this.userId || 'anonymous'}`);
      if (stored) {
        const data = JSON.parse(stored);
        
        this.userProfiles = new Map(data.userProfiles || []);
        this.playlists = new Map(data.playlists || []);
        this.engines = new Map(data.engines || []);
        this.sessions = new Map(data.sessions || []);
        this.radios = new Map(data.radios || []);
        this.insights = new Map(data.insights || []);
        this.trackFeatures = new Map(data.trackFeatures || []);
        this.userInteractions = new Map(data.userInteractions || []);

        console.log(`AI Curator data loaded: ${this.userProfiles.size} profiles, ${this.playlists.size} playlists`);
      }
    } catch (error) {
      console.error('Failed to load AI Curator data:', error);
    }
  }

  // Cleanup
  destroy(): void {
    if (this.learningTimer) {
      clearInterval(this.learningTimer);
    }
    
    if (this.insightsTimer) {
      clearInterval(this.insightsTimer);
    }

    this.persistToStorage();
  }
}
