module.exports = {
  displayName: 'rte-renderer',
  preset: '../../../../jest.preset.js',
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  coverageDirectory: '../../../../coverage/libs/shared/features/rte-renderer',
  // Use isomorphic-dompurify's browser build (ambient jsdom window) so jest never
  // loads its jsdom-backed node build (untransformable ESM dep tree). See rte-core.
  moduleNameMapper: {
    '^isomorphic-dompurify$': '<rootDir>/../../../../node_modules/isomorphic-dompurify/dist/browser.js',
  },
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
};
