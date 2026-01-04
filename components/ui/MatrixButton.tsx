"use client";
import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MatrixButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  glowEffect?: boolean;
  loading?: boolean;
}

export default function MatrixButton({ 
  children, 
  className, 
  variant = "primary",
  size = "md",
  glowEffect = true,
  loading = false,
  disabled,
  ...props 
}: MatrixButtonProps) {
  const baseClasses = "relative inline-flex items-center justify-center font-medium transition-all duration-300 rounded-lg overflow-hidden";
  
  const variantClasses = {
    primary: "bg-teal-600/80 hover:bg-teal-500/90 text-white border border-teal-400/50 hover:border-teal-300",
    secondary: "bg-black/80 hover:bg-black/90 text-teal-100 border border-teal-500/30 hover:border-teal-400/60",
    ghost: "bg-transparent hover:bg-teal-500/10 text-teal-200 border border-transparent hover:border-teal-500/30",
    danger: "bg-red-600/80 hover:bg-red-500/90 text-white border border-red-400/50 hover:border-red-300"
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };

  const glowClasses = glowEffect ? {
    primary: "hover:shadow-[0_0_20px_rgba(20,184,166,0.4)]",
    secondary: "hover:shadow-[0_0_15px_rgba(0,255,210,0.3)]",
    ghost: "hover:shadow-[0_0_10px_rgba(0,255,210,0.2)]",
    danger: "hover:shadow-[0_0_20px_rgba(239,68,68,0.4)]"
  } : {};

  return (
    <motion.button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        glowEffect && glowClasses[variant],
        (disabled || loading) && "opacity-50 cursor-not-allowed",
        className
      )}
      whileHover={!disabled && !loading ? { scale: 1.02 } : undefined}
      whileTap={!disabled && !loading ? { scale: 0.98 } : undefined}
      disabled={disabled || loading}
      {...props}
    >
      {/* Matrix scan line effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-1000" />
      
      {/* Loading spinner */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      
      {/* Content */}
      <span className={cn("relative z-10", loading && "opacity-0")}>
        {children}
      </span>
    </motion.button>
  );
}
