// Minimal event recorder (client posts to API, server falls back to console)
import { Logger } from '@/lib/logger';

export type TapTapEvent =
  | "TRACK_PLAYED"
  | "TRACK_SAVED"
  | "PLAYLIST_CREATED"
  | "POST_PUBLISHED"
  | "DM_SENT"
  | "BATTLE_VOTE"
  | "PURCHASE_COMPLETED"
  | "SWAP_COMPLETED"
  | "TAPPASS_GRANTED"
  | "TASK_COMPLETED"
  | "STREAM_STARTED"
  | "STREAM_ENDED"
  | "ASTRO_PROFILE_SET";

export async function recordEvent(type: TapTapEvent, payload?: Record<string, any>) {
  try {
    if (typeof window === "undefined") {
      // Server-side: log only
      // In production, wire to Sentry/Prism here.
      Logger.info("event recorded", { metadata: { type, payload: payload || {} } });
      return;
    }
    await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, payload, ts: Date.now() }),
      keepalive: true,
    }).catch(() => {});
  } catch {}
}
