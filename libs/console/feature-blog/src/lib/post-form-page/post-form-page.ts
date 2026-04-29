import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  HostListener,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import {
  ChipBooleanComponent,
  MediaPickerDialogComponent,
  SectionCardComponent,
  StickySaveBarComponent,
  ToastService,
  type MediaPickerDataSource,
  type MediaPickerDialogData,
} from '@portfolio/console/shared/ui';
import { MediaService } from '@portfolio/console/shared/data-access';
import type { MediaItem } from '@portfolio/console/shared/util';
import { baselineFor, FormErrorPipe, HasUnsavedChanges } from '@portfolio/console/shared/util';
import { LIMITS } from '@portfolio/shared/validation';
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
import { filter, map, switchMap, tap } from 'rxjs';
import { convertObsidianMarkdown, extractTitleFromMarkdown, renderMarkdownPreview } from './markdown-utils';

@Component({
  selector: 'console-post-form-page',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    DecimalPipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ChipBooleanComponent,
    MatTooltipModule,
    RouterLink,
    FormErrorPipe,
    SectionCardComponent,
    StickySaveBarComponent,
  ],
  templateUrl: './post-form-page.html',
  styleUrl: './post-form-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PostFormPageComponent implements OnInit, HasUnsavedChanges {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly blogService = inject(BlogService);
  private readonly mediaService = inject(MediaService);
  private readonly dialog = inject(MatDialog);
  private readonly mediaDataSource: MediaPickerDataSource = {
    list: (p) => this.mediaService.list(p),
    upload: (f, folder) => this.mediaService.upload(f, { folder }),
    getById: (id) => this.mediaService.getById(id),
    getByIdSilent: (id) => this.mediaService.getByIdSilent(id),
  };
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly postId = signal<string | null>(null);
  readonly isEditMode = computed(() => this.postId() !== null);

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(LIMITS.TITLE_MAX)]],
    slug: ['', [Validators.maxLength(LIMITS.NAME_MAX)]],
    content: ['', [Validators.required]],
    excerpt: ['', baselineFor.longText(LIMITS.DESCRIPTION_SHORT_MAX)],
    language: ['EN' as BlogLanguage, [Validators.required]],
    status: ['DRAFT' as BlogStatus, [Validators.required]],
    featured: [false],
    categoryIds: [[] as string[]],
    tagIds: [[] as string[]],
    metaTitle: ['', baselineFor.metaTitle()],
    metaDescription: ['', baselineFor.metaDescription()],
  });

  readonly slugManuallyEdited = signal(false);
  readonly featuredImageId = signal<string | null>(null);
  readonly featuredImageUrl = signal<string | null>(null);
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

  readonly previewHtml = computed(() => renderMarkdownPreview(this.form.controls.content.value));

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.postId.set(idParam);

    this.blogService.listAllCategories().subscribe({
      next: (res) => this.categories.set(res.data),
    });
    this.blogService.listAllTags().subscribe({
      next: (res) => this.tags.set(res.data),
    });

    // Mark dirty on any form change.
    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.dirty.set(true));

    // Auto-generate slug from title in create mode until the user edits the slug field manually.
    this.form.controls.title.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((title) => {
      if (!this.isEditMode() && !this.slugManuallyEdited()) {
        this.form.controls.slug.setValue(this.slugify(title), { emitEvent: false });
      }
    });
    this.form.controls.slug.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      // Once the user touches the slug control, stop deriving it from title.
      if (this.form.controls.slug.dirty) this.slugManuallyEdited.set(true);
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

  togglePreview(): void {
    this.previewMode.update((v) => !v);
  }

  autoGenerateExcerpt(): void {
    const plain = this.form.controls.content.value
      .replace(/```[\s\S]*?```/g, '')
      .replace(/[#>*_`~\-![]()]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    this.form.controls.excerpt.setValue(plain.slice(0, LIMITS.DESCRIPTION_SHORT_MAX));
    this.form.controls.excerpt.markAsDirty();
  }

  openFeaturedImagePicker(): void {
    const ref = this.dialog.open(MediaPickerDialogComponent, {
      width: '900px',
      maxHeight: '90vh',
      data: {
        mode: 'single',
        selectedIds: this.featuredImageId() ? [this.featuredImageId() as string] : [],
        mimeFilter: 'image/',
        dataSource: this.mediaDataSource,
      } satisfies MediaPickerDialogData,
    });
    ref
      .afterClosed()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        map((result) => (Array.isArray(result) ? result[0] : result) as string | undefined),
        filter((id): id is string => !!id),
        tap((id) => {
          this.featuredImageId.set(id);
          this.dirty.set(true);
        }),
        switchMap((id) => this.mediaService.getById(id))
      )
      .subscribe({ next: (item: MediaItem) => this.featuredImageUrl.set(item.url) });
  }

  clearFeaturedImage(): void {
    this.featuredImageId.set(null);
    this.featuredImageUrl.set(null);
    this.dirty.set(true);
  }

  insertImage(): void {
    const ref = this.dialog.open(MediaPickerDialogComponent, {
      width: '900px',
      maxHeight: '90vh',
      data: { mode: 'single', mimeFilter: 'image/', dataSource: this.mediaDataSource } satisfies MediaPickerDialogData,
    });
    ref
      .afterClosed()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        map((result) => (Array.isArray(result) ? result[0] : result) as string | undefined),
        filter((id): id is string => !!id),
        switchMap((id) => this.mediaService.getById(id))
      )
      .subscribe({
        next: (item: MediaItem) => {
          const alt = item.altText ?? item.originalFilename;
          const md = `\n![${alt}](${item.url})\n`;
          this.form.controls.content.setValue(this.form.controls.content.value + md);
        },
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
      if (extractedTitle && !this.form.controls.title.value) {
        this.form.controls.title.setValue(extractedTitle);
      }
      this.form.controls.content.setValue(converted);
      this.form.controls.status.setValue('DRAFT');
      this.importWarnings.set(warnings);
      input.value = '';
    };
    reader.readAsText(file);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.error('Please fix validation errors before saving');
      return;
    }

    this.saving.set(true);

    const raw = this.form.getRawValue();

    if (this.isEditMode()) {
      const payload: UpdateBlogPostPayload = {
        title: raw.title,
        content: raw.content,
        language: raw.language,
        excerpt: raw.excerpt || null,
        categoryIds: raw.categoryIds,
        tagIds: raw.tagIds,
        featuredImageId: this.featuredImageId(),
        status: raw.status,
        featured: raw.featured,
        metaTitle: raw.metaTitle || null,
        metaDescription: raw.metaDescription || null,
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
        title: raw.title,
        content: raw.content,
        language: raw.language,
        excerpt: raw.excerpt || undefined,
        categoryIds: raw.categoryIds,
        tagIds: raw.tagIds,
        featuredImageId: this.featuredImageId(),
        status: raw.status,
        featured: raw.featured,
        metaTitle: raw.metaTitle || undefined,
        metaDescription: raw.metaDescription || undefined,
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

  hasUnsavedChanges() {
    return this.dirty;
  }

  discard(): void {
    const id = this.postId();
    if (id) {
      this.loadPost(id);
    } else {
      this.form.reset({
        title: '',
        slug: '',
        content: '',
        excerpt: '',
        language: 'EN',
        status: 'DRAFT',
        featured: false,
        categoryIds: [],
        tagIds: [],
        metaTitle: '',
        metaDescription: '',
      });
      this.featuredImageId.set(null);
      this.featuredImageUrl.set(null);
      this.slugManuallyEdited.set(false);
      this.dirty.set(false);
    }
  }

  private loadPost(id: string): void {
    this.loading.set(true);
    this.blogService.getById(id).subscribe({
      next: (post: AdminBlogPostDetail) => {
        this.form.setValue({
          title: post.title,
          slug: post.slug,
          content: post.content,
          excerpt: post.excerpt ?? '',
          language: post.language,
          status: post.status,
          featured: post.featured,
          categoryIds: post.categories.map((c) => c.id),
          tagIds: post.tags.map((t) => t.id),
          metaTitle: post.metaTitle ?? '',
          metaDescription: post.metaDescription ?? '',
        });
        this.slugManuallyEdited.set(true);
        this.featuredImageId.set(post.featuredImageId);
        this.featuredImageUrl.set(post.featuredImageUrl);
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
      .slice(0, LIMITS.NAME_MAX);
  }
}
