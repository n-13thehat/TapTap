/**
 * Agents V2 Profile and Workflow Parser
 * Parses agent profiles and workflows from various formats
 */

import { z } from 'zod';
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

// ============================================================================
// Schema Definitions
// ============================================================================

export const AgentProfileSchema = z.object({
  name: z.string().min(1),
  id: z.string().optional(),
  role: z.string().optional(),
  tone: z.string().optional(),
  vibe: z.string().optional(),
  signature: z.string().optional(),
  summary: z.string().optional(),
  version: z.string().default('2.0.0'),
  
  // Core capabilities
  tools: z.array(z.string()).optional(),
  datasets: z.array(z.string()).optional(),
  datasources: z.array(z.string()).optional(),
  playbooks: z.array(z.string()).optional(),
  guardrails: z.array(z.string()).optional(),
  handoffs: z.array(z.string()).optional(),
  
  // Performance metrics
  kpis: z.record(z.string()).optional(),
  evals: z.array(z.string()).optional(),
  
  // Advanced features
  cadence: z.object({
    schedule: z.string().optional(),
    triggers: z.array(z.string()).optional(),
    conditions: z.record(z.any()).optional(),
  }).optional(),
  
  ab_test: z.object({
    enabled: z.boolean().optional(),
    variants: z.array(z.string()).optional(),
    sample: z.number().min(0).max(1).optional(),
    metrics: z.array(z.string()).optional(),
    log: z.string().optional(),
  }).optional(),
  
  // Metadata
  meta: z.record(z.any()).optional(),
  theme: z.record(z.any()).optional(),
  changelog: z.array(z.string()).optional(),
  
  // Workflow integration
  workflows: z.array(z.string()).optional(),
  inputs: z.record(z.string()).optional(),
  outputs: z.record(z.string()).optional(),
  
  // Execution settings
  danger: z.enum(['low', 'med', 'high']).optional(),
  timeout: z.number().optional(),
  retries: z.number().optional(),
  
  // Dependencies
  dependencies: z.array(z.string()).optional(),
  requirements: z.record(z.any()).optional(),
});

export const WorkflowStepSchema = z.object({
  id: z.string().optional(),
  agent: z.string(),
  action: z.string(),
  inputs: z.record(z.any()).optional(),
  outputs: z.record(z.any()).optional(),
  condition: z.string().optional(),
  timeout: z.number().optional(),
  retries: z.number().optional(),
  onError: z.enum(['stop', 'continue', 'retry', 'fallback']).optional(),
  fallback: z.string().optional(),
});

export const WorkflowSchema = z.object({
  name: z.string().min(1),
  id: z.string().optional(),
  description: z.string().optional(),
  version: z.string().default('1.0.0'),
  
  // Workflow definition
  steps: z.array(WorkflowStepSchema),
  
  // Execution settings
  parallel: z.boolean().optional(),
  timeout: z.number().optional(),
  retries: z.number().optional(),
  
  // Triggers and conditions
  triggers: z.array(z.string()).optional(),
  conditions: z.record(z.any()).optional(),
  
  // Input/Output schema
  inputs: z.record(z.any()).optional(),
  outputs: z.record(z.any()).optional(),
  
  // Metadata
  meta: z.record(z.any()).optional(),
  tags: z.array(z.string()).optional(),
  
  // Dependencies
  dependencies: z.array(z.string()).optional(),
  requirements: z.record(z.any()).optional(),
});

export const AgentManifestSchema = z.object({
  version: z.string().default('2.0.0'),
  agents: z.array(AgentProfileSchema),
  workflows: z.array(WorkflowSchema).optional(),
  global: z.object({
    settings: z.record(z.any()).optional(),
    dependencies: z.array(z.string()).optional(),
    requirements: z.record(z.any()).optional(),
  }).optional(),
});

export type AgentProfile = z.infer<typeof AgentProfileSchema>;
export type WorkflowStep = z.infer<typeof WorkflowStepSchema>;
export type Workflow = z.infer<typeof WorkflowSchema>;
export type AgentManifest = z.infer<typeof AgentManifestSchema>;

// ============================================================================
// Parser Class
// ============================================================================

export class AgentParser {
  private static instance: AgentParser;
  
  static getInstance(): AgentParser {
    if (!AgentParser.instance) {
      AgentParser.instance = new AgentParser();
    }
    return AgentParser.instance;
  }

  /**
   * Parse agent profile from various formats
   */
  parseAgentProfile(content: string, format: 'json' | 'yaml' | 'auto' = 'auto'): AgentProfile {
    let data: any;
    
    try {
      if (format === 'auto') {
        // Try JSON first, then YAML
        try {
          data = JSON.parse(content);
        } catch {
          data = yaml.load(content);
        }
      } else if (format === 'json') {
        data = JSON.parse(content);
      } else if (format === 'yaml') {
        data = yaml.load(content);
      }
      
      return AgentProfileSchema.parse(data);
    } catch (error) {
      throw new Error(`Failed to parse agent profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse workflow from various formats
   */
  parseWorkflow(content: string, format: 'json' | 'yaml' | 'auto' = 'auto'): Workflow {
    let data: any;
    
    try {
      if (format === 'auto') {
        try {
          data = JSON.parse(content);
        } catch {
          data = yaml.load(content);
        }
      } else if (format === 'json') {
        data = JSON.parse(content);
      } else if (format === 'yaml') {
        data = yaml.load(content);
      }
      
      return WorkflowSchema.parse(data);
    } catch (error) {
      throw new Error(`Failed to parse workflow: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse agent manifest file
   */
  parseManifest(content: string, format: 'json' | 'yaml' | 'auto' = 'auto'): AgentManifest {
    let data: any;
    
    try {
      if (format === 'auto') {
        try {
          data = JSON.parse(content);
        } catch {
          data = yaml.load(content);
        }
      } else if (format === 'json') {
        data = JSON.parse(content);
      } else if (format === 'yaml') {
        data = yaml.load(content);
      }
      
      return AgentManifestSchema.parse(data);
    } catch (error) {
      throw new Error(`Failed to parse manifest: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Load agent profile from file
   */
  loadAgentProfile(filePath: string): AgentProfile {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Agent profile file not found: ${filePath}`);
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    const ext = path.extname(filePath).toLowerCase();
    
    let format: 'json' | 'yaml' | 'auto' = 'auto';
    if (ext === '.json') format = 'json';
    else if (ext === '.yaml' || ext === '.yml') format = 'yaml';
    
    return this.parseAgentProfile(content, format);
  }

  /**
   * Load workflow from file
   */
  loadWorkflow(filePath: string): Workflow {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Workflow file not found: ${filePath}`);
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    const ext = path.extname(filePath).toLowerCase();
    
    let format: 'json' | 'yaml' | 'auto' = 'auto';
    if (ext === '.json') format = 'json';
    else if (ext === '.yaml' || ext === '.yml') format = 'yaml';
    
    return this.parseWorkflow(content, format);
  }

  /**
   * Load manifest from file
   */
  loadManifest(filePath: string): AgentManifest {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Manifest file not found: ${filePath}`);
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    const ext = path.extname(filePath).toLowerCase();
    
    let format: 'json' | 'yaml' | 'auto' = 'auto';
    if (ext === '.json') format = 'json';
    else if (ext === '.yaml' || ext === '.yml') format = 'yaml';
    
    return this.parseManifest(content, format);
  }

  /**
   * Discover and load all agent profiles from a directory
   */
  discoverAgentProfiles(directory: string): AgentProfile[] {
    if (!fs.existsSync(directory)) {
      throw new Error(`Directory not found: ${directory}`);
    }
    
    const profiles: AgentProfile[] = [];
    const files = fs.readdirSync(directory);
    
    for (const file of files) {
      const filePath = path.join(directory, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isFile()) {
        const ext = path.extname(file).toLowerCase();
        if (['.json', '.yaml', '.yml'].includes(ext) && file.includes('agent')) {
          try {
            const profile = this.loadAgentProfile(filePath);
            profiles.push(profile);
          } catch (error) {
            console.warn(`Failed to load agent profile from ${file}:`, error);
          }
        }
      }
    }
    
    return profiles;
  }

  /**
   * Discover and load all workflows from a directory
   */
  discoverWorkflows(directory: string): Workflow[] {
    if (!fs.existsSync(directory)) {
      throw new Error(`Directory not found: ${directory}`);
    }
    
    const workflows: Workflow[] = [];
    const files = fs.readdirSync(directory);
    
    for (const file of files) {
      const filePath = path.join(directory, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isFile()) {
        const ext = path.extname(file).toLowerCase();
        if (['.json', '.yaml', '.yml'].includes(ext) && file.includes('workflow')) {
          try {
            const workflow = this.loadWorkflow(filePath);
            workflows.push(workflow);
          } catch (error) {
            console.warn(`Failed to load workflow from ${file}:`, error);
          }
        }
      }
    }
    
    return workflows;
  }

  /**
   * Validate agent profile
   */
  validateAgentProfile(profile: any): { valid: boolean; errors: string[] } {
    try {
      AgentProfileSchema.parse(profile);
      return { valid: true, errors: [] };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        };
      }
      return { valid: false, errors: [error instanceof Error ? error.message : 'Unknown error'] };
    }
  }

  /**
   * Validate workflow
   */
  validateWorkflow(workflow: any): { valid: boolean; errors: string[] } {
    try {
      WorkflowSchema.parse(workflow);
      return { valid: true, errors: [] };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        };
      }
      return { valid: false, errors: [error instanceof Error ? error.message : 'Unknown error'] };
    }
  }

  /**
   * Convert agent profile to database format
   */
  toDatabaseFormat(profile: AgentProfile): any {
    return {
      name: profile.name,
      role: profile.role || '',
      tone: profile.tone,
      vibe: profile.vibe,
      signature: profile.signature,
      summary: profile.summary,
      version: profile.version,
      meta: {
        ...profile.meta,
        ...(profile.theme ? { theme: profile.theme } : {}),
        ...(profile.inputs ? { inputs: profile.inputs } : {}),
        ...(profile.outputs ? { outputs: profile.outputs } : {}),
        ...(profile.danger ? { danger: profile.danger } : {}),
        ...(profile.timeout ? { timeout: profile.timeout } : {}),
        ...(profile.retries ? { retries: profile.retries } : {}),
        ...(profile.dependencies ? { dependencies: profile.dependencies } : {}),
        ...(profile.requirements ? { requirements: profile.requirements } : {}),
      },
      changelog: profile.changelog || [],
      tools: profile.tools || [],
      datasets: [...(profile.datasets || []), ...(profile.datasources || [])],
      playbooks: profile.playbooks || [],
      guardrails: profile.guardrails || [],
      handoffs: profile.handoffs || [],
      kpis: profile.kpis || {},
      evals: profile.evals || [],
      cadence: profile.cadence,
      ab_test: profile.ab_test,
    };
  }

  /**
   * Convert workflow to database format
   */
  workflowToDatabaseFormat(workflow: Workflow): any {
    return {
      name: workflow.name,
      description: workflow.description,
      version: workflow.version,
      meta: {
        ...workflow.meta,
        ...(workflow.parallel ? { parallel: workflow.parallel } : {}),
        ...(workflow.timeout ? { timeout: workflow.timeout } : {}),
        ...(workflow.retries ? { retries: workflow.retries } : {}),
        ...(workflow.triggers ? { triggers: workflow.triggers } : {}),
        ...(workflow.conditions ? { conditions: workflow.conditions } : {}),
        ...(workflow.inputs ? { inputs: workflow.inputs } : {}),
        ...(workflow.outputs ? { outputs: workflow.outputs } : {}),
        ...(workflow.tags ? { tags: workflow.tags } : {}),
        ...(workflow.dependencies ? { dependencies: workflow.dependencies } : {}),
        ...(workflow.requirements ? { requirements: workflow.requirements } : {}),
      },
      steps: workflow.steps.map((step, index) => ({
        order: index,
        agentName: step.agent,
        action: step.action,
        inputs: step.inputs,
        outputs: step.outputs,
        meta: {
          ...(step.condition ? { condition: step.condition } : {}),
          ...(step.timeout ? { timeout: step.timeout } : {}),
          ...(step.retries ? { retries: step.retries } : {}),
          ...(step.onError ? { onError: step.onError } : {}),
          ...(step.fallback ? { fallback: step.fallback } : {}),
        },
      })),
    };
  }

  /**
   * Generate agent profile template
   */
  generateAgentTemplate(name: string): AgentProfile {
    return {
      name,
      role: 'Assistant',
      tone: 'Professional',
      vibe: 'Helpful',
      signature: `I'm ${name}, here to help you.`,
      summary: `${name} is an AI assistant designed to help with various tasks.`,
      version: '2.0.0',
      tools: [],
      datasets: [],
      playbooks: [],
      guardrails: ['Stay helpful and harmless'],
      handoffs: [],
      kpis: {},
      evals: [],
      meta: {},
      changelog: ['Initial version'],
    };
  }

  /**
   * Generate workflow template
   */
  generateWorkflowTemplate(name: string): Workflow {
    return {
      name,
      description: `${name} workflow`,
      version: '1.0.0',
      steps: [
        {
          agent: 'example-agent',
          action: 'process',
          inputs: {},
          outputs: {},
        }
      ],
      meta: {},
      tags: [],
    };
  }
}
