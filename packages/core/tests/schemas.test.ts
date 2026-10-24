import { describe, it, expect } from 'vitest';
import { AgentSchema, SkillSchema, HarnessSchema, WorkstationSchema } from '../src/schemas.js';

describe('Schemas', () => {
  describe('AgentSchema', () => {
    const validAgent = {
      name: 'Test Agent',
      cliCommand: 'test-agent',
      primaryModel: 'gpt-4',
      costInputPerMillion: 10,
      costOutputPerMillion: 30,
      contextWindow: {
        input: 128000,
        output: 4096,
      },
      latencyClass: 'Fast',
      reliability: 9,
      primaryFailureModes: ['timeout'],
      bestFor: 'coding',
    };

    it('should validate a valid agent', () => {
      const result = AgentSchema.safeParse(validAgent);
      expect(result.success).toBe(true);
    });

    it('should fail if reliability is out of bounds', () => {
      const result = AgentSchema.safeParse({ ...validAgent, reliability: 11 });
      expect(result.success).toBe(false);

      const result2 = AgentSchema.safeParse({ ...validAgent, reliability: -1 });
      expect(result2.success).toBe(false);
    });

    it('should fail if latencyClass is invalid', () => {
      const result = AgentSchema.safeParse({ ...validAgent, latencyClass: 'Super-Fast' });
      expect(result.success).toBe(false);
    });
  });

  describe('SkillSchema', () => {
    const validSkill = {
      name: 'Test Skill',
      description: 'A test skill',
      triggers: ['test'],
      priority: 'high',
      version: '1.0.0',
    };

    it('should validate a valid skill', () => {
      const result = SkillSchema.safeParse(validSkill);
      expect(result.success).toBe(true);
    });

    it('should validate a valid skill with optional author', () => {
      const result = SkillSchema.safeParse({ ...validSkill, author: 'Author' });
      expect(result.success).toBe(true);
    });

    it('should fail if priority is invalid', () => {
      const result = SkillSchema.safeParse({ ...validSkill, priority: 'critical' });
      expect(result.success).toBe(false);
    });
  });

  describe('HarnessSchema', () => {
    const validHarness = {
      riskLevel: 'production',
      healthCommand: 'npm test',
      agentFiles: ['agent.ts'],
      deployPolicy: 'manual',
      globalHooksAllowed: true,
    };

    it('should validate a valid harness', () => {
      const result = HarnessSchema.safeParse(validHarness);
      expect(result.success).toBe(true);
    });

    it('should validate a valid harness with optional fields', () => {
      const result = HarnessSchema.safeParse({
        ...validHarness,
        pushPolicy: 'feature-only',
        owner: 'user'
      });
      expect(result.success).toBe(true);
    });

    it('should fail if riskLevel is invalid', () => {
      const result = HarnessSchema.safeParse({ ...validHarness, riskLevel: 'unknown' });
      expect(result.success).toBe(false);
    });
  });

  describe('WorkstationSchema', () => {
    const validWorkstation = {
      machineName: 'Dev Machine',
      os: 'Linux',
      totalRamGb: 32,
      totalDiskGb: 1000,
      capacityGuidelines: {
        maxParallelSessions: 4,
        memoryThresholds: {
          green: 16,
          yellow: 8,
          red: 4,
        },
      },
    };

    it('should validate a valid workstation', () => {
      const result = WorkstationSchema.safeParse(validWorkstation);
      expect(result.success).toBe(true);
    });

    it('should fail if required fields are missing', () => {
      const result = WorkstationSchema.safeParse({ machineName: 'Dev Machine' });
      expect(result.success).toBe(false);
    });
  });
});
