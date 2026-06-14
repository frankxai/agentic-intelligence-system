import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const USER_HOME = os.homedir();
const GLOBAL_SKILLS_DIR = path.join(USER_HOME, '.agents', 'skills');
const CLAUDE_CONFIG_SKILLS_DIR = path.join(USER_HOME, 'claude-code-config', 'skills');

// The list of skills we bundle in this package
const BUNDLED_SKILLS = ['agent-manager-skill', 'model-routing'];

export function installSkills(): void {
  console.log('🚀 Running AIS Meta Skills Installer...');

  const sourceSkillsDir = path.resolve(__dirname, '..', 'templates');

  if (!fs.existsSync(sourceSkillsDir)) {
    console.error(`❌ Source skills directory not found at: ${sourceSkillsDir}`);
    console.log('Make sure to compile and run from the correct directory tree.');
    return;
  }

  for (const skillName of BUNDLED_SKILLS) {
    const srcDir = path.join(sourceSkillsDir, skillName);
    if (!fs.existsSync(srcDir)) {
      console.warn(`⚠️ Skill templates directory not found: ${srcDir}, skipping.`);
      continue;
    }

    // Install to global directory
    installToDir(srcDir, GLOBAL_SKILLS_DIR, skillName);

    // Install to claude-code-config directory
    if (fs.existsSync(CLAUDE_CONFIG_SKILLS_DIR)) {
      installToDir(srcDir, CLAUDE_CONFIG_SKILLS_DIR, skillName);
    }
  }

  console.log('🎉 Skills installation complete.');
}

function installToDir(srcDir: string, destBaseDir: string, skillName: string) {
  const destDir = path.join(destBaseDir, skillName);
  fs.mkdirSync(destDir, { recursive: true });

  const files = fs.readdirSync(srcDir);
  for (const file of files) {
    const srcFile = path.join(srcDir, file);
    const destFile = path.join(destDir, file);

    const stats = fs.statSync(srcFile);
    if (stats.isFile()) {
      fs.copyFileSync(srcFile, destFile);
      console.log(`  Installed: ${skillName}/${file} -> ${destFile}`);
    }
  }
}

// Execute if run directly
if (import.meta.url.endsWith(process.argv[1] || '')) {
  installSkills();
}
