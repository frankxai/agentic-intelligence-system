import fs from 'node:fs';
import yaml from 'js-yaml';
import { SystemProfileSchema, type SystemProfile } from './schemas.js';

/**
 * Loads the Agentic Intelligence System profile YAML file, parses it,
 * and validates it against the canonical Zod schema.
 * 
 * @param filePath Path to the ais-profile.yaml file
 * @returns Validated SystemProfile object
 */
export function loadSystemProfile(filePath: string): SystemProfile {
  if (!fs.existsSync(filePath)) {
    throw new Error(`AIS Profile file not found at path: ${filePath}`);
  }

  const fileContents = fs.readFileSync(filePath, 'utf8');
  const parsedYaml = yaml.load(fileContents);

  if (!parsedYaml || typeof parsedYaml !== 'object') {
    throw new Error(`AIS Profile is invalid or empty YAML at path: ${filePath}`);
  }

  // Parse and validate using Zod
  const result = SystemProfileSchema.safeParse(parsedYaml);

  if (!result.success) {
    const errorDetails = result.error.errors
      .map((err) => `  - [${err.path.join('.')}] ${err.message}`)
      .join('\n');
    throw new Error(`AIS Profile validation failed:\n${errorDetails}`);
  }

  return result.data;
}
