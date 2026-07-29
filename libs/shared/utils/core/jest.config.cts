module.exports = {
  displayName: 'shared-utils',
  preset: '../../../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  transformIgnorePatterns: ['node_modules/(?!.*uuid/)'],
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../../../coverage/libs/shared/utils/core',
  coveragePathIgnorePatterns: [
    '/node_modules/',
    // `lite.ts` is the zero-zod secondary entry point: a single re-export line and
    // nothing else, i.e. a barrel under a name other than `index.ts` (which the
    // preset already ignores). It has no behaviour of its own to cover.
    '<rootDir>/src/lite.ts',
  ],
  // Coverage thresholds for utilities - 90%+ target (helpers/utilities should be well-tested)
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
};
