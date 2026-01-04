import { NextResponse } from "next/server";
import {
  consumeBmiState,
  exchangeBmiCodeForTokens,
  upsertBmiConnection,
} from "@/lib/bmi";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  const fallback = new URL("/creator", url.origin);

  if (!state || !code) {
    fallback.searchParams.set("error", "bmi-missing");
    return NextResponse.redirect(fallback);
  }

  const stored = await consumeBmiState(state);
  if (!stored) {
    fallback.searchParams.set("error", "bmi-state");
    return NextResponse.redirect(fallback);
  }

  try {
    const tokens = await exchangeBmiCodeForTokens(code);
    await upsertBmiConnection(stored.userId, tokens);
    fallback.searchParams.set("bmi", "connected");
    return NextResponse.redirect(fallback);
  } catch (error: any) {
    fallback.searchParams.set("error", "bmi-token");
    fallback.searchParams.set("message", encodeURIComponent(error?.message || "BMI token exchange failed"));
    return NextResponse.redirect(fallback);
  }
}
