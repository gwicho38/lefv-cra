#!/usr/bin/env node

/**
 * lefv-cra - Create React App CLI
 *
 * Creates a new React project based on the lefv-cra boilerplate.
 *
 * Usage:
 *   npx lefv-cra my-app
 *   npm create lefv-cra my-app
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, cpSync, readFileSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const TEMPLATE_DIR = resolve(__dirname, '..');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function error(message) {
  log(`Error: ${message}`, colors.red);
  process.exit(1);
}

function success(message) {
  log(message, colors.green);
}

function info(message) {
  log(message, colors.cyan);
}

function main() {
  const args = process.argv.slice(2);
  const projectName = args[0];

  if (!projectName) {
    log('\nUsage: npx lefv-cra <project-name>\n', colors.yellow);
    log('Example: npx lefv-cra my-awesome-app\n');
    process.exit(1);
  }

  // Validate project name
  if (!/^[a-zA-Z0-9-_]+$/.test(projectName)) {
    error('Project name can only contain letters, numbers, hyphens, and underscores');
  }

  const targetDir = resolve(process.cwd(), projectName);

  // Check if directory already exists
  if (existsSync(targetDir)) {
    error(`Directory "${projectName}" already exists`);
  }

  log(`\n${colors.bright}Creating a new React app in ${targetDir}${colors.reset}\n`);

  // Create project directory
  mkdirSync(targetDir, { recursive: true });

  // Files/directories to copy
  const filesToCopy = [
    'src',
    'server',
    'docs',
    'public',
    'index.html',
    'vite.config.ts',
    'tsconfig.json',
    'tsconfig.app.json',
    'tsconfig.node.json',
    'tsconfig.server.json',
    'tailwind.config.ts',
    'postcss.config.js',
    'eslint.config.js',
    '.env.example',
    'README.md',
    'ARCHITECTURE.md',
  ];

  // Copy template files
  info('Copying template files...');

  for (const file of filesToCopy) {
    const sourcePath = join(TEMPLATE_DIR, file);
    const targetPath = join(targetDir, file);

    if (existsSync(sourcePath)) {
      cpSync(sourcePath, targetPath, { recursive: true });
    }
  }

  // Create package.json with updated name
  info('Creating package.json...');

  const templatePkg = JSON.parse(
    readFileSync(join(TEMPLATE_DIR, 'package.json'), 'utf-8')
  );

  const newPkg = {
    name: projectName,
    version: '0.1.0',
    private: true,
    description: templatePkg.description,
    type: templatePkg.type,
    scripts: {
      dev: templatePkg.scripts.dev,
      'dev:client': templatePkg.scripts['dev:client'],
      'dev:server': templatePkg.scripts['dev:server'],
      build: templatePkg.scripts.build,
      'build:server': templatePkg.scripts['build:server'],
      preview: templatePkg.scripts.preview,
      lint: templatePkg.scripts.lint,
      format: templatePkg.scripts.format,
      test: templatePkg.scripts.test,
    },
    dependencies: templatePkg.dependencies,
    devDependencies: templatePkg.devDependencies,
    engines: templatePkg.engines,
  };

  writeFileSync(
    join(targetDir, 'package.json'),
    JSON.stringify(newPkg, null, 2)
  );

  // Create .env from .env.example
  const envExamplePath = join(targetDir, '.env.example');
  const envPath = join(targetDir, '.env');
  if (existsSync(envExamplePath)) {
    cpSync(envExamplePath, envPath);
  }

  // Create .gitignore
  const gitignoreContent = `# Dependencies
node_modules/
.pnp
.pnp.js

# Build
dist/
build/

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# Cache
.cache/
.eslintcache
`;

  writeFileSync(join(targetDir, '.gitignore'), gitignoreContent);

  // Install dependencies
  info('\nInstalling dependencies...\n');

  try {
    execSync('npm install', {
      cwd: targetDir,
      stdio: 'inherit',
    });
  } catch {
    log('\nFailed to install dependencies. Please run "npm install" manually.', colors.yellow);
  }

  // Initialize git
  info('\nInitializing git repository...');

  try {
    execSync('git init', { cwd: targetDir, stdio: 'ignore' });
    execSync('git add -A', { cwd: targetDir, stdio: 'ignore' });
    execSync('git commit -m "Initial commit from lefv-cra"', {
      cwd: targetDir,
      stdio: 'ignore',
    });
    success('Git repository initialized');
  } catch {
    log('Failed to initialize git. Please run "git init" manually.', colors.yellow);
  }

  // Success message
  log('\n' + '='.repeat(50));
  success(`\nSuccess! Created ${projectName} at ${targetDir}\n`);
  log('Inside that directory, you can run several commands:\n');

  info('  npm run dev');
  log('    Starts the development server (frontend + backend)\n');

  info('  npm run build');
  log('    Builds the app for production\n');

  info('  npm run lint');
  log('    Runs ESLint to check code quality\n');

  log('\nWe suggest that you begin by typing:\n');
  info(`  cd ${projectName}`);
  info('  npm run dev\n');

  log('Configuration:');
  log('  1. Copy .env.example to .env');
  log('  2. Add your Supabase and Mistral API keys');
  log('  3. Start building!\n');

  log('Happy coding!');
  log('='.repeat(50) + '\n');
}

main();
