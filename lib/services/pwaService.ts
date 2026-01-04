/**
 * TapTap Matrix PWA Service
 * Handles PWA installation, offline detection, and mobile optimizations
 */

export interface PWAInstallPrompt {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface PWACapabilities {
  isInstallable: boolean;
  isInstalled: boolean;
  isOnline: boolean;
  isMobile: boolean;
  supportsNotifications: boolean;
  supportsBackgroundSync: boolean;
  supportsMediaSession: boolean;
}

export class PWAService {
  private static installPrompt: PWAInstallPrompt | null = null;
  private static isServiceWorkerRegistered = false;

  /**
   * Initialize PWA functionality
   */
  static async initialize(): Promise<void> {
    console.log('📱 PWA Service: Initializing...');

    // Register service worker
    await this.registerServiceWorker();

    // Set up install prompt handling
    this.setupInstallPrompt();

    // Set up online/offline detection
    this.setupNetworkDetection();

    // Set up media session (for lock screen controls)
    this.setupMediaSession();

    // Set up mobile optimizations
    this.setupMobileOptimizations();

    console.log('✅ PWA Service: Initialization complete');
  }

  /**
   * Register service worker
   */
  private static async registerServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });

        console.log('✅ Service Worker registered:', registration.scope);
        this.isServiceWorkerRegistered = true;

        // Handle service worker updates
        registration.addEventListener('updatefound', () => {
          console.log('🔄 Service Worker: Update found');
          const newWorker = registration.installing;
          
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('🆕 Service Worker: New version available');
                this.notifyUpdate();
              }
            });
          }
        });

      } catch (error) {
        console.error('❌ Service Worker registration failed:', error);
      }
    }
  }

  /**
   * Set up PWA install prompt
   */
  private static setupInstallPrompt(): void {
    window.addEventListener('beforeinstallprompt', (event) => {
      console.log('📱 PWA: Install prompt available');
      event.preventDefault();
      this.installPrompt = event as any;
      
      // Notify app that install is available
      this.dispatchPWAEvent('installAvailable', { canInstall: true });
    });

    window.addEventListener('appinstalled', () => {
      console.log('✅ PWA: App installed successfully');
      this.installPrompt = null;
      this.dispatchPWAEvent('appInstalled', { installed: true });
    });
  }

  /**
   * Set up network detection
   */
  private static setupNetworkDetection(): void {
    const updateOnlineStatus = () => {
      const isOnline = navigator.onLine;
      console.log(`🌐 Network status: ${isOnline ? 'Online' : 'Offline'}`);
      
      this.dispatchPWAEvent('networkStatusChanged', { 
        isOnline,
        timestamp: Date.now()
      });
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    // Initial status
    updateOnlineStatus();
  }

  /**
   * Set up media session for lock screen controls
   */
  private static setupMediaSession(): void {
    if ('mediaSession' in navigator) {
      console.log('🎵 Media Session API available');
      
      // This will be used by the audio player
      navigator.mediaSession.setActionHandler('play', () => {
        this.dispatchPWAEvent('mediaSessionAction', { action: 'play' });
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        this.dispatchPWAEvent('mediaSessionAction', { action: 'pause' });
      });

      navigator.mediaSession.setActionHandler('previoustrack', () => {
        this.dispatchPWAEvent('mediaSessionAction', { action: 'previoustrack' });
      });

      navigator.mediaSession.setActionHandler('nexttrack', () => {
        this.dispatchPWAEvent('mediaSessionAction', { action: 'nexttrack' });
      });

      navigator.mediaSession.setActionHandler('seekbackward', () => {
        this.dispatchPWAEvent('mediaSessionAction', { action: 'seekbackward' });
      });

      navigator.mediaSession.setActionHandler('seekforward', () => {
        this.dispatchPWAEvent('mediaSessionAction', { action: 'seekforward' });
      });
    }
  }

  /**
   * Set up mobile-specific optimizations
   */
  private static setupMobileOptimizations(): void {
    // Prevent zoom on input focus (mobile)
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport && this.isMobileDevice()) {
      viewport.setAttribute('content', 
        'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'
      );
    }

    // Add mobile-specific CSS classes
    if (this.isMobileDevice()) {
      document.body.classList.add('mobile-device');
    }

    if (this.isTouchDevice()) {
      document.body.classList.add('touch-device');
    }

    // Handle iOS safe areas
    if (this.isIOSDevice()) {
      document.body.classList.add('ios-device');
    }
  }

  /**
   * Prompt user to install PWA
   */
  static async promptInstall(): Promise<boolean> {
    if (!this.installPrompt) {
      console.warn('⚠️ PWA: Install prompt not available');
      return false;
    }

    try {
      await this.installPrompt.prompt();
      const { outcome } = await this.installPrompt.userChoice;
      
      console.log(`📱 PWA: Install prompt ${outcome}`);
      
      if (outcome === 'accepted') {
        this.installPrompt = null;
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ PWA: Install prompt failed:', error);
      return false;
    }
  }

  /**
   * Update media session metadata
   */
  static updateMediaSession(metadata: {
    title: string;
    artist: string;
    album?: string;
    artwork?: { src: string; sizes: string; type: string }[];
  }): void {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: metadata.title,
        artist: metadata.artist,
        album: metadata.album || 'Music For The Future',
        artwork: metadata.artwork || [
          { src: '/icons/icon-96x96.png', sizes: '96x96', type: 'image/png' },
          { src: '/icons/icon-128x128.png', sizes: '128x128', type: 'image/png' },
          { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-256x256.png', sizes: '256x256', type: 'image/png' },
          { src: '/icons/icon-384x384.png', sizes: '384x384', type: 'image/png' },
          { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' }
        ]
      });
    }
  }

  /**
   * Get PWA capabilities
   */
  static getCapabilities(): PWACapabilities {
    // Return safe defaults during SSR
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

    return {
      isInstallable: !!this.installPrompt,
      isInstalled: this.isAppInstalled(),
      isOnline: navigator.onLine,
      isMobile: this.isMobileDevice(),
      supportsNotifications: 'Notification' in window,
      supportsBackgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
      supportsMediaSession: 'mediaSession' in navigator
    };
  }

  /**
   * Check if app is installed
   */
  private static isAppInstalled(): boolean {
    if (typeof window === 'undefined') return false;

    return window.matchMedia('(display-mode: standalone)').matches ||
           window.matchMedia('(display-mode: fullscreen)').matches ||
           (window.navigator as any).standalone === true;
  }

  /**
   * Check if device is mobile
   */
  static isMobileDevice(): boolean {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;

    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           window.innerWidth <= 768;
  }

  /**
   * Check if device supports touch
   */
  private static isTouchDevice(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  /**
   * Check if device is iOS
   */
  private static isIOSDevice(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  }

  /**
   * Dispatch PWA events
   */
  private static dispatchPWAEvent(type: string, detail: any): void {
    window.dispatchEvent(new CustomEvent(`pwa:${type}`, { detail }));
  }

  /**
   * Notify about service worker update
   */
  private static notifyUpdate(): void {
    this.dispatchPWAEvent('updateAvailable', {
      message: 'A new version of TapTap Matrix is available!',
      action: 'reload'
    });
  }

  /**
   * Request notification permission
   */
  static async requestNotificationPermission(): Promise<NotificationPermission> {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      console.log(`📱 Notification permission: ${permission}`);
      return permission;
    }
    return 'denied';
  }

  /**
   * Show notification
   */
  static showNotification(title: string, options?: NotificationOptions): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        ...options
      });
    }
  }
}
