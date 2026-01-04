import { z } from 'zod';
import { Logger } from '@/lib/logger';

// Environment schema validation
const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Server configuration
  PORT: z.string().transform(Number).default('3000'),
  HOST: z.string().default('localhost'),
  
  // Database
  DATABASE_URL: z.string().url(),
  DATABASE_CONNECTION_LIMIT: z.string().transform(Number).default('10'),
  DATABASE_QUERY_TIMEOUT: z.string().transform(Number).default('10000'),
  DATABASE_CONNECT_TIMEOUT: z.string().transform(Number).default('5000'),
  DATABASE_MAX_RETRIES: z.string().transform(Number).default('3'),
  DATABASE_RETRY_DELAY: z.string().transform(Number).default('1000'),
  
  // Authentication
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url().optional(),
  
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  
  // Redis/Upstash
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  
  // External services
  OPENAI_API_KEY: z.string().optional(),
  SENTRY_DSN: z.string().url().optional(),
  
  // File storage
  STORAGE_PROVIDER: z.enum(['supabase', 'aws', 'local']).default('supabase'),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
  
  // Email
  EMAIL_PROVIDER: z.enum(['smtp', 'sendgrid', 'resend']).default('smtp'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SENDGRID_API_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  
  // Feature flags
  BETA_MODE: z.string().transform(val => val === 'true').default('false'),
  BETA_ACCESS_CODE: z.string().optional(),
  ENABLE_ANALYTICS: z.string().transform(val => val === 'true').default('true'),
  ENABLE_RATE_LIMITING: z.string().transform(val => val === 'true').default('true'),
  ENABLE_CACHING: z.string().transform(val => val === 'true').default('true'),
  
  // Security
  CSRF_SECRET: z.string().min(32).optional(),
  ENCRYPTION_KEY: z.string().min(32).optional(),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'debug']).default('info'),
  
  // Performance
  MAX_REQUEST_SIZE: z.string().transform(Number).default('10485760'), // 10MB
  REQUEST_TIMEOUT: z.string().transform(Number).default('30000'), // 30 seconds
  
  // Solana
  SOLANA_RPC_URL: z.string().url().optional(),
  SOLANA_PRIVATE_KEY: z.string().optional(),
});

// Validate and parse environment variables
function validateEnv() {
  try {
    const env = envSchema.parse(process.env);
    Logger.info('Environment configuration validated successfully');
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      Logger.error('Environment validation failed', error, { metadata: { missingVars } });
      throw new Error(`Invalid environment configuration:\n${missingVars.join('\n')}`);
    }
    throw error;
  }
}

// Export validated configuration
export const config = validateEnv();

// Configuration helpers
export const isDevelopment = config.NODE_ENV === 'development';
export const isProduction = config.NODE_ENV === 'production';
export const isTest = config.NODE_ENV === 'test';

// Database configuration
export const dbConfig = {
  url: config.DATABASE_URL,
  connectionLimit: config.DATABASE_CONNECTION_LIMIT,
  queryTimeout: config.DATABASE_QUERY_TIMEOUT,
  connectTimeout: config.DATABASE_CONNECT_TIMEOUT,
  maxRetries: config.DATABASE_MAX_RETRIES,
  retryDelay: config.DATABASE_RETRY_DELAY,
};

// Cache configuration
export const cacheConfig = {
  enabled: config.ENABLE_CACHING,
  redis: {
    url: config.UPSTASH_REDIS_REST_URL,
    token: config.UPSTASH_REDIS_REST_TOKEN,
  },
  defaultTTL: 300, // 5 minutes
  maxMemoryCacheSize: 1000,
};

// Rate limiting configuration
export const rateLimitConfig = {
  enabled: config.ENABLE_RATE_LIMITING,
  windowMs: 60000, // 1 minute
  max: 100, // requests per window
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
};

// Security configuration
export const securityConfig = {
  csrfSecret: config.CSRF_SECRET || config.NEXTAUTH_SECRET,
  encryptionKey: config.ENCRYPTION_KEY || config.NEXTAUTH_SECRET,
  maxRequestSize: config.MAX_REQUEST_SIZE,
  requestTimeout: config.REQUEST_TIMEOUT,
};

// Feature flags
export const features = {
  betaMode: config.BETA_MODE,
  betaAccessCode: config.BETA_ACCESS_CODE,
  analytics: config.ENABLE_ANALYTICS,
  rateLimiting: config.ENABLE_RATE_LIMITING,
  caching: config.ENABLE_CACHING,
};

// External service configurations
export const services = {
  supabase: {
    url: config.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: config.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRoleKey: config.SUPABASE_SERVICE_ROLE_KEY,
  },
  openai: {
    apiKey: config.OPENAI_API_KEY,
  },
  sentry: {
    dsn: config.SENTRY_DSN,
  },
  solana: {
    rpcUrl: config.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
    privateKey: config.SOLANA_PRIVATE_KEY,
  },
};

// Storage configuration
export const storageConfig = {
  provider: config.STORAGE_PROVIDER,
  aws: {
    accessKeyId: config.AWS_ACCESS_KEY_ID,
    secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
    region: config.AWS_REGION,
    bucket: config.AWS_S3_BUCKET,
  },
};

// Email configuration
export const emailConfig = {
  provider: config.EMAIL_PROVIDER,
  smtp: {
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    user: config.SMTP_USER,
    pass: config.SMTP_PASS,
  },
  sendgrid: {
    apiKey: config.SENDGRID_API_KEY,
  },
  resend: {
    apiKey: config.RESEND_API_KEY,
  },
};

// Configuration validation on startup
export function validateConfiguration() {
  const requiredConfigs = [];
  
  // Check database connection
  if (!config.DATABASE_URL) {
    requiredConfigs.push('DATABASE_URL is required');
  }
  
  // Check authentication
  if (!config.NEXTAUTH_SECRET) {
    requiredConfigs.push('NEXTAUTH_SECRET is required');
  }
  
  // Check Supabase configuration
  if (!config.NEXT_PUBLIC_SUPABASE_URL || !config.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    requiredConfigs.push('Supabase configuration is incomplete');
  }
  
  // Check Redis configuration if caching is enabled
  if (config.ENABLE_CACHING && (!config.UPSTASH_REDIS_REST_URL || !config.UPSTASH_REDIS_REST_TOKEN)) {
    Logger.warn('Caching is enabled but Redis configuration is missing, falling back to memory cache');
  }
  
  if (requiredConfigs.length > 0) {
    throw new Error(`Configuration validation failed:\n${requiredConfigs.join('\n')}`);
  }
  
  Logger.info('Configuration validation passed');
}
