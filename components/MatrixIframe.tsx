'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MatrixRain from './MatrixRain';
import MatrixLoader from './MatrixLoader';
import { useMatrixRain } from '@/providers/MatrixRainProvider';

interface MatrixIframeProps {
  src: string;
  title?: string;
  className?: string;
  sandbox?: string;
  allowFullScreen?: boolean;
  allow?: string;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
  matrixIntensity?: 'subtle' | 'medium' | 'strong';
  showMatrixOverlay?: boolean;
  children?: React.ReactNode;
}

export default function MatrixIframe({
  src,
  title = 'Matrix Enhanced Content',
  className = '',
  sandbox = 'allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox',
  allowFullScreen = true,
  allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
  loading = 'lazy',
  onLoad,
  onError,
  matrixIntensity = 'medium',
  showMatrixOverlay = true,
  children,
}: MatrixIframeProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { mode, level } = useMatrixRain();

  // Matrix rain intensity mapping using your existing component props
  const intensityMap = {
    subtle: { speed: 0.8, glow: 'subtle' as const, trail: 1.0 },
    medium: { speed: 1.0, glow: 'medium' as const, trail: 1.25 },
    strong: { speed: 1.3, glow: 'strong' as const, trail: 1.5 },
  };

  const matrixConfig = intensityMap[matrixIntensity];

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  };

  // Add Matrix rain to iframe content when possible
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || isLoading || hasError) return;

    const injectMatrixRain = () => {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!iframeDoc) return;

        // Check if Matrix rain is already injected
        if (iframeDoc.querySelector('#matrix-rain-canvas')) return;

        // Create Matrix rain canvas
        const canvas = iframeDoc.createElement('canvas');
        canvas.id = 'matrix-rain-canvas';
        canvas.style.cssText = `
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          pointer-events: none !important;
          z-index: 1000 !important;
          opacity: 0.3 !important;
          mix-blend-mode: screen !important;
        `;

        // Add canvas to iframe body
        if (iframeDoc.body) {
          iframeDoc.body.appendChild(canvas);
          
          // Initialize Matrix rain in iframe
          const ctx = canvas.getContext('2d');
          if (ctx) {
            initializeMatrixRainInIframe(canvas, ctx, matrixConfig);
          }
        }
      } catch (error) {
        // Cross-origin restrictions prevent injection
        console.debug('Cannot inject Matrix rain into iframe due to CORS policy');
      }
    };

    // Try to inject after a short delay to ensure iframe is fully loaded
    const timer = setTimeout(injectMatrixRain, 1000);
    return () => clearTimeout(timer);
  }, [isLoading, hasError, matrixConfig]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Matrix Rain Background */}
      {showMatrixOverlay && (
        <div className="absolute inset-0 pointer-events-none z-10 opacity-30">
          <MatrixRain
            speed={matrixConfig.speed}
            glow={matrixConfig.glow}
            trail={matrixConfig.trail}
          />
        </div>
      )}

      {/* Loading State with Matrix Effect */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 bg-black/80 flex items-center justify-center"
          >
            <div className="relative">
              {/* Matrix rain behind loading text */}
              <div className="absolute inset-0 w-32 h-32 -m-16 opacity-50">
                <MatrixRain speed={1.5} glow="strong" trail={1.8} />
              </div>
              <div className="relative z-10 text-center">
                <div className="text-teal-400 font-mono text-lg mb-2">
                  Entering Matrix...
                </div>
                <div className="flex space-x-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 bg-teal-400 rounded-full"
                      animate={{
                        opacity: [0.3, 1, 0.3],
                        scale: [0.8, 1.2, 0.8],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.2,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error State */}
      {hasError && (
        <div className="absolute inset-0 z-20 bg-black/90 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-400 font-mono text-lg mb-2">
              Matrix Connection Failed
            </div>
            <div className="text-gray-400 text-sm">
              Unable to establish secure connection
            </div>
          </div>
        </div>
      )}

      {/* Iframe */}
      <iframe
        ref={iframeRef}
        src={src}
        title={title}
        className={`w-full h-full border-0 bg-transparent transition-all duration-500 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        sandbox={sandbox}
        allowFullScreen={allowFullScreen}
        allow={allow}
        loading={loading}
        onLoad={handleLoad}
        onError={handleError}
      />

      {/* Matrix Border Effect on Hover */}
      <AnimatePresence>
        {isHovered && !isLoading && !hasError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none z-30"
          >
            <div className="absolute inset-0 border-2 border-teal-400/50 rounded-lg shadow-lg shadow-teal-400/20" />
            <div className="absolute top-2 left-2 text-teal-400 font-mono text-xs bg-black/80 px-2 py-1 rounded">
              MATRIX ENHANCED
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom children overlay */}
      {children && (
        <div className="absolute inset-0 pointer-events-none z-40">
          {children}
        </div>
      )}
    </div>
  );
}

// Initialize Matrix rain inside iframe
function initializeMatrixRainInIframe(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  config: { speed: number; glow: string; trail: number }
) {
  const chars = ['T', 'A', 'P', 'M', 'A', 'T', 'R', 'I', 'X', '0', '1'];
  const fontSize = 14;
  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;
  let columns = Math.floor(width / fontSize);
  let drops = new Array(columns).fill(0).map(() => Math.random() * -100);

  const draw = () => {
    // Fade effect
    ctx.fillStyle = `rgba(0, 0, 0, ${0.1 / config.trail})`;
    ctx.fillRect(0, 0, width, height);

    // Matrix characters
    ctx.fillStyle = '#0fa192';
    ctx.font = `${fontSize}px monospace`;
    ctx.shadowColor = '#0fa192';
    ctx.shadowBlur = config.glow === 'full' ? 10 : config.glow === 'medium' ? 5 : 2;

    for (let i = 0; i < drops.length; i++) {
      const char = chars[Math.floor(Math.random() * chars.length)];
      const x = i * fontSize;
      const y = drops[i] * fontSize;

      ctx.fillText(char, x, y);

      if (y > height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i] += config.speed;
    }
  };

  const animate = () => {
    draw();
    requestAnimationFrame(animate);
  };

  // Handle resize
  const handleResize = () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    columns = Math.floor(width / fontSize);
    drops = new Array(columns).fill(0).map(() => Math.random() * -100);
  };

  window.addEventListener('resize', handleResize);
  animate();

  return () => {
    window.removeEventListener('resize', handleResize);
  };
}
