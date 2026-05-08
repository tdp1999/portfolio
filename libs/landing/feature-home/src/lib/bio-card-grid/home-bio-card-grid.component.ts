import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import {
  CardComponent,
  ContainerComponent,
  EyebrowComponent,
  LandingBackgroundComponent,
  LandingLinkComponent,
  StatusDotComponent,
} from '@portfolio/landing/shared/ui';
import { liveClock } from './live-clock.signal';

/**
 * §3 Bio Card Grid — landing implementation, PF2 (Aurora Mesh) glass cards
 * with PF7 (Dimensional Layers) hover effect, picked from the
 * `/ddl/bio-card-grid` gallery.
 *
 * Three equal-width glass cards float above a 3-blob accent aurora.
 * Hover lifts each card with a subtle 3D tilt + deeper shadow.
 * Card A renders the live local time via `liveClock` (one-minute interval,
 * paused while hidden); honors `prefers-reduced-motion`.
 */
@Component({
  selector: 'landing-home-bio-card-grid',
  standalone: true,
  imports: [
    CardComponent,
    ContainerComponent,
    EyebrowComponent,
    LandingBackgroundComponent,
    LandingLinkComponent,
    StatusDotComponent,
  ],
  templateUrl: './home-bio-card-grid.component.html',
  styleUrl: './home-bio-card-grid.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeBioCardGridComponent {
  readonly fullName = input<string>('');
  readonly title = input<string>('');
  readonly city = input<string>('');
  readonly email = input<string>('');
  readonly available = input<boolean>(false);
  /** Timezones array from the public profile; we render the primary one. */
  readonly timezones = input<readonly string[]>([]);
  /** Philosophy lead + emphasis (italicized closing). Authored copy. */
  readonly philosophyLead = input<string>('');
  readonly philosophyEmphasis = input<string>('');
  /** Capacity / availability sentence (e.g. "Open to talks · engagements from June"). */
  readonly contactNote = input<string>('');

  protected readonly primaryTimezone = computed(() => this.timezones()[0] ?? 'Asia/Ho_Chi_Minh');
  protected readonly localTime = liveClock(this.primaryTimezone);

  /** GMT offset string ("GMT+7") derived from the primary timezone. */
  protected readonly utcOffset = computed(() => formatOffset(this.primaryTimezone()));

  protected readonly statusLabel = computed(() => (this.available() ? 'AVAILABLE FOR WORK' : 'CURRENTLY BUSY'));
  protected readonly statusState = computed<'available' | 'busy'>(() => (this.available() ? 'available' : 'busy'));
}

/** Returns a "GMT±N" string for the given IANA timezone, computed from now. */
function formatOffset(timezone: string): string {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      timeZoneName: 'shortOffset',
    }).formatToParts(new Date());
    const tz = parts.find((p) => p.type === 'timeZoneName')?.value ?? 'GMT';
    return tz.replace(/^GMT([+-]?\d+)?$/, (_, n) => `GMT${n ?? '+0'}`);
  } catch {
    return 'GMT';
  }
}
