import { describe, it, expect } from 'vitest';
import { server } from '../src/index.js';

describe('MCP server', () => {
  it('registers expected tools', async () => {
    const handlers = (server as any)._requestHandlers;
    const listHandler = handlers.get('tools/list');
    expect(listHandler).toBeDefined();

    const result = await listHandler({ method: 'tools/list', params: {} } as any);
    const toolNames = result.tools.map((t: any) => t.name);

    expect(toolNames).toContain('list_agents');
    expect(toolNames).toContain('get_routing_recommendation');
    expect(toolNames).toContain('get_machine_capacity');
    expect(toolNames).toContain('get_repo_harness');
    expect(toolNames.length).toBe(4);
  });

  it('get_repo_harness handles missing repository', async () => {
    const handlers = (server as any)._requestHandlers;
    const callHandler = handlers.get('tools/call');
    expect(callHandler).toBeDefined();

    const result = await callHandler({
      method: 'tools/call',
      params: { name: 'get_repo_harness', arguments: { repoName: 'unknown-repo' } }
    } as any);

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('No harness configuration found');
  });

  it('list_agents returns agents', async () => {
    const handlers = (server as any)._requestHandlers;
    const callHandler = handlers.get('tools/call');
    expect(callHandler).toBeDefined();

    const result = await callHandler({
      method: 'tools/call',
      params: { name: 'list_agents', arguments: {} }
    } as any);

    expect(result.isError).toBeUndefined();
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toBe('[]'); // Since the default profile has an empty agents array
  });

  it('get_machine_capacity returns workstation machine data', async () => {
    const handlers = (server as any)._requestHandlers;
    const callHandler = handlers.get('tools/call');

    const result = await callHandler({
      method: 'tools/call',
      params: { name: 'get_machine_capacity', arguments: {} }
    } as any);

    expect(result.isError).toBeUndefined();
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('Local workstation');
  });
});
