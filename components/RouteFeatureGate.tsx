"use client";

import React from "react";
import { ShieldAlert, CircleDashed } from "lucide-react";
import { useFeatureFlagsContext } from "@/providers/FeatureFlagsProvider";

type RouteFeatureGateProps = {
  flag: string;
  title?: string;
  description?: string;
  children: React.ReactNode;
};

export function RouteFeatureGate({ flag, title, description, children }: RouteFeatureGateProps) {
  const { isEnabled, loading } = useFeatureFlagsContext();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="flex items-center gap-2 text-sm text-white/70">
          <CircleDashed className="h-4 w-4 animate-spin" />
          Checking access...
        </div>
      </div>
    );
  }

  if (!isEnabled(flag)) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 space-y-3 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/20 text-amber-300">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div className="text-lg font-semibold">
            {title || "Feature temporarily disabled"}
          </div>
          <div className="text-sm text-white/70">
            {description ||
              "This area is gated by feature flags. Reach out to an admin to enable it or try again later."}
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
