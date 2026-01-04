import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth.config';
import { prisma } from '@/lib/prisma';
import { Logger } from '@/lib/logger';
import { AuthenticationError, AuthorizationError } from '@/lib/errors';
import { withErrorHandler } from './error-handler';
import { createHash, timingSafeEqual } from 'crypto';

export interface AuthenticatedRequest extends NextRequest {
  user: {
    id: string;
    email: string;
    username: string;
    role: string;
    status: string;
    verified: string;
  };
}

// Authentication middleware
export function withAuth(
  handler: (req: AuthenticatedRequest, context?: any) => Promise<NextResponse>
) {
  return withErrorHandler(async (req: NextRequest, context?: any) => {
    const session = await auth();
    
    if (!session?.user?.id) {
      Logger.security('Unauthorized access attempt', {
        severity: 'medium',
        metadata: {
          ip: req.headers.get('x-forwarded-for') || 'unknown',
          userAgent: req.headers.get('user-agent') || 'unknown',
          url: req.url,
          method: req.method,
        },
      });
      
      throw new AuthenticationError('Authentication required');
    }

    // Fetch full user data
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        status: true,
        verified: true,
        deletedAt: true,
      },
    });

    if (!user || user.deletedAt) {
      Logger.security('Access attempt with deleted/invalid user', {
        severity: 'high',
        userId: session.user.id,
        metadata: {
          ip: req.headers.get('x-forwarded-for') || 'unknown',
        },
      });
      
      throw new AuthenticationError('Invalid user account');
    }

    if (user.status !== 'ACTIVE') {
      Logger.security('Access attempt with inactive user', {
        severity: 'medium',
        userId: user.id,
        metadata: {
          status: user.status,
          ip: req.headers.get('x-forwarded-for') || 'unknown',
        },
      });
      
      throw new AuthenticationError('Account is not active');
    }

    // Add user to request
    const authenticatedReq = req as AuthenticatedRequest;
    authenticatedReq.user = user as any;

    // Log successful authentication
    Logger.audit('User authenticated', {
      userId: user.id,
      resource: req.url,
      result: 'success',
    });

    return handler(authenticatedReq, context);
  });
}

// Role-based authorization middleware
export function withRole(
  roles: string | string[],
  handler: (req: AuthenticatedRequest, context?: any) => Promise<NextResponse>
) {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  return withAuth(async (req: AuthenticatedRequest, context?: any) => {
    if (!allowedRoles.includes(req.user.role)) {
      Logger.security('Insufficient permissions', {
        severity: 'medium',
        userId: req.user.id,
        metadata: {
          userRole: req.user.role,
          requiredRoles: allowedRoles,
          resource: req.url,
        },
      });
      
      throw new AuthorizationError(`Requires one of: ${allowedRoles.join(', ')}`);
    }

    Logger.audit('Authorization granted', {
      userId: req.user.id,
      resource: req.url,
      result: 'success',
      details: { role: req.user.role, requiredRoles: allowedRoles },
    });

    return handler(req, context);
  });
}

// Admin-only middleware
export function withAdmin(
  handler: (req: AuthenticatedRequest, context?: any) => Promise<NextResponse>
) {
  return withRole('ADMIN', handler);
}

// Creator or Admin middleware
export function withCreator(
  handler: (req: AuthenticatedRequest, context?: any) => Promise<NextResponse>
) {
  return withRole(['CREATOR', 'ADMIN'], handler);
}

// Moderator or Admin middleware
export function withModerator(
  handler: (req: AuthenticatedRequest, context?: any) => Promise<NextResponse>
) {
  return withRole(['MODERATOR', 'ADMIN'], handler);
}

// Resource ownership middleware
export function withOwnership(
  getResourceUserId: (req: AuthenticatedRequest, context?: any) => Promise<string>,
  handler: (req: AuthenticatedRequest, context?: any) => Promise<NextResponse>
) {
  return withAuth(async (req: AuthenticatedRequest, context?: any) => {
    const resourceUserId = await getResourceUserId(req, context);
    
    // Allow if user owns the resource or is admin
    if (req.user.id !== resourceUserId && req.user.role !== 'ADMIN') {
      Logger.security('Unauthorized resource access', {
        severity: 'medium',
        userId: req.user.id,
        metadata: {
          resourceUserId,
          resource: req.url,
        },
      });
      
      throw new AuthorizationError('You can only access your own resources');
    }

    Logger.audit('Resource access granted', {
      userId: req.user.id,
      resource: req.url,
      result: 'success',
      details: { resourceUserId },
    });

    return handler(req, context);
  });
}

// API key authentication middleware
export function withApiKey(
  handler: (req: NextRequest & { apiKey: { id: string; userId: string; name: string } }, context?: any) => Promise<NextResponse>
) {
  return withErrorHandler(async (req: NextRequest, context?: any) => {
    const apiKeyHeader = req.headers.get('x-api-key') || req.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!apiKeyHeader) {
      throw new AuthenticationError('API key required');
    }

    // Hash the API key for lookup (keys are stored hashed)
    const incomingHash = createHash('sha256').update(apiKeyHeader).digest('hex');
    const apiKey = await prisma.aPIKey.findFirst({
      where: {
        keyHash: incomingHash,
        revokedAt: null,
      },
      include: {
        user: {
          select: {
            id: true,
            status: true,
            deletedAt: true,
          },
        },
      },
    });

    if (!apiKey || !apiKey.user || apiKey.user.deletedAt || apiKey.user.status !== 'ACTIVE') {
      Logger.security('Invalid API key used', {
        severity: 'high',
        metadata: {
          ip: req.headers.get('x-forwarded-for') || 'unknown',
          userAgent: req.headers.get('user-agent') || 'unknown',
          url: req.url,
        },
      });
      
      throw new AuthenticationError('Invalid API key');
    }

    // Constant-time compare to guard against timing attacks
    const storedHash = Buffer.from(apiKey.keyHash, 'hex');
    const providedHash = Buffer.from(incomingHash, 'hex');
    if (storedHash.length !== providedHash.length || !timingSafeEqual(storedHash, providedHash)) {
      throw new AuthenticationError('Invalid API key');
    }

    Logger.audit('API key authenticated', {
      userId: apiKey.userId,
      resource: req.url,
      result: 'success',
      details: { apiKeyId: apiKey.id, apiKeyName: apiKey.name },
    });

    // Add API key info to request
    const authenticatedReq = req as any;
    authenticatedReq.apiKey = {
      id: apiKey.id,
      userId: apiKey.userId,
      name: apiKey.name,
    };

    return handler(authenticatedReq, context);
  });
}
