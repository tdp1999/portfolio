# Task: Install Angular Testing Library

## Status: pending

## Goal
Install and configure Angular Testing Library for component testing with better testing practices than default Angular TestBed.

## Context
Angular Testing Library provides a more user-centric approach to component testing, focusing on testing behavior rather than implementation details. This aligns with TDD principles in the patterns.md file.

## Acceptance Criteria
- [ ] `@testing-library/angular` installed as dev dependency
- [ ] `@angular/cdk/testing` installed as dev dependency (for Angular-specific utilities)
- [ ] `jest-extended` installed as dev dependency (optional but useful matchers)
- [ ] Jest configuration updated if needed to work with Testing Library
- [ ] Example component test created using Testing Library in `apps/landing/src/app/app.component.spec.ts`
- [ ] Test can be run with `pnpm nx test landing`

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
