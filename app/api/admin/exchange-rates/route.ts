import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateExchangeRate, getAllExchangeRates } from "@/lib/exchange-rates";

export const dynamic = "force-dynamic";

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
    const body = await req.json();
    const { rates } = body;

    if (!Array.isArray(rates)) {
      return NextResponse.json(
        { error: "rates must be an array" },
        { status: 400 }
      );
    }

    const results = [];
    const errors = [];

    for (const rate of rates) {
      const { base, quote, rate: rateValue } = rate;

      if (!base || !quote || typeof rateValue !== "number") {
        errors.push(`Invalid rate data: ${JSON.stringify(rate)}`);
        continue;
      }

      if (rateValue <= 0) {
        errors.push(`Rate must be positive for ${base}/${quote}: ${rateValue}`);
        continue;
      }

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
