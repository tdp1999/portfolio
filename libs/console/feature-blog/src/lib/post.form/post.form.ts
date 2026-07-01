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
import { DatePipe, DecimalPipe } from '@angular/common';
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
  ChipBoolean,
  HasUnsavedChanges,
  MediaPickerDialogComponent,
  RichTextEditor,
  SectionCard,
  StickySaveBar,
  ToastService,
  type MediaPickerDataSource,
  type MediaPickerDialogData,
} from '@portfolio/console/shared/ui';
import { MediaService } from '@portfolio/console/shared/data-access';
import type { MediaItem } from '@portfolio/console/shared/util';
import {
  baselineFor,
  editorDocToPlainText,
  FormErrorPipe,
  richTextRequiredValidator,
  ServerErrorDirective,
} from '@portfolio/console/shared/util';
import type { EditorDocument } from '@portfolio/shared/features/rte-core';
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

@Component({
  selector: 'console-post-form',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ChipBoolean,
    MatTooltipModule,
    RouterLink,
    FormErrorPipe,
    ServerErrorDirective,
    SectionCard,
    StickySaveBar,
    RichTextEditor,
  ],
  templateUrl: './post.form.html',
  styleUrl: './post.form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PostForm implements OnInit, HasUnsavedChanges {
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
    content: this.fb.control<EditorDocument | null>(null, { validators: [richTextRequiredValidator()] }),
    excerpt: ['', baselineFor.longText(LIMITS.DESCRIPTION_SHORT_MAX)],
    language: ['EN' as BlogLanguage, [Validators.required]],
    status: ['DRAFT' as BlogStatus, [Validators.required]],
    featured: [false],
    categoryIds: [[] as string[]],
    tagIds: [[] as string[]],
    metaTitle: ['', baselineFor.metaTitle()],
    metaDescription: ['', baselineFor.metaDescription()],
    // Empty string sentinel = no cover. Validators.required rejects empty strings,
    // so this gates submit when the user has not picked a cover.
    featuredImageId: ['', [Validators.required]],
  });

  readonly slugManuallyEdited = signal(false);
  readonly featuredImageUrl = signal<string | null>(null);
  readonly readTimeMinutes = signal<number | null>(null);
  readonly publishedAt = signal<string | null>(null);

  // ui state
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly importing = signal(false);

  // lookups
  readonly categories = signal<BlogCategoryRef[]>([]);
  readonly tags = signal<BlogTagRef[]>([]);

  readonly dirty = signal(false);

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

  autoGenerateExcerpt(): void {
    const plain = editorDocToPlainText(this.form.controls.content.value);
    this.form.controls.excerpt.setValue(plain.slice(0, LIMITS.DESCRIPTION_SHORT_MAX));
    this.form.controls.excerpt.markAsDirty();
  }

  /**
   * Obsidian/Markdown import (create mode). Reads the chosen `.md` file and asks
   * the BE to convert it to editor JSON, then **prefills the editor** (title +
   * body) — it does NOT save. The author reviews and clicks Save through the
   * normal create flow (cover, validation, persistence happen there). Image
   * warnings are surfaced as a toast.
   */
  onImportFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // allow re-selecting the same file
    if (!file) return;

    this.importing.set(true);
    file
      .text()
      .then((content) => {
        this.blogService.convertMarkdown({ content }).subscribe({
          next: (res) => {
            this.importing.set(false);
            // Prefill the title only if the field is still empty (don't clobber
            // a title the author already typed); always load the body.
            if (!this.form.controls.title.value.trim()) {
              this.form.controls.title.setValue(res.title);
            }
            this.form.controls.content.setValue(res.contentJson);
            this.form.controls.content.markAsDirty();
            this.dirty.set(true);
            if (res.warnings.length) this.toast.info(res.warnings.join('\n'));
            this.toast.success('Markdown loaded — review and Save');
          },
          error: () => this.importing.set(false),
        });
      })
      .catch(() => {
        this.importing.set(false);
        this.toast.error('Could not read the selected file');
      });
  }

  openFeaturedImagePicker(): void {
    const ref = this.dialog.open<MediaPickerDialogComponent, MediaPickerDialogData, MediaItem | undefined>(
      MediaPickerDialogComponent,
      {
        width: '900px',
        maxHeight: '90vh',
        data: {
          mode: 'single',
          selectedIds: this.form.controls.featuredImageId.value ? [this.form.controls.featuredImageId.value] : [],
          mimeFilter: 'image/',
          dataSource: this.mediaDataSource,
        } satisfies MediaPickerDialogData,
      }
    );
    ref
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((item) => {
        if (!item) return;
        this.form.controls.featuredImageId.setValue(item.id);
        this.form.controls.featuredImageId.markAsTouched();
        this.featuredImageUrl.set(item.url);
        this.dirty.set(true);
      });
  }

  clearFeaturedImage(): void {
    this.form.controls.featuredImageId.setValue('');
    this.form.controls.featuredImageId.markAsTouched();
    this.featuredImageUrl.set(null);
    this.dirty.set(true);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.error('Please fix validation errors before saving');
      return;
    }

    this.saving.set(true);

    const raw = this.form.getRawValue();
    // Canonical content is the editor document (contentJson). The legacy `content`
    // column (still NOT NULL until task 363) is kept in sync with a plain-text
    // flattening; fall back to the title so it never violates min-length.
    const contentDoc = raw.content ?? undefined;
    const legacyContent = editorDocToPlainText(raw.content) || raw.title;

    if (this.isEditMode()) {
      const payload: UpdateBlogPostPayload = {
        title: raw.title,
        content: legacyContent,
        contentJson: contentDoc,
        language: raw.language,
        excerpt: raw.excerpt || null,
        categoryIds: raw.categoryIds,
        tagIds: raw.tagIds,
        featuredImageId: raw.featuredImageId,
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
        error: () => this.saving.set(false),
      });
    } else {
      const payload: CreateBlogPostPayload = {
        title: raw.title,
        content: legacyContent,
        contentJson: contentDoc,
        language: raw.language,
        excerpt: raw.excerpt || undefined,
        categoryIds: raw.categoryIds,
        tagIds: raw.tagIds,
        featuredImageId: raw.featuredImageId,
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
        error: () => this.saving.set(false),
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
        content: null,
        excerpt: '',
        language: 'EN',
        status: 'DRAFT',
        featured: false,
        categoryIds: [],
        tagIds: [],
        metaTitle: '',
        metaDescription: '',
        featuredImageId: '',
      });
      this.featuredImageUrl.set(null);
      this.slugManuallyEdited.set(false);
      this.dirty.set(false);
    }
  }

  private loadPost(id: string): void {
    this.loading.set(true);
    this.blogService.getById(id).subscribe({
      next: (post: AdminBlogPostDetail) => {
        // A post is single-language: pull that locale's document out of the
        // bilingual storage envelope. Null (legacy/not-yet-migrated) → empty editor.
        const lang = post.language === 'VI' ? 'vi' : 'en';
        this.form.setValue({
          title: post.title,
          slug: post.slug,
          content: post.contentJson ? post.contentJson[lang] : null,
          excerpt: post.excerpt ?? '',
          language: post.language,
          status: post.status,
          featured: post.featured,
          categoryIds: post.categories.map((c) => c.id),
          tagIds: post.tags.map((t) => t.id),
          metaTitle: post.metaTitle ?? '',
          metaDescription: post.metaDescription ?? '',
          featuredImageId: post.featuredImageId ?? '',
        });
        this.slugManuallyEdited.set(true);
        this.featuredImageUrl.set(post.featuredImageUrl);
        this.readTimeMinutes.set(post.readTimeMinutes);
        this.publishedAt.set(post.publishedAt);
        this.loading.set(false);
        this.dirty.set(false);
      },
      error: () => this.loading.set(false),
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
