# Task: Clean Up UI Library Stub Files

## Status: pending

## Goal

Remove the original stub component files from libs/ui that were generated during Nx setup.

## Context

The UI library was generated with placeholder component files (ui.ts, ui.html, ui.scss). Now that real components exist, these stubs should be removed to avoid confusion.

## Acceptance Criteria

- [ ] `libs/ui/src/lib/ui/ui.ts` deleted (or repurposed)
- [ ] `libs/ui/src/lib/ui/ui.html` deleted
- [ ] `libs/ui/src/lib/ui/ui.scss` deleted
- [ ] `libs/ui/src/lib/ui/ui.spec.ts` deleted
- [ ] `libs/ui/src/lib/ui/` directory removed if empty
- [ ] `libs/ui/src/index.ts` updated to not export stub component
- [ ] All imports of stub component removed
- [ ] Library builds successfully: `pnpm nx build ui`
- [ ] No broken references in other files

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
