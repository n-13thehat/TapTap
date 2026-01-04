/**
 * Client-side service for sending events to the server-side event sink
 */

import { EventPayload } from '@/lib/eventBus';

export interface EventSinkConfig {
  endpoint: string;
  batchSize: number;
  flushInterval: number;
  maxRetries: number;
  retryDelay: number;
}

export class EventSinkService {
  private config: EventSinkConfig;
  private eventQueue: EventPayload[] = [];
  private flushTimer?: NodeJS.Timeout;
  private isOnline = true;
  private retryQueue: { events: EventPayload[]; retryCount: number }[] = [];
  private disabled = false;
  private authFailed = false;
  private hasWarned = false;

  constructor(config: Partial<EventSinkConfig> = {}) {
    // Allow opt-out in dev without crashing the console
    const disabledViaEnv =
      typeof process !== 'undefined' &&
      process.env.NEXT_PUBLIC_EVENT_SINK_ENABLED === 'false';

    this.config = {
      endpoint: '/api/agent-events',
      batchSize: 50,
      flushInterval: 10000, // 10 seconds
      maxRetries: 3,
      retryDelay: 2000,
      ...config,
    };

    this.disabled = disabledViaEnv;

    // Only initialize timers when enabled
    if (!this.disabled) {
      this.startFlushTimer();
      this.setupNetworkListeners();
      this.loadPersistedEvents();
    }
  }

  /**
   * Add event to the queue for server transmission
   */
  enqueueEvent(event: EventPayload): void {
    if (this.disabled) {
      return;
    }

    this.eventQueue.push(event);
    
    // Persist to localStorage for offline resilience
    this.persistEvents();

    // Immediate flush for high-priority events
    if (this.isHighPriorityEvent(event.type)) {
      this.flush();
    }
  }

  /**
   * Manually flush events to server
   */
  async flush(): Promise<void> {
    if (this.disabled) {
      return;
    }

    if (this.eventQueue.length === 0 && this.retryQueue.length === 0) {
      return;
    }

    if (!this.isOnline) {
      console.log('EventSink: Offline, skipping flush');
      return;
    }

    // Process retry queue first
    await this.processRetryQueue();

    // Process main queue
    if (this.eventQueue.length > 0) {
      const batch = this.eventQueue.splice(0, this.config.batchSize);
      await this.sendBatch(batch);
    }
  }

  /**
   * Send a batch of events to the server
   */
  private async sendBatch(events: EventPayload[], retryCount = 0): Promise<void> {
    const batchId = this.generateBatchId();
    
    try {
      if (this.disabled || this.authFailed) {
        this.clearQueues();
        return;
      }

      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          events,
          batchId,
          clientTimestamp: Date.now(),
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.authFailed = true;
          this.disabled = true;
          this.clearQueues();
          if (!this.hasWarned) {
            console.warn('EventSink: disabling after 401. Set NEXT_PUBLIC_EVENT_SINK_ENABLED=false in dev to silence.');
            this.hasWarned = true;
          }
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log(`EventSink: Successfully sent batch ${batchId} with ${events.length} events`);
        
        // Remove successfully sent events from persistence
        this.removePersistedEvents(events.map(e => e.id));
        
        // Log processing results
        if (result.results) {
          const { processed, failed, skipped, errors } = result.results;
          if (failed > 0 || errors.length > 0) {
            console.warn(`EventSink: Batch ${batchId} had ${failed} failures:`, errors);
          }
          if (skipped > 0) {
            console.log(`EventSink: Batch ${batchId} had ${skipped} skipped events`);
          }
        }
      } else {
        throw new Error(result.error || 'Unknown server error');
      }
    } catch (error) {
      if (!this.hasWarned) {
        console.error(`EventSink: Failed to send batch ${batchId}:`, error);
      }
      
      // Add to retry queue if under retry limit
      if (!this.authFailed && retryCount < this.config.maxRetries) {
        this.retryQueue.push({ events, retryCount: retryCount + 1 });
        console.log(`EventSink: Added batch to retry queue (attempt ${retryCount + 1}/${this.config.maxRetries})`);
      } else {
        if (!this.hasWarned) {
          console.error(`EventSink: Permanently failed to send batch after ${this.config.maxRetries} retries`);
          this.hasWarned = true;
        }
        // Could emit a local error event here
      }
    }
  }

  private clearQueues() {
    this.eventQueue = [];
    this.retryQueue = [];
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('taptap_event_sink_queue');
      }
    } catch {}
  }

  /**
   * Process retry queue with exponential backoff
   */
  private async processRetryQueue(): Promise<void> {
    if (this.retryQueue.length === 0) return;

    const retryItem = this.retryQueue.shift();
    if (!retryItem) return;

    const delay = this.config.retryDelay * Math.pow(2, retryItem.retryCount - 1);
    
    setTimeout(async () => {
      await this.sendBatch(retryItem.events, retryItem.retryCount);
    }, delay);
  }

  /**
   * Start periodic flush timer
   */
  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flush().catch(console.error);
    }, this.config.flushInterval);
  }

  /**
   * Setup network status listeners
   */
  private setupNetworkListeners(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      console.log('EventSink: Back online, resuming event transmission');
      this.isOnline = true;
      this.flush().catch(console.error);
    });

    window.addEventListener('offline', () => {
      console.log('EventSink: Offline, events will be queued');
      this.isOnline = false;
    });

    // Initial online status
    this.isOnline = navigator.onLine;
  }

  /**
   * Persist events to localStorage
   */
  private persistEvents(): void {
    if (typeof window === 'undefined') return;

    try {
      const allEvents = [...this.eventQueue, ...this.retryQueue.flatMap(r => r.events)];
      localStorage.setItem('taptap_event_sink_queue', JSON.stringify(allEvents));
    } catch (error) {
      console.warn('EventSink: Failed to persist events:', error);
    }
  }

  /**
   * Load persisted events from localStorage
   */
  private loadPersistedEvents(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem('taptap_event_sink_queue');
      if (stored) {
        const events = JSON.parse(stored) as EventPayload[];
        this.eventQueue.push(...events);
        console.log(`EventSink: Loaded ${events.length} persisted events`);
      }
    } catch (error) {
      console.warn('EventSink: Failed to load persisted events:', error);
    }
  }

  /**
   * Remove successfully sent events from persistence
   */
  private removePersistedEvents(eventIds: string[]): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem('taptap_event_sink_queue');
      if (stored) {
        const events = JSON.parse(stored) as EventPayload[];
        const filtered = events.filter(event => !eventIds.includes(event.id));
        localStorage.setItem('taptap_event_sink_queue', JSON.stringify(filtered));
      }
    } catch (error) {
      console.warn('EventSink: Failed to remove persisted events:', error);
    }
  }

  /**
   * Check if event is high priority (should be sent immediately)
   */
  private isHighPriorityEvent(eventType: string): boolean {
    const highPriorityEvents = [
      'system.error_occurred',
      'user.signed_in',
      'user.signed_out',
      'wallet.transaction_completed',
      'marketplace.payment_processed',
    ];
    return highPriorityEvents.includes(eventType);
  }

  /**
   * Generate unique batch ID
   */
  private generateBatchId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get queue statistics
   */
  getStats(): {
    queueSize: number;
    retryQueueSize: number;
    isOnline: boolean;
    totalRetryEvents: number;
  } {
    return {
      queueSize: this.eventQueue.length,
      retryQueueSize: this.retryQueue.length,
      isOnline: this.isOnline,
      totalRetryEvents: this.retryQueue.reduce((sum, item) => sum + item.events.length, 0),
    };
  }

  /**
   * Shutdown the service
   */
  shutdown(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    // Final flush
    this.flush().catch(console.error);
  }
}

// Global instance
export const eventSinkService = new EventSinkService();
