const nxPreset = require('@nx/jest/preset').default;

module.exports = {
  ...nxPreset,
  // Transform ESM-only deps that publish as plain .js with "type": "module"
  // (e.g. uuid v13). Without this, Jest hits "Unexpected token 'export'".
  transformIgnorePatterns: ['node_modules/(?!.*\\.mjs$|.*uuid/)'],
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
