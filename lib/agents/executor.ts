/**
 * Agent Execution Engine - Executes agent workflows and actions
 */

import { z } from 'zod';
import { agentBus, AgentEventTypes, AgentCommandTypes } from './AgentBus';
import type { AgentProfile, Workflow, WorkflowStep } from './parser';
import type { UUID } from '../../types/global';

// ============================================================================
// Execution Context Types
// ============================================================================

export interface ExecutionContext {
  id: string;
  userId?: UUID;
  sessionId?: string;
  workflowId?: string;
  stepId?: string;
  correlationId?: string;
  variables: Record<string, any>;
  metadata: Record<string, any>;
  startTime: number;
  timeout?: number;
  retries?: number;
  priority?: 'low' | 'normal' | 'high' | 'critical';
}

export interface AgentAction {
  name: string;
  description?: string;
  inputs: Record<string, any>;
  outputs?: Record<string, any>;
  handler: (context: ExecutionContext, inputs: Record<string, any>) => Promise<any>;
  timeout?: number;
  retries?: number;
  validation?: z.ZodSchema;
}

export interface ExecutionResult {
  success: boolean;
  result?: any;
  error?: string;
  executionTime: number;
  retryCount: number;
  metadata?: Record<string, any>;
}

export interface WorkflowExecutionState {
  id: string;
  workflowName: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  currentStep: number;
  totalSteps: number;
  context: ExecutionContext;
  results: Record<string, any>;
  errors: string[];
  startTime: number;
  endTime?: number;
  executionTime?: number;
}

// ============================================================================
// Agent Registry
// ============================================================================

export class AgentRegistry {
  private static instance: AgentRegistry;
  private agents: Map<string, AgentProfile>;
  private actions: Map<string, Map<string, AgentAction>>;
  private workflows: Map<string, Workflow>;

  constructor() {
    this.agents = new Map();
    this.actions = new Map();
    this.workflows = new Map();
  }

  static getInstance(): AgentRegistry {
    if (!AgentRegistry.instance) {
      AgentRegistry.instance = new AgentRegistry();
    }
    return AgentRegistry.instance;
  }

  /**
   * Register an agent
   */
  registerAgent(agent: AgentProfile): void {
    this.agents.set(agent.name, agent);
    
    // Initialize actions map for this agent
    if (!this.actions.has(agent.name)) {
      this.actions.set(agent.name, new Map());
    }

    // Emit registration event
    agentBus.emitAgentEvent({
      type: AgentEventTypes.AGENT_STARTED,
      agentId: agent.name,
      agentName: agent.name,
      data: {
        agent: {
          name: agent.name,
          role: agent.role,
          version: agent.version,
        }
      },
    });
  }

  /**
   * Unregister an agent
   */
  unregisterAgent(agentName: string): boolean {
    const agent = this.agents.get(agentName);
    if (!agent) return false;

    this.agents.delete(agentName);
    this.actions.delete(agentName);

    // Emit unregistration event
    agentBus.emitAgentEvent({
      type: AgentEventTypes.AGENT_STOPPED,
      agentId: agentName,
      agentName: agentName,
      data: {
        reason: 'unregistered'
      },
    });

    return true;
  }

  /**
   * Get an agent by name
   */
  getAgent(agentName: string): AgentProfile | undefined {
    return this.agents.get(agentName);
  }

  /**
   * Get all registered agents
   */
  getAllAgents(): AgentProfile[] {
    return Array.from(this.agents.values());
  }

  /**
   * Register an action for an agent
   */
  registerAction(agentName: string, action: AgentAction): void {
    if (!this.actions.has(agentName)) {
      this.actions.set(agentName, new Map());
    }
    
    this.actions.get(agentName)!.set(action.name, action);
  }

  /**
   * Get an action for an agent
   */
  getAction(agentName: string, actionName: string): AgentAction | undefined {
    return this.actions.get(agentName)?.get(actionName);
  }

  /**
   * Get all actions for an agent
   */
  getAgentActions(agentName: string): AgentAction[] {
    const agentActions = this.actions.get(agentName);
    return agentActions ? Array.from(agentActions.values()) : [];
  }

  /**
   * Register a workflow
   */
  registerWorkflow(workflow: Workflow): void {
    this.workflows.set(workflow.name, workflow);
  }

  /**
   * Get a workflow by name
   */
  getWorkflow(workflowName: string): Workflow | undefined {
    return this.workflows.get(workflowName);
  }

  /**
   * Get all registered workflows
   */
  getAllWorkflows(): Workflow[] {
    return Array.from(this.workflows.values());
  }
}

// ============================================================================
// Agent Executor
// ============================================================================

export class AgentExecutor {
  private static instance: AgentExecutor;
  private registry: AgentRegistry;
  private activeExecutions: Map<string, WorkflowExecutionState>;
  private executionHistory: WorkflowExecutionState[];

  constructor() {
    this.registry = AgentRegistry.getInstance();
    this.activeExecutions = new Map();
    this.executionHistory = [];
    this.setupEventHandlers();
  }

  static getInstance(): AgentExecutor {
    if (!AgentExecutor.instance) {
      AgentExecutor.instance = new AgentExecutor();
    }
    return AgentExecutor.instance;
  }

  /**
   * Execute a single agent action
   */
  async executeAction(
    agentName: string,
    actionName: string,
    inputs: Record<string, any>,
    context?: Partial<ExecutionContext>
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    const executionContext: ExecutionContext = {
      id: this.generateId(),
      variables: {},
      metadata: {},
      startTime,
      ...context,
    };

    try {
      // Get agent and action
      const agent = this.registry.getAgent(agentName);
      if (!agent) {
        throw new Error(`Agent '${agentName}' not found`);
      }

      const action = this.registry.getAction(agentName, actionName);
      if (!action) {
        throw new Error(`Action '${actionName}' not found for agent '${agentName}'`);
      }

      // Validate inputs if schema provided
      if (action.validation) {
        try {
          inputs = action.validation.parse(inputs);
        } catch (error) {
          throw new Error(`Input validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Emit action started event
      await agentBus.emitAgentEvent({
        type: AgentEventTypes.AGENT_ACTION_STARTED,
        agentId: agentName,
        agentName: agentName,
        data: {
          action: actionName,
          inputs,
          context: executionContext,
        },
        metadata: {
          workflowId: executionContext.workflowId,
          stepId: executionContext.stepId,
          userId: executionContext.userId,
          sessionId: executionContext.sessionId,
          correlationId: executionContext.correlationId,
        },
      });

      // Execute action with timeout and retries
      const result = await this.executeWithRetries(
        () => action.handler(executionContext, inputs),
        action.retries || 0,
        action.timeout || 30000
      );

      const executionTime = Date.now() - startTime;

      // Emit action completed event
      await agentBus.emitAgentEvent({
        type: AgentEventTypes.AGENT_ACTION_COMPLETED,
        agentId: agentName,
        agentName: agentName,
        data: {
          action: actionName,
          inputs,
          result,
          executionTime,
          context: executionContext,
        },
        metadata: {
          workflowId: executionContext.workflowId,
          stepId: executionContext.stepId,
          userId: executionContext.userId,
          sessionId: executionContext.sessionId,
          correlationId: executionContext.correlationId,
        },
      });

      return {
        success: true,
        result,
        executionTime,
        retryCount: 0,
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Emit action failed event
      await agentBus.emitAgentEvent({
        type: AgentEventTypes.AGENT_ACTION_FAILED,
        agentId: agentName,
        agentName: agentName,
        data: {
          action: actionName,
          inputs,
          error: errorMessage,
          executionTime,
          context: executionContext,
        },
        metadata: {
          workflowId: executionContext.workflowId,
          stepId: executionContext.stepId,
          userId: executionContext.userId,
          sessionId: executionContext.sessionId,
          correlationId: executionContext.correlationId,
        },
      });

      return {
        success: false,
        error: errorMessage,
        executionTime,
        retryCount: 0,
      };
    }
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(
    workflowName: string,
    inputs: Record<string, any> = {},
    context?: Partial<ExecutionContext>
  ): Promise<WorkflowExecutionState> {
    const workflow = this.registry.getWorkflow(workflowName);
    if (!workflow) {
      throw new Error(`Workflow '${workflowName}' not found`);
    }

    const executionId = this.generateId();
    const executionContext: ExecutionContext = {
      id: executionId,
      workflowId: executionId,
      variables: { ...inputs },
      metadata: {},
      startTime: Date.now(),
      ...context,
    };

    const executionState: WorkflowExecutionState = {
      id: executionId,
      workflowName,
      status: 'pending',
      currentStep: 0,
      totalSteps: workflow.steps.length,
      context: executionContext,
      results: {},
      errors: [],
      startTime: Date.now(),
    };

    this.activeExecutions.set(executionId, executionState);

    try {
      // Emit workflow started event
      await agentBus.emitAgentEvent({
        type: AgentEventTypes.WORKFLOW_STARTED,
        agentId: 'system',
        agentName: 'WorkflowExecutor',
        data: {
          workflowName,
          workflowId: executionId,
          inputs,
          totalSteps: workflow.steps.length,
        },
        metadata: {
          workflowId: executionId,
          userId: executionContext.userId,
          sessionId: executionContext.sessionId,
          correlationId: executionContext.correlationId,
        },
      });

      executionState.status = 'running';

      // Execute steps
      if (workflow.parallel) {
        await this.executeStepsParallel(workflow, executionState);
      } else {
        await this.executeStepsSequential(workflow, executionState);
      }

      executionState.status = 'completed';
      executionState.endTime = Date.now();
      executionState.executionTime = executionState.endTime - executionState.startTime;

      // Emit workflow completed event
      await agentBus.emitAgentEvent({
        type: AgentEventTypes.WORKFLOW_COMPLETED,
        agentId: 'system',
        agentName: 'WorkflowExecutor',
        data: {
          workflowName,
          workflowId: executionId,
          results: executionState.results,
          executionTime: executionState.executionTime,
        },
        metadata: {
          workflowId: executionId,
          userId: executionContext.userId,
          sessionId: executionContext.sessionId,
          correlationId: executionContext.correlationId,
        },
      });

    } catch (error) {
      executionState.status = 'failed';
      executionState.endTime = Date.now();
      executionState.executionTime = executionState.endTime - executionState.startTime;
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      executionState.errors.push(errorMessage);

      // Emit workflow failed event
      await agentBus.emitAgentEvent({
        type: AgentEventTypes.WORKFLOW_FAILED,
        agentId: 'system',
        agentName: 'WorkflowExecutor',
        data: {
          workflowName,
          workflowId: executionId,
          error: errorMessage,
          executionTime: executionState.executionTime,
        },
        metadata: {
          workflowId: executionId,
          userId: executionContext.userId,
          sessionId: executionContext.sessionId,
          correlationId: executionContext.correlationId,
        },
      });
    } finally {
      // Move to history and remove from active executions
      this.executionHistory.push({ ...executionState });
      this.activeExecutions.delete(executionId);
    }

    return executionState;
  }

  /**
   * Execute workflow steps sequentially
   */
  private async executeStepsSequential(
    workflow: Workflow,
    executionState: WorkflowExecutionState
  ): Promise<void> {
    for (let i = 0; i < workflow.steps.length; i++) {
      const step = workflow.steps[i];
      executionState.currentStep = i;

      await this.executeWorkflowStep(step, executionState, i);
    }
  }

  /**
   * Execute workflow steps in parallel
   */
  private async executeStepsParallel(
    workflow: Workflow,
    executionState: WorkflowExecutionState
  ): Promise<void> {
    const stepPromises = workflow.steps.map((step, index) =>
      this.executeWorkflowStep(step, executionState, index)
    );

    await Promise.all(stepPromises);
    executionState.currentStep = workflow.steps.length;
  }

  /**
   * Execute a single workflow step
   */
  private async executeWorkflowStep(
    step: WorkflowStep,
    executionState: WorkflowExecutionState,
    stepIndex: number
  ): Promise<void> {
    const stepId = `${executionState.id}-step-${stepIndex}`;
    
    try {
      // Emit step started event
      await agentBus.emitAgentEvent({
        type: AgentEventTypes.WORKFLOW_STEP_STARTED,
        agentId: step.agent,
        agentName: step.agent,
        data: {
          workflowId: executionState.id,
          stepId,
          stepIndex,
          action: step.action,
          inputs: step.inputs,
        },
        metadata: {
          workflowId: executionState.id,
          stepId,
          userId: executionState.context.userId,
          sessionId: executionState.context.sessionId,
          correlationId: executionState.context.correlationId,
        },
      });

      // Prepare step inputs (merge with context variables)
      const stepInputs = {
        ...step.inputs,
        ...this.resolveVariables(step.inputs || {}, executionState.context.variables),
      };

      // Execute the step action
      const result = await this.executeAction(
        step.agent,
        step.action,
        stepInputs,
        {
          ...executionState.context,
          stepId,
          timeout: step.timeout,
          retries: step.retries,
        }
      );

      if (!result.success) {
        throw new Error(result.error || 'Step execution failed');
      }

      // Store step result
      executionState.results[stepId] = result.result;

      // Update context variables with step outputs
      if (step.outputs) {
        for (const [key, value] of Object.entries(step.outputs)) {
          executionState.context.variables[key] = this.resolveValue(value, result.result);
        }
      }

      // Emit step completed event
      await agentBus.emitAgentEvent({
        type: AgentEventTypes.WORKFLOW_STEP_COMPLETED,
        agentId: step.agent,
        agentName: step.agent,
        data: {
          workflowId: executionState.id,
          stepId,
          stepIndex,
          action: step.action,
          result: result.result,
          executionTime: result.executionTime,
        },
        metadata: {
          workflowId: executionState.id,
          stepId,
          userId: executionState.context.userId,
          sessionId: executionState.context.sessionId,
          correlationId: executionState.context.correlationId,
        },
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      executionState.errors.push(`Step ${stepIndex}: ${errorMessage}`);

      // Emit step failed event
      await agentBus.emitAgentEvent({
        type: AgentEventTypes.WORKFLOW_STEP_FAILED,
        agentId: step.agent,
        agentName: step.agent,
        data: {
          workflowId: executionState.id,
          stepId,
          stepIndex,
          action: step.action,
          error: errorMessage,
        },
        metadata: {
          workflowId: executionState.id,
          stepId,
          userId: executionState.context.userId,
          sessionId: executionState.context.sessionId,
          correlationId: executionState.context.correlationId,
        },
      });

      // Handle error based on step configuration
      const onError = step.onError || 'stop';
      
      if (onError === 'stop') {
        throw error;
      } else if (onError === 'continue') {
        // Continue to next step
        return;
      } else if (onError === 'retry') {
        // Retry logic would go here
        throw error;
      } else if (onError === 'fallback' && step.fallback) {
        // Execute fallback action
        await this.executeAction(step.agent, step.fallback, step.inputs || {}, executionState.context);
      }
    }
  }

  /**
   * Get active workflow executions
   */
  getActiveExecutions(): WorkflowExecutionState[] {
    return Array.from(this.activeExecutions.values());
  }

  /**
   * Get execution history
   */
  getExecutionHistory(limit?: number): WorkflowExecutionState[] {
    return limit ? this.executionHistory.slice(-limit) : this.executionHistory;
  }

  /**
   * Cancel a workflow execution
   */
  async cancelExecution(executionId: string): Promise<boolean> {
    const execution = this.activeExecutions.get(executionId);
    if (!execution) {
      return false;
    }

    execution.status = 'cancelled';
    execution.endTime = Date.now();
    execution.executionTime = execution.endTime - execution.startTime;

    // Move to history and remove from active executions
    this.executionHistory.push({ ...execution });
    this.activeExecutions.delete(executionId);

    return true;
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Execute function with retries and timeout
   */
  private async executeWithRetries<T>(
    fn: () => Promise<T>,
    retries: number,
    timeout: number
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await Promise.race([
          fn(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Execution timeout')), timeout)
          ),
        ]);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt < retries) {
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    throw lastError!;
  }

  /**
   * Resolve variables in inputs
   */
  private resolveVariables(inputs: Record<string, any>, variables: Record<string, any>): Record<string, any> {
    const resolved: Record<string, any> = {};

    for (const [key, value] of Object.entries(inputs)) {
      resolved[key] = this.resolveValue(value, variables);
    }

    return resolved;
  }

  /**
   * Resolve a single value with variable substitution
   */
  private resolveValue(value: any, context: Record<string, any>): any {
    if (typeof value === 'string' && value.startsWith('${') && value.endsWith('}')) {
      const varName = value.slice(2, -1);
      return context[varName] ?? value;
    }
    
    if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        return value.map(item => this.resolveValue(item, context));
      } else {
        const resolved: Record<string, any> = {};
        for (const [k, v] of Object.entries(value)) {
          resolved[k] = this.resolveValue(v, context);
        }
        return resolved;
      }
    }

    return value;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Setup event handlers for agent bus
   */
  private setupEventHandlers(): void {
    // Handle agent commands
    agentBus.on('agent:command', async (command) => {
      if (command.type === AgentCommandTypes.EXECUTE_ACTION) {
        const { agentName, actionName, inputs } = command.payload;
        
        try {
          const result = await this.executeAction(agentName, actionName, inputs, {
            correlationId: command.metadata?.correlationId,
            userId: command.metadata?.userId,
            sessionId: command.metadata?.sessionId,
          });

          await agentBus.sendResponse({
            commandId: command.id,
            agentId: command.targetAgent,
            agentName: command.targetAgent,
            success: result.success,
            result: result.result,
            error: result.error,
            metadata: {
              executionTime: result.executionTime,
              retryCount: result.retryCount,
            },
          });
        } catch (error) {
          await agentBus.sendResponse({
            commandId: command.id,
            agentId: command.targetAgent,
            agentName: command.targetAgent,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    });
  }
}

// ============================================================================
// Singleton Exports
// ============================================================================

export const agentRegistry = AgentRegistry.getInstance();
export const agentExecutor = AgentExecutor.getInstance();
