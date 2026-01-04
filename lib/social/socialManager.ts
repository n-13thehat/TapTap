/**
 * Social Manager
 * Core social system with draft autosave, outbox retry, and moderation
 */

import { 
  SocialPost, 
  SocialDraft, 
  OutboxItem, 
  SocialThread, 
  SocialFeed,
  ModerationFlag,
  SocialSettings 
} from './types';
import { eventBus, EventTypes } from '../eventBus';

export class SocialManager {
  private userId: string;
  private posts: Map<string, SocialPost> = new Map();
  private drafts: Map<string, SocialDraft> = new Map();
  private outbox: Map<string, OutboxItem> = new Map();
  private threads: Map<string, SocialThread> = new Map();
  private settings: SocialSettings;
  
  // Auto-save and retry timers
  private autoSaveTimer: NodeJS.Timeout | null = null;
  private retryTimer: NodeJS.Timeout | null = null;

  constructor(userId: string, settings?: Partial<SocialSettings>) {
    this.userId = userId;
    this.settings = {
      user_id: userId,
      profile_visibility: 'public',
      allow_mentions: true,
      allow_direct_messages: true,
      require_follow_approval: false,
      email_notifications: true,
      push_notifications: true,
      notification_types: {
        like: true,
        comment: true,
        share: true,
        follow: true,
        mention: true,
        reply: true,
        moderation: true,
      },
      auto_save_drafts: true,
      auto_save_interval: 30, // 30 seconds
      default_post_visibility: 'public',
      content_filter_level: 'medium',
      hide_sensitive_content: true,
      block_new_accounts: false,
      retry_failed_posts: true,
      max_retry_attempts: 5,
      retry_delay_multiplier: 2,
      ...settings,
    };
    
    this.loadFromStorage();
    this.startAutoSave();
    this.startRetryProcessor();
  }

  /**
   * Create or update draft with auto-save
   */
  async saveDraft(draftData: Partial<SocialDraft>): Promise<SocialDraft> {
    const draftId = draftData.id || this.generateId();
    const now = Date.now();
    
    const existingDraft = this.drafts.get(draftId);
    
    const draft: SocialDraft = {
      id: draftId,
      user_id: this.userId,
      content: draftData.content || '',
      type: draftData.type || 'text',
      attachments: draftData.attachments || [],
      parent_id: draftData.parent_id,
      visibility: draftData.visibility || this.settings.default_post_visibility,
      created_at: existingDraft?.created_at || now,
      last_saved_at: now,
      save_count: (existingDraft?.save_count || 0) + 1,
      auto_saved: true,
      is_complete: this.validateDraft(draftData.content || ''),
      validation_errors: this.getDraftValidationErrors(draftData.content || ''),
      character_count: (draftData.content || '').length,
      estimated_read_time: this.calculateReadTime(draftData.content || ''),
    };

    this.drafts.set(draftId, draft);
    await this.persistToStorage();

    // Emit event
    eventBus.emit(EventTypes.DRAFT_SAVED, {
      draftId,
      userId: this.userId,
      characterCount: draft.character_count,
      isComplete: draft.is_complete,
    }, {
      userId: this.userId,
      source: 'social-manager',
    });

    console.log(`Draft saved: ${draftId} (${draft.character_count} chars)`);
    return draft;
  }

  /**
   * Publish post with outbox retry logic
   */
  async publishPost(postData: Partial<SocialPost>, draftId?: string): Promise<string> {
    // Create outbox item for reliable delivery
    const outboxItem: OutboxItem = {
      id: this.generateId(),
      user_id: this.userId,
      post_data: {
        ...postData,
        id: postData.id || this.generateId(),
        author_id: this.userId,
        created_at: Date.now(),
        updated_at: Date.now(),
        is_draft: false,
        moderation_status: 'pending',
        moderation_flags: [],
        moderation_score: 0,
      },
      action: 'create',
      status: 'pending',
      attempts: 0,
      max_attempts: this.settings.max_retry_attempts,
      next_retry_at: Date.now(),
      retry_delay: 1000, // Start with 1 second
      error_count: 0,
      permanent_failure: false,
      created_at: Date.now(),
      priority: 'normal',
    };

    this.outbox.set(outboxItem.id, outboxItem);

    // Remove draft if specified
    if (draftId) {
      this.drafts.delete(draftId);
    }

    await this.persistToStorage();

    // Emit event
    eventBus.emit(EventTypes.POST_QUEUED, {
      postId: outboxItem.post_data.id,
      outboxId: outboxItem.id,
      userId: this.userId,
    }, {
      userId: this.userId,
      source: 'social-manager',
    });

    // Process immediately
    this.processOutboxItem(outboxItem.id);

    console.log(`Post queued for publishing: ${outboxItem.post_data.id}`);
    return outboxItem.post_data.id!;
  }

  /**
   * Create reply with threading support
   */
  async createReply(parentId: string, content: string, attachments: any[] = []): Promise<string> {
    const parentPost = this.posts.get(parentId);
    if (!parentPost) {
      throw new Error('Parent post not found');
    }

    // Determine thread structure
    const threadId = parentPost.thread_id || parentPost.id;
    const threadDepth = (parentPost.thread_depth || 0) + 1;

    const replyData: Partial<SocialPost> = {
      content,
      attachments,
      parent_id: parentId,
      thread_id: threadId,
      thread_depth: threadDepth,
      type: 'text',
      visibility: parentPost.visibility,
    };

    const postId = await this.publishPost(replyData);

    // Update thread structure
    await this.updateThreadStructure(threadId);

    return postId;
  }

  /**
   * Like/unlike post
   */
  async toggleLike(postId: string): Promise<void> {
    const post = this.posts.get(postId);
    if (!post) {
      throw new Error('Post not found');
    }

    const outboxItem: OutboxItem = {
      id: this.generateId(),
      user_id: this.userId,
      post_data: { id: postId },
      action: 'like',
      status: 'pending',
      attempts: 0,
      max_attempts: 3,
      next_retry_at: Date.now(),
      retry_delay: 500,
      error_count: 0,
      permanent_failure: false,
      created_at: Date.now(),
      priority: 'high', // Likes should be fast
    };

    this.outbox.set(outboxItem.id, outboxItem);

    // Optimistic update
    post.is_liked = !post.is_liked;
    post.like_count += post.is_liked ? 1 : -1;
    this.posts.set(postId, post);

    await this.persistToStorage();
    this.processOutboxItem(outboxItem.id);
  }

  /**
   * Get user's drafts
   */
  getUserDrafts(): SocialDraft[] {
    return Array.from(this.drafts.values())
      .filter(draft => draft.user_id === this.userId)
      .sort((a, b) => b.last_saved_at - a.last_saved_at);
  }

  /**
   * Get thread by ID
   */
  getThread(threadId: string): SocialThread | null {
    return this.threads.get(threadId) || null;
  }

  /**
   * Get outbox status
   */
  getOutboxStatus(): {
    pending: number;
    sending: number;
    failed: number;
    total: number;
  } {
    const items = Array.from(this.outbox.values());
    return {
      pending: items.filter(item => item.status === 'pending').length,
      sending: items.filter(item => item.status === 'sending').length,
      failed: items.filter(item => item.status === 'failed').length,
      total: items.length,
    };
  }

  /**
   * Retry failed outbox items
   */
  async retryFailedItems(): Promise<void> {
    const failedItems = Array.from(this.outbox.values())
      .filter(item => item.status === 'failed' && !item.permanent_failure);

    for (const item of failedItems) {
      item.status = 'pending';
      item.next_retry_at = Date.now();
      await this.processOutboxItem(item.id);
    }
  }

  /**
   * Clear outbox (remove sent items)
   */
  async clearOutbox(): Promise<void> {
    const sentItems = Array.from(this.outbox.entries())
      .filter(([, item]) => item.status === 'sent');

    for (const [id] of sentItems) {
      this.outbox.delete(id);
    }

    await this.persistToStorage();
  }

  // Private methods
  private async processOutboxItem(itemId: string): Promise<void> {
    const item = this.outbox.get(itemId);
    if (!item || item.status === 'sent' || item.permanent_failure) {
      return;
    }

    if (item.status === 'sending') {
      return; // Already being processed
    }

    item.status = 'sending';
    item.attempts++;
    item.last_attempt_at = Date.now();

    try {
      // Simulate API call
      await this.simulateApiCall(item);

      // Success
      item.status = 'sent';
      item.sent_at = Date.now();

      // Add to posts if it's a create action
      if (item.action === 'create' && item.post_data.id) {
        const post = item.post_data as SocialPost;
        post.outbox_status = 'sent';
        this.posts.set(post.id, post);
      }

      // Emit success event
      eventBus.emit(EventTypes.POST_PUBLISHED, {
        postId: item.post_data.id,
        outboxId: item.id,
        userId: this.userId,
      }, {
        userId: this.userId,
        source: 'social-manager',
      });

      console.log(`Outbox item sent: ${item.id}`);
    } catch (error) {
      // Failure
      item.status = 'failed';
      item.error_count++;
      item.last_error = error instanceof Error ? error.message : 'Unknown error';

      // Calculate next retry
      if (item.attempts < item.max_attempts) {
        item.retry_delay *= this.settings.retry_delay_multiplier;
        item.next_retry_at = Date.now() + item.retry_delay;
        item.status = 'retrying';
      } else {
        item.permanent_failure = true;
      }

      // Emit failure event
      eventBus.emit(EventTypes.POST_FAILED, {
        postId: item.post_data.id,
        outboxId: item.id,
        error: item.last_error,
        attempts: item.attempts,
        willRetry: !item.permanent_failure,
      }, {
        userId: this.userId,
        source: 'social-manager',
      });

      console.error(`Outbox item failed: ${item.id}`, error);
    }

    await this.persistToStorage();
  }

  private async simulateApiCall(item: OutboxItem): Promise<void> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));

    // Simulate occasional failures
    if (Math.random() < 0.2) { // 20% failure rate for testing
      throw new Error('Simulated network error');
    }

    // Simulate moderation check
    if (item.action === 'create' && item.post_data.content) {
      const moderationResult = await this.runModerationCheck(item.post_data.content);
      if (item.post_data.moderation_flags) {
        item.post_data.moderation_flags.push(...moderationResult.flags);
        item.post_data.moderation_score = moderationResult.score;
        item.post_data.moderation_status = moderationResult.status;
      }
    }
  }

  private async runModerationCheck(content: string): Promise<{
    flags: ModerationFlag[];
    score: number;
    status: SocialPost['moderation_status'];
  }> {
    // Simple moderation simulation
    const flags: ModerationFlag[] = [];
    let score = 0;

    // Check for spam patterns
    if (content.includes('http') && content.split('http').length > 3) {
      flags.push({
        id: this.generateId(),
        type: 'spam',
        severity: 'medium',
        confidence: 80,
        flagged_by: 'ai',
        flagged_at: Date.now(),
        reason: 'Multiple links detected',
        auto_action: 'hide',
      });
      score += 30;
    }

    // Check for inappropriate content (simple keyword check)
    const inappropriateWords = ['spam', 'scam', 'fake'];
    const foundWords = inappropriateWords.filter(word => 
      content.toLowerCase().includes(word)
    );
    
    if (foundWords.length > 0) {
      flags.push({
        id: this.generateId(),
        type: 'inappropriate_content',
        severity: 'low',
        confidence: 60,
        flagged_by: 'ai',
        flagged_at: Date.now(),
        reason: `Potentially inappropriate content: ${foundWords.join(', ')}`,
        auto_action: 'none',
      });
      score += 20;
    }

    const status: SocialPost['moderation_status'] = 
      score > 70 ? 'flagged' :
      score > 40 ? 'pending' : 'approved';

    return { flags, score, status };
  }

  private validateDraft(content: string): boolean {
    return content.trim().length > 0 && content.length <= 2000;
  }

  private getDraftValidationErrors(content: string): string[] {
    const errors: string[] = [];
    
    if (content.trim().length === 0) {
      errors.push('Content cannot be empty');
    }
    
    if (content.length > 2000) {
      errors.push('Content exceeds maximum length (2000 characters)');
    }
    
    return errors;
  }

  private calculateReadTime(content: string): number {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  }

  private async updateThreadStructure(threadId: string): Promise<void> {
    const threadPosts = Array.from(this.posts.values())
      .filter(post => post.thread_id === threadId || post.id === threadId)
      .sort((a, b) => a.created_at - b.created_at);

    if (threadPosts.length === 0) return;

    const rootPost = threadPosts.find(post => post.id === threadId) || threadPosts[0];
    const replies = threadPosts.filter(post => post.id !== rootPost.id);

    const thread: SocialThread = {
      id: threadId,
      root_post_id: rootPost.id,
      root_post: rootPost,
      reply_count: replies.length,
      participant_count: new Set(threadPosts.map(post => post.author_id)).size,
      participants: [], // Would be populated with user data
      replies,
      max_depth: Math.max(...threadPosts.map(post => post.thread_depth || 0)),
      is_collapsed: false,
      total_likes: threadPosts.reduce((sum, post) => sum + post.like_count, 0),
      total_shares: threadPosts.reduce((sum, post) => sum + post.share_count, 0),
      last_activity_at: Math.max(...threadPosts.map(post => post.updated_at)),
      is_locked: false,
    };

    this.threads.set(threadId, thread);
    await this.persistToStorage();
  }

  private startAutoSave(): void {
    if (!this.settings.auto_save_drafts) return;

    this.autoSaveTimer = setInterval(() => {
      // Auto-save would be triggered by UI changes
      // This is just the timer setup
    }, this.settings.auto_save_interval * 1000);
  }

  private startRetryProcessor(): void {
    this.retryTimer = setInterval(async () => {
      const now = Date.now();
      const retryItems = Array.from(this.outbox.values())
        .filter(item => 
          item.status === 'retrying' && 
          item.next_retry_at <= now &&
          !item.permanent_failure
        );

      for (const item of retryItems) {
        await this.processOutboxItem(item.id);
      }
    }, 5000); // Check every 5 seconds
  }

  private generateId(): string {
    return `social_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Storage methods
  private async persistToStorage(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      const data = {
        posts: Array.from(this.posts.entries()),
        drafts: Array.from(this.drafts.entries()),
        outbox: Array.from(this.outbox.entries()),
        threads: Array.from(this.threads.entries()),
        settings: this.settings,
      };

      localStorage.setItem(`taptap_social_${this.userId}`, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to persist social data:', error);
    }
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(`taptap_social_${this.userId}`);
      if (stored) {
        const data = JSON.parse(stored);
        
        this.posts = new Map(data.posts || []);
        this.drafts = new Map(data.drafts || []);
        this.outbox = new Map(data.outbox || []);
        this.threads = new Map(data.threads || []);
        
        if (data.settings) {
          this.settings = { ...this.settings, ...data.settings };
        }

        console.log(`Social data loaded: ${this.posts.size} posts, ${this.drafts.size} drafts, ${this.outbox.size} outbox items`);
      }
    } catch (error) {
      console.error('Failed to load social data:', error);
    }
  }

  // Cleanup
  destroy(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }
    if (this.retryTimer) {
      clearInterval(this.retryTimer);
    }
  }
}
