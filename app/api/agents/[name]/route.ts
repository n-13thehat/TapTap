import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { agentRegistry, agentExecutor } from "@/lib/agents/executor";
import { AgentParser } from "@/lib/agents/parser";
import { agentBus, AgentEventTypes, AgentCommandTypes } from "@/lib/agents/AgentBus";
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

const UpdateAgentSchema = z.object({
  role: z.string().optional(),
  tone: z.string().optional(),
  vibe: z.string().optional(),
  signature: z.string().optional(),
  summary: z.string().optional(),
  version: z.string().optional(),
  tools: z.array(z.string()).optional(),
  datasets: z.array(z.string()).optional(),
  datasources: z.array(z.string()).optional(),
  playbooks: z.array(z.string()).optional(),
  guardrails: z.array(z.string()).optional(),
  handoffs: z.array(z.string()).optional(),
  kpis: z.record(z.string()).optional(),
  evals: z.array(z.string()).optional(),
  cadence: z.object({
    schedule: z.string().optional(),
    triggers: z.array(z.string()).optional(),
    conditions: z.record(z.any()).optional(),
  }).optional(),
  ab_test: z.object({
    enabled: z.boolean().optional(),
    variants: z.array(z.string()).optional(),
    sample: z.number().min(0).max(1).optional(),
    metrics: z.array(z.string()).optional(),
    log: z.string().optional(),
  }).optional(),
  meta: z.record(z.any()).optional(),
  theme: z.record(z.any()).optional(),
  changelog: z.array(z.string()).optional(),
  workflows: z.array(z.string()).optional(),
  inputs: z.record(z.string()).optional(),
  outputs: z.record(z.string()).optional(),
  danger: z.enum(['low', 'med', 'high']).optional(),
  timeout: z.number().optional(),
  retries: z.number().optional(),
  dependencies: z.array(z.string()).optional(),
  requirements: z.record(z.any()).optional(),
});

const ExecuteActionSchema = z.object({
  action: z.string().min(1),
  inputs: z.record(z.any()).optional(),
  timeout: z.number().optional(),
  retries: z.number().optional(),
  priority: z.enum(['low', 'normal', 'high', 'critical']).optional(),
});

// Legacy simulation schema for backward compatibility
const SimulationSchema = z.object({
  feature: z.string().min(1),
  path: z.string().optional(),
  impact: z.enum(['low', 'med', 'high']).optional(),
});

// ============================================================================
// GET /api/agents/[name] - Get agent details
// ============================================================================

export async function GET(request: NextRequest, context: NameContext) {
  try {
    const name = await resolveName(context);
    const { searchParams } = new URL(request.url);
    const includeRuntime = searchParams.get('runtime') === 'true';
    const includeMetrics = searchParams.get('metrics') === 'true';
    const includeHistory = searchParams.get('history') === 'true';

    // Fetch agent from database
    const agent = await prisma.agent.findFirst({
      where: { name },
      include: {
        tools: true,
        datasets: true,
        playbooks: true,
        guardrails: true,
        handoffs: true,
        kpis: true,
        evals: true,
        cadence: true,
        abTest: true,
        prompt: true,
      },
    });

    if (!agent) {
      throw new NotFoundError(`Agent '${name}' not found`);
    }

    // Get runtime information if requested
    let runtimeData = null;
    if (includeRuntime) {
      const registeredAgent = agentRegistry.getAgent(name);
      const activeExecutions = agentExecutor.getActiveExecutions().filter(
        exec => exec.context.metadata?.agentName === name
      );
      const agentActions = agentRegistry.getAgentActions(name);

      runtimeData = {
        registered: !!registeredAgent,
        activeWorkflows: activeExecutions.length,
        availableActions: agentActions.map(action => ({
          name: action.name,
          description: action.description,
          inputs: action.inputs,
          outputs: action.outputs,
        })),
        lastSeen: registeredAgent ? new Date().toISOString() : null,
        executions: activeExecutions.map(exec => ({
          id: exec.id,
          workflowName: exec.workflowName,
          status: exec.status,
          currentStep: exec.currentStep,
          totalSteps: exec.totalSteps,
          startTime: exec.startTime,
        })),
      };
    }

    // Get metrics if requested
    let metricsData = null;
    if (includeMetrics) {
      const busMetrics = agentBus.getMetrics();
      const agentEvents = agentBus.getEventHistory().filter(
        event => event.agentName === name
      );

      metricsData = {
        totalEvents: agentEvents.length,
        recentEvents: agentEvents.slice(-10),
        performance: {
          averageResponseTime: agentEvents
            .filter(e => (e.metadata as any)?.executionTime)
            .reduce((acc, e) => acc + ((e.metadata as any)?.executionTime || 0), 0) / agentEvents.length || 0,
          successRate: agentEvents
            .filter(e => e.type.includes('completed')).length / Math.max(agentEvents.length, 1),
          errorRate: agentEvents
            .filter(e => e.type.includes('failed')).length / Math.max(agentEvents.length, 1),
        },
      };
    }

    // Get execution history if requested
    let historyData = null;
    if (includeHistory) {
      const executionHistory = agentExecutor.getExecutionHistory().filter(
        exec => exec.context.metadata?.agentName === name
      );

      historyData = {
        totalExecutions: executionHistory.length,
        recentExecutions: executionHistory.slice(-20).map(exec => ({
          id: exec.id,
          workflowName: exec.workflowName,
          status: exec.status,
          startTime: exec.startTime,
          endTime: exec.endTime,
          executionTime: exec.executionTime,
          errors: exec.errors,
        })),
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        ...agent,
        ...(runtimeData && { runtime: runtimeData }),
        ...(metricsData && { metrics: metricsData }),
        ...(historyData && { history: historyData }),
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("Error fetching agent:", error);

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
      error: "Failed to fetch agent",
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

// ============================================================================
// POST /api/agents/[name] - Execute agent action or simulation (legacy)
// ============================================================================

export async function POST(request: NextRequest, context: NameContext) {
  try {
    const name = await resolveName(context);
    const body = await request.json();

    // Check if this is a legacy simulation request
    if ('feature' in body) {
      return handleLegacySimulation(name, body);
    }

    // Handle new action execution
    const { action, inputs = {}, timeout, retries, priority } = ExecuteActionSchema.parse(body);

    // Check if agent exists and is registered
    const agent = agentRegistry.getAgent(name);
    if (!agent) {
      throw new NotFoundError(`Agent '${name}' not found or not registered`);
    }

    // Check if action exists
    const agentAction = agentRegistry.getAction(name, action);
    if (!agentAction) {
      throw new NotFoundError(`Action '${action}' not found for agent '${name}'`);
    }

    // Execute the action
    const result = await agentExecutor.executeAction(
      name,
      action,
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
        agent: name,
        action,
        inputs,
        result: result.result,
        executionTime: result.executionTime,
        retryCount: result.retryCount,
        success: result.success,
        error: result.error,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("Error executing agent action:", error);

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
      error: "Failed to execute agent action",
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

// ============================================================================
// PUT /api/agents/[name] - Update agent
// ============================================================================

export async function PUT(request: NextRequest, context: NameContext) {
  try {
    const name = await resolveName(context);
    const body = await request.json();
    const updateData = UpdateAgentSchema.parse(body);

    // Check if agent exists
    const existingAgent = await prisma.agent.findFirst({
      where: { name },
    });

    if (!existingAgent) {
      throw new NotFoundError(`Agent '${name}' not found`);
    }

    // Merge with existing data for validation
    const fullAgentData = {
      name,
      ...existingAgent,
      ...updateData,
    };

    // Validate updated agent profile
    const validation = parser.validateAgentProfile(fullAgentData);
    if (!validation.valid) {
      throw new ValidationError(`Agent validation failed: ${validation.errors.join(', ')}`);
    }

    // Convert to database format
    const dbFormat = parser.toDatabaseFormat(fullAgentData);

    // Update agent in database
    const updatedAgent = await prisma.$transaction(async (tx) => {
      // Update main agent record
      const agent = await tx.agent.update({
        where: { name },
        data: {
          role: dbFormat.role,
          tone: dbFormat.tone,
          vibe: dbFormat.vibe,
          signature: dbFormat.signature,
          summary: dbFormat.summary,
          version: dbFormat.version,
          meta: dbFormat.meta,
          changelog: dbFormat.changelog,
        },
      });

      // Update related records if provided
      if (updateData.tools !== undefined) {
        await tx.agentTool.deleteMany({ where: { agentId: agent.id } });
        if (dbFormat.tools.length > 0) {
          await tx.agentTool.createMany({
            data: dbFormat.tools.map((toolName: string) => ({
              agentId: agent.id,
              name: toolName,
            })),
          });
        }
      }

      // Similar updates for other relations...

      return agent;
    });

    // Update agent in runtime registry
    agentRegistry.registerAgent(fullAgentData);

    // Emit agent update event
    await agentBus.emitAgentEvent({
      type: 'agent.updated',
      agentId: name,
      agentName: name,
      data: {
        updates: updateData,
        version: updatedAgent.version,
      },
    });

    // Fetch the complete updated agent
    const completeAgent = await prisma.agent.findFirst({
      where: { name },
      include: {
        tools: true,
        datasets: true,
        playbooks: true,
        guardrails: true,
        handoffs: true,
        kpis: true,
        evals: true,
        cadence: true,
        abTest: true,
        prompt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: completeAgent,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("Error updating agent:", error);

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
      error: "Failed to update agent",
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

// ============================================================================
// DELETE /api/agents/[name] - Delete agent
// ============================================================================

export async function DELETE(request: NextRequest, context: NameContext) {
  try {
    const name = await resolveName(context);

    // Check if agent exists
    const existingAgent = await prisma.agent.findFirst({
      where: { name },
    });

    if (!existingAgent) {
      throw new NotFoundError(`Agent '${name}' not found`);
    }

    // Check if agent has active executions
    const activeExecutions = agentExecutor.getActiveExecutions().filter(
      exec => exec.context.metadata?.agentName === name
    );

    if (activeExecutions.length > 0) {
      return NextResponse.json({
        success: false,
        error: "Cannot delete agent with active executions",
        details: {
          activeExecutions: activeExecutions.length,
          executionIds: activeExecutions.map(exec => exec.id),
        },
        timestamp: new Date().toISOString(),
      }, { status: 409 });
    }

    // Delete agent from database (cascade will handle related records)
    await prisma.agent.delete({
      where: { name },
    });

    // Unregister agent from runtime registry
    agentRegistry.unregisterAgent(name);

    // Emit agent deletion event
    await agentBus.emitAgentEvent({
      type: AgentEventTypes.AGENT_STOPPED,
      agentId: name,
      agentName: name,
      data: {
        reason: 'deleted',
        deletedAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Agent deleted successfully",
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("Error deleting agent:", error);

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
      error: "Failed to delete agent",
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

// ============================================================================
// Legacy Simulation Handler (Backward Compatibility)
// ============================================================================

async function handleLegacySimulation(agentName: string, body: any) {
  try {
    const { feature, path, impact = 'med' } = SimulationSchema.parse(body);

    // Check if agent exists
    const agent = await prisma.agent.findFirst({ where: { name: agentName } });
    if (!agent) {
      throw new NotFoundError(`Agent '${agentName}' not found`);
    }

    const guardrails: string[] = [];
    if (impact === "high") {
      guardrails.push("High-impact change: default to dry-run unless explicitly forced.");
      guardrails.push("Require review/approval before applying destructive operations.");
    }

    const plan: string[] = [
      "Validate inputs and environment",
      path ? `Resolve scope at ${path}` : "Resolve working scope from repository root",
      `Analyze current code for: ${feature}`,
      "Propose minimal, reversible changes",
      "Typecheck and lint",
      "Run focused tests (and impacted suites)",
      impact === "high" ? "Generate rollback steps and gated apply" : "Apply changes with clear diff",
    ];

    const suggestedCommands: string[] = [
      "pnpm typecheck",
      "pnpm lint",
      "pnpm test",
    ];
    if (path) suggestedCommands.push(`rg -n "${feature.replace(/\"/g, '')}" ${path}`);

    return NextResponse.json({
      ok: true,
      success: true,
      agent: { id: agent.id, name: agent.name, version: agent.version },
      inputs: { feature, impact, path },
      plan,
      guardrails,
      suggestedCommands,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in legacy simulation:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: "Invalid simulation request",
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
      error: "Simulation failed",
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
