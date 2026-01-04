"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, 
  RefreshCw, 
  Home, 
  ChevronLeft,
  Search,
  Bell,
  Settings,
  Wallet2
} from 'lucide-react';
import MatrixRain from '@/components/MatrixRain';
import MatrixLoader from '@/components/MatrixLoader';

// Standardized Page Header
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<any>;
  showBackButton?: boolean;
  backHref?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ 
  title, 
  subtitle, 
  icon: Icon, 
  showBackButton = false, 
  backHref = "/home",
  actions 
}: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-black/70 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          {showBackButton && (
            <Link 
              href={backHref}
              className="rounded-md border border-white/10 bg-white/5 p-2 text-white/70 hover:bg-white/10 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
          )}
          {Icon && (
            <div className="h-7 w-7 rounded-md bg-teal-500/20 ring-1 ring-teal-400/30 flex items-center justify-center">
              <Icon className="h-4 w-4 text-teal-300" />
            </div>
          )}
          <div>
            <h1 className="text-lg font-semibold text-teal-300">{title}</h1>
            {subtitle && <p className="text-xs text-white/60">{subtitle}</p>}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {actions}
          <Link href="/home" className="text-sm text-white/80 underline hover:text-white transition-colors">
            Home
          </Link>
        </div>
      </div>
    </header>
  );
}

// Standardized Loading State
interface LoadingStateProps {
  message?: string;
  showMatrix?: boolean;
}

export function LoadingState({ message = "Loading...", showMatrix = true }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] relative">
      {showMatrix && (
        <div className="absolute inset-0 opacity-30">
          <MatrixRain speed={0.6} glow="subtle" trail={1.0} />
        </div>
      )}
      <div className="relative z-10 flex flex-col items-center gap-4">
        <MatrixLoader />
        <p className="text-sm text-white/70">{message}</p>
      </div>
    </div>
  );
}

// Standardized Error State
interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  showMatrix?: boolean;
}

export function ErrorState({ 
  title = "Something went wrong", 
  message, 
  onRetry,
  showMatrix = true 
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] relative">
      {showMatrix && (
        <div className="absolute inset-0 opacity-20">
          <MatrixRain speed={0.4} glow="subtle" trail={0.8} />
        </div>
      )}
      <div className="relative z-10 flex flex-col items-center gap-4 text-center max-w-md">
        <div className="rounded-full border border-rose-500/30 bg-rose-500/10 p-4">
          <AlertTriangle className="h-8 w-8 text-rose-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
          <p className="text-sm text-white/70">{message}</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 rounded-lg border border-teal-400/30 bg-teal-400/10 px-4 py-2 text-sm text-teal-200 hover:bg-teal-400/20 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}

// Standardized Empty State
interface EmptyStateProps {
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
  };
  icon?: React.ComponentType<any>;
}

export function EmptyState({ title, description, action, icon: Icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
      {Icon && (
        <div className="rounded-full border border-white/10 bg-white/5 p-4 mb-4">
          <Icon className="h-8 w-8 text-white/40" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-white/60 mb-4 max-w-md">{description}</p>
      {action && (
        <Link
          href={action.href}
          className="inline-flex items-center gap-2 rounded-lg border border-teal-400/30 bg-teal-400/10 px-4 py-2 text-sm text-teal-200 hover:bg-teal-400/20 transition-colors"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}

// Standardized Page Container
interface PageContainerProps {
  children: React.ReactNode;
  showMatrix?: boolean;
  matrixMode?: 'rain' | 'galaxy' | 'code';
  className?: string;
}

export function PageContainer({ 
  children, 
  showMatrix = true, 
  matrixMode = 'rain',
  className = "" 
}: PageContainerProps) {
  return (
    <main className={`min-h-screen bg-gradient-to-b from-black to-[#031a1a] text-white relative ${className}`}>
      {showMatrix && (
        <div className="absolute inset-0 opacity-30">
          <MatrixRain speed={0.8} glow="subtle" trail={1.0} />
        </div>
      )}
      <div className="relative z-10">
        {children}
      </div>
    </main>
  );
}
