import { NextRequest, NextResponse } from "next/server";
import { getYouTubeVideoDetails } from "@/app/api/surf/utils";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const payload = await getYouTubeVideoDetails(id);
  return NextResponse.json(payload, { headers: { "Cache-Control": "no-store" } });
}
