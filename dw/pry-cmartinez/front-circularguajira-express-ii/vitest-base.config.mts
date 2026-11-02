import { defineConfig } from 'vitest/config';

/**
 * Base Vitest options merged by `ng test` (angular.json → test → runnerConfig).
 * The lab machine has many cores but little memory: by default Vitest starts one worker
 * per core and they time out before answering. One worker avoids swapping, and the timeout
 * covers the first test of a file (component compilation) on a loaded machine.
 */
export default defineConfig({
  test: {
    maxWorkers: 1,
    testTimeout: 60_000,
  },
});
