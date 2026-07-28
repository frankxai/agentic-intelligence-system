import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import path from 'node:path';
import fs from 'node:fs';
import { loadSystemProfile, type SystemProfile } from '@frankx-ai/ais-core';

// Find the profile relative to execution context or default locations
const DEFAULT_PROFILE_PATH = path.join(process.cwd(), 'ais-profile.yaml');

const server = new Server(
  {
    name: 'agent-intelligence-system-mcp',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Helper to load profile safely
function getProfile(): SystemProfile {
  const profilePath = process.env.AIS_PROFILE_PATH || DEFAULT_PROFILE_PATH;
  if (!fs.existsSync(profilePath)) {
    // Return a default fallback configuration if no file is present
    return {
      publicDiscovery: {
        capabilities: [],
        skills: [],
      },
      workstation: {
        machineName: 'Yoga Laptop (Fallback)',
        os: 'Windows 11',
        totalRamGb: 16,
        totalDiskGb: 512,
        capacityGuidelines: {
          maxParallelSessions: 5,
          memoryThresholds: { green: 4, yellow: 2, red: 1 },
        },
      },
      agents: [],
      skills: [],
      harnesses: {},
    };
  }
  return loadSystemProfile(profilePath);
}

// Define available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'list_agents',
        description: 'Lists all AI coding agents configured in this workstation fleet.',
        inputSchema: { type: 'object', properties: {} },
      },
      {
        name: 'get_routing_recommendation',
        description: 'Determines the best coding agent and model for a given task complexity (1-10).',
        inputSchema: {
          type: 'object',
          properties: {
            complexity: {
              type: 'integer',
              description: 'Task complexity level from 1 (trivial) to 10 (architectural substrate).',
              minimum: 1,
              maximum: 10,
            },
            taskDescription: {
              type: 'string',
              description: 'A brief description of what you want to achieve.',
            },
          },
          required: ['complexity'],
        },
      },
      {
        name: 'get_machine_capacity',
        description: 'Checks the workstation capacity to see if it is safe to launch new parallel agent sessions.',
        inputSchema: { type: 'object', properties: {} },
      },
      {
        name: 'get_repo_harness',
        description: 'Gets the safety rules and health-checking command for a specific repository.',
        inputSchema: {
          type: 'object',
          properties: {
            repoName: {
              type: 'string',
              description: 'Name of the repository to look up (e.g. FrankX, SIS, Arcanea).',
            },
          },
          required: ['repoName'],
        },
      },
    ],
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const profile = getProfile();

  switch (name) {
    case 'list_agents': {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(profile.agents, null, 2),
          },
        ],
      };
    }

    case 'get_routing_recommendation': {
      const complexity = (args as { complexity: number }).complexity;
      let recommendedAgent = 'Claude Code';
      let reason = 'Default agent for general tasks.';

      if (complexity >= 1 && complexity <= 3) {
        recommendedAgent = 'OpenCode (groq/llama-4-scout) or Codex';
        reason = 'Trivial task. Groq / Codex minimizes latency and cost.';
      } else if (complexity >= 4 && complexity <= 6) {
        recommendedAgent = 'Cursor / Cline (IDE)';
        reason = 'Medium complexity. Best handled with real-time visual feedback and human guidance.';
      } else if (complexity >= 7 && complexity <= 8) {
        recommendedAgent = 'Claude Code (cl) or Antigravity (agy)';
        reason = 'High complexity. Requires autonomous reasoning loops and testing.';
      } else if (complexity >= 9 && complexity <= 10) {
        recommendedAgent = 'DeepAgent (dcode) or Starlight Hive';
        reason = 'Substrate/Long-horizon task. Requires multi-agent orchestration, compaction, and sandbox.';
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                complexity,
                recommendedAgent,
                reason,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    case 'get_machine_capacity': {
      // Mock capacity reading for illustration
      const maxSessions = profile.workstation.capacityGuidelines.maxParallelSessions;
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                machine: profile.workstation.machineName,
                maxParallelSessions: maxSessions,
                guidelines: 'Check C:\\Users\\frank\\FrankX\\docs\\ops\\MACHINE-STATUS.md for real-time readings.',
              },
              null,
              2
            ),
          },
        ],
      };
    }

    case 'get_repo_harness': {
      const repoName = (args as { repoName: string }).repoName;
      const harness = profile.harnesses[repoName];

      if (!harness) {
        return {
          content: [
            {
              type: 'text',
              text: `No harness configuration found for repository: "${repoName}"`,
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(harness, null, 2),
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// Run standard IO server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('AIS MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in AIS MCP Server:', error);
  process.exit(1);
});
export { server };
