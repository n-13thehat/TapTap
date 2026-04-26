/**
 * TapTap Matrix Design System - Design Tokens
 * Comprehensive design tokens for consistent UI/UX across the application
 */

// ============================================================================
// SPACING SCALE
// ============================================================================
export const spacing = {
  xs: '0.25rem',    // 4px
  sm: '0.5rem',     // 8px
  md: '1rem',       // 16px
  lg: '1.5rem',     // 24px
  xl: '2rem',       // 32px
  '2xl': '3rem',    // 48px
  '3xl': '4rem',    // 64px
  '4xl': '6rem',    // 96px
  '5xl': '8rem',    // 128px
} as const;

// ============================================================================
// COLOR SYSTEM
// ============================================================================
export const colors = {
  // Primary Matrix Colors
  matrix: {
    teal: '#14b8a6',
    cyan: '#00F0FF',
    green: '#00ff41',
    dark: '#001a17',
    darker: '#000a08',
    glow: 'rgba(0, 255, 210, 0.6)',
  },

  // Agent Themes
  agents: {
    hope: {
      primary: '#3b82f6',
      light: '#60a5fa',
      dark: '#2563eb',
      glow: 'rgba(59, 130, 246, 0.6)',
    },
    muse: {
      primary: '#8b5cf6',
      light: '#a78bfa',
      dark: '#7c3aed',
      glow: 'rgba(139, 92, 246, 0.6)',
    },
    treasure: {
      primary: '#22c55e',
      light: '#4ade80',
      dark: '#16a34a',
      glow: 'rgba(34, 197, 94, 0.6)',
    },
  },

  // Semantic Colors
  semantic: {
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },

  // Neutral Colors
  neutral: {
    white: '#ffffff',
    black: '#000000',
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
      950: '#030712',
    },
  },
} as const;

// ============================================================================
// OPACITY SCALE
// ============================================================================
export const opacity = {
  disabled: 0.4,
  subtle: 0.6,
  medium: 0.8,
  high: 0.9,
  full: 1,
} as const;

// ============================================================================
// TYPOGRAPHY SCALE
// ============================================================================
export const typography = {
  fontSize: {
    xs: '0.75rem',      // 12px
    sm: '0.875rem',     // 14px
    base: '1rem',       // 16px
    lg: '1.125rem',     // 18px
    xl: '1.25rem',      // 20px
    '2xl': '1.5rem',    // 24px
    '3xl': '1.875rem',  // 30px
    '4xl': '2.25rem',   // 36px
    '5xl': '3rem',      // 48px
    '6xl': '3.75rem',   // 60px
  },

  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },

  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2,
  },

  letterSpacing: {
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
} as const;

// ============================================================================
// BORDER RADIUS
// ============================================================================
export const borderRadius = {
  none: '0',
  sm: '0.25rem',    // 4px
  md: '0.5rem',     // 8px
  lg: '0.75rem',    // 12px
  xl: '1rem',       // 16px
  '2xl': '1.5rem',  // 24px
  full: '9999px',
} as const;


// ============================================================================
// ANIMATION DURATIONS
// ============================================================================
export const animation = {
  duration: {
    instant: '0ms',
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
    slower: '700ms',
  },

  easing: {
    linear: 'linear',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
} as const;

// ============================================================================
// Z-INDEX SCALE
// ============================================================================
export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  fixed: 1200,
  modalBackdrop: 1300,
  modal: 1400,
  popover: 1500,
  tooltip: 1600,
  toast: 1700,
} as const;

// ============================================================================
// BREAKPOINTS
// ============================================================================
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// ============================================================================
// COMPONENT SIZES
// ============================================================================
export const componentSizes = {
  button: {
    sm: {
      height: '2rem',      // 32px
      padding: '0.5rem 1rem',
      fontSize: typography.fontSize.sm,
    },
    md: {
      height: '2.5rem',    // 40px
      padding: '0.625rem 1.5rem',
      fontSize: typography.fontSize.base,
    },
    lg: {
      height: '3rem',      // 48px
      padding: '0.75rem 2rem',
      fontSize: typography.fontSize.lg,
    },
  },

  input: {
    sm: {
      height: '2rem',
      padding: '0.5rem 0.75rem',
      fontSize: typography.fontSize.sm,
    },
    md: {
      height: '2.5rem',
      padding: '0.625rem 1rem',
      fontSize: typography.fontSize.base,
    },
    lg: {
      height: '3rem',
      padding: '0.75rem 1.25rem',
      fontSize: typography.fontSize.lg,
    },
  },

  card: {
    sm: {
      padding: spacing.md,
      borderRadius: borderRadius.lg,
    },
    md: {
      padding: spacing.lg,
      borderRadius: borderRadius.xl,
    },
    lg: {
      padding: spacing.xl,
      borderRadius: borderRadius['2xl'],
    },
  },
} as const;

// ============================================================================
// ACCESSIBILITY
// ============================================================================
export const accessibility = {
  // Minimum touch target size (WCAG 2.1 Level AAA)
  minTouchTarget: '44px',

  // Focus ring styles
  focusRing: {
    width: '2px',
    offset: '2px',
    color: colors.matrix.cyan,
  },

  // Color contrast ratios (WCAG 2.1 Level AA)
  contrastRatio: {
    normal: 4.5,    // Normal text
    large: 3,       // Large text (18pt+ or 14pt+ bold)
  },
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get color with opacity
 */
export function withOpacity(color: string, opacity: number): string {
  // Convert hex to rgba
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Get theme-specific color
 */
export function getThemeColor(theme: 'matrix' | 'hope' | 'muse' | 'treasure'): string {
  switch (theme) {
    case 'hope':
      return colors.agents.hope.primary;
    case 'muse':
      return colors.agents.muse.primary;
    case 'treasure':
      return colors.agents.treasure.primary;
    case 'matrix':
    default:
      return colors.matrix.teal;
  }
}

/**
 * Get theme-specific glow
 */
export function getThemeGlow(theme: 'matrix' | 'hope' | 'muse' | 'treasure'): string {
  switch (theme) {
    case 'hope':
      return shadows.glow.hope;
    case 'muse':
      return shadows.glow.muse;
    case 'treasure':
      return shadows.glow.treasure;
    case 'matrix':
    default:
      return shadows.glow.teal;
  }
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================
export type Theme = 'matrix' | 'hope' | 'muse' | 'treasure';
export type ComponentSize = 'sm' | 'md' | 'lg';
export type SemanticColor = 'success' | 'warning' | 'error' | 'info';

// ============================================================================
// SHADOWS
// ============================================================================
export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',

  // Matrix-themed glows
  glow: {
    teal: '0 0 20px rgba(20, 184, 166, 0.5)',
    cyan: '0 0 20px rgba(0, 240, 255, 0.5)',
    hope: '0 0 20px rgba(59, 130, 246, 0.5)',
    muse: '0 0 20px rgba(139, 92, 246, 0.5)',
    treasure: '0 0 20px rgba(34, 197, 94, 0.5)',
  },
} as const;


