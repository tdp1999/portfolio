import { BaseCrudEntity, SlugValue, TranslatableJson, TranslatableRichText } from '@portfolio/shared/types';
import { BadRequestError, BlogPostErrorCode, ErrorLayer } from '@portfolio/shared/errors';
import { IBlogPostProps, ICreateBlogPostPayload, IUpdateBlogPostPayload, PostStatus } from '../blog-post.types';

export class BlogPost extends BaseCrudEntity<IBlogPostProps> {
  private constructor(props: IBlogPostProps) {
    super(props);
  }

  get slug(): string {
    return this.props.slug;
  }

  get language(): 'EN' | 'VI' {
    return this.props.language;
  }

  get title(): string {
    return this.props.title;
  }

  get excerpt(): string | null {
    return this.props.excerpt;
  }

  get content(): string {
    return this.props.content;
  }

  get contentJson(): TranslatableRichText | null {
    return this.props.contentJson;
  }

  get contentHtml(): TranslatableJson | null {
    return this.props.contentHtml;
  }

  get contentSchemaVersion(): number {
    return this.props.contentSchemaVersion;
  }

  get readTimeMinutes(): number | null {
    return this.props.readTimeMinutes;
  }

  get status(): PostStatus {
    return this.props.status;
  }

  get featured(): boolean {
    return this.props.featured;
  }

  get publishedAt(): Date | null {
    return this.props.publishedAt;
  }

  get metaTitle(): string | null {
    return this.props.metaTitle;
  }

  get metaDescription(): string | null {
    return this.props.metaDescription;
  }

  get authorId(): string {
    return this.props.authorId;
  }

  get featuredImageId(): string {
    return this.props.featuredImageId;
  }

  static calculateReadTime(content: string): number {
    const trimmed = content.trim();
    if (!trimmed) return 0;
    const wordCount = trimmed.split(/\s+/).length;
    return Math.ceil(wordCount / 200);
  }

  static create(data: ICreateBlogPostPayload, userId: string): BlogPost {
    // PST-011: cover image required at create time.
    if (!data.featuredImageId) {
      throw BadRequestError('A cover image is required (PST-011).', {
        errorCode: BlogPostErrorCode.COVER_REQUIRED,
        layer: ErrorLayer.DOMAIN,
      });
    }

    return new BlogPost({
      ...BaseCrudEntity.createBaseProps(userId),
      slug: SlugValue.from(data.title),
      language: data.language ?? 'EN',
      title: data.title,
      excerpt: data.excerpt ?? null,
      content: data.content,
      // Rich-text columns default empty; write path lands in RTE epic Phase 4.
      contentJson: null,
      contentHtml: null,
      contentSchemaVersion: 1,
      readTimeMinutes: BlogPost.calculateReadTime(data.content),
      status: 'DRAFT',
      featured: data.featured ?? false,
      publishedAt: null,
      metaTitle: data.metaTitle ?? null,
      metaDescription: data.metaDescription ?? null,
      authorId: data.authorId,
      featuredImageId: data.featuredImageId,
    });
  }

  static load(props: IBlogPostProps): BlogPost {
    return new BlogPost(props);
  }

  update(data: IUpdateBlogPostPayload, userId: string): BlogPost {
    const title = data.title ?? this.props.title;
    const slug = data.title !== undefined ? SlugValue.from(data.title) : this.props.slug;
    const content = data.content ?? this.props.content;
    const readTimeMinutes =
      data.content !== undefined ? BlogPost.calculateReadTime(content) : this.props.readTimeMinutes;
    const status = data.status ?? this.props.status;

    if ((status === 'PUBLISHED' || status === 'UNLISTED') && (!title || !content)) {
      throw BadRequestError('Title and content are required for Published or Unlisted posts', {
        errorCode: BlogPostErrorCode.CONTENT_REQUIRED,
        layer: ErrorLayer.DOMAIN,
      });
    }

    // PST-011: cover cannot be unset. Type-wise null is no longer in the payload union,
    // but a runtime caller (loose layer, deserialised JSON) could still slip null through.
    if (data.featuredImageId === null || data.featuredImageId === '') {
      throw BadRequestError('A cover image is required (PST-011).', {
        errorCode: BlogPostErrorCode.COVER_REQUIRED,
        layer: ErrorLayer.DOMAIN,
      });
    }

    // Auto-set publishedAt on first transition to PUBLISHED via update
    let publishedAt = this.props.publishedAt;
    if (data.publishedAt !== undefined) {
      publishedAt = data.publishedAt;
    } else if (status === 'PUBLISHED' && this.props.status !== 'PUBLISHED' && !this.props.publishedAt) {
      publishedAt = new Date();
    }

    return new BlogPost({
      ...this.props,
      title,
      slug,
      content,
      readTimeMinutes,
      status,
      publishedAt,
      language: data.language ?? this.props.language,
      excerpt: data.excerpt !== undefined ? data.excerpt : this.props.excerpt,
      featured: data.featured ?? this.props.featured,
      featuredImageId: data.featuredImageId ?? this.props.featuredImageId,
      metaTitle: data.metaTitle !== undefined ? data.metaTitle : this.props.metaTitle,
      metaDescription: data.metaDescription !== undefined ? data.metaDescription : this.props.metaDescription,
      ...BaseCrudEntity.updateTimestamp(userId),
    });
  }

  publish(userId: string): BlogPost {
    if (!this.props.title || !this.props.content) {
      throw BadRequestError('Title and content are required before publishing', {
        errorCode: BlogPostErrorCode.CONTENT_REQUIRED,
        layer: ErrorLayer.DOMAIN,
      });
    }

    const publishedAt = this.props.publishedAt ?? new Date();

    return new BlogPost({
      ...this.props,
      status: 'PUBLISHED',
      publishedAt,
      ...BaseCrudEntity.updateTimestamp(userId),
    });
  }

  softDelete(userId: string): BlogPost {
    return new BlogPost({
      ...this.props,
      deletedAt: new Date(),
      deletedById: userId,
      ...BaseCrudEntity.updateTimestamp(userId),
    });
  }

  restore(userId: string): BlogPost {
    return new BlogPost({
      ...this.props,
      deletedAt: null,
      deletedById: null,
      ...BaseCrudEntity.updateTimestamp(userId),
    });
  }

  toProps(): IBlogPostProps {
    return { ...this.props };
  }
}
