import { ChecklistDocKind } from '@prisma/client';

import { ChecklistFilePolicy } from './checklist-file.policy';

describe('ChecklistFilePolicy', () => {
  it.each([
    ['checklist-size-l.md', { kind: ChecklistDocKind.TEMPLATE, slug: 'checklist-size-l' }],
    ['checklist-lane-l.md', null],
    ['bang-tra.md', { kind: ChecklistDocKind.LOOKUP, slug: 'bang-tra' }],
    ['projects/portfolio.md', { kind: ChecklistDocKind.PROJECT, slug: 'portfolio' }],
    ['projects/_template.md', null],
    ['README.md', null],
    ['checklist-size-l.txt', null],
  ])('should classify %s', (path, expected) => {
    expect(ChecklistFilePolicy.classify(path)).toEqual(expected);
  });
});
