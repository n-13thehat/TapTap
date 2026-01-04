import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: false,
    include: ["tests/**/*.test.js", "tests/**/*.test.jsx", "tests/**/*.test.ts", "tests/**/*.test.tsx"],
  },
  resolve: {
    alias: [
      { find: /^@\/app\/(.*)$/, replacement: path.resolve(process.cwd(), "app/$1") },
      { find: /^@\/api\/(.*)$/, replacement: path.resolve(process.cwd(), "app/api/$1") },
      { find: /^@\/providers\/(.*)$/, replacement: path.resolve(process.cwd(), "app/providers/$1") },
      { find: /^@\/visuals\/(.*)$/, replacement: path.resolve(process.cwd(), "app/visuals/$1") },
      { find: /^@\/lib\/(.*)$/, replacement: path.resolve(process.cwd(), "lib/$1") },
      { find: /^@\/(.*)$/, replacement: path.resolve(process.cwd(), "$1") },
      { find: /^@$/, replacement: path.resolve(process.cwd(), ".") },
    ],
  },
});
