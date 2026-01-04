"use client";
import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MatrixPanelProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  headerActions?: React.ReactNode;
  animated?: boolean;
  glowBorder?: boolean;
}

export default function MatrixPanel({ 
  children, 
  title, 
  className, 
  headerActions,
  animated = true,
  glowBorder = true
}: MatrixPanelProps) {
  const PanelComponent = animated ? motion.div : "div";
  const animationProps = animated ? {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: "easeOut" }
  } : {};

  return (
    <PanelComponent
      className={cn(
        "relative bg-black/90 backdrop-blur-sm rounded-xl overflow-hidden",
        glowBorder && "border border-teal-500/30 shadow-[0_0_20px_rgba(0,255,210,0.1)]",
        className
      )}
      {...animationProps}
    >
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(0,255,210,0.1),transparent_70%)]" />
      </div>

      {/* Header */}
      {title && (
        <div className="relative border-b border-teal-500/20 bg-black/50 px-6 py-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-teal-100 font-mono tracking-wide">
              {title}
            </h3>
            {headerActions && (
              <div className="flex items-center gap-2">
                {headerActions}
              </div>
            )}
          </div>
          
          {/* Header glow line */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-400/50 to-transparent" />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 p-6">
        {children}
      </div>

      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-teal-400/40" />
      <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-teal-400/40" />
      <div className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 border-teal-400/40" />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-teal-400/40" />
    </PanelComponent>
  );
}
