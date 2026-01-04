"use client";

import React from 'react';
import StreamingAudioPlayer from '@/components/player/StreamingAudioPlayer';
import MobileNavigation from '@/components/navigation/MobileNavigation';
import { SafeAreaContainer } from '@/components/mobile/MobileOptimizations';

interface AppLayoutProps {
  children: React.ReactNode;
  showPlayer?: boolean;
  showMobileNav?: boolean;
}

export default function AppLayout({ 
  children, 
  showPlayer = true, 
  showMobileNav = true 
}: AppLayoutProps) {
  return (
    <SafeAreaContainer className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-black text-white">
      {/* Main Content */}
      <div className={`${showPlayer ? 'pb-20 md:pb-24' : ''} ${showMobileNav ? 'pb-16 md:pb-0' : ''}`}>
        {children}
      </div>

      {/* Global Audio Player */}
      {showPlayer && (
        <div className="fixed bottom-0 left-0 right-0 z-30">
          <StreamingAudioPlayer />
        </div>
      )}

      {/* Mobile Navigation */}
      {showMobileNav && <MobileNavigation />}
    </SafeAreaContainer>
  );
}
