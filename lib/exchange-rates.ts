import { prisma } from '@/lib/prisma';

export interface ExchangeRate {
  id: string;
  base: string;
  quote: string;
  rate: number;
  updatedAt: Date;
}

// Default exchange rates for fallback
const DEFAULT_RATES: Record<string, number> = {
  'TAPC-USD': 0.25, // 1 TapCoin = $0.25 USD
  'USD-TAPC': 4.0,  // $1 = 4 TapCoin
  'TAPC-SOL': 0.0025, // 1 TapCoin = 0.0025 SOL
  'SOL-TAPC': 400.0,  // 1 SOL = 400 TapCoin
  'SOL-USD': 100.0,   // 1 SOL = $100 USD
  'USD-SOL': 0.01,    // $1 = 0.01 SOL
};

/**
 * Get exchange rate between two currencies
 * @param base Base currency (e.g., "TAPC", "USD", "SOL")
 * @param quote Quote currency (e.g., "USD", "SOL", "TAPC")
 * @returns Exchange rate (1 base = rate quote)
 */
export async function getExchangeRate(base: string, quote: string): Promise<number> {
  try {
    // Try to get from database first
    const exchangeRate = await prisma.exchangeRate.findFirst({
      where: { base, quote },
      orderBy: { updatedAt: 'desc' },
    });

    if (exchangeRate) {
      return exchangeRate.rate;
    }

    // Fall back to default rates
    const rateKey = `${base}-${quote}`;
    const defaultRate = DEFAULT_RATES[rateKey];

    if (defaultRate) {
      // Optionally create the default rate in the database for future use
      try {
        await prisma.exchangeRate.upsert({
          where: {
            id: `${base}-${quote}-default`,
          },
          update: {
            rate: defaultRate,
            updatedAt: new Date(),
          },
          create: {
            id: `${base}-${quote}-default`,
            base,
            quote,
            rate: defaultRate,
          },
        });
      } catch (dbError) {
        // Ignore database errors for default rate creation
        console.warn('Failed to create default exchange rate:', dbError);
      }

      return defaultRate;
    }

    // If no rate found, throw error
    throw new Error(`Exchange rate not found for ${base}/${quote}`);
  } catch (error) {
    console.error('Error getting exchange rate:', error);
    
    // Return a safe fallback rate
    const fallbackKey = `${base}-${quote}`;
    const fallbackRate = DEFAULT_RATES[fallbackKey];
    
    if (fallbackRate) {
      return fallbackRate;
    }

    // Ultimate fallback - assume 1:1 ratio
    return 1.0;
  }
}

/**
 * Convert TapCoin amount to USD
 * @param tapAmount Amount in TapCoin
 * @returns Amount in USD
 */
export async function tapToUsd(tapAmount: number): Promise<number> {
  const rate = await getExchangeRate('TAPC', 'USD');
  return Number((tapAmount * rate).toFixed(2));
}

/**
 * Convert USD amount to TapCoin
 * @param usdAmount Amount in USD
 * @returns Amount in TapCoin
 */
export async function usdToTap(usdAmount: number): Promise<number> {
  const rate = await getExchangeRate('USD', 'TAPC');
  return Number((usdAmount * rate).toFixed(0));
}

/**
 * Convert USD cents to TapCoin
 * @param usdCents Amount in USD cents (e.g., 100 cents = $1.00)
 * @returns Amount in TapCoin
 */
export async function usdCentsToTap(usdCents: number): Promise<number> {
  const usdAmount = usdCents / 100; // Convert cents to dollars
  return await usdToTap(usdAmount);
}

/**
 * Convert TapCoin amount to SOL
 * @param tapAmount Amount in TapCoin
 * @returns Amount in SOL
 */
export async function tapToSol(tapAmount: number): Promise<number> {
  const rate = await getExchangeRate('TAPC', 'SOL');
  return Number((tapAmount * rate).toFixed(6));
}

/**
 * Convert SOL amount to TapCoin
 * @param solAmount Amount in SOL
 * @returns Amount in TapCoin
 */
export async function solToTap(solAmount: number): Promise<number> {
  const rate = await getExchangeRate('SOL', 'TAPC');
  return Number((solAmount * rate).toFixed(0));
}

/**
 * Update exchange rate in database
 * @param base Base currency
 * @param quote Quote currency
 * @param rate New exchange rate
 * @returns Updated exchange rate record
 */
export async function updateExchangeRate(
  base: string,
  quote: string,
  rate: number
): Promise<ExchangeRate> {
  return await prisma.exchangeRate.upsert({
    where: {
      id: `${base}-${quote}`,
    },
    update: {
      rate,
      updatedAt: new Date(),
    },
    create: {
      id: `${base}-${quote}`,
      base,
      quote,
      rate,
    },
  });
}

/**
 * Get all exchange rates
 * @returns Array of all exchange rates
 */
export async function getAllExchangeRates(): Promise<ExchangeRate[]> {
  return await prisma.exchangeRate.findMany({
    orderBy: { updatedAt: 'desc' },
  });
}
