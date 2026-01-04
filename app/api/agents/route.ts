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

const CreateAgentSchema = z.object({
  name: z.string().min(1),
  role: z.string().optional(),
  tone: z.string().optional(),
  vibe: z.string().optional(),
  signature: z.string().optional(),
  summary: z.string().optional(),
  version: z.string().default('2.0.0'),
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

const QuerySchema = z.object({
  include: z.string().optional(),
  filter: z.string().optional(),
  sort: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

// ============================================================================
// GET /api/agents - List all agents
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = QuerySchema.parse(Object.fromEntries(searchParams));

    // Parse include parameter
    const includeRelations = query.include ? query.include.split(',') : [];
    const include: any = {};

    if (includeRelations.includes('tools')) include.tools = true;
    if (includeRelations.includes('datasets')) include.datasets = true;
    if (includeRelations.includes('playbooks')) include.playbooks = true;
    if (includeRelations.includes('guardrails')) include.guardrails = true;
    if (includeRelations.includes('handoffs')) include.handoffs = true;
    if (includeRelations.includes('kpis')) include.kpis = true;
    if (includeRelations.includes('evals')) include.evals = true;
    if (includeRelations.includes('cadence')) include.cadence = true;
    if (includeRelations.includes('abTest')) include.abTest = true;
    if (includeRelations.includes('prompt')) include.prompt = true;
    if (includeRelations.includes('all')) {
      include.tools = true;
      include.datasets = true;
      include.playbooks = true;
      include.guardrails = true;
      include.handoffs = true;
      include.kpis = true;
      include.evals = true;
      include.cadence = true;
      include.abTest = true;
      include.prompt = true;
    }

    // Build where clause for filtering
    const where: any = {};
    if (query.filter) {
      const filters = query.filter.split(',');
      for (const filter of filters) {
        const [key, value] = filter.split(':');
        if (key && value) {
          if (key === 'role' || key === 'tone' || key === 'vibe') {
            where[key] = { contains: value, mode: 'insensitive' };
          } else if (key === 'version') {
            where[key] = value;
          }
        }
      }
    }

    // Build orderBy clause
    const orderBy: any = {};
    if (query.sort) {
      const [field, direction] = query.sort.split(':');
      if (field && ['name', 'role', 'version', 'createdAt', 'updatedAt'].includes(field)) {
        orderBy[field] = direction === 'desc' ? 'desc' : 'asc';
      }
    } else {
      orderBy.name = 'asc';
    }

    // Fetch agents from database
    const [agents, total] = await Promise.all([
      prisma.agent.findMany({
        where,
        include,
        orderBy,
        take: query.limit,
        skip: query.offset,
      }),
      prisma.agent.count({ where }),
    ]);

    // Get runtime information from registry
    const registeredAgents = agentRegistry.getAllAgents();
    const activeExecutions = agentExecutor.getActiveExecutions();

    // Enhance agents with runtime data
    const enhancedAgents = agents.map(agent => {
      const isRegistered = registeredAgents.some(ra => ra.name === agent.name);
      const activeWorkflows = activeExecutions.filter(exec =>
        exec.context.metadata?.agentName === agent.name
      ).length;

      return {
        ...agent,
        runtime: {
          registered: isRegistered,
          activeWorkflows,
          lastSeen: isRegistered ? new Date().toISOString() : null,
        },
      };
    });

    return NextResponse.json({
      success: true,
      data: enhancedAgents,
      pagination: {
        total,
        limit: query.limit,
        offset: query.offset,
        hasMore: query.offset + query.limit < total,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("Error fetching agents:", error);

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
      error: "Failed to fetch agents",
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

// ============================================================================
// POST /api/agents - Create a new agent or seed from manifest
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type');

    // If no body, run the seeding script (backward compatibility)
    if (!contentType || !contentType.includes('application/json')) {
      const { exec } = await import("node:child_process");
      const run = (cmd: string) => new Promise<void>((resolve, reject) => exec(cmd, (err) => (err ? reject(err) : resolve())));
      try {
        await run("pnpm tsx scripts/seed_agents.ts");
      } catch (_e) {
        await run("node --loader ts-node/esm scripts/seed_agents.ts");
      }
      return NextResponse.json({
        success: true,
        message: "Agents seeded successfully",
        timestamp: new Date().toISOString(),
      });
    }

    const body = await request.json();
    const agentData = CreateAgentSchema.parse(body);

    // Check if agent already exists
    const existingAgent = await prisma.agent.findUnique({
      where: { name: agentData.name },
    });

    if (existingAgent) {
      throw new ConflictError(`Agent '${agentData.name}' already exists`);
    }

    // Validate agent profile
    const validation = parser.validateAgentProfile(agentData);
    if (!validation.valid) {
      throw new ValidationError(`Agent validation failed: ${validation.errors.join(', ')}`);
    }

    // Convert to database format
    const dbFormat = parser.toDatabaseFormat(agentData);

    // Create agent in database
    const agent = await prisma.$transaction(async (tx) => {
      // Create main agent record
      const newAgent = await tx.agent.create({
        data: {
          name: dbFormat.name,
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

      // Create related records
      const promises = [];

      if (dbFormat.tools.length > 0) {
        promises.push(
          tx.agentTool.createMany({
            data: dbFormat.tools.map((name: string) => ({
              agentId: newAgent.id,
              name,
            })),
          })
        );
      }

      if (dbFormat.datasets.length > 0) {
        promises.push(
          tx.agentDataset.createMany({
            data: dbFormat.datasets.map((key: string) => ({
              agentId: newAgent.id,
              key,
            })),
          })
        );
      }

      if (dbFormat.playbooks.length > 0) {
        promises.push(
          tx.agentPlaybook.createMany({
            data: dbFormat.playbooks.map((name: string) => ({
              agentId: newAgent.id,
              name,
            })),
          })
        );
      }

      if (dbFormat.guardrails.length > 0) {
        promises.push(
          tx.agentGuardrail.createMany({
            data: dbFormat.guardrails.map((rule: string) => ({
              agentId: newAgent.id,
              rule,
            })),
          })
        );
      }

      if (dbFormat.handoffs.length > 0) {
        promises.push(
          tx.agentHandoff.createMany({
            data: dbFormat.handoffs.map((toName: string) => ({
              agentId: newAgent.id,
              toName,
            })),
          })
        );
      }

      if (Object.keys(dbFormat.kpis).length > 0) {
        promises.push(
          tx.agentKPI.createMany({
            data: Object.entries(dbFormat.kpis).map(([key, target]) => ({
              agentId: newAgent.id,
              key,
              target: String(target),
            })),
          })
        );
      }

      if (dbFormat.evals.length > 0) {
        promises.push(
          tx.agentEval.createMany({
            data: dbFormat.evals.map((name: string) => ({
              agentId: newAgent.id,
              name,
            })),
          })
        );
      }

      if (dbFormat.cadence) {
        promises.push(
          tx.agentCadence.create({
            data: {
              agentId: newAgent.id,
              config: dbFormat.cadence,
            },
          })
        );
      }

      if (dbFormat.ab_test) {
        promises.push(
          tx.agentABTest.create({
            data: {
              agentId: newAgent.id,
              enabled: !!dbFormat.ab_test.enabled,
              variants: dbFormat.ab_test.variants || [],
              sample: dbFormat.ab_test.sample || 0,
              metrics: dbFormat.ab_test.metrics || [],
              logPath: dbFormat.ab_test.log || null,
            },
          })
        );
      }

      await Promise.all(promises);

      return newAgent;
    });

    // Register agent in runtime registry
    agentRegistry.registerAgent(agentData);

    // Emit agent creation event
    await agentBus.emitAgentEvent({
      type: AgentEventTypes.AGENT_STARTED,
      agentId: agent.name,
      agentName: agent.name,
      data: {
        agent: {
          id: agent.id,
          name: agent.name,
          role: agent.role,
          version: agent.version,
        },
        source: 'api',
      },
    });

    // Fetch the complete agent with relations
    const completeAgent = await prisma.agent.findUnique({
      where: { id: agent.id },
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
      data: {
        ...completeAgent,
        runtime: {
          registered: true,
          activeWorkflows: 0,
          lastSeen: new Date().toISOString(),
        },
      },
      timestamp: new Date().toISOString(),
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating agent:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: "Invalid agent data",
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
      error: "Failed to create agent",
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
