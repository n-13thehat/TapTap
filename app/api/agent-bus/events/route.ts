/**
 * Agent Bus Events API Routes
 * Handles agent system events from the Agent Bus
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { agentBus, AgentEventTypes } from "@/lib/agents/AgentBus";
import { ValidationError } from "@/lib/errors/AppError";

// ============================================================================
// Request Schemas
// ============================================================================

const QuerySchema = z.object({
  agentName: z.string().optional(),
  eventType: z.string().optional(),
  limit: z.coerce.number().min(1).max(1000).default(100),
  offset: z.coerce.number().min(0).default(0),
  since: z.coerce.number().optional(), // timestamp
  until: z.coerce.number().optional(), // timestamp
});

const CreateEventSchema = z.object({
  type: z.string().min(1),
  agentId: z.string().min(1),
  agentName: z.string().min(1),
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

// ============================================================================
// GET /api/agent-bus/events - Get agent events
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = QuerySchema.parse(Object.fromEntries(searchParams));
    
    // Get events from agent bus
    let events = agentBus.getEventHistory();
    
    // Apply filters
    if (query.agentName) {
      events = events.filter(event => event.agentName === query.agentName);
    }
    
    if (query.eventType) {
      events = events.filter(event => event.type === query.eventType);
    }
    
    if (query.since) {
      events = events.filter(event => event.timestamp >= query.since!);
    }
    
    if (query.until) {
      events = events.filter(event => event.timestamp <= query.until!);
    }
    
    // Sort by timestamp (most recent first)
    events.sort((a, b) => b.timestamp - a.timestamp);
    
    // Apply pagination
    const total = events.length;
    const paginatedEvents = events.slice(query.offset, query.offset + query.limit);
    
    // Get metrics
    const metrics = agentBus.getMetrics();
    
    // Group events by type for summary
    const eventTypeSummary = events.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Group events by agent for summary
    const agentSummary = events.reduce((acc, event) => {
      acc[event.agentName] = (acc[event.agentName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return NextResponse.json({
      success: true,
      data: paginatedEvents,
      pagination: {
        total,
        limit: query.limit,
        offset: query.offset,
        hasMore: query.offset + query.limit < total,
      },
      summary: {
        byType: eventTypeSummary,
        byAgent: agentSummary,
        totalEvents: total,
      },
      metrics: {
        totalEvents: metrics.eventsEmitted,
        eventsProcessed: metrics.eventsProcessed,
        commandsSent: metrics.commandsSent,
        responsesReceived: metrics.responsesReceived,
        errors: metrics.errors,
        activeAgents: metrics.activeAgents,
        activeWorkflows: metrics.activeWorkflows,
        uptime: metrics.uptime,
      },
      eventTypes: Object.values(AgentEventTypes),
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error("Error fetching agent bus events:", error);
    
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
      error: "Failed to fetch agent bus events",
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

// ============================================================================
// POST /api/agent-bus/events - Create agent event
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const eventData = CreateEventSchema.parse(body);
    
    // Emit the event through the agent bus
    await agentBus.emitAgentEvent(eventData);
    
    return NextResponse.json({
      success: true,
      message: "Event emitted successfully",
      data: {
        type: eventData.type,
        agentName: eventData.agentName,
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error("Error creating agent bus event:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: "Invalid event data",
        details: error.errors,
        timestamp: new Date().toISOString(),
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: false,
      error: "Failed to create agent bus event",
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

// ============================================================================
// DELETE /api/agent-bus/events - Clear event history
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentName = searchParams.get('agentName');
    
    if (agentName) {
      // Clear events for specific agent (not implemented in current AgentBus)
      return NextResponse.json({
        success: false,
        error: "Clearing events for specific agent not supported",
        timestamp: new Date().toISOString(),
      }, { status: 501 });
    } else {
      // Clear all event history
      // Note: This would require adding a clearHistory method to AgentBus
      return NextResponse.json({
        success: false,
        error: "Clearing all events not implemented for safety",
        timestamp: new Date().toISOString(),
      }, { status: 501 });
    }
    
  } catch (error) {
    console.error("Error clearing agent bus events:", error);
    
    return NextResponse.json({
      success: false,
      error: "Failed to clear agent bus events",
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
