import { ChecklistDocKind } from '@prisma/client';

import { ChecklistFilePolicy } from './checklist-file.policy';

describe('ChecklistFilePolicy', () => {
  it.each([
    ['checklist-lane-l.md', { kind: ChecklistDocKind.TEMPLATE, slug: 'checklist-lane-l' }],
    ['bang-tra.md', { kind: ChecklistDocKind.LOOKUP, slug: 'bang-tra' }],
    ['projects/portfolio.md', { kind: ChecklistDocKind.PROJECT, slug: 'portfolio' }],
    ['projects/_template.md', null],
    ['README.md', null],
    ['checklist-lane-l.txt', null],
  ])('should classify %s', (path, expected) => {
    expect(ChecklistFilePolicy.classify(path)).toEqual(expected);
  });
});
