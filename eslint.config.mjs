import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Import ordering and grouping
  {
    rules: {
      'import/order': [
        'error',
        {
          groups: [['builtin', 'external'], 'internal', ['parent', 'sibling', 'index']],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
    },
  },
  // Global ignore patterns (flat config method)
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'public/pdf.worker.mjs',
    'playwright-report/',
    'test-results/',
    'public/',
    'node_modules/',
    '**/*.min.js',
    '**/dist/',
    '**/build/',
    '**/*.bundle.js',
    '**/codeMirrorModule-*.js',
    '**/uiMode.*.js',
    'coverage/',
  ]),
]);

export default eslintConfig;
