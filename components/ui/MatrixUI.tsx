/**
 * TapTap Matrix UI Components
 * Comprehensive component library with standardized variants
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { SemanticColor } from '@/lib/design-tokens';

// ============================================================================
// BADGE COMPONENT
// ============================================================================

const badgeVariants = {
  base: 'inline-flex items-center gap-1.5 font-medium transition-all duration-300',
  variant: {
    default: 'bg-teal-500/20 text-teal-300 border border-teal-500/30',
    success: 'bg-green-500/20 text-green-300 border border-green-500/30',
    warning: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
    error: 'bg-red-500/20 text-red-300 border border-red-500/30',
    info: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
    solidDefault: 'bg-teal-500 text-white',
    solidSuccess: 'bg-green-500 text-white',
    solidWarning: 'bg-yellow-500 text-black',
    solidError: 'bg-red-500 text-white',
    solidInfo: 'bg-blue-500 text-white',
    hope: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
    muse: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
    treasure: 'bg-green-500/20 text-green-300 border border-green-500/30',
  },
  size: {
    sm: 'px-2 py-0.5 text-xs rounded',
    md: 'px-3 py-1 text-sm rounded-full',
    lg: 'px-4 py-1.5 text-base rounded-full',
  },
} as const;

export interface BadgeProps {
  variant?: keyof typeof badgeVariants.variant;
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'md',
  icon,
  children,
  className,
  onClick,
}) => {
  return (
    <span
      className={cn(
        badgeVariants.base,
        badgeVariants.variant[variant],
        badgeVariants.size[size],
        onClick && 'cursor-pointer hover:opacity-80',
        className
      )}
      onClick={onClick}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};

// ============================================================================
// INPUT COMPONENT
// ============================================================================

const inputVariants = {
  base: 'w-full bg-black/50 text-white placeholder:text-white/40 transition-all duration-300 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed',
  state: {
    default: 'border border-white/20 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20',
    success: 'border border-green-500 focus:ring-2 focus:ring-green-500/20',
    error: 'border border-red-500 focus:ring-2 focus:ring-red-500/20',
    warning: 'border border-yellow-500 focus:ring-2 focus:ring-yellow-500/20',
    info: 'border border-blue-500 focus:ring-2 focus:ring-blue-500/20',
  },
  size: {
    sm: 'h-8 px-3 text-sm rounded-lg',
    md: 'h-10 px-4 text-base rounded-lg',
    lg: 'h-12 px-5 text-lg rounded-xl',
  },
} as const;

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: 'sm' | 'md' | 'lg';
  state?: 'default' | SemanticColor;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  helperText?: string;
  errorText?: string;
  label?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      size = 'md',
      state = 'default',
      leftIcon,
      rightIcon,
      helperText,
      errorText,
      label,
      className,
      ...props
    },
    ref
  ) => {
    const finalState = errorText ? 'error' : state;
    const showHelper = helperText || errorText;

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-white/80 mb-2">
            {label}
            {props.required && <span className="text-red-400 ml-1">*</span>}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
              {leftIcon}
            </div>
          )}
          
          <input
            ref={ref}
            className={cn(
              inputVariants.base,
              inputVariants.state[finalState],
              inputVariants.size[size],
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            {...props}
          />
          
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40">
              {rightIcon}
            </div>
          )}
        </div>
        
        {showHelper && (
          <p
            className={cn(
              'mt-1.5 text-xs',
              finalState === 'error' ? 'text-red-400' : 'text-white/60'
            )}
          >
            {errorText || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

