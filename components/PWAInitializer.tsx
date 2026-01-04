"use client";

import { useEffect } from 'react';
import { PWAService } from '@/lib/services/pwaService';
import PWAInstallPrompt from '@/components/mobile/PWAInstallPrompt';
import MobileAudioPlayer from '@/components/mobile/MobileAudioPlayer';

export default function PWAInitializer() {
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Initialize PWA functionality
    PWAService.initialize().catch(console.error);

    // Add PWA-specific CSS classes
    const capabilities = PWAService.getCapabilities();

    if (capabilities.isInstalled) {
      document.body.classList.add('pwa-installed');
    }

    if (capabilities.isMobile) {
      document.body.classList.add('mobile-device');
    }

    // Handle PWA events
    const handleNetworkChange = (event: CustomEvent) => {
      const { isOnline } = event.detail;
      document.body.classList.toggle('offline', !isOnline);
      
      // Show toast notification
      if (isOnline) {
        console.log('🌐 Back online - syncing data...');
      } else {
        console.log('📱 Offline mode - using cached data');
      }
    };

    const handleUpdateAvailable = (event: CustomEvent) => {
      const { message } = event.detail;
      console.log('🔄 App update available:', message);
      
      // Show update notification
      if ('Notification' in window && Notification.permission === 'granted') {
        PWAService.showNotification('Update Available', {
          body: message,
          tag: 'app-update',
          requireInteraction: true,
          actions: [
            { action: 'update', title: 'Update Now' },
            { action: 'later', title: 'Later' }
          ]
        });
      }
    };

    window.addEventListener('pwa:networkStatusChanged', handleNetworkChange as EventListener);
    window.addEventListener('pwa:updateAvailable', handleUpdateAvailable as EventListener);

    return () => {
      window.removeEventListener('pwa:networkStatusChanged', handleNetworkChange as EventListener);
      window.removeEventListener('pwa:updateAvailable', handleUpdateAvailable as EventListener);
    };
  }, []);

  return (
    <>
      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
      
      {/* Mobile Audio Player */}
      <MobileAudioPlayer />
    </>
  );
}
