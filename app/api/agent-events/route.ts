import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth.config';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/services/auth.service';
import { createValidationError, createInternalError } from '@/lib/dto';
import { z } from 'zod';

// Event payload validation schema
const EventPayloadSchema = z.object({
  id: z.string(),
  type: z.string(),
  timestamp: z.number(),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  data: z.record(z.any()),
  metadata: z.object({
    source: z.string().optional(),
    version: z.string().optional(),
    retryCount: z.number().optional(),
    correlationId: z.string().optional(),
  }).optional(),
});

const BatchEventSchema = z.object({
  events: z.array(EventPayloadSchema),
  batchId: z.string().optional(),
  clientTimestamp: z.number().optional(),
});

type EventPayload = z.infer<typeof EventPayloadSchema>;
type BatchEvent = z.infer<typeof BatchEventSchema>;

// Server-side event processors
const eventProcessors = new Map<string, (event: EventPayload, userId: string) => Promise<void>>();

// Register event processors
eventProcessors.set('track.played', async (event, userId) => {
  try {
    await prisma.playEvent.create({
      data: {
        userId,
        trackId: event.data.trackId,
        sessionId: event.sessionId || 'unknown',
        timestamp: new Date(event.timestamp),
        duration: event.data.duration || null,
        position: event.data.position || 0,
        metadata: event.data as any,
      }
    });
  } catch (error) {
    console.error('Failed to process track.played event:', error);
  }
});

eventProcessors.set('track.saved', async (event, userId) => {
  try {
    await prisma.libraryItem.upsert({
      where: {
        userId_trackId: {
          userId,
          trackId: event.data.trackId
        }
      },
      update: {
        updatedAt: new Date()
      },
      create: {
        userId,
        trackId: event.data.trackId,
        addedAt: new Date(event.timestamp),
      }
    });
  } catch (error) {
    console.error('Failed to process track.saved event:', error);
  }
});

eventProcessors.set('track.unsaved', async (event, userId) => {
  try {
    await prisma.libraryItem.delete({
      where: {
        userId_trackId: {
          userId,
          trackId: event.data.trackId
        }
      }
    });
  } catch (error) {
    console.error('Failed to process track.unsaved event:', error);
  }
});

eventProcessors.set('social.post_liked', async (event, userId) => {
  try {
    await prisma.like.upsert({
      where: {
        userId_postId: {
          userId,
          postId: event.data.postId
        }
      },
      update: {
        updatedAt: new Date()
      },
      create: {
        userId,
        postId: event.data.postId,
        trackId: event.data.trackId || null,
        createdAt: new Date(event.timestamp),
      }
    });
  } catch (error) {
    console.error('Failed to process social.post_liked event:', error);
  }
});

eventProcessors.set('analytics.page_view', async (event, userId) => {
  try {
    await prisma.analyticsEvent.create({
      data: {
        userId,
        eventType: 'page_view',
        eventData: {
          page: event.data.page,
          referrer: event.data.referrer,
          userAgent: event.data.userAgent,
          timestamp: event.timestamp,
        },
        sessionId: event.sessionId || 'unknown',
        timestamp: new Date(event.timestamp),
      }
    });
  } catch (error) {
    console.error('Failed to process analytics.page_view event:', error);
  }
});

eventProcessors.set('system.error_occurred', async (event, userId) => {
  try {
    await prisma.errorLog.create({
      data: {
        userId,
        errorType: event.data.error || 'unknown',
        errorMessage: event.data.message || '',
        stackTrace: event.data.stack || null,
        context: event.data.context || {},
        sessionId: event.sessionId || 'unknown',
        timestamp: new Date(event.timestamp),
      }
    });
  } catch (error) {
    console.error('Failed to process system.error_occurred event:', error);
  }
});

/**
 * POST /api/agent-events
 * Receive and process event batches from client-side event bus
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const context = await AuthService.getCurrentUser();
    if (!context) {
      return NextResponse.json(
        createValidationError('auth', 'Authentication required'),
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = BatchEventSchema.parse(body);

    const { events, batchId, clientTimestamp } = validatedData;
    const userId = context.user.id;
    const serverTimestamp = Date.now();

    // Process events
    const results = {
      processed: 0,
      failed: 0,
      skipped: 0,
      errors: [] as string[]
    };

    for (const event of events) {
      try {
        // Validate event age (skip events older than 24 hours)
        const eventAge = serverTimestamp - event.timestamp;
        if (eventAge > 24 * 60 * 60 * 1000) {
          results.skipped++;
          continue;
        }

        // Check for duplicate events (idempotency)
        const existingEvent = await prisma.eventLog.findUnique({
          where: { eventId: event.id }
        });

        if (existingEvent) {
          results.skipped++;
          continue;
        }

        // Log the event
        await prisma.eventLog.create({
          data: {
            eventId: event.id,
            userId,
            eventType: event.type,
            eventData: event.data,
            sessionId: event.sessionId || 'unknown',
            clientTimestamp: new Date(event.timestamp),
            serverTimestamp: new Date(serverTimestamp),
            metadata: event.metadata || {},
          }
        });

        // Process event with specific processor if available
        const processor = eventProcessors.get(event.type);
        if (processor) {
          await processor(event, userId);
        }

        results.processed++;
      } catch (error) {
        console.error(`Failed to process event ${event.id}:`, error);
        results.failed++;
        results.errors.push(`Event ${event.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Store batch metadata
    if (batchId) {
      try {
        await prisma.eventBatch.create({
          data: {
            batchId,
            userId,
            eventCount: events.length,
            processedCount: results.processed,
            failedCount: results.failed,
            skippedCount: results.skipped,
            clientTimestamp: clientTimestamp ? new Date(clientTimestamp) : null,
            serverTimestamp: new Date(serverTimestamp),
          }
        });
      } catch (error) {
        console.warn('Failed to store batch metadata:', error);
      }
    }

    return NextResponse.json({
      success: true,
      batchId,
      results,
      serverTimestamp,
    });

  } catch (error) {
    console.error('Agent events API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        createValidationError('events', `Invalid event data: ${error.message}`),
        { status: 400 }
      );
    }

    return NextResponse.json(
      createInternalError('Failed to process events'),
      { status: 500 }
    );
  }
}

/**
 * GET /api/agent-events
 * Get event processing statistics and health check
 */
export async function GET(request: NextRequest) {
  try {
    const context = await AuthService.getCurrentUser();
    if (!context) {
      return NextResponse.json(
        createValidationError('auth', 'Authentication required'),
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '24h';
    const userId = context.user.id;

    // Calculate timeframe
    let since: Date;
    switch (timeframe) {
      case '1h':
        since = new Date(Date.now() - 60 * 60 * 1000);
        break;
      case '24h':
        since = new Date(Date.now() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      default:
        since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    }

    // Get statistics
    const [eventStats, batchStats, recentEvents] = await Promise.all([
      prisma.eventLog.groupBy({
        by: ['eventType'],
        where: {
          userId,
          serverTimestamp: { gte: since }
        },
        _count: {
          eventId: true
        }
      }),
      prisma.eventBatch.aggregate({
        where: {
          userId,
          serverTimestamp: { gte: since }
        },
        _sum: {
          eventCount: true,
          processedCount: true,
          failedCount: true,
          skippedCount: true
        },
        _count: {
          batchId: true
        }
      }),
      prisma.eventLog.findMany({
        where: {
          userId,
          serverTimestamp: { gte: since }
        },
        orderBy: {
          serverTimestamp: 'desc'
        },
        take: 10,
        select: {
          eventId: true,
          eventType: true,
          clientTimestamp: true,
          serverTimestamp: true,
          sessionId: true
        }
      })
    ]);

    const eventTypeStats = eventStats.reduce((acc, stat) => {
      acc[stat.eventType] = stat._count.eventId;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      success: true,
      timeframe,
      statistics: {
        eventTypes: eventTypeStats,
        totalEvents: batchStats._sum.eventCount || 0,
        processedEvents: batchStats._sum.processedCount || 0,
        failedEvents: batchStats._sum.failedCount || 0,
        skippedEvents: batchStats._sum.skippedCount || 0,
        totalBatches: batchStats._count.batchId || 0,
      },
      recentEvents,
      serverTimestamp: Date.now(),
    });

  } catch (error) {
    console.error('Agent events stats API error:', error);
    return NextResponse.json(
      createInternalError('Failed to get event statistics'),
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/agent-events
 * Clear old event logs (admin only)
 */
export async function DELETE(request: NextRequest) {
  try {
    await AuthService.requireAdmin();

    const { searchParams } = new URL(request.url);
    const olderThan = searchParams.get('olderThan') || '30d';

    let cutoffDate: Date;
    switch (olderThan) {
      case '7d':
        cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    const [deletedEvents, deletedBatches] = await Promise.all([
      prisma.eventLog.deleteMany({
        where: {
          serverTimestamp: { lt: cutoffDate }
        }
      }),
      prisma.eventBatch.deleteMany({
        where: {
          serverTimestamp: { lt: cutoffDate }
        }
      })
    ]);

    return NextResponse.json({
      success: true,
      deletedEvents: deletedEvents.count,
      deletedBatches: deletedBatches.count,
      cutoffDate: cutoffDate.toISOString(),
    });

  } catch (error) {
    console.error('Agent events cleanup API error:', error);
    return NextResponse.json(
      createInternalError('Failed to cleanup event logs'),
      { status: 500 }
    );
  }
}
