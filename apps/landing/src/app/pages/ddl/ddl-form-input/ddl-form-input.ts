import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Container, Section } from '@portfolio/landing/shared/ui';

/**
 * `/ddl/form-input` — staging ground for the landing-form-input + landing-textarea
 * primitive variants (C21, wave 1). Pick a variant, then we ship it into
 * `libs/landing/shared/ui/src/components/form/`.
 *
 * Three variants:
 *  - **A · Hairline rest, underline focus** — editorial, no rounded box.
 *  - **B · Sunken card** — current `/contact` look (ink-1 50%, 6px radius).
 *  - **C · Outline + soft glow** — transparent bg, accent ring on focus.
 */
@Component({
  selector: 'landing-ddl-form-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Section, Container],
  templateUrl: './ddl-form-input.html',
  styleUrl: './ddl-form-input.scss',
})
export class DdlFormInput {}
