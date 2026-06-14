import type { SystemProfile } from '@frankx-ai/ais-core';

/**
 * Generates llms.txt content, a standard listing format for LLM crawler searchability.
 */
export function generateLlmsText(profile: SystemProfile): string {
  let output = `# Agentic Intelligence System - LLMs Discovery

This file lists the active AI coding agents, skills, and safety boundaries configured for the workstation/organization.

## Active Workstation
- Machine: ${profile.workstation.machineName} (${profile.workstation.os})
- Specifications: RAM ${profile.workstation.totalRamGb}GB, Parallel session capacity ${profile.workstation.capacityGuidelines.maxParallelSessions}

## Coding Agent Fleet
`;

  for (const agent of profile.agents) {
    output += `
### ${agent.name} (\`${agent.cliCommand}\`)
- Primary LLM: \`${agent.primaryModel}\`
- Specs: Context ${agent.contextWindow.input / 1000}k in / ${agent.contextWindow.output / 1000}k out, Latency: ${agent.latencyClass}
- Cost: \$${agent.costInputPerMillion}/1M in, \$${agent.costOutputPerMillion}/1M out
- Strengths: ${agent.bestFor}
- Failure Modes: ${agent.primaryFailureModes.join(', ')}
`;
  }

  output += `\n## Global Skills Registry\n`;
  for (const skill of profile.skills) {
    output += `
### ${skill.name} (v${skill.version})
- Triggers: ${skill.triggers.map((t) => `\`${t}\``).join(', ')}
- Description: ${skill.description}
- Priority: ${skill.priority}
`;
  }

  output += `\n## Repositories Harness & Safety Policies\n`;
  for (const [repo, harness] of Object.entries(profile.harnesses)) {
    output += `
### Repository: \`${repo}\`
- Risk Level: \`${harness.riskLevel}\`
- Stance: ${harness.globalHooksAllowed ? 'Global hooks active' : 'Scoped local harness only'}
- Verification: run \`${harness.healthCommand}\` to verify health.
- Deployment Policy: \`${harness.deployPolicy}\`
`;
  }

  return output.trim();
}

/**
 * Generates a standard JSON representation of the fleet capabilities.
 */
export function generateAgentsJson(profile: SystemProfile): string {
  return JSON.stringify(
    {
      schemaVersion: '1.0.0',
      workstation: {
        name: profile.workstation.machineName,
        os: profile.workstation.os,
      },
      agents: profile.agents.map((a) => ({
        name: a.name,
        cli: a.cliCommand,
        model: a.primaryModel,
        window: `${a.contextWindow.input / 1000}k`,
        latency: a.latencyClass,
        bestFor: a.bestFor,
      })),
      skills: profile.skills.map((s) => ({
        name: s.name,
        version: s.version,
        triggers: s.triggers,
        description: s.description,
      })),
      harnesses: Object.entries(profile.harnesses).map(([name, h]) => ({
        repo: name,
        risk: h.riskLevel,
        verify: h.healthCommand,
      })),
    },
    null,
    2
  );
}

/**
 * Generates JSON-LD Structured Data (Schema.org compliant) for website SEO/discovery.
 */
export function generateJsonLd(profile: SystemProfile): string {
  return JSON.stringify(
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Agentic Intelligence System (AIS)',
      description: 'The Agent discoverability and routing substrate.',
      operatingSystem: profile.workstation.os,
      applicationCategory: 'DeveloperApplication',
      offers: {
        '@type': 'Offer',
        price: '0.00',
        priceCurrency: 'USD',
      },
      creator: {
        '@type': 'Organization',
        name: 'FrankX AI',
      },
      additionalType: 'https://schema.org/CreativeWork',
      about: profile.agents.map((a) => ({
        '@type': 'CreativeWork',
        name: a.name,
        description: `Agent using model ${a.primaryModel} best for ${a.bestFor}`,
      })),
    },
    null,
    2
  );
}
