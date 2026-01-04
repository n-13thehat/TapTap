import { NextResponse } from "next/server";
import { getExchangeRate, tapToUsd, usdToTap } from "@/lib/exchange-rates";

export const dynamic = "force-dynamic";

// GET /api/exchange-rates/tap-usd - Get TAP-USD conversion rate and convert amounts
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const tapAmount = url.searchParams.get("tap");
    const usdAmount = url.searchParams.get("usd");

    // Get current TAP-USD rate
    const rate = await getExchangeRate("TAPC", "USD");

    const response: any = {
      rate,
      timestamp: new Date().toISOString(),
    };

    // Convert TAP to USD if requested
    if (tapAmount) {
      const tap = parseFloat(tapAmount);
      if (!isNaN(tap)) {
        response.tapToUsd = {
          tap,
          usd: await tapToUsd(tap),
        };
      }
    }

    // Convert USD to TAP if requested
    if (usdAmount) {
      const usd = parseFloat(usdAmount);
      if (!isNaN(usd)) {
        response.usdToTap = {
          usd,
          tap: await usdToTap(usd),
        };
      }
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("TAP-USD conversion error:", error);
    return NextResponse.json(
      { 
        error: "Failed to get TAP-USD conversion", 
        details: error.message,
        fallbackRate: 0.25 // Provide fallback
      },
      { status: 500 }
    );
  }
}
