import { ChecklistDocKind } from '@prisma/client';

import type { ChecklistTask, ChecklistTemplateContent } from '@portfolio/shared/types';

import { ParsedChecklistFile } from '../checklist.types';

export const task = (id: string, overrides: Partial<ChecklistTask> = {}): ChecklistTask => ({
  kind: 'task',
  id,
  text: `Task ${id}`,
  refs: [],
  doer: 'Owner',
  checker: '—',
  state: 'todo',
  note: '',
  ...overrides,
});

/** One phase: a task, then a group of two children. */
export const templateContent = (): ChecklistTemplateContent => ({
  intro: { markdown: '', refs: [] },
  footer: null,
  phases: [
    {
      id: 'p1',
      number: 1,
      name: 'Discovery',
      role: 'Business Analyst',
      gate: null,
      note: null,
      rows: [
        task('r1'),
        { kind: 'group', id: 'r2', text: 'Group', refs: [], note: '', children: [task('r3'), task('r4')] },
      ],
    },
  ],
});

export const parsedFile = (overrides: Partial<ParsedChecklistFile> = {}): ParsedChecklistFile => ({
  kind: ChecklistDocKind.TEMPLATE,
  slug: 'checklist-lane-l',
  title: 'Checklist làn L',
  content: templateContent(),
  sourceHash: 'hash-1',
  ...overrides,
});
