const nxPreset = require('@nx/jest/preset').default;

module.exports = {
  ...nxPreset,
  // Coverage output format - CLI text only
  coverageReporters: ['text'],
  // Files to exclude from coverage
  collectCoverageFrom: [
    '**/*.{js,ts}',
    '!**/*.spec.{js,ts}',
    '!**/*.config.{js,ts}',
    '!**/*.cts',
    '!**/main.ts',
    '!**/index.ts',
    '!**/jest.*.{js,ts}',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/coverage/**',
  ],
};
