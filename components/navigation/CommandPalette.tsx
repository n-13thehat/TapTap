"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Home, Music, Users, ShoppingBag, Gamepad2, Zap, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

interface Command {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  keywords: string[];
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const router = useRouter();

  const commands: Command[] = [
    {
      id: 'home',
      label: 'Go to Home',
      icon: <Home className="w-4 h-4" />,
      action: () => router.push('/home'),
      keywords: ['home', 'dashboard', 'main'],
    },
    {
      id: 'library',
      label: 'Go to Library',
      icon: <Music className="w-4 h-4" />,
      action: () => router.push('/library'),
      keywords: ['library', 'music', 'tracks', 'songs'],
    },
    {
      id: 'social',
      label: 'Go to Social',
      icon: <Users className="w-4 h-4" />,
      action: () => router.push('/social'),
      keywords: ['social', 'feed', 'community', 'friends'],
    },
    {
      id: 'marketplace',
      label: 'Go to Marketplace',
      icon: <ShoppingBag className="w-4 h-4" />,
      action: () => router.push('/marketplace'),
      keywords: ['marketplace', 'shop', 'buy', 'store'],
    },
    {
      id: 'stemstation',
      label: 'Go to StemStation',
      icon: <Gamepad2 className="w-4 h-4" />,
      action: () => router.push('/stemstation'),
      keywords: ['stemstation', 'game', 'play', 'rhythm'],
    },
    {
      id: 'battles',
      label: 'Go to Battles',
      icon: <Zap className="w-4 h-4" />,
      action: () => router.push('/battles'),
      keywords: ['battles', 'compete', 'challenge'],
    },
  ];

  const filteredCommands = commands.filter(cmd =>
    cmd.label.toLowerCase().includes(search.toLowerCase()) ||
    cmd.keywords.some(kw => kw.toLowerCase().includes(search.toLowerCase()))
  );

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setIsOpen(prev => !prev);
    }
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const executeCommand = (command: Command) => {
    command.action();
    setIsOpen(false);
    setSearch('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1400]"
          />

          {/* Command Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-2xl z-[1500] px-4"
          >
            <Card className="bg-matrix-darker/95 border-matrix-primary/30 backdrop-blur-xl shadow-2xl">
              <div className="p-4">
                {/* Search Input */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-matrix-primary/50" />
                  <Input
                    autoFocus
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Type a command or search..."
                    className="pl-10 pr-10 bg-matrix-dark/50 border-matrix-primary/30 text-white placeholder:text-matrix-primary/30"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* Commands List */}
                <div className="space-y-1 max-h-96 overflow-y-auto">
                  {filteredCommands.map((cmd) => (
                    <button
                      key={cmd.id}
                      onClick={() => executeCommand(cmd)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-matrix-primary/10 transition-colors text-left group"
                    >
                      <div className="text-matrix-primary group-hover:text-matrix-secondary transition-colors">
                        {cmd.icon}
                      </div>
                      <span className="text-white group-hover:text-matrix-secondary transition-colors">
                        {cmd.label}
                      </span>
                    </button>
                  ))}
                  {filteredCommands.length === 0 && (
                    <div className="text-center py-8 text-matrix-primary/50">
                      No commands found
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

