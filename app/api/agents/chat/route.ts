import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth.config';

/**
 * Agent Chat API
 * POST /api/agents/chat
 * Body: { agentId: string, message: string, conversationHistory?: Array }
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
    const { agentId, message, conversationHistory = [] } = body;
    
    if (!agentId || !message) {
      return NextResponse.json(
        { error: 'agentId and message are required' },
        { status: 400 }
      );
    }
    
    // Get agent from database
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
    });
    
    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }
    
    // Generate agent response based on agent's personality
    const response = generateAgentResponse(agent, message, conversationHistory);
    
    return NextResponse.json({
      success: true,
      data: {
        agentId: agent.id,
        agentName: agent.name,
        message: response,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Agent chat error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Generate agent response based on personality
 */
function generateAgentResponse(
  agent: any,
  userMessage: string,
  conversationHistory: any[]
): string {
  const meta = agent.meta as any || {};
  const theme = meta.theme || {};
  
  // Build context-aware response based on agent's role and tone
  const responses = buildResponseTemplates(agent);
  
  // Simple keyword matching for demo (replace with actual AI/LLM integration)
  const lowerMessage = userMessage.toLowerCase();
  
  // Check for greetings
  if (lowerMessage.match(/\b(hi|hello|hey|greetings)\b/)) {
    return `${theme.emoji || '✨'} ${agent.signature} I'm ${agent.name}, your ${agent.role}. ${responses.greeting}`;
  }
  
  // Check for help requests
  if (lowerMessage.match(/\b(help|assist|support|guide)\b/)) {
    return `${responses.help} ${agent.signature}`;
  }
  
  // Check for questions
  if (lowerMessage.includes('?')) {
    return `${responses.question} ${agent.signature}`;
  }
  
  // Check for thanks
  if (lowerMessage.match(/\b(thanks|thank you|appreciate)\b/)) {
    return `${responses.thanks} ${agent.signature}`;
  }
  
  // Default response
  return `${responses.default} ${agent.signature}`;
}

/**
 * Build response templates based on agent personality
 */
function buildResponseTemplates(agent: any) {
  const tone = agent.tone.toLowerCase();
  const role = agent.role.toLowerCase();
  
  // Customize responses based on tone
  const templates = {
    greeting: '',
    help: '',
    question: '',
    thanks: '',
    default: '',
  };
  
  // Tone-based greetings
  if (tone.includes('warm') || tone.includes('friendly')) {
    templates.greeting = "It's wonderful to connect with you! How can I brighten your day?";
  } else if (tone.includes('professional') || tone.includes('clear')) {
    templates.greeting = "Ready to assist you. What can I help you with today?";
  } else if (tone.includes('bold') || tone.includes('energetic')) {
    templates.greeting = "Let's make something amazing happen! What's on your mind?";
  } else if (tone.includes('calm') || tone.includes('strategic')) {
    templates.greeting = "I'm here to help you navigate this journey. What would you like to explore?";
  } else {
    templates.greeting = "How can I assist you today?";
  }
  
  // Role-based help responses
  if (role.includes('creator') || role.includes('muse')) {
    templates.help = "I can help you craft compelling stories, develop your creative vision, and bring your ideas to life.";
  } else if (role.includes('playlist') || role.includes('music')) {
    templates.help = "I can curate the perfect playlist for any mood, discover new tracks, and create seamless musical experiences.";
  } else if (role.includes('economy') || role.includes('wallet')) {
    templates.help = "I can guide you through transactions, manage your TapCoin, and ensure your value is protected.";
  } else if (role.includes('social') || role.includes('community')) {
    templates.help = "I can boost your engagement, manage conversations, and help you connect with your audience.";
  } else if (role.includes('analytics') || role.includes('data')) {
    templates.help = "I can break down the numbers, reveal insights, and help you make data-driven decisions.";
  } else {
    templates.help = `As your ${agent.role}, I'm here to support you with ${agent.summary.toLowerCase()}`;
  }
  
  // Question responses
  templates.question = "That's a great question! Let me help you with that.";
  
  // Thanks responses
  templates.thanks = "You're very welcome! I'm always here when you need me.";
  
  // Default responses
  templates.default = `I understand. Let me help you with that using my expertise in ${agent.summary.toLowerCase()}`;
  
  return templates;
}

