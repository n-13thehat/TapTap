"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Flame,
  LibraryIcon,
  Mic2,
  ShoppingCart,
  Swords,
  Waves,
  Radio,
  MessageSquareText,
  Compass,
  Disc,
  WalletIcon,
  Gamepad2,
  Settings,
  Menu,
  X,
  Terminal
} from 'lucide-react';
import { useIsMobile } from '@/components/mobile/MobileOptimizations';

const navigationItems = [
  { href: "/", label: "Home", icon: Home, category: "main" },
  { href: "/social", label: "Social", icon: Flame, category: "main" },
  { href: "/library", label: "Library", icon: LibraryIcon, category: "main" },
  { href: "/creator", label: "Creator", icon: Mic2, category: "create" },
  { href: "/marketplace", label: "Marketplace", icon: ShoppingCart, category: "create" },
  { href: "/battles", label: "Battles", icon: Swords, category: "engage" },
  { href: "/surf", label: "Surf", icon: Waves, category: "engage" },
  { href: "/live", label: "Live", icon: Radio, category: "engage" },
  { href: "/dm", label: "Messages", icon: MessageSquareText, category: "social" },
  { href: "/explore", label: "Explore", icon: Compass, category: "discover" },
  { href: "/mainframe", label: "Mainframe", icon: Disc, category: "system" },
  { href: "/wallet", label: "Wallet", icon: WalletIcon, category: "system" },
  { href: "/stemstation", label: "StemStation", icon: Gamepad2, category: "system" },
];

export default function MobileNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const isMobile = useIsMobile();

  if (!isMobile) return null;

  const mainItems = navigationItems.filter(item => 
    ['/', '/social', '/library', '/battles', '/explore'].includes(item.href)
  );

  return (
    <>
      {/* Bottom Tab Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-black/95 backdrop-blur-md border-t border-white/10 safe-area-pb">
        <div className="flex items-center justify-around px-2 py-2">
          {mainItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors min-w-0 ${
                  isActive
                    ? 'text-teal-300 bg-teal-500/20'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-xs font-medium truncate">{item.label}</span>
              </Link>
            );
          })}
          
          {/* More Menu */}
          <button
            onClick={() => setIsOpen(true)}
            className="flex flex-col items-center gap-1 p-2 rounded-lg text-white/60 hover:text-white transition-colors"
          >
            <Menu className="h-5 w-5" />
            <span className="text-xs font-medium">More</span>
          </button>
        </div>
      </div>

      {/* Full Screen Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-4 z-50 bg-black/95 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-md bg-teal-500/20 ring-1 ring-teal-400/30 flex items-center justify-center">
                    <Terminal className="h-5 w-5 text-teal-300" />
                  </div>
                  <span className="font-bold text-teal-300">TapTap Matrix</span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Navigation Grid */}
              <div className="p-4 overflow-y-auto">
                <div className="grid grid-cols-2 gap-3">
                  {navigationItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center gap-3 p-4 rounded-xl transition-all ${
                          isActive
                            ? 'bg-teal-500/20 text-teal-300 border border-teal-400/30'
                            : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10'
                        }`}
                      >
                        <item.icon className="h-6 w-6" />
                        <div>
                          <div className="font-medium">{item.label}</div>
                          <div className="text-xs opacity-60 capitalize">{item.category}</div>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {/* Settings */}
                <div className="mt-6 pt-4 border-t border-white/10">
                  <Link
                    href="/settings"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 p-4 rounded-xl bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10 transition-all"
                  >
                    <Settings className="h-6 w-6" />
                    <div>
                      <div className="font-medium">Settings</div>
                      <div className="text-xs opacity-60">Preferences & account</div>
                    </div>
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
