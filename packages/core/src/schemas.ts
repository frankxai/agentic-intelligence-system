import { z } from 'zod';

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

export const SkillSchema = z.object({
  name: z.string(),
  description: z.string(),
  triggers: z.array(z.string()),
  priority: z.enum(['low', 'medium', 'high']),
  version: z.string(),
  author: z.string().optional(),
});
export type Skill = z.infer<typeof SkillSchema>;

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

export const PublicDiscoverySchema = z.object({
  capabilities: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
    }).strict()
  ),
  skills: z.array(
    z.object({
      name: z.string(),
      version: z.string(),
      description: z.string(),
    }).strict()
  ),
}).strict();
export type PublicDiscovery = z.infer<typeof PublicDiscoverySchema>;

export const PublicProfileSchema = z.object({
  publicDiscovery: PublicDiscoverySchema,
}).strict();
export type PublicProfile = z.infer<typeof PublicProfileSchema>;

export const RuntimeProfileSchema = z.object({
  workstation: WorkstationSchema,
  agents: z.array(AgentSchema),
  skills: z.array(SkillSchema),
  harnesses: z.record(z.string(), HarnessSchema),
}).strict();
export type RuntimeProfile = z.infer<typeof RuntimeProfileSchema>;

/**
 * Legacy combined schema for callers that intentionally keep both trust
 * domains in a non-public location. Public builds and MCP runtime use their
 * narrower schemas directly.
 */
export const SystemProfileSchema = PublicProfileSchema.merge(RuntimeProfileSchema);
export type SystemProfile = z.infer<typeof SystemProfileSchema>;
