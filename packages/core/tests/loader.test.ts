import { describe, it, expect } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';
import { loadPublicProfile, loadRuntimeProfile, loadSystemProfile } from '../src/loader.js';

describe('AIS profile loaders', () => {
  const mockYamlPath = path.join(__dirname, 'mock-profile.yaml');

  function withProfile(contents: string, assertion: () => void) {
    fs.writeFileSync(mockYamlPath, contents);
    try {
      assertion();
    } finally {
      if (fs.existsSync(mockYamlPath)) fs.unlinkSync(mockYamlPath);
    }
  }

  it('loads the public allowlist without runtime data', () => {
    withProfile(
      `
publicDiscovery:
  capabilities:
    - name: "Public capability"
      description: "Public description"
  skills:
    - name: "Public skill"
      version: "1.0.0"
      description: "Public skill description"
`,
      () => {
        const profile = loadPublicProfile(mockYamlPath);
        expect(profile.publicDiscovery.capabilities[0]?.name).toBe('Public capability');
      }
    );
  });

  it('loads a local runtime profile without public discovery data', () => {
    withProfile(
      `
workstation:
  machineName: "Local machine"
  os: "Local OS"
  totalRamGb: 16
  totalDiskGb: 512
  capacityGuidelines:
    maxParallelSessions: 5
    memoryThresholds:
      green: 4
      yellow: 2
      red: 1
agents: []
skills: []
harnesses: {}
`,
      () => {
        const profile = loadRuntimeProfile(mockYamlPath);
        expect(profile.workstation.machineName).toBe('Local machine');
      }
    );
  });

  it('rejects runtime fields in the public profile', () => {
    withProfile(
      `
publicDiscovery:
  capabilities: []
  skills: []
workstation:
  machineName: "must stay local"
`,
      () => {
        expect(() => loadPublicProfile(mockYamlPath)).toThrow(/AIS Public Profile validation failed/);
      }
    );
  });

  it('loads a combined system profile successfully', () => {
    withProfile(
      `
publicDiscovery:
  capabilities:
    - name: "Public capability"
      description: "Public description"
  skills: []
workstation:
  machineName: "Local machine"
  os: "Local OS"
  totalRamGb: 16
  totalDiskGb: 512
  capacityGuidelines:
    maxParallelSessions: 5
    memoryThresholds:
      green: 4
      yellow: 2
      red: 1
agents: []
skills: []
harnesses: {}
`,
      () => {
        const profile = loadSystemProfile(mockYamlPath);
        expect(profile.publicDiscovery.capabilities[0]?.name).toBe('Public capability');
        expect(profile.workstation.machineName).toBe('Local machine');
      }
    );
  });

  it('throws an error if file does not exist', () => {
    const missingPath = path.join(__dirname, 'does-not-exist.yaml');
    expect(() => loadPublicProfile(missingPath)).toThrow(/file not found at path:/);
  });

  it('throws an error if yaml is empty', () => {
    withProfile('', () => {
      expect(() => loadPublicProfile(mockYamlPath)).toThrow(/is invalid or empty YAML at path:/);
    });
  });

  it('throws an error if yaml is invalid type (e.g. string)', () => {
    withProfile('"just a string"', () => {
      expect(() => loadPublicProfile(mockYamlPath)).toThrow(/is invalid or empty YAML at path:/);
    });
  });
});
