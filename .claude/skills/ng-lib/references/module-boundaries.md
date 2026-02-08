# Module Boundary Rules

ESLint `@nx/enforce-module-boundaries` configuration for library scoping.

## Tag System

### Scope Tags

- `scope:shared` - Global shared libs (FE + BE)
- `scope:landing` - Landing app and its libs
- `scope:api` - API app and its libs (future)

### Type Tags

- `type:feature` - Feature libraries
- `type:shared-data-access` - Shared data access (services, state)
- `type:shared-ui` - Shared UI components
- `type:shared-util` - Shared utilities
- `type:shared-types` - Shared types/interfaces
- `type:types` - Global types
- `type:utils` - Global utilities
- `type:testing` - Testing utilities

## Dependency Rules

### Allowed Dependencies

```
scope:landing (feature) → scope:landing (shared-*) → scope:shared
```

| Source                         | Can Import                                        |
| ------------------------------ | ------------------------------------------------- |
| `scope:landing, type:feature`  | `scope:landing, type:shared-*` and `scope:shared` |
| `scope:landing, type:shared-*` | `scope:landing, type:shared-*` and `scope:shared` |
| `scope:shared`                 | Only other `scope:shared`                         |

### Forbidden Dependencies

- Features cannot import other features directly
- `scope:shared` cannot import `scope:landing`
- `scope:landing` cannot import `scope:api`

## ESLint Configuration

Update `eslint.config.mjs`:

```javascript
'@nx/enforce-module-boundaries': [
  'error',
  {
    enforceBuildableLibDependency: true,
    allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
    depConstraints: [
      // Global shared - can only depend on other shared
      {
        sourceTag: 'scope:shared',
        onlyDependOnLibsWithTags: ['scope:shared'],
      },
      // Landing shared - can depend on shared and landing shared
      {
        sourceTag: 'scope:landing',
        onlyDependOnLibsWithTags: ['scope:landing', 'scope:shared'],
      },
      // Features can only depend on shared (not other features)
      {
        sourceTag: 'type:feature',
        onlyDependOnLibsWithTags: [
          'type:shared-data-access',
          'type:shared-ui',
          'type:shared-util',
          'type:shared-types',
          'scope:shared',
        ],
      },
      // Shared data-access cannot depend on UI
      {
        sourceTag: 'type:shared-data-access',
        notDependOnLibsWithTags: ['type:shared-ui', 'type:feature'],
      },
    ],
  },
],
```

## Verifying Boundaries

```bash
# Lint all projects
pnpm lint

# Lint specific project
nx lint landing-feature-projects

# Check affected
nx affected -t lint
```

## Common Violations

### Feature importing feature

```
Error: A project tagged with "type:feature" can only depend on libs tagged with...
Fix: Extract shared logic to landing/shared/data-access or landing/shared/ui
```

### Landing importing from wrong scope

```
Error: A project tagged with "scope:landing" can only depend on...
Fix: Move shared code to scope:shared if needed by multiple apps
```
