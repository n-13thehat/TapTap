import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '.next'],
    testTimeout: 15000,
    hookTimeout: 15000,
  },
  resolve: {
    alias: [
      { find: '@/lib', replacement: path.resolve(__dirname, './lib') },
      { find: '@/api', replacement: path.resolve(__dirname, './app/api') },
      { find: '@/components', replacement: path.resolve(__dirname, './components') },
      { find: '@/app', replacement: path.resolve(__dirname, './app') },
      { find: '@', replacement: path.resolve(__dirname, './') },
      { find: '~', replacement: path.resolve(__dirname, './') },
    ],
  },
});
