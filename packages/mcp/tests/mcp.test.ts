import { describe, it, expect } from 'vitest';
import { server } from '../src/index.js';
import type {
  ListToolsRequest,
  CallToolRequest,
  ListToolsResult,
  CallToolResult,
} from '@modelcontextprotocol/sdk/types.js';

type ServerWithHandlers = {
  _requestHandlers: Map<string, (request: unknown) => Promise<unknown>>;
};

describe('MCP server', () => {
  it('registers expected tools', async () => {
    const handlers = (server as unknown as ServerWithHandlers)._requestHandlers;
    const listHandler = handlers.get('tools/list') as (req: ListToolsRequest) => Promise<ListToolsResult>;
    expect(listHandler).toBeDefined();

    const result = await listHandler({ method: 'tools/list', params: {} } as unknown as ListToolsRequest);
    const toolNames = result.tools.map((t: { name: string }) => t.name);

    expect(toolNames).toContain('list_agents');
    expect(toolNames).toContain('get_routing_recommendation');
    expect(toolNames).toContain('get_machine_capacity');
    expect(toolNames).toContain('get_repo_harness');
    expect(toolNames.length).toBe(4);
  });

  it('get_repo_harness handles missing repository', async () => {
    const handlers = (server as unknown as ServerWithHandlers)._requestHandlers;
    const callHandler = handlers.get('tools/call') as (req: CallToolRequest) => Promise<CallToolResult>;
    expect(callHandler).toBeDefined();

    const result = await callHandler({
      method: 'tools/call',
      params: { name: 'get_repo_harness', arguments: { repoName: 'unknown-repo' } }
    } as unknown as CallToolRequest);

    expect(result.isError).toBe(true);
    expect((result.content[0] as { text: string }).text).toContain('No harness configuration found');
  });

  it('list_agents returns agents', async () => {
    const handlers = (server as unknown as ServerWithHandlers)._requestHandlers;
    const callHandler = handlers.get('tools/call') as (req: CallToolRequest) => Promise<CallToolResult>;
    expect(callHandler).toBeDefined();

    const result = await callHandler({
      method: 'tools/call',
      params: { name: 'list_agents', arguments: {} }
    } as unknown as CallToolRequest);

    expect(result.isError).toBeUndefined();
    expect(result.content[0].type).toBe('text');
    expect((result.content[0] as { text: string }).text).toBe('[]'); // Since the default profile has an empty agents array
  });

  it('get_machine_capacity returns workstation machine data', async () => {
    const handlers = (server as unknown as ServerWithHandlers)._requestHandlers;
    const callHandler = handlers.get('tools/call') as (req: CallToolRequest) => Promise<CallToolResult>;

    const result = await callHandler({
      method: 'tools/call',
      params: { name: 'get_machine_capacity', arguments: {} }
    } as unknown as CallToolRequest);

    expect(result.isError).toBeUndefined();
    expect(result.content[0].type).toBe('text');
    expect((result.content[0] as { text: string }).text).toContain('Local workstation');
  });
});
