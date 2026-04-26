import { useState, useEffect, useCallback } from 'react';

export interface ExchangeRate {
  id: string;
  base: string;
  quote: string;
  rate: number;
  updatedAt: Date;
}

export interface UseExchangeRateReturn {
  rate: number;
  ready: boolean;
  loading: boolean;
  error: string | null;
  convertTapToUsd: (tapAmount: number) => number;
  convertUsdToTap: (usdAmount: number) => number;
  refresh: () => Promise<void>;
}

// No silent fallback. If TAP/USD has not been configured at /admin/economy,
// `ready` is false and consumers should hide USD displays rather than print
// a stale price.
export function useExchangeRate(): UseExchangeRateReturn {
  const [rate, setRate] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExchangeRate = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/exchange-rates/tap-usd');
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.error || `Failed to fetch exchange rate: ${response.statusText}`);
      }

      const next = typeof data?.rate === 'number' && data.rate > 0 ? data.rate : 0;
      setRate(next);
    } catch (err) {
      console.warn('Exchange rate unavailable:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch exchange rate');
      setRate(0);
    } finally {
      setLoading(false);
    }
  }, []);

  const convertTapToUsd = useCallback((tapAmount: number): number => {
    return rate > 0 ? Number((tapAmount * rate).toFixed(2)) : 0;
  }, [rate]);

  const convertUsdToTap = useCallback((usdAmount: number): number => {
    return rate > 0 ? Number((usdAmount / rate).toFixed(0)) : 0;
  }, [rate]);

  const refresh = useCallback(async () => {
    await fetchExchangeRate();
  }, [fetchExchangeRate]);

  useEffect(() => {
    fetchExchangeRate();
  }, [fetchExchangeRate]);

  return {
    rate,
    ready: rate > 0 && !error,
    loading,
    error,
    convertTapToUsd,
    convertUsdToTap,
    refresh,
  };
}

export default useExchangeRate;
