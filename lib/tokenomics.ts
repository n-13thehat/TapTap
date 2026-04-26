/**
 * TapTap tokenomics — single source of truth.
 *
 * All FE/BE consumers should import constants and helpers from this file
 * rather than redefining percentages, ledger reasons, or market-cache keys.
 *
 * See docs/TOKENOMICS.md for the spec and rationale.
 */

// ---------------------------------------------------------------------------
// TapTax (applied to every non-tip TAP transfer)
// ---------------------------------------------------------------------------
// Stored in basis points (1 bps = 0.01%) so changes here flow to every
// consumer with no rounding surprises.

export const BPS_DENOMINATOR = 10_000;

export const TAPTAX_TREASURY_BPS = 600; // 6%
export const TAPTAX_BURN_BPS = 300;     // 3%
export const TAPTAX_TOTAL_BPS = TAPTAX_TREASURY_BPS + TAPTAX_BURN_BPS; // 900 = 9%

export const TAPTAX_TREASURY_PCT = TAPTAX_TREASURY_BPS / 100; // 6
export const TAPTAX_BURN_PCT = TAPTAX_BURN_BPS / 100;         // 3
export const TAPTAX_TOTAL_PCT = TAPTAX_TOTAL_BPS / 100;       // 9

export type TapTaxBreakdown = {
  /** Total tax taken from sender (treasury + burn). */
  tax: number;
  /** Portion routed to the on-chain treasury wallet. */
  treasury: number;
  /** Portion permanently removed from circulation. */
  burn: number;
};

/**
 * Compute the TapTax breakdown for a non-tip transfer.
 *
 * `amount` is in whole TAP units (TAP_DECIMALS=0). Each component is floored
 * independently so the recipient is never overpaid; rounding dust is kept by
 * the sender.
 */
export function computeTapTax(amount: number): TapTaxBreakdown {
  const a = Math.max(0, Math.floor(Number(amount || 0)));
  const treasury = Math.floor((a * TAPTAX_TREASURY_BPS) / BPS_DENOMINATOR);
  const burn = Math.floor((a * TAPTAX_BURN_BPS) / BPS_DENOMINATOR);
  return { tax: treasury + burn, treasury, burn };
}

// ---------------------------------------------------------------------------
// Tax-exempt reasons
// ---------------------------------------------------------------------------
// Reasons listed here bypass TapTax entirely. Comparison is case-insensitive.
// NOTE: keep this in sync with applyTapTaxTransfer in lib/tax.ts.

export const TAX_EXEMPT_REASONS: ReadonlySet<string> = new Set(["TIP"]);

export function isTaxExemptReason(reason?: string | null): boolean {
  return TAX_EXEMPT_REASONS.has(String(reason || "").toUpperCase());
}

// ---------------------------------------------------------------------------
// Ledger reason codes (TapCoinTransaction.reason / Distribution.type)
// ---------------------------------------------------------------------------

export const REASON_TAPTAX_TREASURY = "TAPTAX_TREASURY" as const;
export const REASON_TIP = "TIP" as const;
export const REASON_AIRDROP = "AIRDROP" as const;
export const REASON_SEND = "SEND" as const;
export const REASON_RECEIVE = "RECEIVE" as const;

export const DISTRIBUTION_TYPE_TREASURY = "TREASURY" as const;
export const DISTRIBUTION_TYPE_BURN = "BURN" as const;

// ---------------------------------------------------------------------------
// Market price cache (Setting table, owner = "market")
// ---------------------------------------------------------------------------
// Both keys are read by the admin Economy Control Center and the runtime
// exchange-rate helpers in lib/exchange-rates.ts.

export const MARKET_SETTING_USER_ID = "market" as const;
export const MARKET_SOL_USD_KEY = "market:sol:usd" as const;
export const MARKET_TAP_USD_KEY = "market:tap:usd" as const;

/** TTL for the SOL/USD CoinGecko cache before a refresh is attempted. */
export const MARKET_PRICE_CACHE_TTL_MS = 60_000;

// ---------------------------------------------------------------------------
// On-chain mint configuration (read at runtime via getSolanaConfig)
// ---------------------------------------------------------------------------
// Defaults match lib/solana.ts. Whole-token (decimals=0) is the launch
// configuration; raise via TAP_DECIMALS env if/when the mint is upgraded.

export const TAP_DECIMALS_DEFAULT = 0;
