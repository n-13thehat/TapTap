/**
 * Agent Bus - Event streaming and communication system for Agents V2
 */

import { EventEmitter } from 'events';
import { z } from 'zod';
import type { UUID } from '../../types/global';

// ============================================================================
// Event Schemas
// ============================================================================

export const AgentEventSchema = z.object({
  id: z.string(),
  type: z.string(),
  agentId: z.string(),
  agentName: z.string(),
  timestamp: z.number(),
  data: z.record(z.any()),
  metadata: z.object({
    workflowId: z.string().optional(),
    stepId: z.string().optional(),
    userId: z.string().optional(),
    sessionId: z.string().optional(),
    correlationId: z.string().optional(),
    retryCount: z.number().optional(),
    priority: z.enum(['low', 'normal', 'high', 'critical']).optional(),
    source: z.string().optional(),
    version: z.string().optional(),
  }).optional(),
});

export const AgentCommandSchema = z.object({
  id: z.string(),
  type: z.string(),
  targetAgent: z.string(),
  action: z.string(),
  payload: z.record(z.any()),
  timestamp: z.number(),
  metadata: z.object({
    workflowId: z.string().optional(),
    stepId: z.string().optional(),
    userId: z.string().optional(),
    sessionId: z.string().optional(),
    correlationId: z.string().optional(),
    timeout: z.number().optional(),
    retries: z.number().optional(),
    priority: z.enum(['low', 'normal', 'high', 'critical']).optional(),
    source: z.string().optional(),
  }).optional(),
});

export const AgentResponseSchema = z.object({
  id: z.string(),
  commandId: z.string(),
  agentId: z.string(),
  agentName: z.string(),
  success: z.boolean(),
  result: z.any().optional(),
  error: z.string().optional(),
  timestamp: z.number(),
  metadata: z.object({
    executionTime: z.number().optional(),
    retryCount: z.number().optional(),
    workflowId: z.string().optional(),
    stepId: z.string().optional(),
  }).optional(),
});

export type AgentEvent = z.infer<typeof AgentEventSchema>;
export type AgentCommand = z.infer<typeof AgentCommandSchema>;
export type AgentResponse = z.infer<typeof AgentResponseSchema>;

// ============================================================================
// Event Types
// ============================================================================

export const AgentEventTypes = {
  // Agent lifecycle
  AGENT_STARTED: 'agent.started',
  AGENT_STOPPED: 'agent.stopped',
  AGENT_ERROR: 'agent.error',
  AGENT_HEARTBEAT: 'agent.heartbeat',
  
  // Workflow events
  WORKFLOW_STARTED: 'workflow.started',
  WORKFLOW_COMPLETED: 'workflow.completed',
  WORKFLOW_FAILED: 'workflow.failed',
  WORKFLOW_STEP_STARTED: 'workflow.step.started',
  WORKFLOW_STEP_COMPLETED: 'workflow.step.completed',
  WORKFLOW_STEP_FAILED: 'workflow.step.failed',
  
  // Agent actions
  AGENT_ACTION_STARTED: 'agent.action.started',
  AGENT_ACTION_COMPLETED: 'agent.action.completed',
  AGENT_ACTION_FAILED: 'agent.action.failed',
  
  // Communication
  AGENT_MESSAGE_SENT: 'agent.message.sent',
  AGENT_MESSAGE_RECEIVED: 'agent.message.received',
  AGENT_HANDOFF_INITIATED: 'agent.handoff.initiated',
  AGENT_HANDOFF_COMPLETED: 'agent.handoff.completed',
  
  // Performance
  AGENT_PERFORMANCE_METRIC: 'agent.performance.metric',
  AGENT_KPI_UPDATED: 'agent.kpi.updated',
  AGENT_EVAL_COMPLETED: 'agent.eval.completed',
  
  // System events
  SYSTEM_HEALTH_CHECK: 'system.health.check',
  SYSTEM_RESOURCE_USAGE: 'system.resource.usage',
  SYSTEM_ERROR: 'system.error',
} as const;

export const AgentCommandTypes = {
  // Basic commands
  START: 'start',
  STOP: 'stop',
  RESTART: 'restart',
  PAUSE: 'pause',
  RESUME: 'resume',
  
  // Action commands
  EXECUTE_ACTION: 'execute.action',
  EXECUTE_WORKFLOW: 'execute.workflow',
  EXECUTE_STEP: 'execute.step',
  
  // Communication commands
  SEND_MESSAGE: 'send.message',
  HANDOFF: 'handoff',
  
  // Configuration commands
  UPDATE_CONFIG: 'update.config',
  RELOAD_CONFIG: 'reload.config',
  
  // Monitoring commands
  GET_STATUS: 'get.status',
  GET_METRICS: 'get.metrics',
  HEALTH_CHECK: 'health.check',
} as const;

// ============================================================================
// Agent Bus Interface
// ============================================================================

export interface AgentBusOptions {
  maxListeners?: number;
  enableMetrics?: boolean;
  enableLogging?: boolean;
  retentionPeriod?: number; // milliseconds
  batchSize?: number;
  flushInterval?: number; // milliseconds
}

export interface AgentBusMetrics {
  eventsEmitted: number;
  eventsProcessed: number;
  commandsSent: number;
  commandsProcessed: number;
  responsesReceived: number;
  errors: number;
  activeAgents: number;
  activeWorkflows: number;
  averageResponseTime: number;
  uptime: number;
}

export interface AgentSubscription {
  id: string;
  agentId: string;
  eventTypes: string[];
  handler: (event: AgentEvent) => Promise<void> | void;
  filter?: (event: AgentEvent) => boolean;
  priority?: number;
}

// ============================================================================
// Agent Bus Implementation
// ============================================================================

export class AgentBus extends EventEmitter {
  private static instance: AgentBus;
  private options: Required<AgentBusOptions>;
  private metrics: AgentBusMetrics;
  private subscriptions: Map<string, AgentSubscription>;
  private eventHistory: AgentEvent[];
  private commandHistory: AgentCommand[];
  private responseHistory: AgentResponse[];
  private startTime: number;
  private flushTimer?: NodeJS.Timeout;
  private eventBuffer: AgentEvent[];
  private commandBuffer: AgentCommand[];
  private responseBuffer: AgentResponse[];

  constructor(options: AgentBusOptions = {}) {
    super();
    
    this.options = {
      maxListeners: options.maxListeners || 100,
      enableMetrics: options.enableMetrics ?? true,
      enableLogging: options.enableLogging ?? true,
      retentionPeriod: options.retentionPeriod || 24 * 60 * 60 * 1000, // 24 hours
      batchSize: options.batchSize || 100,
      flushInterval: options.flushInterval || 5000, // 5 seconds
    };

    this.setMaxListeners(this.options.maxListeners);
    
    this.metrics = {
      eventsEmitted: 0,
      eventsProcessed: 0,
      commandsSent: 0,
      commandsProcessed: 0,
      responsesReceived: 0,
      errors: 0,
      activeAgents: 0,
      activeWorkflows: 0,
      averageResponseTime: 0,
      uptime: 0,
    };

    this.subscriptions = new Map();
    this.eventHistory = [];
    this.commandHistory = [];
    this.responseHistory = [];
    this.eventBuffer = [];
    this.commandBuffer = [];
    this.responseBuffer = [];
    this.startTime = Date.now();

    this.setupCleanupTimer();
    this.setupFlushTimer();
  }

  static getInstance(options?: AgentBusOptions): AgentBus {
    if (!AgentBus.instance) {
      AgentBus.instance = new AgentBus(options);
    }
    return AgentBus.instance;
  }

  // ============================================================================
  // Event Management
  // ============================================================================

  /**
   * Emit an agent event
   */
  async emitAgentEvent(event: Omit<AgentEvent, 'id' | 'timestamp'>): Promise<void> {
    const fullEvent: AgentEvent = {
      ...event,
      id: this.generateId(),
      timestamp: Date.now(),
    };

    try {
      // Validate event
      AgentEventSchema.parse(fullEvent);

      // Add to buffer
      this.eventBuffer.push(fullEvent);
      
      // Update metrics
      if (this.options.enableMetrics) {
        this.metrics.eventsEmitted++;
      }

      // Emit to subscribers
      this.emit('agent:event', fullEvent);
      this.emit(`agent:event:${fullEvent.type}`, fullEvent);
      this.emit(`agent:${fullEvent.agentId}:event`, fullEvent);

      // Log if enabled
      if (this.options.enableLogging) {
        console.log(`[AgentBus] Event: ${fullEvent.type} from ${fullEvent.agentName}`);
      }

    } catch (error) {
      this.metrics.errors++;
      console.error('[AgentBus] Failed to emit event:', error);
      throw error;
    }
  }

  /**
   * Send a command to an agent
   */
  async sendCommand(command: Omit<AgentCommand, 'id' | 'timestamp'>): Promise<string> {
    const fullCommand: AgentCommand = {
      ...command,
      id: this.generateId(),
      timestamp: Date.now(),
    };

    try {
      // Validate command
      AgentCommandSchema.parse(fullCommand);

      // Add to buffer
      this.commandBuffer.push(fullCommand);
      
      // Update metrics
      if (this.options.enableMetrics) {
        this.metrics.commandsSent++;
      }

      // Emit to target agent
      this.emit('agent:command', fullCommand);
      this.emit(`agent:command:${fullCommand.type}`, fullCommand);
      this.emit(`agent:${fullCommand.targetAgent}:command`, fullCommand);

      // Log if enabled
      if (this.options.enableLogging) {
        console.log(`[AgentBus] Command: ${fullCommand.type} to ${fullCommand.targetAgent}`);
      }

      return fullCommand.id;

    } catch (error) {
      this.metrics.errors++;
      console.error('[AgentBus] Failed to send command:', error);
      throw error;
    }
  }

  /**
   * Send a response to a command
   */
  async sendResponse(response: Omit<AgentResponse, 'id' | 'timestamp'>): Promise<void> {
    const fullResponse: AgentResponse = {
      ...response,
      id: this.generateId(),
      timestamp: Date.now(),
    };

    try {
      // Validate response
      AgentResponseSchema.parse(fullResponse);

      // Add to buffer
      this.responseBuffer.push(fullResponse);
      
      // Update metrics
      if (this.options.enableMetrics) {
        this.metrics.responsesReceived++;
      }

      // Emit to subscribers
      this.emit('agent:response', fullResponse);
      this.emit(`agent:response:${fullResponse.commandId}`, fullResponse);
      this.emit(`agent:${fullResponse.agentId}:response`, fullResponse);

      // Log if enabled
      if (this.options.enableLogging) {
        console.log(`[AgentBus] Response: ${fullResponse.success ? 'SUCCESS' : 'ERROR'} from ${fullResponse.agentName}`);
      }

    } catch (error) {
      this.metrics.errors++;
      console.error('[AgentBus] Failed to send response:', error);
      throw error;
    }
  }

  // ============================================================================
  // Subscription Management
  // ============================================================================

  /**
   * Subscribe to agent events
   */
  subscribe(subscription: Omit<AgentSubscription, 'id'>): string {
    const id = this.generateId();
    const fullSubscription: AgentSubscription = {
      ...subscription,
      id,
    };

    this.subscriptions.set(id, fullSubscription);

    // Set up event listeners
    for (const eventType of subscription.eventTypes) {
      this.on(`agent:event:${eventType}`, async (event: AgentEvent) => {
        try {
          // Apply filter if provided
          if (subscription.filter && !subscription.filter(event)) {
            return;
          }

          // Call handler
          await subscription.handler(event);
          
          if (this.options.enableMetrics) {
            this.metrics.eventsProcessed++;
          }
        } catch (error) {
          this.metrics.errors++;
          console.error(`[AgentBus] Subscription handler error:`, error);
        }
      });
    }

    return id;
  }

  /**
   * Unsubscribe from events
   */
  unsubscribe(subscriptionId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      return false;
    }

    // Remove event listeners
    for (const eventType of subscription.eventTypes) {
      this.removeAllListeners(`agent:event:${eventType}`);
    }

    this.subscriptions.delete(subscriptionId);
    return true;
  }

  /**
   * Get all active subscriptions
   */
  getSubscriptions(): AgentSubscription[] {
    return Array.from(this.subscriptions.values());
  }

  // ============================================================================
  // Command/Response Handling
  // ============================================================================

  /**
   * Wait for a response to a command
   */
  async waitForResponse(commandId: string, timeout: number = 30000): Promise<AgentResponse> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.removeAllListeners(`agent:response:${commandId}`);
        reject(new Error(`Command ${commandId} timed out after ${timeout}ms`));
      }, timeout);

      this.once(`agent:response:${commandId}`, (response: AgentResponse) => {
        clearTimeout(timer);
        resolve(response);
      });
    });
  }

  /**
   * Send command and wait for response
   */
  async sendCommandAndWait(
    command: Omit<AgentCommand, 'id' | 'timestamp'>,
    timeout?: number
  ): Promise<AgentResponse> {
    const commandId = await this.sendCommand(command);
    return this.waitForResponse(commandId, timeout);
  }

  // ============================================================================
  // Metrics and Monitoring
  // ============================================================================

  /**
   * Get current metrics
   */
  getMetrics(): AgentBusMetrics {
    return {
      ...this.metrics,
      uptime: Date.now() - this.startTime,
    };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      eventsEmitted: 0,
      eventsProcessed: 0,
      commandsSent: 0,
      commandsProcessed: 0,
      responsesReceived: 0,
      errors: 0,
      activeAgents: 0,
      activeWorkflows: 0,
      averageResponseTime: 0,
      uptime: 0,
    };
    this.startTime = Date.now();
  }

  /**
   * Get event history
   */
  getEventHistory(limit?: number): AgentEvent[] {
    const events = [...this.eventHistory, ...this.eventBuffer];
    return limit ? events.slice(-limit) : events;
  }

  /**
   * Get command history
   */
  getCommandHistory(limit?: number): AgentCommand[] {
    const commands = [...this.commandHistory, ...this.commandBuffer];
    return limit ? commands.slice(-limit) : commands;
  }

  /**
   * Get response history
   */
  getResponseHistory(limit?: number): AgentResponse[] {
    const responses = [...this.responseHistory, ...this.responseBuffer];
    return limit ? responses.slice(-limit) : responses;
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Setup cleanup timer for old events
   */
  private setupCleanupTimer(): void {
    setInterval(() => {
      const cutoff = Date.now() - this.options.retentionPeriod;
      
      this.eventHistory = this.eventHistory.filter(e => e.timestamp > cutoff);
      this.commandHistory = this.commandHistory.filter(c => c.timestamp > cutoff);
      this.responseHistory = this.responseHistory.filter(r => r.timestamp > cutoff);
    }, 60000); // Clean up every minute
  }

  /**
   * Setup flush timer for buffered events
   */
  private setupFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flushBuffers();
    }, this.options.flushInterval);
  }

  /**
   * Flush buffered events to history
   */
  private flushBuffers(): void {
    if (this.eventBuffer.length > 0) {
      this.eventHistory.push(...this.eventBuffer);
      this.eventBuffer = [];
    }

    if (this.commandBuffer.length > 0) {
      this.commandHistory.push(...this.commandBuffer);
      this.commandBuffer = [];
    }

    if (this.responseBuffer.length > 0) {
      this.responseHistory.push(...this.responseBuffer);
      this.responseBuffer = [];
    }
  }

  /**
   * Shutdown the agent bus
   */
  shutdown(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    
    this.flushBuffers();
    this.removeAllListeners();
    this.subscriptions.clear();
    
    if (this.options.enableLogging) {
      console.log('[AgentBus] Shutdown complete');
    }
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const agentBus = AgentBus.getInstance();
