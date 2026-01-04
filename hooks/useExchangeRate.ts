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
  loading: boolean;
  error: string | null;
  convertTapToUsd: (tapAmount: number) => number;
  convertUsdToTap: (usdAmount: number) => number;
  refresh: () => Promise<void>;
}

const DEFAULT_TAP_USD_RATE = 0.01; // 1 TapCoin = $0.01 USD (fallback)

export function useExchangeRate(): UseExchangeRateReturn {
  const [rate, setRate] = useState<number>(DEFAULT_TAP_USD_RATE);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExchangeRate = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/exchange-rates?base=TAPC&quote=USD');

      if (!response.ok) {
        throw new Error(`Failed to fetch exchange rate: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.rates && data.rates.length > 0) {
        setRate(data.rates[0].rate);
      } else {
        // Use default rate if API doesn't return a rate
        setRate(DEFAULT_TAP_USD_RATE);
      }
    } catch (err) {
      console.warn('Failed to fetch exchange rate, using default:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch exchange rate');
      setRate(DEFAULT_TAP_USD_RATE);
    } finally {
      setLoading(false);
    }
  }, []);

  const convertTapToUsd = useCallback((tapAmount: number): number => {
    return Number((tapAmount * rate).toFixed(2));
  }, [rate]);

  const convertUsdToTap = useCallback((usdAmount: number): number => {
    return Number((usdAmount / rate).toFixed(0));
  }, [rate]);

  const refresh = useCallback(async () => {
    await fetchExchangeRate();
  }, [fetchExchangeRate]);

  useEffect(() => {
    fetchExchangeRate();
  }, [fetchExchangeRate]);

  return {
    rate,
    loading,
    error,
    convertTapToUsd,
    convertUsdToTap,
    refresh,
  };
}

export default useExchangeRate;
