/**
 * Individual Execution Management API Routes
 * Handles operations for specific workflow executions
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { agentExecutor } from "@/lib/agents/executor";
import { agentBus, AgentEventTypes } from "@/lib/agents/AgentBus";
import { NotFoundError } from "@/lib/errors/AppError";

type IdContext = { params: Promise<{ id: string }> };

async function resolveId(context: IdContext) {
  const { id } = await context.params;
  return decodeURIComponent(id);
}

// ============================================================================
// Request Schemas
// ============================================================================

const CancelExecutionSchema = z.object({
  reason: z.string().optional(),
});

// ============================================================================
// GET /api/executions/[id] - Get execution details
// ============================================================================

export async function GET(request: NextRequest, context: IdContext) {
  try {
    const id = await resolveId(context);
    const { searchParams } = new URL(request.url);
    const includeEvents = searchParams.get('events') === 'true';
    const includeResults = searchParams.get('results') === 'true';
    
    // Try to find in active executions first
    let execution = agentExecutor.getActiveExecutions().find(exec => exec.id === id);
    let isActive = true;
    
    // If not found in active, check history
    if (!execution) {
      execution = agentExecutor.getExecutionHistory().find(exec => exec.id === id);
      isActive = false;
    }
    
    if (!execution) {
      throw new NotFoundError(`Execution '${id}' not found`);
    }

    // Get related events if requested
    let eventsData = null;
    if (includeEvents) {
      const executionEvents = agentBus.getEventHistory().filter(
        event => event.metadata?.workflowId === id ||
                 event.metadata?.correlationId === execution!.context.correlationId
      );
      
      eventsData = {
        total: executionEvents.length,
        events: executionEvents.map(event => ({
          id: event.id,
          type: event.type,
          agentName: event.agentName,
          timestamp: event.timestamp,
          data: event.data,
          metadata: event.metadata,
        })),
        timeline: executionEvents
          .filter(e => e.type.startsWith('workflow.') || e.type.startsWith('agent.action.'))
          .map(e => ({
            timestamp: e.timestamp,
            type: e.type,
            agent: e.agentName,
            message: generateEventMessage(e),
          })),
      };
    }

    // Format execution data
    const executionData = {
      id: execution.id,
      workflowName: execution.workflowName,
      status: execution.status,
      currentStep: execution.currentStep,
      totalSteps: execution.totalSteps,
      startTime: execution.startTime,
      endTime: execution.endTime,
      executionTime: execution.executionTime,
      isActive,
      context: {
        userId: execution.context.userId,
        sessionId: execution.context.sessionId,
        correlationId: execution.context.correlationId,
        variables: execution.context.variables,
        metadata: execution.context.metadata,
        priority: execution.context.priority,
        timeout: execution.context.timeout,
        retries: execution.context.retries,
      },
      results: includeResults ? execution.results : Object.keys(execution.results),
      errors: execution.errors,
      progress: execution.totalSteps > 0 ? (execution.currentStep / execution.totalSteps) * 100 : 0,
      ...(eventsData && { events: eventsData }),
    };
    
    return NextResponse.json({
      success: true,
      data: executionData,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error("Error fetching execution:", error);
    
    if (error instanceof NotFoundError) {
      return NextResponse.json({
        success: false,
        error: error.message,
        code: error.code,
        timestamp: new Date().toISOString(),
      }, { status: error.statusCode });
    }
    
    return NextResponse.json({
      success: false,
      error: "Failed to fetch execution",
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

// ============================================================================
// DELETE /api/executions/[id] - Cancel execution
// ============================================================================

export async function DELETE(request: NextRequest, context: IdContext) {
  try {
    const id = await resolveId(context);
    
    // Parse request body for cancellation reason
    let reason = 'User requested cancellation';
    try {
      const body = await request.json();
      const { reason: bodyReason } = CancelExecutionSchema.parse(body);
      if (bodyReason) reason = bodyReason;
    } catch {
      // Ignore parsing errors for optional body
    }
    
    // Try to cancel the execution
    const cancelled = await agentExecutor.cancelExecution(id);
    
    if (!cancelled) {
      throw new NotFoundError(`Execution '${id}' not found or already completed`);
    }

    // Emit cancellation event
    await agentBus.emitAgentEvent({
      type: 'workflow.cancelled',
      agentId: 'system',
      agentName: 'ExecutionManager',
      data: {
        executionId: id,
        reason,
        cancelledAt: new Date().toISOString(),
        cancelledBy: request.headers.get('x-user-id') || 'unknown',
      },
      metadata: {
        correlationId: request.headers.get('x-correlation-id') || undefined,
      },
    });
    
    return NextResponse.json({
      success: true,
      message: "Execution cancelled successfully",
      data: {
        executionId: id,
        reason,
        cancelledAt: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error("Error cancelling execution:", error);
    
    if (error instanceof NotFoundError) {
      return NextResponse.json({
        success: false,
        error: error.message,
        code: error.code,
        timestamp: new Date().toISOString(),
      }, { status: error.statusCode });
    }
    
    return NextResponse.json({
      success: false,
      error: "Failed to cancel execution",
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

function generateEventMessage(event: any): string {
  switch (event.type) {
    case AgentEventTypes.WORKFLOW_STARTED:
      return `Workflow started with ${event.data?.totalSteps || 0} steps`;
    case AgentEventTypes.WORKFLOW_COMPLETED:
      return `Workflow completed in ${event.data?.executionTime || 0}ms`;
    case AgentEventTypes.WORKFLOW_FAILED:
      return `Workflow failed: ${event.data?.error || 'Unknown error'}`;
    case AgentEventTypes.WORKFLOW_STEP_STARTED:
      return `Step ${event.data?.stepIndex + 1}: ${event.data?.action} started`;
    case AgentEventTypes.WORKFLOW_STEP_COMPLETED:
      return `Step ${event.data?.stepIndex + 1}: ${event.data?.action} completed`;
    case AgentEventTypes.WORKFLOW_STEP_FAILED:
      return `Step ${event.data?.stepIndex + 1}: ${event.data?.action} failed`;
    case AgentEventTypes.AGENT_ACTION_STARTED:
      return `Action ${event.data?.action} started`;
    case AgentEventTypes.AGENT_ACTION_COMPLETED:
      return `Action ${event.data?.action} completed`;
    case AgentEventTypes.AGENT_ACTION_FAILED:
      return `Action ${event.data?.action} failed`;
    default:
      return event.type.replace(/\./g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
  }
}
