/**
 * Fire-and-forget agent notification helper.
 *
 * Product routes call `notifyAgentEvent({ userId, eventType, data })` to
 * route a product event through the appropriate AI agent persona and
 * persist a Notification row. Never throws — logs and swallows errors so
 * a notification failure can't break the parent request.
 */

import { prisma } from '@/lib/prisma';
import { generateAgentMessage } from '@/lib/aiAgents';
import { NotificationType } from '@prisma/client';

export interface NotifyAgentEventInput {
  userId: string;
  eventType: string;
  data?: Record<string, any>;
}

// Map agent event types to the Prisma NotificationType enum.
// The enum only has a fixed set of values, so anything not in this
// map falls through to SYSTEM.
const EVENT_TO_NOTIFICATION_TYPE: Record<string, NotificationType> = {
  // Music / playlist
  'track.played': 'SYSTEM',
  'track.saved': 'SYSTEM',
  'playlist.created': 'SYSTEM',
  'track.added_to_playlist': 'SYSTEM',
  // Social
  'social.post_created': 'SYSTEM',
  'social.post_liked': 'LIKE',
  'social.comment_created': 'COMMENT',
  'user.followed': 'FOLLOW',
  // Battles
  'battle.created': 'SYSTEM',
  'battle.vote_cast': 'SYSTEM',
  'battle.completed': 'SYSTEM',
  // Wallet / marketplace
  'wallet.connected': 'SYSTEM',
  'wallet.transaction_completed': 'ORDER_STATUS',
  'marketplace.payment_processed': 'ORDER_STATUS',
  'marketplace.item_purchased': 'ORDER_STATUS',
  'marketplace.item_listed': 'SYSTEM',
  // Live
  'live.stream_started': 'STREAM_LIVE',
  'live.viewer_joined': 'STREAM_LIVE',
  'live.stream_ended': 'STREAM_LIVE',
  // Creator
  'upload.completed': 'SYSTEM',
  'user.creator_mode_toggled': 'SYSTEM',
  // Royalty (admin approval flow)
  'royalty.claim_submitted': 'SYSTEM',
  'royalty.payout_approved': 'ORDER_STATUS',
  'royalty.payout_rejected': 'SYSTEM',
  // Analytics / system
  'analytics.milestone': 'SYSTEM',
  'system.error_occurred': 'SYSTEM',
  'user.signed_in': 'SYSTEM',
};

function resolveNotificationType(eventType: string): NotificationType {
  return EVENT_TO_NOTIFICATION_TYPE[eventType] ?? 'SYSTEM';
}

/**
 * Fire-and-forget: queues the notify call onto the microtask queue so
 * the parent request returns without waiting on Prisma. Errors are
 * logged but never thrown.
 */
export function notifyAgentEvent(input: NotifyAgentEventInput): void {
  // Detach from caller — don't await.
  void runNotify(input).catch((err) => {
    console.error('[agents/notify] dispatch failed', {
      eventType: input.eventType,
      userId: input.userId,
      error: err instanceof Error ? err.message : String(err),
    });
  });
}

async function runNotify(input: NotifyAgentEventInput): Promise<void> {
  const { userId, eventType, data = {} } = input;
  if (!userId) return;

  let agentMessage;
  try {
    agentMessage = await generateAgentMessage(eventType, data, userId);
  } catch (err) {
    console.error('[agents/notify] generateAgentMessage failed', {
      eventType,
      error: err instanceof Error ? err.message : String(err),
    });
    return;
  }

  try {
    await prisma.notification.create({
      data: {
        userId,
        type: resolveNotificationType(eventType),
        payload: JSON.stringify({
          eventType,
          title: agentMessage.title,
          message: agentMessage.message,
          agentId: agentMessage.agentId,
          priority: agentMessage.priority,
          actions: agentMessage.actions,
          metadata: agentMessage.metadata,
        }),
      },
    });
  } catch (err) {
    console.error('[agents/notify] notification.create failed', {
      eventType,
      userId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/**
 * Awaited variant — for cases (e.g. tests) where the caller needs the
 * notification record persisted before continuing. Still swallows
 * errors so callers don't have to wrap in try/catch.
 */
export async function notifyAgentEventSync(input: NotifyAgentEventInput): Promise<void> {
  try {
    await runNotify(input);
  } catch (err) {
    console.error('[agents/notify] sync dispatch failed', {
      eventType: input.eventType,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
