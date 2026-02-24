# Task: Create console shared libraries

## Status: done

## Goal
Scaffold the console-scoped shared library structure using the `/ng-lib` skill.

## Context
Follows the same convention as `libs/landing/shared/*`. These libs house console-specific shared code (layouts, services, utilities).

## Acceptance Criteria
- [x] `libs/console/shared/ui/` created — tags: `scope:console`, `type:shared-ui`
- [x] `libs/console/shared/data-access/` created — tags: `scope:console`, `type:shared-data-access`
- [x] `libs/console/shared/util/` created — tags: `scope:console`, `type:shared-util`
- [x] Each lib has proper `project.json`, `index.ts` barrel, and import path (`@portfolio/console/shared/*`)
- [x] All libs compile and lint passes

## Technical Notes
- Use `/ng-lib` skill for generation
- Selector prefix: `console` for UI lib
- Verify `tsconfig.base.json` paths are added

## Files to Touch
- `libs/console/shared/ui/` (generated)
- `libs/console/shared/data-access/` (generated)
- `libs/console/shared/util/` (generated)
- `tsconfig.base.json` (paths)

## Dependencies
- 078-console-eslint-boundaries

## Complexity: M
