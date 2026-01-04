"use client";

import React from 'react';
import GlobalSearch from '@/components/GlobalSearch';
import { GlobalSearchStateProvider, useGlobalSearch } from '@/hooks/useGlobalSearch';

type Props = {
  children: React.ReactNode;
};

export default function GlobalSearchProvider({ children }: Props) {
  return (
    <GlobalSearchStateProvider>
      {children}
      <GlobalSearchOverlay />
    </GlobalSearchStateProvider>
  );
}

function GlobalSearchOverlay() {
  const { isOpen, closeSearch } = useGlobalSearch();
  return <GlobalSearch isOpen={isOpen} onClose={closeSearch} />;
}
