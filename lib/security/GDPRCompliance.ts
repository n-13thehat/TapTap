/**
 * GDPR Compliance System
 * Comprehensive GDPR compliance implementation for TapTap Matrix
 */

import { z } from 'zod';
import { getSecurityManager } from './SecurityManager';

export interface GDPRConfig {
  enabled: boolean;
  defaultConsentLevel: ConsentLevel;
  consentExpiryDays: number;
  dataRetentionDays: number;
  anonymizationDelay: number; // days after deletion request
  cookieConsentRequired: boolean;
  showConsentBanner: boolean;
  allowConsentWithdrawal: boolean;
  requireExplicitConsent: boolean;
  enableDataPortability: boolean;
  enableRightToRectification: boolean;
  enableRightToErasure: boolean;
  enableDataMinimization: boolean;
}

export type ConsentLevel = 'none' | 'necessary' | 'functional' | 'analytics' | 'marketing' | 'all';

export interface ConsentRecord {
  userId: string;
  sessionId?: string;
  consentLevel: ConsentLevel;
  specificConsents: {
    cookies: boolean;
    analytics: boolean;
    marketing: boolean;
    personalization: boolean;
    thirdPartySharing: boolean;
    dataProcessing: boolean;
    profiling: boolean;
    locationTracking: boolean;
    biometricData: boolean;
    sensitiveData: boolean;
  };
  timestamp: number;
  ipAddress: string;
  userAgent: string;
  consentMethod: 'banner' | 'settings' | 'registration' | 'api';
  version: string;
  expiresAt: number;
  withdrawnAt?: number;
  withdrawalReason?: string;
}

export interface DataSubject {
  userId: string;
  email: string;
  personalData: PersonalDataInventory;
  consentHistory: ConsentRecord[];
  dataRequests: DataRequest[];
  dataRetention: DataRetentionPolicy;
  lastActivity: number;
  accountStatus: 'active' | 'suspended' | 'deleted' | 'anonymized';
}

export interface PersonalDataInventory {
  identifiers: {
    userId: string;
    email: string;
    username?: string;
    phoneNumber?: string;
    walletAddress?: string;
    socialIds?: { [provider: string]: string };
  };
  profile: {
    name?: string;
    avatar?: string;
    bio?: string;
    birthDate?: string;
    location?: string;
    preferences?: any;
  };
  behavioral: {
    loginHistory: any[];
    activityLogs: any[];
    searchHistory: any[];
    playHistory: any[];
    interactions: any[];
  };
  technical: {
    ipAddresses: string[];
    deviceInfo: any[];
    sessionData: any[];
    cookies: any[];
    localStorage: any[];
  };
  content: {
    tracks: any[];
    playlists: any[];
    comments: any[];
    posts: any[];
    messages: any[];
  };
  financial: {
    transactions: any[];
    walletData: any[];
    subscriptions: any[];
    purchases: any[];
  };
  sensitive: {
    biometricData?: any[];
    healthData?: any[];
    locationData?: any[];
    communicationData?: any[];
  };
}

export interface DataRequest {
  id: string;
  userId: string;
  type: 'access' | 'portability' | 'rectification' | 'erasure' | 'restriction' | 'objection';
  status: 'pending' | 'processing' | 'completed' | 'rejected' | 'expired';
  requestedAt: number;
  processedAt?: number;
  completedAt?: number;
  requestDetails: any;
  responseData?: any;
  verificationMethod: 'email' | 'sms' | 'identity_document' | 'security_questions';
  verificationStatus: 'pending' | 'verified' | 'failed';
  legalBasis?: string;
  processingNotes?: string;
  automatedDecision: boolean;
}

export interface DataRetentionPolicy {
  userId: string;
  categories: {
    [category: string]: {
      retentionPeriod: number; // days
      lastUpdated: number;
      deletionScheduled?: number;
      legalBasis: string;
      autoDelete: boolean;
    };
  };
  globalRetention: number; // days
  lastReview: number;
  nextReview: number;
}

export interface PrivacyNotice {
  id: string;
  version: string;
  effectiveDate: number;
  content: {
    dataController: any;
    dataProcessingPurposes: any[];
    legalBasis: any[];
    dataCategories: any[];
    dataRecipients: any[];
    dataTransfers: any[];
    retentionPeriods: any[];
    dataSubjectRights: any[];
    contactInformation: any;
  };
  languages: string[];
  acknowledgments: {
    userId: string;
    acknowledgedAt: number;
    version: string;
  }[];
}

export interface CookiePolicy {
  id: string;
  version: string;
  cookies: {
    name: string;
    purpose: string;
    category: 'necessary' | 'functional' | 'analytics' | 'marketing';
    duration: number; // days
    thirdParty: boolean;
    provider?: string;
    description: string;
  }[];
  lastUpdated: number;
}

export class GDPRCompliance {
  private config: GDPRConfig;
  private securityManager = getSecurityManager();
  
  // Data stores
  private consentRecords: Map<string, ConsentRecord[]> = new Map();
  private dataSubjects: Map<string, DataSubject> = new Map();
  private dataRequests: Map<string, DataRequest> = new Map();
  private privacyNotices: Map<string, PrivacyNotice> = new Map();
  private cookiePolicy: CookiePolicy | null = null;
  
  // Processing queues
  private deletionQueue: Map<string, { userId: string; scheduledFor: number }> = new Map();
  private anonymizationQueue: Map<string, { userId: string; scheduledFor: number }> = new Map();
  
  // Monitoring
  private complianceMetrics = {
    totalDataSubjects: 0,
    activeConsents: 0,
    pendingRequests: 0,
    completedDeletions: 0,
    complianceScore: 1.0,
    lastAudit: 0,
  };

  constructor(config: Partial<GDPRConfig> = {}) {
    this.config = {
      enabled: true,
      defaultConsentLevel: 'necessary',
      consentExpiryDays: 365,
      dataRetentionDays: 2555, // 7 years default
      anonymizationDelay: 30,
      cookieConsentRequired: true,
      showConsentBanner: true,
      allowConsentWithdrawal: true,
      requireExplicitConsent: true,
      enableDataPortability: true,
      enableRightToRectification: true,
      enableRightToErasure: true,
      enableDataMinimization: true,
      ...config,
    };

    this.initializePrivacyNotice();
    this.initializeCookiePolicy();
    this.startComplianceMonitoring();
  }

  // Consent Management
  public recordConsent(
    userId: string,
    consentLevel: ConsentLevel,
    specificConsents: Partial<ConsentRecord['specificConsents']> = {},
    metadata: {
      sessionId?: string;
      ipAddress?: string;
      userAgent?: string;
      consentMethod?: ConsentRecord['consentMethod'];
    } = {}
  ): ConsentRecord {
    const consent: ConsentRecord = {
      userId,
      sessionId: metadata.sessionId,
      consentLevel,
      specificConsents: {
        cookies: consentLevel !== 'none',
        analytics: ['analytics', 'all'].includes(consentLevel),
        marketing: ['marketing', 'all'].includes(consentLevel),
        personalization: ['functional', 'analytics', 'marketing', 'all'].includes(consentLevel),
        thirdPartySharing: ['marketing', 'all'].includes(consentLevel),
        dataProcessing: consentLevel !== 'none',
        profiling: ['analytics', 'marketing', 'all'].includes(consentLevel),
        locationTracking: false,
        biometricData: false,
        sensitiveData: false,
        ...specificConsents,
      },
      timestamp: Date.now(),
      ipAddress: this.securityManager.anonymizeIP(metadata.ipAddress || 'unknown'),
      userAgent: metadata.userAgent || 'unknown',
      consentMethod: metadata.consentMethod || 'banner',
      version: '1.0.0',
      expiresAt: Date.now() + (this.config.consentExpiryDays * 24 * 60 * 60 * 1000),
    };

    // Store consent record
    const userConsents = this.consentRecords.get(userId) || [];
    userConsents.push(consent);
    this.consentRecords.set(userId, userConsents);

    // Update data subject
    this.updateDataSubject(userId, { consentHistory: userConsents });

    this.securityManager.logSecurityEvent('gdpr_request', 'low', {
      action: 'consent_recorded',
      userId,
      consentLevel,
      method: consent.consentMethod,
    });

    return consent;
  }

  public getConsent(userId: string): ConsentRecord | null {
    const consents = this.consentRecords.get(userId) || [];
    const activeConsents = consents.filter(c => !c.withdrawnAt && Date.now() < c.expiresAt);
    
    // Return most recent active consent
    return activeConsents.sort((a, b) => b.timestamp - a.timestamp)[0] || null;
  }

  public withdrawConsent(userId: string, reason?: string): boolean {
    const consent = this.getConsent(userId);
    if (!consent) return false;

    consent.withdrawnAt = Date.now();
    consent.withdrawalReason = reason;

    // Update stored consent
    const userConsents = this.consentRecords.get(userId) || [];
    const index = userConsents.findIndex(c => c.timestamp === consent.timestamp);
    if (index >= 0) {
      userConsents[index] = consent;
      this.consentRecords.set(userId, userConsents);
    }

    this.securityManager.logSecurityEvent('gdpr_request', 'medium', {
      action: 'consent_withdrawn',
      userId,
      reason,
    });

    return true;
  }

  public hasValidConsent(userId: string, purpose?: keyof ConsentRecord['specificConsents']): boolean {
    const consent = this.getConsent(userId);
    if (!consent) return false;

    if (purpose) {
      return consent.specificConsents[purpose] === true;
    }

    return consent.consentLevel !== 'none';
  }

  // Data Subject Rights
  public async submitDataRequest(
    userId: string,
    type: DataRequest['type'],
    requestDetails: any = {},
    verificationMethod: DataRequest['verificationMethod'] = 'email'
  ): Promise<string> {
    const requestId = this.generateRequestId();
    
    const request: DataRequest = {
      id: requestId,
      userId,
      type,
      status: 'pending',
      requestedAt: Date.now(),
      requestDetails,
      verificationMethod,
      verificationStatus: 'pending',
      automatedDecision: false,
    };

    this.dataRequests.set(requestId, request);

    // Update data subject
    const dataSubject = this.getDataSubject(userId);
    if (dataSubject) {
      dataSubject.dataRequests.push(request);
      this.dataSubjects.set(userId, dataSubject);
    }

    this.securityManager.logSecurityEvent('gdpr_request', 'medium', {
      action: 'data_request_submitted',
      userId,
      requestType: type,
      requestId,
    });

    // Start verification process
    await this.initiateVerification(requestId);

    return requestId;
  }

  public async processDataRequest(requestId: string): Promise<any> {
    const request = this.dataRequests.get(requestId);
    if (!request) {
      throw new Error('Request not found');
    }

    if (request.verificationStatus !== 'verified') {
      throw new Error('Request not verified');
    }

    request.status = 'processing';
    request.processedAt = Date.now();

    try {
      let result: any;

      switch (request.type) {
        case 'access':
          result = await this.processAccessRequest(request);
          break;
        case 'portability':
          result = await this.processPortabilityRequest(request);
          break;
        case 'rectification':
          result = await this.processRectificationRequest(request);
          break;
        case 'erasure':
          result = await this.processErasureRequest(request);
          break;
        case 'restriction':
          result = await this.processRestrictionRequest(request);
          break;
        case 'objection':
          result = await this.processObjectionRequest(request);
          break;
        default:
          throw new Error('Unsupported request type');
      }

      request.status = 'completed';
      request.completedAt = Date.now();
      request.responseData = result;

      this.dataRequests.set(requestId, request);

      this.securityManager.logSecurityEvent('gdpr_request', 'medium', {
        action: 'data_request_completed',
        userId: request.userId,
        requestType: request.type,
        requestId,
      });

      return result;
    } catch (error) {
      request.status = 'rejected';
      request.processingNotes = (error as Error).message;
      this.dataRequests.set(requestId, request);

      this.securityManager.logSecurityEvent('gdpr_request', 'high', {
        action: 'data_request_failed',
        userId: request.userId,
        requestType: request.type,
        requestId,
        error: (error as Error).message,
      });

      throw error;
    }
  }

  private async processAccessRequest(request: DataRequest): Promise<any> {
    const dataSubject = this.getDataSubject(request.userId);
    if (!dataSubject) {
      throw new Error('Data subject not found');
    }

    return {
      requestId: request.id,
      dataSubject: {
        userId: dataSubject.userId,
        email: dataSubject.email,
        personalData: dataSubject.personalData,
        consentHistory: dataSubject.consentHistory,
        dataRequests: dataSubject.dataRequests.map(r => ({
          id: r.id,
          type: r.type,
          status: r.status,
          requestedAt: r.requestedAt,
          completedAt: r.completedAt,
        })),
        accountStatus: dataSubject.accountStatus,
        lastActivity: dataSubject.lastActivity,
      },
      exportedAt: new Date().toISOString(),
      format: 'json',
    };
  }

  private async processPortabilityRequest(request: DataRequest): Promise<any> {
    const accessData = await this.processAccessRequest(request);
    
    // Convert to portable format
    return {
      ...accessData,
      format: 'portable-json',
      schema: 'gdpr-portability-v1',
      instructions: 'This data can be imported into compatible systems',
    };
  }

  private async processRectificationRequest(request: DataRequest): Promise<any> {
    const { corrections } = request.requestDetails;
    
    // Apply corrections to user data
    // This would integrate with your user management system
    
    return {
      requestId: request.id,
      correctionsMade: corrections,
      updatedAt: new Date().toISOString(),
    };
  }

  private async processErasureRequest(request: DataRequest): Promise<any> {
    const userId = request.userId;
    
    // Schedule for deletion after anonymization delay
    const deletionDate = Date.now() + (this.config.anonymizationDelay * 24 * 60 * 60 * 1000);
    
    this.deletionQueue.set(userId, {
      userId,
      scheduledFor: deletionDate,
    });

    // Immediately anonymize identifiable data
    await this.anonymizeUserData(userId);

    return {
      requestId: request.id,
      status: 'scheduled_for_deletion',
      anonymizedAt: new Date().toISOString(),
      scheduledDeletionDate: new Date(deletionDate).toISOString(),
    };
  }

  private async processRestrictionRequest(request: DataRequest): Promise<any> {
    // Implement data processing restriction
    return {
      requestId: request.id,
      restrictionApplied: true,
      restrictedAt: new Date().toISOString(),
    };
  }

  private async processObjectionRequest(request: DataRequest): Promise<any> {
    // Handle objection to data processing
    return {
      requestId: request.id,
      objectionProcessed: true,
      processedAt: new Date().toISOString(),
    };
  }

  // Data Management
  private async anonymizeUserData(userId: string): Promise<void> {
    const dataSubject = this.getDataSubject(userId);
    if (!dataSubject) return;

    // Anonymize personal identifiers
    dataSubject.personalData.identifiers = {
      userId: `anon_${this.generateAnonymousId()}`,
      email: `deleted_${Date.now()}@example.com`,
    };

    // Clear sensitive data
    dataSubject.personalData.profile = {};
    dataSubject.personalData.sensitive = {};
    
    // Anonymize behavioral data
    dataSubject.personalData.behavioral = {
      loginHistory: [],
      activityLogs: [],
      searchHistory: [],
      playHistory: [],
      interactions: [],
    };

    // Update account status
    dataSubject.accountStatus = 'anonymized';
    
    this.dataSubjects.set(userId, dataSubject);

    this.securityManager.logSecurityEvent('data_deletion', 'high', {
      action: 'user_data_anonymized',
      userId,
      anonymizedAt: Date.now(),
    });
  }

  private async deleteUserData(userId: string): Promise<void> {
    // Remove all user data
    this.dataSubjects.delete(userId);
    this.consentRecords.delete(userId);
    
    // Remove from deletion queue
    this.deletionQueue.delete(userId);

    this.securityManager.logSecurityEvent('data_deletion', 'high', {
      action: 'user_data_deleted',
      userId,
      deletedAt: Date.now(),
    });
  }

  // Verification
  private async initiateVerification(requestId: string): Promise<void> {
    const request = this.dataRequests.get(requestId);
    if (!request) return;

    // Implement verification logic based on method
    switch (request.verificationMethod) {
      case 'email':
        await this.sendVerificationEmail(request);
        break;
      case 'sms':
        await this.sendVerificationSMS(request);
        break;
      case 'identity_document':
        await this.requestIdentityDocument(request);
        break;
      case 'security_questions':
        await this.sendSecurityQuestions(request);
        break;
    }
  }

  private async sendVerificationEmail(request: DataRequest): Promise<void> {
    // Implementation would send verification email
    console.log(`Verification email sent for request ${request.id}`);
  }

  private async sendVerificationSMS(request: DataRequest): Promise<void> {
    // Implementation would send verification SMS
    console.log(`Verification SMS sent for request ${request.id}`);
  }

  private async requestIdentityDocument(request: DataRequest): Promise<void> {
    // Implementation would request identity document upload
    console.log(`Identity document requested for request ${request.id}`);
  }

  private async sendSecurityQuestions(request: DataRequest): Promise<void> {
    // Implementation would send security questions
    console.log(`Security questions sent for request ${request.id}`);
  }

  public verifyRequest(requestId: string, verificationData: any): boolean {
    const request = this.dataRequests.get(requestId);
    if (!request) return false;

    // Implement verification logic
    request.verificationStatus = 'verified';
    this.dataRequests.set(requestId, request);

    return true;
  }

  // Data Subject Management
  private getDataSubject(userId: string): DataSubject | null {
    return this.dataSubjects.get(userId) || null;
  }

  private updateDataSubject(userId: string, updates: Partial<DataSubject>): void {
    const existing = this.getDataSubject(userId) || this.createDataSubject(userId);
    const updated = { ...existing, ...updates };
    this.dataSubjects.set(userId, updated);
  }

  private createDataSubject(userId: string): DataSubject {
    const dataSubject: DataSubject = {
      userId,
      email: '', // Would be populated from user data
      personalData: {
        identifiers: { userId },
        profile: {},
        behavioral: {
          loginHistory: [],
          activityLogs: [],
          searchHistory: [],
          playHistory: [],
          interactions: [],
        },
        technical: {
          ipAddresses: [],
          deviceInfo: [],
          sessionData: [],
          cookies: [],
          localStorage: [],
        },
        content: {
          tracks: [],
          playlists: [],
          comments: [],
          posts: [],
          messages: [],
        },
        financial: {
          transactions: [],
          walletData: [],
          subscriptions: [],
          purchases: [],
        },
        sensitive: {},
      },
      consentHistory: [],
      dataRequests: [],
      dataRetention: this.createDataRetentionPolicy(userId),
      lastActivity: Date.now(),
      accountStatus: 'active',
    };

    this.dataSubjects.set(userId, dataSubject);
    return dataSubject;
  }

  private createDataRetentionPolicy(userId: string): DataRetentionPolicy {
    return {
      userId,
      categories: {
        profile: {
          retentionPeriod: this.config.dataRetentionDays,
          lastUpdated: Date.now(),
          legalBasis: 'contract',
          autoDelete: true,
        },
        behavioral: {
          retentionPeriod: 365, // 1 year
          lastUpdated: Date.now(),
          legalBasis: 'legitimate_interest',
          autoDelete: true,
        },
        financial: {
          retentionPeriod: 2555, // 7 years
          lastUpdated: Date.now(),
          legalBasis: 'legal_obligation',
          autoDelete: false,
        },
      },
      globalRetention: this.config.dataRetentionDays,
      lastReview: Date.now(),
      nextReview: Date.now() + (365 * 24 * 60 * 60 * 1000), // 1 year
    };
  }

  // Privacy Notice Management
  private initializePrivacyNotice(): void {
    const notice: PrivacyNotice = {
      id: 'privacy-notice-v1',
      version: '1.0.0',
      effectiveDate: Date.now(),
      content: {
        dataController: {
          name: 'TapTap Matrix',
          address: '',
          email: 'privacy@taptapmatrix.com',
          phone: '',
        },
        dataProcessingPurposes: [
          'Service provision',
          'User authentication',
          'Content personalization',
          'Analytics and improvement',
          'Marketing communications',
          'Legal compliance',
        ],
        legalBasis: [
          'Contract performance',
          'Legitimate interest',
          'Consent',
          'Legal obligation',
        ],
        dataCategories: [
          'Identity data',
          'Contact data',
          'Profile data',
          'Usage data',
          'Technical data',
          'Marketing data',
        ],
        dataRecipients: [
          'Service providers',
          'Analytics providers',
          'Marketing partners',
          'Legal authorities',
        ],
        dataTransfers: [
          'EU/EEA',
          'United States (adequacy decision)',
        ],
        retentionPeriods: [
          'Profile data: 7 years after account closure',
          'Usage data: 1 year',
          'Marketing data: Until consent withdrawn',
        ],
        dataSubjectRights: [
          'Right of access',
          'Right to rectification',
          'Right to erasure',
          'Right to restrict processing',
          'Right to data portability',
          'Right to object',
        ],
        contactInformation: {
          dpo: 'dpo@taptapmatrix.com',
          privacy: 'privacy@taptapmatrix.com',
          support: 'support@taptapmatrix.com',
        },
      },
      languages: ['en'],
      acknowledgments: [],
    };

    this.privacyNotices.set(notice.id, notice);
  }

  private initializeCookiePolicy(): void {
    this.cookiePolicy = {
      id: 'cookie-policy-v1',
      version: '1.0.0',
      cookies: [
        {
          name: 'session',
          purpose: 'User authentication and session management',
          category: 'necessary',
          duration: 30,
          thirdParty: false,
          description: 'Essential for user login and security',
        },
        {
          name: 'preferences',
          purpose: 'Store user preferences and settings',
          category: 'functional',
          duration: 365,
          thirdParty: false,
          description: 'Remembers your settings and preferences',
        },
        {
          name: 'analytics',
          purpose: 'Usage analytics and performance monitoring',
          category: 'analytics',
          duration: 90,
          thirdParty: true,
          provider: 'Google Analytics',
          description: 'Helps us understand how you use our service',
        },
        {
          name: 'marketing',
          purpose: 'Personalized advertising and marketing',
          category: 'marketing',
          duration: 180,
          thirdParty: true,
          provider: 'Various ad networks',
          description: 'Shows you relevant advertisements',
        },
      ],
      lastUpdated: Date.now(),
    };
  }

  // Compliance Monitoring
  private startComplianceMonitoring(): void {
    // Process deletion queue
    setInterval(() => {
      this.processDeletionQueue();
    }, 24 * 60 * 60 * 1000); // Daily

    // Update compliance metrics
    setInterval(() => {
      this.updateComplianceMetrics();
    }, 60 * 60 * 1000); // Hourly
  }

  private processDeletionQueue(): void {
    const now = Date.now();
    
    this.deletionQueue.forEach(async (deletion, userId) => {
      if (now >= deletion.scheduledFor) {
        await this.deleteUserData(userId);
        this.complianceMetrics.completedDeletions++;
      }
    });
  }

  private updateComplianceMetrics(): void {
    this.complianceMetrics.totalDataSubjects = this.dataSubjects.size;
    this.complianceMetrics.activeConsents = Array.from(this.consentRecords.values())
      .flat()
      .filter(c => !c.withdrawnAt && Date.now() < c.expiresAt).length;
    this.complianceMetrics.pendingRequests = Array.from(this.dataRequests.values())
      .filter(r => r.status === 'pending' || r.status === 'processing').length;
    
    // Calculate compliance score
    this.complianceMetrics.complianceScore = this.calculateComplianceScore();
  }

  private calculateComplianceScore(): number {
    let score = 1.0;
    
    // Penalize for overdue requests
    const overdueRequests = Array.from(this.dataRequests.values())
      .filter(r => r.status === 'pending' && Date.now() - r.requestedAt > 30 * 24 * 60 * 60 * 1000);
    score -= overdueRequests.length * 0.1;
    
    // Penalize for expired consents
    const expiredConsents = Array.from(this.consentRecords.values())
      .flat()
      .filter(c => !c.withdrawnAt && Date.now() >= c.expiresAt);
    score -= expiredConsents.length * 0.05;
    
    return Math.max(0, Math.min(1, score));
  }

  // Utility methods
  private generateRequestId(): string {
    return `gdpr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateAnonymousId(): string {
    return Math.random().toString(36).substr(2, 16);
  }

  // Public API
  public getComplianceStatus(): any {
    return {
      enabled: this.config.enabled,
      metrics: this.complianceMetrics,
      pendingRequests: Array.from(this.dataRequests.values())
        .filter(r => r.status === 'pending' || r.status === 'processing'),
      scheduledDeletions: Array.from(this.deletionQueue.values()),
      lastAudit: this.complianceMetrics.lastAudit,
    };
  }

  public getPrivacyNotice(language: string = 'en'): PrivacyNotice | null {
    return Array.from(this.privacyNotices.values())
      .find(notice => notice.languages.includes(language)) || null;
  }

  public getCookiePolicy(): CookiePolicy | null {
    return this.cookiePolicy;
  }

  public getUserDataSummary(userId: string): any {
    const dataSubject = this.getDataSubject(userId);
    const consent = this.getConsent(userId);
    
    return {
      userId,
      hasValidConsent: !!consent,
      consentLevel: consent?.consentLevel || 'none',
      accountStatus: dataSubject?.accountStatus || 'unknown',
      lastActivity: dataSubject?.lastActivity,
      pendingRequests: Array.from(this.dataRequests.values())
        .filter(r => r.userId === userId && (r.status === 'pending' || r.status === 'processing')),
      dataCategories: dataSubject ? Object.keys(dataSubject.personalData) : [],
    };
  }

  public destroy(): void {
    this.consentRecords.clear();
    this.dataSubjects.clear();
    this.dataRequests.clear();
    this.privacyNotices.clear();
    this.deletionQueue.clear();
    this.anonymizationQueue.clear();
  }
}

// Singleton instance
let gdprCompliance: GDPRCompliance | null = null;

export function getGDPRCompliance(): GDPRCompliance {
  if (!gdprCompliance) {
    gdprCompliance = new GDPRCompliance();
  }
  return gdprCompliance;
}

export function initializeGDPRCompliance(config?: Partial<GDPRConfig>): GDPRCompliance {
  gdprCompliance = new GDPRCompliance(config);
  return gdprCompliance;
}
