'use client';

import { useEffect } from 'react';
import { useMatrixIframes } from '@/hooks/useMatrixIframes';

// Component that initializes Matrix iframe enhancement globally
export default function MatrixIframeInitializer() {
  const { enhancer } = useMatrixIframes();

  useEffect(() => {
    // Add global styles for Matrix iframe effects
    const addGlobalStyles = () => {
      if (document.querySelector('#matrix-iframe-global-styles')) return;

      const style = document.createElement('style');
      style.id = 'matrix-iframe-global-styles';
      style.textContent = `
        /* Matrix iframe container styles */
        .matrix-iframe-container {
          position: relative;
          border: 1px solid rgba(15, 161, 146, 0.2);
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 0 20px rgba(15, 161, 146, 0.1);
          transition: all 0.3s ease;
        }

        .matrix-iframe-container:hover {
          border-color: rgba(15, 161, 146, 0.4);
          box-shadow: 0 0 30px rgba(15, 161, 146, 0.2);
        }

        /* Matrix iframe overlay animations */
        @keyframes matrixPulse {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.3; }
        }

        @keyframes matrixGlow {
          0%, 100% { box-shadow: 0 0 5px rgba(15, 161, 146, 0.3); }
          50% { box-shadow: 0 0 20px rgba(15, 161, 146, 0.6); }
        }

        .matrix-iframe-overlay {
          animation: matrixPulse 4s ease-in-out infinite;
        }

        .matrix-iframe-container:hover .matrix-iframe-overlay {
          animation: matrixGlow 2s ease-in-out infinite;
        }

        /* Matrix loading animations */
        @keyframes matrixDot {
          0%, 100% { 
            opacity: 0.3; 
            transform: scale(0.8); 
          }
          50% { 
            opacity: 1; 
            transform: scale(1.2); 
          }
        }

        .matrix-loading-dot {
          animation: matrixDot 1.5s ease-in-out infinite;
        }

        .matrix-loading-dot:nth-child(2) {
          animation-delay: 0.2s;
        }

        .matrix-loading-dot:nth-child(3) {
          animation-delay: 0.4s;
        }

        /* Matrix iframe focus styles for accessibility */
        iframe:focus {
          outline: 2px solid #0fa192;
          outline-offset: 2px;
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .matrix-iframe-overlay,
          .matrix-loading-dot {
            animation: none !important;
          }
          
          .matrix-iframe-container {
            transition: none !important;
          }
        }

        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .matrix-iframe-container {
            border-color: #0fa192;
            box-shadow: 0 0 10px #0fa192;
          }
        }

        /* Dark mode specific styles */
        @media (prefers-color-scheme: dark) {
          .matrix-iframe-overlay {
            mix-blend-mode: screen;
          }
        }

        /* Mobile optimizations */
        @media (max-width: 768px) {
          .matrix-iframe-overlay {
            opacity: 0.15 !important;
          }
          
          .matrix-iframe-container:hover {
            box-shadow: 0 0 15px rgba(15, 161, 146, 0.15);
          }
        }

        /* Print styles */
        @media print {
          .matrix-iframe-overlay,
          .matrix-iframe-loading {
            display: none !important;
          }
        }
      `;

      document.head.appendChild(style);
    };

    // Add Matrix-themed meta tags
    const addMetaTags = () => {
      // Theme color for mobile browsers
      let themeColorMeta = document.querySelector('meta[name="theme-color"]');
      if (!themeColorMeta) {
        themeColorMeta = document.createElement('meta');
        themeColorMeta.setAttribute('name', 'theme-color');
        document.head.appendChild(themeColorMeta);
      }
      themeColorMeta.setAttribute('content', '#0fa192');

      // MSApplication tile color
      let msApplicationMeta = document.querySelector('meta[name="msapplication-TileColor"]');
      if (!msApplicationMeta) {
        msApplicationMeta = document.createElement('meta');
        msApplicationMeta.setAttribute('name', 'msapplication-TileColor');
        document.head.appendChild(msApplicationMeta);
      }
      msApplicationMeta.setAttribute('content', '#000000');
    };

    // Initialize global Matrix iframe enhancements
    const initializeGlobalEnhancements = () => {
      addGlobalStyles();
      addMetaTags();

      // Log initialization
      console.debug('Matrix iframe enhancement initialized globally');
    };

    // Run initialization
    initializeGlobalEnhancements();

    // Handle dynamic content loading (for SPAs)
    const handleRouteChange = () => {
      // Re-scan for new iframes after route changes
      setTimeout(() => {
        if (enhancer) {
          // The enhancer automatically handles new iframes through MutationObserver
          console.debug('Matrix iframe enhancement: Route change detected');
        }
      }, 100);
    };

    // Listen for navigation events
    window.addEventListener('popstate', handleRouteChange);
    
    // Listen for pushState/replaceState (for client-side routing)
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      handleRouteChange();
    };

    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args);
      handleRouteChange();
    };

    // Cleanup
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, [enhancer]);

  // This component doesn't render anything visible
  return null;
}
