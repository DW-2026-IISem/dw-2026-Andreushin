import { defineConfig } from 'vitest/config';

/**
 * Base Vitest options merged by `ng test` (angular.json → test → runnerConfig).
 * The lab machine has many cores but little memory: by default Vitest starts one worker
 * per core and they time out before answering, so the pool is capped.
 */
export default defineConfig({
  test: {
    maxWorkers: 2,
  },
});
