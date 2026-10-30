import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { ChecklistGroup } from '@portfolio/shared/types';

import { ChecklistMarkdownParser } from './checklist-markdown.parser';
import { ChecklistRefSchema, MAX_REF_KEY } from './checklist.dto';

const SIZE_L = readFileSync(join(__dirname, '__fixtures__/checklist-size-l.md'), 'utf8');

const template = (body: string) => `# Checklist test\n\nIntro.\n\n${body}`;
const TABLE_HEAD = '| ✔ | Việc | Ai làm | Ai kiểm |\n| --- | --- | --- | --- |';

describe('ChecklistMarkdownParser', () => {
  describe('parseTemplate()', () => {
    it('should read the 8 phases of size L and nest ↳ rows under their group', () => {
      const { title, content } = ChecklistMarkdownParser.parseTemplate(SIZE_L, 'checklist-size-l.md');

      expect(title).toBe('Checklist làn L');
      expect(content.phases).toHaveLength(8);
      const groups = content.phases[2].rows.filter((row): row is ChecklistGroup => row.kind === 'group');
      expect(groups.map((group) => [group.text, group.children.length])).toEqual([
        ['Example mapping', 3],
        ['Từ quy tắc ra test', 5],
      ]);
    });

    it('should read the phase number, name, role and gate', () => {
      const { content } = ChecklistMarkdownParser.parseTemplate(SIZE_L, 'checklist-size-l.md');

      const { number, name, role, gate } = content.phases[1];
      expect({ number, name, role, gate: gate?.markdown }).toEqual({
        number: 2,
        name: 'Solution Design',
        role: 'Solution Architect',
        gate: 'Manager duyệt design doc.',
      });
    });

    it('should read a gate written as "Qua phase khi" like "Qua pha khi"', () => {
      const md = template(
        `## 1. Problem Discovery | Business Analyst\n\n**Qua phase khi:** Owner hiểu đúng vấn đề.\n\n${TABLE_HEAD}\n| [ ] | Việc | Owner | — |`
      );

      const { content } = ChecklistMarkdownParser.parseTemplate(md, 'checklist-size-x.md');

      expect(content.phases[0].gate?.markdown).toBe('Owner hiểu đúng vấn đề.');
      expect(content.phases[0].note).toBeNull();
    });

    it('should make prose after the last table the checklist footer, not a note of the last phase', () => {
      const { content } = ChecklistMarkdownParser.parseTemplate(SIZE_L, 'checklist-size-l.md');

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

  describe('parseTemplate() with format 2', () => {
    const LANE_V2 = [
      '<!-- format: 2 -->',
      '# Checklist size L',
      '',
      'Intro tra A.',
      '',
      '## 5. Implementation | Developer',
      '',
      '**Qua phase khi:** Máy báo xanh.',
      '',
      '**Đầu ra:** code và test.',
      '',
      '### 5.1 Làm từng slice',
      '',
      'Mỗi slice đi qua ba bước.',
      '',
      '#### 5.1c Viết code cho slice',
      'Ai làm: Claude, session mới soạn; Owner chốt · Ai kiểm: ⚙ review-round; Owner chốt',
      'Claude: ⚙ 5.1c',
      '',
      'Code chỉ dựa vào spec và test của 5.1b.',
      '',
      '- Đầu ra: các test của 5.1b xanh.',
      '- Nếu slice chạm quyền, R2 thêm góc bảo mật 📁 §5',
      '',
      'Ref: tra K, tra L',
      '',
      '### 5.2 Chạy check của máy',
      'Ai làm: Máy · Ai kiểm: Owner xem output',
      '',
      'Máy chạy type check, lint, test và build.',
      '',
      '---',
      '',
      'Gặp bug ở bất kỳ phase nào: xem tra E.',
    ].join('\n');

    it('should read an item heading as SN, title, roles, description, content list and refs', () => {
      const { content } = ChecklistMarkdownParser.parseTemplate(LANE_V2, 'lanes/size-l.md');

      const [group, check] = content.phases[0].rows;
      expect(group).toMatchObject({
        kind: 'group',
        sn: '5.1',
        text: 'Làm từng slice',
        description: 'Mỗi slice đi qua ba bước.',
      });
      expect((group as ChecklistGroup).children).toEqual([
        {
          kind: 'task',
          id: expect.any(String),
          sn: '5.1c',
          text: 'Viết code cho slice',
          description: 'Code chỉ dựa vào spec và test của 5.1b.',
          items: ['Đầu ra: các test của 5.1b xanh.', 'Nếu slice chạm quyền, R2 thêm góc bảo mật 📁 §5'],
          claude: true,
          doer: 'Claude, session mới soạn; Owner chốt',
          checker: '⚙ review-round; Owner chốt',
          refs: [
            { kind: 'project', key: '5' },
            { kind: 'lookup', key: 'K' },
            { kind: 'lookup', key: 'L' },
          ],
          state: 'todo',
          note: '',
        },
      ]);
      expect(check).toMatchObject({ kind: 'task', sn: '5.2', claude: false, items: [], doer: 'Máy' });
    });

    it('should read the gate, keep the output line as the phase note, and read the footer after ---', () => {
      const { title, content } = ChecklistMarkdownParser.parseTemplate(LANE_V2, 'lanes/size-l.md');

      expect(title).toBe('Checklist size L');
      expect(content.intro.markdown).toBe('Intro tra A.');
      expect(content.phases[0]).toMatchObject({ number: 5, name: 'Implementation', role: 'Developer' });
      expect(content.phases[0].gate?.markdown).toBe('Máy báo xanh.');
      expect(content.phases[0].note?.markdown).toBe('**Đầu ra:** code và test.');
      expect(content.footer).toEqual({
        markdown: 'Gặp bug ở bất kỳ phase nào: xem tra E.',
        refs: [{ kind: 'lookup', key: 'E' }],
      });
    });

    it('should give every row a unique id across groups and phases', () => {
      const { content } = ChecklistMarkdownParser.parseTemplate(LANE_V2, 'lanes/size-l.md');

      const [group, check] = content.phases[0].rows;
      const ids = [group.id, ...(group as ChecklistGroup).children.map((c) => c.id), check.id];
      expect(new Set(ids).size).toBe(ids.length);
    });

    it.each([
      ['an unknown format version', LANE_V2.replace('format: 2', 'format: 9'), /format 9 is not supported/],
      [
        'a format line that is not a number',
        LANE_V2.replace('format: 2', 'format: two'),
        /format two is not supported/,
      ],
      [
        'a child item with no group above it',
        '<!-- format: 2 -->\n# L\n\n## 1. A | B\n\n#### 1.1a Làm\nAi làm: Owner · Ai kiểm: —\n\nMột câu.',
        /:6: "####" item has no group above it/,
      ],
      [
        'a group with no child item',
        '<!-- format: 2 -->\n# L\n\n## 1. A | B\n\n### 1.1 Nhóm\n\nMô tả.\n\n### 1.2 Làm\nAi làm: Owner · Ai kiểm: —\n\nMột câu.',
        /:6: item "1.1" has no "Ai làm:" line and no child item/,
      ],
      [
        'a group with a list or a "Claude:" line, which a group never shows',
        '<!-- format: 2 -->\n# L\n\n## 1. A | B\n\n### 1.1 Nhóm\nClaude: ⚙ 1.1\n\n#### 1.1a Làm\nAi làm: Owner · Ai kiểm: —\n\nMột câu.',
        /:6: group "1.1" cannot have a "Claude:" line or a list/,
      ],
      [
        'a prose line after the list',
        '<!-- format: 2 -->\n# L\n\n## 1. A | B\n\n### 1.1 Làm\nAi làm: Owner · Ai kiểm: —\n\nMột câu.\n\n- Một ý.\n\nCâu thứ hai.',
        /:13: item "1.1" has a line after its list that is not a list item or "Ref:"/,
      ],
      [
        'a "Claude:" line without the cog and SN',
        '<!-- format: 2 -->\n# L\n\n## 1. A | B\n\n### 1.1 Làm\nAi làm: Owner · Ai kiểm: —\nClaude: 1.1\n\nMột câu.',
        /:8: "Claude:" line must look like "Claude: ⚙ 1.2"/,
      ],
      [
        'an item heading without an SN',
        '<!-- format: 2 -->\n# L\n\n## 1. A | B\n\n### Làm\nAi làm: Owner · Ai kiểm: —\n\nMột câu.',
        /:6: item heading must look like "### 1.2 Title"/,
      ],
    ])('should reject the file when it has %s', (_case, markdown, message) => {
      expect(() => ChecklistMarkdownParser.parseTemplate(markdown, 'x.md')).toThrow(message);
    });

    it('should still read a file without a format line as the table format', () => {
      const { content } = ChecklistMarkdownParser.parseTemplate(SIZE_L, 'checklist-size-l.md');

      expect(content.phases).toHaveLength(8);
    });
  });

  describe('extractRefs()', () => {
    it('should extract a long marker name that still fits the saved ref schema', () => {
      const longest = `r${'e'.repeat(MAX_REF_KEY - 1)}`;
      const refs = ChecklistMarkdownParser.extractRefs(`⚙ review-design · ⚙ ${longest}x`);

      expect(refs.map((r) => r.key)).toEqual(['review-design', longest]);
      expect(refs.every((ref) => ChecklistRefSchema.safeParse(ref).success)).toBe(true);
    });

    it.each([
      [
        'a ⚙ marker, as a lookup ref keyed by its name',
        '⚙ review: tìm edge case (tra F)',
        [
          { kind: 'lookup', key: 'review' },
          { kind: 'lookup', key: 'F' },
        ],
      ],
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

    it('should skip the format line of a format 2 lookup table', () => {
      const markdown = '<!-- format: 2 -->\n# Lookup\n\nChỉ mở khi cần.\n\n## A. Chọn size\n\nTheo rủi ro.';

      const { title, content } = ChecklistMarkdownParser.parseSectioned(markdown, 'lookup.md');

      expect(title).toBe('Lookup');
      expect(content.intro).toBe('Chỉ mở khi cần.');
    });

    it('should reject a lookup table with an unknown format version', () => {
      const parse = () => ChecklistMarkdownParser.parseSectioned('<!-- format: 3 -->\n# Lookup\n', 'lookup.md');

      expect(parse).toThrow(/format 3 is not supported/);
    });

    it('should reject a section heading without a key', () => {
      const parse = () => ChecklistMarkdownParser.parseSectioned('# Bảng tra\n\n## Chọn làn\n', 'bang-tra.md');

      expect(parse).toThrow('bang-tra.md:3: section heading must look like');
    });
  });
});
