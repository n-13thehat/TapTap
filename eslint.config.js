// Flat ESLint config for ESLint v9+
// JavaScript-only configuration after TypeScript removal
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const nextConfigs = require('@next/eslint-plugin-next').configs;
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  // Ignore build artifacts and backups
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'dist/**',
      'out/**',
      'backup/**',
      '**/*.min.js',
    ],
  },
  // JavaScript and JSX files configuration
  {
    name: 'parser:javascript',
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      parserOptions: {
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
  },
  // Next.js rules (core web vitals)
  nextConfigs['core-web-vitals'],
  // React Hooks (only exhaustive-deps to preserve previous behavior)
  {
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  // Project-specific tweaks
  {
    rules: {
      '@next/next/no-img-element': 'off',
    },
  },
];
