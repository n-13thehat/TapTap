/**
 * Secure Environment Configuration
 * Secure handling of environment variables and secrets
 */

import { z } from 'zod';
import crypto from 'crypto';
import { getSecurityManager } from './SecurityManager';

export interface SecretConfig {
  name: string;
  required: boolean;
  sensitive: boolean;
  minLength?: number;
  pattern?: RegExp;
  description?: string;
  defaultValue?: string;
  environment?: 'development' | 'staging' | 'production' | 'all';
}

export interface EnvironmentConfig {
  secrets: SecretConfig[];
  validation: {
    strict: boolean;
    logMissingSecrets: boolean;
    failOnMissingRequired: boolean;
  };
  encryption: {
    encryptSensitive: boolean;
    rotationInterval: number; // days
  };
}

// Define all secrets configuration
const SECRETS_CONFIG: SecretConfig[] = [
  // Core application
  {
    name: 'NEXTAUTH_SECRET',
    required: true,
    sensitive: true,
    minLength: 32,
    description: 'NextAuth.js secret for JWT signing',
  },
  {
    name: 'NEXTAUTH_URL',
    required: false,
    sensitive: false,
    pattern: /^https?:\/\/.+/,
    description: 'NextAuth.js URL for callbacks',
  },
  
  // Database
  {
    name: 'DATABASE_URL',
    required: true,
    sensitive: true,
    pattern: /^postgresql:\/\/.+/,
    description: 'PostgreSQL database connection string',
  },
  {
    name: 'DIRECT_URL',
    required: false,
    sensitive: true,
    pattern: /^postgresql:\/\/.+/,
    description: 'Direct database connection for migrations',
  },
  
  // Supabase
  {
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    required: true,
    sensitive: false,
    pattern: /^https:\/\/.+\.supabase\.co$/,
    description: 'Supabase project URL',
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    required: true,
    sensitive: false,
    minLength: 100,
    description: 'Supabase anonymous key',
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    required: false,
    sensitive: true,
    minLength: 100,
    description: 'Supabase service role key for admin operations',
  },
  
  // OAuth providers
  {
    name: 'GOOGLE_CLIENT_ID',
    required: false,
    sensitive: false,
    pattern: /^.+\.apps\.googleusercontent\.com$/,
    description: 'Google OAuth client ID',
  },
  {
    name: 'GOOGLE_CLIENT_SECRET',
    required: false,
    sensitive: true,
    minLength: 20,
    description: 'Google OAuth client secret',
  },
  {
    name: 'APPLE_ID',
    required: false,
    sensitive: false,
    description: 'Apple Sign In service ID',
  },
  {
    name: 'APPLE_SECRET',
    required: false,
    sensitive: true,
    description: 'Apple Sign In client secret (JWT)',
  },
  {
    name: 'APPLE_PRIVATE_KEY',
    required: false,
    sensitive: true,
    description: 'Apple Sign In private key',
  },
  {
    name: 'APPLE_KEY_ID',
    required: false,
    sensitive: false,
    description: 'Apple Sign In key ID',
  },
  {
    name: 'APPLE_TEAM_ID',
    required: false,
    sensitive: false,
    description: 'Apple Developer Team ID',
  },
  
  // External APIs
  {
    name: 'OPENAI_API_KEY',
    required: false,
    sensitive: true,
    pattern: /^sk-[a-zA-Z0-9]+$/,
    description: 'OpenAI API key',
  },
  {
    name: 'YOUTUBE_API_KEY',
    required: false,
    sensitive: true,
    pattern: /^AIza[a-zA-Z0-9_-]+$/,
    description: 'YouTube Data API key',
  },
  
  // Blockchain
  {
    name: 'SOLANA_RPC_URL',
    required: false,
    sensitive: false,
    pattern: /^https:\/\/.+/,
    description: 'Solana RPC endpoint',
  },
  {
    name: 'SOLANA_PRIVATE_KEY',
    required: false,
    sensitive: true,
    description: 'Solana wallet private key',
  },
  {
    name: 'SOLANA_WALLET_ENC_KEY',
    required: false,
    sensitive: true,
    minLength: 32,
    description: 'Encryption key for Solana wallet storage',
  },
  
  // Redis/Caching
  {
    name: 'UPSTASH_REDIS_REST_URL',
    required: false,
    sensitive: false,
    pattern: /^https:\/\/.+\.upstash\.io$/,
    description: 'Upstash Redis REST URL',
  },
  {
    name: 'UPSTASH_REDIS_REST_TOKEN',
    required: false,
    sensitive: true,
    description: 'Upstash Redis REST token',
  },
  
  // Monitoring
  {
    name: 'SENTRY_DSN',
    required: false,
    sensitive: false,
    pattern: /^https:\/\/.+@.+\.ingest\.sentry\.io\/.+$/,
    description: 'Sentry DSN for error tracking',
  },
  
  // Security
  {
    name: 'MASTER_ENCRYPTION_KEY',
    required: false,
    sensitive: true,
    minLength: 44, // Base64 encoded 32 bytes
    description: 'Master encryption key for sensitive data',
  },
  {
    name: 'CSRF_SECRET',
    required: false,
    sensitive: true,
    minLength: 32,
    description: 'CSRF protection secret',
  },
  
  // Application specific
  {
    name: 'BETA_ACCESS_CODE',
    required: false,
    sensitive: true,
    description: 'Beta access code for invite-only features',
  },
  {
    name: 'TREASURE_KEY',
    required: false,
    sensitive: true,
    description: 'Treasury access key',
  },
  {
    name: 'TREASURY_PRIVATE_KEY',
    required: false,
    sensitive: true,
    description: 'Treasury private key',
  },
  
  // Admin
  {
    name: 'TAPTAP_ADMIN_EMAIL',
    required: false,
    sensitive: false,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    description: 'Admin email address',
  },
  {
    name: 'TAPTAP_APP_PASSWORD',
    required: false,
    sensitive: true,
    description: 'Admin app password',
  },
  {
    name: 'NEXT_PUBLIC_ADMIN_PASSCODE',
    required: false,
    sensitive: true,
    description: 'Admin passcode for debug features',
  },
];

export class SecureEnv {
  private config: EnvironmentConfig;
  private secrets: Map<string, string> = new Map();
  private encryptedSecrets: Map<string, any> = new Map();
  private validationErrors: string[] = [];
  private securityManager = getSecurityManager();

  constructor(config: Partial<EnvironmentConfig> = {}) {
    this.config = {
      secrets: SECRETS_CONFIG,
      validation: {
        strict: process.env.NODE_ENV === 'production',
        logMissingSecrets: process.env.NODE_ENV !== 'production',
        failOnMissingRequired: process.env.NODE_ENV === 'production',
      },
      encryption: {
        encryptSensitive: true,
        rotationInterval: 90,
      },
      ...config,
    };

    this.loadSecrets();
    this.validateSecrets();
    this.encryptSensitiveSecrets();
  }

  private loadSecrets(): void {
    for (const secretConfig of this.config.secrets) {
      const value = process.env[secretConfig.name];
      
      if (value) {
        this.secrets.set(secretConfig.name, value);
      } else if (secretConfig.defaultValue) {
        this.secrets.set(secretConfig.name, secretConfig.defaultValue);
      }
    }
  }

  private validateSecrets(): void {
    this.validationErrors = [];

    for (const secretConfig of this.config.secrets) {
      const value = this.secrets.get(secretConfig.name);
      
      // Check required secrets
      if (secretConfig.required && !value) {
        const error = `Required secret ${secretConfig.name} is missing`;
        this.validationErrors.push(error);
        
        if (this.config.validation.logMissingSecrets) {
          console.error(`❌ ${error}`);
        }
        continue;
      }

      if (!value) continue;

      // Validate minimum length
      if (secretConfig.minLength && value.length < secretConfig.minLength) {
        const error = `Secret ${secretConfig.name} is too short (minimum ${secretConfig.minLength} characters)`;
        this.validationErrors.push(error);
        console.error(`❌ ${error}`);
      }

      // Validate pattern
      if (secretConfig.pattern && !secretConfig.pattern.test(value)) {
        const error = `Secret ${secretConfig.name} does not match required pattern`;
        this.validationErrors.push(error);
        console.error(`❌ ${error}`);
      }

      // Check for common weak values
      if (this.isWeakSecret(value)) {
        const error = `Secret ${secretConfig.name} appears to be weak or default`;
        this.validationErrors.push(error);
        console.warn(`⚠️ ${error}`);
      }

      // Log security audit for sensitive secrets
      if (secretConfig.sensitive) {
        this.securityManager.logSecurityEvent('secret_access', 'low', {
          secretName: secretConfig.name,
          action: 'loaded',
        });
      }
    }

    // Fail if required secrets are missing in production
    if (this.config.validation.failOnMissingRequired && this.validationErrors.length > 0) {
      const requiredErrors = this.validationErrors.filter(error => error.includes('Required'));
      if (requiredErrors.length > 0) {
        throw new Error(`Missing required secrets: ${requiredErrors.join(', ')}`);
      }
    }
  }

  private isWeakSecret(value: string): boolean {
    const weakPatterns = [
      /^(password|secret|key|token)$/i,
      /^(123|test|demo|example)/i,
      /^(supersecret|changeme|default)/i,
      /^.{1,8}$/, // Too short
    ];

    return weakPatterns.some(pattern => pattern.test(value));
  }

  private encryptSensitiveSecrets(): void {
    if (!this.config.encryption.encryptSensitive) return;

    for (const secretConfig of this.config.secrets) {
      if (secretConfig.sensitive) {
        const value = this.secrets.get(secretConfig.name);
        if (value) {
          try {
            const encrypted = this.securityManager.encrypt(value, secretConfig.name);
            this.encryptedSecrets.set(secretConfig.name, encrypted);
            
            // Remove plain text from memory
            this.secrets.delete(secretConfig.name);
          } catch (error) {
            console.error(`Failed to encrypt secret ${secretConfig.name}:`, error);
          }
        }
      }
    }
  }

  public getSecret(name: string, fallback?: string): string {
    // Check if secret is encrypted
    if (this.encryptedSecrets.has(name)) {
      try {
        const encrypted = this.encryptedSecrets.get(name);
        return this.securityManager.decrypt(encrypted, name);
      } catch (error) {
        console.error(`Failed to decrypt secret ${name}:`, error);
        return fallback || '';
      }
    }

    // Return plain text secret
    const value = this.secrets.get(name);
    if (value !== undefined) {
      return value;
    }

    // Return fallback or empty string
    return fallback || '';
  }

  public hasSecret(name: string): boolean {
    return this.secrets.has(name) || this.encryptedSecrets.has(name);
  }

  public getSecretConfig(name: string): SecretConfig | undefined {
    return this.config.secrets.find(config => config.name === name);
  }

  public validateSecret(name: string, value: string): { valid: boolean; errors: string[] } {
    const config = this.getSecretConfig(name);
    if (!config) {
      return { valid: false, errors: ['Unknown secret'] };
    }

    const errors: string[] = [];

    if (config.minLength && value.length < config.minLength) {
      errors.push(`Minimum length is ${config.minLength} characters`);
    }

    if (config.pattern && !config.pattern.test(value)) {
      errors.push('Does not match required pattern');
    }

    if (this.isWeakSecret(value)) {
      errors.push('Secret appears to be weak or default');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  public rotateSecret(name: string): string {
    const config = this.getSecretConfig(name);
    if (!config) {
      throw new Error(`Unknown secret: ${name}`);
    }

    // Generate new secret
    const newSecret = this.securityManager.generateSecret(config.minLength || 32);
    
    // Validate new secret
    const validation = this.validateSecret(name, newSecret);
    if (!validation.valid) {
      throw new Error(`Generated secret is invalid: ${validation.errors.join(', ')}`);
    }

    // Update secret
    if (config.sensitive && this.config.encryption.encryptSensitive) {
      const encrypted = this.securityManager.encrypt(newSecret, name);
      this.encryptedSecrets.set(name, encrypted);
    } else {
      this.secrets.set(name, newSecret);
    }

    this.securityManager.logSecurityEvent('secret_rotation', 'medium', {
      secretName: name,
      rotatedAt: Date.now(),
    });

    return newSecret;
  }

  public exportSecrets(includeValues: boolean = false): any {
    const exported: any = {};

    for (const config of this.config.secrets) {
      exported[config.name] = {
        required: config.required,
        sensitive: config.sensitive,
        description: config.description,
        hasValue: this.hasSecret(config.name),
      };

      if (includeValues && !config.sensitive) {
        exported[config.name].value = this.getSecret(config.name);
      }
    }

    return exported;
  }

  public getValidationErrors(): string[] {
    return [...this.validationErrors];
  }

  public getSecurityReport(): any {
    const report = {
      totalSecrets: this.config.secrets.length,
      loadedSecrets: this.secrets.size + this.encryptedSecrets.size,
      encryptedSecrets: this.encryptedSecrets.size,
      validationErrors: this.validationErrors.length,
      weakSecrets: 0,
      missingRequired: 0,
      secretsByType: {
        required: 0,
        optional: 0,
        sensitive: 0,
        public: 0,
      },
    };

    for (const config of this.config.secrets) {
      if (config.required) {
        report.secretsByType.required++;
        if (!this.hasSecret(config.name)) {
          report.missingRequired++;
        }
      } else {
        report.secretsByType.optional++;
      }

      if (config.sensitive) {
        report.secretsByType.sensitive++;
      } else {
        report.secretsByType.public++;
      }

      const value = this.getSecret(config.name);
      if (value && this.isWeakSecret(value)) {
        report.weakSecrets++;
      }
    }

    return report;
  }

  // Apple-specific secret handling
  public getAppleSignInConfig(): any {
    const config = {
      clientId: this.getSecret('APPLE_ID'),
      teamId: this.getSecret('APPLE_TEAM_ID'),
      keyId: this.getSecret('APPLE_KEY_ID'),
      privateKey: this.getSecret('APPLE_PRIVATE_KEY'),
    };

    // Validate Apple configuration
    if (config.clientId && (!config.teamId || !config.keyId || !config.privateKey)) {
      console.warn('⚠️ Incomplete Apple Sign In configuration');
    }

    return config;
  }

  public generateAppleClientSecret(): string {
    const config = this.getAppleSignInConfig();
    
    if (!config.privateKey || !config.keyId || !config.teamId || !config.clientId) {
      throw new Error('Missing Apple Sign In configuration');
    }

    try {
      // Generate JWT for Apple client secret
      const jwt = require('jsonwebtoken');
      
      const payload = {
        iss: config.teamId,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (6 * 30 * 24 * 60 * 60), // 6 months
        aud: 'https://appleid.apple.com',
        sub: config.clientId,
      };

      const token = jwt.sign(payload, config.privateKey, {
        algorithm: 'ES256',
        header: {
          kid: config.keyId,
        },
      });

      this.securityManager.logSecurityEvent('secret_access', 'medium', {
        action: 'apple_client_secret_generated',
      });

      return token;
    } catch (error) {
      this.securityManager.logSecurityEvent('secret_access', 'high', {
        action: 'apple_client_secret_failed',
        error: (error as Error).message,
      });
      throw new Error('Failed to generate Apple client secret');
    }
  }

  public destroy(): void {
    // Clear all secrets from memory
    this.secrets.clear();
    this.encryptedSecrets.clear();
    this.validationErrors = [];
  }
}

// Singleton instance
let secureEnv: SecureEnv | null = null;

export function getSecureEnv(): SecureEnv {
  if (!secureEnv) {
    secureEnv = new SecureEnv();
  }
  return secureEnv;
}

export function initializeSecureEnv(config?: Partial<EnvironmentConfig>): SecureEnv {
  secureEnv = new SecureEnv(config);
  return secureEnv;
}

// Helper functions for backward compatibility
export function getSecret(name: string, fallback?: string): string {
  return getSecureEnv().getSecret(name, fallback);
}

export function hasSecret(name: string): boolean {
  return getSecureEnv().hasSecret(name);
}

export function hasGoogleOAuth(): boolean {
  const env = getSecureEnv();
  return env.hasSecret('GOOGLE_CLIENT_ID') && env.hasSecret('GOOGLE_CLIENT_SECRET');
}

export function hasAppleOAuth(): boolean {
  const env = getSecureEnv();
  return env.hasSecret('APPLE_ID') && env.hasSecret('APPLE_TEAM_ID') && 
         env.hasSecret('APPLE_KEY_ID') && env.hasSecret('APPLE_PRIVATE_KEY');
}
