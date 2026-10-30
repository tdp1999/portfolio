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

import { MAX_REF_KEY } from './checklist.dto';

export interface ParsedTemplate {
  title: string;
  content: ChecklistTemplateContent;
}

export interface ParsedSectioned {
  title: string;
  content: ChecklistSectionedContent;
}

/**
 * Reads the Owner's checklist markdown. The first line `<!-- format: N -->` names the format; a
 * file without it is format 1. Any other number is refused, so the parser is updated before the files.
 *
 * - A lane (size checklist): intro prose, then `## N. Name | Role` phases, each with a
 *   `**Qua phase khi:** …` gate ("Qua pha khi" also accepted).
 *   - Format 1: a `| ✔ | Việc | Ai làm | Ai kiểm |` table. A bold row with an empty ✔ cell is a
 *     group; the `↳` rows under it are its children.
 *   - Format 2: one heading per item, `### <SN> <Title>`, then `Ai làm: … · Ai kiểm: …`, an
 *     optional `Claude: ⚙ <SN>`, a one-sentence description, a `- ` list and an optional `Ref:` line.
 *     A `###` item without `Ai làm:` is a group of the `####` items under it. A `---` line ends
 *     the phases: what follows is the footer.
 * - A sectioned doc (lookup table, project profile): `## A. Title` / `## 6. Title` sections.
 *
 * The files are hand-edited, so anything the parser cannot place fails the whole file with its
 * line number rather than dropping a row silently.
 */
export class ChecklistMarkdownParser {
  // --- Constants ---

  private static readonly PHASE_HEADING = /^##\s+(?:(\d+)\.\s+)?(.+?)(?:\s+\|\s+(.+))?$/;
  private static readonly SECTION_HEADING = /^##\s+([A-Z]|\d+)\.\s+(.+)$/;
  private static readonly GATE_PREFIX = /^\*\*Qua pha(?:se)? khi:\*\*\s*/;
  private static readonly TABLE_SEPARATOR = /^\|(\s*:?-+:?\s*\|)+$/;
  /** `tra B`, but not the placeholder `"tra X"` and not the verb `kiểm tra`. */
  private static readonly LOOKUP_REF = /(?<!["\p{L}])(?<!kiểm )tra ([A-Z])(?![\p{L}\d])/gu;
  /** `📁 §6` or `📁 §3, §6`. */
  private static readonly PROJECT_REF = /📁\s*§\d+(?:\s*,\s*§\d+)*/gu;
  /** `⚙ review`: a procedure the lookup table describes in the section titled with that marker. */
  private static readonly MARKER_REF = new RegExp(`⚙\\uFE0F?\\s*([a-z][a-z-]{0,${MAX_REF_KEY - 1}})`, 'gu');
  private static readonly TASK_CELLS = 4;
  private static readonly FORMAT_LINE = /^<!--\s*format:\s*(.*?)\s*-->$/;
  private static readonly SUPPORTED_FORMATS = [1, 2];
  /** `### 5.1 Title` or `#### 5.1c Title`. */
  private static readonly ITEM_HEADING = /^(#{3,4})\s+(\d+(?:\.\d+)*[a-z]?)\s+(.+)$/;
  private static readonly ROLES_LINE = /^Ai làm:\s*(.+?)\s*·\s*Ai kiểm:\s*(.+)$/;
  private static readonly CLAUDE_LINE = /^Claude:\s*⚙\uFE0F?\s*\S+$/u;
  private static readonly REF_LINE = /^Ref:\s*/;
  private static readonly LIST_ITEM = /^[-*]\s+/;

  // --- Parsing ---

  static parseTemplate(markdown: string, path: string): ParsedTemplate {
    const { format, lines } = ChecklistMarkdownParser.readFormat(markdown, path);
    return format === 1
      ? ChecklistMarkdownParser.parseTable(lines, path)
      : ChecklistMarkdownParser.parseHeadings(lines, path);
  }

  static parseSectioned(markdown: string, path: string): ParsedSectioned {
    const { lines } = ChecklistMarkdownParser.readFormat(markdown, path);
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
    for (const match of text.matchAll(ChecklistMarkdownParser.MARKER_REF)) {
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

  /** The format number and the lines, with the format line blanked so line numbers stay true. */
  private static readFormat(markdown: string, path: string): { format: number; lines: string[] } {
    const lines = ChecklistMarkdownParser.splitLines(markdown);
    const match = ChecklistMarkdownParser.FORMAT_LINE.exec(lines[0]?.trim() ?? '');
    if (!match) return { format: 1, lines };
    const format = /^\d+$/.test(match[1]) ? Number(match[1]) : NaN;
    if (!ChecklistMarkdownParser.SUPPORTED_FORMATS.includes(format)) {
      throw BadRequestError(`${path}: format ${match[1]} is not supported`, {
        errorCode: ChecklistErrorCode.UNSUPPORTED_FORMAT,
        layer: ErrorLayer.APPLICATION,
      });
    }
    return { format, lines: ['', ...lines.slice(1)] };
  }

  private static parseHeadings(lines: string[], path: string): ParsedTemplate {
    const title = ChecklistMarkdownParser.readTitle(lines, path);
    const introLines: string[] = [];
    const footerLines: string[] = [];
    const phases: ChecklistPhase[] = [];
    let current: PhaseDraft | null = null;
    let item: ItemDraft | null = null;
    let inFooter = false;
    let rowCounter = 0;

    const closeItem = () => {
      if (current && item) ChecklistMarkdownParser.addItem(current, item, path);
      item = null;
    };
    const closePhase = () => {
      closeItem();
      if (!current) return;
      ChecklistMarkdownParser.requireChildren(current, path);
      phases.push(ChecklistMarkdownParser.finishPhase(current));
      current = null;
    };

    lines.forEach((raw, index) => {
      const line = raw.trim();
      const lineNo = index + 1;
      if (inFooter) {
        footerLines.push(raw);
        return;
      }
      if (line.startsWith('# ')) return;

      if (line.startsWith('## ')) {
        closePhase();
        current = ChecklistMarkdownParser.startPhase(line, phases.length, path, lineNo);
        return;
      }

      if (!current) {
        introLines.push(raw);
        return;
      }

      if (line === '---') {
        closePhase();
        inFooter = true;
        return;
      }

      if (line.startsWith('###')) {
        closeItem();
        const match = ChecklistMarkdownParser.ITEM_HEADING.exec(line);
        if (!match)
          throw ChecklistMarkdownParser.invalid(`${path}:${lineNo}: item heading must look like "### 1.2 Title"`);
        rowCounter += 1;
        item = {
          id: `r${rowCounter}`,
          child: match[1].length === 4,
          sn: match[2],
          title: match[3].trim(),
          lineNo,
          roles: null,
          claude: false,
          description: [],
          items: [],
          refLine: '',
        };
        return;
      }

      if (item) {
        ChecklistMarkdownParser.addItemLine(item, line, `${path}:${lineNo}`);
        return;
      }

      if (ChecklistMarkdownParser.GATE_PREFIX.test(line)) {
        current.gate = line.replace(ChecklistMarkdownParser.GATE_PREFIX, '');
        return;
      }
      current.beforeTable.push(raw);
    });

    if (phases.length === 0 && !current) {
      throw ChecklistMarkdownParser.invalid(`${path}: no phase found (expected "## N. Name | Role")`);
    }
    closePhase();

    return {
      title,
      content: {
        intro: ChecklistMarkdownParser.prose(introLines) ?? { markdown: '', refs: [] },
        phases,
        footer: ChecklistMarkdownParser.prose(footerLines),
      },
    };
  }

  /** `at` is `path:line`, for the error. A line the item cannot place fails the file. */
  private static addItemLine(item: ItemDraft, line: string, at: string): void {
    if (!line) return;
    const roles = ChecklistMarkdownParser.ROLES_LINE.exec(line);
    if (roles) item.roles = { doer: roles[1], checker: roles[2] };
    else if (ChecklistMarkdownParser.CLAUDE_LINE.test(line)) item.claude = true;
    else if (line.startsWith('Claude:'))
      throw ChecklistMarkdownParser.invalid(`${at}: "Claude:" line must look like "Claude: ⚙ 1.2"`);
    else if (ChecklistMarkdownParser.REF_LINE.test(line))
      item.refLine = line.replace(ChecklistMarkdownParser.REF_LINE, '');
    else if (ChecklistMarkdownParser.LIST_ITEM.test(line))
      item.items.push(line.replace(ChecklistMarkdownParser.LIST_ITEM, ''));
    else if (item.items.length)
      throw ChecklistMarkdownParser.invalid(
        `${at}: item "${item.sn}" has a line after its list that is not a list item or "Ref:"`
      );
    else item.description.push(line);
  }

  private static addItem(phase: PhaseDraft, item: ItemDraft, path: string): void {
    const description = item.description.join(' ');
    const refs = ChecklistMarkdownParser.extractRefs([item.title, description, ...item.items, item.refLine].join('\n'));

    if (!item.roles) {
      if (item.child) {
        throw ChecklistMarkdownParser.invalid(`${path}:${item.lineNo}: item "${item.sn}" has no "Ai làm:" line`);
      }
      if (item.claude || item.items.length) {
        throw ChecklistMarkdownParser.invalid(
          `${path}:${item.lineNo}: group "${item.sn}" cannot have a "Claude:" line or a list`
        );
      }
      ChecklistMarkdownParser.requireChildren(phase, path);
      const group: ChecklistGroup = {
        kind: 'group',
        id: item.id,
        sn: item.sn,
        text: item.title,
        description,
        refs,
        note: '',
        children: [],
      };
      phase.rows.push(group);
      phase.openGroup = group;
      phase.openGroupLine = item.lineNo;
      return;
    }

    const task: ChecklistTask = {
      kind: 'task',
      id: item.id,
      sn: item.sn,
      text: item.title,
      description,
      items: item.items,
      claude: item.claude,
      refs,
      doer: item.roles.doer,
      checker: item.roles.checker,
      state: 'todo',
      note: '',
    };

    if (item.child) {
      if (!phase.openGroup) {
        throw ChecklistMarkdownParser.invalid(`${path}:${item.lineNo}: "####" item has no group above it`);
      }
      phase.openGroup.children.push(task);
      return;
    }
    ChecklistMarkdownParser.requireChildren(phase, path);
    phase.openGroup = null;
    phase.rows.push(task);
  }

  /** A group heading with no `####` item under it is a forgotten `Ai làm:` line, not an empty group. */
  private static requireChildren(phase: PhaseDraft, path: string): void {
    const group = phase.openGroup;
    if (group && group.children.length === 0) {
      throw ChecklistMarkdownParser.invalid(
        `${path}:${phase.openGroupLine}: item "${group.sn}" has no "Ai làm:" line and no child item`
      );
    }
  }

  private static parseTable(lines: string[], path: string): ParsedTemplate {
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
      openGroupLine: 0,
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
  /** The open group's heading line, for the error when it ends with no child. */
  openGroupLine: number;
  tableHeaderSeen: boolean;
}

/** A format 2 item while its lines are read. */
interface ItemDraft {
  id: string;
  /** A `####` item: a child of the group above it. */
  child: boolean;
  sn: string;
  title: string;
  lineNo: number;
  roles: { doer: string; checker: string } | null;
  claude: boolean;
  description: string[];
  items: string[];
  refLine: string;
}
