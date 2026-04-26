// Flat ESLint config for ESLint v9+
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const nextConfigs = require('@next/eslint-plugin-next').configs;
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import tsParser from '@typescript-eslint/parser';

export default [
  // Ignore build artifacts, backups, and out-of-tree workspaces
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'dist/**',
      'out/**',
      'backup/**',
      'mobile/**',
      'cramgram/**',
      'docker-build-temp/**',
      'public/**',
      'electron/**',
      '.pnpm-store/**',
      '.vercel/**',
      'tsconfig.tsbuildinfo',
      '**/*.min.js',
      '**/*.d.ts',
    ],
  },
  // JavaScript / JSX
  {
    name: 'parser:javascript',
    files: ['**/*.{js,jsx,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      parserOptions: {
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
  },
  // TypeScript / TSX
  {
    name: 'parser:typescript',
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
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
  // Accessibility rules (jsx-a11y)
  {
    plugins: { 'jsx-a11y': jsxA11y },
    rules: {
      // Recommended accessibility rules
      'jsx-a11y/alt-text': 'warn',
      'jsx-a11y/aria-props': 'warn',
      'jsx-a11y/aria-proptypes': 'warn',
      'jsx-a11y/aria-unsupported-elements': 'warn',
      'jsx-a11y/role-has-required-aria-props': 'warn',
      'jsx-a11y/role-supports-aria-props': 'warn',
      'jsx-a11y/heading-has-content': 'warn',
      'jsx-a11y/html-has-lang': 'warn',
      'jsx-a11y/img-redundant-alt': 'warn',
      'jsx-a11y/interactive-supports-focus': 'warn',
      'jsx-a11y/label-has-associated-control': 'warn',
      'jsx-a11y/no-autofocus': 'warn',
      'jsx-a11y/no-redundant-roles': 'warn',
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/no-static-element-interactions': 'warn',
    },
  },
  // Project-specific tweaks
  {
    rules: {
      '@next/next/no-img-element': 'off',
    },
  },
];
