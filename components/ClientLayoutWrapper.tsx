"use client";

import React, { Suspense } from "react";
import ConsolidatedProvider from "@/providers/ConsolidatedProvider";
import BrandWatermark from "@/components/BrandWatermark";
import Layout from "@/components/Layout";
import PWAInitializer from "@/components/PWAInitializer";
import { MatrixRainProvider } from "@/providers/MatrixRainProvider";
import { useFeatureFlagsContext } from "@/providers/FeatureFlagsProvider";
import { dynamicDebug, dynamicVisual, dynamicClientOnly } from "@/lib/utils/dynamic-imports";

// Enhanced dynamic imports with proper SSR handling and error boundaries
const DebuggerOverlay = dynamicDebug(() => import("@/providers/DebuggerOverlay"));
const AbstractOrb = dynamicVisual(() => import("@/visuals/AbstractOrb"));
const AssistiveOverlay = dynamicClientOnly(() => import("@/providers/AssistiveOverlay"));
const MatrixIframeInitializer = dynamicClientOnly(() => import("@/components/MatrixIframeInitializer"));

function DebugOverlaySlot() {
  const { isEnabled } = useFeatureFlagsContext();
  if (!isEnabled("matrixDebugOverlay")) return null;
  return <DebuggerOverlay />;
}

interface ClientLayoutWrapperProps {
  children: React.ReactNode;
}

export default function ClientLayoutWrapper({ children }: ClientLayoutWrapperProps) {
  return (
    <ConsolidatedProvider>
      <MatrixRainProvider>
        <BrandWatermark />
        <div className="relative z-10 matrix-content">
          <Layout>{children}</Layout>
        </div>
        <PWAInitializer />
        <DebugOverlaySlot />
      </MatrixRainProvider>
    </ConsolidatedProvider>
  );
}
