import { BadRequestError, ChecklistErrorCode, ErrorLayer } from '@portfolio/shared/errors';
import type {
  ChecklistGroup,
  ChecklistPhase,
  ChecklistProse,
  ChecklistRef,
  ChecklistRow,
  ChecklistSection,
  ChecklistSectionedContent,
  ChecklistTask,
  ChecklistTemplateContent,
} from '@portfolio/shared/types';

export interface ParsedTemplate {
  title: string;
  content: ChecklistTemplateContent;
}

export interface ParsedSectioned {
  title: string;
  content: ChecklistSectionedContent;
}

/**
 * Reads the Owner's workflow markdown. Two shapes:
 *
 * - A lane checklist: intro prose, then `## N. Name | Role` phases, each with a
 *   `**Qua pha khi:** …` gate and a `| ✔ | Việc | Ai làm | Ai kiểm |` table. A bold row with an
 *   empty ✔ cell is a group; the `↳` rows under it are its children.
 * - A sectioned doc (lookup table, project profile): `## A. Title` / `## 6. Title` sections.
 *
 * The files are hand-edited, so anything the parser cannot place fails the whole file with its
 * line number rather than dropping a row silently.
 */
export class ChecklistMarkdownParser {
  // --- Constants ---

  private static readonly PHASE_HEADING = /^##\s+(?:(\d+)\.\s+)?(.+?)(?:\s+\|\s+(.+))?$/;
  private static readonly SECTION_HEADING = /^##\s+([A-Z]|\d+)\.\s+(.+)$/;
  private static readonly GATE_PREFIX = /^\*\*Qua pha khi:\*\*\s*/;
  private static readonly TABLE_SEPARATOR = /^\|(\s*:?-+:?\s*\|)+$/;
  /** `tra B`, but not the placeholder `"tra X"` and not the verb `kiểm tra`. */
  private static readonly LOOKUP_REF = /(?<!["\p{L}])(?<!kiểm )tra ([A-Z])(?![\p{L}\d])/gu;
  /** `📁 §6` or `📁 §3, §6`. */
  private static readonly PROJECT_REF = /📁\s*§\d+(?:\s*,\s*§\d+)*/gu;
  private static readonly TASK_CELLS = 4;

  // --- Parsing ---

  static parseTemplate(markdown: string, path: string): ParsedTemplate {
    const lines = ChecklistMarkdownParser.splitLines(markdown);
    const title = ChecklistMarkdownParser.readTitle(lines, path);

    const introLines: string[] = [];
    const phases: ChecklistPhase[] = [];
    let current: PhaseDraft | null = null;
    let rowCounter = 0;

    lines.forEach((raw, index) => {
      const line = raw.trim();
      const lineNo = index + 1;
      if (line.startsWith('# ')) return;

      if (line.startsWith('## ')) {
        if (current) phases.push(ChecklistMarkdownParser.finishPhase(current));
        current = ChecklistMarkdownParser.startPhase(line, phases.length, path, lineNo);
        return;
      }

      if (!current) {
        introLines.push(raw);
        return;
      }

      if (line.startsWith('|')) {
        if (!current.tableHeaderSeen) {
          current.tableHeaderSeen = true;
          return;
        }
        if (ChecklistMarkdownParser.TABLE_SEPARATOR.test(line)) return;
        rowCounter += 1;
        ChecklistMarkdownParser.addTableRow(current, line, `r${rowCounter}`, path, lineNo);
        return;
      }

      if (ChecklistMarkdownParser.GATE_PREFIX.test(line)) {
        current.gate = line.replace(ChecklistMarkdownParser.GATE_PREFIX, '');
        return;
      }

      if (current.rows.length > 0) current.afterTable.push(raw);
      else current.beforeTable.push(raw);
    });

    if (!current) {
      throw ChecklistMarkdownParser.invalid(`${path}: no phase found (expected "## N. Name | Role")`);
    }

    // Prose after the last phase's table applies to the whole checklist ("Gặp bug ở bất kỳ pha nào").
    const last: PhaseDraft = current;
    const footer = ChecklistMarkdownParser.prose(last.afterTable);
    last.afterTable = [];
    phases.push(ChecklistMarkdownParser.finishPhase(last));

    return {
      title,
      content: {
        intro: ChecklistMarkdownParser.prose(introLines) ?? { markdown: '', refs: [] },
        phases,
        footer,
      },
    };
  }

  static parseSectioned(markdown: string, path: string): ParsedSectioned {
    const lines = ChecklistMarkdownParser.splitLines(markdown);
    const title = ChecklistMarkdownParser.readTitle(lines, path);
    const introLines: string[] = [];
    const sections: ChecklistSection[] = [];
    let current: { key: string; title: string; lines: string[] } | null = null;

    lines.forEach((raw, index) => {
      const line = raw.trim();
      if (line.startsWith('# ')) return;

      if (line.startsWith('## ')) {
        const match = ChecklistMarkdownParser.SECTION_HEADING.exec(line);
        if (!match) {
          throw ChecklistMarkdownParser.invalid(
            `${path}:${index + 1}: section heading must look like "## A. Title" or "## 6. Title"`
          );
        }
        if (current) sections.push(ChecklistMarkdownParser.finishSection(current));
        current = { key: match[1], title: match[2].trim(), lines: [] };
        return;
      }

      if (current) current.lines.push(raw);
      else introLines.push(raw);
    });

    if (current) sections.push(ChecklistMarkdownParser.finishSection(current));

    return { title, content: { intro: introLines.join('\n').trim(), sections } };
  }

  /** Refs in order of appearance, without duplicates. */
  static extractRefs(text: string): ChecklistRef[] {
    const found: { at: number; ref: ChecklistRef }[] = [];

    for (const match of text.matchAll(ChecklistMarkdownParser.LOOKUP_REF)) {
      found.push({ at: match.index, ref: { kind: 'lookup', key: match[1] } });
    }
    for (const match of text.matchAll(ChecklistMarkdownParser.PROJECT_REF)) {
      for (const section of match[0].matchAll(/§(\d+)/g)) {
        found.push({ at: match.index + section.index, ref: { kind: 'project', key: section[1] } });
      }
    }

    const seen = new Set<string>();
    return found
      .sort((a, b) => a.at - b.at)
      .map(({ ref }) => ref)
      .filter((ref) => {
        const id = `${ref.kind}:${ref.key}`;
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      });
  }

  // --- Private ---

  private static splitLines(markdown: string): string[] {
    return markdown.replace(/\r\n?/g, '\n').split('\n');
  }

  private static readTitle(lines: string[], path: string): string {
    const heading = lines.find((line) => line.trim().startsWith('# '));
    if (!heading) throw ChecklistMarkdownParser.invalid(`${path}: missing "# Title" heading`);
    const text = heading.trim().slice(2).trim();
    // "Hồ sơ project: Portfolio" → "Portfolio"
    const colon = text.indexOf(': ');
    return colon >= 0 ? text.slice(colon + 2).trim() : text;
  }

  private static startPhase(line: string, index: number, path: string, lineNo: number): PhaseDraft {
    const match = ChecklistMarkdownParser.PHASE_HEADING.exec(line);
    if (!match) throw ChecklistMarkdownParser.invalid(`${path}:${lineNo}: unreadable phase heading`);
    return {
      id: `p${index + 1}`,
      number: match[1] === undefined ? null : Number(match[1]),
      name: match[2].trim(),
      role: match[3]?.trim() ?? null,
      gate: null,
      beforeTable: [],
      afterTable: [],
      rows: [],
      openGroup: null,
      tableHeaderSeen: false,
    };
  }

  private static addTableRow(phase: PhaseDraft, line: string, id: string, path: string, lineNo: number): void {
    const cells = line
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((cell) => cell.trim());
    if (cells.length !== ChecklistMarkdownParser.TASK_CELLS) {
      throw ChecklistMarkdownParser.invalid(
        `${path}:${lineNo}: expected ${ChecklistMarkdownParser.TASK_CELLS} cells (✔ | Việc | Ai làm | Ai kiểm), found ${cells.length}`
      );
    }
    const [check, rawText, doer, checker] = cells;

    if (check === '') {
      const text = rawText.replace(/^\*\*(.+)\*\*$/, '$1').trim();
      const group: ChecklistGroup = {
        kind: 'group',
        id,
        text,
        refs: ChecklistMarkdownParser.extractRefs(text),
        note: '',
        children: [],
      };
      phase.rows.push(group);
      phase.openGroup = group;
      return;
    }

    if (!/^\[[ xX]\]$/.test(check)) {
      throw ChecklistMarkdownParser.invalid(`${path}:${lineNo}: the ✔ cell must be "[ ]" or empty, found "${check}"`);
    }

    const isChild = rawText.startsWith('↳');
    const text = isChild ? rawText.slice(1).trim() : rawText;
    const task: ChecklistTask = {
      kind: 'task',
      id,
      text,
      refs: ChecklistMarkdownParser.extractRefs(text),
      doer,
      checker,
      state: 'todo',
      note: '',
    };

    if (isChild && phase.openGroup) {
      phase.openGroup.children.push(task);
      return;
    }
    if (isChild) {
      throw ChecklistMarkdownParser.invalid(`${path}:${lineNo}: "↳" row has no group above it`);
    }
    phase.openGroup = null;
    phase.rows.push(task);
  }

  private static finishPhase(draft: PhaseDraft): ChecklistPhase {
    const rows: ChecklistRow[] = draft.rows;
    return {
      id: draft.id,
      number: draft.number,
      name: draft.name,
      role: draft.role,
      gate:
        draft.gate === null ? null : { markdown: draft.gate, refs: ChecklistMarkdownParser.extractRefs(draft.gate) },
      note: ChecklistMarkdownParser.prose([...draft.beforeTable, ...draft.afterTable]),
      rows,
    };
  }

  private static finishSection(draft: { key: string; title: string; lines: string[] }): ChecklistSection {
    return { key: draft.key, title: draft.title, markdown: draft.lines.join('\n').trim() };
  }

  private static prose(lines: string[]): ChecklistProse | null {
    const markdown = lines.join('\n').trim();
    return markdown ? { markdown, refs: ChecklistMarkdownParser.extractRefs(markdown) } : null;
  }

  private static invalid(message: string) {
    return BadRequestError(message, { errorCode: ChecklistErrorCode.INVALID_MARKDOWN, layer: ErrorLayer.APPLICATION });
  }
}

interface PhaseDraft {
  id: string;
  number: number | null;
  name: string;
  role: string | null;
  gate: string | null;
  beforeTable: string[];
  afterTable: string[];
  rows: ChecklistRow[];
  openGroup: ChecklistGroup | null;
  tableHeaderSeen: boolean;
}
