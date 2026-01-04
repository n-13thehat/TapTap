import { z } from 'zod';

// Environment variable schema with validation
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url('Invalid DATABASE_URL'),
  DIRECT_URL: z.string().url('Invalid DIRECT_URL').optional(),
  
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'Supabase service role key required'),
  
  // NextAuth
  NEXTAUTH_URL: z.string().url('Invalid NEXTAUTH_URL'),
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
  
  // External APIs
  OPENAI_API_KEY: z.string().optional(),
  YOUTUBE_API_KEY: z.string().optional(),
  GENIUS_ACCESS_TOKEN: z.string().optional(),
  
  // Application secrets
  TREASURE_KEY: z.string().optional(),
  TREASURY_PRIVATE_KEY: z.string().optional(),
  TAPTAP_ADMIN_EMAIL: z.string().email('Invalid admin email').optional(),
  TAPTAP_APP_PASSWORD: z.string().optional(),
  NEXT_PUBLIC_ADMIN_PASSCODE: z.string().optional(),
  
  // OAuth providers (optional)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  APPLE_ID: z.string().optional(),
  APPLE_SECRET: z.string().optional(),
  
  // Monitoring
  SENTRY_DSN: z.string().url('Invalid Sentry DSN').or(z.literal('')).optional(),
  SENTRY_RELEASE: z.string().optional(),
  SENTRY_ENV: z.string().optional(),
  
  // Feature flags
  BETA_MODE: z.string().transform(val => val === 'true').optional(),
  BETA_ACCESS_CODE: z.string().optional(),
  
  // System
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

// Validate environment variables
function validateEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      throw new Error(`Environment validation failed:\n${missingVars.join('\n')}`);
    }
    throw error;
  }
}

// Export validated environment variables
export const env = validateEnv();

// Helper functions for secure access
export const isProduction = () => env.NODE_ENV === 'production';
export const isDevelopment = () => env.NODE_ENV === 'development';
export const isTest = () => env.NODE_ENV === 'test';

// Secure secret access with fallbacks
export const getSecret = (key, fallback) => {
  const value = env[key];
  if (!value && !fallback && isProduction()) {
    throw new Error(`Required secret ${key} is missing in production`);
  }
  return value || fallback || '';
};

// OAuth provider availability checks
export const hasGoogleOAuth = () => !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
export const hasAppleOAuth = () => !!(env.APPLE_ID && env.APPLE_SECRET);
export const hasSentry = () => !!env.SENTRY_DSN;
