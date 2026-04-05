import { BaseCrudEntity, SlugValue, TranslatableJson } from '@portfolio/shared/types';
import { IProjectProps, ICreateProjectPayload, IUpdateProjectPayload, ContentStatus } from '../project.types';

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

  get sourceUrl(): string | null {
    return this.props.sourceUrl;
  }

  get projectUrl(): string | null {
    return this.props.projectUrl;
  }

  get thumbnailId(): string | null {
    return this.props.thumbnailId;
  }

  get isPublished(): boolean {
    return this.props.status === 'PUBLISHED' && !this.isDeleted;
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
      startDate: data.startDate,
      endDate: data.endDate ?? null,
      status: 'DRAFT',
      featured: data.featured ?? false,
      displayOrder: data.displayOrder ?? 0,
      sourceUrl: data.sourceUrl ?? null,
      projectUrl: data.projectUrl ?? null,
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
      startDate: data.startDate ?? this.props.startDate,
      endDate: data.endDate !== undefined ? data.endDate : this.props.endDate,
      status: data.status ?? this.props.status,
      sourceUrl: data.sourceUrl !== undefined ? data.sourceUrl : this.props.sourceUrl,
      projectUrl: data.projectUrl !== undefined ? data.projectUrl : this.props.projectUrl,
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
