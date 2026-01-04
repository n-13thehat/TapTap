import { prisma } from '@/lib/prisma';
import { auth } from '@/auth.config';
import {
  UserDTO,
  PublicUserDTO,
  toUserDTO,
  toPublicUserDTO,
  createUnauthorizedError,
  createForbiddenError,
  createNotFoundError,
  createInternalError
} from '@/lib/dto';
import { getTapPassLevel, hasTapPassFeature } from '@/lib/middleware/tappass';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

export interface AuthContext {
  user: UserDTO;
  tapPassLevel: number;
  permissions: string[];
}

export interface SessionInfo {
  user: PublicUserDTO;
  tapPass?: {
    level: number;
    features: string[];
    expiresAt?: Date;
  };
  permissions: string[];
}

export class AuthService {
  /**
   * Get current authenticated user context
   */
  static async getCurrentUser(): Promise<AuthContext | null> {
    try {
      const session = await auth();
      if (!session?.user?.email) {
        return null;
      }

      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: {
          tapPasses: {
            where: {
              isActive: true,
              expiresAt: {
                gt: new Date()
              }
            },
            orderBy: {
              level: 'desc'
            },
            take: 1
          }
        }
      });

      if (!user || user.status !== 'ACTIVE' || user.deletedAt) {
        return null;
      }

      const tapPassLevel = await getTapPassLevel(user.id);
      const permissions = await this.getUserPermissions(user.id, user.role);

      return {
        user: toUserDTO(user),
        tapPassLevel,
        permissions
      };
    } catch (error) {
      console.error('AuthService.getCurrentUser error:', error);
      return null;
    }
  }

  /**
   * Get session info for client-side use
   */
  static async getSessionInfo(): Promise<SessionInfo | null> {
    try {
      const context = await this.getCurrentUser();
      if (!context) return null;

      const tapPass = await prisma.tapPass.findFirst({
        where: {
          userId: context.user.id,
          isActive: true,
          expiresAt: {
            gt: new Date()
          }
        },
        orderBy: {
          level: 'desc'
        }
      });

      return {
        user: toPublicUserDTO(context.user),
        tapPass: tapPass ? {
          level: tapPass.level,
          features: tapPass.features,
          expiresAt: tapPass.expiresAt || undefined
        } : undefined,
        permissions: context.permissions
      };
    } catch (error) {
      console.error('AuthService.getSessionInfo error:', error);
      return null;
    }
  }

  /**
   * Require authenticated user or throw error
   */
  static async requireAuth(): Promise<AuthContext> {
    const context = await this.getCurrentUser();
    if (!context) {
      throw createUnauthorizedError('Authentication required');
    }
    return context;
  }

  /**
   * Require specific role or throw error
   */
  static async requireRole(requiredRole: string): Promise<AuthContext> {
    const context = await this.requireAuth();
    if (context.user.role !== requiredRole && context.user.role !== 'ADMIN') {
      throw createForbiddenError(`${requiredRole} role required`);
    }
    return context;
  }

  /**
   * Require admin role or throw error
   */
  static async requireAdmin(): Promise<AuthContext> {
    return this.requireRole('ADMIN');
  }

  /**
   * Require creator role or throw error
   */
  static async requireCreator(): Promise<AuthContext> {
    const context = await this.requireAuth();
    if (context.user.role !== 'CREATOR' && context.user.role !== 'ADMIN') {
      throw createForbiddenError('Creator access required');
    }
    return context;
  }

  /**
   * Require specific permission or throw error
   */
  static async requirePermission(permission: string): Promise<AuthContext> {
    const context = await this.requireAuth();
    if (!context.permissions.includes(permission)) {
      throw createForbiddenError(`Permission '${permission}' required`);
    }
    return context;
  }

  /**
   * Require TapPass feature or throw error
   */
  static async requireTapPassFeature(feature: string): Promise<AuthContext> {
    const context = await this.requireAuth();
    const hasFeature = await hasTapPassFeature(context.user.id, feature);
    if (!hasFeature && context.user.role !== 'ADMIN') {
      throw createForbiddenError(`TapPass feature '${feature}' required`);
    }
    return context;
  }

  /**
   * Require minimum TapPass level or throw error
   */
  static async requireTapPassLevel(minLevel: number): Promise<AuthContext> {
    const context = await this.requireAuth();
    if (context.tapPassLevel < minLevel && context.user.role !== 'ADMIN') {
      throw createForbiddenError(`TapPass level ${minLevel} or higher required`);
    }
    return context;
  }

  /**
   * Check if user owns resource
   */
  static async requireOwnership(
    resourceUserId: string,
    errorMessage = 'You can only access your own resources'
  ): Promise<AuthContext> {
    const context = await this.requireAuth();
    if (context.user.id !== resourceUserId && context.user.role !== 'ADMIN') {
      throw createForbiddenError(errorMessage);
    }
    return context;
  }

  /**
   * Generate secure API key for user
   */
  static async generateApiKey(
    userId: string,
    name: string,
    scopes: string[] = []
  ): Promise<{ keyId: string; key: string }> {
    try {
      const key = randomBytes(32).toString('hex');
      const keyHash = await bcrypt.hash(key, 12);

      const apiKey = await prisma.aPIKey.create({
        data: {
          userId,
          name,
          keyHash,
          scopes
        }
      });

      return {
        keyId: apiKey.id,
        key: `tap_${apiKey.id}_${key}`
      };
    } catch (error) {
      console.error('AuthService.generateApiKey error:', error);
      throw createInternalError('Failed to generate API key');
    }
  }

  /**
   * Validate API key
   */
  static async validateApiKey(apiKey: string): Promise<{
    user: UserDTO;
    scopes: string[];
  } | null> {
    try {
      if (!apiKey.startsWith('tap_')) {
        return null;
      }

      const parts = apiKey.split('_');
      if (parts.length !== 3) {
        return null;
      }

      const [, keyId, key] = parts;

      const storedKey = await prisma.aPIKey.findUnique({
        where: {
          id: keyId,
          revokedAt: null
        },
        include: {
          user: true
        }
      });

      if (!storedKey || !storedKey.user) {
        return null;
      }

      const isValid = await bcrypt.compare(key, storedKey.keyHash);
      if (!isValid) {
        return null;
      }

      if (storedKey.user.status !== 'ACTIVE' || storedKey.user.deletedAt) {
        return null;
      }

      return {
        user: toUserDTO(storedKey.user),
        scopes: storedKey.scopes
      };
    } catch (error) {
      console.error('AuthService.validateApiKey error:', error);
      return null;
    }
  }

  /**
   * Revoke API key
   */
  static async revokeApiKey(keyId: string, userId: string): Promise<void> {
    try {
      await prisma.aPIKey.update({
        where: {
          id: keyId,
          userId
        },
        data: {
          revokedAt: new Date()
        }
      });
    } catch (error) {
      console.error('AuthService.revokeApiKey error:', error);
      throw createInternalError('Failed to revoke API key');
    }
  }

  /**
   * Get user permissions based on role and TapPass
   */
  private static async getUserPermissions(
    userId: string,
    role: string
  ): Promise<string[]> {
    const permissions: string[] = [];

    // Base permissions by role
    switch (role) {
      case 'ADMIN':
        permissions.push(
          'admin:*',
          'user:*',
          'track:*',
          'upload:*',
          'battle:*',
          'analytics:*'
        );
        break;
      case 'CREATOR':
        permissions.push(
          'user:read',
          'user:update:own',
          'track:create',
          'track:read',
          'track:update:own',
          'track:delete:own',
          'upload:create',
          'analytics:read:own'
        );
        break;
      case 'LISTENER':
      default:
        permissions.push(
          'user:read',
          'user:update:own',
          'track:read'
        );
        break;
    }

    // Additional permissions based on TapPass features
    try {
      const tapPass = await prisma.tapPass.findFirst({
        where: {
          userId,
          isActive: true,
          expiresAt: {
            gt: new Date()
          }
        }
      });

      if (tapPass?.features) {
        if (tapPass.features.includes('battles_create')) {
          permissions.push('battle:create');
        }
        if (tapPass.features.includes('analytics_advanced')) {
          permissions.push('analytics:advanced');
        }
        if (tapPass.features.includes('api_access')) {
          permissions.push('api:access');
        }
      }
    } catch (error) {
      console.warn('Failed to load TapPass permissions:', error);
    }

    return permissions;
  }
}
