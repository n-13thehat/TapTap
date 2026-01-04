import { NextResponse } from "next/server";

// Stores profile in a cookie for demo purposes

export async function GET(req: Request) {
  const cookies = Object.fromEntries((req.headers.get("cookie") || "").split(/;\s*/).map((row) => row.split("=", 2)));
  const raw = cookies["taptap.astro"] || "";
  try {
    const profile = raw ? JSON.parse(decodeURIComponent(raw)) : null;
    return NextResponse.json({ profile });
  } catch {
    return NextResponse.json({ profile: null });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const profile = {
      sign: body?.sign || null,
      moon: body?.moon || null,
      rising: body?.rising || null,
      birthDate: body?.birthDate || null,
      birthTime: body?.birthTime || null,
      location: body?.location || null,
    };
    const res = NextResponse.json({ ok: true });
    res.headers.set("set-cookie", `taptap.astro=${encodeURIComponent(JSON.stringify(profile))}; Path=/; Max-Age=31536000; SameSite=Lax`);
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 400 });
  }
}

