/**
 * Battle Recap Generator
 * AI-powered recap generation with highlights, key moments, and statistics
 */

import { 
  Battle, 
  Vote, 
  BattleRecap, 
  RecapContent, 
  RecapHighlight, 
  KeyMoment, 
  WinnerSpotlight,
  MediaAsset 
} from './types';

export class BattleRecapGenerator {
  /**
   * Generate comprehensive battle recap
   */
  async generateRecap(battle: Battle, votes: Vote[]): Promise<BattleRecap> {
    const content = await this.generateRecapContent(battle, votes);
    
    const recap: BattleRecap = {
      id: this.generateId(),
      battle_id: battle.id,
      type: 'text',
      content,
      generated_at: Date.now(),
      generated_by: 'ai',
      status: 'ready',
      engagement_stats: {
        views: 0,
        shares: 0,
        likes: 0,
        comments: 0,
      },
    };

    return recap;
  }

  /**
   * Generate recap content with AI analysis
   */
  private async generateRecapContent(battle: Battle, votes: Vote[]): Promise<RecapContent> {
    const highlights = this.generateHighlights(battle, votes);
    const keyMoments = this.generateKeyMoments(battle, votes);
    const winnerSpotlight = this.generateWinnerSpotlight(battle, votes);
    const statisticsSummary = this.generateStatisticsSummary(battle, votes);

    return {
      title: this.generateTitle(battle),
      summary: this.generateSummary(battle, votes),
      highlights,
      key_moments: keyMoments,
      winner_spotlight: winnerSpotlight,
      statistics_summary: statisticsSummary,
      media_assets: this.generateMediaAssets(battle),
    };
  }

  /**
   * Generate battle title
   */
  private generateTitle(battle: Battle): string {
    const templates = [
      `${battle.title} - Epic Battle Recap`,
      `The ${battle.title} Showdown: Complete Recap`,
      `${battle.title}: Battle Results & Highlights`,
      `Recap: ${battle.title} - Who Came Out on Top?`,
    ];

    return templates[Math.floor(Math.random() * templates.length)];
  }

  /**
   * Generate battle summary
   */
  private generateSummary(battle: Battle, votes: Vote[]): string {
    const winner = battle.tracks[0];
    const totalVotes = votes.filter(v => v.is_verified).length;
    const uniqueVoters = new Set(votes.map(v => v.user_id)).size;
    const duration = this.formatDuration(battle.ends_at - battle.voting_starts_at);

    const summaryTemplates = [
      `The ${battle.title} battle concluded after ${duration} of intense voting, with ${winner.track.title} by ${winner.track.artist} emerging victorious. The battle attracted ${totalVotes} votes from ${uniqueVoters} unique participants, showcasing the community's passion for great music.`,
      
      `In a thrilling ${battle.type.replace('_', ' ')} battle, ${winner.track.title} claimed the top spot with ${winner.vote_percentage.toFixed(1)}% of the vote. Over ${duration}, ${uniqueVoters} music lovers cast their votes, making this one of our most engaging battles yet.`,
      
      `${battle.title} has wrapped up with spectacular results! ${winner.track.title} by ${winner.track.artist} dominated the competition, securing victory in a battle that saw ${totalVotes} total votes across ${duration} of voting.`,
    ];

    return summaryTemplates[Math.floor(Math.random() * summaryTemplates.length)];
  }

  /**
   * Generate battle highlights
   */
  private generateHighlights(battle: Battle, votes: Vote[]): RecapHighlight[] {
    const highlights: RecapHighlight[] = [];

    // Check for comeback story
    const comeback = this.detectComeback(battle, votes);
    if (comeback) {
      highlights.push(comeback);
    }

    // Check for upset victory
    const upset = this.detectUpset(battle, votes);
    if (upset) {
      highlights.push(upset);
    }

    // Check for close race
    const closeRace = this.detectCloseRace(battle);
    if (closeRace) {
      highlights.push(closeRace);
    }

    // Check for dominant performance
    const dominance = this.detectDominantPerformance(battle);
    if (dominance) {
      highlights.push(dominance);
    }

    // Check for voting surge
    const surge = this.detectVotingSurge(votes);
    if (surge) {
      highlights.push(surge);
    }

    return highlights.slice(0, 3); // Top 3 highlights
  }

  private detectComeback(battle: Battle, votes: Vote[]): RecapHighlight | null {
    // Analyze vote timeline to detect comebacks
    const winner = battle.tracks[0];
    const timelineAnalysis = this.analyzeVoteTimeline(votes, winner.track.id);
    
    if (timelineAnalysis.hadComeback) {
      return {
        type: 'comeback',
        title: 'Epic Comeback Victory',
        description: `${winner.track.title} staged a remarkable comeback, overcoming an early deficit to claim victory in the final hours.`,
        tracks_involved: [winner.track.id],
        significance_score: 85,
      };
    }
    
    return null;
  }

  private detectUpset(battle: Battle, votes: Vote[]): RecapHighlight | null {
    // Mock upset detection - would analyze expected vs actual results
    if (Math.random() < 0.3) { // 30% chance for demo
      const winner = battle.tracks[0];
      return {
        type: 'upset',
        title: 'Shocking Upset Victory',
        description: `${winner.track.title} pulled off a stunning upset, defeating heavily favored opponents against all odds.`,
        tracks_involved: [winner.track.id],
        significance_score: 90,
      };
    }
    
    return null;
  }

  private detectCloseRace(battle: Battle): RecapHighlight | null {
    if (battle.tracks.length >= 2) {
      const margin = battle.tracks[0].vote_percentage - battle.tracks[1].vote_percentage;
      
      if (margin < 5) { // Less than 5% margin
        return {
          type: 'close_race',
          title: 'Nail-Biting Finish',
          description: `An incredibly close race with only ${margin.toFixed(1)}% separating the top two tracks at the finish line.`,
          tracks_involved: [battle.tracks[0].track.id, battle.tracks[1].track.id],
          significance_score: 80,
        };
      }
    }
    
    return null;
  }

  private detectDominantPerformance(battle: Battle): RecapHighlight | null {
    const winner = battle.tracks[0];
    
    if (winner.vote_percentage > 60) { // More than 60% of votes
      return {
        type: 'dominant_performance',
        title: 'Dominant Victory',
        description: `${winner.track.title} delivered a commanding performance, capturing ${winner.vote_percentage.toFixed(1)}% of all votes.`,
        tracks_involved: [winner.track.id],
        significance_score: 75,
      };
    }
    
    return null;
  }

  private detectVotingSurge(votes: Vote[]): RecapHighlight | null {
    // Analyze voting patterns for surges
    const hourlyVotes = this.groupVotesByHour(votes);
    const maxHourlyVotes = Math.max(...hourlyVotes);
    const avgHourlyVotes = hourlyVotes.reduce((a, b) => a + b, 0) / hourlyVotes.length;
    
    if (maxHourlyVotes > avgHourlyVotes * 2) { // More than 2x average
      return {
        type: 'controversy',
        title: 'Massive Voting Surge',
        description: `A dramatic surge in voting activity created intense competition and record-breaking engagement.`,
        tracks_involved: [],
        significance_score: 70,
      };
    }
    
    return null;
  }

  /**
   * Generate key moments timeline
   */
  private generateKeyMoments(battle: Battle, votes: Vote[]): KeyMoment[] {
    const moments: KeyMoment[] = [];

    // Battle start
    moments.push({
      timestamp: battle.voting_starts_at,
      event_type: 'voting_surge',
      description: 'Voting begins with immediate community engagement',
      impact_score: 60,
      related_tracks: battle.tracks.map(bt => bt.track.id),
    });

    // Midpoint analysis
    const midpoint = battle.voting_starts_at + ((battle.voting_ends_at - battle.voting_starts_at) / 2);
    moments.push({
      timestamp: midpoint,
      event_type: 'milestone',
      description: 'Halfway point reached with intense competition',
      impact_score: 50,
      related_tracks: battle.tracks.slice(0, 2).map(bt => bt.track.id),
    });

    // Final hour surge
    const finalHour = battle.voting_ends_at - (60 * 60 * 1000);
    moments.push({
      timestamp: finalHour,
      event_type: 'voting_surge',
      description: 'Final hour brings surge of last-minute votes',
      impact_score: 80,
      related_tracks: [battle.tracks[0].track.id],
    });

    // Battle end
    moments.push({
      timestamp: battle.voting_ends_at,
      event_type: 'milestone',
      description: 'Voting concludes with final results',
      impact_score: 100,
      related_tracks: [battle.tracks[0].track.id],
    });

    return moments;
  }

  /**
   * Generate winner spotlight
   */
  private generateWinnerSpotlight(battle: Battle, votes: Vote[]): WinnerSpotlight {
    const winner = battle.tracks[0];
    const runnerUp = battle.tracks[1];
    const margin = runnerUp ? winner.vote_percentage - runnerUp.vote_percentage : winner.vote_percentage;

    let victoryType: WinnerSpotlight['victory_type'];
    if (margin > 30) victoryType = 'landslide';
    else if (margin > 15) victoryType = 'comfortable';
    else if (margin > 5) victoryType = 'narrow';
    else victoryType = 'upset';

    const winningFactors = this.analyzeWinningFactors(winner, battle, votes);

    return {
      track_id: winner.track.id,
      victory_margin: margin,
      victory_type: victoryType,
      winning_factors: winningFactors,
      quote: this.generateWinnerQuote(winner, victoryType),
    };
  }

  private analyzeWinningFactors(winner: any, battle: Battle, votes: Vote[]): string[] {
    const factors: string[] = [];

    // Analyze voting patterns
    if (winner.vote_percentage > 50) {
      factors.push('Strong community support');
    }

    // Check for early lead
    const earlyVotes = votes.filter(v => v.timestamp < battle.voting_starts_at + (2 * 60 * 60 * 1000));
    const earlyWinnerVotes = earlyVotes.filter(v => v.track_id === winner.track.id);
    if (earlyWinnerVotes.length > earlyVotes.length * 0.4) {
      factors.push('Early momentum');
    }

    // Genre appeal
    if (winner.track.genre) {
      factors.push(`${winner.track.genre} genre appeal`);
    }

    // Consistent performance
    factors.push('Consistent vote accumulation');

    return factors.slice(0, 3);
  }

  private generateWinnerQuote(winner: any, victoryType: string): string {
    const quotes = {
      landslide: [
        "Absolutely thrilled with this overwhelming support from the community!",
        "This landslide victory shows the power of great music connecting with people.",
      ],
      comfortable: [
        "So grateful for everyone who voted and supported this track!",
        "This comfortable win feels amazing - thank you to all the voters!",
      ],
      narrow: [
        "What a close battle! Every single vote mattered in this nail-biter.",
        "Winning by such a narrow margin makes this victory even sweeter.",
      ],
      upset: [
        "I can't believe we pulled off this upset! Thank you to everyone who believed in us.",
        "This unexpected victory proves that anything can happen in music battles!",
      ],
    };

    const typeQuotes = quotes[victoryType as keyof typeof quotes] || quotes.comfortable;
    return typeQuotes[Math.floor(Math.random() * typeQuotes.length)];
  }

  /**
   * Generate statistics summary
   */
  private generateStatisticsSummary(battle: Battle, votes: Vote[]): string {
    const totalVotes = votes.filter(v => v.is_verified).length;
    const uniqueVoters = new Set(votes.map(v => v.user_id)).size;
    const fraudulentVotes = votes.filter(v => v.fraud_score > 50).length;
    const duration = this.formatDuration(battle.ends_at - battle.voting_starts_at);
    const avgVotesPerHour = Math.round(totalVotes / (duration.includes('hour') ? parseInt(duration) : 24));

    return `Battle Statistics: ${totalVotes} verified votes from ${uniqueVoters} unique participants over ${duration}. Average voting rate: ${avgVotesPerHour} votes per hour. Fraud detection flagged ${fraudulentVotes} suspicious votes, maintaining battle integrity.`;
  }

  /**
   * Generate media assets
   */
  private generateMediaAssets(battle: Battle): MediaAsset[] {
    const assets: MediaAsset[] = [];

    // Winner celebration image
    assets.push({
      type: 'image',
      url: `/api/battles/${battle.id}/winner-celebration.jpg`,
      caption: `${battle.tracks[0].track.title} victory celebration`,
    });

    // Vote progression chart
    assets.push({
      type: 'image',
      url: `/api/battles/${battle.id}/vote-progression.png`,
      caption: 'Vote progression throughout the battle',
    });

    // Battle highlights video (if available)
    if (battle.type === 'tournament') {
      assets.push({
        type: 'video',
        url: `/api/battles/${battle.id}/highlights.mp4`,
        caption: 'Battle highlights and key moments',
        duration: 120, // 2 minutes
      });
    }

    return assets;
  }

  // Helper methods
  private analyzeVoteTimeline(votes: Vote[], trackId: string) {
    // Mock timeline analysis
    return {
      hadComeback: Math.random() < 0.3, // 30% chance
      leadChanges: Math.floor(Math.random() * 5),
      finalSurge: Math.random() < 0.4, // 40% chance
    };
  }

  private groupVotesByHour(votes: Vote[]): number[] {
    // Group votes by hour and return counts
    const hourlyVotes: number[] = [];
    const startTime = Math.min(...votes.map(v => v.timestamp));
    const endTime = Math.max(...votes.map(v => v.timestamp));
    const hours = Math.ceil((endTime - startTime) / (1000 * 60 * 60));

    for (let i = 0; i < hours; i++) {
      const hourStart = startTime + (i * 60 * 60 * 1000);
      const hourEnd = hourStart + (60 * 60 * 1000);
      const hourVotes = votes.filter(v => v.timestamp >= hourStart && v.timestamp < hourEnd);
      hourlyVotes.push(hourVotes.length);
    }

    return hourlyVotes;
  }

  private formatDuration(milliseconds: number): string {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    } else {
      return 'less than an hour';
    }
  }

  private generateId(): string {
    return `recap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
