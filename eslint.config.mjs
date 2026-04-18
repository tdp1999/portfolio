import nx from '@nx/eslint-plugin';

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
            // Shared UI cannot depend on features (shell components may consume state services from data-access)
            {
              sourceTag: 'type:shared-ui',
              notDependOnLibsWithTags: ['type:feature'],
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
];
