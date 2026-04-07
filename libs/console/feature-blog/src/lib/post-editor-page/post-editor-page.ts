import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { ToastService, MediaPickerDialogComponent, type MediaPickerDialogData } from '@portfolio/console/shared/ui';
import { MediaService, type MediaItem } from '@portfolio/console/shared/data-access';
import { BlogService } from '../blog.service';
import {
  AdminBlogPostDetail,
  BlogCategoryRef,
  BlogLanguage,
  BlogStatus,
  BlogTagRef,
  CreateBlogPostPayload,
  UpdateBlogPostPayload,
} from '../blog.types';
import { convertObsidianMarkdown, extractTitleFromMarkdown, renderMarkdownPreview } from './markdown-utils';

@Component({
  selector: 'console-post-editor-page',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    DecimalPipe,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatMenuModule,
    MatChipsModule,
    MatTooltipModule,
  ],
  templateUrl: './post-editor-page.html',
  styleUrl: './post-editor-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PostEditorPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly blogService = inject(BlogService);
  private readonly mediaService = inject(MediaService);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);

  readonly postId = signal<string | null>(null);
  readonly isEditMode = computed(() => this.postId() !== null);

  // form state
  readonly title = signal('');
  readonly slug = signal('');
  readonly slugManuallyEdited = signal(false);
  readonly content = signal('');
  readonly excerpt = signal('');
  readonly language = signal<BlogLanguage>('EN');
  readonly status = signal<BlogStatus>('DRAFT');
  readonly featured = signal(false);
  readonly featuredImageId = signal<string | null>(null);
  readonly featuredImageUrl = signal<string | null>(null);
  readonly categoryIds = signal<string[]>([]);
  readonly tagIds = signal<string[]>([]);
  readonly metaTitle = signal('');
  readonly metaDescription = signal('');
  readonly readTimeMinutes = signal<number | null>(null);
  readonly publishedAt = signal<string | null>(null);

  // ui state
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly previewMode = signal(false);
  readonly importWarnings = signal<string[]>([]);

  // lookups
  readonly categories = signal<BlogCategoryRef[]>([]);
  readonly tags = signal<BlogTagRef[]>([]);

  readonly dirty = signal(false);

  readonly previewHtml = computed(() => renderMarkdownPreview(this.content()));

  constructor() {
    // auto-generate slug from title on create mode
    effect(() => {
      const t = this.title();
      if (!this.isEditMode() && !this.slugManuallyEdited()) {
        this.slug.set(this.slugify(t));
      }
    });
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.postId.set(idParam);

    this.blogService.listAllCategories().subscribe({
      next: (res) => this.categories.set(res.data),
    });
    this.blogService.listAllTags().subscribe({
      next: (res) => this.tags.set(res.data),
    });

    if (idParam) {
      this.loadPost(idParam);
    }
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.dirty()) {
      event.preventDefault();
      event.returnValue = '';
    }
  }

  markDirty(): void {
    this.dirty.set(true);
  }

  onTitleChange(value: string): void {
    this.title.set(value);
    this.markDirty();
  }

  onSlugChange(value: string): void {
    this.slug.set(value);
    this.slugManuallyEdited.set(true);
    this.markDirty();
  }

  onContentChange(value: string): void {
    this.content.set(value);
    this.markDirty();
  }

  togglePreview(): void {
    this.previewMode.update((v) => !v);
  }

  autoGenerateExcerpt(): void {
    const plain = this.content()
      .replace(/```[\s\S]*?```/g, '')
      .replace(/[#>*_`~\-![]()]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    this.excerpt.set(plain.slice(0, 200));
    this.markDirty();
  }

  openFeaturedImagePicker(): void {
    const ref = this.dialog.open(MediaPickerDialogComponent, {
      width: '900px',
      maxHeight: '90vh',
      data: {
        mode: 'single',
        selectedIds: this.featuredImageId() ? [this.featuredImageId() as string] : [],
        mimeFilter: 'image/',
      } satisfies MediaPickerDialogData,
    });
    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      const id = Array.isArray(result) ? result[0] : result;
      if (!id) return;
      this.featuredImageId.set(id);
      this.markDirty();
      this.mediaService.getById(id).subscribe({
        next: (item: MediaItem) => this.featuredImageUrl.set(item.url),
      });
    });
  }

  clearFeaturedImage(): void {
    this.featuredImageId.set(null);
    this.featuredImageUrl.set(null);
    this.markDirty();
  }

  insertImage(): void {
    const ref = this.dialog.open(MediaPickerDialogComponent, {
      width: '900px',
      maxHeight: '90vh',
      data: { mode: 'single', mimeFilter: 'image/' } satisfies MediaPickerDialogData,
    });
    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      const id = Array.isArray(result) ? result[0] : result;
      if (!id) return;
      this.mediaService.getById(id).subscribe({
        next: (item: MediaItem) => {
          const alt = item.altText ?? item.originalFilename;
          const md = `\n![${alt}](${item.url})\n`;
          this.content.update((c) => c + md);
          this.markDirty();
        },
      });
    });
  }

  importMarkdownFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const raw = String(reader.result ?? '');
      const { content: converted, warnings } = convertObsidianMarkdown(raw);
      const extractedTitle = extractTitleFromMarkdown(converted);
      if (extractedTitle && !this.title()) {
        this.title.set(extractedTitle);
      }
      this.content.set(converted);
      this.status.set('DRAFT');
      this.importWarnings.set(warnings);
      this.markDirty();
      input.value = '';
    };
    reader.readAsText(file);
  }

  save(): void {
    if (!this.title().trim()) {
      this.toast.error('Title is required');
      return;
    }
    if (!this.content().trim()) {
      this.toast.error('Content is required');
      return;
    }

    this.saving.set(true);

    if (this.isEditMode()) {
      const payload: UpdateBlogPostPayload = {
        title: this.title(),
        content: this.content(),
        language: this.language(),
        excerpt: this.excerpt() || null,
        categoryIds: this.categoryIds(),
        tagIds: this.tagIds(),
        featuredImageId: this.featuredImageId(),
        status: this.status(),
        featured: this.featured(),
        metaTitle: this.metaTitle() || null,
        metaDescription: this.metaDescription() || null,
      };
      this.blogService.update(this.postId() as string, payload).subscribe({
        next: () => {
          this.toast.success('Post updated');
          this.saving.set(false);
          this.dirty.set(false);
        },
        error: () => {
          this.toast.error('Failed to update post');
          this.saving.set(false);
        },
      });
    } else {
      const payload: CreateBlogPostPayload = {
        title: this.title(),
        content: this.content(),
        language: this.language(),
        excerpt: this.excerpt() || undefined,
        categoryIds: this.categoryIds(),
        tagIds: this.tagIds(),
        featuredImageId: this.featuredImageId(),
        status: this.status(),
        featured: this.featured(),
        metaTitle: this.metaTitle() || undefined,
        metaDescription: this.metaDescription() || undefined,
      };
      this.blogService.create(payload).subscribe({
        next: (res) => {
          this.toast.success('Post created');
          this.saving.set(false);
          this.dirty.set(false);
          this.router.navigate(['/admin/blog', res.id, 'edit']);
        },
        error: () => {
          this.toast.error('Failed to create post');
          this.saving.set(false);
        },
      });
    }
  }

  goBack(): void {
    if (this.dirty() && !confirm('You have unsaved changes. Leave anyway?')) {
      return;
    }
    this.router.navigate(['/admin/blog']);
  }

  private loadPost(id: string): void {
    this.loading.set(true);
    this.blogService.getById(id).subscribe({
      next: (post: AdminBlogPostDetail) => {
        this.title.set(post.title);
        this.slug.set(post.slug);
        this.slugManuallyEdited.set(true);
        this.content.set(post.content);
        this.excerpt.set(post.excerpt ?? '');
        this.language.set(post.language);
        this.status.set(post.status);
        this.featured.set(post.featured);
        this.featuredImageId.set(post.featuredImageId);
        this.featuredImageUrl.set(post.featuredImageUrl);
        this.categoryIds.set(post.categories.map((c) => c.id));
        this.tagIds.set(post.tags.map((t) => t.id));
        this.metaTitle.set(post.metaTitle ?? '');
        this.metaDescription.set(post.metaDescription ?? '');
        this.readTimeMinutes.set(post.readTimeMinutes);
        this.publishedAt.set(post.publishedAt);
        this.loading.set(false);
        this.dirty.set(false);
      },
      error: () => {
        this.toast.error('Failed to load post');
        this.loading.set(false);
      },
    });
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 100);
  }
}
