/**
 * AI Agent-Based Notification System
 * Delivers notifications as personalized messages from AI agents
 */

import { AgentMessage, generateAgentMessage, AI_AGENTS } from './aiAgents';
import { EventPayload } from './eventBus';

export interface NotificationSettings {
  userId: string;
  globalEnabled: boolean;
  agents: Record<string, AgentSettings>;
  channels: {
    inApp: boolean;
    push: boolean;
    email: boolean;
  };
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string;   // HH:MM format
  };
  frequency: 'immediate' | 'batched' | 'digest';
}

export interface AgentSettings {
  enabled: boolean;
  priority: 'low' | 'medium' | 'high';
  eventTypes: string[];
  customization: {
    personality: 'default' | 'casual' | 'professional' | 'enthusiastic';
    frequency: 'all' | 'important' | 'minimal';
  };
}

export interface NotificationBatch {
  id: string;
  userId: string;
  messages: AgentMessage[];
  createdAt: number;
  scheduledFor: number;
  status: 'pending' | 'sent' | 'failed';
  type: 'batch' | 'digest';
}

/**
 * Notification System Manager
 */
class NotificationSystemImpl {
  private messages: Map<string, AgentMessage[]> = new Map(); // userId -> messages
  private settings: Map<string, NotificationSettings> = new Map(); // userId -> settings
  private batches: Map<string, NotificationBatch[]> = new Map(); // userId -> batches
  private listeners: Set<(userId: string, message: AgentMessage) => void> = new Set();

  /**
   * Initialize notification system for a user
   */
  initializeUser(userId: string): void {
    if (!this.settings.has(userId)) {
      this.settings.set(userId, this.getDefaultSettings(userId));
    }
    
    if (!this.messages.has(userId)) {
      this.messages.set(userId, []);
    }
    
    if (!this.batches.has(userId)) {
      this.batches.set(userId, []);
    }
    
    this.loadPersistedMessages(userId);
  }

  /**
   * Process an event and generate agent message
   */
  async processEvent(event: EventPayload): Promise<void> {
    if (!event.userId) return;
    
    this.initializeUser(event.userId);
    const settings = this.settings.get(event.userId)!;
    
    if (!settings.globalEnabled) return;
    
    // Check if this event type should generate a notification
    if (!this.shouldNotify(event, settings)) return;
    
    // Check quiet hours
    if (this.isQuietHours(settings)) {
      // Queue for later delivery
      await this.queueForLater(event, settings);
      return;
    }
    
    // Generate agent message
    const message = generateAgentMessage(event.type, event.data, event.userId);
    
    // Apply user customizations
    this.customizeMessage(message, settings);
    
    // Deliver based on frequency setting
    switch (settings.frequency) {
      case 'immediate':
        await this.deliverImmediate(message);
        break;
      case 'batched':
        await this.addToBatch(message);
        break;
      case 'digest':
        await this.addToDigest(message);
        break;
    }
  }

  /**
   * Deliver message immediately
   */
  private async deliverImmediate(message: AgentMessage): Promise<void> {
    const userMessages = this.messages.get(message.userId) || [];
    userMessages.unshift(message); // Add to beginning
    
    // Keep only last 100 messages per user
    if (userMessages.length > 100) {
      userMessages.splice(100);
    }
    
    this.messages.set(message.userId, userMessages);
    this.persistMessage(message);
    
    // Notify listeners (UI components)
    this.notifyListeners(message.userId, message);
    
    console.log(`Agent message delivered: ${message.title} from ${AI_AGENTS[message.agentId]?.name}`);
  }

  /**
   * Add message to batch for later delivery
   */
  private async addToBatch(message: AgentMessage): Promise<void> {
    const userBatches = this.batches.get(message.userId) || [];
    
    // Find or create current batch
    let currentBatch = userBatches.find(batch => 
      batch.type === 'batch' &&
      batch.status === 'pending' && 
      Date.now() - batch.createdAt < 300000 // 5 minutes
    );
    
    if (!currentBatch) {
      currentBatch = {
        id: `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: message.userId,
        messages: [],
        createdAt: Date.now(),
        scheduledFor: Date.now() + 300000, // 5 minutes from now
        status: 'pending',
        type: 'batch',
      };
      userBatches.push(currentBatch);
    }
    
    currentBatch.messages.push(message);
    this.batches.set(message.userId, userBatches);
    
    // Schedule batch delivery
    setTimeout(() => {
      this.deliverBatch(currentBatch!);
    }, currentBatch.scheduledFor - Date.now());
  }

  /**
   * Add message to digest for daily summary delivery
   */
  private async addToDigest(message: AgentMessage): Promise<void> {
    const userBatches = this.batches.get(message.userId) || [];
    
    let digestBatch = userBatches.find(batch => 
      batch.type === 'digest' &&
      batch.status === 'pending'
    );
    
    if (!digestBatch) {
      digestBatch = {
        id: `digest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: message.userId,
        messages: [],
        createdAt: Date.now(),
        scheduledFor: this.getNextDigestTime(),
        status: 'pending',
        type: 'digest',
      };
      userBatches.push(digestBatch);
    }
    
    digestBatch.messages.push(message);
    this.batches.set(message.userId, userBatches);
    
    if (digestBatch.messages.length === 1) {
      const delay = Math.max(0, digestBatch.scheduledFor - Date.now());
      setTimeout(() => {
        this.deliverDigest(digestBatch!);
      }, delay);
    }
  }

  /**
   * Deliver a batch of messages
   */
  private async deliverBatch(batch: NotificationBatch): Promise<void> {
    if (batch.type !== 'batch' || batch.status !== 'pending') return;
    
    // Create summary message from batch
    const summaryMessage = this.createBatchSummary(batch);
    
    batch.status = 'sent';
    await this.deliverImmediate(summaryMessage);
    
    console.log(`Batch delivered: ${batch.messages.length} messages for user ${batch.userId}`);
  }

  /**
   * Deliver digest of messages
   */
  private async deliverDigest(batch: NotificationBatch): Promise<void> {
    if (batch.type !== 'digest' || batch.status !== 'pending') return;
    
    const digestMessage = this.createDigestSummary(batch);
    batch.status = 'sent';
    await this.deliverImmediate(digestMessage);
    
    console.log(`Digest delivered: ${batch.messages.length} messages for user ${batch.userId}`);
  }

  /**
   * Create a summary message from a batch
   */
  private createBatchSummary(batch: NotificationBatch): AgentMessage {
    const agentCounts = batch.messages.reduce((acc, msg) => {
      acc[msg.agentId] = (acc[msg.agentId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const primaryAgent = Object.keys(agentCounts).reduce((a, b) => 
      agentCounts[a] > agentCounts[b] ? a : b
    );
    
    const agent = AI_AGENTS[primaryAgent];
    const agentSymbol = agent?.emoji ?? 'AI';
    const agentName = agent?.name ?? 'TapTap AI';
    const totalMessages = batch.messages.length;
    const summaryText = this.generateBatchSummary(batch.messages);
    
    return {
      id: `summary_${batch.id}`,
      agentId: primaryAgent,
      userId: batch.userId,
      type: 'notification',
      title: `${agentSymbol} ${totalMessages} Updates from ${agentName}`,
      message: `Hey! While you were away, ${totalMessages} things happened. ${summaryText}`,
      metadata: {
        isBatch: true,
        originalMessages: batch.messages,
        batchId: batch.id,
      },
      timestamp: Date.now(),
      read: false,
      priority: 'medium',
      actions: [
        {
          id: 'view_all',
          label: 'View All Updates',
          type: 'button',
          action: 'expand_batch',
          data: { batchId: batch.id },
        },
        {
          id: 'dismiss',
          label: 'Dismiss',
          type: 'dismiss',
          action: 'dismiss',
        },
      ],
    };
  }

  /**
   * Create a digest summary message
   */
  private createDigestSummary(batch: NotificationBatch): AgentMessage {
    const agentCounts = batch.messages.reduce((acc, msg) => {
      acc[msg.agentId] = (acc[msg.agentId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const primaryAgent = Object.keys(agentCounts).reduce((a, b) => 
      agentCounts[a] > agentCounts[b] ? a : b
    );

    const agent = AI_AGENTS[primaryAgent];
    const agentSymbol = agent?.emoji ?? 'AI';
    const agentName = agent?.name ?? 'TapTap AI';
    const totalMessages = batch.messages.length;
    const summaryText = this.generateBatchSummary(batch.messages);

    return {
      id: `digest_summary_${batch.id}`,
      agentId: primaryAgent,
      userId: batch.userId,
      type: 'notification',
      title: `${agentSymbol} Daily Digest: ${totalMessages} Highlights`,
      message: `${agentName} pulled together your daily wrap: ${summaryText}`,
      metadata: {
        isDigest: true,
        originalMessages: batch.messages,
        batchId: batch.id,
      },
      timestamp: Date.now(),
      read: false,
      priority: 'low',
      actions: [
        {
          id: 'review_digest',
          label: 'Review Updates',
          type: 'button',
          action: 'expand_digest',
          data: { batchId: batch.id },
        },
        {
          id: 'dismiss_digest',
          label: 'Dismiss',
          type: 'dismiss',
          action: 'dismiss',
        },
      ],
    };
  }  /**
   * Get messages for a user
   */
  getMessages(userId: string, limit = 50): AgentMessage[] {
    this.initializeUser(userId);
    const messages = this.messages.get(userId) || [];
    return messages.slice(0, limit);
  }

  /**
   * Generate human-readable batch summary
   */
  private generateBatchSummary(messages: AgentMessage[]): string {
    const eventTypes = messages.reduce((acc, msg) => {
      const eventType = msg.metadata?.eventType || 'unknown';
      acc[eventType] = (acc[eventType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const summaryParts: string[] = [];
    
    if (eventTypes['track.played']) {
      summaryParts.push(`[Play] ${eventTypes['track.played']} tracks played`);
    }
    if (eventTypes['track.saved']) {
      summaryParts.push(`[Save] ${eventTypes['track.saved']} tracks saved`);
    }
    if (eventTypes['social.post_liked']) {
      summaryParts.push(`[Social] ${eventTypes['social.post_liked']} post likes`);
    }
    if (eventTypes['battle.vote_cast']) {
      summaryParts.push(`[Battle] ${eventTypes['battle.vote_cast']} battle votes`);
    }
    
    return summaryParts.slice(0, 3).join(', ') + (summaryParts.length > 3 ? ', and more!' : '!');
  }

  /**
   * Mark message as read
   */
  markAsRead(userId: string, messageId: string): void {
    const messages = this.messages.get(userId) || [];
    const message = messages.find(m => m.id === messageId);
    
    if (message && !message.read) {
      message.read = true;
      this.persistMessage(message);
      console.log(`Message marked as read: ${messageId}`);
    }
  }

  /**
   * Mark all messages as read
   */
  markAllAsRead(userId: string): void {
    const messages = this.messages.get(userId) || [];
    messages.forEach(message => {
      if (!message.read) {
        message.read = true;
        this.persistMessage(message);
      }
    });
    console.log(`All messages marked as read for user: ${userId}`);
  }

  /**
   * Get unread count
   */
  getUnreadCount(userId: string): number {
    const messages = this.messages.get(userId) || [];
    return messages.filter(m => !m.read).length;
  }

  /**
   * Subscribe to new messages
   */
  subscribe(callback: (userId: string, message: AgentMessage) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Update notification settings
   */
  updateSettings(userId: string, settings: Partial<NotificationSettings>): void {
    const currentSettings = this.settings.get(userId) || this.getDefaultSettings(userId);
    const updatedSettings = { ...currentSettings, ...settings };
    this.settings.set(userId, updatedSettings);
    this.persistSettings(userId, updatedSettings);
    console.log(`Notification settings updated for user: ${userId}`);
  }

  /**
   * Get notification settings
   */
  getSettings(userId: string): NotificationSettings {
    this.initializeUser(userId);
    return this.settings.get(userId)!;
  }

  // Private helper methods
  private getNextDigestTime(): number {
    const nextDigest = new Date();
    nextDigest.setHours(18, 0, 0, 0); // 6 PM local time
    if (nextDigest.getTime() <= Date.now()) {
      nextDigest.setDate(nextDigest.getDate() + 1);
    }
    return nextDigest.getTime();
  }

  private getDefaultSettings(userId: string): NotificationSettings {
    return {
      userId,
      globalEnabled: true,
      agents: Object.keys(AI_AGENTS).reduce((acc, agentId) => {
        acc[agentId] = {
          enabled: true,
          priority: 'medium',
          eventTypes: AI_AGENTS[agentId].specialties,
          customization: {
            personality: 'default',
            frequency: 'important',
          },
        };
        return acc;
      }, {} as Record<string, AgentSettings>),
      channels: {
        inApp: true,
        push: true,
        email: false,
      },
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00',
      },
      frequency: 'immediate',
    };
  }

  private shouldNotify(event: EventPayload, settings: NotificationSettings): boolean {
    // Check if any agent handles this event type
    return Object.values(settings.agents).some(agentSettings => 
      agentSettings.enabled && 
      agentSettings.eventTypes.some(type => event.type.includes(type))
    );
  }

  private isQuietHours(settings: NotificationSettings): boolean {
    if (!settings.quietHours.enabled) return false;
    
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    return currentTime >= settings.quietHours.start || currentTime <= settings.quietHours.end;
  }

  private async queueForLater(event: EventPayload, settings: NotificationSettings): Promise<void> {
    // Implementation would queue the event for delivery after quiet hours
    console.log(`Event queued for later delivery: ${event.type}`);
  }

  private customizeMessage(message: AgentMessage, settings: NotificationSettings): void {
    const agentSettings = settings.agents[message.agentId];
    if (agentSettings?.customization.personality !== 'default') {
      // Customize message based on user preferences
      // Implementation would modify message tone/style
    }
  }

  private notifyListeners(userId: string, message: AgentMessage): void {
    this.listeners.forEach(callback => {
      try {
        callback(userId, message);
      } catch (error) {
        console.error('Notification listener error:', error);
      }
    });
  }

  private persistMessage(message: AgentMessage): void {
    if (typeof window === 'undefined') return;
    
    try {
      const key = `taptap_messages_${message.userId}`;
      const stored = localStorage.getItem(key) || '[]';
      const messages = JSON.parse(stored);
      
      // Update existing or add new
      const index = messages.findIndex((m: AgentMessage) => m.id === message.id);
      if (index >= 0) {
        messages[index] = message;
      } else {
        messages.unshift(message);
      }
      
      // Keep only last 100 messages
      if (messages.length > 100) {
        messages.splice(100);
      }
      
      localStorage.setItem(key, JSON.stringify(messages));
    } catch (error) {
      console.warn('Failed to persist message:', error);
    }
  }

  private loadPersistedMessages(userId: string): void {
    if (typeof window === 'undefined') return;
    
    try {
      const key = `taptap_messages_${userId}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        const messages = JSON.parse(stored);
        this.messages.set(userId, messages);
      }
    } catch (error) {
      console.warn('Failed to load persisted messages:', error);
    }
  }

  private persistSettings(userId: string, settings: NotificationSettings): void {
    if (typeof window === 'undefined') return;
    
    try {
      const key = `taptap_notification_settings_${userId}`;
      localStorage.setItem(key, JSON.stringify(settings));
    } catch (error) {
      console.warn('Failed to persist notification settings:', error);
    }
  }
}

// Global notification system instance
export const notificationSystem = new NotificationSystemImpl();

