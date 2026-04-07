import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { combineLatest, switchMap } from 'rxjs';
import { ContainerComponent, SectionComponent, IconComponent, BadgeComponent } from '@portfolio/landing/shared/ui';
import { BlogDataService } from '@portfolio/landing/shared/data-access';
import type { BlogPostListResponse } from '@portfolio/landing/shared/data-access';

const PAGE_SIZE = 10;
const EMPTY: BlogPostListResponse = { data: [], total: 0, page: 1, limit: PAGE_SIZE };

@Component({
  selector: 'landing-blog-list-page',
  imports: [RouterLink, ContainerComponent, SectionComponent, IconComponent, BadgeComponent],
  templateUrl: './blog-list-page.html',
  styleUrl: './blog-list-page.scss',
})
export class BlogListPage {
  private blogService = inject(BlogDataService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private title = inject(Title);
  private meta = inject(Meta);

  page = signal(1);

  constructor() {
    this.title.setTitle('Blog | Phuong Tran');
    this.meta.updateTag({
      name: 'description',
      content: 'Articles and notes by Phuong Tran on software engineering, design, and tools.',
    });
  }

  private queryParams = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  categorySlug = computed(() => this.queryParams().get('category') ?? undefined);
  tagSlug = computed(() => this.queryParams().get('tag') ?? undefined);

  private response = toSignal(
    combineLatest([this.route.queryParamMap, toObservable(this.page)]).pipe(
      switchMap(([params, page]) =>
        this.blogService.list({
          page,
          limit: PAGE_SIZE,
          categorySlug: params.get('category') ?? undefined,
          tagSlug: params.get('tag') ?? undefined,
        })
      )
    ),
    { initialValue: EMPTY }
  );

  posts = computed(() => this.response().data);
  total = computed(() => this.response().total);
  totalPages = computed(() => Math.max(1, Math.ceil(this.total() / PAGE_SIZE)));

  prevPage() {
    this.page.update((p) => Math.max(1, p - 1));
  }

  nextPage() {
    this.page.update((p) => Math.min(this.totalPages(), p + 1));
  }

  categories = computed(() => {
    const seen = new Map<string, { name: string; slug: string }>();
    for (const post of this.posts()) {
      for (const c of post.categories) {
        if (!seen.has(c.slug)) seen.set(c.slug, { name: c.name, slug: c.slug });
      }
    }
    return Array.from(seen.values());
  });

  selectCategory(slug: string | undefined) {
    this.page.set(1);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { category: slug ?? null },
      queryParamsHandling: 'merge',
    });
  }

  formatDate(dateStr: string | null): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
}
