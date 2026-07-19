import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { Container, EmptyState, PageShell, type BreadcrumbItem } from '@portfolio/landing/shared/ui';
import { VersionService } from '@portfolio/landing/shared/data-access';
import type { VersionResult } from './version.types';

@Component({
  selector: 'landing-version',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Container, PageShell, EmptyState],
  templateUrl: './version.html',
  styleUrls: ['./version.scss'],
})
export class Version {
  readonly breadcrumb: readonly BreadcrumbItem[] = [{ label: 'Home', href: '/' }, { label: 'Version' }];

  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly versionService = inject(VersionService);

  private readonly initial: VersionResult = { status: 'loading', info: null };

  private readonly result = toSignal(
    this.versionService.getVersion().pipe(map((info): VersionResult => ({ status: info ? 'ready' : 'error', info }))),
    { initialValue: this.initial }
  );

  readonly status = computed(() => this.result().status);
  readonly info = computed(() => this.result().info);

  /** Uppercase mono strip under the hero: environment + branch, or a status note. */
  readonly metaLine = computed(() => {
    const v = this.info();
    if (!v) return this.status() === 'error' ? 'API unreachable.' : 'Loading…';
    return `${v.environment} · ${v.branch}`;
  });

  /**
   * Rendered in UTC with a fixed format on purpose: locale/timezone formatting
   * differs between the SSR process and the browser, which would trip hydration.
   */
  readonly startedAt = computed(() => {
    const iso = this.info()?.serverStartedAt;
    if (!iso) return '';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    const pad = (n: number) => String(n).padStart(2, '0');
    return (
      `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ` +
      `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())} UTC`
    );
  });

  constructor() {
    this.title.setTitle('Version | Phuong Tran');
    this.meta.updateTag({ name: 'robots', content: 'noindex' });
  }
}
