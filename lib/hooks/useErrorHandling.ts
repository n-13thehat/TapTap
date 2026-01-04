/**
 * Comprehensive error handling hooks
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { 
  AppError, 
  ValidationError, 
  AuthenticationError, 
  AuthorizationError,
  NotFoundError,
  ConflictError,
  BusinessLogicError,
  ExternalServiceError,
  SystemError,
  RateLimitError,
  isAppError,
  getErrorStatusCode,
  getErrorCode,
  serializeError
} from '../errors/AppError';

// ============================================================================
// Error State Management
// ============================================================================

export interface ErrorState {
  error: Error | null;
  isError: boolean;
  errorCode: string | null;
  statusCode: number | null;
  retryCount: number;
  canRetry: boolean;
  isRetrying: boolean;
}

export interface ErrorHandlerOptions {
  maxRetries?: number;
  retryDelay?: number;
  retryDelayMultiplier?: number;
  shouldRetry?: (error: Error, retryCount: number) => boolean;
  onError?: (error: Error, errorInfo: any) => void;
  onRetry?: (error: Error, retryCount: number) => void;
  onMaxRetriesReached?: (error: Error) => void;
}

const defaultErrorHandlerOptions: Required<ErrorHandlerOptions> = {
  maxRetries: 3,
  retryDelay: 1000,
  retryDelayMultiplier: 2,
  shouldRetry: (error: Error, retryCount: number) => {
    // Don't retry validation, authentication, or authorization errors
    if (
      error instanceof ValidationError ||
      error instanceof AuthenticationError ||
      error instanceof AuthorizationError ||
      error instanceof NotFoundError ||
      error instanceof ConflictError ||
      error instanceof BusinessLogicError
    ) {
      return false;
    }
    
    // Retry system errors and external service errors
    if (
      error instanceof SystemError ||
      error instanceof ExternalServiceError ||
      error instanceof RateLimitError
    ) {
      return retryCount < 3;
    }
    
    // For unknown errors, retry once
    return retryCount < 1;
  },
  onError: () => {},
  onRetry: () => {},
  onMaxRetriesReached: () => {},
};

// ============================================================================
// Main Error Handling Hook
// ============================================================================

export function useErrorHandler(options: ErrorHandlerOptions = {}) {
  const opts = { ...defaultErrorHandlerOptions, ...options };
  
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    isError: false,
    errorCode: null,
    statusCode: null,
    retryCount: 0,
    canRetry: false,
    isRetrying: false,
  });
  
  const retryTimeoutRef = useRef<NodeJS.Timeout>();
  
  const setError = useCallback((error: Error | null, errorInfo?: any) => {
    if (!error) {
      setErrorState({
        error: null,
        isError: false,
        errorCode: null,
        statusCode: null,
        retryCount: 0,
        canRetry: false,
        isRetrying: false,
      });
      return;
    }
    
    const canRetry = opts.shouldRetry(error, 0);
    
    setErrorState({
      error,
      isError: true,
      errorCode: getErrorCode(error),
      statusCode: getErrorStatusCode(error),
      retryCount: 0,
      canRetry,
      isRetrying: false,
    });
    
    opts.onError(error, errorInfo);
  }, [opts]);
  
  const retry = useCallback(async (customAction?: () => Promise<void>) => {
    const { error, retryCount } = errorState;
    
    if (!error || !errorState.canRetry || errorState.isRetrying) {
      return;
    }
    
    const newRetryCount = retryCount + 1;
    
    if (newRetryCount > opts.maxRetries) {
      opts.onMaxRetriesReached(error);
      setErrorState(prev => ({ ...prev, canRetry: false }));
      return;
    }
    
    setErrorState(prev => ({ ...prev, isRetrying: true }));
    opts.onRetry(error, newRetryCount);
    
    // Calculate delay with exponential backoff
    const delay = opts.retryDelay * Math.pow(opts.retryDelayMultiplier, newRetryCount - 1);
    
    try {
      await new Promise(resolve => {
        retryTimeoutRef.current = setTimeout(resolve, delay);
      });
      
      if (customAction) {
        await customAction();
      }
      
      // If we get here, the retry was successful
      setError(null);
    } catch (retryError) {
      const canRetryAgain = opts.shouldRetry(retryError as Error, newRetryCount);
      
      setErrorState(prev => ({
        ...prev,
        error: retryError as Error,
        errorCode: getErrorCode(retryError),
        statusCode: getErrorStatusCode(retryError),
        retryCount: newRetryCount,
        canRetry: canRetryAgain,
        isRetrying: false,
      }));
    }
  }, [errorState, opts, setError]);
  
  const clearError = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    setError(null);
  }, [setError]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);
  
  return {
    ...errorState,
    setError,
    retry,
    clearError,
  };
}

// ============================================================================
// Async Operation Error Handling
// ============================================================================

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  isError: boolean;
  retryCount: number;
  canRetry: boolean;
}

export function useAsyncError<T>(
  asyncFn: () => Promise<T>,
  dependencies: React.DependencyList = [],
  options: ErrorHandlerOptions = {}
) {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null,
    isError: false,
    retryCount: 0,
    canRetry: false,
  });
  
  const errorHandler = useErrorHandler(options);
  
  const execute = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null, isError: false }));
    
    try {
      const result = await asyncFn();
      setState(prev => ({
        ...prev,
        data: result,
        loading: false,
        error: null,
        isError: false,
        retryCount: 0,
        canRetry: false,
      }));
      return result;
    } catch (error) {
      const canRetry = options.shouldRetry?.(error as Error, 0) ?? true;
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: error as Error,
        isError: true,
        canRetry,
      }));
      
      errorHandler.setError(error as Error);
      throw error;
    }
  }, [asyncFn, errorHandler, options]);
  
  const retry = useCallback(async () => {
    if (!state.canRetry) return;
    
    const newRetryCount = state.retryCount + 1;
    setState(prev => ({ ...prev, retryCount: newRetryCount }));
    
    return execute();
  }, [execute, state.canRetry, state.retryCount]);
  
  // Auto-execute on mount and dependency changes
  useEffect(() => {
    execute();
  }, dependencies);
  
  return {
    ...state,
    execute,
    retry,
    clearError: () => setState(prev => ({ ...prev, error: null, isError: false })),
  };
}

// ============================================================================
// Form Error Handling
// ============================================================================

export interface FormErrorState {
  fieldErrors: Record<string, string>;
  globalError: string | null;
  isSubmitting: boolean;
  hasErrors: boolean;
}

export function useFormErrorHandler() {
  const [errorState, setErrorState] = useState<FormErrorState>({
    fieldErrors: {},
    globalError: null,
    isSubmitting: false,
    hasErrors: false,
  });
  
  const setFieldError = useCallback((field: string, error: string | null) => {
    setErrorState(prev => {
      const newFieldErrors = { ...prev.fieldErrors };
      
      if (error) {
        newFieldErrors[field] = error;
      } else {
        delete newFieldErrors[field];
      }
      
      return {
        ...prev,
        fieldErrors: newFieldErrors,
        hasErrors: Object.keys(newFieldErrors).length > 0 || !!prev.globalError,
      };
    });
  }, []);
  
  const setGlobalError = useCallback((error: string | null) => {
    setErrorState(prev => ({
      ...prev,
      globalError: error,
      hasErrors: Object.keys(prev.fieldErrors).length > 0 || !!error,
    }));
  }, []);
  
  const setSubmitting = useCallback((isSubmitting: boolean) => {
    setErrorState(prev => ({ ...prev, isSubmitting }));
  }, []);
  
  const clearErrors = useCallback(() => {
    setErrorState({
      fieldErrors: {},
      globalError: null,
      isSubmitting: false,
      hasErrors: false,
    });
  }, []);
  
  const handleSubmitError = useCallback((error: Error) => {
    if (error instanceof ValidationError) {
      if (error.field) {
        setFieldError(error.field, error.message);
      } else {
        setGlobalError(error.message);
      }
    } else {
      setGlobalError(error.message);
    }
    setSubmitting(false);
  }, [setFieldError, setGlobalError, setSubmitting]);
  
  return {
    ...errorState,
    setFieldError,
    setGlobalError,
    setSubmitting,
    clearErrors,
    handleSubmitError,
  };
}

// ============================================================================
// Network Error Handling
// ============================================================================

export function useNetworkErrorHandler() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  
  const [networkError, setNetworkError] = useState<Error | null>(null);
  
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setNetworkError(null);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setNetworkError(new Error('Network connection lost'));
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  const handleNetworkError = useCallback((error: Error) => {
    if (error.message.includes('fetch') || error.message.includes('network')) {
      setNetworkError(error);
    }
  }, []);
  
  return {
    isOnline,
    networkError,
    handleNetworkError,
    clearNetworkError: () => setNetworkError(null),
  };
}

// ============================================================================
// Global Error Handler
// ============================================================================

export function useGlobalErrorHandler() {
  const errorHandler = useErrorHandler({
    onError: (error, errorInfo) => {
      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.group('🚨 Global Error Handler');
        console.error('Error:', error);
        console.error('Error Info:', errorInfo);
        console.error('Serialized:', serializeError(error));
        console.groupEnd();
      }
      
      // Report to monitoring service
      if (typeof window !== 'undefined' && (window as any).Sentry) {
        (window as any).Sentry.captureException(error, {
          extra: errorInfo,
          tags: {
            errorHandler: 'global',
          },
        });
      }
      
      // Report to analytics
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'exception', {
          description: error.message,
          fatal: false,
          error_code: getErrorCode(error),
          status_code: getErrorStatusCode(error),
        });
      }
    },
  });
  
  // Handle unhandled promise rejections
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      errorHandler.setError(
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        { type: 'unhandledRejection' }
      );
    };
    
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [errorHandler]);
  
  // Handle global errors
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      errorHandler.setError(event.error || new Error(event.message), {
        type: 'globalError',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    };
    
    window.addEventListener('error', handleError);
    
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, [errorHandler]);
  
  return errorHandler;
}

// ============================================================================
// Error Recovery Utilities
// ============================================================================

export function useErrorRecovery() {
  const [recoveryStrategies] = useState(() => new Map<string, () => void>());
  
  const registerRecoveryStrategy = useCallback((errorCode: string, strategy: () => void) => {
    recoveryStrategies.set(errorCode, strategy);
  }, [recoveryStrategies]);
  
  const executeRecoveryStrategy = useCallback((error: Error) => {
    const errorCode = getErrorCode(error);
    const strategy = recoveryStrategies.get(errorCode);
    
    if (strategy) {
      try {
        strategy();
        return true;
      } catch (recoveryError) {
        console.error('Recovery strategy failed:', recoveryError);
        return false;
      }
    }
    
    return false;
  }, [recoveryStrategies]);
  
  return {
    registerRecoveryStrategy,
    executeRecoveryStrategy,
  };
}
