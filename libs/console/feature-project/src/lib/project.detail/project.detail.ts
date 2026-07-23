import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import {
  ConfirmDialogComponent,
  type ConfirmDialogData,
  Property,
  PropertyList,
  RecordEmptySections,
  RecordField,
  RecordFold,
  RecordItem,
  RecordLayout,
  RecordPanel,
  RecordSection,
  SegmentedControl,
  SpinnerOverlay,
  ToastService,
  type SegmentedControlOption,
} from '@portfolio/console/shared/ui';
import {
  RecordExpansion,
  collectEmptySections,
  countGaps,
  describeFields,
  gist,
  hasAnyContent,
  resolveTranslatable,
  translationProgress,
  type RecordFieldDescriptor,
  type RecordLocale,
} from '@portfolio/console/shared/util';
import { filter, switchMap } from 'rxjs';
import { ProjectService } from '../project.service';
import { AdminProject, TranslatableJson } from '../project.types';
import { DateRangePipe } from '@portfolio/shared/ui';
import { RteRenderHtml } from '@portfolio/shared/features/rte-renderer';

/**
 * The record's long-form fields. Section names and order mirror the project
 * form 1:1 (ADR-026) so "Story" means the same place whether the author is
 * writing or reading. The form's Basic / Details / Settings sections carry only
 * scalars, so they surface in the properties rail rather than as sections here.
 */
const STORY_FIELDS: RecordFieldDescriptor<AdminProject>[] = [
  { id: 'motivation', label: 'Motivation', read: (p) => p.motivation },
  { id: 'description', label: 'Description', read: (p) => p.description },
  { id: 'role', label: 'Role', read: (p) => p.role },
];

const TRANSLATABLE_FIELDS: RecordFieldDescriptor<AdminProject>[] = [
  { id: 'oneLiner', label: 'One-liner', read: (p) => p.oneLiner },
  ...STORY_FIELDS,
];

/** A highlight resolved for the locale being read. */
interface HighlightView {
  id: string;
  index: number;
  title: string;
  challenge: string;
  approach: string;
  outcome: string;
  codeUrl: string | null;
  incomplete: boolean;
}

@Component({
  selector: 'console-project-detail',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    NgTemplateOutlet,
    FormsModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    SpinnerOverlay,
    DateRangePipe,
    RteRenderHtml,
    SegmentedControl,
    RecordLayout,
    RecordSection,
    RecordField,
    RecordItem,
    RecordFold,
    RecordPanel,
    PropertyList,
    Property,
    RecordEmptySections,
  ],
  templateUrl: './project.detail.html',
  styleUrl: './project.detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ProjectDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly projectService = inject(ProjectService);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly project = signal<AdminProject | null>(null);
  readonly loading = signal(false);

  // ── Read-view state ───────────────────────────────────────────────
  readonly locale = signal<RecordLocale>('en');
  readonly localeOptions: SegmentedControlOption[] = [
    { value: 'en', label: 'EN' },
    { value: 'vi', label: 'VI' },
  ];
  readonly localeName = computed(() => (this.locale() === 'en' ? 'English' : 'Vietnamese'));
  readonly folds = new RecordExpansion();

  readonly oneLiner = computed(() => this.resolve(this.project()?.oneLiner));

  readonly storyFields = computed(() => describeFields(this.project(), STORY_FIELDS, this.locale()));
  readonly hasStory = computed(() => hasAnyContent(this.storyFields()));
  readonly storyGaps = computed(() => countGaps(this.storyFields()));

  readonly highlights = computed<HighlightView[]>(() =>
    (this.project()?.highlights ?? []).map((h, i) => {
      const challenge = this.resolve(h.challengeHtml);
      const approach = this.resolve(h.approachHtml);
      const outcome = this.resolve(h.outcomeHtml);
      return {
        id: `highlight-${h.id}`,
        index: i + 1,
        title: this.resolve(h.title) || `Highlight ${i + 1}`,
        challenge,
        approach,
        outcome,
        codeUrl: h.codeUrl,
        incomplete: !isRich(challenge) || !isRich(approach) || !isRich(outcome),
      };
    })
  );

  readonly highlightGaps = computed(() => this.highlights().filter((h) => h.incomplete).length);
  readonly highlightIds = computed(() => this.highlights().map((h) => h.id));

  /**
   * Highlights open collapsed once there are more than two, per the density
   * rule in `record-detail-layout.md`: past that the record no longer fits a
   * screen. "Expand all" sits in the section header, one click away.
   */
  readonly collapseHighlights = computed(() => this.highlights().length > 2);

  readonly progress = computed(() => translationProgress(this.project(), TRANSLATABLE_FIELDS, this.locale()));

  readonly emptySections = computed(() => {
    const p = this.project();
    if (!p) return [];
    return collectEmptySections([
      { name: 'Story', empty: !this.hasStory() },
      { name: 'Technical highlights', empty: p.highlights.length === 0 },
      // Links is a rail scalar, not a section — the empty `console-property`
      // already reports its own absence. Listing it here too would report it twice.
      { name: 'Media', empty: !p.thumbnailUrl && p.images.length === 0 },
    ]);
  });

  /** Gist for a highlight: its outcome is the part a reader scans for. */
  highlightGist(h: HighlightView): string {
    const text = stripTags(h.outcome);
    return text ? gist(text) : 'No outcome written yet';
  }

  private resolve(value: TranslatableJson | null | undefined): string {
    return resolveTranslatable(value, this.locale()).text;
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadProject(id);
  }

  private goBack(): void {
    this.router.navigate(['/projects']);
  }

  confirmDelete(): void {
    const p = this.project();
    if (!p) return;
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Project',
        message: `Are you sure you want to delete "${p.title}"? It will be moved to trash.`,
        confirmLabel: 'Delete',
      } satisfies ConfirmDialogData,
    });
    dialogRef
      .afterClosed()
      .pipe(
        filter(Boolean),
        takeUntilDestroyed(this.destroyRef),
        switchMap(() => this.projectService.delete(p.id))
      )
      .subscribe({
        next: () => {
          this.toast.success('Project deleted');
          this.goBack();
        },
      });
  }

  private loadProject(id: string): void {
    this.loading.set(true);
    this.projectService.getById(id).subscribe({
      next: (project) => {
        this.project.set(project);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.goBack();
      },
    });
  }
}

/** Sanitized RTE html counts as written only if it carries visible text —
 * an editor that has been opened and left alone still emits `<p></p>`. */
function isRich(html: string): boolean {
  return stripTags(html).length > 0;
}

function stripTags(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
