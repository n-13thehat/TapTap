import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomBytes } from 'crypto';
import { Logger } from '@/lib/logger';
import { AuthorizationError } from '@/lib/errors';
import { withErrorHandler } from './error-handler';
import { Redis } from '@upstash/redis';

// CSRF token configuration
const CSRF_TOKEN_LENGTH = 32;
const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_COOKIE_NAME = 'csrf-token';
const CSRF_TOKEN_LIFETIME = 24 * 60 * 60 * 1000; // 24 hours

interface CSRFTokenData {
  token: string;
  timestamp: number;
  sessionId?: string;
}

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

// In-memory store for CSRF tokens (fallback if Redis unavailable)
const csrfTokens = new Map<string, CSRFTokenData>();

async function storeToken(token: string, data: CSRFTokenData) {
  if (redis) {
    await redis.setex(`csrf:${token}`, CSRF_TOKEN_LIFETIME / 1000, JSON.stringify(data));
    return;
  }
  csrfTokens.set(token, data);
}

async function getToken(token: string): Promise<CSRFTokenData | null> {
  if (redis) {
    const raw = await redis.get<string>(`csrf:${token}`);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as CSRFTokenData;
    } catch {
      return null;
    }
  }
  const entry = csrfTokens.get(token);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CSRF_TOKEN_LIFETIME) {
    csrfTokens.delete(token);
    return null;
  }
  return entry;
}

// Generate CSRF token
export function generateCSRFToken(sessionId?: string): string {
  const token = randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
  const timestamp = Date.now();
  
  storeToken(token, { token, timestamp, sessionId }).catch((err) => {
    Logger.error('Failed to persist CSRF token', err as Error);
  });
  
  return token;
}

// Validate CSRF token
export async function validateCSRFToken(token: string, sessionId?: string): Promise<boolean> {
  const tokenData = await getToken(token);
  
  if (!tokenData) return false;

  // Check if token is expired (in-memory fallback)
  if (Date.now() - tokenData.timestamp > CSRF_TOKEN_LIFETIME) {
    if (!redis) csrfTokens.delete(token);
    return false;
  }
  
  if (sessionId && tokenData.sessionId && tokenData.sessionId !== sessionId) {
    return false;
  }
  
  return true;
}

// CSRF protection middleware
export function withCSRFProtection(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>
) {
  return withErrorHandler(async (req: NextRequest, context?: any) => {
    const method = req.method.toUpperCase();
    
    // Skip CSRF protection for safe methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      return handler(req, context);
    }
    
    // Get CSRF token from header or body
    const csrfToken = req.headers.get(CSRF_HEADER_NAME) || 
                     req.headers.get('x-xsrf-token') ||
                     (await getCSRFTokenFromBody(req));
    
    if (!csrfToken) {
      Logger.security('CSRF token missing', {
        severity: 'medium',
        metadata: {
          ip: req.headers.get('x-forwarded-for') || 'unknown',
          userAgent: req.headers.get('user-agent') || 'unknown',
          url: req.url,
          method: req.method,
        },
      });
      
      throw new AuthorizationError('CSRF token required');
    }
    
    // Get session ID from cookie or header
    const sessionId = req.cookies.get('session-id')?.value ??
                     req.headers.get('x-session-id') ??
                     undefined;
    
    // Validate CSRF token
    if (!(await validateCSRFToken(csrfToken, sessionId))) {
      Logger.security('Invalid CSRF token', {
        severity: 'high',
        metadata: {
          ip: req.headers.get('x-forwarded-for') || 'unknown',
          userAgent: req.headers.get('user-agent') || 'unknown',
          url: req.url,
          method: req.method,
          csrfToken: csrfToken.substring(0, 8) + '...', // Log partial token for debugging
        },
      });
      
      throw new AuthorizationError('Invalid CSRF token');
    }
    
    Logger.debug('CSRF token validated', {
      metadata: {
        url: req.url,
        method: req.method,
      },
    });
    
    return handler(req, context);
  });
}

// Get CSRF token from request body
async function getCSRFTokenFromBody(req: NextRequest): Promise<string | null> {
  try {
    const contentType = req.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      const body = await req.json();
      return body._csrf || body.csrfToken || null;
    }
    
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData();
      return formData.get('_csrf')?.toString() || 
             formData.get('csrfToken')?.toString() || 
             null;
    }
    
    return null;
  } catch {
    return null;
  }
}

// Middleware to add CSRF token to response
export function withCSRFToken(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>
) {
  return withErrorHandler(async (req: NextRequest, context?: any) => {
    const response = await handler(req, context);
    
    // Generate new CSRF token for GET requests
    if (req.method === 'GET') {
      const sessionId = req.cookies.get('session-id')?.value;
      const csrfToken = generateCSRFToken(sessionId);
      
      // Add CSRF token to response headers
      response.headers.set('x-csrf-token', csrfToken);
      
      // Set CSRF token cookie
      response.cookies.set(CSRF_COOKIE_NAME, csrfToken, {
        httpOnly: false, // Allow JavaScript access for AJAX requests
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: CSRF_TOKEN_LIFETIME / 1000,
      });
    }
    
    return response;
  });
}

// Double submit cookie pattern
export function withDoubleSubmitCookie(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>
) {
  return withErrorHandler(async (req: NextRequest, context?: any) => {
    const method = req.method.toUpperCase();
    
    // Skip for safe methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      return handler(req, context);
    }
    
    // Get token from header and cookie
    const headerToken = req.headers.get(CSRF_HEADER_NAME);
    const cookieToken = req.cookies.get(CSRF_COOKIE_NAME)?.value;
    
    if (!headerToken || !cookieToken) {
      Logger.security('Double submit cookie tokens missing', {
        severity: 'medium',
        metadata: {
          ip: req.headers.get('x-forwarded-for') || 'unknown',
          url: req.url,
          method: req.method,
          hasHeaderToken: !!headerToken,
          hasCookieToken: !!cookieToken,
        },
      });
      
      throw new AuthorizationError('CSRF protection failed');
    }
    
    // Compare tokens using constant-time comparison
    if (!constantTimeCompare(headerToken, cookieToken)) {
      Logger.security('Double submit cookie tokens mismatch', {
        severity: 'high',
        metadata: {
          ip: req.headers.get('x-forwarded-for') || 'unknown',
          url: req.url,
          method: req.method,
        },
      });
      
      throw new AuthorizationError('CSRF protection failed');
    }
    
    return handler(req, context);
  });
}

// Constant-time string comparison to prevent timing attacks
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  const aHash = createHash('sha256').update(a).digest();
  const bHash = createHash('sha256').update(b).digest();
  
  let result = 0;
  for (let i = 0; i < aHash.length; i++) {
    result |= aHash[i] ^ bHash[i];
  }
  
  return result === 0;
}

// Origin validation middleware
export function withOriginValidation(
  allowedOrigins: string[] = []
) {
  return (handler: (req: NextRequest, context?: any) => Promise<NextResponse>) => {
    return withErrorHandler(async (req: NextRequest, context?: any) => {
      const origin = req.headers.get('origin');
      const referer = req.headers.get('referer');
      
      // Allow same-origin requests
      const requestUrl = new URL(req.url);
      const allowedOriginsList = [
        `${requestUrl.protocol}//${requestUrl.host}`,
        ...allowedOrigins,
      ];
      
      // Check origin header
      if (origin && !allowedOriginsList.includes(origin)) {
        Logger.security('Invalid origin', {
          severity: 'high',
          metadata: {
            ip: req.headers.get('x-forwarded-for') || 'unknown',
            origin,
            allowedOrigins: allowedOriginsList,
            url: req.url,
          },
        });
        
        throw new AuthorizationError('Invalid origin');
      }
      
      // Check referer header as fallback
      if (!origin && referer) {
        const refererUrl = new URL(referer);
        const refererOrigin = `${refererUrl.protocol}//${refererUrl.host}`;
        
        if (!allowedOriginsList.includes(refererOrigin)) {
          Logger.security('Invalid referer', {
            severity: 'medium',
            metadata: {
              ip: req.headers.get('x-forwarded-for') || 'unknown',
              referer,
              allowedOrigins: allowedOriginsList,
              url: req.url,
            },
          });
          
          throw new AuthorizationError('Invalid referer');
        }
      }
      
      return handler(req, context);
    });
  };
}
