"use client";
import React, { forwardRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MatrixInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  glowOnFocus?: boolean;
  variant?: "default" | "ghost";
}

const MatrixInput = forwardRef<HTMLInputElement, MatrixInputProps>(
  ({ className, label, error, glowOnFocus = true, variant = "default", ...props }, ref) => {
    const baseClasses = "w-full px-4 py-3 bg-black/80 border rounded-lg font-mono text-teal-100 placeholder-teal-300/50 transition-all duration-300 focus:outline-none";
    
    const variantClasses = {
      default: "border-teal-500/30 focus:border-teal-400/60 focus:bg-black/90",
      ghost: "border-transparent bg-transparent focus:border-teal-500/30 focus:bg-black/20"
    };

    const glowClasses = glowOnFocus ? "focus:shadow-[0_0_15px_rgba(0,255,210,0.2)]" : "";

    return (
      <div className="space-y-2">
        {label && (
          <motion.label 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="block text-sm font-medium text-teal-200 font-mono tracking-wide"
          >
            {label}
          </motion.label>
        )}
        
        <div className="relative">
          <input
            ref={ref}
            className={cn(
              baseClasses,
              variantClasses[variant],
              glowClasses,
              error && "border-red-400/60 focus:border-red-400",
              className
            )}
            {...props}
          />
          
          {/* Matrix scan line effect on focus */}
          <div className="absolute inset-0 rounded-lg pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-teal-400/10 to-transparent -translate-x-full focus-within:translate-x-full transition-transform duration-1000" />
          </div>
        </div>
        
        {error && (
          <motion.p 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-red-400 font-mono"
          >
            {error}
          </motion.p>
        )}
      </div>
    );
  }
);

MatrixInput.displayName = "MatrixInput";

export default MatrixInput;
