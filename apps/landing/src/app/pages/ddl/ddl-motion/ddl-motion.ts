import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DdlDocPage } from '../ddl-doc-page/ddl-doc-page';
import { DdlSection } from '../ddl-section/ddl-section';
import { MOTION_GROUPS } from './ddl-motion.data';

/**
 * /ddl/motion — catalogue of SHIPPED landing motion, grouped by trigger.
 *
 * Each captured effect shows an autoplay-loop clip (webm + mp4, poster fallback)
 * next to its mechanism, source anchor, and reduce-motion status. Clips are
 * captured with Playwright video recording + ffmpeg and served from
 * `apps/landing/public/motion/`. Sibling to `/ddl/interactions` (the wishlist):
 * this page documents what already ships.
 */
@Component({
  selector: 'landing-ddl-motion',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DdlDocPage, DdlSection, RouterLink],
  templateUrl: './ddl-motion.html',
  styleUrl: './ddl-motion.scss',
})
export class DdlMotion {
  protected readonly groups = MOTION_GROUPS;
  protected readonly assetBase = '/motion';

  protected readonly totalItems = MOTION_GROUPS.reduce((n, g) => n + g.items.length, 0);
  protected readonly clipCount = MOTION_GROUPS.reduce((n, g) => n + g.items.filter((i) => i.hasClip).length, 0);
}
