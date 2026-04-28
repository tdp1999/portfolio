# Investigation: Skill ↔ "Main Technology" Semantics in Experience Form

**Date:** 2026-04-28
**Author:** Claude (read-only audit)
**Trigger:** Epic — Console Code Audits

---

## Question

> Experience form has a "skill" field. Does selecting a skill there reuse the **global Skill entity**? If yes, does "create skill" while editing Experience create a domain-level Skill record (which would be unintuitive)? Should the field be relabeled to "Main Technology"?

---

## Answer (TL;DR)

1. **Yes — `Experience.skills` is a many-to-many relation to the global `Skill` model**, joined through the `ExperienceSkill` table.
2. **No — the Experience form does NOT allow creating new skills inline.** It is a chooser only (`mat-autocomplete` against `experienceService.listAllSkills()` — `GET /skills/all`).
3. The user's worry ("create skill from Experience would create a domain-level Skill") is **not a current bug**. It would only be a problem if a future change added an inline-create button to the autocomplete.
4. **Renaming the field to "Main Technology" is purely a UX/labeling decision** — it does not change the underlying entity reuse. It is safe.

---

## Evidence

### BE: Prisma schema (`apps/api/prisma/schema.prisma`)

```prisma
model Skill {
  id                String        @id @default(uuid()) @db.Uuid
  name              String
  category          SkillCategory
  parentSkillId     String?       @db.Uuid
  ...
  experiences       ExperienceSkill[]
  projects          ProjectSkill[]
}

model ExperienceSkill {
  experienceId String @db.Uuid
  skillId      String @db.Uuid
  experience   Experience @relation(...)
  skill        Skill      @relation(fields: [skillId], references: [id], onDelete: Cascade)
  @@id([experienceId, skillId])
  @@map("experience_skills")
}
```

So `Experience` and `Project` both reference the same `Skill` table via separate join tables. **One global Skill entity** — a skill named "TypeScript" is the same row whether it appears under an Experience or a Project.

### FE: `experience-form-page.ts` + `.html`

- `experienceService.listAllSkills()` calls `GET /skills/all` and returns `SkillOption[]`.
- The form holds `selectedSkills = signal<SkillOption[]>([])` and a separate `skillSearchControl: FormControl<string>` for autocomplete.
- `onSkillSelected(event)` adds the chosen `SkillOption` to the list. **No "create new" path exists in the template.**
- On submit: `skillIds: this.selectedSkills().map((s) => s.id)` — sends only IDs, never new-skill payloads.

```html
<mat-autocomplete #skillAuto="matAutocomplete" (optionSelected)="onSkillSelected($event)">
  @for (skill of filteredSkills(); track skill.id) {
    <mat-option [value]="skill">{{ skill.name }}</mat-option>
  }
</mat-autocomplete>
```

No "+ Create" `<mat-option>`, no fallback action when the search yields zero results.

### FE: `experience.service.ts`

Only one skill-related method exists:

```ts
listAllSkills() {
  return this.api.get<SkillOption[]>('/skills/all');
}
```

There is no `createSkill`, no inline-create call site. To add a new skill, the user must navigate to **`/skills/new`** and create it via `feature-skill/skill-form-page`.

---

## Recommendations

1. **Keep entity reuse.** A global `Skill` table is correct — it allows cross-linking Experience↔Skill↔Project on the landing page and avoids string-match deduplication.
2. **Label change is a UX call**, not a data-model call. Some options:
   - Keep `Skills` (current). Pro: matches DB. Con: doesn't communicate "this represents the *primary tech stack* used in this role."
   - Rename to `Technologies` or `Tech Stack`. Pro: more accurate to common CV vocabulary. Con: diverges from the URL/admin section name `/skills`.
   - Rename to `Main Technologies`. Pro: emphasizes the "main" angle the user mentioned. Con: implies a primary-vs-secondary distinction the data model doesn't capture.
   - Compromise: section title `Tech Stack`, helper text "Pick the main technologies used in this role from your global skills library."
3. **If the user later wants inline-create**, do it deliberately:
   - Add an explicit "+ Create new skill" CTA in the autocomplete dropdown (last option when filter yields 0).
   - Open the **same `MediaPickerDialog`-style modal pattern** (a small dialog reusing `feature-skill` create logic) so the new skill enters the global library and the Experience picks it up.
   - Surface a toast: "Created skill 'X' in your global library."
   - This would make the inline-create explicit and unambiguous, addressing the user's original concern head-on rather than hiding it.

For this audit, **no code change is recommended**. The label decision belongs in the Form System Design epic; the inline-create question is deferred until the user asks for it.

---

## Files inspected (read-only)

- `apps/api/prisma/schema.prisma` (Skill, Experience, ExperienceSkill, Project, ProjectSkill)
- `libs/console/feature-experience/src/lib/experience-form-page/experience-form-page.ts`
- `libs/console/feature-experience/src/lib/experience-form-page/experience-form-page.html`
- `libs/console/feature-experience/src/lib/experience.service.ts`
- `libs/console/feature-experience/src/lib/experience.types.ts` (SkillOption shape)
