module.exports = {
  displayName: 'ui',
  preset: '../../../../jest.preset.js',
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  coverageDirectory: '../../../../coverage/libs/landing/shared/ui',
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
  // Measured floors, not aspirations. 28 spec files cover 158 sources: the tested core
  // is the services, directives and interactive components, while most presentational
  // primitives (heading, breadcrumb, page-shell, section-header, …) have no unit test
  // and are exercised only through `/ddl` and the e2e suite. This is the largest real
  // test debt in the repo — ratchet these upward as primitives gain tests, never down.
  coverageThreshold: {
    global: {
      branches: 18,
      functions: 34,
      lines: 38,
      statements: 36,
    },
  },
};
