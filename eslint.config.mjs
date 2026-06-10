import nx from '@nx/eslint-plugin';
import feNaming from './tools/eslint/fe-naming.mjs';
import feFileLayout from './tools/eslint/fe-file-layout.mjs';

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
      // A leading `_` marks an intentionally-unused binding: a parameter kept for an
      // interface/contract signature (e.g. CVA `setDisabledState(_isDisabled)`), or a
      // destructured key extracted only to omit it (`{ mode: _mode, ...rest }`). Genuine
      // dead code (unused imports, dead assignments) has no `_` prefix and stays flagged.
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          args: 'after-used',
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
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
  // FE logic/component file layout (.context/angular-style-guide.md §16). Landing + console only;
  // warning-level — the lintable subset of the layout standard. Field sub-grouping, method clustering,
  // on<Event> naming, and import order are convention (doc). File purity, export style, and
  // one-class-per-file are enforced by fe-file-layout (warn). Role files (.types/.data/.util/…)
  // and other supporting files are excluded via ignores so the purity rule never fires on them.
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
      '**/*.types.ts',
      '**/*.data.ts',
      '**/*.util.ts',
      '**/*.validator.ts',
      '**/*.constants.ts',
      '**/*.tokens.ts',
      '**/*.model.ts',
      '**/index.ts',
      '**/main.ts',
      '**/main.server.ts',
      '**/*.server.ts',
      '**/test-setup.ts',
      '**/*.config.ts',
      '**/environments/**',
    ],
    plugins: { 'fe-file-layout': feFileLayout },
    rules: {
      // §16.1 — file purity: module scope holds only imports + one decorated class + declare global.
      'fe-file-layout/file-purity': 'warn',
      // §16.5 — export style: export default only for @Component; services/directives/pipes named.
      'fe-file-layout/export-style': 'warn',
      // §16.1 — one Angular-decorated class per file.
      'fe-file-layout/one-class': 'warn',
      // §16.2 — macro order only (field → constructor → method); fine field grouping and method
      // clustering are by convention (member-ordering can't model Angular roles or clusters).
      '@typescript-eslint/member-ordering': [
        'warn',
        {
          default: {
            memberTypes: ['signature', 'field', 'constructor', 'method'],
            order: 'as-written',
          },
        },
      ],
      // §16.3 — never write the `public` keyword (inputs/outputs/CVA methods are public-by-omission).
      '@typescript-eslint/explicit-member-accessibility': ['warn', { accessibility: 'no-public' }],
      // §16.4 — no leading underscore on private members (we use the `private` keyword, not `_`).
      '@typescript-eslint/naming-convention': [
        'warn',
        { selector: 'memberLike', modifiers: ['private'], format: null, leadingUnderscore: 'forbid' },
      ],
      // §16.3 — use the `private` keyword, never `#field`.
      'no-restricted-syntax': [
        'warn',
        {
          selector: 'PropertyDefinition[key.type="PrivateIdentifier"]',
          message: 'Use the `private` keyword, not a `#field` (angular-style-guide.md §16.3).',
        },
        {
          selector: 'MethodDefinition[key.type="PrivateIdentifier"]',
          message: 'Use the `private` keyword, not a `#method` (angular-style-guide.md §16.3).',
        },
      ],
    },
  },
];
