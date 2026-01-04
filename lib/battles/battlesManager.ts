/**
 * Battles Manager
 * Core battles system with vote rate limiting, fraud detection, and battle management
 */

import { 
  Battle, 
  Vote, 
  VoteRateLimit, 
  FraudFlag, 
  BattleResults,
  BattleAnalytics 
} from './types';
import { Track } from '@/types/track';
import { eventBus, EventTypes } from '../eventBus';

export class BattlesManager {
  private battles: Map<string, Battle> = new Map();
  private votes: Map<string, Vote[]> = new Map();
  private rateLimits: Map<string, VoteRateLimit> = new Map();
  private fraudDetector: FraudDetector;
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
    this.fraudDetector = new FraudDetector();
    this.loadFromStorage();
  }

  /**
   * Create a new battle
   */
  async createBattle(battleData: Partial<Battle>): Promise<Battle> {
    const battle: Battle = {
      id: this.generateId(),
      title: battleData.title || 'Untitled Battle',
      description: battleData.description,
      type: battleData.type || 'head_to_head',
      status: 'draft',
      tracks: [],
      max_participants: battleData.max_participants || 8,
      min_participants: battleData.min_participants || 2,
      created_at: Date.now(),
      updated_at: Date.now(),
      starts_at: battleData.starts_at || Date.now() + (60 * 60 * 1000), // 1 hour from now
      voting_starts_at: battleData.voting_starts_at || Date.now() + (2 * 60 * 60 * 1000), // 2 hours
      voting_ends_at: battleData.voting_ends_at || Date.now() + (24 * 60 * 60 * 1000), // 24 hours
      ends_at: battleData.ends_at || Date.now() + (25 * 60 * 60 * 1000), // 25 hours
      created_by: this.userId,
      moderators: [this.userId],
      voting_config: {
        votes_per_user: 1,
        allow_vote_changes: true,
        require_authentication: true,
        voting_duration: 24 * 60 * 60, // 24 hours
        fraud_detection_enabled: true,
        rate_limit_per_minute: 5,
        cooldown_between_votes: 30, // 30 seconds
        weight_by_user_reputation: true,
        anonymous_voting: false,
        ...battleData.voting_config,
      },
      tags: battleData.tags || [],
      genre: battleData.genre,
      difficulty_level: battleData.difficulty_level || 'intermediate',
      total_votes: 0,
      total_participants: 0,
      view_count: 0,
      engagement_score: 0,
    };

    this.battles.set(battle.id, battle);
    this.votes.set(battle.id, []);
    await this.persistToStorage();

    // Emit event
    eventBus.emit(EventTypes.BATTLE_CREATED, {
      battleId: battle.id,
      title: battle.title,
      type: battle.type,
      createdBy: this.userId,
    }, {
      userId: this.userId,
      source: 'battles-manager',
    });

    console.log(`Battle created: ${battle.title}`);
    return battle;
  }

  /**
   * Add track to battle
   */
  async addTrackToBattle(battleId: string, track: Track): Promise<void> {
    const battle = this.battles.get(battleId);
    if (!battle) {
      throw new Error('Battle not found');
    }

    if (battle.status !== 'draft') {
      throw new Error('Cannot add tracks to active battle');
    }

    if (battle.tracks.length >= battle.max_participants) {
      throw new Error('Battle is full');
    }

    // Check if track already exists
    if (battle.tracks.some(bt => bt.track.id === track.id)) {
      throw new Error('Track already in battle');
    }

    const battleTrack = {
      track,
      submitted_by: this.userId,
      submitted_at: Date.now(),
      votes: 0,
      vote_percentage: 0,
      position: battle.tracks.length + 1,
    };

    battle.tracks.push(battleTrack);
    battle.total_participants = battle.tracks.length;
    battle.updated_at = Date.now();

    await this.persistToStorage();

    // Emit event
    eventBus.emit(EventTypes.BATTLE_TRACK_ADDED, {
      battleId,
      trackId: track.id,
      trackTitle: track.title,
      submittedBy: this.userId,
    }, {
      userId: this.userId,
      source: 'battles-manager',
    });

    console.log(`Track added to battle: ${track.title} -> ${battle.title}`);
  }

  /**
   * Cast vote with rate limiting and fraud detection
   */
  async castVote(battleId: string, trackId: string, metadata?: Record<string, any>): Promise<Vote> {
    const battle = this.battles.get(battleId);
    if (!battle) {
      throw new Error('Battle not found');
    }

    if (battle.status !== 'voting') {
      throw new Error('Battle is not in voting phase');
    }

    // Check if track exists in battle
    const battleTrack = battle.tracks.find(bt => bt.track.id === trackId);
    if (!battleTrack) {
      throw new Error('Track not found in battle');
    }

    // Check rate limits
    await this.checkVoteRateLimit(battleId);

    // Check if user already voted (if not allowed to change)
    if (!battle.voting_config.allow_vote_changes) {
      const existingVote = this.getUserVoteInBattle(battleId);
      if (existingVote) {
        throw new Error('You have already voted in this battle');
      }
    }

    // Create vote
    const vote: Vote = {
      id: this.generateId(),
      battle_id: battleId,
      track_id: trackId,
      user_id: this.userId,
      weight: 1.0,
      timestamp: Date.now(),
      session_id: this.generateSessionId(),
      fraud_score: 0,
      fraud_flags: [],
      is_verified: false,
      ...metadata,
    };

    // Run fraud detection
    await this.runFraudDetection(vote, battle);

    // Apply reputation weighting if enabled
    if (battle.voting_config.weight_by_user_reputation) {
      vote.weight = await this.calculateUserReputationWeight(this.userId);
    }

    // Store vote
    const battleVotes = this.votes.get(battleId) || [];
    
    // Remove existing vote if changing is allowed
    if (battle.voting_config.allow_vote_changes) {
      const existingIndex = battleVotes.findIndex(v => v.user_id === this.userId);
      if (existingIndex >= 0) {
        battleVotes.splice(existingIndex, 1);
      }
    }

    battleVotes.push(vote);
    this.votes.set(battleId, battleVotes);

    // Update rate limit
    await this.updateVoteRateLimit(battleId);

    // Update battle statistics
    await this.updateBattleStatistics(battleId);

    await this.persistToStorage();

    // Emit event
        eventBus.emit(EventTypes.BATTLE_VOTE_CAST, {
      battleId,
      trackId,
      voteId: vote.id,
      userId: this.userId,
      fraudScore: vote.fraud_score,
    }, {
      userId: this.userId,
      source: 'battles-manager',
    });

    console.log(`Vote cast: ${trackId} in battle ${battleId}`);
    return vote;
  }

  /**
   * Start battle voting phase
   */
  async startVoting(battleId: string): Promise<void> {
    const battle = this.battles.get(battleId);
    if (!battle) {
      throw new Error('Battle not found');
    }

    if (battle.tracks.length < battle.min_participants) {
      throw new Error(`Battle needs at least ${battle.min_participants} tracks`);
    }

    battle.status = 'voting';
    battle.voting_starts_at = Date.now();
    battle.updated_at = Date.now();
    await this.persistToStorage();

    // Emit event
    eventBus.emit(EventTypes.BATTLE_VOTING_STARTED, {
      battleId,
      title: battle.title,
      trackCount: battle.tracks.length,
    }, {
      userId: this.userId,
      source: 'battles-manager',
    });

    console.log(`Voting started for battle: ${battle.title}`);
  }

  /**
   * End battle and calculate results
   */
  async endBattle(battleId: string): Promise<BattleResults> {
    const battle = this.battles.get(battleId);
    if (!battle) {
      throw new Error('Battle not found');
    }

    battle.status = 'completed';
    battle.ends_at = Date.now();

    // Calculate results
    const results = await this.calculateBattleResults(battleId);
    battle.results = results;
    battle.winner_track_id = results.final_rankings[0]?.track.id;
    battle.updated_at = Date.now();

    await this.persistToStorage();

    // Emit event
    eventBus.emit(EventTypes.BATTLE_COMPLETED, {
      battleId,
      title: battle.title,
      winnerId: battle.winner_track_id,
      totalVotes: battle.total_votes,
    }, {
      userId: this.userId,
      source: 'battles-manager',
    });

    console.log(`Battle ended: ${battle.title}, Winner: ${battle.winner_track_id}`);
    return results;
  }

  /**
   * Get battle by ID
   */
  getBattle(battleId: string): Battle | undefined {
    return this.battles.get(battleId);
  }

  /**
   * Get all battles
   */
  getAllBattles(): Battle[] {
    return Array.from(this.battles.values());
  }

  /**
   * Get battles by status
   */
  getBattlesByStatus(status: Battle['status']): Battle[] {
    return Array.from(this.battles.values()).filter(b => b.status === status);
  }

  /**
   * Get user's vote in battle
   */
  getUserVoteInBattle(battleId: string): Vote | undefined {
    const battleVotes = this.votes.get(battleId) || [];
    return battleVotes.find(v => v.user_id === this.userId);
  }

  /**
   * Get battle analytics
   */
  getBattleAnalytics(battleId: string): BattleAnalytics | null {
    const battle = this.battles.get(battleId);
    const votes = this.votes.get(battleId) || [];
    
    if (!battle) return null;

    return {
      battle_id: battleId,
      real_time_metrics: {
        current_votes: votes.length,
        voting_rate: this.calculateVotingRate(votes),
        active_users: this.getActiveUsersCount(votes),
        fraud_alerts: votes.filter(v => v.fraud_score > 50).length,
      },
      historical_data: {
        vote_progression: this.generateVoteProgression(votes),
        user_engagement: [],
        fraud_incidents: this.getFraudIncidents(votes),
      },
      predictions: {
        estimated_final_votes: this.predictFinalVotes(votes, battle),
        projected_winner: this.predictWinner(battle, votes),
        confidence_interval: 0.85,
      },
    };
  }

  // Private helper methods
  private async checkVoteRateLimit(battleId: string): Promise<void> {
    const key = `${this.userId}_${battleId}`;
    const limit = this.rateLimits.get(key);
    const battle = this.battles.get(battleId)!;
    
    const now = Date.now();
    
    if (limit) {
      // Check cooldown
      if (now < limit.cooldown_until) {
        const remainingSeconds = Math.ceil((limit.cooldown_until - now) / 1000);
        throw new Error(`Please wait ${remainingSeconds} seconds before voting again`);
      }
      
      // Check daily limit
      if (limit.daily_used >= limit.daily_limit) {
        throw new Error('Daily vote limit reached');
      }
      
      // Check rate limit per minute
      const minuteAgo = now - (60 * 1000);
      if (limit.last_vote_at > minuteAgo && limit.votes_cast >= battle.voting_config.rate_limit_per_minute) {
        throw new Error('Rate limit exceeded. Please slow down.');
      }
    }
  }

  private async updateVoteRateLimit(battleId: string): Promise<void> {
    const key = `${this.userId}_${battleId}`;
    const battle = this.battles.get(battleId)!;
    const now = Date.now();
    
    const existing = this.rateLimits.get(key);
    if (existing) {
      existing.votes_cast++;
      existing.last_vote_at = now;
      existing.cooldown_until = now + (battle.voting_config.cooldown_between_votes * 1000);
      existing.daily_used++;
    } else {
      this.rateLimits.set(key, {
        user_id: this.userId,
        battle_id: battleId,
        votes_cast: 1,
        last_vote_at: now,
        cooldown_until: now + (battle.voting_config.cooldown_between_votes * 1000),
        daily_limit: 50, // Default daily limit
        daily_used: 1,
        reputation_multiplier: 1.0,
      });
    }
  }

  private async runFraudDetection(vote: Vote, battle: Battle): Promise<void> {
    if (!battle.voting_config.fraud_detection_enabled) return;

    const flags = await this.fraudDetector.analyzeVote(vote, battle, this.votes.get(battle.id) || []);
    vote.fraud_flags = flags;
    vote.fraud_score = this.calculateFraudScore(flags);
    
    // Auto-verify if fraud score is low
    if (vote.fraud_score < 20) {
      vote.is_verified = true;
    }
  }

  private calculateFraudScore(flags: FraudFlag[]): number {
    return flags.reduce((score, flag) => {
      const severityMultiplier = {
        low: 1,
        medium: 2,
        high: 3,
        critical: 5,
      };
      return score + (flag.confidence * severityMultiplier[flag.severity]);
    }, 0);
  }

  private async calculateUserReputationWeight(userId: string): Promise<number> {
    // Mock reputation calculation - would integrate with user reputation system
    return 1.0; // Default weight
  }

  private async updateBattleStatistics(battleId: string): Promise<void> {
    const battle = this.battles.get(battleId)!;
    const votes = this.votes.get(battleId) || [];
    
    // Update vote counts for each track
    battle.tracks.forEach(battleTrack => {
      const trackVotes = votes.filter(v => v.track_id === battleTrack.track.id && v.is_verified);
      battleTrack.votes = trackVotes.reduce((sum, vote) => sum + vote.weight, 0);
    });
    
    // Calculate percentages
    const totalVotes = battle.tracks.reduce((sum, bt) => sum + bt.votes, 0);
    battle.tracks.forEach(battleTrack => {
      battleTrack.vote_percentage = totalVotes > 0 ? (battleTrack.votes / totalVotes) * 100 : 0;
    });
    
    // Sort by votes and update positions
    battle.tracks.sort((a, b) => b.votes - a.votes);
    battle.tracks.forEach((battleTrack, index) => {
      battleTrack.position = index + 1;
    });
    
    battle.total_votes = totalVotes;
    battle.updated_at = Date.now();
  }

  private async calculateBattleResults(battleId: string): Promise<BattleResults> {
    const battle = this.battles.get(battleId)!;
    const votes = this.votes.get(battleId) || [];
    
    // Final rankings (already sorted by updateBattleStatistics)
    const final_rankings = [...battle.tracks];
    
    // Vote breakdown
    const vote_breakdown = battle.tracks.map(bt => ({
      track_id: bt.track.id,
      total_votes: votes.filter(v => v.track_id === bt.track.id).length,
      verified_votes: votes.filter(v => v.track_id === bt.track.id && v.is_verified).length,
      flagged_votes: votes.filter(v => v.track_id === bt.track.id && v.fraud_score > 50).length,
      vote_timeline: this.generateVoteTimeline(votes.filter(v => v.track_id === bt.track.id)),
      demographic_breakdown: {},
    }));
    
    // Statistics
    const statistics = {
      total_votes_cast: votes.length,
      verified_votes: votes.filter(v => v.is_verified).length,
      flagged_votes: votes.filter(v => v.fraud_score > 50).length,
      unique_voters: new Set(votes.map(v => v.user_id)).size,
      average_vote_time: 0,
      peak_voting_rate: 0,
      geographic_distribution: {},
      device_distribution: {},
      engagement_metrics: {
        bounce_rate: 0,
        average_session_duration: 0,
        return_voter_rate: 0,
      },
    };
    
    // Fraud report
    const fraud_report = {
      total_fraud_score: votes.reduce((sum, v) => sum + v.fraud_score, 0) / votes.length,
      flagged_votes_count: votes.filter(v => v.fraud_score > 50).length,
      fraud_patterns_detected: [],
      recommended_actions: [],
      confidence_level: 0.9,
    };
    
    // Recap will be generated separately
    const recap = {
      id: this.generateId(),
      battle_id: battleId,
      type: 'text' as const,
      content: {
        title: `${battle.title} - Battle Recap`,
        summary: `Battle completed with ${votes.length} total votes`,
        highlights: [],
        key_moments: [],
        winner_spotlight: {
          track_id: final_rankings[0].track.id,
          victory_margin: final_rankings[0].vote_percentage - (final_rankings[1]?.vote_percentage || 0),
          victory_type: 'comfortable' as const,
          winning_factors: [],
        },
        statistics_summary: `${statistics.total_votes_cast} votes cast by ${statistics.unique_voters} unique voters`,
        media_assets: [],
      },
      generated_at: Date.now(),
      generated_by: 'ai' as const,
      status: 'ready' as const,
      engagement_stats: {
        views: 0,
        shares: 0,
        likes: 0,
        comments: 0,
      },
    };
    
    return {
      final_rankings,
      vote_breakdown,
      statistics,
      fraud_report,
      recap,
    };
  }

  private generateVoteTimeline(votes: Vote[]) {
    // Group votes by time intervals and create timeline
    return votes.map(vote => ({
      timestamp: vote.timestamp,
      cumulative_votes: 1,
      vote_rate: 1,
    }));
  }

  private calculateVotingRate(votes: Vote[]): number {
    if (votes.length < 2) return 0;
    
    const recentVotes = votes.filter(v => v.timestamp > Date.now() - (5 * 60 * 1000)); // Last 5 minutes
    return recentVotes.length / 5; // votes per minute
  }

  private getActiveUsersCount(votes: Vote[]): number {
    const recentVotes = votes.filter(v => v.timestamp > Date.now() - (5 * 60 * 1000));
    return new Set(recentVotes.map(v => v.user_id)).size;
  }

  private getFraudIncidents(votes: Vote[]) {
    return votes
      .filter(v => v.fraud_score > 70)
      .map(v => ({
        timestamp: v.timestamp,
        type: v.fraud_flags[0]?.type || 'unknown',
        severity: v.fraud_flags[0]?.severity || 'low',
        affected_votes: 1,
        action_taken: 'flagged',
        resolved: false,
      }));
  }

  private generateVoteProgression(votes: Vote[]) {
    // Create timeline of cumulative votes
    const sorted = votes.sort((a, b) => a.timestamp - b.timestamp);
    return sorted.map((vote, index) => ({
      timestamp: vote.timestamp,
      cumulative_votes: index + 1,
      vote_rate: 1,
    }));
  }

  private predictFinalVotes(votes: Vote[], battle: Battle): number {
    const timeRemaining = battle.voting_ends_at - Date.now();
    const currentRate = this.calculateVotingRate(votes);
    return votes.length + (currentRate * (timeRemaining / (60 * 1000)));
  }

  private predictWinner(battle: Battle, votes: Vote[]): string {
    if (battle.tracks.length === 0) return '';
    return battle.tracks[0].track.id; // Current leader
  }

  private generateId(): string {
    return `battle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Storage methods
  private async persistToStorage(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      const data = {
        battles: Array.from(this.battles.entries()),
        votes: Array.from(this.votes.entries()),
        rateLimits: Array.from(this.rateLimits.entries()),
      };

      localStorage.setItem(`taptap_battles_${this.userId}`, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to persist battles:', error);
    }
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(`taptap_battles_${this.userId}`);
      if (stored) {
        const data = JSON.parse(stored);
        
        this.battles = new Map(data.battles || []);
        this.votes = new Map(data.votes || []);
        this.rateLimits = new Map(data.rateLimits || []);

        console.log(`Battles loaded: ${this.battles.size} battles`);
      }
    } catch (error) {
      console.error('Failed to load battles:', error);
    }
  }
}

// Fraud Detection System
class FraudDetector {
  async analyzeVote(vote: Vote, battle: Battle, existingVotes: Vote[]): Promise<FraudFlag[]> {
    const flags: FraudFlag[] = [];

    // Check for rapid voting
    const recentVotes = existingVotes.filter(v => 
      v.user_id === vote.user_id && 
      v.timestamp > Date.now() - (60 * 1000) // Last minute
    );
    
    if (recentVotes.length > 3) {
      flags.push({
        type: 'rapid_voting',
        severity: 'medium',
        description: 'User voting too rapidly',
        confidence: 80,
        detected_at: Date.now(),
      });
    }

    // Check for duplicate IP (mock)
    const sameIpVotes = existingVotes.filter(v => v.ip_address === vote.ip_address);
    if (sameIpVotes.length > 5) {
      flags.push({
        type: 'duplicate_ip',
        severity: 'high',
        description: 'Multiple votes from same IP',
        confidence: 90,
        detected_at: Date.now(),
      });
    }

    // Check for suspicious patterns (mock)
    if (Math.random() < 0.1) { // 10% chance for demo
      flags.push({
        type: 'suspicious_pattern',
        severity: 'low',
        description: 'Unusual voting pattern detected',
        confidence: 60,
        detected_at: Date.now(),
      });
    }

    return flags;
  }
}
