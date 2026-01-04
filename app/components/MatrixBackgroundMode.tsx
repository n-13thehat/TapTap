"use client";
import { useEffect } from "react";
import { useMatrixRain } from "@/providers/MatrixRainProvider";

export default function MatrixBackgroundMode({ mode }: { mode: "rain" | "galaxy" }) {
  const { setMode } = useMatrixRain();
  useEffect(() => {
    setMode(mode);
    return () => setMode("rain");
  }, [mode, setMode]);
  return null;
}

