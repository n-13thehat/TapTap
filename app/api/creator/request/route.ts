import { NextRequest, NextResponse } from "next/server";
import { getCreatorStore, generateId, persistStore } from "@/lib/server/memoryStore";
import { dbCreateCreatorRequest } from "@/lib/server/persistence";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as {
    stageName?: string;
    genre?: string;
    socialLinks?: string;
  } | null;

  const stageName = (body?.stageName || "").trim();
  if (!stageName) {
    return NextResponse.json({ error: "stageName is required" }, { status: 400 });
  }

  const request = {
    id: generateId("creator"),
    stageName,
    genre: body?.genre || "",
    socialLinks: body?.socialLinks || "",
    createdAt: new Date().toISOString(),
    status: "pending" as const,
  };

  try {
    const created = await dbCreateCreatorRequest({
      stageName,
      genre: body?.genre,
      socialLinks: body?.socialLinks,
    });
    return NextResponse.json({ ok: true, requestId: created.id });
  } catch (err) {
    console.error("[creator] DB request failed, falling back to memory", err);
    const store = getCreatorStore();
    store.requests = [request, ...store.requests].slice(0, 200);
    await persistStore();
    return NextResponse.json({ ok: true, requestId: request.id });
  }
}
