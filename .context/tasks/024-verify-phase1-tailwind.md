# Task: Verify Phase 1 - Tailwind Token Foundation

## Status: pending

## Goal
Verify that all Tailwind tokens and base styles work correctly in the landing app before proceeding to Phase 2.

## Context
End of Phase 1 verification. This ensures the foundation is solid before adding Angular Material and components. Tests include visual verification and build validation.

## Acceptance Criteria
- [ ] Landing app builds without errors: `pnpm build:landing`
- [ ] Landing app serves: `pnpm dev:landing`
- [ ] Test classes render correctly in browser:
  - `bg-accent-500` shows blue background
  - `text-primary` shows primary color text
  - `p-4 rounded-lg shadow-sm` applies spacing/effects
- [ ] Fluid typography scales on window resize (text-xl → text-5xl)
- [ ] Gray scale tokens work (gray-50 through gray-950)
- [ ] Dark mode toggle in DevTools changes all colors
- [ ] Bundle size within budget (check total JS size)
- [ ] Update ADR-007 or create new ADR for Tailwind + SCSS hybrid

## Technical Notes
Test procedure:
1. Add test div to `apps/landing/src/app/app.component.html`:
   ```html
   <div class="bg-accent-500 text-white p-4 rounded-lg shadow-md">
     <h1 class="text-4xl font-semibold">Design System Test</h1>
     <p class="text-base mt-2">This tests Tailwind utilities and custom tokens.</p>
   </div>
   ```
2. Run `pnpm dev:landing`
3. Verify colors, spacing, typography in browser
4. Open DevTools, add `.dark` to `<html>`
5. Verify dark mode colors apply
6. Remove test div after verification

ADR update needed to document:
- Hybrid approach: Tailwind for utilities, SCSS for Angular Material
- Supersedes ADR-007's SCSS-only approach for this use case

## Files to Touch
- `apps/landing/src/app/app.component.html` (temporary test code)
- `.context/decisions.md` (add/update ADR)

## Dependencies
- 021-define-color-tokens
- 022-define-typography-tokens
- 023-define-dark-mode-tokens

## Complexity: S

## Progress Log
