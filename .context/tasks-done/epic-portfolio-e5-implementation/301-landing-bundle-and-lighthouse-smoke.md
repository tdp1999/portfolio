# Task: Landing bundle budget + Lighthouse smoke gate

## Status: pending

## Goal
Enforce a first-load JS budget and run a Lighthouse smoke pass per page. E5 closes only when every V1 page hits ≥ 80 across all four scores. (≥ 95 is E6's job.)

## Context
The site can't ship looking right but loading slow. Initiative success metrics floor: Lighthouse ≥ 95 (E6), but E5 must clear ≥ 80 to prove the foundation isn't broken.

## Acceptance Criteria
- [ ] First-load JS ≤ 150 kB gzipped on home; ≤ 180 kB on project detail (markdown renderer)
- [ ] Bundle analysis report committed under `docs/bundle/` after each major milestone
- [ ] Font subset audit: 3 families × Latin only ≤ 80 kB total
- [ ] Lighthouse run (Chrome DevTools or `lhci`) on every prerendered route at desktop + mobile
- [ ] Each route ≥ 80 across performance / accessibility / best-practices / SEO
- [ ] Failures: open issues / TODOs in this task's progress log; do not silently waive

## Technical Notes
- `pnpm nx build landing --stats-json` → run `webpack-bundle-analyzer`.
- For lighthouse, use `lhci autorun` with config covering each route.
- Common offenders: unused Tailwind JIT classes, full Material/CDK imports if accidentally pulled in, heavy markdown plugins.

## Files to Touch
- `apps/landing/project.json`
- `lighthouserc.json`
- `package.json` (add `lhci` script)

## Dependencies
- 300

## Complexity: M

## Progress Log
