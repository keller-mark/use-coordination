import { defineConfig } from 'vite';

// The CLI runs in Node, so it does not use the shared (jsdom) test config.
export default defineConfig({
  test: {
    passWithNoTests: true,
    globals: true,
    environment: 'node',
    // Only run test files that are within src/
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}'],
  },
});
