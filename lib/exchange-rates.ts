import { prisma } from '@/lib/prisma';
import {
  MARKET_SETTING_USER_ID,
  MARKET_SOL_USD_KEY,
  MARKET_TAP_USD_KEY,
} from '@/lib/tokenomics';

export interface ExchangeRate {
  id: string;
  base: string;
  quote: string;
  rate: number;
  updatedAt: Date;
}

/**
 * Read a USD price (per unit) from the market Setting cache populated by
 * the admin Economy Control Center. Returns null if not configured.
 */
async function readMarketUsd(key: string): Promise<number | null> {
  try {
    const s = await prisma.setting.findUnique({
      where: { userId_key: { userId: MARKET_SETTING_USER_ID, key } },
    });
    const v = (s?.value as any)?.usd;
    return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null;
  } catch {
    return null;
  }
}

/**
 * Derive an exchange rate from the live SOL-USD and TAP-USD market cache.
 * Returns null if the legs needed for this pair are not configured.
 */
async function deriveFromMarket(base: string, quote: string): Promise<number | null> {
  const [solUsd, tapUsd] = await Promise.all([
    readMarketUsd(MARKET_SOL_USD_KEY),
    readMarketUsd(MARKET_TAP_USD_KEY),
  ]);
  const key = `${base}-${quote}`;
  switch (key) {
    case 'TAPC-USD': return tapUsd;
    case 'USD-TAPC': return tapUsd ? 1 / tapUsd : null;
    case 'SOL-USD':  return solUsd;
    case 'USD-SOL':  return solUsd ? 1 / solUsd : null;
    case 'TAPC-SOL': return tapUsd && solUsd ? tapUsd / solUsd : null;
    case 'SOL-TAPC': return tapUsd && solUsd ? solUsd / tapUsd : null;
    default: return null;
  }
}

/**
 * Get exchange rate between two currencies.
 * Cascade: ExchangeRate DB row (admin override) -> live market Setting cache
 * (CoinGecko for SOL/USD, manual for TAP/USD via /admin/economy) -> throw.
 *
 * No silent fallback prices; consumers see a clear error if the admin has
 * not configured the necessary market data.
 */
export async function getExchangeRate(base: string, quote: string): Promise<number> {
  // 1. Admin override stored in ExchangeRate table (most recent wins).
  const overrideRow = await prisma.exchangeRate.findFirst({
    where: { base, quote },
    orderBy: { updatedAt: 'desc' },
  }).catch(() => null);
  if (overrideRow && Number.isFinite(overrideRow.rate) && overrideRow.rate > 0) {
    return overrideRow.rate;
  }

  // 2. Derive from the live market cache.
  const derived = await deriveFromMarket(base, quote);
  if (derived !== null && Number.isFinite(derived) && derived > 0) {
    return derived;
  }

  throw new Error(
    `Exchange rate ${base}/${quote} is not configured. ` +
    `Set the price at /admin/economy or seed an ExchangeRate row.`
  );
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
