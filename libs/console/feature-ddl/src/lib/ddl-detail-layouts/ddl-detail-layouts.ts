import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import {
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
  type SegmentedControlOption,
} from '@portfolio/console/shared/ui';
import {
  RecordExpansion,
  collectEmptySections,
  countGaps,
  countIncomplete,
  describeFields,
  foldableIds,
  gist,
  hasAnyContent,
  translationProgress,
  type RecordFieldDescriptor,
  type RecordLocale,
  type ResolvedRecordField,
} from '@portfolio/console/shared/util';
import { PARTIAL_RECORD, RICH_RECORD, SPARSE_RECORD, type DemoRecord } from './ddl-detail-layouts.data';

type LayoutOption = 'a' | 'b' | 'c';
type RecordKind = 'rich' | 'partial' | 'sparse';

/**
 * The ONLY domain knowledge on this page. Everything the view needs — whether
 * the section renders, how many gaps its header reports, which folds exist,
 * translation progress — is derived from this list by the shared helpers.
 * A second module declares its own few lines and reuses the rest.
 */
const STORY_FIELDS: RecordFieldDescriptor<DemoRecord>[] = [
  { id: 'motivation', label: 'Motivation', read: (r) => r.motivation },
  { id: 'description', label: 'Description', read: (r) => r.description },
  { id: 'role', label: 'Role', read: (r) => r.role },
];

/** Fields that count towards the translation-progress note in the rail. */
const TRANSLATABLE_FIELDS: RecordFieldDescriptor<DemoRecord>[] = [
  { id: 'oneLiner', label: 'One-liner', read: (r) => r.oneLiner },
  ...STORY_FIELDS,
];

/**
 * DDL — READ-VIEW LAYOUT STUDY (living reference for ADR-026).
 *
 * Renders the chosen chassis against three record shapes — fully populated,
 * partially written, nearly empty — crossed with the density switch and both
 * locales, because those crossings are where a detail layout actually fails.
 *
 * Layout A (single column + key-fact band) stays switchable as the rejected
 * alternative, so the comparison stays honest rather than remembered.
 */
@Component({
  selector: 'console-ddl-detail-layouts',
  standalone: true,
  imports: [
    NgTemplateOutlet,
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
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
  templateUrl: './ddl-detail-layouts.html',
  styleUrl: './ddl-detail-layouts.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DdlDetailLayouts {
  // ── Prototype chrome ──────────────────────────────────────────────
  readonly layout = signal<LayoutOption>('b');
  readonly recordKind = signal<RecordKind>('rich');
  readonly locale = signal<RecordLocale>('en');

  readonly layoutOptions: SegmentedControlOption[] = [
    { value: 'a', label: 'A · Summary' },
    { value: 'b', label: 'B · Split' },
    { value: 'c', label: 'C · Collapsed' },
  ];
  readonly recordOptions: SegmentedControlOption[] = [
    { value: 'rich', label: 'Full' },
    { value: 'partial', label: 'Partial' },
    { value: 'sparse', label: 'Sparse' },
  ];
  readonly localeOptions: SegmentedControlOption[] = [
    { value: 'en', label: 'EN' },
    { value: 'vi', label: 'VI' },
  ];

  readonly record = computed<DemoRecord>(() => {
    switch (this.recordKind()) {
      case 'rich':
        return RICH_RECORD;
      case 'partial':
        return PARTIAL_RECORD;
      default:
        return SPARSE_RECORD;
    }
  });

  // ── Derived view state — all of it from the shared helpers ────────
  readonly storyFields = computed(() => describeFields(this.record(), STORY_FIELDS, this.locale()));
  readonly hasStory = computed(() => hasAnyContent(this.storyFields()));
  readonly storyGaps = computed(() => countGaps(this.storyFields()));
  readonly storyIds = computed(() => foldableIds(this.storyFields()));

  readonly highlightGaps = computed(() =>
    countIncomplete(this.record().highlights, [(h) => h.challenge, (h) => h.approach, (h) => h.outcome])
  );
  readonly highlightIds = computed(() => this.record().highlights.map((_, i) => `highlight-${i}`));

  readonly emptySections = computed(() => {
    const r = this.record();
    return collectEmptySections([
      { name: 'Story', empty: !this.hasStory() },
      { name: 'Technical highlights', empty: r.highlights.length === 0 },
      { name: 'Media', empty: !r.thumbnailUrl && r.images.length === 0 },
      { name: 'Links', empty: r.links.length === 0 },
    ]);
  });

  readonly progress = computed(() => translationProgress(this.record(), TRANSLATABLE_FIELDS, this.locale()));
  readonly localeName = computed(() => (this.locale() === 'en' ? 'English' : 'Vietnamese'));
  readonly oneLiner = computed(() => describeFields(this.record(), [TRANSLATABLE_FIELDS[0]], this.locale())[0]);

  /** B and C are one chassis; C is B with the density switch thrown. */
  readonly collapsed = computed(() => this.layout() === 'c');

  readonly folds = new RecordExpansion();

  /** Collapsed summary for a story fold. A fold without a gist is a tab. */
  foldGist(field: ResolvedRecordField): string {
    return field.state === 'filled' ? gist(field.text) : `Not written in ${this.localeName()} yet`;
  }
}
