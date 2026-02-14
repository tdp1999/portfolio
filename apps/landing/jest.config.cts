module.exports = {
  displayName: 'landing',
  preset: '../../jest.preset.js',
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  coverageDirectory: '../../coverage/apps/landing',
  testPathIgnorePatterns: ['<rootDir>/e2e/'],
  transform: {
    '^.+\\.(ts|mjs|js|html)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.(html|svg)$',
      },
    ],
  },
  transformIgnorePatterns: ['node_modules/(?!.*\\.mjs$)'],
  snapshotSerializers: [
    'jest-preset-angular/build/serializers/no-ng-attributes',
    'jest-preset-angular/build/serializers/ng-snapshot',
    'jest-preset-angular/build/serializers/html-comment',
  ],
  // Coverage collection - only include actual component files
  collectCoverageFrom: [
    'src/app/**/*.{js,ts}',
    '!src/**/*.spec.{js,ts}',
    '!src/**/*.config*.{js,ts}',
    '!src/**/*.routes*.{js,ts}',
    '!src/test-setup.ts',
    '!src/**/index.ts',
    '!src/app/app.ts',
  ],
  // Coverage thresholds for components - 70% target (pragmatic initial threshold)
  // Only measuring src/app/ directory which contains actual components
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 50,
      lines: 70,
      statements: 70,
    },
  },
};
