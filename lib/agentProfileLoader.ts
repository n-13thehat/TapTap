/**
 * Agent Profile Loader
 * Dynamically loads and parses TapTap AI agent profiles from markdown files
 */

import { AIAgent } from './aiAgents';

/**
 * Parse agent profile from markdown content
 */
export function parseAgentProfile(markdownContent: string, agentId: string): AIAgent {
  const lines = markdownContent.split('\n');
  
  let role = '';
  let tone = '';
  let vibe = '';
  let signature = '';
  let color = '';
  let emoji = '';
  let summary = '';
  
  // Parse the markdown structure
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith('**Role:**')) {
      role = line.replace('**Role:**', '').trim();
    } else if (line.startsWith('**Tone:**')) {
      tone = line.replace('**Tone:**', '').trim();
    } else if (line.startsWith('**Vibe:**')) {
      vibe = line.replace('**Vibe:**', '').trim();
    } else if (line.startsWith('**Signature:**')) {
      signature = line.replace('**Signature:**', '').replace(/"/g, '').trim();
    } else if (line.startsWith('**Color:**')) {
      const colorLine = line.replace('**Color:**', '').trim();
      // Extract hex color (e.g., "#C280FF 🟣")
      const hexMatch = colorLine.match(/#[A-Fa-f0-9]{6}/);
      const emojiMatch = colorLine.match(/[^\w\s#]/);
      
      if (hexMatch) color = hexMatch[0];
      if (emojiMatch) emoji = emojiMatch[0];
    } else if (line === '## Summary' && i + 1 < lines.length) {
      summary = lines[i + 1].trim();
    }
  }
  
  // Determine specialties based on role and summary
  const specialties = determineSpecialties(role, summary, agentId);
  
  return {
    id: agentId,
    name: capitalizeFirst(agentId),
    role,
    tone,
    vibe,
    signature,
    color: color || '#FFFFFF',
    emoji: emoji || '✨',
    summary,
    specialties,
  };
}

/**
 * Determine agent specialties based on role and summary
 */
function determineSpecialties(role: string, summary: string, agentId: string): string[] {
  const roleSpecialties: Record<string, string[]> = {
    'Playlist Architect': ['music', 'playlists', 'moods', 'curation', 'tracks'],
    'Social Reactor': ['social', 'comments', 'replies', 'engagement', 'community'],
    'Creator Whisperer': ['creators', 'inspiration', 'stories', 'uploads', 'content'],
    'Economy Keeper': ['wallet', 'economy', 'tapcoin', 'rewards', 'transactions'],
    'Guardian': ['safety', 'security', 'policies', 'protection', 'trust'],
    'Analytics Oracle': ['analytics', 'data', 'insights', 'metrics', 'performance'],
    'Creative Burst': ['creative', 'viral', 'marketing', 'content', 'campaigns'],
    'Campaign Conductor': ['campaigns', 'strategy', 'rollouts', 'planning', 'milestones'],
    'Brand Spirit': ['brand', 'design', 'aesthetics', 'visuals', 'style'],
  };
  
  // Try to match by role first
  if (roleSpecialties[role]) {
    return roleSpecialties[role];
  }
  
  // Fallback to summary-based detection
  const summaryLower = summary.toLowerCase();
  const specialties: string[] = [];
  
  if (summaryLower.includes('music') || summaryLower.includes('track') || summaryLower.includes('playlist')) {
    specialties.push('music', 'tracks', 'playlists');
  }
  if (summaryLower.includes('social') || summaryLower.includes('comment') || summaryLower.includes('engagement')) {
    specialties.push('social', 'community', 'engagement');
  }
  if (summaryLower.includes('creator') || summaryLower.includes('upload') || summaryLower.includes('content')) {
    specialties.push('creators', 'content', 'uploads');
  }
  if (summaryLower.includes('wallet') || summaryLower.includes('coin') || summaryLower.includes('economy')) {
    specialties.push('wallet', 'economy', 'transactions');
  }
  if (summaryLower.includes('safety') || summaryLower.includes('security') || summaryLower.includes('policy')) {
    specialties.push('safety', 'security', 'policies');
  }
  if (summaryLower.includes('analytics') || summaryLower.includes('data') || summaryLower.includes('insight')) {
    specialties.push('analytics', 'data', 'insights');
  }
  if (summaryLower.includes('campaign') || summaryLower.includes('strategy') || summaryLower.includes('rollout')) {
    specialties.push('campaigns', 'strategy', 'planning');
  }
  if (summaryLower.includes('brand') || summaryLower.includes('design') || summaryLower.includes('visual')) {
    specialties.push('brand', 'design', 'visuals');
  }
  
  // Default specialties if none detected
  if (specialties.length === 0) {
    specialties.push('general', 'assistance', 'support');
  }
  
  return specialties;
}

/**
 * Capitalize first letter of string
 */
function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Load all agent profiles (would be used server-side or with file system access)
 * For now, returns the manually configured agents
 */
export async function loadAllAgentProfiles(): Promise<Record<string, AIAgent>> {
  // In a real implementation, this would:
  // 1. Read all .md files from app/agents/TapTap_AI_Agents/profiles/
  // 2. Parse each file using parseAgentProfile()
  // 3. Return a complete agent registry
  
  // For now, return the manually configured agents from aiAgents.ts
  const { AI_AGENTS } = await import('./aiAgents');
  return AI_AGENTS;
}

/**
 * Get agent profile by ID with fallback
 */
export function getAgentProfile(agentId: string, agents: Record<string, AIAgent>): AIAgent {
  return agents[agentId] || {
    id: agentId,
    name: capitalizeFirst(agentId),
    role: 'Assistant',
    tone: 'Helpful, friendly',
    vibe: 'Supportive energy',
    signature: 'Here to help!',
    color: '#FFFFFF',
    emoji: '✨',
    summary: 'General purpose assistant agent.',
    specialties: ['general', 'assistance', 'support'],
  };
}
