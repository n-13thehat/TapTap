import { NextResponse } from "next/server";
import { seedExchangeRates } from "../../../../../prisma/seeds/exchange-rates";

export const dynamic = "force-dynamic";

// POST /api/admin/exchange-rates/seed - Seed initial exchange rates (admin)
export async function POST() {
  try {
    await seedExchangeRates();
    
    return NextResponse.json({
      success: true,
      message: "Exchange rates seeded successfully",
    });
  } catch (error: any) {
    console.error("Exchange rates seeding error:", error);
    return NextResponse.json(
      { error: "Failed to seed exchange rates", details: error.message },
      { status: 500 }
    );
  }
}
