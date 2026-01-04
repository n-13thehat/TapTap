import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ ok: true, beta: true });
  res.headers.set("set-cookie", `taptap.beta=1; Path=/; Max-Age=31536000; SameSite=Lax`);
  return res;
}

