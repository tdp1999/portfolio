# Task: Restructure Libs Architecture with Scoped Libraries

## Status: completed

## Goal

Implement nested library structure with scope tags and ESLint module boundary enforcement for clean separation of concerns.

## Context

Current libs structure mixes global shared and app-specific libraries. Need to implement scoped architecture:

- `libs/shared/*` - Global shared (FE + BE)
- `libs/landing/shared/*` - Landing-specific shared resources
- `libs/landing/feature-*` - Landing feature modules

## Acceptance Criteria

- [x] Global shared libs reorganized under `libs/shared/`
- [x] Landing shared libs created: `data-access`, `ui`, `util`
- [x] Module boundary tags configured in ESLint
- [x] `tsconfig.base.json` paths updated for new structure
- [x] All existing libs migrated to new structure
- [x] `pnpm lint` passes with new boundary rules
- [x] Dependency graph shows correct architecture

## Technical Notes

### Target Structure

```
libs/
├── shared/                    # Global (FE + BE)
│   ├── testing/               # Existing
│   ├── types/                 # Move from libs/types
│   └── utils/                 # Move from libs/utils
│
├── landing/                   # Landing app scope
│   ├── shared/
│   │   ├── data-access/       # API services, state
│   │   ├── ui/                # Landing UI components
│   │   └── util/              # Landing utilities
│   │
│   ├── feature-projects/      # Future
│   ├── feature-skills/        # Future
│   └── feature-experience/    # Future
```

### Tag System

| Scope           | Tags                                  |
| --------------- | ------------------------------------- |
| Global shared   | `scope:shared`, `type:{name}`         |
| Landing shared  | `scope:landing`, `type:shared-{type}` |
| Landing feature | `scope:landing`, `type:feature`       |

### Import Paths

```typescript
// Global
import { Project } from '@portfolio/shared/types';
import { formatDate } from '@portfolio/shared/utils';

// Landing shared
import { ProjectService } from '@portfolio/landing/shared/data-access';
import { CardComponent } from '@portfolio/landing/shared/ui';

// Features
import { ProjectsComponent } from '@portfolio/landing/feature-projects';
```

### ESLint Module Boundaries

See `.claude/skills/ng-lib/references/module-boundaries.md` for full configuration.

Key rules:

- Features → Landing Shared → Global Shared (dependency direction)
- Features cannot import other features
- `scope:shared` cannot import `scope:landing`

## Files to Touch

- `eslint.config.mjs` (module boundary rules)
- `tsconfig.base.json` (path aliases)
- `libs/types/project.json` (move + retag)
- `libs/utils/project.json` (move + retag)
- `libs/ui/project.json` (evaluate: move to landing/shared/ui or keep global)
- `libs/api-client/project.json` (evaluate: landing-specific or global)
- New libs via `nx g @nx/angular:library`

## Subtasks

1. Update ESLint with module boundary rules
2. Move `libs/types` → `libs/shared/types` with proper tags
3. Move `libs/utils` → `libs/shared/utils` with proper tags
4. Evaluate and relocate `libs/ui` and `libs/api-client`
5. Create `libs/landing/shared/data-access`
6. Create `libs/landing/shared/ui`
7. Create `libs/landing/shared/util`
8. Update all import paths in apps
9. Verify with `pnpm lint` and `nx graph`

## Dependencies

None

## Complexity: L

## Progress Log

- [2026-02-04] Task completed:
  - Created `ng-lib` skill at `.claude/skills/ng-lib/`
  - Updated ESLint with module boundary rules (scope:shared, scope:landing, scope:api)
  - Moved `libs/types` → `libs/shared/types` (tagged: scope:shared, type:types)
  - Moved `libs/utils` → `libs/shared/utils` (tagged: scope:shared, type:utils)
  - Deleted stub `libs/ui` and `libs/api-client`
  - Created `libs/landing/shared/data-access` (tagged: scope:landing, type:shared-data-access)
  - Created `libs/landing/shared/ui` (tagged: scope:landing, type:shared-ui)
  - Created `libs/landing/shared/util` (tagged: scope:landing, type:shared-util)
  - Updated all import paths from `@portfolio/types` to `@portfolio/shared/types`
  - All 66 tests passing across 8 projects
