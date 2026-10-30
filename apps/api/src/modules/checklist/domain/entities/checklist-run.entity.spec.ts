import type { ChecklistGroup, ChecklistTemplateContent } from '@portfolio/shared/types';

import { parsedFile, task, templateContent } from '../__fixtures__/checklist.fixture';
import { ChecklistDoc } from './checklist-doc.entity';
import { ChecklistRun } from './checklist-run.entity';

describe('ChecklistRun', () => {
  describe('create()', () => {
    it('should start every task as todo with no note, children included', () => {
      const content = templateContent();
      content.phases[0].rows[0] = task('r1', { state: 'done', note: 'stale' });
      const template = ChecklistDoc.create(parsedFile({ content }));

      const run = ChecklistRun.create('CIMB-123', template, 'portfolio');

      const [first, group] = run.body.phases[0].rows;
      expect(first).toMatchObject({ state: 'todo', note: '' });
      expect((group as ChecklistGroup).children.every((child) => child.state === 'todo')).toBe(true);
    });

    it('should refuse an archived template (CHK-002)', () => {
      const template = ChecklistDoc.create(parsedFile()).archive() as ChecklistDoc;
      const thrown = (() => {
        try {
          ChecklistRun.create('CIMB-123', template, 'portfolio');
        } catch (error) {
          return error;
        }
        return null;
      })();

      expect(thrown).toMatchObject({ errorCode: 'CHECKLIST_DOC_ARCHIVED' });
    });
  });

  describe('replaceBody()', () => {
    const run = () => ChecklistRun.create('CIMB-123', ChecklistDoc.create(parsedFile()), 'portfolio');

    it('should refuse a save based on an older version', () => {
      const saved = run().replaceBody(templateContent(), 1);

      expect(() => saved.replaceBody(templateContent(), 1)).toThrow('saved elsewhere');
    });

    it('should bump the version on a save', () => {
      expect(run().replaceBody(templateContent(), 1).version).toBe(2);
    });
  });

  describe('progress', () => {
    it('should count done and skipped tasks, including group children, and not the group itself', () => {
      const body: ChecklistTemplateContent = templateContent();
      body.phases[0].rows = [
        task('r1', { state: 'done' }),
        {
          kind: 'group',
          id: 'r2',
          text: 'G',
          refs: [],
          note: '',
          children: [task('r3', { state: 'skipped' }), task('r4')],
        },
      ];
      const run = ChecklistRun.create('CIMB-123', ChecklistDoc.create(parsedFile()), 'portfolio').replaceBody(body, 1);

      expect(run.progress).toEqual({ complete: 2, total: 3 });
    });
  });
});
