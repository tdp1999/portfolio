import { ChangeDetectionStrategy, Component, inject, PLATFORM_ID, signal } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  Card,
  Container,
  Eyebrow,
  Icon,
  Background,
  Breadcrumb,
  Link,
  StatusDot,
  type BreadcrumbItem,
} from '@portfolio/landing/shared/ui';
import type { CopyState, BleedId, HoursId } from './ddl-bio-improvements.types';
import { HOURS_FROM, HOURS_TO } from './ddl-bio-improvements.data';

/**
 * /ddl/bio-improvements — option staging for the home §3 Bio Card Grid refinement pass.
 *
 * Six option-sets:
 *   §A · Section title variants
 *   §B · Background bleed (segmented control + single live preview)
 *   §C · HOURS roulette text effects
 *   §D · Email copy + inline check feedback (locked mechanism — live demo)
 *   §E · Card hover shadow (light + dark theme aware)
 *   §F · Social icons in Card C
 *
 * Picks are flagged via `.picked` on each variant. The wishlist moved to
 * `/ddl/interactions`. Once all picks are graduated to production, delete this page.
 */

@Component({
  selector: 'landing-ddl-bio-improvements',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Card, Container, Eyebrow, Icon, Background, Breadcrumb, Link, StatusDot],
  templateUrl: './ddl-bio-improvements.html',
  styleUrl: './ddl-bio-improvements.scss',
})
export class DdlBioImprovements {
  readonly breadcrumb: readonly BreadcrumbItem[] = [{ label: 'DDL', href: '/ddl' }, { label: 'Bio improvements' }];

  readonly demo = {
    fullName: 'Phuong Tran',
    title: 'Senior Frontend Engineer',
    city: 'Ho Chi Minh City',
    email: 'hello@thunderphong.com',
    available: true,
    contactNote: 'Open to talks · engagements from June.',
  } as const;

  /* ============================== §A · Title variants ============================== */
  readonly titleVariants = [
    { id: 'a1' as const, num: '02', text: 'Who I Am', hint: 'Direct. Keeps the NN · Label format.', picked: true },
    { id: 'a2' as const, num: '02', text: 'About', hint: 'Convention. Gọn nhất.', picked: false },
    { id: 'a3' as const, num: '02', text: 'The Person', hint: 'Editorial. Third-person feel.', picked: false },
  ];

  /* ============================== §B · Background bleed ============================== */
  readonly bleedVariants = [
    {
      id: 'b1' as const,
      label: 'B1 · Hard cut (current)',
      hint: 'border-block + solid ink-0. Aurora bị cắt cứng ở 2 edge.',
      picked: false,
    },
    {
      id: 'b2' as const,
      label: 'B2 · Mask fade top/bottom',
      hint: 'mask-image: linear-gradient ở 80px top + bottom. Aurora trôi vào hư vô.',
      picked: false,
    },
    {
      id: 'b3' as const,
      label: 'B3 · Overlap both sides',
      hint: 'Bỏ border-block, kéo aurora ra ngoài bằng inset: -120px. Leak vào cả hero và selected-work.',
      picked: false,
    },
    {
      id: 'b4' as const,
      label: 'B4 · Gradient bridge',
      hint: 'linear-gradient(ink-0 → transparent → ink-1) làm cầu nối với selected-work.',
      picked: false,
    },
    {
      id: 'b5' as const,
      label: 'B5 · Hard cut up · bleed down',
      hint: 'Giữ border-top với hero (cut cứng vì hero có grid rõ), nhưng bỏ border-bottom — aurora bleed xuống selected-work.',
      picked: true,
    },
  ];

  readonly activeBleed = signal<BleedId>('b5');

  /* ============================== §C · HOURS roulette ============================== */
  readonly hoursVariants = [
    { id: 'slot' as const, label: 'C1 · Slot odometer', hint: 'Mỗi char trượt lên theo Y.', picked: false },
    { id: 'digit' as const, label: 'C2 · Digit roulette', hint: 'Cycle nhanh rồi land.', picked: false },
    { id: 'type' as const, label: 'C3 · Type-out', hint: 'Char hiện từng chữ như terminal.', picked: true },
    { id: 'crossfade' as const, label: 'C4 · Crossfade + blur', hint: 'Blur out, blur in.', picked: false },
    { id: 'scramble' as const, label: 'C5 · Scramble', hint: 'Random chars rồi resolve.', picked: false },
  ];

  readonly hoursState: Record<HoursId, ReturnType<typeof signal<string>>> = {
    slot: signal(HOURS_FROM),
    digit: signal(HOURS_FROM),
    type: signal(HOURS_FROM),
    crossfade: signal(HOURS_FROM),
    scramble: signal(HOURS_FROM),
  };

  readonly hoursAnimating = signal<HoursId | null>(null);

  /* ============================== §D · Email copy ============================== */
  readonly emailCopyState = signal<CopyState>('idle');

  /* ============================== §E · Hover shadow ============================== */
  readonly shadowVariants = [
    { id: 'e1' as const, label: 'E1 · Rim only (no shadow)', hint: 'Accent rim 1px + subtle lift.', picked: false },
    { id: 'e2' as const, label: 'E2 · Soft shadow + rim', hint: 'Theme-aware shadow + rim.', picked: false },
    {
      id: 'e3' as const,
      label: 'E3 · Theme-mixed glow',
      hint: 'Accent glow color-mix, không shadow tối.',
      picked: true,
    },
  ];

  /* ============================== §F · Social icons in Card C ============================== */
  readonly socialIcons = [
    { icon: 'github', label: 'GitHub', url: '#' },
    { icon: 'linkedin', label: 'LinkedIn', url: '#' },
    { icon: 'twitter', label: 'Twitter', url: '#' },
    { icon: 'globe', label: 'Website', url: '#' },
  ];

  readonly socialVariants = [
    {
      id: 'f1' as const,
      label: 'F1 · Below "Connect now"',
      hint: 'Icon row max 4, dưới link. Vẫn giữ CTA tường minh.',
      picked: true,
    },
    {
      id: 'f2' as const,
      label: 'F2 · Replace "Connect now"',
      hint: 'Bỏ link, chỉ còn icon row.',
      picked: false,
    },
    {
      id: 'f3' as const,
      label: 'F3 · Icons primary + link fallback',
      hint: 'Icon row trên, "Connect now →" ở dưới.',
      picked: false,
    },
  ];

  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);

  triggerHours(id: HoursId): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.hoursAnimating() === id) return;

    const current = this.hoursState[id];
    const isFrom = current() === HOURS_FROM;
    const target = isFrom ? HOURS_TO : HOURS_FROM;

    this.hoursAnimating.set(id);

    if (id === 'slot' || id === 'digit' || id === 'crossfade') {
      setTimeout(() => {
        current.set(target);
        setTimeout(() => this.hoursAnimating.set(null), 400);
      }, 300);
    } else if (id === 'type') {
      let i = 0;
      current.set('');
      const tick = () => {
        if (i <= target.length) {
          current.set(target.slice(0, i));
          i++;
          setTimeout(tick, 36);
        } else {
          this.hoursAnimating.set(null);
        }
      };
      tick();
    } else if (id === 'scramble') {
      const pool = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-:·';
      const len = target.length;
      let frame = 0;
      const totalFrames = 18;
      const tick = () => {
        if (frame >= totalFrames) {
          current.set(target);
          this.hoursAnimating.set(null);
          return;
        }
        const reveal = Math.floor((frame / totalFrames) * len);
        let next = '';
        for (let i = 0; i < len; i++) {
          if (i < reveal) {
            next += target[i];
          } else {
            const ch = target[i];
            next += /[\s·–-]/.test(ch) ? ch : pool[Math.floor(Math.random() * pool.length)];
          }
        }
        current.set(next);
        frame++;
        setTimeout(tick, 35);
      };
      tick();
    }
  }

  async copyEmail(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      const nav = this.document.defaultView?.navigator;
      await nav?.clipboard?.writeText(this.demo.email);
      this.emailCopyState.set('copied');
      setTimeout(() => this.emailCopyState.set('idle'), 1500);
    } catch {
      // Silent fail — DDL only.
    }
  }
}
