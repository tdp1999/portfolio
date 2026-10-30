import { ChecklistDocKind } from '@prisma/client';

import { IdentifierValue, TemporalValue } from '@portfolio/shared/types';
import type { ChecklistDocContent } from '@portfolio/shared/types';

import { ChecklistDocProps, ParsedChecklistFile } from '../checklist.types';

/**
 * A parsed checklist markdown file. The markdown is the source of truth: a refresh overwrites the
 * doc, and a file that left the manifest is archived (CHK-002). Runs never point at a doc row, so
 * neither ever reaches a run (CHK-001).
 */
export class ChecklistDoc {
  private constructor(private readonly props: ChecklistDocProps) {}

  // --- Factory Methods ---

  static create(file: ParsedChecklistFile): ChecklistDoc {
    const now = TemporalValue.now();
    return new ChecklistDoc({ ...file, id: IdentifierValue.v7(), archivedAt: null, createdAt: now, updatedAt: now });
  }

  static load(props: ChecklistDocProps): ChecklistDoc {
    return new ChecklistDoc(props);
  }

  // --- Getters ---

  get id(): string {
    return this.props.id;
  }

  get kind(): ChecklistDocKind {
    return this.props.kind;
  }

  get slug(): string {
    return this.props.slug;
  }

  get title(): string {
    return this.props.title;
  }

  get content(): ChecklistDocContent {
    return this.props.content;
  }

  get sourceHash(): string {
    return this.props.sourceHash;
  }

  get archivedAt(): Date | null {
    return this.props.archivedAt;
  }

  get isArchived(): boolean {
    return this.props.archivedAt !== null;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  // --- Rules ---

  /**
   * The file was read again. Null when nothing changed (same markdown and title, still live), so
   * the refresh leaves the row alone; otherwise the new content, live again if it had been archived.
   */
  resync(file: ParsedChecklistFile): ChecklistDoc | null {
    const same = file.sourceHash === this.props.sourceHash && file.title === this.props.title;
    if (same && !this.isArchived) return null;
    return new ChecklistDoc({
      ...this.props,
      title: file.title,
      content: file.content,
      sourceHash: file.sourceHash,
      archivedAt: null,
      updatedAt: TemporalValue.now(),
    });
  }

  /** The file left the manifest. Already archived: nothing to do. */
  archive(): ChecklistDoc | null {
    if (this.isArchived) return null;
    const now = TemporalValue.now();
    return new ChecklistDoc({ ...this.props, archivedAt: now, updatedAt: now });
  }
}
