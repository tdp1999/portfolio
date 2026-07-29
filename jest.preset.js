const nxPreset = require('@nx/jest/preset').default;

module.exports = {
  ...nxPreset,
  // Transform ESM-only deps that publish as plain .js with "type": "module"
  // (e.g. uuid v13). Without this, Jest hits "Unexpected token 'export'".
  transformIgnorePatterns: ['node_modules/(?!.*\\.mjs$|.*uuid/)'],
  // Coverage output format - CLI text only
  coverageReporters: ['text'],
  // Files to exclude from coverage.
  //
  // Only exclude what is provably not product code. Do NOT exclude by role suffix
  // (`*.data.ts`, `*.types.ts`, `*.constants.ts`): the filename grammar names the
  // file's role, not its contents, and several of those files hold real functions
  // (`validateFile`, `filterCommands`, `isContactPurpose`). Excluding them by
  // pattern would silently hide testable logic.
  collectCoverageFrom: [
    '**/*.{js,ts}',
    '!**/*.spec.{js,ts}',
    '!**/*.config.{js,ts}',
    '!**/*.cts',
    '!**/main.ts',
    '!**/index.ts',
    '!**/jest.*.{js,ts}',
    // Ambient declaration files emit no JavaScript, so there is nothing to cover.
    '!**/*.d.ts',
    // Seed scripts are run by hand against a real DB, never unit-tested.
    '!**/*.seed.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/coverage/**',
  ],
};
