import type { ChecklistPhase, ChecklistRunBody, ChecklistTask } from '@portfolio/shared/types';

import {
  findLookupSection,
  inlineLines,
  inlineSegments,
  phaseProgress,
  roleTaskCounts,
  rowLabel,
  taskMatchesRole,
  withMovedRow,
  withNewTask,
  withoutRow,
  withPhaseTasksState,
  withRowText,
  withShiftedRow,
  withTaskState,
  rowView,
  profileInRepo,
} from './checklist.util';

const task = (id: string, patch: Partial<ChecklistTask> = {}): ChecklistTask => ({
  kind: 'task',
  id,
  text: id,
  refs: [],
  doer: 'Owner',
  checker: '—',
  state: 'todo',
  note: '',
  ...patch,
});

const phase = (rows: ChecklistPhase['rows']): ChecklistPhase => ({
  id: 'p1',
  number: 1,
  name: 'Discovery',
  role: null,
  gate: null,
  note: null,
  rows,
});

describe('inlineSegments', () => {
  it('should cut bold, code and both kinds of ref out of a row, in reading order', () => {
    const segments = inlineSegments('**Biên**: quét (tra F) và `WHEN` · 📁 §3, §6');

    expect(segments).toEqual([
      { kind: 'strong', text: 'Biên' },
      { kind: 'text', text: ': quét (' },
      { kind: 'ref', ref: { kind: 'lookup', key: 'F' }, label: 'tra F' },
      { kind: 'text', text: ') và ' },
      { kind: 'code', text: 'WHEN' },
      { kind: 'text', text: ' · ' },
      { kind: 'ref', ref: { kind: 'project', key: '3' }, label: '§3', icon: 'folder-open' },
      { kind: 'ref', ref: { kind: 'project', key: '6' }, label: '§6', icon: 'folder-open' },
    ]);
  });

  it('should leave the verb "kiểm tra" and the placeholder "tra X" as text', () => {
    expect(inlineSegments('kiểm tra A rồi "tra X"').every((s) => s.kind === 'text')).toBe(true);
  });

  it('should turn <br> into a line break, with or without the closing slash', () => {
    expect(inlineSegments('**Tự phân tích**:<br>vấn đề<br/>giả định')).toEqual([
      { kind: 'strong', text: 'Tự phân tích' },
      { kind: 'text', text: ':' },
      { kind: 'break' },
      { kind: 'text', text: 'vấn đề' },
      { kind: 'break' },
      { kind: 'text', text: 'giả định' },
    ]);
  });

  it('should turn a ⚙ marker into a lookup ref named after the procedure, with its icon', () => {
    expect(inlineSegments('⚙ review: tìm edge case')).toEqual([
      { kind: 'ref', ref: { kind: 'lookup', key: 'review' }, label: 'review', icon: 'users' },
      { kind: 'text', text: ': tìm edge case' },
    ]);
  });

  it('should give a marker with no icon of its own the cog', () => {
    expect(inlineSegments('⚙ handoff')[0]).toMatchObject({ label: 'handoff', icon: 'settings' });
  });
});

describe('inlineLines', () => {
  it('should cut the segments into lines at each <br>, dropping the break itself', () => {
    expect(inlineLines('**Đầu ra**:<br>vấn đề<br>giả định')).toEqual([
      [
        { kind: 'strong', text: 'Đầu ra' },
        { kind: 'text', text: ':' },
      ],
      [{ kind: 'text', text: 'vấn đề' }],
      [{ kind: 'text', text: 'giả định' }],
    ]);
  });

  it('should keep a row with no <br> as one line', () => {
    expect(inlineLines('một dòng')).toEqual([[{ kind: 'text', text: 'một dòng' }]]);
  });
});

describe('findLookupSection', () => {
  const sections = [
    { key: 'F', title: 'Edge case' },
    { key: 'Q', title: 'Review code ⚙ review-code' },
    { key: 'R', title: 'Review độc lập ⚙\uFE0F review' },
  ];

  it('should find a section by its letter, and a marker by the ⚙ name in the title', () => {
    expect(findLookupSection(sections, 'F')?.key).toBe('F');
    expect(findLookupSection(sections, 'review')?.key).toBe('R');
    expect(findLookupSection(sections, 'review-code')?.key).toBe('Q');
  });

  it('should return null when no section matches', () => {
    expect(findLookupSection(sections, 'handoff')).toBeNull();
  });
});

describe('rowLabel', () => {
  it('should drop the markdown markers and read a line break as a space', () => {
    expect(rowLabel(task('1.2', { text: '**Tự phân tích**:<br>vấn đề<br/>giả định' }))).toBe(
      'Tự phân tích: vấn đề giả định'
    );
  });
});

describe('taskMatchesRole', () => {
  it('should read ⚙ review as both reviewers and the Claude who merges their findings', () => {
    const row = task('6.3b', { doer: '⚙ review', checker: 'Owner lọc finding' });

    expect(['Claude, session mới', 'Codex', 'Claude', 'Owner'].every((role) => taskMatchesRole(row, role))).toBe(true);
    expect(taskMatchesRole(row, 'Tester')).toBe(false);
  });

  it('should match a role named in either the doer or the checker', () => {
    const row = task('r1', { doer: 'Claude soạn; Owner chọn', checker: 'Manager duyệt' });

    expect(taskMatchesRole(row, 'Owner')).toBe(true);
    expect(taskMatchesRole(row, 'Manager')).toBe(true);
    expect(taskMatchesRole(row, 'Tester')).toBe(false);
  });

  it('should tell "Claude" apart from "Claude, session mới"', () => {
    const fresh = task('r1', { doer: 'Owner', checker: 'Claude, session mới: tìm điểm yếu' });

    expect(taskMatchesRole(fresh, 'Claude, session mới')).toBe(true);
    expect(taskMatchesRole(fresh, 'Claude')).toBe(false);
  });

  it('should match every row when no role is selected', () => {
    expect(taskMatchesRole(task('r1'), null)).toBe(true);
  });
});

describe('phaseProgress', () => {
  it('should count done and skipped tasks, including group children, but not the groups', () => {
    const p = phase([
      task('r1', { state: 'done' }),
      task('r2', { state: 'skipped' }),
      {
        kind: 'group',
        id: 'g1',
        text: 'Group',
        refs: [],
        note: '',
        children: [task('r3'), task('r4', { state: 'done' })],
      },
    ]);

    expect(phaseProgress(p)).toEqual({ complete: 3, total: 4 });
  });
});

describe('roleTaskCounts', () => {
  it('should count a task once per role it names, group children included', () => {
    const body = {
      intro: { markdown: '', refs: [] },
      footer: null,
      phases: [
        phase([
          task('r1', { doer: 'Owner', checker: 'Manager' }),
          { kind: 'group', id: 'g1', text: 'G', refs: [], note: '', children: [task('r2', { checker: 'Owner' })] },
        ]),
      ],
    };

    const counts = roleTaskCounts(body, ['Owner', 'Manager', 'Tester']);

    expect([...counts]).toEqual([
      ['Owner', 2],
      ['Manager', 1],
      ['Tester', 0],
    ]);
  });
});

describe('withTaskState', () => {
  it('should change a group child without touching the other rows', () => {
    const other = task('r1');
    const body = {
      intro: { markdown: '', refs: [] },
      footer: null,
      phases: [phase([other, { kind: 'group', id: 'g1', text: 'G', refs: [], note: '', children: [task('r2')] }])],
    };

    const next = withTaskState(body, 'r2', 'skipped');
    const group = next.phases[0].rows[1];

    expect(group.kind === 'group' && group.children[0].state).toBe('skipped');
    expect(next.phases[0].rows[0]).toBe(other);
  });
});

describe('withPhaseTasksState', () => {
  it("should move only that phase's tasks in the given state, group children included, skipped left alone", () => {
    const other = phase([task('o1')]);
    const body = {
      intro: { markdown: '', refs: [] },
      footer: null,
      phases: [
        phase([
          task('r1'),
          task('r2', { state: 'skipped' }),
          {
            kind: 'group',
            id: 'g1',
            text: 'G',
            refs: [],
            note: '',
            children: [task('r3'), task('r4', { state: 'done' })],
          },
        ]),
        { ...other, id: 'p2' },
      ],
    } satisfies ChecklistRunBody;

    const states = (b: ChecklistRunBody) =>
      b.phases[0].rows.flatMap((r) => (r.kind === 'task' ? [r.state] : r.children.map((c) => c.state)));

    const checked = withPhaseTasksState(body, 'p1', 'todo', 'done');
    expect(states(checked)).toEqual(['done', 'skipped', 'done', 'done']);
    expect(checked.phases[1]).toBe(body.phases[1]);
    expect(states(withPhaseTasksState(body, 'p1', 'done', 'todo'))).toEqual(['todo', 'skipped', 'todo', 'todo']);
  });
});

describe('row edits', () => {
  const group = {
    kind: 'group' as const,
    id: 'g',
    text: 'Group',
    refs: [],
    note: '',
    children: [task('g1'), task('g2')],
  };
  const body = (): ChecklistRunBody => ({
    intro: { markdown: '', refs: [] },
    phases: [
      { ...phase([task('a'), group]), id: 'p1' },
      { ...phase([task('b'), task('c')]), id: 'p2' },
    ],
    footer: null,
  });
  const ids = (b: ChecklistRunBody) => b.phases.map((p) => p.rows.map((r) => r.id).join(','));

  it('should re-read the refs from edited text, a group child included', () => {
    const edited = withRowText(body(), 'g2', 'xem tra B và 📁 §6');
    const child = edited.phases[0].rows[1];

    expect(child.kind === 'group' && child.children[1].refs).toEqual([
      { kind: 'lookup', key: 'B' },
      { kind: 'project', key: '6' },
    ]);
  });

  it('should delete a group together with its children, and a child on its own', () => {
    expect(ids(withoutRow(body(), 'g'))).toEqual(['a', 'b,c']);

    const child = withoutRow(body(), 'g1').phases[0].rows[1];
    expect(child.kind === 'group' && child.children.map((t) => t.id)).toEqual(['g2']);
  });

  it('should add an Owner task at the end of its phase with no doer or checker', () => {
    const added = withNewTask(body(), 'p2', 'n', 'New row').phases[1].rows[2];

    expect(added).toMatchObject({ id: 'n', text: 'New row', doer: '', checker: '', state: 'todo' });
  });

  it('should move a group across phases with its children (CHK-005)', () => {
    const moved = withMovedRow(body(), { phaseId: 'p1', index: 1 }, { phaseId: 'p2', index: 1 });

    expect(ids(moved)).toEqual(['a', 'b,g,c']);
    const g = moved.phases[1].rows[1];
    expect(g.kind === 'group' && g.children.length).toBe(2);
  });

  it('should shift a row within its phase, across a phase edge, and not past the run ends', () => {
    expect(ids(withShiftedRow(body(), 'a', 1))).toEqual(['g,a', 'b,c']);
    expect(ids(withShiftedRow(body(), 'g', 1))).toEqual(['a', 'g,b,c']);
    expect(ids(withShiftedRow(body(), 'b', -1))).toEqual(['a,g,b', 'c']);
    expect(ids(withShiftedRow(body(), 'a', -1))).toEqual(ids(body()));
  });
});

describe('rowView', () => {
  it('should show a row of an old run as its text alone, with no SN, description or list', () => {
    expect(rowView(task('a', { text: 'Viết vấn đề<br>trong một câu' }))).toEqual({
      sn: null,
      title: 'Viết vấn đề<br>trong một câu',
      description: null,
      items: [],
      claude: false,
      refLine: null,
    });
  });

  it('should show a format 2 row with its SN, title, description, list and Claude mark', () => {
    const row = task('a', {
      sn: '5.1c',
      text: 'Chạy review-round',
      description: 'Claude chạy review-round sau mỗi batch.',
      items: ['Hai reviewer chạy song song.', 'Owner chỉ duyệt phần 1.'],
      claude: true,
      refLine: null,
    });

    expect(rowView(row)).toEqual({
      sn: '5.1c',
      title: 'Chạy review-round',
      description: 'Claude chạy review-round sau mỗi batch.',
      items: ['Hai reviewer chạy song song.', 'Owner chỉ duyệt phần 1.'],
      claude: true,
      refLine: null,
    });
  });

  it('should show a group with its SN and description and no list', () => {
    const group: ChecklistPhase['rows'][number] = {
      kind: 'group',
      id: 'g',
      sn: '6.2',
      text: 'Tự kiểm 4 lớp',
      description: 'Owner kiểm theo thứ tự.',
      refs: [],
      note: '',
      children: [],
    };

    expect(rowView(group)).toEqual({
      sn: '6.2',
      title: 'Tự kiểm 4 lớp',
      description: 'Owner kiểm theo thứ tự.',
      items: [],
      claude: false,
      refLine: null,
    });
  });

  it('should show the refs of the "Ref:" line that the text does not hold, after the list', () => {
    const row = task('a', {
      sn: '1.2',
      text: 'Viết vấn đề',
      description: 'Theo tra B.',
      items: ['Ghi vào E1.'],
      refs: [
        { kind: 'lookup', key: 'B' },
        { kind: 'lookup', key: 'E' },
        { kind: 'project', key: '7' },
        { kind: 'lookup', key: 'review' },
      ],
    });

    expect(rowView(row).refLine).toBe('tra E · 📁 §7 · ⚙ review');
  });
});

describe('withRowText on a format 2 row', () => {
  it('should keep the refs of the description, list and "Ref:" line when the title changes', () => {
    const row = task('a', {
      sn: '1.2',
      text: 'Viết vấn đề tra A',
      description: 'Theo tra B.',
      refs: [
        { kind: 'lookup', key: 'A' },
        { kind: 'lookup', key: 'B' },
        { kind: 'project', key: '7' },
      ],
    });

    const edited = withRowText(
      { intro: { markdown: '', refs: [] }, phases: [phase([row])], footer: null },
      'a',
      'Viết lại tra C'
    );

    expect(edited.phases[0].rows[0].refs).toEqual([
      { kind: 'lookup', key: 'C' },
      { kind: 'lookup', key: 'B' },
      { kind: 'project', key: '7' },
    ]);
  });
});

describe('withRowText when the title and the description share a ref', () => {
  it('should keep the ref the description still holds after the new title drops it', () => {
    const row = task('a', {
      sn: '1.2',
      text: 'Viết tra A',
      description: 'Theo tra A.',
      refs: [{ kind: 'lookup', key: 'A' }],
    });

    const edited = withRowText(
      { intro: { markdown: '', refs: [] }, phases: [phase([row])], footer: null },
      'a',
      'Viết lại'
    );

    expect(edited.phases[0].rows[0].refs).toEqual([{ kind: 'lookup', key: 'A' }]);
  });
});

describe('profileInRepo', () => {
  it('should say a run made from a format 2 lane keeps its profile in the project repo', () => {
    const body = {
      intro: { markdown: '', refs: [] },
      phases: [phase([task('a'), task('b', { sn: '1.2' })])],
      footer: null,
    };

    expect(profileInRepo(body)).toBe(true);
  });

  it('should say an old run, whose rows have no SN, opens the old profile', () => {
    const body = { intro: { markdown: '', refs: [] }, phases: [phase([task('a'), task('b')])], footer: null };

    expect(profileInRepo(body)).toBe(false);
  });
});
