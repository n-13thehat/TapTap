import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const INITIAL_EXCHANGE_RATES = [
  // TAP Token to USD
  { base: "TAPC", quote: "USD", rate: 0.25 },
  { base: "USD", quote: "TAPC", rate: 4.0 },
  
  // TAP Token to SOL
  { base: "TAPC", quote: "SOL", rate: 0.0025 },
  { base: "SOL", quote: "TAPC", rate: 400.0 },
  
  // SOL to USD (approximate market rate)
  { base: "SOL", quote: "USD", rate: 100.0 },
  { base: "USD", quote: "SOL", rate: 0.01 },
  
  // Additional pairs for completeness
  { base: "BTC", quote: "USD", rate: 45000.0 },
  { base: "USD", quote: "BTC", rate: 0.000022 },
  { base: "ETH", quote: "USD", rate: 2500.0 },
  { base: "USD", quote: "ETH", rate: 0.0004 },
];

async function seedExchangeRates() {
  console.log("🌱 Seeding exchange rates...");

  try {
    // Clear existing rates (optional - remove if you want to preserve existing rates)
    await prisma.exchangeRate.deleteMany({});
    console.log("🗑️  Cleared existing exchange rates");

    // Insert initial rates
    for (const rate of INITIAL_EXCHANGE_RATES) {
      await prisma.exchangeRate.upsert({
        where: { base_quote: { base: rate.base, quote: rate.quote } },
        update: { 
          rate: rate.rate, 
          updatedAt: new Date() 
        },
        create: {
          base: rate.base,
          quote: rate.quote,
          rate: rate.rate,
        },
      });
      console.log(`✅ Seeded ${rate.base}/${rate.quote} = ${rate.rate}`);
    }

    console.log(`🎉 Successfully seeded ${INITIAL_EXCHANGE_RATES.length} exchange rates`);
  } catch (error) {
    console.error("❌ Error seeding exchange rates:", error);
    throw error;
  }
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
