import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ComponentSize } from '@/lib/design-tokens';

// ============================================================================
// BUTTON VARIANTS
// ============================================================================

const buttonVariants = {
  // Base styles
  base: 'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-40 disabled:cursor-not-allowed',

  // Variant styles
  variant: {
    primary: 'bg-teal-500 text-white hover:bg-teal-600 focus:ring-teal-500 shadow-lg hover:shadow-xl hover:shadow-teal-500/20',
    secondary: 'border-2 border-teal-500 text-teal-400 hover:bg-teal-500/10 focus:ring-teal-500',
    ghost: 'text-white/80 hover:bg-white/10 hover:text-white focus:ring-white/50',
    destructive: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500 shadow-lg hover:shadow-xl hover:shadow-red-500/20',
    success: 'bg-green-500 text-white hover:bg-green-600 focus:ring-green-500 shadow-lg hover:shadow-xl hover:shadow-green-500/20',
    outline: 'border border-white/20 text-white hover:bg-white/5 focus:ring-white/50',
    link: 'text-teal-400 hover:text-teal-300 underline-offset-4 hover:underline focus:ring-teal-500',

    // Agent-themed variants
    hope: 'bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500 shadow-lg hover:shadow-xl hover:shadow-blue-500/20',
    muse: 'bg-purple-500 text-white hover:bg-purple-600 focus:ring-purple-500 shadow-lg hover:shadow-xl hover:shadow-purple-500/20',
    treasure: 'bg-green-500 text-white hover:bg-green-600 focus:ring-green-500 shadow-lg hover:shadow-xl hover:shadow-green-500/20',
  },

  // Size styles
  size: {
    sm: 'h-8 px-4 text-sm rounded-lg',
    md: 'h-10 px-6 text-base rounded-lg',
    lg: 'h-12 px-8 text-lg rounded-xl',
  },
} as const;

// ============================================================================
// BUTTON COMPONENT
// ============================================================================

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'size'> {
  variant?: keyof typeof buttonVariants.variant;
  size?: ComponentSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
        whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
        className={cn(
          buttonVariants.base,
          buttonVariants.variant[variant],
          buttonVariants.size[size],
          fullWidth && 'w-full',
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {!loading && leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
        <span>{children}</span>
        {!loading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

// ============================================================================
// ICON BUTTON COMPONENT
// ============================================================================

export interface IconButtonProps extends Omit<HTMLMotionProps<'button'>, 'size'> {
  variant?: keyof typeof buttonVariants.variant;
  size?: ComponentSize;
  icon: React.ReactNode;
  'aria-label': string;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ variant = 'ghost', size = 'md', icon, className, disabled, ...props }, ref) => {
    const sizeClasses = {
      sm: 'h-8 w-8',
      md: 'h-10 w-10',
      lg: 'h-12 w-12',
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: disabled ? 1 : 1.1 }}
        whileTap={{ scale: disabled ? 1 : 0.9 }}
        className={cn(
          buttonVariants.base,
          buttonVariants.variant[variant],
          sizeClasses[size],
          'rounded-full p-0',
          className
        )}
        disabled={disabled}
        {...props}
      >
        {icon}
      </motion.button>
    );
  }
);

IconButton.displayName = 'IconButton';

// ============================================================================
// BUTTON GROUP COMPONENT
// ============================================================================

export interface ButtonGroupProps {
  children: React.ReactNode;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

export const ButtonGroup: React.FC<ButtonGroupProps> = ({
  children,
  className,
  orientation = 'horizontal',
}) => {
  return (
    <div
      className={cn(
        'inline-flex',
        orientation === 'horizontal' ? 'flex-row' : 'flex-col',
        '[&>button]:rounded-none [&>button:first-child]:rounded-l-lg [&>button:last-child]:rounded-r-lg',
        orientation === 'vertical' &&
          '[&>button:first-child]:rounded-t-lg [&>button:last-child]:rounded-b-lg [&>button:first-child]:rounded-l-none [&>button:last-child]:rounded-r-none',
        className
      )}
    >
      {children}
    </div>
  );
};


