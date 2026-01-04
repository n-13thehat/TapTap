import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const service = process.env.SUPABASE_SERVICE_ROLE as string | undefined;
const supabase = createClient(url, service || anon, { auth: { persistSession: false } });

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const trackId = String(form.get("trackId") || "");
    if (!trackId) return NextResponse.redirect(new URL("/creator?error=missing", req.url));

    // TODO: verify ownership of trackId via user id
    const { error } = await supabase.from("Track").update({ status: "published" }).eq("id", trackId);
    if (error) return NextResponse.redirect(new URL("/creator?error=publish", req.url));

    return NextResponse.redirect(new URL("/creator?ok=1", req.url));
  } catch {
    return NextResponse.redirect(new URL("/creator?error=unknown", req.url));
  }
}