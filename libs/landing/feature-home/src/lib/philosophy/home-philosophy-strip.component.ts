import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ContainerComponent } from '@portfolio/landing/shared/ui';

type Run = { readonly text: string; readonly italic: boolean };

const ITALIC_PATTERN = /\*([^*]+)\*/g;

/**
 * Parses Owner-authored philosophy copy into render-ready runs.
 * - `*phrase*` → italic emphasis (Newsreader serif).
 * - When no `*` markers are present, the final sentence is italicized so the
 *   strip always carries one Newsreader emphasis (E5 task 285 AC2).
 */
function parsePhilosophy(source: string): readonly Run[] {
  const text = source.trim().replace(/\s+/g, ' ');
  if (!text) return [];

  if (text.includes('*')) {
    const runs: Run[] = [];
    let cursor = 0;
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
  }

  const lastBoundary = text.search(/[.!?]\s+(?=[^.!?]+[.!?]?\s*$)/);
  if (lastBoundary === -1) {
    return [{ text, italic: true }];
  }
  const head = text.slice(0, lastBoundary + 1).trim();
  const tail = text.slice(lastBoundary + 1).trim();
  return [
    { text: head + ' ', italic: false },
    { text: tail, italic: true },
  ];
}

@Component({
  selector: 'landing-home-philosophy-strip',
  standalone: true,
  imports: [ContainerComponent],
  templateUrl: './home-philosophy-strip.component.html',
  styleUrl: './home-philosophy-strip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePhilosophyStripComponent {
  readonly philosophy = input<string>('');

  protected readonly runs = computed(() => parsePhilosophy(this.philosophy()));
}
