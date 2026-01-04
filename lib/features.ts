// Centralized feature flags and helpers
// Client-safe and server-safe accessors with sensible defaults.

export type FeatureFlags = {
  surfPaywall: boolean;
  tapGame: boolean;
  battles: boolean;
  offRamp: boolean;
  deluxeMint: boolean;
  creatorHub: boolean;
  liveStreaming: boolean;
  astroVibes: boolean;
  betaUnlock: boolean;
};

export function envFlag(name: string, def: boolean): boolean {
  const v = process.env[name];
  if (typeof v === "string") {
    const s = v.toLowerCase();
    if (["1", "true", "yes", "on"].includes(s)) return true;
    if (["0", "false", "no", "off"].includes(s)) return false;
  }
  return def;
}

export function defaultFlags(): FeatureFlags {
  return {
    surfPaywall: envFlag("NEXT_PUBLIC_SURF_PAYWALL", false),
    tapGame: envFlag("NEXT_PUBLIC_TAPGAME", true),
    battles: envFlag("NEXT_PUBLIC_BATTLES", true),
    offRamp: envFlag("NEXT_PUBLIC_OFFRAMP", true),
    deluxeMint: envFlag("NEXT_PUBLIC_DELUXE_MINT", true),
    creatorHub: envFlag("NEXT_PUBLIC_CREATOR_HUB", true),
    liveStreaming: envFlag("NEXT_PUBLIC_LIVE_STREAMING", true),
    astroVibes: envFlag("NEXT_PUBLIC_ASTRO_VIBES", true),
    betaUnlock: false,
  };
}

// Server helper to read beta unlock from cookies (if implemented)
export function betaFromCookie(cookieHeader?: string): boolean {
  try {
    if (!cookieHeader) return false;
    // naive parse
    const parts = cookieHeader.split(/;\s*/);
    const row = parts.find((p) => p.startsWith("taptap.beta="));
    if (!row) return false;
    return row.split("=")[1] === "1";
  } catch {
    return false;
  }
}

export function getServerFlags(cookieHeader?: string): FeatureFlags {
  const f = defaultFlags();
  f.betaUnlock = betaFromCookie(cookieHeader);
  return f;
}

// Client-side flags, reading localStorage for beta unlock to avoid SSR coupling
export function getClientFlags(): FeatureFlags {
  const f = defaultFlags();
  try {
    if (typeof window !== "undefined") {
      const v = localStorage.getItem("taptap.betaUnlock");
      f.betaUnlock = v === "1";
    }
  } catch {}
  return f;
}

