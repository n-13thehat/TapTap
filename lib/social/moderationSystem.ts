/**
 * Moderation System
 * AI-powered content moderation with hooks and automated actions
 */

import { 
  SocialPost, 
  ModerationFlag, 
  ModerationAction, 
  SocialUser 
} from './types';
import { eventBus, EventTypes } from '../eventBus';

export interface ModerationRule {
  id: string;
  name: string;
  type: 'content' | 'behavior' | 'spam' | 'safety';
  enabled: boolean;
  severity: ModerationFlag['severity'];
  
  // Conditions
  conditions: ModerationCondition[];
  
  // Actions
  auto_action: ModerationAction['type'];
  requires_review: boolean;
  escalate_threshold: number; // confidence level to escalate
  
  // Metadata
  created_at: number;
  updated_at: number;
  created_by: string;
}

export interface ModerationCondition {
  type: 'keyword' | 'pattern' | 'sentiment' | 'frequency' | 'user_history' | 'ai_classification';
  operator: 'contains' | 'equals' | 'matches' | 'greater_than' | 'less_than';
  value: string | number;
  weight: number; // 0-1, contribution to overall score
}

export interface ModerationHook {
  id: string;
  name: string;
  event: 'pre_publish' | 'post_publish' | 'user_report' | 'ai_flag' | 'manual_review';
  enabled: boolean;
  
  // Execution
  handler: (context: ModerationContext) => Promise<ModerationResult>;
  priority: number; // Lower numbers run first
  timeout: number; // milliseconds
  
  // Filtering
  applies_to: {
    post_types?: SocialPost['type'][];
    user_trust_levels?: SocialUser['trust_level'][];
    content_patterns?: string[];
  };
}

export interface ModerationContext {
  post?: SocialPost;
  user?: SocialUser;
  action?: string;
  metadata: Record<string, any>;
  previous_flags: ModerationFlag[];
  user_reports: UserReport[];
}

export interface ModerationResult {
  action: 'approve' | 'flag' | 'hide' | 'remove' | 'escalate' | 'no_action';
  confidence: number; // 0-100
  flags: ModerationFlag[];
  reason: string;
  metadata?: Record<string, any>;
  requires_human_review?: boolean;
}

export interface UserReport {
  id: string;
  reporter_id: string;
  target_type: 'post' | 'user' | 'comment';
  target_id: string;
  reason: ModerationFlag['type'];
  description: string;
  evidence_urls?: string[];
  
  // Status
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  reviewed_by?: string;
  reviewed_at?: number;
  resolution?: string;
  
  // Metadata
  created_at: number;
  ip_address?: string;
  user_agent?: string;
}

export class ModerationSystem {
  private rules: Map<string, ModerationRule> = new Map();
  private hooks: Map<string, ModerationHook> = new Map();
  private reports: Map<string, UserReport> = new Map();
  private actions: Map<string, ModerationAction> = new Map();

  constructor() {
    this.initializeDefaultRules();
    this.initializeDefaultHooks();
  }

  /**
   * Moderate content before publishing
   */
  async moderateContent(post: SocialPost, user: SocialUser): Promise<ModerationResult> {
    const context: ModerationContext = {
      post,
      user,
      action: 'publish',
      metadata: {},
      previous_flags: post.moderation_flags || [],
      user_reports: this.getReportsForPost(post.id),
    };

    // Run pre-publish hooks
    const hookResults = await this.runHooks('pre_publish', context);
    
    // Apply moderation rules
    const ruleResults = await this.applyRules(context);
    
    // Combine results
    const combinedResult = this.combineResults([...hookResults, ruleResults]);
    
    // Execute automatic actions
    if (combinedResult.action !== 'no_action') {
      await this.executeAction(combinedResult, context);
    }

    return combinedResult;
  }

  /**
   * Handle user report
   */
  async handleUserReport(
    reporterId: string, 
    targetType: UserReport['target_type'], 
    targetId: string, 
    reason: ModerationFlag['type'], 
    description: string
  ): Promise<UserReport> {
    const report: UserReport = {
      id: this.generateId(),
      reporter_id: reporterId,
      target_type: targetType,
      target_id: targetId,
      reason,
      description,
      status: 'pending',
      created_at: Date.now(),
    };

    this.reports.set(report.id, report);

    // Emit event
    eventBus.emit(EventTypes.USER_REPORT_CREATED, {
      reportId: report.id,
      targetType,
      targetId,
      reason,
      reporterId,
    }, {
      userId: reporterId,
      source: 'moderation-system',
    });

    // Auto-moderate based on report
    if (targetType === 'post') {
      const context: ModerationContext = {
        action: 'user_report',
        metadata: { reportId: report.id },
        previous_flags: [],
        user_reports: [report],
      };

      await this.runHooks('user_report', context);
    }

    console.log(`User report created: ${report.id}`);
    return report;
  }

  /**
   * Add custom moderation rule
   */
  addRule(rule: Omit<ModerationRule, 'id' | 'created_at' | 'updated_at'>): string {
    const ruleId = this.generateId();
    const fullRule: ModerationRule = {
      ...rule,
      id: ruleId,
      created_at: Date.now(),
      updated_at: Date.now(),
    };

    this.rules.set(ruleId, fullRule);
    console.log(`Moderation rule added: ${rule.name}`);
    return ruleId;
  }

  /**
   * Add custom moderation hook
   */
  addHook(hook: Omit<ModerationHook, 'id'>): string {
    const hookId = this.generateId();
    const fullHook: ModerationHook = {
      ...hook,
      id: hookId,
    };

    this.hooks.set(hookId, fullHook);
    console.log(`Moderation hook added: ${hook.name}`);
    return hookId;
  }

  /**
   * Get moderation statistics
   */
  getStatistics(): {
    total_reports: number;
    pending_reports: number;
    total_actions: number;
    auto_actions: number;
    manual_actions: number;
    rules_triggered: number;
  } {
    const reports = Array.from(this.reports.values());
    const actions = Array.from(this.actions.values());

    return {
      total_reports: reports.length,
      pending_reports: reports.filter(r => r.status === 'pending').length,
      total_actions: actions.length,
      auto_actions: actions.filter(a => a.is_automated).length,
      manual_actions: actions.filter(a => !a.is_automated).length,
      rules_triggered: actions.filter(a => a.is_automated).length,
    };
  }

  // Private methods
  private async runHooks(event: ModerationHook['event'], context: ModerationContext): Promise<ModerationResult[]> {
    const applicableHooks = Array.from(this.hooks.values())
      .filter(hook => hook.enabled && hook.event === event)
      .filter(hook => this.hookApplies(hook, context))
      .sort((a, b) => a.priority - b.priority);

    const results: ModerationResult[] = [];

    for (const hook of applicableHooks) {
      try {
        const result = await Promise.race([
          hook.handler(context),
          new Promise<ModerationResult>((_, reject) => 
            setTimeout(() => reject(new Error('Hook timeout')), hook.timeout)
          ),
        ]);

        results.push(result);
      } catch (error) {
        console.error(`Hook ${hook.name} failed:`, error);
        
        // Create error result
        results.push({
          action: 'escalate',
          confidence: 0,
          flags: [{
            id: this.generateId(),
            type: 'inappropriate_content',
            severity: 'low',
            confidence: 50,
            flagged_by: 'ai',
            flagged_at: Date.now(),
            reason: `Hook ${hook.name} failed: ${error}`,
          }],
          reason: `Moderation hook error: ${hook.name}`,
          requires_human_review: true,
        });
      }
    }

    return results;
  }

  private async applyRules(context: ModerationContext): Promise<ModerationResult> {
    const applicableRules = Array.from(this.rules.values())
      .filter(rule => rule.enabled);

    let totalScore = 0;
    let maxSeverity: ModerationFlag['severity'] = 'low';
    const flags: ModerationFlag[] = [];
    const triggeredRules: string[] = [];

    for (const rule of applicableRules) {
      const ruleScore = await this.evaluateRule(rule, context);
      
      if (ruleScore > 0) {
        totalScore += ruleScore;
        triggeredRules.push(rule.name);
        
        if (this.severityWeight(rule.severity) > this.severityWeight(maxSeverity)) {
          maxSeverity = rule.severity;
        }

        flags.push({
          id: this.generateId(),
          type: this.ruleTypeToFlagType(rule.type),
          severity: rule.severity,
          confidence: Math.min(100, ruleScore * 100),
          flagged_by: 'ai',
          flagged_at: Date.now(),
          reason: `Rule triggered: ${rule.name}`,
        });
      }
    }

    // Determine action based on score and severity
    let action: ModerationResult['action'] = 'no_action';
    
    if (totalScore > 0.8 || maxSeverity === 'critical') {
      action = 'remove';
    } else if (totalScore > 0.6 || maxSeverity === 'high') {
      action = 'hide';
    } else if (totalScore > 0.4 || maxSeverity === 'medium') {
      action = 'flag';
    } else if (totalScore > 0.2) {
      action = 'escalate';
    }

    return {
      action,
      confidence: Math.min(100, totalScore * 100),
      flags,
      reason: triggeredRules.length > 0 
        ? `Rules triggered: ${triggeredRules.join(', ')}`
        : 'No rules triggered',
      requires_human_review: action === 'escalate' || maxSeverity === 'critical',
    };
  }

  private async evaluateRule(rule: ModerationRule, context: ModerationContext): Promise<number> {
    let score = 0;

    for (const condition of rule.conditions) {
      const conditionScore = await this.evaluateCondition(condition, context);
      score += conditionScore * condition.weight;
    }

    return Math.min(1, score); // Cap at 1.0
  }

  private async evaluateCondition(condition: ModerationCondition, context: ModerationContext): Promise<number> {
    const { post, user } = context;

    switch (condition.type) {
      case 'keyword':
        if (post?.content) {
          const content = post.content.toLowerCase();
          const keyword = (condition.value as string).toLowerCase();
          
          switch (condition.operator) {
            case 'contains':
              return content.includes(keyword) ? 1 : 0;
            case 'equals':
              return content === keyword ? 1 : 0;
          }
        }
        break;

      case 'pattern':
        if (post?.content) {
          const regex = new RegExp(condition.value as string, 'i');
          return regex.test(post.content) ? 1 : 0;
        }
        break;

      case 'frequency':
        // Check posting frequency
        if (user) {
          // Mock frequency check
          return Math.random() < 0.1 ? 1 : 0; // 10% chance for demo
        }
        break;

      case 'sentiment':
        if (post?.content) {
          // Mock sentiment analysis
          const negativeSentiment = this.analyzeSentiment(post.content);
          return negativeSentiment;
        }
        break;

      case 'ai_classification':
        if (post?.content) {
          // Mock AI classification
          return await this.classifyContent(post.content);
        }
        break;
    }

    return 0;
  }

  private analyzeSentiment(content: string): number {
    // Simple sentiment analysis mock
    const negativeWords = ['hate', 'terrible', 'awful', 'disgusting', 'horrible'];
    const words = content.toLowerCase().split(/\s+/);
    const negativeCount = words.filter(word => negativeWords.includes(word)).length;
    
    return Math.min(1, negativeCount / words.length * 10);
  }

  private async classifyContent(content: string): Promise<number> {
    // Mock AI classification
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate API call
    
    // Return random score for demo
    return Math.random() * 0.3; // Low random score
  }

  private combineResults(results: ModerationResult[]): ModerationResult {
    if (results.length === 0) {
      return {
        action: 'no_action',
        confidence: 0,
        flags: [],
        reason: 'No moderation results',
      };
    }

    // Find the most severe action
    const actionSeverity = {
      'no_action': 0,
      'approve': 1,
      'flag': 2,
      'escalate': 3,
      'hide': 4,
      'remove': 5,
    };

    const mostSevere = results.reduce((prev, current) => 
      actionSeverity[current.action] > actionSeverity[prev.action] ? current : prev
    );

    // Combine all flags
    const allFlags = results.flatMap(result => result.flags);
    
    // Average confidence
    const avgConfidence = results.reduce((sum, result) => sum + result.confidence, 0) / results.length;

    return {
      action: mostSevere.action,
      confidence: avgConfidence,
      flags: allFlags,
      reason: `Combined moderation result: ${mostSevere.reason}`,
      requires_human_review: results.some(r => r.requires_human_review),
    };
  }

  private async executeAction(result: ModerationResult, context: ModerationContext): Promise<void> {
    if (!context.post) return;

    const action: ModerationAction = {
      id: this.generateId(),
      type: result.action as ModerationAction['type'],
      target_type: 'post',
      target_id: context.post.id,
      moderator_id: 'system',
      reason: result.reason,
      is_automated: true,
      ai_confidence: result.confidence,
      can_appeal: result.action !== 'approve',
      created_at: Date.now(),
      context: context.metadata,
    };

    this.actions.set(action.id, action);

    // Apply action to post
    switch (result.action) {
      case 'flag':
        context.post.moderation_status = 'flagged';
        break;
      case 'hide':
        context.post.moderation_status = 'flagged';
        context.post.visibility = 'private';
        break;
      case 'remove':
        context.post.moderation_status = 'removed';
        break;
    }

    // Update moderation metadata
    context.post.moderation_flags = [...(context.post.moderation_flags || []), ...result.flags];
    context.post.moderation_score = result.confidence;

    // Emit event
    eventBus.emit(EventTypes.MODERATION_ACTION_TAKEN, {
      actionId: action.id,
      postId: context.post.id,
      actionType: action.type,
      isAutomated: action.is_automated,
      confidence: result.confidence,
    }, {
      userId: context.post.author_id,
      source: 'moderation-system',
    });

    console.log(`Moderation action executed: ${action.type} on post ${context.post.id}`);
  }

  private hookApplies(hook: ModerationHook, context: ModerationContext): boolean {
    const { applies_to } = hook;
    
    if (applies_to.post_types && context.post) {
      if (!applies_to.post_types.includes(context.post.type)) {
        return false;
      }
    }

    if (applies_to.user_trust_levels && context.user) {
      if (!applies_to.user_trust_levels.includes(context.user.trust_level)) {
        return false;
      }
    }

    return true;
  }

  private getReportsForPost(postId: string): UserReport[] {
    return Array.from(this.reports.values())
      .filter(report => report.target_type === 'post' && report.target_id === postId);
  }

  private ruleTypeToFlagType(ruleType: ModerationRule['type']): ModerationFlag['type'] {
    switch (ruleType) {
      case 'spam': return 'spam';
      case 'safety': return 'self_harm';
      default: return 'inappropriate_content';
    }
  }

  private severityWeight(severity: ModerationFlag['severity']): number {
    switch (severity) {
      case 'low': return 1;
      case 'medium': return 2;
      case 'high': return 3;
      case 'critical': return 4;
    }
  }

  private initializeDefaultRules(): void {
    // Spam detection rule
    this.addRule({
      name: 'Spam Detection',
      type: 'spam',
      enabled: true,
      severity: 'medium',
      conditions: [
        {
          type: 'keyword',
          operator: 'contains',
          value: 'spam',
          weight: 0.8,
        },
        {
          type: 'pattern',
          operator: 'matches',
          value: 'http[s]?://[^\\s]+',
          weight: 0.3,
        },
      ],
      auto_action: 'flag',
      requires_review: false,
      escalate_threshold: 80,
      created_by: 'system',
    });

    // Harassment detection rule
    this.addRule({
      name: 'Harassment Detection',
      type: 'safety',
      enabled: true,
      severity: 'high',
      conditions: [
        {
          type: 'sentiment',
          operator: 'greater_than',
          value: 0.7,
          weight: 1.0,
        },
      ],
      auto_action: 'hide',
      requires_review: true,
      escalate_threshold: 70,
      created_by: 'system',
    });
  }

  private initializeDefaultHooks(): void {
    // Pre-publish content check
    this.addHook({
      name: 'Pre-publish Content Check',
      event: 'pre_publish',
      enabled: true,
      handler: async (context) => {
        if (!context.post?.content) {
          return {
            action: 'approve',
            confidence: 100,
            flags: [],
            reason: 'No content to moderate',
          };
        }

        // Simple content check
        const suspiciousWords = ['scam', 'fake', 'virus'];
        const content = context.post.content.toLowerCase();
        const foundWords = suspiciousWords.filter(word => content.includes(word));

        if (foundWords.length > 0) {
          return {
            action: 'flag',
            confidence: 75,
            flags: [{
              id: this.generateId(),
              type: 'spam',
              severity: 'medium',
              confidence: 75,
              flagged_by: 'ai',
              flagged_at: Date.now(),
              reason: `Suspicious words detected: ${foundWords.join(', ')}`,
            }],
            reason: 'Suspicious content detected',
          };
        }

        return {
          action: 'approve',
          confidence: 90,
          flags: [],
          reason: 'Content passed pre-publish check',
        };
      },
      priority: 1,
      timeout: 5000,
      applies_to: {
        post_types: ['text', 'track_share'],
      },
    });
  }

  private generateId(): string {
    return `mod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
