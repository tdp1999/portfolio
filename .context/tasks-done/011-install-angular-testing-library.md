# Task: Install Angular Testing Library

## Status: completed

## Goal
Install and configure Angular Testing Library for component testing with better testing practices than default Angular TestBed.

## Context
Angular Testing Library provides a more user-centric approach to component testing, focusing on testing behavior rather than implementation details. This aligns with TDD principles in the patterns.md file.

## Acceptance Criteria
- [x] `@testing-library/angular` installed as dev dependency
- [x] `@angular/cdk/testing` installed as dev dependency (for Angular-specific utilities)
- [x] `jest-extended` installed as dev dependency (optional but useful matchers)
- [x] Jest configuration updated if needed to work with Testing Library
- [x] Example component test created using Testing Library in `apps/landing/src/app/app.spec.ts`
- [x] Test can be run with `pnpm nx test landing`

## Technical Notes
- Use `pnpm add -D @testing-library/angular @angular/cdk/testing jest-extended`
- Testing Library encourages querying by accessible roles and labels
- Use `render()` from Testing Library instead of raw TestBed
- Reference: https://testing-library.com/docs/angular-testing-library/intro/

## Files to Touch
- `package.json` (workspace root - add dependencies)
- `apps/landing/src/app/app.component.spec.ts` (update with Testing Library example)
- `jest.config.ts` or `jest.preset.js` (may need updates for Testing Library)

## Dependencies
- None - can be done in parallel with 010

## Complexity: S

## Progress Log

### 2026-02-01
- Installed `@testing-library/angular`, `@testing-library/dom`, `@testing-library/jest-dom`, `jest-extended`
- Installed `@angular/cdk` for Angular testing utilities
- Updated `apps/landing/src/app/app.spec.ts` with Testing Library approach
- Added `testPathIgnorePatterns` to jest.config.cts to exclude e2e folder
- All 3 tests passing with `pnpm nx test landing`
