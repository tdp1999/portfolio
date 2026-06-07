import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Chip, Container, Eyebrow, SectionHeader, type LandingChipProminence } from '@portfolio/landing/shared/ui';
import type { SkillTier, SkillTierGroup } from '@portfolio/landing/shared/data-access';

const TIER_PROMINENCE: Record<SkillTier, LandingChipProminence> = {
  DAILY: 'strongest',
  FREQUENT: 'strong',
  SHIPPED: 'default',
};

type Run = { readonly text: string; readonly emphasis: 'plain' | 'bold' | 'italic' };
type Paragraph = readonly Run[];

const TOKEN_PATTERN = /\*\*([^*]+)\*\*|\*([^*]+)\*/g;

/**
 * Parses Owner-authored stackIntro markdown into render-ready paragraphs.
 * - Paragraphs split on blank lines.
 * - `**phrase**` → bold (technology names per E2 §4 convention).
 * - `*phrase*` → italic (Newsreader serif emphasis).
 *
 * Kept inside the component because parsing is rendering-only — source text
 * lives in `Profile.stackIntro` (E5 content authoring rule).
 */
function parseStackIntro(source: string): readonly Paragraph[] {
  if (!source) return [];
  return source
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0)
    .map<Paragraph>((block) => {
      const text = block.replace(/\s+/g, ' ');
      const runs: Run[] = [];
      let cursor = 0;
      TOKEN_PATTERN.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = TOKEN_PATTERN.exec(text))) {
        if (match.index > cursor) {
          runs.push({ text: text.slice(cursor, match.index), emphasis: 'plain' });
        }
        if (match[1] !== undefined) {
          runs.push({ text: match[1], emphasis: 'bold' });
        } else {
          runs.push({ text: match[2], emphasis: 'italic' });
        }
        cursor = match.index + match[0].length;
      }
      if (cursor < text.length) {
        runs.push({ text: text.slice(cursor), emphasis: 'plain' });
      }
      return runs;
    });
}

@Component({
  selector: 'landing-home-stack',
  standalone: true,
  imports: [Chip, Container, Eyebrow, SectionHeader],
  templateUrl: './home.stack.html',
  styleUrl: './home.stack.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeStack {
  readonly stackIntro = input<string>('');
  readonly tierGroups = input<readonly SkillTierGroup[]>([]);

  protected readonly paragraphs = computed(() => parseStackIntro(this.stackIntro()));
  protected readonly populatedGroups = computed(() => this.tierGroups().filter((g) => g.members.length > 0));
  protected readonly tierProminence = TIER_PROMINENCE;
}
