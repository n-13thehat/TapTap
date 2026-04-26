"use client";

import React from 'react';
import { SessionProvider } from 'next-auth/react';
import AuthProvider from "@/providers/AuthProvider";
import { FeatureFlagsProvider } from "@/providers/FeatureFlagsProvider";
import { EventBusProvider } from "@/providers/EventBusProvider";
import GlobalSearchProvider from "@/providers/GlobalSearchProvider";
import { ToastProvider } from "@/components/ui/toast-provider";

interface ConsolidatedProviderProps {
  children: React.ReactNode;
  session?: any;
}

export default function ConsolidatedProvider({ children, session }: ConsolidatedProviderProps) {
  return (
    <SessionProvider session={session}>
      <AuthProvider session={session}>
        <FeatureFlagsProvider>
          <EventBusProvider>
            <GlobalSearchProvider>
              <ToastProvider>
                {children}
              </ToastProvider>
            </GlobalSearchProvider>
          </EventBusProvider>
        </FeatureFlagsProvider>
      </AuthProvider>
    </SessionProvider>
  );
}
