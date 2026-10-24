import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      restoreMocks: true,
      // Screen tests walk whole flows (sign-up → code → home) through the real routes; under a
      // parallel run they can take longer than the 5 s default
      testTimeout: 30_000,
    },
  })
);
