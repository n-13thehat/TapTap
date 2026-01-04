"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Mobile viewport detection hook
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

// Touch-friendly button component
interface TouchButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export function TouchButton({
  children,
  onClick,
  className = '',
  variant = 'secondary',
  size = 'md',
  disabled = false
}: TouchButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-teal-500 hover:bg-teal-600 text-white shadow-lg',
    secondary: 'bg-white/10 hover:bg-white/20 text-white border border-white/20',
    ghost: 'text-white/70 hover:text-white hover:bg-white/10'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm min-h-[36px]',
    md: 'px-4 py-3 text-base min-h-[44px]',
    lg: 'px-6 py-4 text-lg min-h-[52px]'
  };

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {children}
    </motion.button>
  );
}

// Mobile-optimized input component
interface MobileInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'search';
  className?: string;
  autoFocus?: boolean;
}

export function MobileInput({
  value,
  onChange,
  placeholder,
  type = 'text',
  className = '',
  autoFocus = false
}: MobileInputProps) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
      className={`
        w-full px-4 py-3 text-base bg-white/10 border border-white/20 rounded-lg
        text-white placeholder-white/50 
        focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:border-teal-400/50
        transition-all duration-200
        ${className}
      `}
      style={{
        fontSize: '16px', // Prevents zoom on iOS
        WebkitAppearance: 'none' // Removes iOS styling
      }}
    />
  );
}

// Mobile-friendly modal/drawer
interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  position?: 'bottom' | 'top' | 'full';
}

export function MobileDrawer({
  isOpen,
  onClose,
  title,
  children,
  position = 'bottom'
}: MobileDrawerProps) {
  const isMobile = useIsMobile();

  const getMotionProps = () => {
    switch (position) {
      case 'bottom':
        return {
          initial: { y: '100%' },
          animate: { y: 0 },
          exit: { y: '100%' }
        };
      case 'top':
        return {
          initial: { y: '-100%' },
          animate: { y: 0 },
          exit: { y: '-100%' }
        };
      case 'full':
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 }
        };
    }
  };

  const getContainerClasses = () => {
    switch (position) {
      case 'bottom':
        return 'fixed inset-x-0 bottom-0 z-50 max-h-[90vh] rounded-t-xl';
      case 'top':
        return 'fixed inset-x-0 top-0 z-50 max-h-[90vh] rounded-b-xl';
      case 'full':
        return 'fixed inset-0 z-50';
    }
  };

  if (!isMobile) {
    // On desktop, render as a regular modal
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 bg-black/90 backdrop-blur-md border border-white/10 rounded-xl p-6"
            >
              {title && (
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white">{title}</h2>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    ×
                  </button>
                </div>
              )}
              {children}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            {...getMotionProps()}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`${getContainerClasses()} bg-black/95 backdrop-blur-md border-t border-white/10`}
          >
            {title && (
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h2 className="text-lg font-semibold text-white">{title}</h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                >
                  ×
                </button>
              </div>
            )}
            <div className="overflow-y-auto max-h-full">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Mobile-optimized list item
interface MobileListItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  showChevron?: boolean;
}

export function MobileListItem({
  children,
  onClick,
  className = '',
  showChevron = false
}: MobileListItemProps) {
  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg
        ${onClick ? 'cursor-pointer hover:bg-white/10 active:bg-white/15' : ''}
        transition-colors duration-200
        ${className}
      `}
    >
      <div className="flex-1">{children}</div>
      {showChevron && onClick && (
        <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      )}
    </motion.div>
  );
}

// Safe area padding for mobile devices
export function SafeAreaContainer({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`pb-safe-bottom pt-safe-top ${className}`} style={{
      paddingBottom: 'env(safe-area-inset-bottom)',
      paddingTop: 'env(safe-area-inset-top)',
      paddingLeft: 'env(safe-area-inset-left)',
      paddingRight: 'env(safe-area-inset-right)'
    }}>
      {children}
    </div>
  );
}
