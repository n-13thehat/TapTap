/**
 * TapTap AI Agents Integration for Notification System
 * Uses existing agent profiles from app/agents/TapTap_AI_Agents/profiles
 */

export interface AIAgent {
  id: string;
  name: string;
  role: string;
  tone: string;
  vibe: string;
  signature: string;
  color: string;
  emoji: string;
  summary: string;
  specialties: string[];
}

export interface AgentMessage {
  id: string;
  agentId: string;
  userId: string;
  type: 'notification' | 'recommendation' | 'achievement' | 'alert' | 'tip';
  title: string;
  message: string;
  metadata?: Record<string, any>;
  timestamp: number;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actions?: AgentAction[];
}

export interface AgentAction {
  id: string;
  label: string;
  type: 'button' | 'link' | 'dismiss';
  action: string;
  data?: Record<string, any>;
}

// TapTap AI Agents (from existing profiles)
export const AI_AGENTS: Record<string, AIAgent> = {
  // Music & Playlist Agent
  harmony: {
    id: 'harmony',
    name: 'Harmony',
    role: 'Playlist Architect',
    tone: 'Balanced, lyrical',
    vibe: 'Flowing cadence',
    signature: 'Let me tune the moment for you.',
    color: '#FFB7A8',
    emoji: '🎶',
    summary: 'Maps moods to tracks and curates seamless experiences.',
    specialties: ['music', 'playlists', 'moods', 'curation', 'tracks'],
  },

  // Social & Community Agent
  echo: {
    id: 'echo',
    name: 'Echo',
    role: 'Social Reactor',
    tone: 'Snappy, witty',
    vibe: 'Fast neon',
    signature: 'Say less, I already replied.',
    color: '#FF4DA6',
    emoji: '🔁',
    summary: 'Replies, comment trees, and engagement bursts at scale.',
    specialties: ['social', 'comments', 'replies', 'engagement', 'community'],
  },

  // Creator Tools Agent
  muse: {
    id: 'muse',
    name: 'Muse',
    role: 'Creator Whisperer',
    tone: 'Warm, curious, artistic',
    vibe: 'Purple spotlight',
    signature: 'Tell me what inspires you.',
    color: '#C280FF',
    emoji: '🟣',
    summary: 'Interviews creators and extracts story-rich answers to generate bios, EPKs, intros, and prompts.',
    specialties: ['creators', 'inspiration', 'stories', 'uploads', 'content'],
  },

  // Economy & Wallet Agent
  treasure: {
    id: 'treasure',
    name: 'Treasure',
    role: 'Economy Keeper',
    tone: 'Protective, clever',
    vibe: 'Emerald + gold',
    signature: 'Your value is safe with me.',
    color: '#32D47B',
    emoji: '💰',
    summary: 'Wallets, TapCoin, TapPass, rewards, airdrops—clear UX copy and flows.',
    specialties: ['wallet', 'economy', 'tapcoin', 'rewards', 'transactions'],
  },

  // Safety & Security Agent
  haven: {
    id: 'haven',
    name: 'Haven',
    role: 'Guardian',
    tone: 'Firm, kind',
    vibe: 'Navy shield',
    signature: 'You\'re protected here.',
    color: '#001F54',
    emoji: '🛡️',
    summary: 'Safety policies, content controls, and trust mechanics.',
    specialties: ['safety', 'security', 'policies', 'protection', 'trust'],
  },

  // Analytics Agent
  prism: {
    id: 'prism',
    name: 'Prism',
    role: 'Analytics Oracle',
    tone: 'Clear, rational',
    vibe: 'Crystal focus',
    signature: 'Let me show you what the numbers are saying.',
    color: '#FFFFFF',
    emoji: '🔎',
    summary: 'Breaks raw data into insights, dashboards, and decisions.',
    specialties: ['analytics', 'data', 'insights', 'metrics', 'performance'],
  },

  // Creative Burst Agent
  nova: {
    id: 'nova',
    name: 'Nova',
    role: 'Creative Burst',
    tone: 'Bold, high-energy',
    vibe: 'Electric pop',
    signature: 'Watch this blow up.',
    color: '#FF007F',
    emoji: '💥',
    summary: 'Ad hooks, viral angles, reveal scripts, and creative bursts.',
    specialties: ['creative', 'viral', 'marketing', 'content', 'campaigns'],
  },

  // Campaign Conductor Agent
  saga: {
    id: 'saga',
    name: 'Saga',
    role: 'Campaign Conductor',
    tone: 'Calm, strategic',
    vibe: 'Royal orchestration',
    signature: 'This is the beginning of something huge.',
    color: '#D4AF37',
    emoji: '🏁',
    summary: 'Rollout arcs, phases, milestones, and cross-team timelines.',
    specialties: ['campaigns', 'strategy', 'rollouts', 'planning', 'milestones'],
  },

  // Brand Spirit Agent
  aura: {
    id: 'aura',
    name: 'Aura',
    role: 'Brand Spirit',
    tone: 'Stylish, minimal',
    vibe: 'Soft light',
    signature: 'Here\'s how this should feel.',
    color: '#D0B3FF',
    emoji: '✨',
    summary: 'Guardrails for visuals, palettes, motion, and aesthetic rationale.',
    specialties: ['brand', 'design', 'aesthetics', 'visuals', 'style'],
  },
};

/**
 * Message Templates for Different Event Types (using existing TapTap agents)
 */
export const MESSAGE_TEMPLATES = {
  // Music & Player Events (Harmony - Playlist Architect)
  track_played: {
    agentId: 'harmony',
    templates: [
      "🎶 Perfect choice! '{title}' by {artist} flows beautifully into your current vibe. Let me tune the moment for you.",
      "✨ '{title}' resonates perfectly right now. {artist} knows how to craft the mood.",
      "🎵 This track maps beautifully to your energy. '{title}' is exactly what the moment needed.",
    ],
  },

  track_saved: {
    agentId: 'harmony',
    templates: [
      "💫 '{title}' saved to your collection! This track will create beautiful moments in future playlists.",
      "🎯 Smart save! '{title}' by {artist} has that timeless quality that'll keep giving.",
      "✨ Another gem for your musical journey. '{title}' will find its perfect moment.",
    ],
  },

  playlist_created: {
    agentId: 'harmony',
    templates: [
      "🎶 New playlist '{name}' is ready for curation! Let me help you map the perfect flow.",
      "✨ '{name}' playlist created! Time to weave together tracks that tell a story.",
      "🎵 Fresh canvas for your musical vision. '{name}' is waiting for its first perfect track.",
    ],
  },

  // Social Events (Echo - Social Reactor)
  post_liked: {
    agentId: 'echo',
    templates: [
      "🔁 Your post just hit different! Someone's vibing with your energy. Say less, I already replied.",
      "💥 That post sparked something! The engagement is flowing fast.",
      "⚡ Another reaction in the chain! Your content is creating ripples.",
    ],
  },

  comment_created: {
    agentId: 'echo',
    templates: [
      "💬 Comment thread activated! The conversation is building momentum.",
      "🔥 Someone jumped into your post! The social reactor is heating up.",
      "⚡ New voice in the mix! Your content is sparking real dialogue.",
    ],
  },

  user_followed: {
    agentId: 'echo',
    templates: [
      "🔁 New follower locked in! Your social network is expanding fast.",
      "💥 Someone's following your vibe! The engagement burst continues.",
      "⚡ Another connection made! Your influence is spreading through the network.",
    ],
  },

  // Battle Events
  battle_vote_received: {
    agentId: 'clash',
    templates: [
      "⚔️ Your track got a vote in the battle! The competition is fierce.",
      "🔥 Battle vote incoming! Your music is making an impact.",
      "💪 Someone voted for your track! Keep the momentum going.",
    ],
  },

  battle_won: {
    agentId: 'clash',
    templates: [
      "🏆 VICTORY! You won the battle! Your track dominated the competition.",
      "👑 Battle champion! Your music proved its worth in combat.",
      "🎯 Flawless victory! Your track conquered the battlefield.",
    ],
  },

  // Wallet Events (Treasure - Economy Keeper)
  transaction_completed: {
    agentId: 'treasure',
    templates: [
      "💰 Transaction secured! {amount} {currency} processed safely. Your value is safe with me.",
      "✅ Payment confirmed and protected! {amount} {currency} moved securely through the vault.",
      "🔒 Transaction complete! {amount} {currency} safely processed. Your economy is growing.",
    ],
  },

  wallet_connected: {
    agentId: 'treasure',
    templates: [
      "💰 Wallet connected and secured! Your TapCoin journey begins with full protection.",
      "🔒 Wallet linked successfully! Your value is safe with me. Ready for TapCoin flows.",
      "✨ Wallet integration complete! Your economic potential is now unlocked.",
    ],
  },

  // Live Streaming Events
  stream_started: {
    agentId: 'stream',
    templates: [
      "📺 You're now LIVE! Time to connect with your audience.",
      "🎬 Stream is rolling! Your viewers are waiting for the magic.",
      "⚡ LIVE NOW! Let's make this stream unforgettable.",
    ],
  },

  viewer_joined: {
    agentId: 'stream',
    templates: [
      "👋 New viewer joined your stream! The audience is growing.",
      "📈 Stream viewer count is rising! Your content is attracting people.",
      "🌟 Another viewer tuned in! Keep the energy high.",
    ],
  },

  // System Events
  feature_unlocked: {
    agentId: 'matrix',
    templates: [
      "🔓 New feature unlocked! {feature} is now available to you.",
      "⚡ System upgrade! {feature} has been activated for your account.",
      "🎯 Feature access granted! Explore the new {feature} capabilities.",
    ],
  },

  security_alert: {
    agentId: 'matrix',
    templates: [
      "🛡️ Security notice: {message}. Your account protection is our priority.",
      "🔒 Security update: {message}. Stay safe in the digital realm.",
      "⚠️ Important security alert: {message}. Please review immediately.",
    ],
  },

  // Creator Events (Muse - Creator Whisperer)
  upload_completed: {
    agentId: 'muse',
    templates: [
      "🟣 Your creation '{title}' is live! Tell me what inspired you to make this piece.",
      "✨ Upload complete! '{title}' is ready to inspire others. What's the story behind it?",
      "💜 '{title}' is now in the world! I'm curious about the creative journey that led here.",
    ],
  },

  analytics_milestone: {
    agentId: 'prism',
    templates: [
      "🔎 The numbers are speaking! Your content reached {metric} {value}. Let me show you what this means.",
      "📊 Data insight: {metric} hit {value}! Here's what the analytics are revealing.",
      "✨ Milestone achieved! {metric} reached {value}. The data tells a beautiful story.",
    ],
  },

  // Marketplace Events
  item_sold: {
    agentId: 'trade',
    templates: [
      "💎 Sale confirmed! Your '{item}' just sold for {amount} {currency}.",
      "🛍️ Marketplace success! '{item}' found a new owner.",
      "💰 Cha-ching! Your '{item}' sold for {amount} {currency}.",
    ],
  },

  new_drop_available: {
    agentId: 'trade',
    templates: [
      "🔥 New drop alert! '{collection}' just launched in the marketplace.",
      "⚡ Fresh drop! '{collection}' is now available for a limited time.",
      "🎯 Exclusive drop! '{collection}' just hit the marketplace.",
    ],
  },
};

/**
 * Get the appropriate AI agent for an event type
 */
export function getAgentForEvent(eventType: string): AIAgent {
  // Map event types to existing TapTap agents
  const eventAgentMap: Record<string, string> = {
    // Music events → Harmony (Playlist Architect)
    'track.played': 'harmony',
    'track.saved': 'harmony',
    'track.paused': 'harmony',
    'playlist.created': 'harmony',
    'track.added_to_playlist': 'harmony',

    // Social events → Echo (Social Reactor)
    'social.post_created': 'echo',
    'social.post_liked': 'echo',
    'social.comment_created': 'echo',
    'user.followed': 'echo',

    // Battle events → Echo (engagement/reactions)
    'battle.created': 'echo',
    'battle.vote_cast': 'echo',
    'battle.completed': 'echo',

    // Wallet/Economy events → Treasure (Economy Keeper)
    'wallet.connected': 'treasure',
    'wallet.transaction_completed': 'treasure',
    'marketplace.payment_processed': 'treasure',
    'marketplace.item_purchased': 'treasure',
    'marketplace.item_listed': 'treasure',

    // Live events → Nova (Creative Burst)
    'live.stream_started': 'nova',
    'live.viewer_joined': 'nova',
    'live.stream_ended': 'nova',

    // System/Security events → Haven (Guardian)
    'system.feature_flag_changed': 'haven',
    'system.error_occurred': 'haven',
    'user.signed_in': 'haven',

    // Creator events → Muse (Creator Whisperer)
    'upload.completed': 'muse',
    'user.creator_mode_toggled': 'muse',

    // Analytics events → Prism (Analytics Oracle)
    'analytics.milestone': 'prism',
    'analytics.page_view': 'prism',
    'system.performance_metric': 'prism',

    // Campaign/Marketing events → Saga (Campaign Conductor)
    'campaign.started': 'saga',
    'campaign.milestone': 'saga',

    // Brand/Design events → Aura (Brand Spirit)
    'brand.update': 'aura',
    'design.change': 'aura',
  };

  const agentId = eventAgentMap[eventType] || 'haven'; // Default to Haven for unknown events
  return AI_AGENTS[agentId];
}

/**
 * Generate a personalized message from an AI agent
 */
export function generateAgentMessage(
  eventType: string,
  data: Record<string, any>,
  userId: string
): AgentMessage {
  const agent = getAgentForEvent(eventType);
  const templateKey = eventType.replace('.', '_');
  const template = MESSAGE_TEMPLATES[templateKey as keyof typeof MESSAGE_TEMPLATES];
  
  let message = "I noticed something interesting happened! 🎵";
  let title = "Update from " + agent.name;
  
  if (template && template.templates) {
    // Select random template
    const randomTemplate = template.templates[Math.floor(Math.random() * template.templates.length)];
    
    // Replace placeholders with actual data
    message = randomTemplate.replace(/\{(\w+)\}/g, (match, key) => {
      return data[key] || match;
    });

    // Add agent signature for personality
    message += `\n\n— ${agent.signature}`;
  }
  
  // Generate contextual title using agent emoji and personality
  switch (eventType) {
    case 'track.played':
      title = `${agent.emoji} Now Playing: ${data.title}`;
      break;
    case 'track.saved':
      title = `${agent.emoji} Track Saved`;
      break;
    case 'playlist.created':
      title = `${agent.emoji} New Playlist Created`;
      break;
    case 'social.post_liked':
      title = `${agent.emoji} Your Post Got Love`;
      break;
    case 'battle.vote_cast':
      title = `${agent.emoji} Battle Vote Received`;
      break;
    case 'wallet.transaction_completed':
      title = `${agent.emoji} Transaction Complete`;
      break;
    case 'upload.completed':
      title = `${agent.emoji} Upload Complete`;
      break;
    case 'analytics.milestone':
      title = `${agent.emoji} Analytics Milestone`;
      break;
    default:
      title = `${agent.emoji} Update from ${agent.name}`;
  }

  return {
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    agentId: agent.id,
    userId,
    type: 'notification',
    title,
    message,
    metadata: {
      eventType,
      eventData: data,
      agentPersonality: agent.tone,
    },
    timestamp: Date.now(),
    read: false,
    priority: getPriorityForEvent(eventType),
    actions: generateActionsForEvent(eventType, data),
  };
}

/**
 * Get priority level for different event types
 */
function getPriorityForEvent(eventType: string): 'low' | 'medium' | 'high' | 'urgent' {
  const highPriorityEvents = [
    'system.error_occurred',
    'wallet.transaction_completed',
    'security.alert',
  ];
  
  const mediumPriorityEvents = [
    'battle.completed',
    'live.stream_started',
    'marketplace.item_sold',
  ];
  
  if (highPriorityEvents.includes(eventType)) return 'high';
  if (mediumPriorityEvents.includes(eventType)) return 'medium';
  return 'low';
}

/**
 * Generate contextual actions for different event types
 */
function generateActionsForEvent(eventType: string, data: Record<string, any>): AgentAction[] {
  const actions: AgentAction[] = [];
  
  switch (eventType) {
    case 'track.played':
      actions.push(
        {
          id: 'save_track',
          label: 'Save Track',
          type: 'button',
          action: 'save_track',
          data: { trackId: data.trackId },
        },
        {
          id: 'add_to_playlist',
          label: 'Add to Playlist',
          type: 'button',
          action: 'add_to_playlist',
          data: { trackId: data.trackId },
        }
      );
      break;
      
    case 'playlist.created':
      actions.push({
        id: 'view_playlist',
        label: 'View Playlist',
        type: 'link',
        action: '/library/playlists/' + data.playlistId,
      });
      break;
      
    case 'battle.vote_cast':
      actions.push({
        id: 'view_battle',
        label: 'View Battle',
        type: 'link',
        action: '/battles/' + data.battleId,
      });
      break;
      
    case 'wallet.transaction_completed':
      actions.push({
        id: 'view_transaction',
        label: 'View Details',
        type: 'link',
        action: '/wallet/transactions/' + data.transactionId,
      });
      break;
  }
  
  // Always add dismiss action
  actions.push({
    id: 'dismiss',
    label: 'Dismiss',
    type: 'dismiss',
    action: 'dismiss',
  });
  
  return actions;
}
