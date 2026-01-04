"use client";
import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MatrixCardProps {
  children: React.ReactNode;
  className?: string;
  glowOnHover?: boolean;
  animated?: boolean;
  variant?: "default" | "glass" | "solid";
}

export default function MatrixCard({ 
  children, 
  className, 
  glowOnHover = true, 
  animated = true,
  variant = "default"
}: MatrixCardProps) {
  const baseClasses = "relative overflow-hidden rounded-lg";
  
  const variantClasses = {
    default: "bg-black/80 border border-teal-500/30 backdrop-blur-sm",
    glass: "bg-black/60 border border-teal-400/40 backdrop-blur-md",
    solid: "bg-black border border-teal-500/50"
  };

  const CardComponent = animated ? motion.div : "div";
  const animationProps = animated ? {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 },
    whileHover: glowOnHover ? { 
      boxShadow: "0 0 30px rgba(0, 255, 210, 0.3)",
      borderColor: "rgba(0, 255, 210, 0.6)",
      scale: 1.02
    } : undefined
  } : {};

  return (
    <CardComponent
      className={cn(
        baseClasses,
        variantClasses[variant],
        glowOnHover && "matrix-hover-glow",
        className
      )}
      {...animationProps}
    >
      {/* Matrix grid pattern overlay */}
      <div className="absolute inset-0 opacity-5">
        <div className="w-full h-full bg-[linear-gradient(rgba(0,255,210,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,210,0.1)_1px,transparent_1px)] bg-[size:20px_20px]" />
      </div>
      
      {/* Animated border glow */}
      <div className="absolute inset-0 rounded-lg">
        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-teal-400/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500" />
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </CardComponent>
  );
}
