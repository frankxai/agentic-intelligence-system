import { describe, it, expect } from 'vitest';
import type { PublicProfile } from '@frankx-ai/ais-core';
import {
  generateLlmsText,
  generateAgentsJson,
  generateJsonLd,
  projectPublicDiscovery,
} from '../src/emitter.js';

describe('AIS Emitter', () => {
  const mockProfile = {
    publicDiscovery: {
      capabilities: [
        {
          name: 'Public capability',
          description: 'Public description',
          futurePrivateField: 'must-not-serialize',
        },
      ],
      skills: [
        {
          name: 'Public skill',
          version: '1.0.0',
          description: 'Public skill description',
          futurePrivateField: 'must-not-serialize',
        },
      ],
    },
  } as unknown as PublicProfile;

  it('projects only the versioned public fields', () => {
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
    expect(text).not.toContain('must-not-serialize');
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
    expect(json).not.toContain('must-not-serialize');
  });

  it('generates public-safe JSON-LD', () => {
    const json = generateJsonLd(mockProfile);
    const parsed = JSON.parse(json);
    expect(parsed['@type']).toBe('SoftwareApplication');
    expect(parsed).not.toHaveProperty('operatingSystem');
    expect(json).not.toContain('must-not-serialize');
  });
});
