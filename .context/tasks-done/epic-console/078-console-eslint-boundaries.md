# Task: Configure ESLint module boundaries for console scope

## Status: done

## Goal
Add `scope:console` boundary rules to ESLint config so console libs cannot import landing-scoped libs and vice versa.

## Context
Must be done before creating console libs to enforce boundaries from the start. Follows the existing pattern for `scope:landing` and `scope:shared`.

## Acceptance Criteria
- [x] `scope:console` added to ESLint module boundary rules in `eslint.config.mjs`
- [x] Console features can import: console shared → global shared
- [x] Console libs CANNOT import `scope:landing` libs
- [x] Landing libs CANNOT import `scope:console` libs
- [x] Lint passes: `nx lint console`

## Technical Notes
- Read existing `eslint.config.mjs` boundary rules for pattern
- Add constraints mirroring the landing scope rules

## Files to Touch
- `eslint.config.mjs`

## Dependencies
- 076-console-app-scaffold

## Complexity: S
