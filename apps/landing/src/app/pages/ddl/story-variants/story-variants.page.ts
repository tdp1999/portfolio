import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  PLATFORM_ID,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import {
  ContainerComponent,
  EyebrowComponent,
  LandingBreadcrumbComponent,
  type BreadcrumbItem,
} from '@portfolio/landing/shared/ui';

type Run = { readonly text: string; readonly italic: boolean };
type Paragraph = readonly Run[];

const BIO_LONG = `Frontend engineer, five years in, four of them at Redoc shipping for Singapore-market banking — loan management, SME lending, finance ERP. Daily work is the long tail of features the bank actually runs on; the highlights are larger pieces like a Document Engine replacing CKEditor across loan products, or the permission framework over a hundred sub-modules. *Real problems, real users, good people.*

Outside the day job, the same instinct shows up — a portfolio monorepo with a design system written from scratch, a Claude Code plugin marketplace built for me and my team. The pattern, looking back, is the same: I build *the rails before I build the train*. Patterns down before code. Tests before features. Design system before reaching for Material. Workflow system before tasks.

None of these artifacts are individually remarkable. The interesting thing — *if there is one* — is that they share a way of working.`;

const ITALIC_PATTERN = /\*([^*]+)\*/g;

function parseBioLong(source: string): readonly Paragraph[] {
  if (!source) return [];
  return source
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0)
    .map<Paragraph>((block) => {
      const runs: Run[] = [];
      let cursor = 0;
      const text = block.replace(/\s+/g, ' ');
      ITALIC_PATTERN.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = ITALIC_PATTERN.exec(text))) {
        if (match.index > cursor) {
          runs.push({ text: text.slice(cursor, match.index), italic: false });
        }
        runs.push({ text: match[1], italic: true });
        cursor = match.index + match[0].length;
      }
      if (cursor < text.length) {
        runs.push({ text: text.slice(cursor), italic: false });
      }
      return runs;
    });
}

const PARAGRAPHS = parseBioLong(BIO_LONG);

// Extra synthetic paragraphs for the "test paragraph count" toggle in the lamp
// variant. Content continues the existing voice; just enough to give the
// resize observer + dynamic angle path real layout to chew on.
const LAMP_EXTRA_PARAGRAPHS = parseBioLong(
  `If you trace the timeline, the pattern repeats: I sit with a problem long enough that the meta-pattern shows itself, then I build the meta first. Sometimes that's a workflow, sometimes a vocabulary, sometimes just a way to think. The artifact comes after.

The risk of this approach is *paralysis* — you can sharpen the pencil forever. The discipline is knowing when the meta is good enough and shipping the actual thing. I get the calibration wrong often. Each cycle, it improves a little.`
);

const FIRST_PARAGRAPH = PARAGRAPHS[0];
const FIRST_RUN = FIRST_PARAGRAPH[0];
const DROP_CAP_LETTER = FIRST_RUN.text.charAt(0);
const FIRST_PARAGRAPH_TAIL: Paragraph = [
  { text: FIRST_RUN.text.slice(1), italic: FIRST_RUN.italic },
  ...FIRST_PARAGRAPH.slice(1),
];

const JOURNAL_META: readonly string[] = ['2021 – present', 'Redoc · Singapore', 'Frontend · Architecture'];

const JOURNAL_CHIPS: readonly string[] = [
  'Document Engine',
  'Permission framework',
  'Long tail features',
  'Portfolio monorepo',
  'Claude Code marketplace',
  'Design system from scratch',
  'Way of working',
];

const TIMELINE_EVENTS: readonly { readonly year: string; readonly label: string }[] = [
  { year: '2020', label: 'First lines of code' },
  { year: '2022', label: 'Document Engine' },
  { year: '2024', label: 'Permission framework' },
  { year: '2025', label: 'Portfolio rewrite' },
  { year: '2026', label: 'Claude Code marketplace' },
];

@Component({
  selector: 'landing-story-variants-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ContainerComponent, EyebrowComponent, LandingBreadcrumbComponent],
  templateUrl: './story-variants.page.html',
  styleUrl: './story-variants.page.scss',
})
export class StoryVariantsPage {
  readonly breadcrumb: readonly BreadcrumbItem[] = [
    { label: 'DDL', href: '/ddl' },
    { label: '§05 · The Story — direction variants' },
  ];

  readonly paragraphs = PARAGRAPHS;
  readonly firstParagraphTail = FIRST_PARAGRAPH_TAIL;
  readonly dropCap = DROP_CAP_LETTER;
  readonly journalMeta = JOURNAL_META;
  readonly journalChips = JOURNAL_CHIPS;
  readonly timeline = TIMELINE_EVENTS;

  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    if (!isPlatformBrowser(this.platformId)) return;

    let ro: ResizeObserver | null = null;
    let rafId = 0;
    let resizeBound = false;

    const schedule = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => this.recomputeLampAngles());
    };

    // Single effect — wires up the observer the first time refs exist, then
    // re-attaches whenever the paragraph collection changes (paragraph-count
    // toggle, content swap, etc.). rAF coalesces resize bursts.
    effect(() => {
      const paragraphs = this.lampParaRefs();
      const svg = this.lampSvgRef();
      if (paragraphs.length === 0 || !svg) return;

      if (!ro) ro = new ResizeObserver(schedule);
      if (!resizeBound) {
        window.addEventListener('resize', schedule, { passive: true });
        resizeBound = true;
      }

      ro.disconnect();
      for (const p of paragraphs) ro.observe(p.nativeElement);
      ro.observe(svg.nativeElement);
      schedule();
    });

    this.destroyRef.onDestroy(() => {
      if (rafId) cancelAnimationFrame(rafId);
      ro?.disconnect();
      if (resizeBound) window.removeEventListener('resize', schedule);
    });
  }

  // ───── Variant E (lamp) state ─────────────────────────────────────────
  // -1 = nothing active. Click paragraph → toggle that paragraph; click lamp or
  // anywhere outside a paragraph → deactivate.
  readonly activeE = signal<number>(-1);
  readonly isLampActive = computed(() => this.activeE() !== -1);

  // Test toggle: swap the lamp variant's prose between 2, 3, 4, 5 paragraphs to
  // verify the dynamic-angle observer recalibrates correctly. Only affects E.
  readonly LAMP_PARAGRAPH_COUNTS = [2, 3, 4, 5] as const;
  readonly lampParagraphCount = signal<2 | 3 | 4 | 5>(3);
  readonly lampParagraphs = computed<readonly Paragraph[]>(() => {
    const n = this.lampParagraphCount();
    if (n <= 3) return PARAGRAPHS.slice(0, n);
    return [...PARAGRAPHS, ...LAMP_EXTRA_PARAGRAPHS.slice(0, n - 3)];
  });

  protected setLampParagraphCount(n: 2 | 3 | 4 | 5): void {
    this.lampParagraphCount.set(n);
    // Re-clamp activeE if it now points past the new last paragraph.
    if (this.activeE() >= n) this.activeE.set(-1);
  }

  // Lamp SVG asset (file 4) lives in viewBox 0 0 474 474. Joint (shade pivot)
  // sits at (263.105, 48.85); the light pool's center sits at (120.64, 191.25).
  // The cone path is drawn from the light pool extending far to the left, so when
  // rotation = 0 it points roughly west-and-slightly-south at ~176.5° from east
  // (in screen y-down coords, where east = 0°, south = 90°, west = 180°).
  private readonly LAMP_PIVOT_X = 263.105;
  private readonly LAMP_PIVOT_Y = 48.85;
  private readonly DEFAULT_CONE_ANGLE_DEG = 176.5;

  // Rotation per paragraph — recomputed at runtime from the actual DOM rects of
  // the paragraphs and the lamp SVG. We measure the lamp SVG (which doesn't
  // rotate) and reconstruct the light pool's default screen-position via the
  // viewBox transform, so rotation never feeds back into the calculation.
  private readonly lampAngles = signal<readonly number[]>([]);

  readonly lampRotate = computed(() => {
    const idx = this.activeE();
    const angles = this.lampAngles();
    const angle = idx === -1 ? 0 : (angles[idx] ?? 0);
    return `rotate(${angle.toFixed(2)} ${this.LAMP_PIVOT_X} ${this.LAMP_PIVOT_Y})`;
  });

  // Refs for DOM measurement.
  private readonly lampSvgRef = viewChild<ElementRef<SVGSVGElement>>('lampSvg');
  private readonly lampParaRefs = viewChildren<ElementRef<HTMLElement>>('lampPara');

  // Measure SVG + paragraph rects → recompute one angle per paragraph. Cheap
  // (just a few getBoundingClientRect calls) so we can hit it on every layout
  // change, coalesced to rAF so multiple resize ticks collapse into one read.
  private recomputeLampAngles(): void {
    const svg = this.lampSvgRef();
    const paragraphs = this.lampParaRefs();
    if (!svg || paragraphs.length === 0) return;

    const svgRect = svg.nativeElement.getBoundingClientRect();
    if (svgRect.width === 0) return; // not yet visible (e.g., mobile hides the SVG)

    // viewBox is 474×474 and preserveAspectRatio is "meet" so scale is uniform.
    const scale = svgRect.width / 474;
    const lightX = svgRect.left + 120.64 * scale;
    const lightY = svgRect.top + 191.25 * scale;

    const angles = paragraphs.map((p) => {
      const r = p.nativeElement.getBoundingClientRect();
      const tx = r.left + r.width / 2;
      const ty = r.top + r.height / 2;
      const targetDeg = (Math.atan2(ty - lightY, tx - lightX) * 180) / Math.PI;
      const raw = targetDeg - this.DEFAULT_CONE_ANGLE_DEG;
      // Normalize to (-180, 180]. Without this, paragraphs above the light pool
      // yield very negative raw angles (e.g. -350°) while paragraphs below yield
      // small positives (e.g. +5°); the CSS transition then interpolates the
      // long way around — a visible 350° head-spin between clicks.
      return ((raw + 540) % 360) - 180;
    });

    this.lampAngles.set(angles);
  }

  protected onParagraphClick(index: number, event: Event): void {
    event.stopPropagation();
    this.activeE.set(this.activeE() === index ? -1 : index);
  }

  protected onLampClick(event: Event): void {
    event.stopPropagation();
    // Click on lamp toggles: off → on at P1; on → off.
    this.activeE.set(this.isLampActive() ? -1 : 0);
  }

  protected onSectionClick(): void {
    this.activeE.set(-1);
  }

  // ───── Variant G (fountain pen) state ─────────────────────────────────
  // Sample of the "underline draws as you click" pattern. Same rules as E:
  // default off, click toggle, click outside / click pen to dim.
  readonly activeG = signal<number>(-1);
  readonly isPenActive = computed(() => this.activeG() !== -1);

  protected onPenParagraphClick(index: number, event: Event): void {
    event.stopPropagation();
    this.activeG.set(this.activeG() === index ? -1 : index);
  }

  protected onPenClick(event: Event): void {
    event.stopPropagation();
    if (this.isPenActive()) this.activeG.set(-1);
  }

  protected onPenSectionClick(): void {
    this.activeG.set(-1);
  }
}
