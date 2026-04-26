import { NextRequest, NextResponse } from 'next/server';
import { generateAgentMessage, getAIAgents } from '@/lib/aiAgents';


/**
 * Test endpoint to verify agent integration with notifications
 * GET /api/agents/test-notification?eventType=track.played
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const eventType = searchParams.get('eventType') || 'track.played';
    
    // Load agents from database
    const agents = await getAIAgents();
    
    // Generate a test message
    const testData = {
      title: 'Midnight Dreams',
      artist: 'Luna Eclipse',
      trackId: 'test-123',
    };
    
    const message = await generateAgentMessage(
      eventType,
      testData,
      'test-user-id'
    );
    
    return NextResponse.json({
      success: true,
      data: {
        totalAgents: Object.keys(agents).length,
        agentNames: Object.keys(agents),
        testMessage: message,
        eventType,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Test notification error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

