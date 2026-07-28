import fs from 'node:fs';
import yaml from 'js-yaml';
import type { ZodType } from 'zod';
import {
  PublicProfileSchema,
  RuntimeProfileSchema,
  SystemProfileSchema,
  type PublicProfile,
  type RuntimeProfile,
  type SystemProfile,
} from './schemas.js';

function loadProfile<T>(filePath: string, schema: ZodType<T>, label: string): T {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${label} file not found at path: ${filePath}`);
  }

  const parsedYaml = yaml.load(fs.readFileSync(filePath, 'utf8'));
  if (!parsedYaml || typeof parsedYaml !== 'object') {
    throw new Error(`${label} is invalid or empty YAML at path: ${filePath}`);
  }

  const result = schema.safeParse(parsedYaml);
  if (!result.success) {
    const errorDetails = result.error.errors
      .map((error) => `  - [${error.path.join('.')}] ${error.message}`)
      .join('\n');
    throw new Error(`${label} validation failed:\n${errorDetails}`);
  }

  return result.data;
}

export function loadPublicProfile(filePath: string): PublicProfile {
  return loadProfile(filePath, PublicProfileSchema, 'AIS Public Profile');
}

export function loadRuntimeProfile(filePath: string): RuntimeProfile {
  return loadProfile(filePath, RuntimeProfileSchema, 'AIS Runtime Profile');
}

/**
 * Loads a combined profile from a non-public location. Prefer the narrower
 * loaders for public builds and MCP runtime.
 */
export function loadSystemProfile(filePath: string): SystemProfile {
  return loadProfile(filePath, SystemProfileSchema, 'AIS Profile');
}
