import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { Meta, Title } from '@angular/platform-browser';
import { DecimalPipe, DOCUMENT } from '@angular/common';
import { Background, Button, Container, Eyebrow, Icon, Link } from '@portfolio/landing/shared/ui';
import type { EditorDocument, PortableDocument, PortableNode } from '@portfolio/shared/features/rte-core';
import { RteTiptapEditor } from '@portfolio/shared/features/rte-tiptap';
import { RteRender } from '@portfolio/shared/features/rte-renderer';
import { documentEngineProviders } from './document-engine.tokens';
import type { NpmStat } from './document-engine.types';
import { fetchJson, relativeTime, toPortable } from './document-engine.util';
import {
  DEMO_PRESETS,
  FEATURES,
  HERO_FACTS,
  PACKAGES,
  PROBLEMS,
  PROOF_CLAIMS,
  REPO_SLUG,
  REPO_URL,
} from './document-engine.data';
import { EMPTY_DOCUMENT, SEED_DOCUMENT, TEMPLATE_DOCUMENT } from './document-engine.seed';

/**
 * Product landing page for the Document Engine packages.
 *
 * Deliberately NOT built on `landing-page-shell`. That shell is the canonical
 * chassis for documentation-shaped subpages (`/about`, `/uses`, `/colophon`):
 * breadcrumb, centred header, prose column. A product page needs the freedom
 * Home has — full-bleed bands that each own their background and rhythm — so
 * this composes sibling sections directly, exactly like `landing-home`. Header
 * and footer come from `landing-shell`; nothing else is shared.
 *
 * Distinct in job from `/projects/document-engine`: that page *tells* (why it
 * was built, what was learned), this one *shows* (a live editor and the
 * document it emits).
 *
 * Everything except the demo is server-rendered so crawlers and no-JS readers
 * get the whole argument; the editor is browser-only and deferred.
 */
@Component({
  selector: 'landing-document-engine',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    Background,
    Button,
    Container,
    Eyebrow,
    Icon,
    Link,
    DecimalPipe,
    ReactiveFormsModule,
    RouterLink,
    RteTiptapEditor,
    RteRender,
  ],
  templateUrl: './document-engine.html',
  // Vendor sheet first, so this page's overrides win on source order.
  styleUrls: ['./document-engine.vendor.scss', './document-engine.scss'],
  // The engine renders its own toolbar inside a child component, which scoped
  // styles cannot reach — the same reason console loads the vendor sheet
  // globally. Doing it here instead keeps that CSS in this route's lazy chunk,
  // so pages that never show an editor never download it. Every selector in the
  // sheet is `.de-*`-prefixed or engine-owned, so nothing leaks sideways.
  encapsulation: ViewEncapsulation.None,
  // The rest of the site runs a narrow engine profile with dynamic fields,
  // tables and restricted editing switched off, because no published page uses
  // them. This page advertises all three, so it runs the demo profile instead —
  // same component, same document model, one provider different.
  providers: [documentEngineProviders()],
  // Escape closes the expanded pane. This is the one global keyboard binding on
  // the page, and the documented exception to the `isEditableTarget` guard in
  // `.context/patterns-hotkeys.md`: Escape-to-close is what a reader expects
  // from anything covering the screen, including while the caret sits in the
  // editor underneath. It is inert when nothing is expanded.
  host: { '(document:keydown.escape)': 'closeExpanded()' },
})
export class DocumentEngine {
  // ──────── Injections ─────────────────────────────────────────────────
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  // ──────── Data ────────────────────────────────────────────────────────
  readonly heroFacts = HERO_FACTS;
  readonly proofClaims = PROOF_CLAIMS;
  /**
   * The marquee track, doubled.
   *
   * The loop translates the pair of tracks by -50%, which only reads as seamless
   * while a single track is wider than the viewport — otherwise the tail runs out
   * mid-screen and leaves the gap that was visible at laptop width. Repeating the
   * claims inside each track makes a track comfortably wider than any display.
   */
  readonly marqueeClaims = [...PROOF_CLAIMS, ...PROOF_CLAIMS];
  readonly problems = PROBLEMS;
  readonly features = FEATURES;
  readonly packages = PACKAGES;
  readonly presets = DEMO_PRESETS;
  readonly repoUrl = REPO_URL;

  // ──────── Live registry data ──────────────────────────────────────────
  /** `{ [package name]: { version, downloads } }`, empty until the fetch lands. */
  readonly npmStats = signal<Readonly<Record<string, NpmStat>>>({});
  readonly stars = signal<number | null>(null);
  /** ISO timestamp of the repo's most recent push, or null if GitHub did not answer. */
  readonly lastCommit = signal<string | null>(null);

  /** "3 days ago" — recency is the signal here, not the date itself. */
  readonly lastCommitLabel = computed(() => relativeTime(this.lastCommit()));

  /** The first package's numbers, for the hero badge row. */
  readonly primaryStat = computed(() => this.npmStats()[PACKAGES[0].name]);

  // ──────── Demo state ──────────────────────────────────────────────────
  /** The editor is a ControlValueAccessor, so a bare FormControl drives it. */
  readonly doc = new FormControl<EditorDocument | null>(SEED_DOCUMENT);

  private readonly value = toSignal(this.doc.valueChanges, { initialValue: this.doc.value });

  /** Right-hand panel: the document as it is actually stored. */
  readonly documentJson = computed(() => {
    const doc = this.value();
    return doc ? JSON.stringify(doc, null, 2) : '';
  });

  /** Cheap proof-of-life for the panel header, so the number visibly moves. */
  readonly nodeCount = computed(() => {
    const content = this.value()?.content;
    return Array.isArray(content?.['content']) ? content['content'].length : 0;
  });

  readonly copied = signal(false);

  /**
   * Right-hand pane view. The stored JSON proves the document is data; the
   * rendered view proves the same data becomes a finished artefact without a
   * second renderer. Showing only one of them tells half the story.
   */
  readonly paneView = signal<'json' | 'rendered'>('json');

  /**
   * Full-screen evidence pane.
   *
   * Side by side, the stored document gets roughly a third of a laptop screen,
   * and both views need more than that to be read rather than glanced at: the
   * JSON wraps a 4-space-indented tree into a 400px gutter, and the rendered
   * agreement is a page-width document squeezed into a column. Expanding is not
   * a second component — it is the same pane, the same two tabs and the same
   * value, given the room the content was written for.
   */
  readonly expanded = signal(false);

  /**
   * The editor's value in the shape the read-path renderer speaks.
   *
   * `rte-render` is the component this site already uses to publish prose, and
   * it is engine-free by construction. Pointing it at the demo document is the
   * strongest available proof of the read-only claim: it is not a preview mode
   * bolted onto the editor, it is the real renderer, fed the real document.
   */
  readonly portableDoc = computed<PortableDocument | null>(() => {
    const doc = this.value();
    const nodes = doc?.content?.['content'];
    if (!Array.isArray(nodes)) return null;
    return { schemaVersion: doc?.schemaVersion ?? 1, content: toPortable(nodes as PortableNode[]) };
  });

  // ──────── Constructor ─────────────────────────────────────────────────
  constructor() {
    const title = 'Document Engine | Phuong Tran';
    const description =
      'A headless document editor built as two packages: a framework-free core that owns the document model, and an Angular binding. Try it live.';
    this.title.setTitle(title);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: description });

    // Lock the page behind the expanded pane. An overlay you can scroll the page
    // under is an overlay that loses the reader's place the moment they close it.
    // The class lives on <body>, outside this component's tree, so nothing
    // removes it on navigation — leaving the whole site unscrollable if the
    // reader navigates away with the pane open. Undo it explicitly.
    effect(() => this.document.body.classList.toggle('de-locked', this.expanded()));
    inject(DestroyRef).onDestroy(() => this.document.body.classList.remove('de-locked'));

    afterNextRender(() => void this.loadRegistryStats());
  }

  /**
   * Live version / download / star counts.
   *
   * Browser-only and deliberately not part of SSR: these are decoration on an
   * argument that already stands without them, and making the server wait on
   * two third-party APIs to render a marketing page is a bad trade. Every call
   * is individually optional — a failure leaves the badge unrendered rather
   * than showing a zero, because a wrong number here is worse than no number.
   */
  private async loadRegistryStats(): Promise<void> {
    const npm = PACKAGES.map(async (pkg) => {
      const [meta, downloads] = await Promise.all([
        fetchJson<{ 'dist-tags'?: { latest?: string } }>(`https://registry.npmjs.org/${encodeURIComponent(pkg.name)}`),
        fetchJson<{ downloads?: number }>(`https://api.npmjs.org/downloads/point/last-week/${pkg.name}`),
      ]);
      const version = meta?.['dist-tags']?.latest;
      if (!version) return;
      this.npmStats.update((all) => ({ ...all, [pkg.name]: { version, downloads: downloads?.downloads ?? null } }));
    });

    const gh = fetchJson<{ stargazers_count?: number; pushed_at?: string }>(
      `https://api.github.com/repos/${REPO_SLUG}`
    ).then((repo) => {
      if (typeof repo?.stargazers_count === 'number') this.stars.set(repo.stargazers_count);
      if (typeof repo?.pushed_at === 'string') this.lastCommit.set(repo.pushed_at);
    });

    await Promise.all([...npm, gh]);
  }

  // ──────── Actions ─────────────────────────────────────────────────────
  toggleExpanded(): void {
    this.expanded.update((open) => !open);
  }

  closeExpanded(): void {
    this.expanded.set(false);
  }

  applyPreset(id: (typeof DEMO_PRESETS)[number]['id']): void {
    if (id === 'reset') {
      this.doc.setValue(SEED_DOCUMENT);
      return;
    }
    if (id === 'table') {
      this.doc.setValue(TEMPLATE_DOCUMENT);
      return;
    }
    if (id === 'clear') {
      this.doc.setValue(EMPTY_DOCUMENT);
      return;
    }
    this.insertField();
  }

  /**
   * Appends a placeholder paragraph. Deliberately done by editing the document
   * value rather than reaching into the editor instance: it demonstrates the
   * actual claim, that the document is data you can manipulate from outside.
   */
  private insertField(): void {
    const current = this.doc.value ?? SEED_DOCUMENT;
    const blocks = Array.isArray(current.content['content']) ? current.content['content'] : [];
    this.doc.setValue({
      ...current,
      content: {
        ...current.content,
        content: [
          ...blocks,
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'Reference: ' },
              { type: 'dynamicField', attrs: { fieldId: 'customer_id', label: 'Customer ID' } },
            ],
          },
        ],
      },
    });
  }

  /**
   * A bare `href="#try-it"` is wrong on a routed page: the router intercepts it,
   * pushes a fragment onto the URL, and nothing scrolls. Scroll the element
   * directly instead, honouring reduced-motion.
   */
  scrollToDemo(event: Event): void {
    event.preventDefault();
    const target = this.document.getElementById('try-it');
    if (!target) return;
    const reduced = this.document.defaultView?.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  }

  /**
   * The Clipboard API is absent outside a secure context and in a few older
   * browsers. Unguarded, the click handler rejects into nothing: the button does
   * not react, and the only trace is a console error the reader never sees. Fail
   * quietly and visibly instead — no "Copied" unless something was copied.
   */
  async copyJson(): Promise<void> {
    try {
      await navigator.clipboard?.writeText(this.documentJson());
    } catch {
      return;
    }
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 2000);
  }
}
