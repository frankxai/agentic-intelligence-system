import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { loadPublicProfile } from '../packages/core/dist/index.js';
import { generateLlmsText, generateAgentsJson, generateJsonLd } from '../packages/emit/dist/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const PROFILE_PATH = path.join(ROOT_DIR, 'ais-profile.yaml');

function writeArtifact(filename, content) {
  if (content === undefined || content === null) {
    throw new Error(`Content for ${filename} is undefined or null`);
  }

  const rootPath = path.join(ROOT_DIR, filename);
  const publicPath = path.join(PUBLIC_DIR, filename);

  fs.writeFileSync(rootPath, content, 'utf8');
  fs.writeFileSync(publicPath, content, 'utf8');
  console.log(`✅ Generated: ${filename} -> ${rootPath} and ${publicPath}`);
}

function main() {
  console.log('⚡ Generating AIS discovery and sitemap assets...');

  try {
    const profile = loadPublicProfile(PROFILE_PATH);
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });

    writeArtifact('llms.txt', generateLlmsText(profile));
    writeArtifact('agents.json', generateAgentsJson(profile));
    writeArtifact('jsonld.json', generateJsonLd(profile));

    console.log('🎉 Asset generation completed successfully!');
  } catch (error) {
    console.error('❌ Error generating AIS assets:', error.message);
    process.exit(1);
  }
}

main();
