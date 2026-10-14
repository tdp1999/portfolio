import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RelativeTime } from '@portfolio/console/shared/ui';
import { catchError, finalize, of, Subject, switchMap } from 'rxjs';
import { NOTE_MAX_CHARS } from '../radar.constants';
import { NOTE_DECISION_MARKS } from '../radar.data';
import { RadarService } from '../radar.service';
import type { RadarItemNote, RadarNotesSummary } from '../radar.types';

/**
 * The Owner's own notes on a post: why it was marked Done or To try, and what came of it.
 * Newest first; each note carries the decision it was written with. Plain text, no formatting.
 */
@Component({
  selector: 'console-radar-item-notes-section',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatTooltipModule,
    RelativeTime,
  ],
  templateUrl: './radar-item-notes.section.html',
  styleUrl: './radar-item-notes.section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RadarItemNotesSection {
  // ── DI ────────────────────────────────────────────────────────────
  private readonly radarService = inject(RadarService);
  private readonly fb = inject(NonNullableFormBuilder);

  // ── Inputs / outputs ──────────────────────────────────────────────
  readonly itemId = input.required<string>();
  /** Bumped by the host when it saved a note elsewhere (the quick note after a decision): reload. */
  readonly revision = input(0);
  /** The notes changed here: the host updates the post's summary (count and newest). */
  readonly changed = output<RadarNotesSummary>();

  // ── Writable signals ──────────────────────────────────────────────
  protected readonly notes = signal<RadarItemNote[]>([]);
  protected readonly loaded = signal(false);
  protected readonly saving = signal(false);

  // ── Form ──────────────────────────────────────────────────────────
  protected readonly form = this.fb.group({
    body: this.fb.control('', [Validators.required, Validators.maxLength(NOTE_MAX_CHARS)]),
  });
  protected readonly maxChars = NOTE_MAX_CHARS;

  // ── Derived ───────────────────────────────────────────────────────
  protected readonly rows = computed(() =>
    this.notes().map((note) => ({ ...note, mark: note.triageStatus && NOTE_DECISION_MARKS[note.triageStatus] }))
  );

  // ── Plain state ───────────────────────────────────────────────────
  private readonly load$ = new Subject<string>();

  constructor() {
    // Prev/next reuse the section with another post: only the newest post's list may land.
    this.load$
      .pipe(
        // A failed load shows an empty list rather than keeping another post's notes.
        switchMap((id) => this.radarService.listNotes(id).pipe(catchError(() => of<RadarItemNote[]>([])))),
        takeUntilDestroyed()
      )
      .subscribe((notes) => {
        this.notes.set(notes);
        this.loaded.set(true);
      });
    let shownId: string | null = null;
    effect(() => {
      this.revision();
      const id = this.itemId();
      // Another post: drop the old list at once, its notes (and delete buttons) are not this post's.
      if (id !== shownId) {
        shownId = id;
        this.notes.set([]);
        this.loaded.set(false);
      }
      this.load$.next(id);
    });
  }

  onAdd(): void {
    const body = this.form.controls.body.value.trim();
    if (!body || this.form.invalid || this.saving()) return;
    const itemId = this.itemId();
    this.saving.set(true);
    this.radarService
      .createNote(itemId, body)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe((note) => {
        if (itemId !== this.itemId()) return;
        this.form.reset();
        this.update([note, ...this.notes()]);
      });
  }

  /** Cmd/Ctrl+Enter saves; a plain Enter is a new line. */
  onComposerKeydown(e: KeyboardEvent): void {
    if (e.key !== 'Enter' || !(e.metaKey || e.ctrlKey)) return;
    e.preventDefault();
    this.onAdd();
  }

  onDelete(note: RadarItemNote): void {
    const itemId = this.itemId();
    this.radarService.deleteNote(itemId, note.id).subscribe(() => {
      if (itemId === this.itemId()) this.update(this.notes().filter((n) => n.id !== note.id));
    });
  }

  // ── shared helpers ────────────────────────────────────────────────
  private update(notes: RadarItemNote[]): void {
    this.notes.set(notes);
    this.changed.emit({ count: notes.length, latest: notes[0] ?? null });
  }
}
