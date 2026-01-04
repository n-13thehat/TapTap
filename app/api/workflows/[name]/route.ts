/**
 * Individual Workflow Management API Routes
 * Handles operations for specific workflows
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { agentRegistry, agentExecutor } from "@/lib/agents/executor";
import { AgentParser } from "@/lib/agents/parser";
import { agentBus, AgentEventTypes } from "@/lib/agents/AgentBus";
import { ValidationError, NotFoundError, ConflictError } from "@/lib/errors/AppError";

const parser = AgentParser.getInstance();

type NameContext = { params: Promise<{ name: string }> };

async function resolveName(context: NameContext) {
  const { name } = await context.params;
  return decodeURIComponent(name);
}

// ============================================================================
// Request Schemas
// ============================================================================

const UpdateWorkflowSchema = z.object({
  description: z.string().optional(),
  version: z.string().optional(),
  steps: z.array(z.object({
    agent: z.string().min(1),
    action: z.string().min(1),
    inputs: z.record(z.any()).optional(),
    outputs: z.record(z.any()).optional(),
    condition: z.string().optional(),
    timeout: z.number().optional(),
    retries: z.number().optional(),
    onError: z.enum(['stop', 'continue', 'retry', 'fallback']).optional(),
    fallback: z.string().optional(),
  })).optional(),
  parallel: z.boolean().optional(),
  timeout: z.number().optional(),
  retries: z.number().optional(),
  triggers: z.array(z.string()).optional(),
  conditions: z.record(z.any()).optional(),
  inputs: z.record(z.any()).optional(),
  outputs: z.record(z.any()).optional(),
  meta: z.record(z.any()).optional(),
  tags: z.array(z.string()).optional(),
  dependencies: z.array(z.string()).optional(),
  requirements: z.record(z.any()).optional(),
});

const ExecuteWorkflowSchema = z.object({
  inputs: z.record(z.any()).optional(),
  timeout: z.number().optional(),
  retries: z.number().optional(),
  priority: z.enum(['low', 'normal', 'high', 'critical']).optional(),
});

// ============================================================================
// GET /api/workflows/[name] - Get workflow details
// ============================================================================

export async function GET(request: NextRequest, context: NameContext) {
  try {
    const name = await resolveName(context);
    const { searchParams } = new URL(request.url);
    const includeRuntime = searchParams.get('runtime') === 'true';
    const includeMetrics = searchParams.get('metrics') === 'true';
    const includeHistory = searchParams.get('history') === 'true';
    
    // Fetch workflow from database
    const workflow = await prisma.workflow.findUnique({
      where: { name },
      include: {
        steps: {
          orderBy: { order: 'asc' },
        },
      },
    });
    
    if (!workflow) {
      throw new NotFoundError(`Workflow '${name}' not found`);
    }

    // Get runtime information if requested
    let runtimeData = null;
    if (includeRuntime) {
      const registeredWorkflow = agentRegistry.getWorkflow(name);
      const activeExecutions = agentExecutor.getActiveExecutions().filter(
        exec => exec.workflowName === name
      );
      
      runtimeData = {
        registered: !!registeredWorkflow,
        activeExecutions: activeExecutions.length,
        executions: activeExecutions.map(exec => ({
          id: exec.id,
          status: exec.status,
          currentStep: exec.currentStep,
          totalSteps: exec.totalSteps,
          startTime: exec.startTime,
          results: exec.results,
          errors: exec.errors,
        })),
        lastExecuted: activeExecutions
          .sort((a, b) => b.startTime - a.startTime)[0]?.startTime || null,
      };
    }

    // Get metrics if requested
    let metricsData = null;
    if (includeMetrics) {
      const workflowEvents = agentBus.getEventHistory().filter(
        event => event.metadata?.workflowId && 
                 event.type.startsWith('workflow.') &&
                 event.data?.workflowName === name
      );
      
      const completedExecutions = workflowEvents.filter(e => e.type === 'workflow.completed');
      const failedExecutions = workflowEvents.filter(e => e.type === 'workflow.failed');
      
      metricsData = {
        totalExecutions: completedExecutions.length + failedExecutions.length,
        successfulExecutions: completedExecutions.length,
        failedExecutions: failedExecutions.length,
        successRate: completedExecutions.length / Math.max(completedExecutions.length + failedExecutions.length, 1),
        averageExecutionTime: completedExecutions
          .reduce((acc, e) => acc + (e.data?.executionTime || 0), 0) / Math.max(completedExecutions.length, 1),
        recentEvents: workflowEvents.slice(-20),
      };
    }

    // Get execution history if requested
    let historyData = null;
    if (includeHistory) {
      const executionHistory = agentExecutor.getExecutionHistory().filter(
        exec => exec.workflowName === name
      );
      
      historyData = {
        totalExecutions: executionHistory.length,
        recentExecutions: executionHistory.slice(-50).map(exec => ({
          id: exec.id,
          status: exec.status,
          startTime: exec.startTime,
          endTime: exec.endTime,
          executionTime: exec.executionTime,
          currentStep: exec.currentStep,
          totalSteps: exec.totalSteps,
          errors: exec.errors,
          results: Object.keys(exec.results),
        })),
      };
    }
    
    return NextResponse.json({
      success: true,
      data: {
        ...workflow,
        ...(runtimeData && { runtime: runtimeData }),
        ...(metricsData && { metrics: metricsData }),
        ...(historyData && { history: historyData }),
      },
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error("Error fetching workflow:", error);
    
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
      error: "Failed to fetch workflow",
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

// ============================================================================
// POST /api/workflows/[name] - Execute workflow
// ============================================================================

export async function POST(request: NextRequest, context: NameContext) {
  try {
    const name = await resolveName(context);
    const body = await request.json();
    const { inputs = {}, timeout, retries, priority } = ExecuteWorkflowSchema.parse(body);
    
    // Check if workflow exists and is registered
    const workflow = agentRegistry.getWorkflow(name);
    if (!workflow) {
      throw new NotFoundError(`Workflow '${name}' not found or not registered`);
    }

    // Execute the workflow
    const executionState = await agentExecutor.executeWorkflow(
      name,
      inputs,
      {
        timeout,
        retries,
        priority,
        userId: request.headers.get('x-user-id') || undefined,
        sessionId: request.headers.get('x-session-id') || undefined,
        correlationId: request.headers.get('x-correlation-id') || undefined,
      }
    );
    
    return NextResponse.json({
      success: true,
      data: {
        executionId: executionState.id,
        workflowName: executionState.workflowName,
        status: executionState.status,
        currentStep: executionState.currentStep,
        totalSteps: executionState.totalSteps,
        startTime: executionState.startTime,
        endTime: executionState.endTime,
        executionTime: executionState.executionTime,
        results: executionState.results,
        errors: executionState.errors,
        inputs,
      },
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error("Error executing workflow:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: "Invalid execution request",
        details: error.errors,
        timestamp: new Date().toISOString(),
      }, { status: 400 });
    }
    
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
      error: "Failed to execute workflow",
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

// ============================================================================
// PUT /api/workflows/[name] - Update workflow
// ============================================================================

export async function PUT(request: NextRequest, context: NameContext) {
  try {
    const name = await resolveName(context);
    const body = await request.json();
    const updateData = UpdateWorkflowSchema.parse(body);
    
    // Check if workflow exists
    const existingWorkflow = await prisma.workflow.findUnique({
      where: { name },
      include: {
        steps: {
          orderBy: { order: 'asc' },
        },
      },
    });
    
    if (!existingWorkflow) {
      throw new NotFoundError(`Workflow '${name}' not found`);
    }

    // Check if workflow has active executions
    const activeExecutions = agentExecutor.getActiveExecutions().filter(
      exec => exec.workflowName === name
    );
    
    if (activeExecutions.length > 0) {
      return NextResponse.json({
        success: false,
        error: "Cannot update workflow with active executions",
        details: {
          activeExecutions: activeExecutions.length,
          executionIds: activeExecutions.map(exec => exec.id),
        },
        timestamp: new Date().toISOString(),
      }, { status: 409 });
    }

    // Merge with existing data for validation
    const fullWorkflowData = {
      name,
      description: updateData.description || existingWorkflow.description,
      version: updateData.version || existingWorkflow.version,
      steps: updateData.steps || existingWorkflow.steps.map(step => ({
        agent: step.agentName,
        action: step.action,
        inputs: step.inputs,
        outputs: step.outputs,
        ...step.meta,
      })),
      ...updateData,
    };

    // Validate updated workflow
    const validation = parser.validateWorkflow(fullWorkflowData);
    if (!validation.valid) {
      throw new ValidationError(`Workflow validation failed: ${validation.errors.join(', ')}`);
    }

    // Validate that all referenced agents exist
    if (updateData.steps) {
      const referencedAgents = updateData.steps.map(step => step.agent);
      const uniqueAgents = [...new Set(referencedAgents)];
      
      for (const agentName of uniqueAgents) {
        const agent = await prisma.agent.findUnique({ where: { name: agentName } });
        if (!agent) {
          throw new ValidationError(`Referenced agent '${agentName}' does not exist`);
        }
      }
    }

    // Convert to database format
    const dbFormat = parser.workflowToDatabaseFormat(fullWorkflowData);
    
    // Update workflow in database
    const updatedWorkflow = await prisma.$transaction(async (tx) => {
      // Update main workflow record
      const workflow = await tx.workflow.update({
        where: { name },
        data: {
          description: dbFormat.description,
          version: dbFormat.version,
          meta: dbFormat.meta,
        },
      });

      // Update workflow steps if provided
      if (updateData.steps !== undefined) {
        // Delete existing steps
        await tx.workflowStep.deleteMany({ where: { workflowId: workflow.id } });
        
        // Create new steps
        if (dbFormat.steps.length > 0) {
          await tx.workflowStep.createMany({
            data: dbFormat.steps.map((step: any) => ({
              workflowId: workflow.id,
              order: step.order,
              agentName: step.agentName,
              action: step.action,
              inputs: step.inputs,
              outputs: step.outputs,
              meta: step.meta,
            })),
          });
        }
      }
      
      return workflow;
    });

    // Update workflow in runtime registry
    agentRegistry.registerWorkflow(fullWorkflowData);

    // Emit workflow update event
    await agentBus.emitAgentEvent({
      type: 'workflow.updated',
      agentId: 'system',
      agentName: 'WorkflowManager',
      data: {
        workflowName: name,
        updates: updateData,
        version: updatedWorkflow.version,
      },
    });

    // Fetch the complete updated workflow
    const completeWorkflow = await prisma.workflow.findUnique({
      where: { name },
      include: {
        steps: {
          orderBy: { order: 'asc' },
        },
      },
    });
    
    return NextResponse.json({
      success: true,
      data: completeWorkflow,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error("Error updating workflow:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: "Invalid update data",
        details: error.errors,
        timestamp: new Date().toISOString(),
      }, { status: 400 });
    }
    
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      return NextResponse.json({
        success: false,
        error: error.message,
        code: error.code,
        timestamp: new Date().toISOString(),
      }, { status: error.statusCode });
    }
    
    return NextResponse.json({
      success: false,
      error: "Failed to update workflow",
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

// ============================================================================
// DELETE /api/workflows/[name] - Delete workflow
// ============================================================================

export async function DELETE(request: NextRequest, context: NameContext) {
  try {
    const name = await resolveName(context);
    
    // Check if workflow exists
    const existingWorkflow = await prisma.workflow.findUnique({
      where: { name },
    });
    
    if (!existingWorkflow) {
      throw new NotFoundError(`Workflow '${name}' not found`);
    }

    // Check if workflow has active executions
    const activeExecutions = agentExecutor.getActiveExecutions().filter(
      exec => exec.workflowName === name
    );
    
    if (activeExecutions.length > 0) {
      return NextResponse.json({
        success: false,
        error: "Cannot delete workflow with active executions",
        details: {
          activeExecutions: activeExecutions.length,
          executionIds: activeExecutions.map(exec => exec.id),
        },
        timestamp: new Date().toISOString(),
      }, { status: 409 });
    }

    // Delete workflow from database (cascade will handle steps)
    await prisma.workflow.delete({
      where: { name },
    });

    // Emit workflow deletion event
    await agentBus.emitAgentEvent({
      type: 'workflow.deleted',
      agentId: 'system',
      agentName: 'WorkflowManager',
      data: {
        workflowName: name,
        deletedAt: new Date().toISOString(),
      },
    });
    
    return NextResponse.json({
      success: true,
      message: "Workflow deleted successfully",
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error("Error deleting workflow:", error);
    
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
      error: "Failed to delete workflow",
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
