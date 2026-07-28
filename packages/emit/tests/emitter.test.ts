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
    publicDiscovery: {
      capabilities: [{ name: 'Public capability', description: 'Public description' }],
      skills: [
        {
          name: 'Public skill',
          version: '1.0.0',
          description: 'Public skill description',
        },
      ],
    },
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
        name: 'Private agent',
        cliCommand: 'private-cli',
        primaryModel: 'private-model',
        costInputPerMillion: 3,
        costOutputPerMillion: 15,
        contextWindow: { input: 200000, output: 8000 },
        latencyClass: 'Medium',
        reliability: 9.2,
        primaryFailureModes: ['private failure mode'],
        bestFor: 'private runtime capability',
      },
    ],
    skills: [
      {
        name: 'private-skill',
        description: 'private skill description',
        triggers: ['private trigger'],
        priority: 'high',
        version: '9.9.9',
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
    'Private agent',
    'private-cli',
    'private-model',
    'private failure mode',
    'private runtime capability',
    'private-skill',
    'private skill description',
    'private trigger',
    'private-repository',
    'private health command',
    '200000',
  ];

  it('projects only the explicit public allowlist', () => {
    expect(projectPublicDiscovery(mockProfile)).toEqual({
      schemaVersion: '2.0.0',
      projection: 'public',
      capabilities: [{ name: 'Public capability', description: 'Public description' }],
      skills: [
        {
          name: 'Public skill',
          version: '1.0.0',
          description: 'Public skill description',
        },
      ],
    });
  });

  it('generates a public-safe llms.txt', () => {
    const text = generateLlmsText(mockProfile);
    expect(text).toContain('# Agentic Intelligence System — Public Discovery');
    expect(text).toContain('Public capability');
    expect(text).toContain('Public skill');
    for (const marker of privateMarkers) expect(text).not.toContain(marker);
  });

  it('generates a public-safe agents.json', () => {
    const json = generateAgentsJson(mockProfile);
    const parsed = JSON.parse(json);
    expect(parsed.schemaVersion).toBe('2.0.0');
    expect(parsed.projection).toBe('public');
    expect(parsed.capabilities[0]).toEqual({
      name: 'Public capability',
      description: 'Public description',
    });
    expect(parsed).not.toHaveProperty('workstation');
    expect(parsed).not.toHaveProperty('harnesses');
    expect(parsed).not.toHaveProperty('agents');
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
