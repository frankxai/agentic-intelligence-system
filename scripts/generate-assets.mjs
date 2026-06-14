import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { loadSystemProfile } from '../packages/core/dist/index.js';
import { generateLlmsText, generateAgentsJson, generateJsonLd } from '../packages/emit/dist/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '..');
const PROFILE_PATH = path.join(ROOT_DIR, 'ais-profile.yaml');

function main() {
  console.log('⚡ Generating AIS discovery and sitemap assets...');

  try {
    const profile = loadSystemProfile(PROFILE_PATH);

    // 1. Generate llms.txt
    const llmsText = generateLlmsText(profile);
    const llmsPath = path.join(ROOT_DIR, 'llms.txt');
    fs.writeFileSync(llmsPath, llmsText, 'utf8');
    console.log(`✅ Generated: llms.txt -> ${llmsPath}`);

    // 2. Generate agents.json
    const agentsJson = generateAgentsJson(profile);
    const agentsPath = path.join(ROOT_DIR, 'agents.json');
    fs.writeFileSync(agentsPath, agentsJson, 'utf8');
    console.log(`✅ Generated: agents.json -> ${agentsPath}`);

    // 3. Generate JSON-LD (jsonld.json)
    const jsonLd = generateJsonLd(profile);
    const jsonLdPath = path.join(ROOT_DIR, 'jsonld.json');
    fs.writeFileSync(jsonLdPath, jsonLd, 'utf8');
    console.log(`✅ Generated: jsonld.json -> ${jsonLdPath}`);

    console.log('🎉 Asset generation completed successfully!');
  } catch (error) {
    console.error('❌ Error generating AIS assets:', error.message);
    process.exit(1);
  }
}

main();
