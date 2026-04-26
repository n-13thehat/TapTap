import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ComponentSize } from '@/lib/design-tokens';

// ============================================================================
// CARD VARIANTS
// ============================================================================

const cardVariants = {
  // Base styles
  base: 'transition-all duration-300',

  // Variant styles
  variant: {
    default: 'border border-white/10 bg-white/5 backdrop-blur',
    glass: 'border border-teal-500/30 bg-black/80 backdrop-blur shadow-lg',
    solid: 'border border-teal-500/50 bg-black shadow-xl',
    elevated: 'border border-white/20 bg-black/90 shadow-2xl',
    outline: 'border-2 border-white/20 bg-transparent',

    // Agent-themed variants
    hope: 'border border-blue-500/30 bg-black/80 backdrop-blur shadow-lg shadow-blue-500/10',
    muse: 'border border-purple-500/30 bg-black/80 backdrop-blur shadow-lg shadow-purple-500/10',
    treasure: 'border border-green-500/30 bg-black/80 backdrop-blur shadow-lg shadow-green-500/10',
  },

  // Size styles
  size: {
    sm: 'p-4 rounded-lg',
    md: 'p-6 rounded-xl',
    lg: 'p-8 rounded-2xl',
  },

  // Hover effects
  hover: {
    none: '',
    lift: 'hover:-translate-y-1 hover:shadow-xl',
    glow: 'hover:shadow-2xl hover:shadow-teal-500/20',
    scale: 'hover:scale-[1.02]',
  },
} as const;

// ============================================================================
// CARD COMPONENT
// ============================================================================

export interface CardProps extends Omit<HTMLMotionProps<'div'>, 'size'> {
  variant?: keyof typeof cardVariants.variant;
  size?: ComponentSize;
  hover?: keyof typeof cardVariants.hover;
  interactive?: boolean;
  children: React.ReactNode;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      size = 'md',
      hover = 'none',
      interactive = false,
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <motion.div
        ref={ref}
        whileHover={interactive ? { y: -4 } : undefined}
        className={cn(
          cardVariants.base,
          cardVariants.variant[variant],
          cardVariants.size[size],
          cardVariants.hover[hover],
          interactive && 'cursor-pointer',
          className
        )}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = 'Card';

// ============================================================================
// CARD HEADER COMPONENT (Shadcn-compatible)
// ============================================================================

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ title, subtitle, icon, action, className, children, ...props }, ref) => {
    // If children are provided, use shadcn-style composition
    if (children) {
      return (
        <div
          ref={ref}
          className={cn('flex flex-col space-y-1.5 p-6', className)}
          {...props}
        >
          {children}
        </div>
      );
    }

    // Otherwise, use the legacy prop-based API
    return (
      <div
        ref={ref}
        className={cn('flex items-start justify-between mb-4', className)}
        {...props}
      >
        <div className="flex items-start gap-3 flex-1">
          {icon && <div className="flex-shrink-0 mt-1">{icon}</div>}
          <div className="flex-1 min-w-0">
            {title && <h3 className="text-lg font-semibold text-white truncate">{title}</h3>}
            {subtitle && <p className="text-sm text-white/60 mt-1">{subtitle}</p>}
          </div>
        </div>
        {action && <div className="flex-shrink-0 ml-4">{action}</div>}
      </div>
    );
  }
);

CardHeader.displayName = 'CardHeader';

// ============================================================================
// CARD TITLE COMPONENT (Shadcn-compatible)
// ============================================================================

export interface CardTitleProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardTitle = React.forwardRef<HTMLDivElement, CardTitleProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('text-lg font-semibold text-white leading-none tracking-tight', className)}
      {...props}
    />
  )
);

CardTitle.displayName = 'CardTitle';

// ============================================================================
// CARD DESCRIPTION COMPONENT (Shadcn-compatible)
// ============================================================================

export interface CardDescriptionProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardDescription = React.forwardRef<HTMLDivElement, CardDescriptionProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('text-sm text-white/60', className)}
      {...props}
    />
  )
);

CardDescription.displayName = 'CardDescription';

// ============================================================================
// CARD CONTENT COMPONENT (Shadcn-compatible)
// ============================================================================

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0 text-white/80', className)} {...props} />
  )
);

CardContent.displayName = 'CardContent';

// ============================================================================
// CARD FOOTER COMPONENT (Shadcn-compatible)
// ============================================================================

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center p-6 pt-0', className)}
      {...props}
    />
  )
);

CardFooter.displayName = 'CardFooter';

// ============================================================================
// MUSIC CARD COMPONENT (Specialized)
// ============================================================================

export interface MusicCardProps {
  title: string;
  artist: string;
  coverUrl?: string;
  duration?: string;
  plays?: number;
  variant?: keyof typeof cardVariants.variant;
  onPlay?: () => void;
  className?: string;
}

export const MusicCard: React.FC<MusicCardProps> = ({
  title,
  artist,
  coverUrl,
  duration,
  plays,
  variant = 'glass',
  onPlay,
  className,
}) => {
  return (
    <Card variant={variant} size="sm" hover="lift" interactive className={className}>
      <div className="flex gap-3">
        {/* Album Art */}
        <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-white/10 overflow-hidden">
          {coverUrl ? (
            <img src={coverUrl} alt={title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/40">
              <span className="text-2xl">♪</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-white truncate">{title}</h4>
          <p className="text-sm text-white/60 truncate">{artist}</p>
          <div className="flex items-center gap-3 mt-1 text-xs text-white/50">
            {duration && <span>{duration}</span>}
            {plays && <span>{plays.toLocaleString()} plays</span>}
          </div>
        </div>
      </div>
    </Card>
  );
};


