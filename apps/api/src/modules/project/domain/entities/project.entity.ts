import {
  BaseCrudEntity,
  SlugValue,
  TranslatableJson,
  TranslatableRichText,
  PartialTranslatableJson,
} from '@portfolio/shared/types';
import {
  IProjectProps,
  ICreateProjectPayload,
  IUpdateProjectPayload,
  ContentStatus,
  ProjectLifecycleStatus,
} from '../project.types';
import { ProjectLink, ProjectLinkProps } from '../value-objects';

/** Per-locale merge: undefined patch keeps current; partial patch overlays current. */
function mergeTranslatable(current: TranslatableJson, patch: PartialTranslatableJson | undefined): TranslatableJson {
  if (!patch) return current;
  return { ...current, ...patch };
}

export class Project extends BaseCrudEntity<IProjectProps> {
  private constructor(props: IProjectProps) {
    super(props);
  }

  get slug(): string {
    return this.props.slug;
  }

  get title(): string {
    return this.props.title;
  }

  get oneLiner(): TranslatableJson {
    return this.props.oneLiner;
  }

  get description(): TranslatableJson {
    return this.props.description;
  }

  get motivation(): TranslatableJson {
    return this.props.motivation;
  }

  get role(): TranslatableJson {
    return this.props.role;
  }

  get body(): TranslatableJson | null {
    return this.props.body;
  }

  get bodyJson(): TranslatableRichText | null {
    return this.props.bodyJson;
  }

  get bodyHtml(): TranslatableJson | null {
    return this.props.bodyHtml;
  }

  get bodySchemaVersion(): number {
    return this.props.bodySchemaVersion;
  }

  get startDate(): Date {
    return this.props.startDate;
  }

  get endDate(): Date | null {
    return this.props.endDate;
  }

  get status(): ContentStatus {
    return this.props.status;
  }

  get lifecycleStatus(): ProjectLifecycleStatus {
    return this.props.lifecycleStatus;
  }

  get featured(): boolean {
    return this.props.featured;
  }

  get displayOrder(): number {
    return this.props.displayOrder;
  }

  get links(): ProjectLinkProps[] {
    return this.props.links;
  }

  get thumbnailId(): string | null {
    return this.props.thumbnailId;
  }

  get isPublished(): boolean {
    return this.props.status === 'PUBLISHED' && !this.isDeleted;
  }

  /** Validate links via the VO and return their plain props for storage. */
  private static normalizeLinks(links: ProjectLinkProps[] | undefined): ProjectLinkProps[] {
    if (!links || links.length === 0) return [];
    return links.map((l) => ProjectLink.create(l).toProps());
  }

  static create(data: ICreateProjectPayload, userId: string): Project {
    return new Project({
      ...BaseCrudEntity.createBaseProps(userId),
      slug: SlugValue.from(data.title),
      title: data.title,
      oneLiner: data.oneLiner,
      description: data.description,
      motivation: data.motivation,
      role: data.role,
      body: data.body ?? null,
      // Rich-text columns default empty; write path lands in RTE epic Phase 4.
      bodyJson: null,
      bodyHtml: null,
      bodySchemaVersion: 1,
      startDate: data.startDate,
      endDate: data.endDate ?? null,
      status: 'DRAFT',
      lifecycleStatus: data.lifecycleStatus ?? 'LIVE',
      featured: data.featured ?? false,
      displayOrder: data.displayOrder ?? 0,
      links: Project.normalizeLinks(data.links),
      thumbnailId: data.thumbnailId ?? null,
    });
  }

  static load(props: IProjectProps): Project {
    return new Project(props);
  }

  update(data: IUpdateProjectPayload, userId: string): Project {
    const title = data.title ?? this.props.title;
    const slug = data.title !== undefined ? SlugValue.from(data.title) : this.props.slug;

    return new Project({
      ...this.props,
      title,
      slug,
      oneLiner: mergeTranslatable(this.props.oneLiner, data.oneLiner),
      description: mergeTranslatable(this.props.description, data.description),
      motivation: mergeTranslatable(this.props.motivation, data.motivation),
      role: mergeTranslatable(this.props.role, data.role),
      body:
        data.body === undefined
          ? this.props.body
          : data.body === null
            ? null
            : mergeTranslatable(this.props.body ?? { en: '', vi: '' }, data.body),
      startDate: data.startDate ?? this.props.startDate,
      endDate: data.endDate !== undefined ? data.endDate : this.props.endDate,
      status: data.status ?? this.props.status,
      lifecycleStatus: data.lifecycleStatus ?? this.props.lifecycleStatus,
      links: data.links !== undefined ? Project.normalizeLinks(data.links) : this.props.links,
      thumbnailId: data.thumbnailId !== undefined ? data.thumbnailId : this.props.thumbnailId,
      featured: data.featured ?? this.props.featured,
      displayOrder: data.displayOrder ?? this.props.displayOrder,
      ...BaseCrudEntity.updateTimestamp(userId),
    });
  }

  /** Set the body rich-text triple atomically (RTE write path, task 311). */
  withBodyRichText(
    rich: { json: TranslatableRichText; html: TranslatableJson; schemaVersion: number },
    userId: string
  ): Project {
    return new Project({
      ...this.props,
      bodyJson: rich.json,
      bodyHtml: rich.html,
      bodySchemaVersion: rich.schemaVersion,
      ...BaseCrudEntity.updateTimestamp(userId),
    });
  }

  softDelete(userId: string): Project {
    return new Project({
      ...this.props,
      deletedAt: new Date(),
      deletedById: userId,
      ...BaseCrudEntity.updateTimestamp(userId),
    });
  }

  restore(userId: string): Project {
    return new Project({
      ...this.props,
      deletedAt: null,
      deletedById: null,
      ...BaseCrudEntity.updateTimestamp(userId),
    });
  }

  toggleFeatured(userId: string): Project {
    return new Project({
      ...this.props,
      featured: !this.props.featured,
      ...BaseCrudEntity.updateTimestamp(userId),
    });
  }

  toProps(): IProjectProps {
    return { ...this.props };
  }
}
