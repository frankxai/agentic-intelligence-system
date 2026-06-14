import { describe, it, expect } from 'vitest';
import type { SystemProfile } from '@frankx-ai/ais-core';
import { generateLlmsText, generateAgentsJson, generateJsonLd } from '../src/emitter.js';

describe('AIS Emitter', () => {
  const mockProfile: SystemProfile = {
    workstation: {
      machineName: 'Yoga Laptop',
      os: 'Windows 11',
      totalRamGb: 16,
      totalDiskGb: 512,
      capacityGuidelines: {
        maxParallelSessions: 5,
        memoryThresholds: { green: 4, yellow: 2, red: 1 }
      }
    },
    agents: [
      {
        name: 'Claude Code',
        cliCommand: 'cl',
        primaryModel: 'claude-3-5-sonnet',
        costInputPerMillion: 3,
        costOutputPerMillion: 15,
        contextWindow: { input: 200000, output: 8000 },
        latencyClass: 'Medium',
        reliability: 9.2,
        primaryFailureModes: ['Context limits'],
        bestFor: 'Refactoring'
      }
    ],
    skills: [
      {
        name: 'agent-manager-skill',
        description: 'Orchestration rules',
        triggers: ['harness'],
        priority: 'high',
        version: '1.0.0'
      }
    ],
    harnesses: {
      FrankX: {
        riskLevel: 'private',
        healthCommand: 'npm run health',
        agentFiles: ['AGENTS.md'],
        deployPolicy: 'manual',
        globalHooksAllowed: false
      }
    }
  };

  it('should generate properly structured llms.txt', () => {
    const text = generateLlmsText(mockProfile);
    expect(text).toContain('# Agentic Intelligence System - LLMs Discovery');
    expect(text).toContain('Claude Code');
    expect(text).toContain('agent-manager-skill');
    expect(text).toContain('FrankX');
  });

  it('should generate valid parseable agents.json', () => {
    const jsonStr = generateAgentsJson(mockProfile);
    const parsed = JSON.parse(jsonStr);
    expect(parsed.schemaVersion).toBe('1.0.0');
    expect(parsed.agents[0].name).toBe('Claude Code');
  });

  it('should generate valid JSON-LD schema', () => {
    const jsonStr = generateJsonLd(mockProfile);
    const parsed = JSON.parse(jsonStr);
    expect(parsed['@type']).toBe('SoftwareApplication');
  });
});
