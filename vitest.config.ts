import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    // This allows you to use 'describe' and 'it' without importing them
    globals: true,
    environment: 'node',
  },
});