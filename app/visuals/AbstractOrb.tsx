"use client";
import { motion } from "framer-motion";
import { memo, useEffect, useState } from "react";

const AbstractOrb = memo(function AbstractOrb() {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    // Only render after initial load to improve performance
    const timer = setTimeout(() => setShouldRender(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Don't render if user prefers reduced motion
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setShouldRender(false);
    }
  }, []);

  if (!shouldRender) {
    return <div className="pointer-events-none fixed inset-0 -z-10" />;
  }

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 -z-10 grid place-items-center"
      initial={{ opacity: 0.1, scale: 0.98 }}
      animate={{
        opacity: [0.1, 0.25, 0.15, 0.2],
        scale: [0.98, 1.01, 0.99, 1.0],
        rotate: 360
      }}
      transition={{
        repeat: Infinity,
        duration: 30,
        ease: "linear",
        opacity: { duration: 15 }
      }}
    >
      <div className="h-[280px] w-[280px] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(0,255,200,0.2),transparent_70%),radial-gradient(circle_at_70%_70%,rgba(0,180,255,0.15),transparent_60%)] blur-xl" />
    </motion.div>
  );
});

export default AbstractOrb;

