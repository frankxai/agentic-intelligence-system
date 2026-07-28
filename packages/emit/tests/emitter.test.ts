import { describe, it, expect } from 'vitest';
import type { SystemProfile } from '@frankx-ai/ais-core';
import {
  generateLlmsText,
  generateAgentsJson,
  generateJsonLd,
  projectPublicDiscovery,
} from '../src/emitter.js';

describe('AIS Emitter', () => {
  const mockProfile: SystemProfile = {
    workstation: {
      machineName: 'Private Yoga Laptop',
      os: 'Private OS',
      totalRamGb: 16,
      totalDiskGb: 512,
      capacityGuidelines: {
        maxParallelSessions: 5,
        memoryThresholds: { green: 4, yellow: 2, red: 1 },
      },
    },
    agents: [
      {
        name: 'Claude Code',
        cliCommand: 'private-cli',
        primaryModel: 'private-model',
        costInputPerMillion: 3,
        costOutputPerMillion: 15,
        contextWindow: { input: 200000, output: 8000 },
        latencyClass: 'Medium',
        reliability: 9.2,
        primaryFailureModes: ['private failure mode'],
        bestFor: 'Refactoring',
      },
    ],
    skills: [
      {
        name: 'agent-manager-skill',
        description: 'Orchestration rules',
        triggers: ['private trigger'],
        priority: 'high',
        version: '1.0.0',
      },
    ],
    harnesses: {
      'private-repository': {
        riskLevel: 'private',
        healthCommand: 'private health command',
        agentFiles: ['AGENTS.md'],
        deployPolicy: 'manual',
        globalHooksAllowed: false,
      },
    },
  };

  const privateMarkers = [
    'Private Yoga Laptop',
    'Private OS',
    'private-cli',
    'private-model',
    'private failure mode',
    'private trigger',
    'private-repository',
    'private health command',
    '200000',
    '15',
  ];

  it('projects only public-safe capabilities and skills', () => {
    expect(projectPublicDiscovery(mockProfile)).toEqual({
      schemaVersion: '2.0.0',
      projection: 'public',
      capabilities: [{ name: 'Claude Code', description: 'Refactoring' }],
      skills: [
        {
          name: 'agent-manager-skill',
          version: '1.0.0',
          description: 'Orchestration rules',
        },
      ],
    });
  });

  it('generates a public-safe llms.txt', () => {
    const text = generateLlmsText(mockProfile);
    expect(text).toContain('# Agentic Intelligence System — Public Discovery');
    expect(text).toContain('Claude Code');
    expect(text).toContain('agent-manager-skill');
    for (const marker of privateMarkers) expect(text).not.toContain(marker);
  });

  it('generates a public-safe agents.json', () => {
    const json = generateAgentsJson(mockProfile);
    const parsed = JSON.parse(json);
    expect(parsed.schemaVersion).toBe('2.0.0');
    expect(parsed.projection).toBe('public');
    expect(parsed.capabilities[0]).toEqual({
      name: 'Claude Code',
      description: 'Refactoring',
    });
    expect(parsed).not.toHaveProperty('workstation');
    expect(parsed).not.toHaveProperty('harnesses');
    for (const marker of privateMarkers) expect(json).not.toContain(marker);
  });

  it('generates public-safe JSON-LD', () => {
    const json = generateJsonLd(mockProfile);
    const parsed = JSON.parse(json);
    expect(parsed['@type']).toBe('SoftwareApplication');
    expect(parsed).not.toHaveProperty('operatingSystem');
    for (const marker of privateMarkers) expect(json).not.toContain(marker);
  });
});
