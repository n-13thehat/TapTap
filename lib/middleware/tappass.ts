import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth.config';
import { prisma } from '@/lib/prisma';
import { createForbiddenError, createUnauthorizedError } from '@/lib/dto';

export interface TapPassConfig {
  required: boolean;
  minLevel?: number;
  features?: string[];
  bypassRoles?: string[];
}

/**
 * TapPass enforcement middleware
 * Checks if user has valid TapPass for accessing premium features
 */
export async function withTapPass(
  request: NextRequest,
  config: TapPassConfig
): Promise<{ user: any; tapPass: any } | NextResponse> {
  try {
    // Get authenticated user
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        createUnauthorizedError('Authentication required'),
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        deletedAt: true
      }
    });

    if (!user || user.status !== 'ACTIVE' || user.deletedAt) {
      return NextResponse.json(
        createUnauthorizedError('User account not active'),
        { status: 401 }
      );
    }

    // Check if user role bypasses TapPass requirement
    if (config.bypassRoles?.includes(user.role)) {
      return { user, tapPass: null };
    }

    // If TapPass not required, return early
    if (!config.required) {
      return { user, tapPass: null };
    }

    // Check for valid TapPass
    const tapPass = await prisma.tapPass.findFirst({
      where: {
        userId: user.id,
        isActive: true,
        expiresAt: {
          gt: new Date()
        }
      },
      orderBy: {
        level: 'desc' // Get highest level pass
      }
    });

    if (!tapPass) {
      return NextResponse.json(
        createForbiddenError('TapPass required for this feature'),
        { status: 403 }
      );
    }

    // Check minimum level requirement
    if (config.minLevel && tapPass.level < config.minLevel) {
      return NextResponse.json(
        createForbiddenError(`TapPass level ${config.minLevel} or higher required`),
        { status: 403 }
      );
    }

    // Check feature-specific access
    if (config.features && config.features.length > 0) {
      const hasAccess = config.features.some(feature =>
        tapPass.features?.includes(feature)
      );

      if (!hasAccess) {
        return NextResponse.json(
          createForbiddenError('TapPass does not include required features'),
          { status: 403 }
        );
      }
    }

    return { user, tapPass };
  } catch (error) {
    console.error('TapPass middleware error:', error);
    return NextResponse.json(
      createForbiddenError('TapPass validation failed'),
      { status: 500 }
    );
  }
}

/**
 * Check if user has specific TapPass feature
 */
export async function hasTapPassFeature(
  userId: string,
  feature: string
): Promise<boolean> {
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

    return tapPass?.features?.includes(feature) || false;
  } catch (error) {
    console.error('hasTapPassFeature error:', error);
    return false;
  }
}

/**
 * Get user's current TapPass level
 */
export async function getTapPassLevel(userId: string): Promise<number> {
  try {
    const tapPass = await prisma.tapPass.findFirst({
      where: {
        userId,
        isActive: true,
        expiresAt: {
          gt: new Date()
        }
      },
      orderBy: {
        level: 'desc'
      }
    });

    return tapPass?.level || 0;
  } catch (error) {
    console.error('getTapPassLevel error:', error);
    return 0;
  }
}

/**
 * TapPass feature definitions
 */
export const TAPPASS_FEATURES = {
  SURF_UNLIMITED: 'surf_unlimited',
  UPLOAD_HD: 'upload_hd',
  BATTLES_CREATE: 'battles_create',
  ANALYTICS_ADVANCED: 'analytics_advanced',
  PRIORITY_SUPPORT: 'priority_support',
  EARLY_ACCESS: 'early_access',
  CUSTOM_BRANDING: 'custom_branding',
  API_ACCESS: 'api_access'
} as const;

/**
 * TapPass level definitions
 */
export const TAPPASS_LEVELS = {
  FREE: 0,
  BASIC: 1,
  PRO: 2,
  PREMIUM: 3,
  ENTERPRISE: 4
} as const;
