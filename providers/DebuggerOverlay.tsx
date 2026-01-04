"use client";

import React from 'react';
import { FeatureFlagsDebugger } from "@/providers/FeatureFlagsProvider";
import { EventBusDebugger } from "@/providers/EventBusProvider";
import { QueuePersistenceDebugger } from "@/providers/QueuePersistenceProvider";
import { AnalyticsDebugger } from "@/providers/AnalyticsProvider";

export default function DebuggerOverlay() {
  // Only render debuggers in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <>
      <FeatureFlagsDebugger />
      <EventBusDebugger />
      <QueuePersistenceDebugger />
      <AnalyticsDebugger />
    </>
  );
}
