import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import {
  ContainerComponent,
  LandingLinkComponent,
  LandingPageShellComponent,
  StatusDotComponent,
  type BreadcrumbItem,
} from '@portfolio/landing/shared/ui';

interface ComingSoonRouteData {
  section: string;
  blurb?: string;
}

@Component({
  selector: 'landing-coming-soon-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ContainerComponent, LandingPageShellComponent, LandingLinkComponent, StatusDotComponent],
  templateUrl: './coming-soon.page.html',
  styleUrls: ['./coming-soon.page.scss'],
})
export class ComingSoonPage {
  private readonly route = inject(ActivatedRoute);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  private readonly data = toSignal(this.route.data.pipe(map((d) => d as ComingSoonRouteData)), {
    initialValue: { section: 'This page' } as ComingSoonRouteData,
  });

  readonly section = computed(() => this.data().section);
  readonly blurb = computed(
    () => this.data().blurb ?? "I'm writing this section now — it'll show up here when it's ready."
  );
  readonly breadcrumb = computed<readonly BreadcrumbItem[]>(() => [
    { label: 'Home', href: '/' },
    { label: this.section() },
  ]);

  constructor() {
    queueMicrotask(() => {
      this.title.setTitle(`${this.section()} · coming soon · Phuong Tran`);
      this.meta.updateTag({ name: 'robots', content: 'noindex' });
    });
  }
}
