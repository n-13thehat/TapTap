"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  X,
  Smartphone,
  Zap,
  Wifi,
  Music,
  Bell,
  Share
} from 'lucide-react';
import { PWAService } from '@/lib/services/pwaService';

interface PWAInstallPromptProps {
  className?: string;
}

export default function PWAInstallPrompt({ className = '' }: PWAInstallPromptProps) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [capabilities, setCapabilities] = useState(() => {
    // Safe initialization for SSR
    if (typeof window === 'undefined') {
      return {
        isInstallable: false,
        isInstalled: false,
        isOnline: false,
        isMobile: false,
        supportsNotifications: false,
        supportsBackgroundSync: false,
        supportsMediaSession: false
      };
    }
    return PWAService.getCapabilities();
  });

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Listen for PWA events
    const handleInstallAvailable = () => {
      setShowPrompt(true);
      setCapabilities(PWAService.getCapabilities());
    };

    const handleAppInstalled = () => {
      setShowPrompt(false);
      setCapabilities(PWAService.getCapabilities());
    };

    window.addEventListener('pwa:installAvailable', handleInstallAvailable);
    window.addEventListener('pwa:appInstalled', handleAppInstalled);

    // Update capabilities on client side
    setCapabilities(PWAService.getCapabilities());

    // Check if we should show the prompt
    const currentCapabilities = PWAService.getCapabilities();
    const isDismissed = typeof window !== 'undefined' ?
      localStorage.getItem('pwa-install-dismissed') : null;
    const shouldShow = currentCapabilities.isInstallable &&
                      !currentCapabilities.isInstalled &&
                      currentCapabilities.isMobile &&
                      !isDismissed;

    if (shouldShow) {
      // Show prompt after a delay
      setTimeout(() => setShowPrompt(true), 3000);
    }

    return () => {
      window.removeEventListener('pwa:installAvailable', handleInstallAvailable);
      window.removeEventListener('pwa:appInstalled', handleAppInstalled);
    };
  }, [capabilities.isInstallable, capabilities.isInstalled, capabilities.isMobile]);

  const handleInstall = async () => {
    setIsInstalling(true);
    
    try {
      const success = await PWAService.promptInstall();
      
      if (success) {
        setShowPrompt(false);
      } else {
        setIsInstalling(false);
      }
    } catch (error) {
      console.error('Install failed:', error);
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  const handleRemindLater = () => {
    setShowPrompt(false);
    // Show again in 24 hours
    setTimeout(() => {
      localStorage.removeItem('pwa-install-dismissed');
    }, 24 * 60 * 60 * 1000);
  };

  if (!showPrompt || capabilities.isInstalled) {
    return null;
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={handleDismiss}
        />

        {/* Install Prompt */}
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.95 }}
          className={`relative w-full max-w-sm bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 rounded-2xl p-6 shadow-2xl ${className}`}
        >
          {/* Close Button */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-2 text-white/60 hover:text-white/80 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-teal-500 to-blue-500 rounded-2xl flex items-center justify-center">
              <Music className="h-8 w-8 text-white" />
            </div>
            
            <h2 className="text-xl font-bold text-white mb-2">Install TapTap Matrix</h2>
            <p className="text-white/70 text-sm">
              Get the full app experience with offline music, faster loading, and native features.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-teal-500/20 rounded-lg flex items-center justify-center">
                <Wifi className="h-4 w-4 text-teal-400" />
              </div>
              <div>
                <div className="text-white font-medium text-sm">Offline Access</div>
                <div className="text-white/60 text-xs">Listen to music without internet</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Zap className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <div className="text-white font-medium text-sm">Faster Performance</div>
                <div className="text-white/60 text-xs">Lightning-fast app experience</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Bell className="h-4 w-4 text-purple-400" />
              </div>
              <div>
                <div className="text-white font-medium text-sm">Push Notifications</div>
                <div className="text-white/60 text-xs">Get notified about new music</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Smartphone className="h-4 w-4 text-green-400" />
              </div>
              <div>
                <div className="text-white font-medium text-sm">Native Experience</div>
                <div className="text-white/60 text-xs">Works like a native app</div>
              </div>
            </div>
          </div>

          {/* Install Button */}
          <div className="space-y-3">
            <motion.button
              onClick={handleInstall}
              disabled={isInstalling}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 disabled:from-gray-500 disabled:to-gray-600 text-white py-3 rounded-xl font-medium transition-all"
              whileTap={{ scale: 0.98 }}
            >
              {isInstalling ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Installing...</span>
                </>
              ) : (
                <>
                  <Download className="h-5 w-5" />
                  <span>Install App</span>
                </>
              )}
            </motion.button>

            <div className="flex gap-2">
              <button
                onClick={handleRemindLater}
                className="flex-1 py-2 text-white/60 hover:text-white/80 text-sm transition-colors"
              >
                Remind Later
              </button>
              
              <button
                onClick={handleDismiss}
                className="flex-1 py-2 text-white/60 hover:text-white/80 text-sm transition-colors"
              >
                Not Now
              </button>
            </div>
          </div>

          {/* Share Alternative */}
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center justify-center gap-2 text-white/60 text-xs">
              <Share className="h-3 w-3" />
              <span>Or add to home screen from browser menu</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
