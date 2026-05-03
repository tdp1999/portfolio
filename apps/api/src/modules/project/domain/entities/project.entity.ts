import { BaseCrudEntity, SlugValue, TranslatableJson } from '@portfolio/shared/types';
import { IProjectProps, ICreateProjectPayload, IUpdateProjectPayload, ContentStatus } from '../project.types';
import { ProjectLink, ProjectLinkProps } from '../value-objects';

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

  get startDate(): Date {
    return this.props.startDate;
  }

  get endDate(): Date | null {
    return this.props.endDate;
  }

  get status(): ContentStatus {
    return this.props.status;
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
      startDate: data.startDate,
      endDate: data.endDate ?? null,
      status: 'DRAFT',
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
      oneLiner: data.oneLiner ?? this.props.oneLiner,
      description: data.description ?? this.props.description,
      motivation: data.motivation ?? this.props.motivation,
      role: data.role ?? this.props.role,
      body: data.body !== undefined ? data.body : this.props.body,
      startDate: data.startDate ?? this.props.startDate,
      endDate: data.endDate !== undefined ? data.endDate : this.props.endDate,
      status: data.status ?? this.props.status,
      links: data.links !== undefined ? Project.normalizeLinks(data.links) : this.props.links,
      thumbnailId: data.thumbnailId !== undefined ? data.thumbnailId : this.props.thumbnailId,
      featured: data.featured ?? this.props.featured,
      displayOrder: data.displayOrder ?? this.props.displayOrder,
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
