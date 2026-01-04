import { NextRequest, NextResponse } from "next/server";
import { BOOTSTRAP_FLAGS, FeatureFlag, FeatureFlagConfig } from "@/lib/featureFlags";

type FlagOverride = Partial<Pick<FeatureFlag, "enabled" | "rolloutPercentage" | "description" | "userGroups" | "environment">>;

function parseJsonOverrides(): Record<string, FlagOverride> {
  const raw = process.env.FEATURE_FLAGS_JSON || process.env.TAPTAP_FEATURE_FLAGS;
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return {};
    const entries: Record<string, FlagOverride> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value !== "object" || value === null) continue;
      entries[key] = value as FlagOverride;
    }
    return entries;
  } catch (err) {
    console.error("[feature-flags] Failed to parse FEATURE_FLAGS_JSON", err);
    return {};
  }
}

function buildConfig(): FeatureFlagConfig {
  const overrides = parseJsonOverrides();
  const merged: Record<string, FeatureFlag> = { ...BOOTSTRAP_FLAGS };

  for (const [key, override] of Object.entries(overrides)) {
    const base = merged[key] ?? { key, enabled: false, description: "" };
    merged[key] = { ...base, ...override, key };
  }

  const environment = process.env.FEATURE_FLAG_ENV || process.env.NODE_ENV || "development";
  const version = process.env.FEATURE_FLAGS_VERSION || "remote-1.0";

  const config: FeatureFlagConfig = {
    flags: merged,
    version,
    lastUpdated: new Date().toISOString(),
    environment,
  };

  return config;
}

export async function GET(_req: NextRequest) {
  const config = buildConfig();
  return NextResponse.json(config, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
