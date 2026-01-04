import { NextResponse } from "next/server";
import { computeTodayVibe } from "@/lib/astro";

export async function GET(req: Request) {
  const cookies = Object.fromEntries((req.headers.get("cookie") || "").split(/;\s*/).map((row) => row.split("=", 2)));
  let profile: any = null; let weight = 0.5;
  try { profile = cookies["taptap.astro"] ? JSON.parse(decodeURIComponent(cookies["taptap.astro"])) : null; } catch {}
  try { const w = cookies["taptap.astro.weight"]; if (w) weight = Math.min(1, Math.max(0, Number(w))); } catch {}
  const vibe = computeTodayVibe(profile, weight);
  return NextResponse.json({ vibe });
}

