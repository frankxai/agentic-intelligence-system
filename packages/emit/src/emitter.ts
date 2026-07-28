import type { PublicProfile } from '@frankx-ai/ais-core';

export interface PublicDiscoveryProfile {
  schemaVersion: '2.0.0';
  projection: 'public';
  capabilities: Array<{
    name: string;
    description: string;
  }>;
  skills: Array<{
    name: string;
    version: string;
    description: string;
  }>;
}

/**
 * Projects the explicitly allowlisted public section. Workstation details, CLI
 * aliases, models, pricing, context windows, failure modes, and repository
 * policies cannot cross this boundary when private profile fields change.
 */
export function projectPublicDiscovery(profile: PublicProfile): PublicDiscoveryProfile {
  return {
    schemaVersion: '2.0.0',
    projection: 'public',
    capabilities: profile.publicDiscovery.capabilities.map(({ name, description }) => ({
      name,
      description,
    })),
    skills: profile.publicDiscovery.skills.map(({ name, version, description }) => ({
      name,
      version,
      description,
    })),
  };
}

/**
 * Generates public llms.txt content from the public-safe projection.
 */
export function generateLlmsText(profile: PublicProfile): string {
  const publicProfile = projectPublicDiscovery(profile);
  let output = `# Agentic Intelligence System — Public Discovery

AIS exposes provider-agnostic capabilities for discovery. Local workstation, routing, model, cost, and repository-policy data remain private to the runtime.

## Capability Registry
`;

  for (const capability of publicProfile.capabilities) {
    output += `
### ${capability.name}
- Capability: ${capability.description}
- Runtime: Provider-agnostic; selected privately for each task.
`;
  }

  output += `\n## Public Skills\n`;
  for (const skill of publicProfile.skills) {
    output += `
### ${skill.name} (v${skill.version})
- Description: ${skill.description}
`;
  }

  return output.trim();
}

/**
 * Generates the public machine-readable capability inventory.
 */
export function generateAgentsJson(profile: PublicProfile): string {
  return JSON.stringify(projectPublicDiscovery(profile), null, 2);
}

/**
 * Generates public JSON-LD without local runtime or provider claims.
 */
export function generateJsonLd(profile: PublicProfile): string {
  const publicProfile = projectPublicDiscovery(profile);
  return JSON.stringify(
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Agentic Intelligence System (AIS)',
      description: 'Provider-agnostic discovery and capability routing for AI agents.',
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
      about: publicProfile.capabilities.map((capability) => ({
        '@type': 'CreativeWork',
        name: capability.name,
        description: capability.description,
      })),
    },
    null,
    2
  );
}
