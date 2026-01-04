"use client";
import MatrixTransitionOverlay from "@/components/MatrixTransitionOverlay";

export default function Loading() {
  return (
    <MatrixTransitionOverlay
      forceVisible
      message="Matrix rain is aligning the rails…"
    />
  );
}