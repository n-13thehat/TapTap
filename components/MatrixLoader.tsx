"use client";
import { motion } from "framer-motion";

export default function MatrixLoader() {
  return (
    <div className="fixed inset-0 grid place-items-center bg-black z-40">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0] }}
        transition={{ duration: 2.6, times: [0, 0.2, 0.8, 1] }}
        className="text-glow text-white/90"
      >
        <div className="text-center space-y-2">
          <div className="text-xl tracking-wide">Entering TapTap Network…</div>
          <div className="text-sm text-white/60">Initializing matrix channel</div>
        </div>
      </motion.div>
    </div>
  );
}