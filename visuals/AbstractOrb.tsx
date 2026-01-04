"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AbstractOrbProps {
  className?: string;
}

export default function AbstractOrb({ className = '' }: AbstractOrbProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Respect user's motion preferences
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setIsVisible(false);
    }
  }, []);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        className={`fixed pointer-events-none z-10 ${className}`}
        style={{
          left: mousePosition.x - 50,
          top: mousePosition.y - 50,
        }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 0.6, scale: 1 }}
        exit={{ opacity: 0, scale: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {/* Main Orb */}
        <motion.div
          className="w-24 h-24 rounded-full bg-gradient-to-r from-teal-400/20 to-cyan-400/20 backdrop-blur-sm border border-teal-400/30"
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {/* Inner Glow */}
          <motion.div
            className="absolute inset-2 rounded-full bg-gradient-to-r from-teal-300/30 to-cyan-300/30"
            animate={{
              opacity: [0.3, 0.7, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          
          {/* Core */}
          <motion.div
            className="absolute inset-4 rounded-full bg-gradient-to-r from-teal-200/40 to-cyan-200/40"
            animate={{
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.div>

        {/* Floating Particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-teal-300/60 rounded-full"
            style={{
              left: `${20 + i * 10}%`,
              top: `${20 + i * 10}%`,
            }}
            animate={{
              y: [-10, -20, -10],
              x: [-5, 5, -5],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 2 + i * 0.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.2,
            }}
          />
        ))}
      </motion.div>
    </AnimatePresence>
  );
}
