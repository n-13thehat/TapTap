/**
 * Agent Bus Metrics API Routes
 * Provides system metrics and health information
 */

import { NextRequest, NextResponse } from "next/server";
import { agentBus } from "@/lib/agents/AgentBus";
import { agentRegistry, agentExecutor } from "@/lib/agents/executor";

// ============================================================================
// GET /api/agent-bus/metrics - Get system metrics
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const detailed = searchParams.get('detailed') === 'true';
    
    // Get basic metrics from agent bus
    const busMetrics = agentBus.getMetrics();
    
    // Get registry information
    const registeredAgents = agentRegistry.getAllAgents();
    const registeredWorkflows = agentRegistry.getAllWorkflows();
    
    // Get execution information
    const activeExecutions = agentExecutor.getActiveExecutions();
    const executionHistory = agentExecutor.getExecutionHistory();
    
    // Calculate additional metrics
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    
    const recentExecutions = executionHistory.filter(exec => exec.startTime > oneHourAgo);
    const dailyExecutions = executionHistory.filter(exec => exec.startTime > oneDayAgo);
    
    const successfulExecutions = executionHistory.filter(exec => exec.status === 'completed');
    const failedExecutions = executionHistory.filter(exec => exec.status === 'failed');
    
    const averageExecutionTime = successfulExecutions.length > 0
      ? successfulExecutions.reduce((acc, exec) => acc + (exec.executionTime || 0), 0) / successfulExecutions.length
      : 0;
    
    // Basic metrics response
    const metrics = {
      system: {
        uptime: busMetrics.uptime,
        timestamp: new Date().toISOString(),
        status: 'healthy', // Could be enhanced with actual health checks
      },
      events: {
        emitted: busMetrics.eventsEmitted,
        processed: busMetrics.eventsProcessed,
        errors: busMetrics.errors,
        rate: busMetrics.uptime > 0 ? (busMetrics.eventsEmitted / (busMetrics.uptime / 1000)) : 0,
      },
      commands: {
        sent: busMetrics.commandsSent,
        processed: busMetrics.commandsProcessed,
        responses: busMetrics.responsesReceived,
        averageResponseTime: busMetrics.averageResponseTime,
      },
      agents: {
        registered: registeredAgents.length,
        active: busMetrics.activeAgents,
        list: registeredAgents.map(agent => ({
          name: agent.name,
          role: agent.role,
          version: agent.version,
        })),
      },
      workflows: {
        registered: registeredWorkflows.length,
        active: activeExecutions.length,
        list: registeredWorkflows.map(workflow => ({
          name: workflow.name,
          version: workflow.version,
          steps: workflow.steps.length,
        })),
      },
      executions: {
        active: activeExecutions.length,
        total: executionHistory.length,
        recentHour: recentExecutions.length,
        dailyTotal: dailyExecutions.length,
        successRate: executionHistory.length > 0 
          ? (successfulExecutions.length / executionHistory.length) * 100 
          : 0,
        averageExecutionTime,
        byStatus: {
          pending: activeExecutions.filter(exec => exec.status === 'pending').length,
          running: activeExecutions.filter(exec => exec.status === 'running').length,
          completed: successfulExecutions.length,
          failed: failedExecutions.length,
          cancelled: executionHistory.filter(exec => exec.status === 'cancelled').length,
        },
      },
    };
    
    // Add detailed information if requested
    if (detailed) {
      const eventHistory = agentBus.getEventHistory();
      const commandHistory = agentBus.getCommandHistory();
      const responseHistory = agentBus.getResponseHistory();
      
      // Event type distribution
      const eventTypeDistribution = eventHistory.reduce((acc, event) => {
        acc[event.type] = (acc[event.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      // Agent activity distribution
      const agentActivity = eventHistory.reduce((acc, event) => {
        acc[event.agentName] = (acc[event.agentName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      // Workflow execution patterns
      const workflowPatterns = executionHistory.reduce((acc, exec) => {
        if (!acc[exec.workflowName]) {
          acc[exec.workflowName] = {
            total: 0,
            successful: 0,
            failed: 0,
            averageTime: 0,
          };
        }
        
        acc[exec.workflowName].total++;
        if (exec.status === 'completed') {
          acc[exec.workflowName].successful++;
          acc[exec.workflowName].averageTime += exec.executionTime || 0;
        } else if (exec.status === 'failed') {
          acc[exec.workflowName].failed++;
        }
        
        return acc;
      }, {} as Record<string, any>);
      
      // Calculate average times
      Object.values(workflowPatterns).forEach((pattern: any) => {
        if (pattern.successful > 0) {
          pattern.averageTime = pattern.averageTime / pattern.successful;
        }
      });
      
      (metrics as any).detailed = {
        eventHistory: {
          total: eventHistory.length,
          typeDistribution: eventTypeDistribution,
          agentActivity,
          recentEvents: eventHistory.slice(-20),
        },
        commandHistory: {
          total: commandHistory.length,
          recentCommands: commandHistory.slice(-10),
        },
        responseHistory: {
          total: responseHistory.length,
          recentResponses: responseHistory.slice(-10),
        },
        workflowPatterns,
        activeExecutionDetails: activeExecutions.map(exec => ({
          id: exec.id,
          workflowName: exec.workflowName,
          status: exec.status,
          currentStep: exec.currentStep,
          totalSteps: exec.totalSteps,
          startTime: exec.startTime,
          progress: exec.totalSteps > 0 ? (exec.currentStep / exec.totalSteps) * 100 : 0,
          errors: exec.errors,
        })),
      };
    }
    
    return NextResponse.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error("Error fetching agent bus metrics:", error);
    
    return NextResponse.json({
      success: false,
      error: "Failed to fetch agent bus metrics",
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

// ============================================================================
// POST /api/agent-bus/metrics - Reset metrics
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Reset metrics
    agentBus.resetMetrics();
    
    return NextResponse.json({
      success: true,
      message: "Metrics reset successfully",
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error("Error resetting agent bus metrics:", error);
    
    return NextResponse.json({
      success: false,
      error: "Failed to reset agent bus metrics",
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
