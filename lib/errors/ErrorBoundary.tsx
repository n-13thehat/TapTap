/**
 * React Error Boundary components for graceful error handling
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AppError, isAppError, serializeError } from './AppError';

// ============================================================================
// Error Boundary Props & State
// ============================================================================

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
  isolate?: boolean;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

export interface ErrorFallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  resetError: () => void;
  errorId: string | null;
}

// ============================================================================
// Default Error Fallback Components
// ============================================================================

const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({ 
  error, 
  resetError, 
  errorId 
}) => (
  <div className="min-h-[400px] flex items-center justify-center bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
    <div className="text-center p-6 max-w-md">
      <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center">
        <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      
      <h2 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-2">
        Something went wrong
      </h2>
      
      <p className="text-red-600 dark:text-red-300 mb-4 text-sm">
        {isAppError(error) ? error.message : 'An unexpected error occurred'}
      </p>
      
      {errorId && (
        <p className="text-xs text-red-500 dark:text-red-400 mb-4 font-mono">
          Error ID: {errorId}
        </p>
      )}
      
      <button
        onClick={resetError}
        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
      >
        Try Again
      </button>
    </div>
  </div>
);

const MinimalErrorFallback: React.FC<ErrorFallbackProps> = ({ resetError }) => (
  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
    <div className="flex items-center justify-between">
      <span className="text-sm text-red-800 dark:text-red-200">
        Something went wrong
      </span>
      <button
        onClick={resetError}
        className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 underline"
      >
        Retry
      </button>
    </div>
  </div>
);

const FullPageErrorFallback: React.FC<ErrorFallbackProps> = ({ 
  error, 
  resetError, 
  errorId 
}) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
    <div className="text-center max-w-lg">
      <div className="w-24 h-24 mx-auto mb-6 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center">
        <svg className="w-12 h-12 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
        Oops! Something went wrong
      </h1>
      
      <p className="text-gray-600 dark:text-gray-300 mb-6">
        {isAppError(error) 
          ? error.message 
          : 'We encountered an unexpected error. Please try again or contact support if the problem persists.'
        }
      </p>
      
      {errorId && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 font-mono">
          Error ID: {errorId}
        </p>
      )}
      
      <div className="space-x-4">
        <button
          onClick={resetError}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          Try Again
        </button>
        <button
          onClick={() => window.location.href = '/'}
          className="px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
        >
          Go Home
        </button>
      </div>
    </div>
  </div>
);

// ============================================================================
// Error Boundary Class Component
// ============================================================================

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Call onError callback if provided
    this.props.onError?.(error, errorInfo);

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Boundary Caught Error');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Serialized:', serializeError(error));
      console.groupEnd();
    }

    // Report error to monitoring service
    this.reportError(error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetOnPropsChange, resetKeys } = this.props;
    const { hasError } = this.state;

    // Reset error state when resetKeys change
    if (hasError && resetKeys && prevProps.resetKeys) {
      const hasResetKeyChanged = resetKeys.some(
        (key, index) => key !== prevProps.resetKeys![index]
      );
      
      if (hasResetKeyChanged) {
        this.resetError();
      }
    }

    // Reset error state when any prop changes (if enabled)
    if (hasError && resetOnPropsChange && prevProps !== this.props) {
      this.resetError();
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    try {
      // Report to external monitoring service (e.g., Sentry)
      if (typeof window !== 'undefined' && (window as any).Sentry) {
        (window as any).Sentry.withScope((scope: any) => {
          scope.setTag('errorBoundary', true);
          scope.setContext('errorInfo', errorInfo);
          scope.setLevel('error');
          (window as any).Sentry.captureException(error);
        });
      }

      // Report to internal analytics
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'exception', {
          description: error.message,
          fatal: true,
          error_boundary: true,
        });
      }
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  };

  private resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });
  };

  render() {
    const { hasError, error, errorInfo, errorId } = this.state;
    const { children, fallback: FallbackComponent = DefaultErrorFallback, isolate } = this.props;

    if (hasError) {
      const errorFallbackProps: ErrorFallbackProps = {
        error,
        errorInfo,
        resetError: this.resetError,
        errorId,
      };

      if (isolate) {
        return (
          <div style={{ isolation: 'isolate' }}>
            <FallbackComponent {...errorFallbackProps} />
          </div>
        );
      }

      return <FallbackComponent {...errorFallbackProps} />;
    }

    return children;
  }
}

// ============================================================================
// Specialized Error Boundaries
// ============================================================================

export const PageErrorBoundary: React.FC<Omit<ErrorBoundaryProps, 'fallback'>> = (props) => (
  <ErrorBoundary {...props} fallback={FullPageErrorFallback} />
);

export const ComponentErrorBoundary: React.FC<Omit<ErrorBoundaryProps, 'fallback'>> = (props) => (
  <ErrorBoundary {...props} fallback={DefaultErrorFallback} isolate />
);

export const MinimalErrorBoundary: React.FC<Omit<ErrorBoundaryProps, 'fallback'>> = (props) => (
  <ErrorBoundary {...props} fallback={MinimalErrorFallback} />
);

// ============================================================================
// Error Boundary Hook
// ============================================================================

export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const handleError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { handleError, resetError };
}

// ============================================================================
// Higher-Order Component
// ============================================================================

export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

// ============================================================================
// Error Boundary Provider
// ============================================================================

interface ErrorBoundaryContextValue {
  reportError: (error: Error) => void;
  clearError: () => void;
}

const ErrorBoundaryContext = React.createContext<ErrorBoundaryContextValue | null>(null);

export const ErrorBoundaryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const reportError = React.useCallback((error: Error) => {
    // Report error to monitoring service
    console.error('Reported error:', error);
    
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error);
    }
  }, []);

  const clearError = React.useCallback(() => {
    // Clear any error state if needed
  }, []);

  const value = React.useMemo(() => ({
    reportError,
    clearError,
  }), [reportError, clearError]);

  return (
    <ErrorBoundaryContext.Provider value={value}>
      {children}
    </ErrorBoundaryContext.Provider>
  );
};

export function useErrorBoundaryContext() {
  const context = React.useContext(ErrorBoundaryContext);
  if (!context) {
    throw new Error('useErrorBoundaryContext must be used within ErrorBoundaryProvider');
  }
  return context;
}
