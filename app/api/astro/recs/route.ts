import { NextResponse } from "next/server";
import { modByAstro } from "@/lib/astro";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const base = (searchParams.get("base") || "").split(",").map((s) => Number(s)).filter((n) => !Number.isNaN(n));
  const mod = {
    userId: null,
    scalarEnergy: Number(searchParams.get("e") || 0.5),
    scalarFocus: Number(searchParams.get("f") || 0.5),
    scalarChill: Number(searchParams.get("c") || 0.5),
    scalarSocial: Number(searchParams.get("s") || 0.5),
  };
  const out = modByAstro(base.length ? base : [0.5, 0.5, 0.5, 0.5], mod as any);
  return NextResponse.json({ weights: out });
}

