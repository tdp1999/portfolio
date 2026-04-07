import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { NotFoundError, ErrorLayer, BlogPostErrorCode } from '@portfolio/shared/errors';
import { getLocalized } from '@portfolio/shared/utils';
import type { Locale } from '@portfolio/shared/types';
import { IBlogPostRepository } from '../ports/blog-post.repository.port';
import { BLOG_POST_REPOSITORY } from '../blog-post.token';
import { IProfileRepository } from '../../../profile/application/ports/profile.repository.port';
import { PROFILE_REPOSITORY } from '../../../profile/application/profile.token';
import { IUserRepository } from '../../../user/application/ports/user.repository.port';
import { USER_REPOSITORY } from '../../../user/application/user.token';
import { BlogPostAuthorDto, BlogPostPublicDetailDto } from '../blog-post.dto';
import { BlogPostPresenter } from '../blog-post.presenter';

export class GetPublicPostBySlugQuery {
  constructor(readonly slug: string) {}
}

@QueryHandler(GetPublicPostBySlugQuery)
export class GetPublicPostBySlugHandler implements IQueryHandler<GetPublicPostBySlugQuery> {
  constructor(
    @Inject(BLOG_POST_REPOSITORY) private readonly repo: IBlogPostRepository,
    @Inject(PROFILE_REPOSITORY) private readonly profileRepo: IProfileRepository,
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository
  ) {}

  async execute(query: GetPublicPostBySlugQuery): Promise<BlogPostPublicDetailDto> {
    const post = await this.repo.findBySlug(query.slug);
    if (!post)
      throw NotFoundError('Blog post not found', {
        errorCode: BlogPostErrorCode.NOT_FOUND,
        layer: ErrorLayer.APPLICATION,
      });

    const author = await this.resolveAuthor(post.entity.authorId, post.entity.language);

    const related = await this.repo.findRelated(
      post.entity.id,
      post.relations.categories.map((c) => c.id),
      post.relations.tags.map((t) => t.id),
      3
    );

    return BlogPostPresenter.toPublicDetail(post, author, related);
  }

  private async resolveAuthor(authorId: string, language: 'EN' | 'VI'): Promise<BlogPostAuthorDto | null> {
    const locale = language.toLowerCase() as Locale;

    // Try Profile first (richer data)
    const profileWithMedia = await this.profileRepo.findWithMedia(authorId);
    if (profileWithMedia) {
      const { profile, avatarUrl } = profileWithMedia;
      return {
        id: authorId,
        name: getLocalized(profile.fullName, locale) || null,
        avatarUrl,
        shortBio: getLocalized(profile.bioShort, locale) || null,
      };
    }

    // Fall back to User
    const user = await this.userRepo.findById(authorId);
    if (!user) return null;

    return {
      id: authorId,
      name: user.name ?? null,
      avatarUrl: null,
      shortBio: null,
    };
  }
}
