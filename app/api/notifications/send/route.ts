import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth.config';
import { generateAgentMessage } from '@/lib/aiAgents';

/**
 * Send a notification using an AI agent
 * POST /api/notifications/send
 * Body: { eventType: string, data: object }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = (session as any)?.user?.id;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { eventType, data } = body;
    
    if (!eventType) {
      return NextResponse.json(
        { error: 'eventType is required' },
        { status: 400 }
      );
    }
    
    // Generate agent message
    const agentMessage = await generateAgentMessage(
      eventType,
      data || {},
      userId
    );
    
    // Save notification to database
    const notification = await prisma.notification.create({
      data: {
        userId,
        type: eventType as any,
        payload: JSON.stringify({
          message: agentMessage.message,
          title: agentMessage.title,
          agentId: agentMessage.agentId,
          metadata: agentMessage.metadata,
          actions: agentMessage.actions,
          priority: agentMessage.priority,
        }),
      },
    });
    
    return NextResponse.json({
      success: true,
      data: {
        notificationId: notification.id,
        agentMessage,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Send notification error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

