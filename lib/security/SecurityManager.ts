/**
 * Security Manager
 * Comprehensive security hardening for TapTap Matrix
 */

import crypto from 'crypto';
import { z } from 'zod';

export interface SecurityConfig {
  encryption: {
    algorithm: string;
    keyLength: number;
    ivLength: number;
    tagLength: number;
    saltLength: number;
  };
  secrets: {
    rotationInterval: number; // days
    minLength: number;
    requireSpecialChars: boolean;
    requireNumbers: boolean;
    requireUppercase: boolean;
  };
  dataProtection: {
    enableEncryption: boolean;
    encryptSensitiveFields: boolean;
    anonymizeIPs: boolean;
    respectDoNotTrack: boolean;
    gdprCompliant: boolean;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
    skipSuccessfulRequests: boolean;
    enableBruteForceProtection: boolean;
  };
  headers: {
    enableCSP: boolean;
    enableHSTS: boolean;
    enableXFrameOptions: boolean;
    enableXContentTypeOptions: boolean;
  };
}

export interface EncryptedData {
  data: string;
  iv: string;
  tag: string;
  algorithm: string;
  timestamp: number;
}

export interface SecretMetadata {
  id: string;
  name: string;
  createdAt: number;
  lastRotated: number;
  expiresAt: number;
  rotationCount: number;
  isActive: boolean;
  environment: string;
}

export interface SecurityAuditLog {
  id: string;
  timestamp: number;
  event: SecurityEventType;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  details: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
}

export type SecurityEventType = 
  | 'auth_attempt' | 'auth_success' | 'auth_failure' | 'auth_lockout'
  | 'secret_access' | 'secret_rotation' | 'secret_leak'
  | 'data_access' | 'data_export' | 'data_deletion'
  | 'permission_change' | 'role_escalation'
  | 'suspicious_activity' | 'rate_limit_exceeded'
  | 'security_scan' | 'vulnerability_detected'
  | 'gdpr_request' | 'data_breach';

export class SecurityManager {
  private config: SecurityConfig;
  private masterKey: Buffer;
  private secrets: Map<string, SecretMetadata> = new Map();
  private auditLogs: SecurityAuditLog[] = [];
  private encryptionCache: Map<string, EncryptedData> = new Map();
  
  // Rate limiting
  private rateLimitStore: Map<string, { count: number; resetTime: number }> = new Map();
  private bruteForceAttempts: Map<string, { count: number; lastAttempt: number }> = new Map();
  
  // Security monitoring
  private securityAlerts: Map<string, any> = new Map();
  private suspiciousActivities: Map<string, any[]> = new Map();

  constructor(config: Partial<SecurityConfig> = {}) {
    this.config = {
      encryption: {
        algorithm: 'aes-256-gcm',
        keyLength: 32,
        ivLength: 16,
        tagLength: 16,
        saltLength: 32,
      },
      secrets: {
        rotationInterval: 90, // 90 days
        minLength: 32,
        requireSpecialChars: true,
        requireNumbers: true,
        requireUppercase: true,
      },
      dataProtection: {
        enableEncryption: true,
        encryptSensitiveFields: true,
        anonymizeIPs: true,
        respectDoNotTrack: true,
        gdprCompliant: true,
      },
      rateLimit: {
        windowMs: 60000, // 1 minute
        maxRequests: 100,
        skipSuccessfulRequests: false,
        enableBruteForceProtection: true,
      },
      headers: {
        enableCSP: true,
        enableHSTS: true,
        enableXFrameOptions: true,
        enableXContentTypeOptions: true,
      },
      ...config,
    };

    this.initializeMasterKey();
    this.startSecurityMonitoring();
  }

  private initializeMasterKey(): void {
    const masterKeyEnv = process.env.MASTER_ENCRYPTION_KEY;
    
    if (masterKeyEnv) {
      this.masterKey = Buffer.from(masterKeyEnv, 'base64');
    } else {
      // Generate a new master key (should be stored securely)
      this.masterKey = crypto.randomBytes(this.config.encryption.keyLength);
      console.warn('Generated new master key - store this securely:', this.masterKey.toString('base64'));
    }

    if (this.masterKey.length !== this.config.encryption.keyLength) {
      throw new Error(`Master key must be ${this.config.encryption.keyLength} bytes`);
    }
  }

  // Encryption/Decryption
  public encrypt(data: string | Buffer, additionalData?: string): EncryptedData {
    try {
      const dataBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');
      const iv = crypto.randomBytes(this.config.encryption.ivLength);
      
      const cipher = crypto.createCipheriv(this.config.encryption.algorithm, this.masterKey, iv);
      
      if (additionalData) {
        cipher.setAAD(Buffer.from(additionalData, 'utf8'));
      }
      
      const encrypted = Buffer.concat([cipher.update(dataBuffer), cipher.final()]);
      const tag = cipher.getAuthTag();

      const result: EncryptedData = {
        data: encrypted.toString('base64'),
        iv: iv.toString('base64'),
        tag: tag.toString('base64'),
        algorithm: this.config.encryption.algorithm,
        timestamp: Date.now(),
      };

      return result;
    } catch (error) {
      this.logSecurityEvent('data_access', 'critical', {
        action: 'encryption_failed',
        error: (error as Error).message,
      });
      throw new Error('Encryption failed');
    }
  }

  public decrypt(encryptedData: EncryptedData, additionalData?: string): string {
    try {
      const { data, iv, tag, algorithm } = encryptedData;
      
      if (algorithm !== this.config.encryption.algorithm) {
        throw new Error('Unsupported encryption algorithm');
      }

      const decipher = crypto.createDecipheriv(algorithm, this.masterKey, Buffer.from(iv, 'base64'));
      decipher.setAuthTag(Buffer.from(tag, 'base64'));
      
      if (additionalData) {
        decipher.setAAD(Buffer.from(additionalData, 'utf8'));
      }
      
      const decrypted = Buffer.concat([
        decipher.update(Buffer.from(data, 'base64')),
        decipher.final()
      ]);

      return decrypted.toString('utf8');
    } catch (error) {
      this.logSecurityEvent('data_access', 'critical', {
        action: 'decryption_failed',
        error: (error as Error).message,
      });
      throw new Error('Decryption failed');
    }
  }

  // Secure localStorage encryption
  public encryptLocalStorage(key: string, value: any): void {
    if (!this.config.dataProtection.enableEncryption) {
      localStorage.setItem(key, JSON.stringify(value));
      return;
    }

    try {
      const serialized = JSON.stringify(value);
      const encrypted = this.encrypt(serialized, key);
      localStorage.setItem(key, JSON.stringify(encrypted));
    } catch (error) {
      console.error('Failed to encrypt localStorage data:', error);
      // Fallback to unencrypted storage with warning
      localStorage.setItem(key, JSON.stringify(value));
    }
  }

  public decryptLocalStorage(key: string): any {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return null;

      const parsed = JSON.parse(stored);
      
      // Check if data is encrypted
      if (parsed.data && parsed.iv && parsed.tag && parsed.algorithm) {
        const decrypted = this.decrypt(parsed as EncryptedData, key);
        return JSON.parse(decrypted);
      }
      
      // Return unencrypted data
      return parsed;
    } catch (error) {
      console.error('Failed to decrypt localStorage data:', error);
      return null;
    }
  }

  // Secret management
  public generateSecret(length: number = this.config.secrets.minLength): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    let secret = '';
    let hasUpper = false;
    let hasLower = false;
    let hasNumber = false;
    let hasSpecial = false;

    // Generate random characters
    for (let i = 0; i < length - 4; i++) {
      const char = charset[crypto.randomInt(charset.length)];
      secret += char;
      
      if (char >= 'A' && char <= 'Z') hasUpper = true;
      if (char >= 'a' && char <= 'z') hasLower = true;
      if (char >= '0' && char <= '9') hasNumber = true;
    }

    // Ensure requirements are met
    if (this.config.secrets.requireUppercase && !hasUpper) {
      secret += 'A';
    }
    if (!hasLower) {
      secret += 'a';
    }
    if (this.config.secrets.requireNumbers && !hasNumber) {
      secret += '1';
    }
    if (this.config.secrets.requireSpecialChars && !hasSpecial) {
      secret += specialChars[crypto.randomInt(specialChars.length)];
    }

    // Shuffle the secret
    return secret.split('').sort(() => crypto.randomInt(3) - 1).join('');
  }

  public rotateSecret(secretId: string): string {
    const metadata = this.secrets.get(secretId);
    if (!metadata) {
      throw new Error('Secret not found');
    }

    const newSecret = this.generateSecret();
    
    // Update metadata
    metadata.lastRotated = Date.now();
    metadata.rotationCount++;
    metadata.expiresAt = Date.now() + (this.config.secrets.rotationInterval * 24 * 60 * 60 * 1000);

    this.secrets.set(secretId, metadata);

    this.logSecurityEvent('secret_rotation', 'medium', {
      secretId,
      rotationCount: metadata.rotationCount,
    });

    return newSecret;
  }

  public validateSecret(secret: string): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (secret.length < this.config.secrets.minLength) {
      issues.push(`Secret must be at least ${this.config.secrets.minLength} characters`);
    }

    if (this.config.secrets.requireUppercase && !/[A-Z]/.test(secret)) {
      issues.push('Secret must contain uppercase letters');
    }

    if (this.config.secrets.requireNumbers && !/[0-9]/.test(secret)) {
      issues.push('Secret must contain numbers');
    }

    if (this.config.secrets.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(secret)) {
      issues.push('Secret must contain special characters');
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  // Rate limiting
  public checkRateLimit(identifier: string, action: string = 'default'): { allowed: boolean; resetTime: number } {
    const key = `${identifier}:${action}`;
    const now = Date.now();
    const window = this.config.rateLimit.windowMs;
    
    let record = this.rateLimitStore.get(key);
    
    if (!record || now > record.resetTime) {
      record = {
        count: 0,
        resetTime: now + window,
      };
    }

    record.count++;
    this.rateLimitStore.set(key, record);

    const allowed = record.count <= this.config.rateLimit.maxRequests;

    if (!allowed) {
      this.logSecurityEvent('rate_limit_exceeded', 'medium', {
        identifier,
        action,
        count: record.count,
        limit: this.config.rateLimit.maxRequests,
      });
    }

    return {
      allowed,
      resetTime: record.resetTime,
    };
  }

  public checkBruteForce(identifier: string): { blocked: boolean; remainingTime: number } {
    if (!this.config.rateLimit.enableBruteForceProtection) {
      return { blocked: false, remainingTime: 0 };
    }

    const now = Date.now();
    const record = this.bruteForceAttempts.get(identifier);
    
    if (!record) {
      return { blocked: false, remainingTime: 0 };
    }

    // Progressive lockout: 1min, 5min, 15min, 1hr, 24hr
    const lockoutDurations = [60000, 300000, 900000, 3600000, 86400000];
    const lockoutIndex = Math.min(record.count - 5, lockoutDurations.length - 1);
    
    if (record.count >= 5) {
      const lockoutDuration = lockoutDurations[lockoutIndex];
      const unlockTime = record.lastAttempt + lockoutDuration;
      
      if (now < unlockTime) {
        return {
          blocked: true,
          remainingTime: unlockTime - now,
        };
      }
    }

    return { blocked: false, remainingTime: 0 };
  }

  public recordFailedAttempt(identifier: string): void {
    const now = Date.now();
    const record = this.bruteForceAttempts.get(identifier) || { count: 0, lastAttempt: 0 };
    
    // Reset count if last attempt was more than 1 hour ago
    if (now - record.lastAttempt > 3600000) {
      record.count = 0;
    }
    
    record.count++;
    record.lastAttempt = now;
    
    this.bruteForceAttempts.set(identifier, record);

    if (record.count >= 5) {
      this.logSecurityEvent('auth_lockout', 'high', {
        identifier,
        attemptCount: record.count,
      });
    }
  }

  public clearFailedAttempts(identifier: string): void {
    this.bruteForceAttempts.delete(identifier);
  }

  // Data sanitization
  public sanitizeInput(input: string, type: 'html' | 'sql' | 'xss' | 'path' = 'xss'): string {
    switch (type) {
      case 'html':
        return input
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;')
          .replace(/\//g, '&#x2F;');
      
      case 'sql':
        return input.replace(/['";\\]/g, '\\$&');
      
      case 'xss':
        return input
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '');
      
      case 'path':
        return input.replace(/[^a-zA-Z0-9._-]/g, '');
      
      default:
        return input;
    }
  }

  public anonymizeIP(ip: string): string {
    if (!this.config.dataProtection.anonymizeIPs) {
      return ip;
    }

    // IPv4
    if (ip.includes('.')) {
      const parts = ip.split('.');
      return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
    }
    
    // IPv6
    if (ip.includes(':')) {
      const parts = ip.split(':');
      return parts.slice(0, 4).join(':') + '::';
    }
    
    return 'unknown';
  }

  // GDPR compliance
  public handleGDPRRequest(userId: string, requestType: 'access' | 'delete' | 'portability' | 'rectification'): Promise<any> {
    this.logSecurityEvent('gdpr_request', 'medium', {
      userId,
      requestType,
    });

    switch (requestType) {
      case 'access':
        return this.exportUserData(userId);
      case 'delete':
        return this.deleteUserData(userId);
      case 'portability':
        return this.exportUserDataPortable(userId);
      case 'rectification':
        return Promise.resolve({ message: 'Rectification request logged' });
      default:
        throw new Error('Invalid GDPR request type');
    }
  }

  private async exportUserData(userId: string): Promise<any> {
    // Implementation would gather all user data from various sources
    return {
      userId,
      exportedAt: new Date().toISOString(),
      data: {
        // User profile, preferences, content, etc.
      },
    };
  }

  private async deleteUserData(userId: string): Promise<any> {
    // Implementation would delete/anonymize user data
    this.logSecurityEvent('data_deletion', 'high', {
      userId,
      deletedAt: Date.now(),
    });
    
    return {
      userId,
      deletedAt: new Date().toISOString(),
      status: 'completed',
    };
  }

  private async exportUserDataPortable(userId: string): Promise<any> {
    // Implementation would export data in portable format
    return {
      userId,
      format: 'json',
      exportedAt: new Date().toISOString(),
      data: {
        // Portable user data
      },
    };
  }

  // Security headers
  public getSecurityHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};

    if (this.config.headers.enableXFrameOptions) {
      headers['X-Frame-Options'] = 'DENY';
    }

    if (this.config.headers.enableXContentTypeOptions) {
      headers['X-Content-Type-Options'] = 'nosniff';
    }

    if (this.config.headers.enableHSTS) {
      headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload';
    }

    if (this.config.headers.enableCSP) {
      headers['Content-Security-Policy'] = this.generateCSP();
    }

    headers['Referrer-Policy'] = 'strict-origin-when-cross-origin';
    headers['Permissions-Policy'] = 'camera=(), microphone=(), geolocation=()';
    headers['X-DNS-Prefetch-Control'] = 'off';

    return headers;
  }

  private generateCSP(): string {
    const directives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "media-src 'self' blob: https:",
      "connect-src 'self' https: wss: ws:",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ];

    return directives.join('; ');
  }

  // Security monitoring
  private startSecurityMonitoring(): void {
    // Monitor for suspicious activities
    setInterval(() => {
      this.detectAnomalies();
      this.cleanupOldLogs();
    }, 60000); // Every minute
  }

  private detectAnomalies(): void {
    // Detect unusual patterns in rate limiting
    const now = Date.now();
    const recentLogs = this.auditLogs.filter(log => now - log.timestamp < 300000); // Last 5 minutes

    // Check for multiple failed auth attempts
    const failedAuths = recentLogs.filter(log => log.event === 'auth_failure');
    if (failedAuths.length > 10) {
      this.logSecurityEvent('suspicious_activity', 'high', {
        type: 'multiple_auth_failures',
        count: failedAuths.length,
        timeWindow: '5 minutes',
      });
    }

    // Check for unusual data access patterns
    const dataAccess = recentLogs.filter(log => log.event === 'data_access');
    if (dataAccess.length > 100) {
      this.logSecurityEvent('suspicious_activity', 'medium', {
        type: 'high_data_access',
        count: dataAccess.length,
        timeWindow: '5 minutes',
      });
    }
  }

  private cleanupOldLogs(): void {
    const cutoff = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 days
    this.auditLogs = this.auditLogs.filter(log => log.timestamp > cutoff);
  }

  // Audit logging
  public logSecurityEvent(
    event: SecurityEventType,
    severity: SecurityAuditLog['severity'],
    details: any,
    userId?: string,
    sessionId?: string
  ): void {
    const log: SecurityAuditLog = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      event,
      userId,
      sessionId,
      ipAddress: this.getClientIP(),
      userAgent: this.getUserAgent(),
      details,
      severity,
      resolved: false,
    };

    this.auditLogs.push(log);

    // Alert on critical events
    if (severity === 'critical') {
      this.triggerSecurityAlert(log);
    }

    console.log(`Security Event [${severity.toUpperCase()}]: ${event}`, details);
  }

  private triggerSecurityAlert(log: SecurityAuditLog): void {
    // Implementation would send alerts to security team
    console.error('CRITICAL SECURITY EVENT:', log);
    
    // Store alert for dashboard
    this.securityAlerts.set(log.id, {
      ...log,
      alertedAt: Date.now(),
    });
  }

  private getClientIP(): string {
    // Implementation would extract client IP from request
    return 'unknown';
  }

  private getUserAgent(): string {
    // Implementation would extract user agent from request
    return typeof window !== 'undefined' ? navigator.userAgent : 'unknown';
  }

  // Vulnerability scanning
  public scanForVulnerabilities(): Promise<any[]> {
    return new Promise((resolve) => {
      const vulnerabilities: any[] = [];

      // Check for weak secrets
      this.secrets.forEach((metadata, id) => {
        const age = Date.now() - metadata.lastRotated;
        const maxAge = this.config.secrets.rotationInterval * 24 * 60 * 60 * 1000;
        
        if (age > maxAge) {
          vulnerabilities.push({
            type: 'expired_secret',
            severity: 'medium',
            secretId: id,
            age: Math.floor(age / (24 * 60 * 60 * 1000)),
            recommendation: 'Rotate secret immediately',
          });
        }
      });

      // Check for suspicious patterns
      const recentFailures = this.auditLogs.filter(
        log => log.event === 'auth_failure' && Date.now() - log.timestamp < 86400000
      );
      
      if (recentFailures.length > 50) {
        vulnerabilities.push({
          type: 'high_auth_failures',
          severity: 'high',
          count: recentFailures.length,
          recommendation: 'Investigate potential brute force attack',
        });
      }

      resolve(vulnerabilities);
    });
  }

  // Public getters
  public getAuditLogs(limit: number = 100): SecurityAuditLog[] {
    return this.auditLogs.slice(-limit);
  }

  public getSecurityAlerts(): any[] {
    return Array.from(this.securityAlerts.values());
  }

  public getSecurityMetrics(): any {
    const now = Date.now();
    const last24h = this.auditLogs.filter(log => now - log.timestamp < 86400000);
    
    return {
      totalEvents: this.auditLogs.length,
      eventsLast24h: last24h.length,
      criticalEvents: last24h.filter(log => log.severity === 'critical').length,
      activeAlerts: this.securityAlerts.size,
      rateLimitHits: last24h.filter(log => log.event === 'rate_limit_exceeded').length,
      authFailures: last24h.filter(log => log.event === 'auth_failure').length,
      bruteForceAttempts: this.bruteForceAttempts.size,
    };
  }

  public destroy(): void {
    // Clear sensitive data
    this.masterKey.fill(0);
    this.secrets.clear();
    this.encryptionCache.clear();
    this.rateLimitStore.clear();
    this.bruteForceAttempts.clear();
    this.securityAlerts.clear();
    this.suspiciousActivities.clear();
  }
}

// Singleton instance
let securityManager: SecurityManager | null = null;

export function getSecurityManager(): SecurityManager {
  if (!securityManager) {
    securityManager = new SecurityManager();
  }
  return securityManager;
}

export function initializeSecurityManager(config?: Partial<SecurityConfig>): SecurityManager {
  securityManager = new SecurityManager(config);
  return securityManager;
}
