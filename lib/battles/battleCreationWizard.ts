/**
 * Battle Creation Wizard
 * Step-by-step battle creation with validation and suggestions
 */

import { Battle, BattleCreationWizard, WizardSuggestion, VotingConfig } from './types';
import { Track } from '@/types/track';

export class BattleCreationWizardManager {
  private wizardState: BattleCreationWizard;

  constructor() {
    this.wizardState = {
      step: 'basic',
      data: {},
      validation_errors: {},
      suggestions: [],
    };
  }

  /**
   * Get current wizard state
   */
  getState(): BattleCreationWizard {
    return { ...this.wizardState };
  }

  /**
   * Update wizard data
   */
  updateData(data: Partial<Battle>): void {
    this.wizardState.data = { ...this.wizardState.data, ...data };
    this.validateCurrentStep();
    this.generateSuggestions();
  }

  /**
   * Move to next step
   */
  nextStep(): boolean {
    if (!this.canProceedToNext()) {
      return false;
    }

    const steps: BattleCreationWizard['step'][] = ['basic', 'tracks', 'voting', 'timing', 'prizes', 'review'];
    const currentIndex = steps.indexOf(this.wizardState.step);
    
    if (currentIndex < steps.length - 1) {
      this.wizardState.step = steps[currentIndex + 1];
      this.validateCurrentStep();
      this.generateSuggestions();
      return true;
    }
    
    return false;
  }

  /**
   * Move to previous step
   */
  previousStep(): boolean {
    const steps: BattleCreationWizard['step'][] = ['basic', 'tracks', 'voting', 'timing', 'prizes', 'review'];
    const currentIndex = steps.indexOf(this.wizardState.step);
    
    if (currentIndex > 0) {
      this.wizardState.step = steps[currentIndex - 1];
      this.validateCurrentStep();
      this.generateSuggestions();
      return true;
    }
    
    return false;
  }

  /**
   * Jump to specific step
   */
  goToStep(step: BattleCreationWizard['step']): void {
    this.wizardState.step = step;
    this.validateCurrentStep();
    this.generateSuggestions();
  }

  /**
   * Check if can proceed to next step
   */
  canProceedToNext(): boolean {
    this.validateCurrentStep();
    return Object.keys(this.wizardState.validation_errors).length === 0;
  }

  /**
   * Get completion percentage
   */
  getCompletionPercentage(): number {
    const steps = ['basic', 'tracks', 'voting', 'timing', 'prizes', 'review'];
    const currentIndex = steps.indexOf(this.wizardState.step);
    return Math.round(((currentIndex + 1) / steps.length) * 100);
  }

  /**
   * Validate current step
   */
  private validateCurrentStep(): void {
    this.wizardState.validation_errors = {};

    switch (this.wizardState.step) {
      case 'basic':
        this.validateBasicInfo();
        break;
      case 'tracks':
        this.validateTracks();
        break;
      case 'voting':
        this.validateVotingConfig();
        break;
      case 'timing':
        this.validateTiming();
        break;
      case 'prizes':
        this.validatePrizes();
        break;
      case 'review':
        this.validateComplete();
        break;
    }
  }

  private validateBasicInfo(): void {
    const { title, type, description } = this.wizardState.data;

    if (!title || title.trim().length === 0) {
      this.wizardState.validation_errors.title = 'Battle title is required';
    } else if (title.length < 3) {
      this.wizardState.validation_errors.title = 'Title must be at least 3 characters';
    } else if (title.length > 100) {
      this.wizardState.validation_errors.title = 'Title must be less than 100 characters';
    }

    if (!type) {
      this.wizardState.validation_errors.type = 'Battle type is required';
    }

    if (description && description.length > 500) {
      this.wizardState.validation_errors.description = 'Description must be less than 500 characters';
    }
  }

  private validateTracks(): void {
    const { tracks, min_participants, max_participants } = this.wizardState.data;

    if (!tracks || tracks.length === 0) {
      this.wizardState.validation_errors.tracks = 'At least one track is required';
    } else if (tracks.length < (min_participants || 2)) {
      this.wizardState.validation_errors.tracks = `At least ${min_participants || 2} tracks required`;
    } else if (tracks.length > (max_participants || 8)) {
      this.wizardState.validation_errors.tracks = `Maximum ${max_participants || 8} tracks allowed`;
    }

    // Check for duplicate tracks
    if (tracks) {
      const trackIds = tracks.map(bt => bt.track.id);
      const uniqueIds = new Set(trackIds);
      if (trackIds.length !== uniqueIds.size) {
        this.wizardState.validation_errors.tracks = 'Duplicate tracks are not allowed';
      }
    }
  }

  private validateVotingConfig(): void {
    const { voting_config } = this.wizardState.data;

    if (!voting_config) {
      this.wizardState.validation_errors.voting_config = 'Voting configuration is required';
      return;
    }

    if (voting_config.votes_per_user < 1 || voting_config.votes_per_user > 10) {
      this.wizardState.validation_errors.votes_per_user = 'Votes per user must be between 1 and 10';
    }

    if (voting_config.rate_limit_per_minute < 1 || voting_config.rate_limit_per_minute > 60) {
      this.wizardState.validation_errors.rate_limit = 'Rate limit must be between 1 and 60 votes per minute';
    }

    if (voting_config.cooldown_between_votes < 0 || voting_config.cooldown_between_votes > 3600) {
      this.wizardState.validation_errors.cooldown = 'Cooldown must be between 0 and 3600 seconds';
    }
  }

  private validateTiming(): void {
    const { starts_at, voting_starts_at, voting_ends_at, ends_at } = this.wizardState.data;
    const now = Date.now();

    if (!starts_at || starts_at < now) {
      this.wizardState.validation_errors.starts_at = 'Start time must be in the future';
    }

    if (!voting_starts_at || voting_starts_at < now) {
      this.wizardState.validation_errors.voting_starts_at = 'Voting start time must be in the future';
    }

    if (!voting_ends_at || voting_ends_at < now) {
      this.wizardState.validation_errors.voting_ends_at = 'Voting end time must be in the future';
    }

    if (!ends_at || ends_at < now) {
      this.wizardState.validation_errors.ends_at = 'End time must be in the future';
    }

    // Check logical order
    if (starts_at && voting_starts_at && starts_at >= voting_starts_at) {
      this.wizardState.validation_errors.timing_order = 'Voting must start after battle starts';
    }

    if (voting_starts_at && voting_ends_at && voting_starts_at >= voting_ends_at) {
      this.wizardState.validation_errors.voting_duration = 'Voting end must be after voting start';
    }

    if (voting_ends_at && ends_at && voting_ends_at > ends_at) {
      this.wizardState.validation_errors.battle_end = 'Battle must end after voting ends';
    }

    // Check minimum durations
    if (voting_starts_at && voting_ends_at) {
      const votingDuration = voting_ends_at - voting_starts_at;
      if (votingDuration < 60 * 60 * 1000) { // 1 hour minimum
        this.wizardState.validation_errors.voting_duration = 'Voting period must be at least 1 hour';
      }
    }
  }

  private validatePrizes(): void {
    const { prize_pool, entry_fee } = this.wizardState.data;

    if (entry_fee && entry_fee < 0) {
      this.wizardState.validation_errors.entry_fee = 'Entry fee cannot be negative';
    }

    if (prize_pool) {
      if (prize_pool.total_value < 0) {
        this.wizardState.validation_errors.prize_value = 'Prize value cannot be negative';
      }

      if (prize_pool.distribution) {
        const totalPercentage = prize_pool.distribution.reduce((sum, dist) => sum + dist.percentage, 0);
        if (Math.abs(totalPercentage - 100) > 0.01) {
          this.wizardState.validation_errors.prize_distribution = 'Prize distribution must total 100%';
        }
      }
    }
  }

  private validateComplete(): void {
    // Run all validations
    this.validateBasicInfo();
    this.validateTracks();
    this.validateVotingConfig();
    this.validateTiming();
    this.validatePrizes();
  }

  /**
   * Generate suggestions for current step
   */
  private generateSuggestions(): void {
    this.wizardState.suggestions = [];

    switch (this.wizardState.step) {
      case 'basic':
        this.generateBasicSuggestions();
        break;
      case 'tracks':
        this.generateTrackSuggestions();
        break;
      case 'voting':
        this.generateVotingSuggestions();
        break;
      case 'timing':
        this.generateTimingSuggestions();
        break;
      case 'prizes':
        this.generatePrizeSuggestions();
        break;
    }
  }

  private generateBasicSuggestions(): void {
    const { type, genre } = this.wizardState.data;

    if (!genre) {
      this.wizardState.suggestions.push({
        type: 'track_recommendation',
        title: 'Add Genre Filter',
        description: 'Specify a genre to help users find your battle',
        priority: 'medium',
      });
    }

    if (type === 'tournament') {
      this.wizardState.suggestions.push({
        type: 'voting_config',
        title: 'Tournament Setup',
        description: 'Consider using bracket-style elimination for tournaments',
        priority: 'high',
      });
    }
  }

  private generateTrackSuggestions(): void {
    const { tracks, type } = this.wizardState.data;

    if (!tracks || tracks.length < 4) {
      this.wizardState.suggestions.push({
        type: 'track_recommendation',
        title: 'Add More Tracks',
        description: 'More tracks create more engaging battles',
        priority: 'medium',
      });
    }

    if (type === 'tournament' && tracks && tracks.length % 2 !== 0) {
      this.wizardState.suggestions.push({
        type: 'track_recommendation',
        title: 'Even Number of Tracks',
        description: 'Tournaments work best with even numbers of participants',
        priority: 'high',
      });
    }
  }

  private generateVotingSuggestions(): void {
    const { voting_config } = this.wizardState.data;

    if (!voting_config?.fraud_detection_enabled) {
      this.wizardState.suggestions.push({
        type: 'voting_config',
        title: 'Enable Fraud Detection',
        description: 'Protect your battle from fake votes',
        priority: 'high',
      });
    }

    if (voting_config?.votes_per_user === 1) {
      this.wizardState.suggestions.push({
        type: 'voting_config',
        title: 'Consider Multiple Votes',
        description: 'Allow users to vote for multiple tracks for more engagement',
        priority: 'low',
      });
    }
  }

  private generateTimingSuggestions(): void {
    const { voting_starts_at, voting_ends_at } = this.wizardState.data;

    if (voting_starts_at && voting_ends_at) {
      const duration = voting_ends_at - voting_starts_at;
      const hours = duration / (1000 * 60 * 60);

      if (hours < 6) {
        this.wizardState.suggestions.push({
          type: 'timing_optimization',
          title: 'Extend Voting Period',
          description: 'Longer voting periods typically get more participation',
          priority: 'medium',
        });
      }

      if (hours > 168) { // 1 week
        this.wizardState.suggestions.push({
          type: 'timing_optimization',
          title: 'Shorten Voting Period',
          description: 'Very long voting periods may lose momentum',
          priority: 'low',
        });
      }
    }
  }

  private generatePrizeSuggestions(): void {
    const { prize_pool, entry_fee } = this.wizardState.data;

    if (!prize_pool && !entry_fee) {
      this.wizardState.suggestions.push({
        type: 'prize_suggestion',
        title: 'Add Incentives',
        description: 'Prizes or recognition can increase participation',
        priority: 'low',
      });
    }

    if (entry_fee && !prize_pool) {
      this.wizardState.suggestions.push({
        type: 'prize_suggestion',
        title: 'Add Prize Pool',
        description: 'Entry fees should contribute to prizes',
        priority: 'high',
      });
    }
  }

  /**
   * Get recommended voting config based on battle type
   */
  getRecommendedVotingConfig(battleType: Battle['type']): VotingConfig {
    const baseConfig: VotingConfig = {
      votes_per_user: 1,
      allow_vote_changes: true,
      require_authentication: true,
      voting_duration: 24 * 60 * 60, // 24 hours
      fraud_detection_enabled: true,
      rate_limit_per_minute: 5,
      cooldown_between_votes: 30,
      weight_by_user_reputation: true,
      anonymous_voting: false,
    };

    switch (battleType) {
      case 'head_to_head':
        return {
          ...baseConfig,
          votes_per_user: 1,
          voting_duration: 6 * 60 * 60, // 6 hours
        };

      case 'tournament':
        return {
          ...baseConfig,
          votes_per_user: 1,
          allow_vote_changes: false,
          voting_duration: 12 * 60 * 60, // 12 hours
        };

      case 'community_vote':
        return {
          ...baseConfig,
          votes_per_user: 3,
          voting_duration: 48 * 60 * 60, // 48 hours
          anonymous_voting: true,
        };

      case 'timed_challenge':
        return {
          ...baseConfig,
          votes_per_user: 1,
          voting_duration: 2 * 60 * 60, // 2 hours
          rate_limit_per_minute: 10,
          cooldown_between_votes: 10,
        };

      default:
        return baseConfig;
    }
  }

  /**
   * Reset wizard to initial state
   */
  reset(): void {
    this.wizardState = {
      step: 'basic',
      data: {},
      validation_errors: {},
      suggestions: [],
    };
  }

  /**
   * Export battle data for creation
   */
  exportBattleData(): Partial<Battle> {
    return { ...this.wizardState.data };
  }
}
