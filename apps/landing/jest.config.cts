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
  transformIgnorePatterns: ['node_modules/(?!.*\\.mjs$|.*uuid/)'],
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
    // `/ddl` is the design-system showcase: ~140 of the app's ~170 files, all of
    // them demo pages and their fixture data. They document the landing UI rather
    // than ship behaviour, so measuring them buries the ~30 real page files.
    '!src/app/pages/ddl/**',
    '!src/**/*.seed.ts',
  ],
  // Measured floors, not aspirations. Outside `/ddl` this app is ~30 files of SSR page
  // shells whose behaviour is verified by the console/landing e2e suites and the
  // landing-copy contract spec, not by unit tests — hence the near-zero numbers. The
  // gate exists only to stop further slippage. Ratchet upward, never down.
  coverageThreshold: {
    global: {
      branches: 11,
      functions: 2,
      lines: 4,
      statements: 5,
    },
  },
};
