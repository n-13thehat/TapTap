import { NextResponse } from "next/server";
import { getPosterizeStore } from "@/lib/server/memoryStore";
import { dbListPosterizeItems } from "@/lib/server/persistence";

export async function GET() {
  try {
    const items = await dbListPosterizeItems();
    return NextResponse.json(
      { items },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("[posterize] DB list failed, falling back to memory", err);
    const store = getPosterizeStore();
    return NextResponse.json(
      { items: store.items },
      { headers: { "Cache-Control": "no-store" } }
    );
  }
}
