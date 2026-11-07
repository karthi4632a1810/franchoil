import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const distDir = path.join(rootDir, 'dist');
const backendPhpDir = path.join(rootDir, 'backend-php');
const buildedDir = path.join(rootDir, 'BUILDED_FRANCHOIL');

if (!fs.existsSync(distDir)) {
  console.error('Error: dist/ folder does not exist. Run "npm run build" first.');
  process.exit(1);
}

// 1. Copy backend-php/public/index.php -> dist/index.php
const backendIndex = path.join(backendPhpDir, 'public', 'index.php');
if (fs.existsSync(backendIndex)) {
  fs.copyFileSync(backendIndex, path.join(distDir, 'index.php'));
  console.log('✓ Copied backend-php/public/index.php -> dist/index.php');
} else {
  console.warn('! backend-php/public/index.php not found.');
}

// 2. Copy backend-php/src -> dist/src
const backendSrc = path.join(backendPhpDir, 'src');
if (fs.existsSync(backendSrc)) {
  fs.cpSync(backendSrc, path.join(distDir, 'src'), { recursive: true });
  console.log('✓ Copied backend-php/src -> dist/src');
} else {
  console.warn('! backend-php/src not found.');
}

// 3. Copy .env (prefer production .env from BUILDED_FRANCHOIL or backend-php)
const prodEnv = path.join(buildedDir, '.env');
const backendEnv = path.join(backendPhpDir, '.env');
if (fs.existsSync(prodEnv)) {
  fs.copyFileSync(prodEnv, path.join(distDir, '.env'));
  console.log('✓ Copied production .env (from BUILDED_FRANCHOIL/.env) -> dist/.env');
} else if (fs.existsSync(backendEnv)) {
  fs.copyFileSync(backendEnv, path.join(distDir, '.env'));
  console.log('✓ Copied backend-php/.env -> dist/.env');
}

// 4. Copy maintenance.html if present
const maintenanceHtml = path.join(rootDir, 'maintenance.html');
if (fs.existsSync(maintenanceHtml)) {
  fs.copyFileSync(maintenanceHtml, path.join(distDir, 'maintenance.html'));
  console.log('✓ Copied maintenance.html -> dist/maintenance.html');
}

console.log('\n🎉 Complete! The "dist" folder is now 100% packaged with Frontend, PHP Backend, and .env ready for Hostinger upload.\n');
