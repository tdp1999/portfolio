module.exports = {
  displayName: 'api',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  // `marked` ships ESM-only with zero deps — transform it (rather than stub) so the
  // real markdown→doc path runs. `uuid` likewise. Heavier ESM engines (Tiptap via
  // document-engine-core, jsdom via isomorphic-dompurify) are stubbed below instead.
  transformIgnorePatterns: ['node_modules/(?!(?:.*uuid|.*marked)/)'],
  // These deps ship ESM-only and are pulled into the module graph by the RTE write
  // pipeline. The api runs in a node env with a restrictive transformIgnorePatterns,
  // so map each ESM leaf to a lightweight stub rather than transforming Tiptap/jsdom.
  // Both are their own tested units (engine repo / rte-core's jsdom-env spec).
  moduleNameMapper: {
    '^@phuong-tran-redoc/document-engine-core$': '<rootDir>/test/mocks/document-engine-core.stub.ts',
    '^isomorphic-dompurify$': '<rootDir>/test/mocks/isomorphic-dompurify.stub.ts',
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/api',
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/test/mocks/',
    '\\.module\\.ts$',
    'index\\.ts$',
    '/shared/cqrs/',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
