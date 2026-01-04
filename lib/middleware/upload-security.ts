import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth.config';
import { prisma } from '@/lib/prisma';
import { withTapPass, TAPPASS_FEATURES, TAPPASS_LEVELS } from './tappass';
import { createForbiddenError, createUnauthorizedError, createValidationError } from '@/lib/dto';

export interface UploadSecurityConfig {
  maxFileSize: number; // in bytes
  allowedMimeTypes: string[];
  requireTapPass?: boolean;
  tapPassLevel?: number;
  tapPassFeatures?: string[];
  rateLimitPerHour?: number;
}

// Default upload configurations by type
export const UPLOAD_CONFIGS = {
  AUDIO: {
    maxFileSize: 100 * 1024 * 1024, // 100MB
    allowedMimeTypes: [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/flac',
      'audio/aac',
      'audio/ogg',
      'audio/webm'
    ],
    requireTapPass: false,
    rateLimitPerHour: 10
  },
  AUDIO_HD: {
    maxFileSize: 500 * 1024 * 1024, // 500MB
    allowedMimeTypes: [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/flac',
      'audio/aac',
      'audio/ogg',
      'audio/webm'
    ],
    requireTapPass: true,
    tapPassLevel: TAPPASS_LEVELS.PRO,
    tapPassFeatures: [TAPPASS_FEATURES.UPLOAD_HD],
    rateLimitPerHour: 50
  },
  IMAGE: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif'
    ],
    requireTapPass: false,
    rateLimitPerHour: 50
  },
  VIDEO: {
    maxFileSize: 1024 * 1024 * 1024, // 1GB
    allowedMimeTypes: [
      'video/mp4',
      'video/webm',
      'video/quicktime',
      'video/x-msvideo'
    ],
    requireTapPass: true,
    tapPassLevel: TAPPASS_LEVELS.PREMIUM,
    rateLimitPerHour: 5
  }
} as const;

/**
 * Secure upload middleware with TapPass enforcement and rate limiting
 */
export async function withUploadSecurity(
  request: NextRequest,
  config: UploadSecurityConfig
): Promise<{ user: any; uploadSession?: any } | NextResponse> {
  try {
    // Basic authentication check
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        createUnauthorizedError('Authentication required for uploads'),
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

    // Check if user has creator role
    if (user.role !== 'CREATOR' && user.role !== 'ADMIN') {
      return NextResponse.json(
        createForbiddenError('Creator access required for uploads'),
        { status: 403 }
      );
    }

    // TapPass enforcement if required
    if (config.requireTapPass) {
      const tapPassResult = await withTapPass(request, {
        required: true,
        minLevel: config.tapPassLevel,
        features: config.tapPassFeatures,
        bypassRoles: ['ADMIN']
      });

      if (tapPassResult instanceof NextResponse) {
        return tapPassResult;
      }
    }

    // Rate limiting check
    if (config.rateLimitPerHour) {
      const rateLimitResult = await checkUploadRateLimit(
        user.id,
        config.rateLimitPerHour
      );

      if (rateLimitResult instanceof NextResponse) {
        return rateLimitResult;
      }
    }

    return { user };
  } catch (error) {
    console.error('Upload security middleware error:', error);
    return NextResponse.json(
      createForbiddenError('Upload security validation failed'),
      { status: 500 }
    );
  }
}

/**
 * Validate file upload request
 */
export function validateUploadRequest(
  request: NextRequest,
  config: UploadSecurityConfig
): NextResponse | null {
  const contentLength = request.headers.get('content-length');
  const contentType = request.headers.get('content-type');

  // Check file size
  if (contentLength) {
    const fileSize = parseInt(contentLength, 10);
    if (fileSize > config.maxFileSize) {
      return NextResponse.json(
        createValidationError(
          'fileSize',
          `File size ${fileSize} bytes exceeds maximum allowed ${config.maxFileSize} bytes`
        ),
        { status: 413 }
      );
    }
  }

  // Check MIME type
  if (contentType && !config.allowedMimeTypes.includes(contentType)) {
    return NextResponse.json(
      createValidationError(
        'mimeType',
        `MIME type ${contentType} not allowed. Allowed types: ${config.allowedMimeTypes.join(', ')}`
      ),
      { status: 415 }
    );
  }

  return null;
}

/**
 * Check upload rate limit for user
 */
async function checkUploadRateLimit(
  userId: string,
  maxUploadsPerHour: number
): Promise<NextResponse | null> {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const recentUploads = await prisma.uploadSession.count({
      where: {
        userId,
        createdAt: {
          gte: oneHourAgo
        }
      }
    });

    if (recentUploads >= maxUploadsPerHour) {
      return NextResponse.json(
        createForbiddenError(
          `Upload rate limit exceeded. Maximum ${maxUploadsPerHour} uploads per hour allowed.`
        ),
        {
          status: 429,
          headers: {
            'Retry-After': '3600' // 1 hour
          }
        }
      );
    }

    return null;
  } catch (error) {
    console.error('Rate limit check error:', error);
    return NextResponse.json(
      createForbiddenError('Rate limit check failed'),
      { status: 500 }
    );
  }
}

/**
 * Validate file content (basic security checks)
 */
export async function validateFileContent(
  buffer: ArrayBuffer,
  expectedMimeType: string
): Promise<{ isValid: boolean; detectedType?: string; error?: string }> {
  try {
    const uint8Array = new Uint8Array(buffer);

    // Basic file signature validation
    const signatures = {
      'audio/mpeg': [0xFF, 0xFB], // MP3
      'audio/wav': [0x52, 0x49, 0x46, 0x46], // WAV (RIFF)
      'image/jpeg': [0xFF, 0xD8, 0xFF], // JPEG
      'image/png': [0x89, 0x50, 0x4E, 0x47], // PNG
      'image/webp': [0x52, 0x49, 0x46, 0x46], // WebP (RIFF)
    };

    const signature = signatures[expectedMimeType as keyof typeof signatures];
    if (signature) {
      const matches = signature.every((byte, index) =>
        uint8Array[index] === byte
      );

      if (!matches) {
        return {
          isValid: false,
          error: 'File signature does not match expected type'
        };
      }
    }

    // Check for suspicious patterns (basic malware detection)
    const suspiciousPatterns = [
      [0x4D, 0x5A], // PE executable
      [0x7F, 0x45, 0x4C, 0x46], // ELF executable
      [0xCA, 0xFE, 0xBA, 0xBE], // Mach-O executable
    ];

    for (const pattern of suspiciousPatterns) {
      const matches = pattern.every((byte, index) =>
        uint8Array[index] === byte
      );

      if (matches) {
        return {
          isValid: false,
          error: 'File contains suspicious executable patterns'
        };
      }
    }

    return { isValid: true };
  } catch (error) {
    console.error('File validation error:', error);
    return {
      isValid: false,
      error: 'File validation failed'
    };
  }
}

/**
 * Generate secure upload URL with expiration
 */
export async function generateSecureUploadUrl(
  userId: string,
  fileName: string,
  mimeType: string,
  expiresInMinutes = 60
): Promise<{ uploadUrl: string; uploadId: string }> {
  try {
    // Create upload session
    const uploadSession = await prisma.uploadSession.create({
      data: {
        userId,
        fileName,
        mimeType,
        sizeBytes: 0, // Will be updated when upload completes
        chunkSize: 0,
        totalChunks: 0,
        bucket: 'uploads',
        objectKey: `${userId}/${Date.now()}-${fileName}`,
        status: 'PENDING'
      }
    });

    // Generate signed URL (implementation depends on storage provider)
    const uploadUrl = `/api/uploads/session/${uploadSession.id}/upload`;

    return {
      uploadUrl,
      uploadId: uploadSession.id
    };
  } catch (error) {
    console.error('Generate upload URL error:', error);
    throw new Error('Failed to generate secure upload URL');
  }
}
