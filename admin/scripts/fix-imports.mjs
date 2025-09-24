import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve project root reliably regardless of current working directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..'); // AdminBvote/
const root = path.join(projectRoot, 'src');

function walk(dir, onFile) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, onFile);
    } else if (entry.isFile() && (entry.name.endsWith('.jsx') || entry.name.endsWith('.js') || entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
      onFile(fullPath);
    }
  }
}

function applyReplacements(content, filePath) {
  const isInPages = filePath.includes(`${path.sep}src${path.sep}pages${path.sep}`);
  const isInComponents = filePath.includes(`${path.sep}src${path.sep}components${path.sep}`);
  const isDashboardComp = filePath.includes(`${path.sep}src${path.sep}components${path.sep}dashboard${path.sep}`);

  let updated = content;

  // Pages rules
  if (isInPages) {
    // components
    updated = updated.replace(/(['"])\.{3,}\/components\//g, '$1../components/');
    updated = updated.replace(/(['"])\.\/components\//g, '$1../components/');

    // ui under components
    updated = updated.replace(/(['"])\.{3,}\/components\/ui\//g, '$1../components/ui/');
    updated = updated.replace(/(['"])\.\/components\/ui\//g, '$1../components/ui/');

    // hooks/services/contexts
    for (const seg of ['hooks', 'services', 'contexts']) {
      const multi = new RegExp(`(['"])\\.{3,}\/${seg}\/`, 'g');
      const single = new RegExp(`(['"])\./${seg}\/`, 'g');
      updated = updated.replace(multi, `$1../${seg}/`);
      updated = updated.replace(single, `$1../${seg}/`);
    }

    // Wrong self-page import like './pages/ContestFormModal' => './ContestFormModal'
    updated = updated.replace(/(from\s+['"])\.\/pages\//g, '$1./');
    updated = updated.replace(/(from\s+['"])\.\.\/pages\//g, '$1./');
  }

  // Components rules
  if (isInComponents) {
    // components/ui should be relative './ui/'
    updated = updated.replace(/(['"])\.{2,}\/components\/ui\//g, '$1./ui/');
    updated = updated.replace(/(['"])\.\/components\/ui\//g, '$1./ui/');

    for (const seg of ['hooks', 'services', 'contexts']) {
      const multi = new RegExp(`(['"])\\.{2,}\/${seg}\/`, 'g');
      const single = new RegExp(`(['"])\./${seg}\/`, 'g');
      updated = updated.replace(multi, `$1../${seg}/`);
      updated = updated.replace(single, `$1../${seg}/`);
    }
  }

  // Dashboard subfolder: fix './ui/' -> '../ui/'
  if (isDashboardComp) {
    updated = updated.replace(/from ['"]\.\/ui\//g, "from '../ui/");
  }

  return updated;
}

function fixFile(filePath) {
  try {
    const original = fs.readFileSync(filePath, 'utf8');
    const updated = applyReplacements(original, filePath);
    if (updated !== original) {
      fs.writeFileSync(filePath, updated, 'utf8');
      console.log(`Fixed: ${path.relative(root, filePath)}`);
    }
  } catch (err) {
    console.error(`Failed to fix ${filePath}:`, err.message);
  }
}

console.log('Scanning and fixing import paths under:', root);
walk(root, fixFile);
console.log('Done fixing imports.');
