"use client";
import { motion } from "framer-motion";

export default function SpinningLogo() {
  return (
    <motion.img
      src="/branding/cropped_tap_logo.png"
      alt="TapTap Logo"
      className="pointer-events-none select-none fixed inset-0 m-auto w-[280px] h-[280px] opacity-35 mix-blend-screen"
      animate={{ rotate: 360, opacity: [0.25, 0.4, 0.3, 0.35] }}
      transition={{
        repeat: Infinity,
        duration: 12,         // medium speed spin
        ease: "linear",
        repeatType: "loop"
      }}
    />
  );
}
