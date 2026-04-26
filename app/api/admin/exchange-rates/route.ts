import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { updateExchangeRate, getAllExchangeRates } from "@/lib/exchange-rates";

export const dynamic = "force-dynamic";

const CurrencyCode = z.string().trim().min(2).max(10).regex(/^[A-Za-z0-9_-]+$/);
const RateEntry = z.object({
  base: CurrencyCode,
  quote: CurrencyCode,
  rate: z.number().positive().finite(),
});
const BulkRatesBody = z.object({
  rates: z.array(RateEntry).min(1).max(100),
});
const SingleRateBody = z.object({
  base: CurrencyCode,
  quote: CurrencyCode,
  rate: z.number().positive().finite(),
});

// GET /api/admin/exchange-rates - Get all exchange rates (admin)
export async function GET() {
  try {
    const rates = await getAllExchangeRates();
    return NextResponse.json({ rates });
  } catch (error: any) {
    console.error("Admin exchange rates fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch exchange rates", details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/admin/exchange-rates - Update multiple exchange rates (admin)
export async function POST(req: Request) {
  try {
    const raw = await req.json().catch(() => null);
    const parsed = BulkRatesBody.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", issues: parsed.error.issues },
        { status: 400 }
      );
    }
    const { rates } = parsed.data;

    const results = [];
    const errors = [];

    for (const { base, quote, rate: rateValue } of rates) {
      try {
        const updatedRate = await updateExchangeRate(base, quote, rateValue);
        results.push(updatedRate);
      } catch (error: any) {
        errors.push(`Failed to update ${base}/${quote}: ${error.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      updated: results.length,
      errors: errors.length > 0 ? errors : undefined,
      results,
    });
  } catch (error: any) {
    console.error("Admin exchange rates update error:", error);
    return NextResponse.json(
      { error: "Failed to update exchange rates", details: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/admin/exchange-rates - Update single exchange rate (admin)
export async function PUT(req: Request) {
  try {
    const raw = await req.json().catch(() => null);
    const parsed = SingleRateBody.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", issues: parsed.error.issues },
        { status: 400 }
      );
    }
    const { base, quote, rate } = parsed.data;

    const exchangeRate = await updateExchangeRate(base, quote, rate);

    return NextResponse.json({
      success: true,
      exchangeRate,
      message: `Updated ${base}/${quote} rate to ${rate}`,
    });
  } catch (error: any) {
    console.error("Admin exchange rate update error:", error);
    return NextResponse.json(
      { error: "Failed to update exchange rate", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/exchange-rates - Delete exchange rate (admin)
export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const base = url.searchParams.get("base");
    const quote = url.searchParams.get("quote");

    if (!base || !quote) {
      return NextResponse.json(
        { error: "base and quote parameters required" },
        { status: 400 }
      );
    }

    await prisma.exchangeRate.delete({
      where: { base_quote: { base, quote } },
    });

    return NextResponse.json({
      success: true,
      message: `Deleted ${base}/${quote} exchange rate`,
    });
  } catch (error: any) {
    console.error("Admin exchange rate delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete exchange rate", details: error.message },
      { status: 500 }
    );
  }
}
