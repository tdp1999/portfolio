import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Container } from '@portfolio/landing/shared/ui';

/**
 * §6b Section break between §6 Story and §7 Get in Touch.
 *
 * Hand-drawn analogue of `landing-section-rule--lift`: a wide indigo squiggle
 * spans the container, echoing the ink-on-paper underline used in §6's active
 * paragraph and standing in for the 1px indigo top stripe of the canonical
 * section-rule lift. The lifted §7 surface completes the lift cue.
 *
 * Originally a text-bearing strip restating `Profile.bioShort`; that content
 * lived adjacent to §3 Bio Card OUTLOOK and §6 Story's italic closing line, so
 * a third restatement here was redundant. Slot was reframed to a structural
 * pause via DDL (`/ddl/philosophy-strip`), V2 selected.
 */
@Component({
  selector: 'landing-home-philosophy-strip',
  standalone: true,
  imports: [Container],
  templateUrl: './home.philosophy-strip.html',
  styleUrl: './home.philosophy-strip.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePhilosophyStrip {}
