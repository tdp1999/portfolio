module.exports = {
  displayName: 'shared-testing',
  preset: '../../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../../coverage/libs/shared/testing',
  // Coverage thresholds for testing utilities - 55% initial target
  // Many test factories may not be used yet - pragmatic threshold
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 40,
      lines: 55,
      statements: 55,
    },
  },
};
