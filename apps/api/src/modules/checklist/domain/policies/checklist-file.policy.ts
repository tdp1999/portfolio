import { ChecklistDocKind } from '@prisma/client';

/**
 * Which kind of doc a workflow file is, from its path relative to the workflow folder. The
 * folder also holds files that are not checklists (README, run log, the profile template), so
 * anything that matches no rule is unknown and the push refuses it.
 */
export class ChecklistFilePolicy {
  // --- Constants ---

  private static readonly TEMPLATE_PREFIX = 'checklist-lane-';
  private static readonly LOOKUP_STEM = 'bang-tra';
  private static readonly PROJECT_DIR = 'projects';
  private static readonly PROJECT_SKELETON = '_template';

  // --- Rules ---

  static classify(path: string): { kind: ChecklistDocKind; slug: string } | null {
    const parts = path.replace(/\\/g, '/').replace(/^\.\//, '').split('/');
    const file = parts[parts.length - 1];
    if (!file.endsWith('.md')) return null;
    const stem = file.slice(0, -'.md'.length);
    const dir = parts.length > 1 ? parts[parts.length - 2] : null;

    if (dir === ChecklistFilePolicy.PROJECT_DIR) {
      return stem === ChecklistFilePolicy.PROJECT_SKELETON ? null : { kind: ChecklistDocKind.PROJECT, slug: stem };
    }
    if (stem === ChecklistFilePolicy.LOOKUP_STEM) return { kind: ChecklistDocKind.LOOKUP, slug: stem };
    if (stem.startsWith(ChecklistFilePolicy.TEMPLATE_PREFIX)) return { kind: ChecklistDocKind.TEMPLATE, slug: stem };
    return null;
  }
}
