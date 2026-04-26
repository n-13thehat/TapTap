import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// No hardcoded prices: SOL/USD comes from the CoinGecko cache and TAP/USD
// is set by an admin via /admin/economy. lib/exchange-rates.ts derives every
// pair from those two market values. This seed is intentionally a no-op and
// exists only so /api/admin/exchange-rates/seed keeps a stable contract.
const INITIAL_EXCHANGE_RATES: Array<{ base: string; quote: string; rate: number }> = [];

async function seedExchangeRates() {
  console.log("🌱 Exchange-rate seeding skipped — prices are sourced from /admin/economy.");
  return { seeded: INITIAL_EXCHANGE_RATES.length };
}

async function main() {
  try {
    await seedExchangeRates();
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { seedExchangeRates };
