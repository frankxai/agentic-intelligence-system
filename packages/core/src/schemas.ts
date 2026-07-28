import { z } from 'zod';

/**
 * Schema for an individual AI coding agent in the private runtime fleet registry.
 */
export const AgentSchema = z.object({
  name: z.string(),
  cliCommand: z.string(),
  primaryModel: z.string(),
  costInputPerMillion: z.number(),
  costOutputPerMillion: z.number(),
  contextWindow: z.object({
    input: z.number(),
    output: z.number(),
  }),
  latencyClass: z.enum(['Ultra-Fast', 'Fast', 'Medium-Fast', 'Medium', 'Slow']),
  reliability: z.number().min(0).max(10),
  primaryFailureModes: z.array(z.string()),
  bestFor: z.string(),
});

export type Agent = z.infer<typeof AgentSchema>;

/**
 * Schema for modular agentic skills available globally or per repository.
 */
export const SkillSchema = z.object({
  name: z.string(),
  description: z.string(),
  triggers: z.array(z.string()),
  priority: z.enum(['low', 'medium', 'high']),
  version: z.string(),
  author: z.string().optional(),
});

export type Skill = z.infer<typeof SkillSchema>;

/**
 * Schema for repository-level agent harnesses and safety gates.
 */
export const HarnessSchema = z.object({
  riskLevel: z.enum(['production', 'private', 'library', 'template', 'backup-sensitive']),
  healthCommand: z.string(),
  agentFiles: z.array(z.string()),
  deployPolicy: z.enum(['manual', 'none', 'vercel-main', 'forbidden']),
  globalHooksAllowed: z.boolean(),
  pushPolicy: z.enum(['feature-only', 'manual', 'forbidden']).optional(),
  owner: z.string().optional(),
});

export type Harness = z.infer<typeof HarnessSchema>;

/**
 * Schema for local workstation hardware profiles.
 */
export const WorkstationSchema = z.object({
  machineName: z.string(),
  os: z.string(),
  totalRamGb: z.number(),
  totalDiskGb: z.number(),
  capacityGuidelines: z.object({
    maxParallelSessions: z.number(),
    memoryThresholds: z.object({
      green: z.number(),
      yellow: z.number(),
      red: z.number(),
    }),
  }),
});

export type Workstation = z.infer<typeof WorkstationSchema>;

/**
 * Explicit allowlist for public discovery. Emitters read only this section;
 * local runtime fields never become public merely because the profile grows.
 */
export const PublicDiscoverySchema = z.object({
  capabilities: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
    })
  ),
  skills: z.array(
    z.object({
      name: z.string(),
      version: z.string(),
      description: z.string(),
    })
  ),
});

export type PublicDiscovery = z.infer<typeof PublicDiscoverySchema>;

/**
 * Root schema combining the Agentic Intelligence System profile.
 */
export const SystemProfileSchema = z.object({
  publicDiscovery: PublicDiscoverySchema,
  workstation: WorkstationSchema,
  agents: z.array(AgentSchema),
  skills: z.array(SkillSchema),
  harnesses: z.record(z.string(), HarnessSchema),
});

export type SystemProfile = z.infer<typeof SystemProfileSchema>;
