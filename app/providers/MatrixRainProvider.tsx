"use client";
import React, { createContext, useContext, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import MatrixRain from "@/visuals/MatrixRain";
import GalaxyScene from "@/visuals/GalaxyScene";

type Level = "low" | "medium" | "full";

type Mode = "rain" | "galaxy";
type Ctx = { level: Level; setLevel: (l: Level) => void; mode: Mode; setMode: (m: Mode) => void };

const MatrixCtx = createContext<Ctx | null>(null);

export function MatrixRainProvider({ children }: { children: React.ReactNode }) {
  const [level, setLevel] = useState<Level>("medium");
  const [mode, setMode] = useState<Mode>("rain");
  const value = useMemo(() => ({ level, setLevel, mode, setMode }), [level, mode]);

  const speed = level === "low" ? 0.7 : level === "full" ? 1.4 : 1.0;
  const trail = level === "low" ? 1.0 : level === "full" ? 1.35 : 1.15;

  return (
    <MatrixCtx.Provider value={value}>
      <div className="fixed inset-0 -z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${mode}-${level}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
          >
            {mode === "rain" ? (
              <MatrixRain speed={speed} glow={level} trail={trail} />
            ) : (
              <GalaxyScene />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      {children}
    </MatrixCtx.Provider>
  );
}

export function useMatrixRain() {
  const ctx = useContext(MatrixCtx);
  if (!ctx) throw new Error("useMatrixRain must be used within MatrixRainProvider");
  return ctx;
}
