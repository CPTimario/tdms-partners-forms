import type { NextConfig } from 'next';
import { copyFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// Copy PDF.js worker at config load time (before build)
try {
  const workerSource = require.resolve('pdfjs-dist/build/pdf.worker.mjs');
  const publicDir = join(process.cwd(), 'public');
  const workerDest = join(publicDir, 'pdf.worker.mjs');

  if (!existsSync(publicDir)) {
    mkdirSync(publicDir, { recursive: true });
  }

  copyFileSync(workerSource, workerDest);
} catch (err) {
  console.warn('Could not copy PDF.js worker file:', err);
}

const nextConfig: NextConfig = {
  allowedDevOrigins: ['127.0.0.1'],
};

export default nextConfig;
