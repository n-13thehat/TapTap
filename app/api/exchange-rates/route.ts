import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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
    const body = await req.json();
    const { base, quote, rate } = body;

    if (!base || !quote || typeof rate !== "number") {
      return NextResponse.json(
        { error: "Missing required fields: base, quote, rate" },
        { status: 400 }
      );
    }

    if (rate <= 0) {
      return NextResponse.json(
        { error: "Rate must be positive" },
        { status: 400 }
      );
    }

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
