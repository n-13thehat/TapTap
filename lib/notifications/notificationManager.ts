/**
 * Notification Manager
 * Core notification system with multi-channel delivery and smart routing
 */

import { 
  Notification, 
  NotificationPreferences, 
  NotificationTemplate,
  NotificationDigest,
  NotificationQueue,
  NotificationType,
  NotificationChannel 
} from './types';
import { eventBus, EventTypes } from '../eventBus';

export class NotificationManager {
  private notifications: Map<string, Notification> = new Map();
  private preferences: Map<string, NotificationPreferences> = new Map();
  private templates: Map<string, NotificationTemplate> = new Map();
  private queues: Map<string, NotificationQueue> = new Map();
  private digests: Map<string, NotificationDigest> = new Map();
  
  private processingTimer: NodeJS.Timeout | null = null;
  private digestTimer: NodeJS.Timeout | null = null;
  private subscribers: Map<string, Set<(notification: Notification) => void>> = new Map();
  
  private userId?: string;
  private isInitialized = false;

  constructor(userId?: string) {
    this.userId = userId;
    this.initializeDefaultTemplates();
    this.initializeDefaultPreferences();
    this.startProcessing();
    this.loadFromStorage();
    this.isInitialized = true;
  }

  /**
   * Send a notification
   */
  async send(notificationData: Omit<Notification, 'id' | 'created_at' | 'delivery_status' | 'is_read' | 'is_seen' | 'is_dismissed' | 'is_archived' | 'delivery_attempts' | 'delivery_errors'>): Promise<string> {
    const notification: Notification = {
      ...notificationData,
      id: this.generateId(),
      delivery_status: {
        total_channels: notificationData.channels.length,
        sent_channels: 0,
        delivered_channels: 0,
        failed_channels: 0,
        overall_status: 'pending',
      },
      is_read: false,
      is_seen: false,
      is_dismissed: false,
      is_archived: false,
      created_at: Date.now(),
      delivery_attempts: 0,
      delivery_errors: [],
    };

    // Apply user preferences
    const processedNotification = await this.applyPreferences(notification);
    if (!processedNotification) {
      console.log(`Notification suppressed by user preferences: ${notification.type}`);
      return notification.id;
    }

    // Store notification
    this.notifications.set(notification.id, processedNotification);

    // Add to appropriate queue
    await this.enqueueNotification(processedNotification);

    console.log(`Notification queued: ${notification.type} for user ${notification.user_id}`);
    return notification.id;
  }

  /**
   * Send bulk notifications
   */
  async sendBulk(notifications: Array<Omit<Notification, 'id' | 'created_at' | 'delivery_status' | 'is_read' | 'is_seen' | 'is_dismissed' | 'is_archived' | 'delivery_attempts' | 'delivery_errors'>>): Promise<string[]> {
    const results = await Promise.all(
      notifications.map(notification => this.send(notification))
    );
    
    console.log(`Bulk notifications queued: ${results.length} notifications`);
    return results;
  }

  /**
   * Mark notification as read
   */
  markAsRead(notificationId: string): void {
    const notification = this.notifications.get(notificationId);
    if (notification && !notification.is_read) {
      notification.is_read = true;
      notification.read_at = Date.now();
      
      this.persistToStorage();
      this.notifySubscribers('read', notification);
      
      console.log(`Notification marked as read: ${notificationId}`);
    }
  }

  /**
   * Mark notification as seen
   */
  markAsSeen(notificationId: string): void {
    const notification = this.notifications.get(notificationId);
    if (notification && !notification.is_seen) {
      notification.is_seen = true;
      this.persistToStorage();
      this.notifySubscribers('seen', notification);
    }
  }

  /**
   * Dismiss notification
   */
  dismiss(notificationId: string): void {
    const notification = this.notifications.get(notificationId);
    if (notification && !notification.is_dismissed) {
      notification.is_dismissed = true;
      notification.dismissed_at = Date.now();
      
      this.persistToStorage();
      this.notifySubscribers('dismissed', notification);
      
      console.log(`Notification dismissed: ${notificationId}`);
    }
  }

  /**
   * Archive notification
   */
  archive(notificationId: string): void {
    const notification = this.notifications.get(notificationId);
    if (notification) {
      notification.is_archived = true;
      this.persistToStorage();
      this.notifySubscribers('archived', notification);
    }
  }

  /**
   * Get notifications for user
   */
  getNotifications(userId: string, options: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
    category?: string;
    type?: NotificationType;
  } = {}): Notification[] {
    const { limit = 50, offset = 0, unreadOnly = false, category, type } = options;
    
    let notifications = Array.from(this.notifications.values())
      .filter(n => n.user_id === userId && !n.is_archived);

    if (unreadOnly) {
      notifications = notifications.filter(n => !n.is_read);
    }

    if (category) {
      notifications = notifications.filter(n => n.category === category);
    }

    if (type) {
      notifications = notifications.filter(n => n.type === type);
    }

    return notifications
      .sort((a, b) => b.created_at - a.created_at)
      .slice(offset, offset + limit);
  }

  /**
   * Get unread count
   */
  getUnreadCount(userId: string): number {
    return Array.from(this.notifications.values())
      .filter(n => n.user_id === userId && !n.is_read && !n.is_archived)
      .length;
  }

  /**
   * Update user preferences
   */
  updatePreferences(userId: string, preferences: Partial<NotificationPreferences>): void {
    const current = this.preferences.get(userId) || this.getDefaultPreferences(userId);
    const updated = {
      ...current,
      ...preferences,
      updated_at: Date.now(),
      version: current.version + 1,
    };

    this.preferences.set(userId, updated);
    this.persistToStorage();

    console.log(`Notification preferences updated for user: ${userId}`);
  }

  /**
   * Get user preferences
   */
  getPreferences(userId: string): NotificationPreferences {
    return this.preferences.get(userId) || this.getDefaultPreferences(userId);
  }

  /**
   * Subscribe to notification events
   */
  subscribe(userId: string, callback: (notification: Notification) => void): () => void {
    if (!this.subscribers.has(userId)) {
      this.subscribers.set(userId, new Set());
    }
    
    this.subscribers.get(userId)!.add(callback);

    return () => {
      const userSubscribers = this.subscribers.get(userId);
      if (userSubscribers) {
        userSubscribers.delete(callback);
        if (userSubscribers.size === 0) {
          this.subscribers.delete(userId);
        }
      }
    };
  }

  /**
   * Create notification template
   */
  createTemplate(template: Omit<NotificationTemplate, 'id' | 'created_at' | 'updated_at' | 'version'>): string {
    const templateData: NotificationTemplate = {
      ...template,
      id: this.generateId(),
      created_at: Date.now(),
      updated_at: Date.now(),
      version: 1,
    };

    this.templates.set(templateData.id, templateData);
    this.persistToStorage();

    console.log(`Notification template created: ${templateData.name}`);
    return templateData.id;
  }

  /**
   * Send notification from template
   */
  async sendFromTemplate(templateId: string, variables: Record<string, any>, recipients: string[]): Promise<string[]> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    const notifications = recipients.map(userId => ({
      type: template.type,
      category: template.category,
      priority: 'normal' as const,
      title: this.renderTemplate(template.title_template, variables),
      message: this.renderTemplate(template.message_template, variables),
      summary: template.summary_template ? this.renderTemplate(template.summary_template, variables) : undefined,
      user_id: userId,
      channels: this.getDefaultChannels(),
      actions: [],
      source: 'template',
      source_id: templateId,
      tags: ['template'],
      custom_data: { template_id: templateId, variables },
    }));

    return await this.sendBulk(notifications);
  }

  /**
   * Generate daily digest
   */
  async generateDigest(userId: string, type: 'daily' | 'weekly' = 'daily'): Promise<string> {
    const preferences = this.getPreferences(userId);
    const notifications = this.getNotifications(userId, {
      limit: 100,
      unreadOnly: false,
    });

    // Filter notifications for digest
    const digestNotifications = notifications.filter(n => {
      const categoryPref = preferences.categories[n.category];
      return categoryPref?.digest_frequency === type;
    });

    if (digestNotifications.length === 0) {
      console.log(`No notifications for ${type} digest: ${userId}`);
      return '';
    }

    const digest: NotificationDigest = {
      id: this.generateId(),
      user_id: userId,
      type,
      frequency: {
        interval: 'days',
        value: type === 'daily' ? 1 : 7,
        time_of_day: '09:00',
      },
      title: `Your ${type} TapTap digest`,
      summary: `${digestNotifications.length} updates from your TapTap community`,
      sections: this.groupNotificationsForDigest(digestNotifications),
      channels: ['email'],
      scheduled_at: Date.now(),
      notification_ids: digestNotifications.map(n => n.id),
      notification_count: digestNotifications.length,
      created_at: Date.now(),
    };

    this.digests.set(digest.id, digest);
    
    // Send digest as notification
    await this.send({
      type: 'newsletter',
      category: 'system',
      priority: 'normal',
      title: digest.title,
      message: digest.summary,
      user_id: userId,
      channels: digest.channels.map(type => ({
        type: type as any,
        enabled: true,
        config: {},
        delivery_status: 'pending',
      })),
      actions: [{
        id: 'view_digest',
        label: 'View Full Digest',
        type: 'link',
        action: `/notifications/digest/${digest.id}`,
        style: 'primary',
      }],
      source: 'digest',
      source_id: digest.id,
      tags: ['digest', type],
      custom_data: { digest_id: digest.id },
    });

    console.log(`${type} digest generated for user: ${userId}`);
    return digest.id;
  }

  // Private methods
  private async applyPreferences(notification: Notification): Promise<Notification | null> {
    const preferences = this.getPreferences(notification.user_id);
    
    if (!preferences.enabled) {
      return null;
    }

    // Check quiet hours
    if (this.isQuietHours(preferences)) {
      notification.scheduled_at = this.getNextAvailableTime(preferences);
    }

    // Filter channels based on preferences
    const allowedChannels = notification.channels.filter(channel => {
      const channelPref = preferences.channels[channel.type];
      return channelPref?.enabled && this.meetsPriorityThreshold(notification.priority, channelPref.priority_threshold);
    });

    if (allowedChannels.length === 0) {
      return null;
    }

    notification.channels = allowedChannels;
    return notification;
  }

  private async enqueueNotification(notification: Notification): Promise<void> {
    const queueId = this.getQueueId(notification.priority);
    let queue = this.queues.get(queueId);

    if (!queue) {
      queue = {
        id: queueId,
        priority: this.getPriorityValue(notification.priority),
        notifications: [],
        status: 'idle',
        processed_count: 0,
        failed_count: 0,
        rate_limit: 10, // notifications per second
        burst_limit: 50,
        current_burst: 0,
        retry_attempts: 0,
        max_retries: 3,
        retry_delay: 5000,
        created_at: Date.now(),
      };
      this.queues.set(queueId, queue);
    }

    queue.notifications.push({
      notification,
      priority: this.getPriorityValue(notification.priority),
      scheduled_at: notification.scheduled_at || Date.now(),
      attempts: 0,
    });

    // Sort by priority and scheduled time
    queue.notifications.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return a.scheduled_at - b.scheduled_at;
    });
  }

  private startProcessing(): void {
    this.processingTimer = setInterval(() => {
      this.processQueues();
    }, 1000); // Process every second

    this.digestTimer = setInterval(() => {
      this.processDigests();
    }, 60000); // Check digests every minute
  }

  private async processQueues(): Promise<void> {
    for (const queue of this.queues.values()) {
      if (queue.status === 'processing' || queue.notifications.length === 0) {
        continue;
      }

      queue.status = 'processing';
      
      try {
        await this.processQueue(queue);
      } catch (error) {
        console.error('Queue processing error:', error);
        queue.status = 'error';
      }
    }
  }

  private async processQueue(queue: NotificationQueue): Promise<void> {
    const now = Date.now();
    const readyNotifications = queue.notifications.filter(qn => qn.scheduled_at <= now);
    
    if (readyNotifications.length === 0) {
      queue.status = 'idle';
      return;
    }

    // Process notifications with rate limiting
    const batchSize = Math.min(queue.rate_limit, readyNotifications.length);
    const batch = readyNotifications.slice(0, batchSize);

    for (const queuedNotification of batch) {
      try {
        await this.deliverNotification(queuedNotification.notification);
        queue.processed_count++;
        
        // Remove from queue
        const index = queue.notifications.indexOf(queuedNotification);
        if (index > -1) {
          queue.notifications.splice(index, 1);
        }
      } catch (error) {
        console.error('Notification delivery error:', error);
        queuedNotification.attempts++;
        queuedNotification.last_attempt_at = now;
        queuedNotification.error_message = error instanceof Error ? error.message : 'Unknown error';

        if (queuedNotification.attempts >= queue.max_retries) {
          queue.failed_count++;
          // Remove from queue after max retries
          const index = queue.notifications.indexOf(queuedNotification);
          if (index > -1) {
            queue.notifications.splice(index, 1);
          }
        } else {
          // Schedule retry
          queuedNotification.scheduled_at = now + queue.retry_delay * queuedNotification.attempts;
        }
      }
    }

    queue.status = queue.notifications.length > 0 ? 'idle' : 'idle';
  }

  private async deliverNotification(notification: Notification): Promise<void> {
    notification.delivery_attempts++;
    notification.sent_at = Date.now();

    for (const channel of notification.channels) {
      try {
        await this.deliverToChannel(notification, channel);
        channel.delivery_status = 'sent';
        channel.sent_at = Date.now();
        notification.delivery_status.sent_channels++;
      } catch (error) {
        channel.delivery_status = 'failed';
        channel.error_message = error instanceof Error ? error.message : 'Unknown error';
        notification.delivery_status.failed_channels++;
        notification.delivery_errors.push(`${channel.type}: ${channel.error_message}`);
      }
    }

    // Update overall delivery status
    if (notification.delivery_status.sent_channels > 0) {
      notification.delivery_status.overall_status = 
        notification.delivery_status.failed_channels > 0 ? 'partial' : 'delivered';
    } else {
      notification.delivery_status.overall_status = 'failed';
    }

    this.persistToStorage();
    this.notifySubscribers('sent', notification);

    // Emit event for analytics
    eventBus.emit(EventTypes.NOTIFICATION_SENT, {
      notificationId: notification.id,
      type: notification.type,
      category: notification.category,
      userId: notification.user_id,
      channels: notification.channels.map(c => c.type),
      deliveryStatus: notification.delivery_status.overall_status,
    }, {
      userId: notification.user_id,
      source: 'notification-manager',
    });
  }

  private async deliverToChannel(notification: Notification, channel: NotificationChannel): Promise<void> {
    switch (channel.type) {
      case 'push':
        await this.deliverPushNotification(notification, channel);
        break;
      case 'email':
        await this.deliverEmailNotification(notification, channel);
        break;
      case 'sms':
        await this.deliverSmsNotification(notification, channel);
        break;
      case 'in_app':
        await this.deliverInAppNotification(notification, channel);
        break;
      case 'webhook':
        await this.deliverWebhookNotification(notification, channel);
        break;
      default:
        throw new Error(`Unsupported channel type: ${channel.type}`);
    }
  }

  private async deliverPushNotification(notification: Notification, channel: NotificationChannel): Promise<void> {
    // Mock push notification delivery
    console.log(`Delivering push notification: ${notification.title}`);
    
    // Simulate delivery delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Simulate occasional failures
    if (Math.random() < 0.05) {
      throw new Error('Push notification service unavailable');
    }
  }

  private async deliverEmailNotification(notification: Notification, channel: NotificationChannel): Promise<void> {
    // Mock email delivery
    console.log(`Delivering email notification: ${notification.title}`);
    
    await new Promise(resolve => setTimeout(resolve, 200));
    
    if (Math.random() < 0.02) {
      throw new Error('Email service rate limit exceeded');
    }
  }

  private async deliverSmsNotification(notification: Notification, channel: NotificationChannel): Promise<void> {
    // Mock SMS delivery
    console.log(`Delivering SMS notification: ${notification.title}`);
    
    await new Promise(resolve => setTimeout(resolve, 150));
    
    if (Math.random() < 0.03) {
      throw new Error('SMS delivery failed');
    }
  }

  private async deliverInAppNotification(notification: Notification, channel: NotificationChannel): Promise<void> {
    // In-app notifications are delivered immediately
    console.log(`Delivering in-app notification: ${notification.title}`);
    this.notifySubscribers('received', notification);
  }

  private async deliverWebhookNotification(notification: Notification, channel: NotificationChannel): Promise<void> {
    // Mock webhook delivery
    console.log(`Delivering webhook notification: ${notification.title}`);
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (Math.random() < 0.01) {
      throw new Error('Webhook endpoint unreachable');
    }
  }

  private processDigests(): void {
    // Check for scheduled digests
    const now = Date.now();
    
    // This would typically check a schedule and generate digests
    // For demo purposes, we'll skip automatic digest generation
  }

  private notifySubscribers(event: string, notification: Notification): void {
    const userSubscribers = this.subscribers.get(notification.user_id);
    if (userSubscribers) {
      userSubscribers.forEach(callback => {
        try {
          callback(notification);
        } catch (error) {
          console.error('Subscriber callback error:', error);
        }
      });
    }
  }

  private isQuietHours(preferences: NotificationPreferences): boolean {
    if (!preferences.quiet_hours.enabled) {
      return false;
    }

    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay();

    if (!preferences.quiet_hours.days.includes(currentDay)) {
      return false;
    }

    const startHour = parseInt(preferences.quiet_hours.start_time.split(':')[0]);
    const endHour = parseInt(preferences.quiet_hours.end_time.split(':')[0]);

    if (startHour <= endHour) {
      return currentHour >= startHour && currentHour < endHour;
    } else {
      return currentHour >= startHour || currentHour < endHour;
    }
  }

  private getNextAvailableTime(preferences: NotificationPreferences): number {
    const now = new Date();
    const endHour = parseInt(preferences.quiet_hours.end_time.split(':')[0]);
    const endMinute = parseInt(preferences.quiet_hours.end_time.split(':')[1]);

    const nextAvailable = new Date(now);
    nextAvailable.setHours(endHour, endMinute, 0, 0);

    if (nextAvailable <= now) {
      nextAvailable.setDate(nextAvailable.getDate() + 1);
    }

    return nextAvailable.getTime();
  }

  private meetsPriorityThreshold(priority: string, threshold: string): boolean {
    const priorityValues = { low: 1, normal: 2, high: 3, urgent: 4 };
    return priorityValues[priority as keyof typeof priorityValues] >= priorityValues[threshold as keyof typeof priorityValues];
  }

  private getQueueId(priority: string): string {
    return `queue_${priority}`;
  }

  private getPriorityValue(priority: string): number {
    const values = { low: 1, normal: 2, high: 3, urgent: 4 };
    return values[priority as keyof typeof values] || 2;
  }

  private renderTemplate(template: string, variables: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] || match;
    });
  }

  private getDefaultChannels(): NotificationChannel[] {
    return [
      {
        type: 'in_app',
        enabled: true,
        config: { display_duration: 5000, position: 'top', style: 'toast' },
        delivery_status: 'pending',
      },
      {
        type: 'push',
        enabled: true,
        config: { sound: 'default', badge_count: 1 },
        delivery_status: 'pending',
      },
    ];
  }

  private groupNotificationsForDigest(notifications: Notification[]): any[] {
    // Group notifications by category for digest
    const groups = notifications.reduce((acc, notification) => {
      if (!acc[notification.category]) {
        acc[notification.category] = [];
      }
      acc[notification.category].push(notification);
      return acc;
    }, {} as Record<string, Notification[]>);

    return Object.entries(groups).map(([category, notifications]) => ({
      title: this.getCategoryDisplayName(category),
      type: 'notifications',
      notifications,
      summary_text: `${notifications.length} ${category} update${notifications.length > 1 ? 's' : ''}`,
    }));
  }

  private getCategoryDisplayName(category: string): string {
    const displayNames = {
      social: 'Social Activity',
      music: 'Music Updates',
      battle: 'Battle Results',
      achievement: 'Achievements',
      system: 'System Updates',
      security: 'Security Alerts',
      marketing: 'Promotions',
    };
    return displayNames[category as keyof typeof displayNames] || category;
  }

  private initializeDefaultTemplates(): void {
    // Like notification template
    this.createTemplate({
      name: 'Track Like',
      type: 'like',
      category: 'social',
      title_template: '{{user_name}} liked your track',
      message_template: '{{user_name}} liked "{{track_title}}"',
      summary_template: 'New like on {{track_title}}',
      variables: [
        { name: 'user_name', type: 'string', required: true, description: 'Name of the user who liked' },
        { name: 'track_title', type: 'string', required: true, description: 'Title of the liked track' },
      ],
      localizations: {},
      is_active: true,
    });

    // Battle result template
    this.createTemplate({
      name: 'Battle Result',
      type: 'battle_result',
      category: 'battle',
      title_template: 'Battle result: {{result}}',
      message_template: 'Your track "{{track_title}}" {{result}} in the battle against {{opponent_name}}',
      summary_template: 'Battle {{result}}',
      variables: [
        { name: 'result', type: 'string', required: true, description: 'Battle result (won/lost)' },
        { name: 'track_title', type: 'string', required: true, description: 'Your track title' },
        { name: 'opponent_name', type: 'string', required: true, description: 'Opponent name' },
      ],
      localizations: {},
      is_active: true,
    });
  }

  private initializeDefaultPreferences(): void {
    if (this.userId) {
      const defaultPrefs = this.getDefaultPreferences(this.userId);
      this.preferences.set(this.userId, defaultPrefs);
    }
  }

  private getDefaultPreferences(userId: string): NotificationPreferences {
    return {
      user_id: userId,
      enabled: true,
      quiet_hours: {
        enabled: true,
        start_time: '22:00',
        end_time: '08:00',
        timezone: 'UTC',
        days: [0, 1, 2, 3, 4, 5, 6],
        emergency_override: true,
      },
      frequency_limit: {
        max_per_hour: 10,
        max_per_day: 50,
        burst_limit: 5,
        cooldown_period: 300,
      },
      channels: {
        push: { enabled: true, priority_threshold: 'normal' },
        email: { enabled: true, priority_threshold: 'normal' },
        sms: { enabled: false, priority_threshold: 'high' },
        in_app: { enabled: true, priority_threshold: 'low' },
        webhook: { enabled: false, priority_threshold: 'normal' },
      },
      types: {
        like: { enabled: true, channels: ['in_app', 'push'], priority: 'low', grouping: true, delay: 0 },
        comment: { enabled: true, channels: ['in_app', 'push'], priority: 'normal', grouping: false, delay: 0 },
        follow: { enabled: true, channels: ['in_app', 'push'], priority: 'normal', grouping: true, delay: 0 },
        battle_result: { enabled: true, channels: ['in_app', 'push', 'email'], priority: 'high', grouping: false, delay: 0 },
        achievement_unlocked: { enabled: true, channels: ['in_app', 'push'], priority: 'normal', grouping: false, delay: 0 },
      } as any,
      categories: {
        social: { enabled: true, channels: ['in_app', 'push'], priority_threshold: 'low', batch_delivery: true, digest_frequency: 'daily' },
        music: { enabled: true, channels: ['in_app', 'push'], priority_threshold: 'normal', batch_delivery: false },
        battle: { enabled: true, channels: ['in_app', 'push', 'email'], priority_threshold: 'normal', batch_delivery: false },
        achievement: { enabled: true, channels: ['in_app', 'push'], priority_threshold: 'normal', batch_delivery: true },
        system: { enabled: true, channels: ['in_app', 'email'], priority_threshold: 'high', batch_delivery: false },
        security: { enabled: true, channels: ['in_app', 'push', 'email'], priority_threshold: 'urgent', batch_delivery: false },
        marketing: { enabled: false, channels: ['email'], priority_threshold: 'low', batch_delivery: true, digest_frequency: 'weekly' },
      },
      grouping_enabled: true,
      smart_delivery: true,
      priority_override: false,
      updated_at: Date.now(),
      version: 1,
    };
  }

  private generateId(): string {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Storage methods
  private async persistToStorage(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      const data = {
        notifications: Array.from(this.notifications.entries()),
        preferences: Array.from(this.preferences.entries()),
        templates: Array.from(this.templates.entries()),
        digests: Array.from(this.digests.entries()),
      };

      localStorage.setItem(`taptap_notifications_${this.userId || 'anonymous'}`, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to persist notification data:', error);
    }
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(`taptap_notifications_${this.userId || 'anonymous'}`);
      if (stored) {
        const data = JSON.parse(stored);
        
        this.notifications = new Map(data.notifications || []);
        this.preferences = new Map(data.preferences || []);
        this.templates = new Map(data.templates || []);
        this.digests = new Map(data.digests || []);

        console.log(`Notification data loaded: ${this.notifications.size} notifications, ${this.templates.size} templates`);
      }
    } catch (error) {
      console.error('Failed to load notification data:', error);
    }
  }

  // Cleanup
  destroy(): void {
    if (this.processingTimer) {
      clearInterval(this.processingTimer);
    }
    
    if (this.digestTimer) {
      clearInterval(this.digestTimer);
    }

    this.persistToStorage();
  }
}
