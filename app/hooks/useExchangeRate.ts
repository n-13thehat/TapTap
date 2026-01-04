import { useState, useEffect, useCallback } from "react";

interface ExchangeRateData {
  rate: number;
  timestamp: string;
  tapToUsd?: { tap: number; usd: number };
  usdToTap?: { usd: number; tap: number };
}

interface UseExchangeRateReturn {
  rate: number;
  loading: boolean;
  error: string | null;
  convertTapToUsd: (tap: number) => number;
  convertUsdToTap: (usd: number) => number;
  refresh: () => void;
}

const FALLBACK_RATE = 0.25; // TAP to USD fallback rate

export function useExchangeRate(): UseExchangeRateReturn {
  const [rate, setRate] = useState<number>(FALLBACK_RATE);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRate = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/exchange-rates/tap-usd");
      const data: ExchangeRateData = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch exchange rate");
      }

      setRate(data.rate);
    } catch (err: any) {
      console.error("Exchange rate fetch error:", err);
      setError(err.message || "Failed to fetch exchange rate");
      // Keep using fallback rate on error
      setRate(FALLBACK_RATE);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRate();
    
    // Refresh rate every 5 minutes
    const interval = setInterval(fetchRate, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [fetchRate]);

  const convertTapToUsd = useCallback((tap: number): number => {
    return tap * rate;
  }, [rate]);

  const convertUsdToTap = useCallback((usd: number): number => {
    return usd / rate;
  }, [rate]);

  const refresh = useCallback(() => {
    fetchRate();
  }, [fetchRate]);

  return {
    rate,
    loading,
    error,
    convertTapToUsd,
    convertUsdToTap,
    refresh,
  };
}

// Hook for converting specific amounts
export function useTapUsdConversion(tapAmount?: number, usdAmount?: number) {
  const [result, setResult] = useState<{
    tapToUsd?: number;
    usdToTap?: number;
    loading: boolean;
    error: string | null;
  }>({
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!tapAmount && !usdAmount) {
      setResult({ loading: false, error: null });
      return;
    }

    const fetchConversion = async () => {
      try {
        setResult(prev => ({ ...prev, loading: true, error: null }));

        const params = new URLSearchParams();
        if (tapAmount) params.set("tap", tapAmount.toString());
        if (usdAmount) params.set("usd", usdAmount.toString());

        const response = await fetch(`/api/exchange-rates/tap-usd?${params}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Conversion failed");
        }

        setResult({
          tapToUsd: data.tapToUsd?.usd,
          usdToTap: data.usdToTap?.tap,
          loading: false,
          error: null,
        });
      } catch (err: any) {
        console.error("Conversion error:", err);
        setResult({
          loading: false,
          error: err.message || "Conversion failed",
          // Provide fallback conversions
          tapToUsd: tapAmount ? tapAmount * FALLBACK_RATE : undefined,
          usdToTap: usdAmount ? usdAmount / FALLBACK_RATE : undefined,
        });
      }
    };

    fetchConversion();
  }, [tapAmount, usdAmount]);

  return result;
}
