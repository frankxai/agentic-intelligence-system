import { describe, it, expect } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';
import { loadSystemProfile } from '../src/loader.js';

describe('AIS Profile Loader', () => {
  const mockYamlPath = path.join(__dirname, 'mock-profile.yaml');

  it('should successfully load and validate a well-formed profile', () => {
    const validProfileContent = `
workstation:
  machineName: "Yoga Laptop"
  os: "Windows 11"
  totalRamGb: 16
  totalDiskGb: 512
  capacityGuidelines:
    maxParallelSessions: 5
    memoryThresholds:
      green: 4
      yellow: 2
      red: 1
agents:
  - name: "Claude Code"
    cliCommand: "cl"
    primaryModel: "claude-3-5-sonnet"
    costInputPerMillion: 3.0
    costOutputPerMillion: 15.0
    contextWindow:
      input: 200000
      output: 8000
    latencyClass: "Medium"
    reliability: 9.2
    primaryFailureModes:
      - "Context exhaustion"
    bestFor: "Complex refactors"
skills:
  - name: "agent-manager-skill"
    description: "Orchestrate agent activities"
    triggers:
      - "harness"
    priority: "high"
    version: "1.0.0"
harnesses:
  FrankX:
    riskLevel: "private"
    healthCommand: "npm run health"
    agentFiles:
      - "AGENTS.md"
    deployPolicy: "manual"
    globalHooksAllowed: false
`;
    fs.writeFileSync(mockYamlPath, validProfileContent);

    try {
      const profile = loadSystemProfile(mockYamlPath);
      expect(profile.workstation.machineName).toBe('Yoga Laptop');
      expect(profile.agents[0]?.name).toBe('Claude Code');
      expect(profile.skills[0]?.name).toBe('agent-manager-skill');
      expect(profile.harnesses['FrankX']?.riskLevel).toBe('private');
    } finally {
      if (fs.existsSync(mockYamlPath)) {
        fs.unlinkSync(mockYamlPath);
      }
    }
  });

  it('should throw an error on invalid schema data', () => {
    const invalidProfileContent = `
workstation:
  machineName: "Yoga Laptop"
  os: "Windows 11"
  totalRamGb: "not-a-number" # Invalid type
`;
    fs.writeFileSync(mockYamlPath, invalidProfileContent);

    try {
      expect(() => loadSystemProfile(mockYamlPath)).toThrow(/AIS Profile validation failed/);
    } finally {
      if (fs.existsSync(mockYamlPath)) {
        fs.unlinkSync(mockYamlPath);
      }
    }
  });
});
