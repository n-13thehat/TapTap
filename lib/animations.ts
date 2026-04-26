/**
 * TapTap Matrix Animation Library
 * Framer Motion animation variants and utilities
 */

import type { Variants, Transition, TargetAndTransition } from 'framer-motion';

// ============================================================================
// EASING FUNCTIONS
// ============================================================================

export const easing = {
  easeInOut: [0.4, 0, 0.2, 1],
  easeOut: [0, 0, 0.2, 1],
  easeIn: [0.4, 0, 1, 1],
  sharp: [0.4, 0, 0.6, 1],
  spring: { type: 'spring', damping: 25, stiffness: 200 },
  springBouncy: { type: 'spring', damping: 15, stiffness: 300 },
  springSmooth: { type: 'spring', damping: 30, stiffness: 150 },
} as const;

// ============================================================================
// DURATION PRESETS
// ============================================================================

export const duration = {
  instant: 0,
  fast: 0.15,
  normal: 0.3,
  slow: 0.5,
  slower: 0.7,
} as const;

// ============================================================================
// PAGE TRANSITIONS
// ============================================================================

export const pageTransition: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: duration.normal,
      ease: easing.easeOut,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: duration.fast,
      ease: easing.easeIn,
    },
  },
};

export const pageSlideTransition: Variants = {
  initial: {
    opacity: 0,
    x: 100,
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: duration.normal,
      ease: easing.easeOut,
    },
  },
  exit: {
    opacity: 0,
    x: -100,
    transition: {
      duration: duration.fast,
      ease: easing.easeIn,
    },
  },
};

// ============================================================================
// CARD ANIMATIONS
// ============================================================================

export const cardHover: Variants = {
  rest: {
    scale: 1,
    y: 0,
  },
  hover: {
    scale: 1.02,
    y: -4,
    transition: {
      duration: duration.fast,
      ease: easing.easeOut,
    },
  },
  tap: {
    scale: 0.98,
  },
};

export const cardGlow: Variants = {
  rest: {
    boxShadow: '0 0 0 rgba(20, 184, 166, 0)',
  },
  hover: {
    boxShadow: '0 0 30px rgba(20, 184, 166, 0.3)',
    transition: {
      duration: duration.normal,
    },
  },
};

// ============================================================================
// LIST ANIMATIONS
// ============================================================================

export const listContainer: Variants = {
  hidden: {
    opacity: 0,
  },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

export const listItem: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: duration.normal,
      ease: easing.easeOut,
    },
  },
};

// ============================================================================
// MODAL ANIMATIONS


// ============================================================================
// BUTTON ANIMATIONS
// ============================================================================

export const buttonTap: Variants = {
  rest: {
    scale: 1,
  },
  hover: {
    scale: 1.05,
    transition: {
      duration: duration.fast,
    },
  },
  tap: {
    scale: 0.95,
  },
};

// Direct-prop interaction targets (use as whileTap={...} / whileHover={...})
export const tapInteraction: TargetAndTransition = { scale: 0.95 };
export const hoverInteraction: TargetAndTransition = { scale: 1.05 };
export const cardLiftInteraction: TargetAndTransition = {
  scale: 1.02,
  y: -4,
  transition: { duration: duration.fast },
};

export const buttonGlow: Variants = {
  rest: {
    boxShadow: '0 0 0 rgba(20, 184, 166, 0)',
  },
  hover: {
    boxShadow: '0 0 20px rgba(20, 184, 166, 0.5)',
  },
};

// ============================================================================
// LOADING ANIMATIONS
// ============================================================================

export const spinner: Variants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

export const pulse: Variants = {
  animate: {
    scale: [1, 1.2, 1],
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

export const dots: Variants = {
  animate: (i: number) => ({
    y: [0, -10, 0],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      delay: i * 0.1,
    },
  }),
};

// ============================================================================
// NOTIFICATION ANIMATIONS
// ============================================================================

export const notification: Variants = {
  initial: {
    opacity: 0,
    y: 50,
    scale: 0.3,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: duration.normal,
      ease: easing.springBouncy,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.5,
    transition: {
      duration: duration.fast,
    },
  },
};

// ============================================================================
// MENU ANIMATIONS
// ============================================================================

export const menuContainer: Variants = {
  closed: {
    opacity: 0,
    scale: 0.95,
    y: -10,
  },
  open: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: duration.fast,
      ease: easing.easeOut,
      staggerChildren: 0.03,
    },
  },
};

export const menuItem: Variants = {
  closed: {
    opacity: 0,
    x: -10,
  },
  open: {
    opacity: 1,
    x: 0,
  },
};

// ============================================================================
// MATRIX-SPECIFIC ANIMATIONS
// ============================================================================

export const matrixGlitch: Variants = {
  animate: {
    x: [0, -2, 2, -2, 2, 0],
    opacity: [1, 0.8, 1, 0.8, 1],
    transition: {
      duration: 0.3,
      repeat: Infinity,
      repeatDelay: 3,
    },
  },
};

export const matrixScanline: Variants = {
  animate: {
    y: ['0%', '100%'],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

export const matrixPulse: Variants = {
  animate: {
    boxShadow: [
      '0 0 0 rgba(20, 184, 166, 0)',
      '0 0 20px rgba(20, 184, 166, 0.5)',
      '0 0 0 rgba(20, 184, 166, 0)',
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create a stagger transition for children
 */
export function staggerChildren(staggerDelay: number = 0.05): Transition {
  return {
    staggerChildren: staggerDelay,
  };
}

/**
 * Create a spring transition
 */
export function spring(damping: number = 25, stiffness: number = 200): Transition {
  return {
    type: 'spring',
    damping,
    stiffness,
  };
}

/**
 * Create a delay transition
 */
export function delay(seconds: number): Transition {
  return {
    delay: seconds,
  };
}

/**
 * Combine multiple variants
 */
export function combineVariants(...variants: Variants[]): Variants {
  return variants.reduce((acc, variant) => ({ ...acc, ...variant }), {});
}

// ============================================================================

export const modalBackdrop: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: duration.fast,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: duration.fast,
    },
  },
};

export const modalContent: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: duration.normal,
      ease: easing.easeOut,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: {
      duration: duration.fast,
      ease: easing.easeIn,
    },
  },
};

