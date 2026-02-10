# Task: Clean Up UI Library Stub Files

## Status: completed

## Goal

Remove the original stub component files from libs/ui that were generated during Nx setup.

## Context

The UI library was generated with placeholder component files (ui.ts, ui.html, ui.scss). Now that real components exist, these stubs should be removed to avoid confusion.

## Acceptance Criteria

- [x] `libs/ui/src/lib/ui/ui.ts` deleted (or repurposed)
- [x] `libs/ui/src/lib/ui/ui.html` deleted
- [x] `libs/ui/src/lib/ui/ui.scss` deleted
- [x] `libs/ui/src/lib/ui/ui.spec.ts` deleted
- [x] `libs/ui/src/lib/ui/` directory removed if empty
- [x] `libs/ui/src/index.ts` updated to not export stub component
- [x] All imports of stub component removed (verified with grep)
- [x] Library builds successfully: `pnpm nx build ui` (N/A - no build target, tests pass)
- [x] No broken references in other files

## Technical Notes

Current stub files to remove:

```
libs/ui/src/lib/ui/
├── ui.ts           # Stub component
├── ui.html         # Empty template
├── ui.scss         # Empty styles (has styleUrl bug)
└── ui.spec.ts      # Stub test
```

Check `libs/ui/src/index.ts` for:

```typescript
// Remove this line
export * from './lib/ui/ui';
```

Verify no other files import the stub component before deleting.

## Files to Touch

- `libs/ui/src/lib/ui/ui.ts` (delete)
- `libs/ui/src/lib/ui/ui.html` (delete)
- `libs/ui/src/lib/ui/ui.scss` (delete)
- `libs/ui/src/lib/ui/ui.spec.ts` (delete)
- `libs/ui/src/index.ts` (update exports)

## Dependencies

- 039-verify-phase4-components (ensure new components work first)

## Complexity: S

## Progress Log

- [2026-02-10] Started cleanup
- [2026-02-10] Verified stub files location: libs/landing/shared/ui/src/lib/ui/
- [2026-02-10] Verified no imports of stub component (only in index.ts)
- [2026-02-10] Removed stub export from index.ts
- [2026-02-10] Deleted entire libs/landing/shared/ui/src/lib/ui/ directory
- [2026-02-10] Verified tests pass: 10 test suites, 107 tests (down from 11 suites, 108 tests)
- [2026-02-10] Verified landing app builds successfully (369.24 kB bundle)
