import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const CurrencyCode = z.string().trim().min(2).max(10).regex(/^[A-Za-z0-9_-]+$/);
const RateBody = z.object({
  base: CurrencyCode,
  quote: CurrencyCode,
  rate: z.number().positive().finite(),
});

// GET /api/exchange-rates - Fetch current exchange rates
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const base = url.searchParams.get("base");
    const quote = url.searchParams.get("quote");

    let whereClause = {};
    if (base && quote) {
      whereClause = { base, quote };
    } else if (base) {
      whereClause = { base };
    } else if (quote) {
      whereClause = { quote };
    }

    const rates = await prisma.exchangeRate.findMany({
      where: whereClause,
      orderBy: { updatedAt: "desc" },
    });

    // If no rates found and specific base/quote requested, return default rates
    if (rates.length === 0 && base && quote) {
      const defaultRates = getDefaultRates();
      const defaultRate = defaultRates.find(r => r.base === base && r.quote === quote);
      if (defaultRate) {
        return NextResponse.json({ 
          rates: [defaultRate],
          isDefault: true,
          message: "Using default rate - database rate not found"
        });
      }
    }

    return NextResponse.json({ rates, isDefault: false });
  } catch (error: any) {
    console.error("Exchange rates fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch exchange rates", details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/exchange-rates - Update exchange rates (admin only)
export async function POST(req: Request) {
  try {
    const raw = await req.json().catch(() => null);
    const parsed = RateBody.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", issues: parsed.error.issues },
        { status: 400 }
      );
    }
    const { base, quote, rate } = parsed.data;

    // Upsert the exchange rate
    const exchangeRate = await prisma.exchangeRate.upsert({
      where: { base_quote: { base, quote } },
      update: { rate, updatedAt: new Date() },
      create: { base, quote, rate },
    });

    return NextResponse.json({ 
      success: true, 
      exchangeRate,
      message: `Updated ${base}/${quote} rate to ${rate}`
    });
  } catch (error: any) {
    console.error("Exchange rate update error:", error);
    return NextResponse.json(
      { error: "Failed to update exchange rate", details: error.message },
      { status: 500 }
    );
  }
}

// Default exchange rates for fallback
function getDefaultRates() {
  return [
    { base: "TAPC", quote: "USD", rate: 0.25, updatedAt: new Date(), createdAt: new Date() },
    { base: "USD", quote: "TAPC", rate: 4.0, updatedAt: new Date(), createdAt: new Date() },
    { base: "TAPC", quote: "SOL", rate: 0.0025, updatedAt: new Date(), createdAt: new Date() },
    { base: "SOL", quote: "TAPC", rate: 400.0, updatedAt: new Date(), createdAt: new Date() },
    { base: "SOL", quote: "USD", rate: 100.0, updatedAt: new Date(), createdAt: new Date() },
    { base: "USD", quote: "SOL", rate: 0.01, updatedAt: new Date(), createdAt: new Date() },
  ];
}
