import { prisma } from "@/lib/prisma";

export interface ExchangeRate {
  id?: string;
  base: string;
  quote: string;
  rate: number;
  updatedAt: Date;
  createdAt: Date;
}

// Default exchange rates for fallback
const DEFAULT_RATES: ExchangeRate[] = [
  { base: "TAPC", quote: "USD", rate: 0.25, updatedAt: new Date(), createdAt: new Date() },
  { base: "USD", quote: "TAPC", rate: 4.0, updatedAt: new Date(), createdAt: new Date() },
  { base: "TAPC", quote: "SOL", rate: 0.0025, updatedAt: new Date(), createdAt: new Date() },
  { base: "SOL", quote: "TAPC", rate: 400.0, updatedAt: new Date(), createdAt: new Date() },
  { base: "SOL", quote: "USD", rate: 100.0, updatedAt: new Date(), createdAt: new Date() },
  { base: "USD", quote: "SOL", rate: 0.01, updatedAt: new Date(), createdAt: new Date() },
];

/**
 * Get exchange rate between two currencies
 */
export async function getExchangeRate(base: string, quote: string): Promise<number> {
  try {
    // Try to get from database first
    const rate = await prisma.exchangeRate.findUnique({
      where: { base_quote: { base, quote } },
    });

    if (rate) {
      return rate.rate;
    }

    // Fallback to default rates
    const defaultRate = DEFAULT_RATES.find(r => r.base === base && r.quote === quote);
    if (defaultRate) {
      return defaultRate.rate;
    }

    // Try inverse rate
    const inverseRate = await prisma.exchangeRate.findUnique({
      where: { base_quote: { base: quote, quote: base } },
    });

    if (inverseRate) {
      return 1 / inverseRate.rate;
    }

    // Fallback to inverse default rate
    const inverseDefaultRate = DEFAULT_RATES.find(r => r.base === quote && r.quote === base);
    if (inverseDefaultRate) {
      return 1 / inverseDefaultRate.rate;
    }

    throw new Error(`Exchange rate not found for ${base}/${quote}`);
  } catch (error) {
    console.error(`Error getting exchange rate for ${base}/${quote}:`, error);
    // Return a safe default if all else fails
    if (base === "TAPC" && quote === "USD") return 0.25;
    if (base === "USD" && quote === "TAPC") return 4.0;
    throw error;
  }
}

/**
 * Convert amount from one currency to another
 */
export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  const rate = await getExchangeRate(fromCurrency, toCurrency);
  return amount * rate;
}

/**
 * Convert TAP to USD
 */
export async function tapToUsd(tapAmount: number): Promise<number> {
  return convertCurrency(tapAmount, "TAPC", "USD");
}

/**
 * Convert USD to TAP
 */
export async function usdToTap(usdAmount: number): Promise<number> {
  return convertCurrency(usdAmount, "USD", "TAPC");
}

/**
 * Convert USD cents to TAP
 */
export async function usdCentsToTap(cents: number): Promise<number> {
  const usdAmount = cents / 100;
  return usdToTap(usdAmount);
}

/**
 * Convert TAP to USD cents
 */
export async function tapToUsdCents(tapAmount: number): Promise<number> {
  const usdAmount = await tapToUsd(tapAmount);
  return Math.round(usdAmount * 100);
}

/**
 * Get all current exchange rates
 */
export async function getAllExchangeRates(): Promise<ExchangeRate[]> {
  try {
    const rates = await prisma.exchangeRate.findMany({
      orderBy: { updatedAt: "desc" },
    });

    // If no rates in database, return defaults
    if (rates.length === 0) {
      return DEFAULT_RATES;
    }

    return rates;
  } catch (error) {
    console.error("Error getting all exchange rates:", error);
    return DEFAULT_RATES;
  }
}

/**
 * Update or create exchange rate
 */
export async function updateExchangeRate(
  base: string,
  quote: string,
  rate: number
): Promise<ExchangeRate> {
  return prisma.exchangeRate.upsert({
    where: { base_quote: { base, quote } },
    update: { rate, updatedAt: new Date() },
    create: { base, quote, rate },
  });
}
