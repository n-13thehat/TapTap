"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Music, 
  Gamepad2, 
  Users, 
  Wallet2, 
  Settings, 
  Search,
  Bell,
  Menu,
  X,
  Zap,
  Globe,
  Upload,
  Library,
  ShoppingBag,
  Radio,
  Bot,
  Telescope,
  Sword,
  Palette,
  MessageSquare,
  Waves,
  Terminal
} from 'lucide-react';

const navigationItems = [
  { href: '/home', label: 'Home', icon: Home, category: 'main' },
  { href: '/stemstation', label: 'STEMSTATION', icon: Music, category: 'gaming' },
  { href: '/battles', label: 'Battles', icon: Sword, category: 'gaming' },
  { href: '/social', label: 'Social', icon: Users, category: 'social' },
  { href: '/creator', label: 'Creator', icon: Palette, category: 'create' },
  { href: '/library', label: 'Library', icon: Library, category: 'content' },
  { href: '/marketplace', label: 'Marketplace', icon: ShoppingBag, category: 'content' },
  { href: '/explore', label: 'Explore', icon: Globe, category: 'discover' },
  { href: '/astro', label: 'Astro', icon: Telescope, category: 'discover' },
  { href: '/ai', label: 'AI', icon: Bot, category: 'tools' },
  { href: '/surf', label: 'Surf', icon: Waves, category: 'tools' },
  { href: '/upload', label: 'Upload', icon: Upload, category: 'create' },
  { href: '/live', label: 'Live', icon: Radio, category: 'social' },
  { href: '/wallet', label: 'Wallet', icon: Wallet2, category: 'account' },
  { href: '/dm', label: 'Messages', icon: MessageSquare, category: 'social' },
  { href: '/mainframe', label: 'Mainframe', icon: Terminal, category: 'tools' },
  { href: '/posterize', label: 'Posterize', icon: Zap, category: 'create' },
  { href: '/settings', label: 'Settings', icon: Settings, category: 'account' },
];

const categories = {
  main: 'Main',
  gaming: 'Gaming',
  social: 'Social',
  create: 'Create',
  content: 'Content',
  discover: 'Discover',
  tools: 'Tools',
  account: 'Account'
};

interface UnifiedNavigationProps {
  variant?: 'sidebar' | 'header' | 'mobile';
  showCategories?: boolean;
}

export default function UnifiedNavigation({ 
  variant = 'sidebar', 
  showCategories = true 
}: UnifiedNavigationProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  if (variant === 'header') {
    return (
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link href="/home" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-teal-500/20 ring-1 ring-teal-400/30 flex items-center justify-center">
              <Terminal className="h-5 w-5 text-teal-300" />
            </div>
            <span className="font-bold text-teal-300">TapTap Matrix</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navigationItems.slice(0, 6).map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? 'bg-teal-500/20 text-teal-300'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden rounded-md border border-white/10 bg-white/5 p-2 text-white/70 hover:bg-white/10"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-white/10 bg-black/90 backdrop-blur md:hidden"
            >
              <div className="px-4 py-4 space-y-2">
                {navigationItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                        isActive
                          ? 'bg-teal-500/20 text-teal-300'
                          : 'text-white/70 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    );
  }

  if (variant === 'sidebar') {
    const groupedItems = navigationItems.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, typeof navigationItems>);

    return (
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-white/10 bg-black/80 backdrop-blur">
        <div className="flex h-full flex-col">
          <div className="border-b border-white/10 p-4">
            <Link href="/home" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-md bg-teal-500/20 ring-1 ring-teal-400/30 flex items-center justify-center">
                <Terminal className="h-5 w-5 text-teal-300" />
              </div>
              <span className="font-bold text-teal-300">TapTap Matrix</span>
            </Link>
          </div>

          <nav className="flex-1 overflow-y-auto p-4">
            {showCategories ? (
              <div className="space-y-6">
                {Object.entries(groupedItems).map(([category, items]) => (
                  <div key={category}>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">
                      {categories[category as keyof typeof categories]}
                    </h3>
                    <div className="space-y-1">
                      {items.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                              isActive
                                ? 'bg-teal-500/20 text-teal-300'
                                : 'text-white/70 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {navigationItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                        isActive
                          ? 'bg-teal-500/20 text-teal-300'
                          : 'text-white/70 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </nav>
        </div>
      </aside>
    );
  }

  return null;
}
