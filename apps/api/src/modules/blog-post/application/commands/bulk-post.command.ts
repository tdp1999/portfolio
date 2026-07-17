import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ValidationError, ErrorLayer, BlogPostErrorCode } from '@portfolio/shared/errors';
import { BaseCommand } from '../../../../shared/cqrs/base.command';
import { IBlogPostRepository, BulkPostTarget } from '../ports/blog-post.repository.port';
import { BLOG_POST_REPOSITORY } from '../blog-post.token';
import { BulkPostActionSchema, type BulkPostAction, type BulkPostResultDto, type BulkPostSkip } from '../blog-post.dto';
import { POST_STATUS } from '../../domain/blog-post.types';

export class BulkPostCommand extends BaseCommand {
  constructor(
    readonly body: unknown,
    userId: string
  ) {
    super(userId);
  }
}

/**
 * One transactional bulk mutation across many posts. Each action maps to a single
 * `updateMany`/`deleteMany` (or a 2-statement transaction for publish), so there is
 * no per-item partial-failure surface — the vetted set converges atomically.
 *
 * Those statements bypass the domain layer, so `BlogPost`'s invariants never run.
 * `evaluate()` re-checks them here and narrows the id set to the eligible subset;
 * ineligible ids come back as `skipped` (id + the same `errorCode` the single-post
 * path throws) so the console can name them. This runs on every call and never
 * trusts the client — an id set is only as good as the state at execute time.
 *
 * Contract: `count + skipped.length === ids.length`. Every submitted id is either
 * written or explained; nothing is dropped in silence.
 */
@CommandHandler(BulkPostCommand)
export class BulkPostHandler implements ICommandHandler<BulkPostCommand> {
  constructor(@Inject(BLOG_POST_REPOSITORY) private readonly repo: IBlogPostRepository) {}

  async execute(command: BulkPostCommand): Promise<BulkPostResultDto> {
    const { success, data, error } = BulkPostActionSchema.safeParse(command.body);
    if (!success)
      throw ValidationError(error, {
        errorCode: BlogPostErrorCode.INVALID_INPUT,
        layer: ErrorLayer.APPLICATION,
        remarks: 'Bulk post action validation failed',
      });

    const { ids, action } = data;
    const { eligible, skipped } = await this.evaluate(action, ids);
    const count = eligible.length === 0 ? 0 : await this.run(action, eligible, command.userId);
    return { count, skipped };
  }

  /**
   * Replays what the bulk SQL can't see: the domain invariants AND the trash-state
   * rails baked into each repo WHERE clause. Every submitted id lands in exactly one
   * of `eligible`/`skipped` — a row silently dropped by a WHERE clause would
   * otherwise vanish from both `count` and `skipped`, and the console would report
   * a clean success for a post it never touched.
   *
   * Iteration follows the submitted `ids`, not the query result, so a batch with an
   * internal slug collision resolves the same way on every retry.
   */
  private async evaluate(
    action: BulkPostAction,
    ids: string[]
  ): Promise<{ eligible: string[]; skipped: BulkPostSkip[] }> {
    const byId = new Map((await this.repo.findBulkTargets(ids)).map((t) => [t.id, t]));

    // Only `restore` re-homes a slug, so only it needs the active-slug lookup.
    const taken =
      action === 'restore'
        ? new Set(await this.repo.findTakenSlugs([...byId.values()].filter((t) => t.isDeleted).map((t) => t.slug)))
        : new Set<string>();

    const eligible: string[] = [];
    const skipped: BulkPostSkip[] = [];

    for (const id of ids) {
      const target = byId.get(id);
      if (!target) {
        skipped.push({ id, errorCode: BlogPostErrorCode.NOT_FOUND });
        continue;
      }
      const rejection = this.reject(action, target, taken);
      if (rejection) {
        skipped.push({ id, errorCode: rejection });
        continue;
      }
      // Claim the slug so a second post in this same batch can't take it too:
      // neither conflicts with a live row, but restoring both would collide.
      if (action === 'restore') taken.add(target.slug);
      eligible.push(id);
    }

    return { eligible, skipped };
  }

  /**
   * Why `target` can't take `action`, or null if it can. Each branch mirrors an
   * existing single-post rule:
   * - trash state → the repo WHERE clause (and NOT_FOUND from Delete/RestoreHandler)
   * - publish → `BlogPost.update()`'s CONTENT_REQUIRED: an empty draft must never
   *   reach the public site
   * - restore → `RestorePostHandler`'s SLUG_CONFLICT: slug uniqueness is enforced
   *   among ACTIVE posts only (no DB constraint), so restoring onto a reused slug
   *   would put two live posts on one URL
   */
  private reject(action: BulkPostAction, target: BulkPostTarget, taken: Set<string>): BlogPostErrorCode | null {
    switch (action) {
      case 'delete':
      case 'unpublish':
        return target.isDeleted ? BlogPostErrorCode.NOT_FOUND : null;
      case 'permanent-delete':
        return target.isDeleted ? null : BlogPostErrorCode.NOT_FOUND;
      case 'publish':
        if (target.isDeleted) return BlogPostErrorCode.NOT_FOUND;
        return target.hasContent && target.title.trim().length > 0 ? null : BlogPostErrorCode.CONTENT_REQUIRED;
      case 'restore':
        if (!target.isDeleted) return BlogPostErrorCode.NOT_FOUND;
        return taken.has(target.slug) ? BlogPostErrorCode.SLUG_CONFLICT : null;
    }
  }

  private run(action: BulkPostAction, ids: string[], userId: string): Promise<number> {
    switch (action) {
      case 'delete':
        return this.repo.bulkSoftDelete(ids, userId);
      case 'restore':
        return this.repo.bulkRestore(ids, userId);
      case 'permanent-delete':
        return this.repo.bulkPermanentDelete(ids);
      case 'publish':
        return this.repo.bulkSetStatus(ids, POST_STATUS.PUBLISHED, userId);
      case 'unpublish':
        return this.repo.bulkSetStatus(ids, POST_STATUS.DRAFT, userId);
    }
  }
}
