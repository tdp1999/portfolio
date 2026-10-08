import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { ChecklistGroup } from '@portfolio/shared/types';

import { ChecklistMarkdownParser } from './checklist-markdown.parser';

const LANE_L = readFileSync(join(__dirname, '__fixtures__/checklist-lane-l.md'), 'utf8');

const template = (body: string) => `# Checklist test\n\nIntro.\n\n${body}`;
const TABLE_HEAD = '| ✔ | Việc | Ai làm | Ai kiểm |\n| --- | --- | --- | --- |';

describe('ChecklistMarkdownParser', () => {
  describe('parseTemplate()', () => {
    it('should read the 8 phases of lane L and nest ↳ rows under their group', () => {
      const { title, content } = ChecklistMarkdownParser.parseTemplate(LANE_L, 'checklist-lane-l.md');

      expect(title).toBe('Checklist làn L');
      expect(content.phases).toHaveLength(8);
      const groups = content.phases[2].rows.filter((row): row is ChecklistGroup => row.kind === 'group');
      expect(groups.map((group) => [group.text, group.children.length])).toEqual([
        ['Example mapping', 3],
        ['Từ quy tắc ra test', 5],
      ]);
    });

    it('should read the phase number, name, role and gate', () => {
      const { content } = ChecklistMarkdownParser.parseTemplate(LANE_L, 'checklist-lane-l.md');

      const { number, name, role, gate } = content.phases[1];
      expect({ number, name, role, gate: gate?.markdown }).toEqual({
        number: 2,
        name: 'Solution Design',
        role: 'Solution Architect',
        gate: 'Manager duyệt design doc.',
      });
    });

    it('should make prose after the last table the checklist footer, not a note of the last phase', () => {
      const { content } = ChecklistMarkdownParser.parseTemplate(LANE_L, 'checklist-lane-l.md');

      expect(content.footer).toEqual({
        markdown: '**Gặp bug ở bất kỳ pha nào:** tra E.',
        refs: [{ kind: 'lookup', key: 'E' }],
      });
      expect(content.phases[7].note).toBeNull();
    });

    it.each([
      ['there is no phase', '# Title\n\nOnly prose.', /no phase found/],
      [
        'a ↳ row has no group above it',
        template(`## 1. A | B\n\n${TABLE_HEAD}\n| [ ] | ↳ orphan | Owner | — |`),
        /:9: "↳" row has no group/,
      ],
      [
        'a row has the wrong number of cells',
        template(`## 1. A | B\n\n${TABLE_HEAD}\n| [ ] | two cells |`),
        /:9: expected 4 cells/,
      ],
    ])('should reject the file when %s', (_case, markdown, message) => {
      const parse = () => ChecklistMarkdownParser.parseTemplate(markdown, 'x.md');

      expect(parse).toThrow(message);
    });
  });

  describe('extractRefs()', () => {
    it.each([
      [
        'a lookup and a project ref, in order',
        'quét danh mục chung (tra G) + câu hỏi hay phải hỏi · 📁 §4',
        [
          { kind: 'lookup', key: 'G' },
          { kind: 'project', key: '4' },
        ],
      ],
      [
        'several sections after one folder mark',
        'dữ liệu thật · 📁 §3, §6',
        [
          { kind: 'project', key: '3' },
          { kind: 'project', key: '6' },
        ],
      ],
      ['the quoted placeholder', 'có chỉ dẫn "tra X" sang `bang-tra.md`', []],
      ['the verb "kiểm tra"', 'Owner kiểm tra B trước', []],
      ['the legend mark with a letter', 'Dấu **📁 §N** nghĩa là', []],
    ])('should read %s', (_case, text, refs) => {
      expect(ChecklistMarkdownParser.extractRefs(text)).toEqual(refs);
    });
  });

  describe('parseSectioned()', () => {
    it('should key sections by letter or number and drop the title prefix', () => {
      const markdown =
        '# Hồ sơ project: Portfolio\n\nIntro.\n\n## 1. Người dùng\n\nAi dùng.\n\n## 10. Tài liệu\n\nỞ đâu.';

      const { title, content } = ChecklistMarkdownParser.parseSectioned(markdown, 'projects/portfolio.md');

      expect(title).toBe('Portfolio');
      expect(content.sections).toEqual([
        { key: '1', title: 'Người dùng', markdown: 'Ai dùng.' },
        { key: '10', title: 'Tài liệu', markdown: 'Ở đâu.' },
      ]);
    });

    it('should reject a section heading without a key', () => {
      const parse = () => ChecklistMarkdownParser.parseSectioned('# Bảng tra\n\n## Chọn làn\n', 'bang-tra.md');

      expect(parse).toThrow('bang-tra.md:3: section heading must look like');
    });
  });
});
