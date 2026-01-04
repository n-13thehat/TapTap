import { NextRequest, NextResponse } from "next/server";
import { getPosterizeStore, generateId, persistStore } from "@/lib/server/memoryStore";
import { dbCreatePosterizeItem } from "@/lib/server/persistence";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as {
    title?: string;
    durationSec?: number;
    mintCount?: number;
    priceCents?: number;
  } | null;

  const title = (body?.title || "").trim();
  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const durationSec = Number(body?.durationSec ?? 0) || 0;
  const mintCount = Number(body?.mintCount ?? 0) || 0;
  const priceCents = Number(body?.priceCents ?? 0) || 0;

  const sanitized = {
    title,
    durationSec: Math.max(1, Math.min(120, durationSec)),
    mintCount: Math.max(1, Math.min(9999, mintCount)),
    priceCents: Math.max(0, priceCents),
  };

  try {
    const item = await dbCreatePosterizeItem(sanitized);
    return NextResponse.json({ productId: item.id, item }, { status: 201 });
  } catch (err) {
    console.error("[posterize] DB create failed, falling back to memory", err);
    const store = getPosterizeStore();
    const createdAt = new Date().toISOString();
    const item = {
      id: generateId("posterize"),
      ...sanitized,
      inventory: sanitized.mintCount,
      createdAt,
    };
    store.items = [item, ...store.items].slice(0, 100);
    await persistStore();
    return NextResponse.json({ productId: item.id, item }, { status: 201 });
  }
}
