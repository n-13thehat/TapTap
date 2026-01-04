/**
 * Workflow Management API Routes
 * Handles CRUD operations for agent workflows
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { agentRegistry, agentExecutor } from "@/lib/agents/executor";
import { AgentParser } from "@/lib/agents/parser";
import { agentBus, AgentEventTypes } from "@/lib/agents/AgentBus";
import { ValidationError, NotFoundError, ConflictError } from "@/lib/errors/AppError";

const parser = AgentParser.getInstance();

// ============================================================================
// Request Schemas
// ============================================================================

const CreateWorkflowSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  version: z.string().default('1.0.0'),
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
  })),
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

const QuerySchema = z.object({
  filter: z.string().optional(),
  sort: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

// ============================================================================
// GET /api/workflows - List all workflows
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = QuerySchema.parse(Object.fromEntries(searchParams));
    
    // Build where clause for filtering
    const where: any = {};
    if (query.filter) {
      const filters = query.filter.split(',');
      for (const filter of filters) {
        const [key, value] = filter.split(':');
        if (key && value) {
          if (key === 'name' || key === 'description') {
            where[key] = { contains: value, mode: 'insensitive' };
          } else if (key === 'version') {
            where[key] = value;
          } else if (key === 'tag') {
            where.meta = {
              path: ['tags'],
              array_contains: [value],
            };
          }
        }
      }
    }

    // Build orderBy clause
    const orderBy: any = {};
    if (query.sort) {
      const [field, direction] = query.sort.split(':');
      if (field && ['name', 'version', 'createdAt', 'updatedAt'].includes(field)) {
        orderBy[field] = direction === 'desc' ? 'desc' : 'asc';
      }
    } else {
      orderBy.name = 'asc';
    }

    // Fetch workflows from database
    const [workflows, total] = await Promise.all([
      prisma.workflow.findMany({
        where,
        include: {
          steps: {
            orderBy: { order: 'asc' },
          },
        },
        orderBy,
        take: query.limit,
        skip: query.offset,
      }),
      prisma.workflow.count({ where }),
    ]);

    // Get runtime information
    const registeredWorkflows = new Set(
      agentRegistry.getAllWorkflows().map(workflow => workflow.name)
    );
    const activeExecutions = agentExecutor.getActiveExecutions();

    const runtimeIndex = activeExecutions.reduce<Record<string, { activeRuns: number; lastExecuted: number | null }>>(
      (acc, exec) => {
        if (!exec.workflowName) return acc;
        const entry = acc[exec.workflowName] ?? { activeRuns: 0, lastExecuted: null };
        entry.activeRuns += 1;
        entry.lastExecuted = entry.lastExecuted === null
          ? exec.startTime
          : Math.max(entry.lastExecuted, exec.startTime);
        acc[exec.workflowName] = entry;
        return acc;
      },
      {}
    );
    
    // Enhance workflows with runtime data
    const enhancedWorkflows = workflows.map(workflow => {
      const stats = runtimeIndex[workflow.name];
      return {
        ...workflow,
        runtime: {
          registered: registeredWorkflows.has(workflow.name),
          activeRuns: stats?.activeRuns ?? 0,
          lastExecuted: stats?.lastExecuted ?? null,
        },
      };
    });

    return NextResponse.json({
      success: true,
      data: enhancedWorkflows,
      pagination: {
        total,
        limit: query.limit,
        offset: query.offset,
        hasMore: query.offset + query.limit < total,
      },
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error("Error fetching workflows:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: "Invalid query parameters",
        details: error.errors,
        timestamp: new Date().toISOString(),
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: false,
      error: "Failed to fetch workflows",
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

// ============================================================================
// POST /api/workflows - Create a new workflow
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const workflowData = CreateWorkflowSchema.parse(body);
    
    // Check if workflow already exists
    const existingWorkflow = await prisma.workflow.findUnique({
      where: { name: workflowData.name },
    });
    
    if (existingWorkflow) {
      throw new ConflictError(`Workflow '${workflowData.name}' already exists`);
    }

    // Validate workflow
    const validation = parser.validateWorkflow(workflowData);
    if (!validation.valid) {
      throw new ValidationError(`Workflow validation failed: ${validation.errors.join(', ')}`);
    }

    // Validate that all referenced agents exist
    const referencedAgents = workflowData.steps.map(step => step.agent);
    const uniqueAgents = [...new Set(referencedAgents)];
    
    for (const agentName of uniqueAgents) {
      const agent = await prisma.agent.findUnique({ where: { name: agentName } });
      if (!agent) {
        throw new ValidationError(`Referenced agent '${agentName}' does not exist`);
      }
    }

    // Convert to database format
    const dbFormat = parser.workflowToDatabaseFormat(workflowData);
    
    // Create workflow in database
    const workflow = await prisma.$transaction(async (tx) => {
      // Create main workflow record
      const newWorkflow = await tx.workflow.create({
        data: {
          name: dbFormat.name,
          description: dbFormat.description,
          version: dbFormat.version,
          meta: dbFormat.meta,
        },
      });

      // Create workflow steps
      if (dbFormat.steps.length > 0) {
        await tx.workflowStep.createMany({
          data: dbFormat.steps.map((step: any) => ({
            workflowId: newWorkflow.id,
            order: step.order,
            agentName: step.agentName,
            action: step.action,
            inputs: step.inputs,
            outputs: step.outputs,
            meta: step.meta,
          })),
        });
      }
      
      return newWorkflow;
    });

    // Register workflow in runtime registry
    agentRegistry.registerWorkflow(workflowData);

    // Emit workflow creation event
    await agentBus.emitAgentEvent({
      type: 'workflow.created',
      agentId: 'system',
      agentName: 'WorkflowManager',
      data: {
        workflow: {
          id: workflow.id,
          name: workflow.name,
          version: workflow.version,
          steps: workflowData.steps.length,
        },
        source: 'api',
      },
    });

    // Fetch the complete workflow with steps
    const completeWorkflow = await prisma.workflow.findUnique({
      where: { id: workflow.id },
      include: {
        steps: {
          orderBy: { order: 'asc' },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...completeWorkflow,
        runtime: {
          registered: true,
          activeRuns: 0,
          lastExecuted: null,
        },
      },
      timestamp: new Date().toISOString(),
    }, { status: 201 });
    
  } catch (error) {
    console.error("Error creating workflow:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: "Invalid workflow data",
        details: error.errors,
        timestamp: new Date().toISOString(),
      }, { status: 400 });
    }
    
    if (error instanceof ValidationError || error instanceof ConflictError) {
      return NextResponse.json({
        success: false,
        error: error.message,
        code: error.code,
        timestamp: new Date().toISOString(),
      }, { status: error.statusCode });
    }
    
    return NextResponse.json({
      success: false,
      error: "Failed to create workflow",
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
