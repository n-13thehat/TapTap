"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface BrandWatermarkProps {
  className?: string;
}

export default function BrandWatermark({ className = '' }: BrandWatermarkProps) {
  const [isVisible, setIsVisible] = useState(true);

  // Respect user's motion preferences
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setIsVisible(false);
    }
  }, []);

  if (!isVisible) return null;

  return (
    <div className={`fixed bottom-4 left-4 z-20 pointer-events-none ${className}`}>
      <div className="flex items-center gap-2 opacity-30 hover:opacity-60 transition-opacity duration-300">
        {/* Logo */}
        <div className="relative w-6 h-6 overflow-hidden rounded border border-teal-400/30 bg-black/50">
          <Image
            src="/branding/tap-logo.png"
            alt="TapTap"
            width={24}
            height={24}
            className="h-full w-full object-contain"
            priority
          />
        </div>
        
        {/* Brand Text */}
        <div className="font-mono text-xs text-teal-200/70 tracking-wider">
          <span className="font-semibold">TapTap</span>
          <span className="text-teal-300/50 ml-1">ZION</span>
        </div>
      </div>
    </div>
  );
}
