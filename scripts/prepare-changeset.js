#!/usr/bin/env node

/**
 * changeset-prepare.js
 *
 * This script creates a changeset file before committing.
 * Run this before 'git commit' to automate the changeset creation.
 * Then continue with your normal commit process using commitizen.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
// import { fileURLToPath } from 'url';

// const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Mapping of conventional commit types to changeset bump types
const bumpTypeMap = {
  feat: 'minor',
  fix: 'patch',
  refactor: 'patch',
  perf: 'patch',
  docs: 'patch',
  style: 'patch',
  test: 'patch',
  build: 'patch',
  ci: 'patch',
  chore: 'patch',
  revert: 'patch',
};

// Get commit types from commitlint config
const getCommitTypes = () => {
  try {
    const configPath = path.resolve(process.cwd(), 'commitlint.config.js');
    if (!fs.existsSync(configPath)) {
      return Object.keys(bumpTypeMap);
    }

    // This is a workaround since we can't directly import ESM dynamically
    const result = execSync(`node -e "
      import('${configPath.replace(/\\/g, '\\\\')}').then(config => {
        console.log(JSON.stringify(Object.keys(config.default.prompt.questions.type.enum)));
      });
    "`);

    return JSON.parse(result.toString().trim());
  } catch (error) {
    console.error('Error loading commit types:', error.message);
    return Object.keys(bumpTypeMap);
  }
};

// Create a changeset
const createChangeset = async (type, scope, description, details) => {
  const bumpType = bumpTypeMap[type] || 'patch';

  // Create changeset content
  const changesetContent = `---
${bumpType}
---

${type}${scope ? `(${scope})` : ''}: ${description}

${details || ''}
`;

  // Generate a random ID for the changeset file
  const id = Math.random().toString(36).substring(2, 15);
  const changesetPath = path.resolve(process.cwd(), '.changeset', `${id}.md`);

  // Write the changeset file
  fs.writeFileSync(changesetPath, changesetContent);
  console.log(`Created changeset: ${changesetPath}`);

  // Stage the changeset file
  execSync(`git add ${changesetPath}`);
  console.log('Staged changeset file');

  return {
    type,
    scope,
    description,
    details,
  };
};

// Main function
const main = async () => {
  const commitTypes = getCommitTypes();

  console.log('🔄 Changeset Preparation');
  console.log('------------------------');
  console.log('Available commit types:');
  commitTypes.forEach((type, index) => {
    console.log(`${index + 1}. ${type}`);
  });

  // Prompt for commit type
  const typePromise = new Promise((resolve) => {
    rl.question('\nSelect commit type (number or name): ', (answer) => {
      const numChoice = parseInt(answer);
      if (
        !isNaN(numChoice) &&
        numChoice > 0 &&
        numChoice <= commitTypes.length
      ) {
        resolve(commitTypes[numChoice - 1]);
      } else if (commitTypes.includes(answer)) {
        resolve(answer);
      } else {
        console.log(`Invalid type. Using "chore" as default.`);
        resolve('chore');
      }
    });
  });

  const type = await typePromise;

  // Prompt for scope (optional)
  const scopePromise = new Promise((resolve) => {
    rl.question('Scope (optional): ', resolve);
  });

  const scope = await scopePromise;

  // Prompt for description
  const descPromise = new Promise((resolve) => {
    rl.question('Description: ', resolve);
  });

  const description = await descPromise;

  // Prompt for details (optional)
  const detailsPromise = new Promise((resolve) => {
    rl.question(
      'Additional details (optional, press Enter to skip): ',
      resolve,
    );
  });

  const details = await detailsPromise;

  rl.close();

  // Create changeset
  const changeInfo = await createChangeset(type, scope, description, details);

  console.log('\n✅ Changeset created and staged!');
  console.log('\nNext steps:');
  console.log('1. Run "git commit" to continue with the normal commit process');
  console.log('2. Use the same details in commitizen for consistency:');
  console.log(`   - Type: ${changeInfo.type}`);
  console.log(`   - Scope: ${changeInfo.scope || '(none)'}`);
  console.log(`   - Description: ${changeInfo.description}`);
};

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
