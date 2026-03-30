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

const problems = [];

for (const file of files) {
  const base = path.basename(file);
  const match = base.match(/^(.*)\.(ts|tsx|js|jsx|mjs)$/i);
  if (!match) continue;
  const name = match[1];
  if (name.toLowerCase() === 'index') continue;
  const pascal = toPascalCase(name);
  if (pascal !== name && /^[A-Za-z]/.test(name)) {
    problems.push({ file, expected: `${pascal}${path.extname(file)}` });
  }
}

if (problems.length) {
  console.error('Filename convention violations detected:');
  for (const p of problems) console.error(` - ${p.file} -> expected ${p.expected}`);
  process.exit(2);
}

console.log('No filename convention violations found');
