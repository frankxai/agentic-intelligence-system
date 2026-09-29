import { describe, it, expect, afterEach } from 'vitest';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// vitest injects __dirname into ES modules, so the installer has to be run
// by plain Node from its compiled output to see the failure that users see.
const compiledInstaller = path.resolve(__dirname, '..', 'dist', 'installer.js');

describe.skipIf(!fs.existsSync(compiledInstaller))('AIS skills installer (compiled)', () => {
  let tempHome: string | undefined;

  afterEach(() => {
    if (tempHome) fs.rmSync(tempHome, { recursive: true, force: true });
  });

  it('copies the bundled skill templates into ~/.agents/skills', () => {
    tempHome = fs.mkdtempSync(path.join(os.tmpdir(), 'ais-skills-'));
    const run = spawnSync(process.execPath, [compiledInstaller], {
      env: { ...process.env, HOME: tempHome, USERPROFILE: tempHome },
      encoding: 'utf8',
    });

    expect(run.stderr).not.toContain('__dirname is not defined');
    expect(run.status).toBe(0);
    for (const skill of ['agent-manager-skill', 'model-routing']) {
      expect(fs.existsSync(path.join(tempHome, '.agents', 'skills', skill, 'SKILL.md'))).toBe(true);
    }
  });
});
