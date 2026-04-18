# Task: E2E tests for picker + all migration points

## Status: pending

## Goal
Write Playwright E2E tests covering the picker UX and every migration point, including a keyboard-only flow.

## Context
Picker touches 5 forms (profile avatar, profile og image, profile resume, profile certification, skill icon) plus two existing consumers (project, blog). One consolidated spec covers picker-level behavior; per-module specs cover each migration.

## Acceptance Criteria
- [ ] Picker spec (`media-picker.spec.ts`): open → Library tab default → filter by MIME → sort → select → "Insert" → dialog closes → value applied. Multi-select variant. Upload flow: switch to Upload tab → upload PDF → auto-selected in Library → "Insert". Recently-used strip populates after successful pick. View mode toggle persists across sessions.
- [ ] Keyboard-only flow: focus trigger → open → Tab to grid → arrow keys navigate → Space selects → Enter confirms → focus returns to trigger.
- [ ] Profile avatar spec: select existing image → save → reload → avatar persists on profile page and landing.
- [ ] Profile resume spec: upload new PDF EN → auto-select → save → download link on landing works.
- [ ] Profile certification spec: toggle "File" mode → pick PDF → save; toggle "Link" mode → paste URL → save; both persist correctly.
- [ ] Project gallery spec (regression): multi-select → "Insert N items" → save. (Call site unchanged — pure regression.)
- [ ] Blog featured image spec (regression): single-select → save. (Call site unchanged.)
- [ ] Skill icon spec: pick SVG icon → save → landing renders.
- [ ] All specs pass in CI.
- [ ] POM pattern, network monitoring for picker API calls, no flakiness (explicit waits for picker open/close).

## Technical Notes
- Follow `aqa-expert` skill for POM and monitor fixture patterns.
- Shared POM: `MediaPickerPage` object with methods `open()`, `filterByMime()`, `selectById()`, `uploadFile()`, `clickInsert()`, `waitForClose()`.
- Dev login credentials in memory: `hello@thunderphong.com / 100100100pPp@`.

**Specialized Skill:** aqa-expert — read `.claude/skills/aqa-expert/SKILL.md`.
**Key sections to read:** test-patterns, monitor-fixture, network-checks, audit-checklist.

## Files to Touch
- apps/console-e2e/src/pages/media-picker.page.ts (POM)
- apps/console-e2e/src/specs/media-picker.spec.ts
- apps/console-e2e/src/specs/profile-avatar-picker.spec.ts
- apps/console-e2e/src/specs/profile-resume-picker.spec.ts
- apps/console-e2e/src/specs/profile-certification-picker.spec.ts
- apps/console-e2e/src/specs/skill-icon-picker.spec.ts
- apps/console-e2e/src/specs/project-gallery-picker.spec.ts (regression)
- apps/console-e2e/src/specs/blog-featured-picker.spec.ts (regression)

## Dependencies
- 267, 268, 269, 270 — all migrations complete

## Complexity: L

## Progress Log
