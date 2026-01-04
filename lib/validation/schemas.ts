import { z } from 'zod';

// Common validation patterns
const uuidSchema = z.string().uuid();
const emailSchema = z.string().email().max(255);
const usernameSchema = z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/);
const passwordSchema = z.string().min(8).max(128);
const urlSchema = z.string().url().max(2048);

// User schemas
export const userCreateSchema = z.object({
  email: emailSchema,
  username: usernameSchema,
  password: passwordSchema,
  displayName: z.string().min(1).max(100).optional(),
  inviteCode: z.string().optional(),
  walletAddress: z.string().optional(),
});

export const userUpdateSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: urlSchema.optional(),
  headerUrl: urlSchema.optional(),
  location: z.string().max(100).optional(),
  links: z.record(z.string(), urlSchema).optional(),
});

export const userLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});

// Track schemas
export const trackCreateSchema = z.object({
  title: z.string().min(1).max(200),
  audioUrl: urlSchema.optional(),
  albumId: uuidSchema.optional(),
  durationMs: z.number().int().positive().optional(),
  lyrics: z.string().max(10000).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  isExplicit: z.boolean().default(false),
});

export const trackUpdateSchema = trackCreateSchema.partial();

// Album schemas
export const albumCreateSchema = z.object({
  title: z.string().min(1).max(200),
  coverUrl: urlSchema.optional(),
  releaseAt: z.string().datetime().optional(),
});

export const albumUpdateSchema = albumCreateSchema.partial();

// Playlist schemas
export const playlistCreateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  coverUrl: urlSchema.optional(),
  isPublic: z.boolean().default(false),
});

export const playlistUpdateSchema = playlistCreateSchema.partial();

export const playlistAddTrackSchema = z.object({
  trackId: uuidSchema,
  position: z.number().int().nonnegative().optional(),
});

// Post schemas
export const postCreateSchema = z.object({
  content: z.string().min(1).max(2000),
  mediaUrls: z.array(urlSchema).max(4).optional(),
  trackId: uuidSchema.optional(),
  albumId: uuidSchema.optional(),
});

export const postUpdateSchema = z.object({
  content: z.string().min(1).max(2000),
});

// Comment schemas
export const commentCreateSchema = z.object({
  content: z.string().min(1).max(1000),
  postId: uuidSchema.optional(),
  trackId: uuidSchema.optional(),
  parentId: uuidSchema.optional(),
});

// Search schemas
export const searchSchema = z.object({
  q: z.string().min(1).max(100),
  type: z.enum(['tracks', 'albums', 'artists', 'playlists', 'users']).optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().nonnegative().default(0),
});

// Pagination schema
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Battle schemas
export const battleCreateSchema = z.object({
  opponentId: uuidSchema,
  trackAId: uuidSchema,
  trackBId: uuidSchema,
  duration: z.number().int().min(60).max(3600).default(300), // 5 minutes default
  wagerAmount: z.number().nonnegative().optional(),
});

export const battleVoteSchema = z.object({
  battleId: uuidSchema,
  choice: z.enum(['A', 'B']),
});

// Wallet schemas
export const walletCreateSchema = z.object({
  address: z.string().min(32).max(64),
  type: z.enum(['SOLANA', 'ETHEREUM', 'BITCOIN']).default('SOLANA'),
  isDefault: z.boolean().default(false),
});

export const transactionCreateSchema = z.object({
  type: z.enum(['DEPOSIT', 'WITHDRAWAL', 'PURCHASE', 'SALE', 'REWARD', 'PENALTY']),
  amount: z.number().positive(),
  currency: z.string().max(10).default('TAPCOIN'),
  description: z.string().max(500).optional(),
  metadata: z.record(z.any()).optional(),
});

// Admin schemas
export const adminUserUpdateSchema = z.object({
  role: z.enum(['LISTENER', 'CREATOR', 'ADMIN', 'MODERATOR']).optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'DELETED', 'PENDING']).optional(),
  verified: z.enum(['UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED']).optional(),
});

// File upload schemas
export const fileUploadSchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9!#$&\-\^_]*\/[a-zA-Z0-9][a-zA-Z0-9!#$&\-\^_.]*$/),
  size: z.number().int().positive().max(100 * 1024 * 1024), // 100MB max
});

// Rate limiting schemas
export const rateLimitSchema = z.object({
  identifier: z.string().min(1).max(100),
  limit: z.number().int().positive(),
  windowMs: z.number().int().positive(),
});

// Validation helper functions
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation failed: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
    }
    throw error;
  }
}

export function validatePartial<T extends z.AnyZodObject>(schema: T, data: unknown): Partial<z.infer<T>> {
  try {
    return schema.partial().parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation failed: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
    }
    throw error;
  }
}

// Sanitization helpers
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+=/gi, ''); // Remove event handlers
}

export function sanitizeObject(obj: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? sanitizeString(item) : 
        typeof item === 'object' && item !== null ? sanitizeObject(item) : 
        item
      );
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}
