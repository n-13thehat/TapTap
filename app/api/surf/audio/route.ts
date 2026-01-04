import { NextRequest, NextResponse } from "next/server";

// Provide a deterministic audio stream so the global player has a valid source.
// We reuse the shipped demo track to avoid external dependencies.
const FALLBACK_AUDIO_PATH =
  "/api/library/albums/Music%20For%20The%20Future%20-vx9/2Horns.mp3";

export async function GET(req: NextRequest) {
  const redirectUrl = new URL(FALLBACK_AUDIO_PATH, req.url);
  return NextResponse.redirect(redirectUrl);
}
