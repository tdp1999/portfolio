import nx from '@nx/eslint-plugin';
import feNaming from './tools/eslint/fe-naming.mjs';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: ['**/dist', '**/out-tsc'],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$', '^@prisma/client$'],
          depConstraints: [
            // Global shared - can only depend on other shared
            {
              sourceTag: 'scope:shared',
              onlyDependOnLibsWithTags: ['scope:shared'],
            },
            // Landing scope - can depend on shared and landing
            {
              sourceTag: 'scope:landing',
              onlyDependOnLibsWithTags: ['scope:landing', 'scope:shared'],
            },
            // Console scope - can depend on shared and console
            {
              sourceTag: 'scope:console',
              onlyDependOnLibsWithTags: ['scope:console', 'scope:shared'],
            },
            // API scope - can depend on shared and api
            {
              sourceTag: 'scope:api',
              onlyDependOnLibsWithTags: ['scope:api', 'scope:shared'],
            },
            // Features cannot depend on other features
            {
              sourceTag: 'type:feature',
              notDependOnLibsWithTags: ['type:feature'],
            },
            // Data-access cannot depend on UI or features (unidirectional)
            {
              sourceTag: 'type:shared-data-access',
              notDependOnLibsWithTags: ['type:shared-ui', 'type:feature'],
            },
            // Shared UI cannot depend on features or data-access (purely presentational)
            {
              sourceTag: 'type:shared-ui',
              notDependOnLibsWithTags: ['type:shared-data-access', 'type:feature'],
            },
            // Shared util is the lowest level — cannot depend on ui, data-access, or features
            {
              sourceTag: 'type:shared-util',
              notDependOnLibsWithTags: ['type:shared-ui', 'type:shared-data-access', 'type:feature'],
            },
            // Fallback for untagged libs (temporary during migration)
            {
              sourceTag: '*',
              onlyDependOnLibsWithTags: ['*'],
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts',
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
    ],
    // Override or add rules here
    rules: {
      '@typescript-eslint/no-require-imports': 'error',
    },
  },
  // FE file-naming grammar (.context/patterns-file-structure.md). Landing + console only;
  // shared/api/e2e excluded (shared/ui sidebar is a vendored port kept as-is). Error-level —
  // the tree was confirmed clean (0 findings) at migration time.
  {
    files: [
      'apps/landing/**/*.ts',
      'apps/console/**/*.ts',
      'libs/landing/**/*.ts',
      'libs/console/**/*.ts',
    ],
    ignores: [
      '**/*.spec.ts',
      '**/*.routes.ts',
      '**/main.ts',
      '**/main.server.ts',
      '**/*.server.ts',
      '**/test-setup.ts',
      '**/*.config.ts',
      '**/environments/**', // Angular build-target env files (environment.development.ts, …)
      'apps/*/src/app/app.ts', // bootstrap root component — selector `*-root` is a CLI convention
    ],
    plugins: { 'fe-naming': feNaming },
    rules: {
      'fe-naming/filename-grammar': 'error',
      'fe-naming/decorator-name-agreement': 'error',
    },
  },
];
