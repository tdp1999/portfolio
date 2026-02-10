# Task: Document TDD Workflow with Practical Examples

## Status: completed

## Goal

Create comprehensive documentation for TDD workflow with practical examples developers can follow.

## Context

TDD requires discipline and clear patterns. This task documents the Red-Green-Refactor workflow with concrete examples, including how to use the test-runner subagent for validation. This builds on the testing patterns already in `.context/patterns.md`.

## Acceptance Criteria

- [ ] TDD workflow guide added to `README.md` or separate `CONTRIBUTING.md`
- [ ] Guide includes:
  - Red-Green-Refactor cycle explanation
  - When to use test-runner subagent vs running tests manually
  - Practical example: Adding a new API endpoint with TDD
  - Practical example: Adding a new component with TDD
  - Testing pyramid (E2E < Integration < Unit)
  - Coverage targets by code type
  - Common testing patterns and anti-patterns
- [ ] Examples reference existing test utilities from `libs/shared/testing`
- [ ] Guide explains headless vs headed mode for E2E tests
- [ ] Guide includes commands for running different test types

## Technical Notes

- Structure:
  1. Overview of TDD principles
  2. Red-Green-Refactor cycle
  3. Example 1: API endpoint (backend TDD)
  4. Example 2: Component (frontend TDD)
  5. Using test-runner subagent
  6. Testing best practices
  7. Debugging failing tests
- Link to `.context/patterns.md` for reference
- Keep examples practical and realistic
- Include code snippets that developers can copy

## Files to Touch

- `README.md` or `CONTRIBUTING.md` (new section or new file)
- Optionally update `.context/patterns.md` if new patterns discovered

## Dependencies

- All previous tasks (need working test infrastructure to document)

## Complexity: M

## Progress Log
