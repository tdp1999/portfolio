module.exports = {
  displayName: 'rte-core',
  preset: '../../../../jest.preset.js',
  // isomorphic-dompurify's default (node) build eagerly `require('jsdom')`, whose
  // ESM dep tree jest can't transform. Map it to its *browser* build, which runs
  // identical DOMPurify against the ambient jsdom window — no jsdom import needed.
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^isomorphic-dompurify$': '<rootDir>/../../../../node_modules/isomorphic-dompurify/dist/browser.js',
  },
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  transformIgnorePatterns: ['node_modules/(?!.*\\.pnpm|uuid)'],
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../../../coverage/libs/shared/features/rte-core',
};
