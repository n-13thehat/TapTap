/**
 * Execution Management API Routes
 * Handles workflow execution monitoring and control
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { agentExecutor } from "@/lib/agents/executor";

const QuerySchema = z.object({
  status: z.enum(['pending', 'running', 'completed', 'failed', 'cancelled']).optional(),
  workflowName: z.string().optional(),
  userId: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
  includeHistory: z.coerce.boolean().default(false),
});

type ExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = QuerySchema.parse(Object.fromEntries(searchParams));

    const matchesFilters = (exec: any) => {
      if (query.status && exec.status !== query.status) return false;
      if (query.workflowName && exec.workflowName !== query.workflowName) return false;
      if (query.userId && exec.context.userId !== query.userId) return false;
      return true;
    };

    const statusCounts: Record<ExecutionStatus, number> = {
      pending: 0,
      running: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
    };

    const filteredActiveExecutions: any[] = [];
    const filteredHistoricalExecutions: any[] = [];

    const processExecutions = (executions: any[], isActive: boolean, bucket: any[]) => {
      for (const exec of executions) {
        if (!matchesFilters(exec)) continue;
        const status = exec.status as ExecutionStatus;
        if (statusCounts[status] !== undefined) {
          statusCounts[status] += 1;
        }
        bucket.push({ ...exec, isActive });
      }
    };

    const activeExecutions = agentExecutor.getActiveExecutions();
    processExecutions(activeExecutions, true, filteredActiveExecutions);

    let executionHistory: any[] = [];
    if (query.includeHistory) {
      executionHistory = agentExecutor.getExecutionHistory();
      processExecutions(executionHistory, false, filteredHistoricalExecutions);
    }

    const allExecutions = [...filteredActiveExecutions, ...filteredHistoricalExecutions].sort(
      (a, b) => b.startTime - a.startTime
    );

    const total = allExecutions.length;
    const paginatedExecutions = allExecutions.slice(query.offset, query.offset + query.limit);

    const formattedExecutions = paginatedExecutions.map(exec => ({
      id: exec.id,
      workflowName: exec.workflowName,
      status: exec.status,
      currentStep: exec.currentStep,
      totalSteps: exec.totalSteps,
      startTime: exec.startTime,
      endTime: exec.endTime,
      executionTime: exec.executionTime,
      userId: exec.context.userId,
      sessionId: exec.context.sessionId,
      correlationId: exec.context.correlationId,
      isActive: exec.isActive,
      errors: exec.errors,
      progress: exec.totalSteps > 0 ? (exec.currentStep / exec.totalSteps) * 100 : 0,
      metadata: {
        priority: exec.context.priority,
        timeout: exec.context.timeout,
        retries: exec.context.retries,
      },
    }));

    return NextResponse.json({
      success: true,
      data: formattedExecutions,
      pagination: {
        total,
        limit: query.limit,
        offset: query.offset,
        hasMore: query.offset + query.limit < total,
      },
      summary: {
        active: filteredActiveExecutions.length,
        total: filteredActiveExecutions.length + filteredHistoricalExecutions.length,
        byStatus: statusCounts,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("Error fetching executions:", error);

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
      error: "Failed to fetch executions",
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
