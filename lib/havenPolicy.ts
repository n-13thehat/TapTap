/**
 * Haven Policy System - Content filtering and safety checks
 * Implements content moderation and safety policies for TapTap
 */

export interface HavenPolicyResult {
  allowed: boolean;
  reason?: string;
  severity?: 'low' | 'medium' | 'high';
  action?: 'warn' | 'block' | 'review';
}

export interface ContentItem {
  id: string;
  type: 'track' | 'artist' | 'album' | 'playlist' | 'user' | 'post';
  title?: string;
  content?: string;
  metadata?: Record<string, any>;
}

// Blocked content patterns
const BLOCKED_PATTERNS = [
  /\b(hate|violence|explicit)\b/i,
  /\b(spam|scam|fraud)\b/i,
  /\b(illegal|piracy|copyright)\b/i,
];

// Flagged content patterns (require review)
const FLAGGED_PATTERNS = [
  /\b(controversial|political)\b/i,
  /\b(adult|mature)\b/i,
];

// Age-restricted content patterns
const AGE_RESTRICTED_PATTERNS = [
  /\b(explicit|mature|adult)\b/i,
  /\b(18\+|nsfw)\b/i,
];

/**
 * Check if content passes Haven policy
 */
export function checkHavenPolicy(content: ContentItem, userAge?: number): HavenPolicyResult {
  const text = `${content.title || ''} ${content.content || ''}`.toLowerCase();
  
  // Check for blocked content
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(text)) {
      return {
        allowed: false,
        reason: 'Content violates community guidelines',
        severity: 'high',
        action: 'block'
      };
    }
  }
  
  // Check for age-restricted content
  for (const pattern of AGE_RESTRICTED_PATTERNS) {
    if (pattern.test(text)) {
      if (!userAge || userAge < 18) {
        return {
          allowed: false,
          reason: 'Age-restricted content',
          severity: 'medium',
          action: 'block'
        };
      }
    }
  }
  
  // Check for flagged content
  for (const pattern of FLAGGED_PATTERNS) {
    if (pattern.test(text)) {
      return {
        allowed: true,
        reason: 'Content flagged for review',
        severity: 'low',
        action: 'review'
      };
    }
  }
  
  return {
    allowed: true
  };
}

/**
 * Check if user can access content based on Haven policy
 */
export function canAccessContent(
  content: ContentItem, 
  userContext?: {
    age?: number;
    isVerified?: boolean;
    hasTapPass?: boolean;
    role?: string;
  }
): HavenPolicyResult {
  const policyResult = checkHavenPolicy(content, userContext?.age);
  
  if (!policyResult.allowed) {
    return policyResult;
  }
  
  // Additional access checks
  if (content.type === 'track' && content.metadata?.isPremium) {
    if (!userContext?.hasTapPass) {
      return {
        allowed: false,
        reason: 'TapPass required for premium content',
        severity: 'low',
        action: 'warn'
      };
    }
  }
  
  if (content.metadata?.isCreatorOnly) {
    if (userContext?.role !== 'CREATOR' && userContext?.role !== 'ADMIN') {
      return {
        allowed: false,
        reason: 'Creator access required',
        severity: 'medium',
        action: 'block'
      };
    }
  }
  
  return {
    allowed: true
  };
}

/**
 * Filter content array based on Haven policy
 */
export function filterContentByPolicy<T extends ContentItem>(
  items: T[],
  userContext?: {
    age?: number;
    isVerified?: boolean;
    hasTapPass?: boolean;
    role?: string;
  }
): T[] {
  return items.filter(item => {
    const result = canAccessContent(item, userContext);
    return result.allowed;
  });
}

/**
 * Log policy violations for monitoring
 */
export function logPolicyViolation(
  content: ContentItem,
  result: HavenPolicyResult,
  userContext?: any
) {
  if (!result.allowed) {
    console.warn('Haven Policy Violation:', {
      contentId: content.id,
      contentType: content.type,
      reason: result.reason,
      severity: result.severity,
      action: result.action,
      userContext: userContext ? {
        age: userContext.age,
        role: userContext.role,
        verified: userContext.isVerified
      } : null,
      timestamp: new Date().toISOString()
    });
  }
}
