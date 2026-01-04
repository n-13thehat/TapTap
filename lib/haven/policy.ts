// Haven Policy System - Content Safety and Moderation
export interface HavenPolicy {
  id: string;
  name: string;
  description: string;
  version: string;
  enabled: boolean;
  rules: PolicyRule[];
  actions: PolicyAction[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PolicyRule {
  id: string;
  type: 'content' | 'behavior' | 'metadata' | 'user';
  condition: PolicyCondition;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

export interface PolicyCondition {
  field: string;
  operator: 'equals' | 'contains' | 'matches' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
  caseSensitive?: boolean;
}

export interface PolicyAction {
  type: 'flag' | 'warn' | 'block' | 'remove' | 'quarantine' | 'escalate';
  parameters?: Record<string, any>;
  notifyUser?: boolean;
  notifyModerators?: boolean;
}

export interface PolicyViolation {
  id: string;
  policyId: string;
  ruleId: string;
  contentId: string;
  contentType: 'track' | 'post' | 'comment' | 'profile' | 'message';
  userId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  actions: PolicyAction[];
  metadata: Record<string, any>;
  createdAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  resolution?: string;
}

// Default Haven Policies
export const DEFAULT_POLICIES: HavenPolicy[] = [
  {
    id: 'content-safety-v1',
    name: 'Content Safety Policy',
    description: 'Protects against harmful, explicit, or inappropriate content',
    version: '1.0.0',
    enabled: true,
    rules: [
      {
        id: 'explicit-content',
        type: 'content',
        condition: {
          field: 'content_flags.explicit',
          operator: 'equals',
          value: true
        },
        severity: 'high',
        description: 'Content flagged as explicit'
      },
      {
        id: 'hate-speech',
        type: 'content',
        condition: {
          field: 'content_analysis.hate_speech_score',
          operator: 'greater_than',
          value: 0.8
        },
        severity: 'critical',
        description: 'Content contains hate speech'
      }
    ],
    actions: [
      {
        type: 'quarantine',
        notifyModerators: true
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'copyright-protection-v1',
    name: 'Copyright Protection Policy',
    description: 'Detects and handles potential copyright violations',
    version: '1.0.0',
    enabled: true,
    rules: [
      {
        id: 'audio-fingerprint-match',
        type: 'metadata',
        condition: {
          field: 'fingerprint_matches',
          operator: 'greater_than',
          value: 0
        },
        severity: 'high',
        description: 'Audio fingerprint matches copyrighted content'
      }
    ],
    actions: [
      {
        type: 'block',
        notifyUser: true,
        parameters: {
          reason: 'Potential copyright violation detected'
        }
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Policy Engine
export class HavenPolicyEngine {
  private policies: Map<string, HavenPolicy> = new Map();

  constructor() {
    // Load default policies
    DEFAULT_POLICIES.forEach(policy => {
      this.policies.set(policy.id, policy);
    });
  }

  /**
   * Evaluate content against all active policies
   */
  async evaluateContent(
    contentId: string,
    contentType: string,
    content: any,
    userId: string
  ): Promise<PolicyViolation[]> {
    const violations: PolicyViolation[] = [];

    for (const policy of this.policies.values()) {
      if (!policy.enabled) continue;

      for (const rule of policy.rules) {
        if (this.evaluateRule(rule, content)) {
          violations.push({
            id: `violation-${Date.now()}-${Math.random()}`,
            policyId: policy.id,
            ruleId: rule.id,
            contentId,
            contentType: contentType as any,
            userId,
            severity: rule.severity,
            status: 'pending',
            actions: policy.actions,
            metadata: {
              rule: rule,
              policy: policy.name,
              evaluatedAt: new Date()
            },
            createdAt: new Date()
          });
        }
      }
    }

    return violations;
  }

  /**
   * Evaluate a single rule against content
   */
  private evaluateRule(rule: PolicyRule, content: any): boolean {
    const { condition } = rule;
    const fieldValue = this.getNestedValue(content, condition.field);

    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      case 'contains':
        return typeof fieldValue === 'string' && 
               fieldValue.toLowerCase().includes(condition.value.toLowerCase());
      case 'matches':
        return new RegExp(condition.value).test(fieldValue);
      case 'greater_than':
        return Number(fieldValue) > Number(condition.value);
      case 'less_than':
        return Number(fieldValue) < Number(condition.value);
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(fieldValue);
      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(fieldValue);
      default:
        return false;
    }
  }

  /**
   * Get nested object value by dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Add or update a policy
   */
  setPolicy(policy: HavenPolicy): void {
    this.policies.set(policy.id, policy);
  }

  /**
   * Remove a policy
   */
  removePolicy(policyId: string): void {
    this.policies.delete(policyId);
  }

  /**
   * Get all policies
   */
  getPolicies(): HavenPolicy[] {
    return Array.from(this.policies.values());
  }
}

// Global policy engine instance
export const havenPolicyEngine = new HavenPolicyEngine();

// Utility functions for policy checking
export const checkHavenPolicy = async (
  contentId: string,
  contentType: string,
  content: any,
  userId: string
): Promise<PolicyViolation[]> => {
  return havenPolicyEngine.evaluateContent(contentId, contentType, content, userId);
};

export const logPolicyViolation = async (violation: PolicyViolation): Promise<void> => {
  // Log the violation to the database or external service
  console.warn('Policy violation detected:', violation);

  // In a real implementation, you would:
  // 1. Store the violation in the database
  // 2. Notify moderators if required
  // 3. Take automated actions based on severity
  // 4. Update user reputation/trust scores
};
