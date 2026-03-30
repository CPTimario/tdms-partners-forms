#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

function toPascalCase(name) {
  return name
    .replace(/(?:[-_ ]+)(.)/g, (_, c) => c.toUpperCase())
    .replace(/^(.)/, (_, c) => c.toUpperCase());
}

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) files = files.concat(walk(full));
    else files.push(full);
  }
  return files;
}

const repoRoot = path.resolve(new URL(import.meta.url).pathname, '../../');
const componentsDir = path.join(repoRoot, 'components');

if (!fs.existsSync(componentsDir)) {
  console.error('components directory not found');
  process.exit(1);
}

const extRegex = /\.(ts|tsx|js|jsx|mjs)$/i;
const files = walk(componentsDir).filter((f) => extRegex.test(f));

const renames = [];

for (const file of files) {
  const base = path.basename(file);
  const dir = path.dirname(file);
  const match = base.match(/^(.*)\.(ts|tsx|js|jsx|mjs)$/i);
  if (!match) continue;
  const name = match[1];
  const ext = match[2];
  // skip index files
  if (name.toLowerCase() === 'index') continue;
  // desired PascalCase for components
  const pascal = toPascalCase(name);
  if (pascal !== name && /^[A-Za-z]/.test(name)) {
    const newBase = `${pascal}.${ext}`;
    const newPath = path.join(dir, newBase);
    if (fs.existsSync(newPath)) {
      console.warn(`Skipping rename, target exists: ${newPath}`);
      continue;
    }
    fs.renameSync(file, newPath);
    renames.push({ oldPath: file, newPath, oldName: name, newName: pascal });
    console.log(`Renamed: ${file} -> ${newPath}`);
  }
}

if (renames.length === 0) {
  console.log('No component filename changes needed');
  process.exit(0);
}

// Update imports across repo
const repoFiles = walk(repoRoot).filter((f) => /\.(ts|tsx|js|jsx|mjs|json)$/.test(f));

for (const { oldName, newName, oldPath, newPath } of renames) {
  const oldBasename = path.basename(oldPath, path.extname(oldPath));
  const newBasename = path.basename(newPath, path.extname(newPath));
  for (const file of repoFiles) {
    let content = fs.readFileSync(file, 'utf8');
    const relOld = `@/components/${oldBasename}`;
    const relNew = `@/components/${newBasename}`;
    const relOldIdx = `./${oldBasename}`;
    const relNewIdx = `./${newBasename}`;
    const relParentOld = `../${oldBasename}`;
    const relParentNew = `../${newBasename}`;
    const updated = content
      .split(relOld)
      .join(relNew)
      .split(relOld + '/')
      .join(relNew + '/')
      .split(relOldIdx)
      .join(relNewIdx)
      .split(relParentOld)
      .join(relParentNew);
    if (updated !== content) {
      fs.writeFileSync(file, updated, 'utf8');
      console.log(`Updated imports in ${file} for ${oldBasename} -> ${newBasename}`);
    }
  }
}

console.log('Filename fixes applied.');
