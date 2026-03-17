import { BaseCrudEntity, SlugValue } from '@portfolio/shared/types';
import { ICategoryProps, ICreateCategoryPayload, IUpdateCategoryPayload } from '../category.types';

export class Category extends BaseCrudEntity<ICategoryProps> {
  private constructor(props: ICategoryProps) {
    super(props);
  }

  get name(): string {
    return this.props.name;
  }

  get slug(): string {
    return this.props.slug;
  }

  get description(): string | null {
    return this.props.description;
  }

  get displayOrder(): number {
    return this.props.displayOrder;
  }

  static create(data: ICreateCategoryPayload, userId: string): Category {
    return new Category({
      ...BaseCrudEntity.createBaseProps(userId),
      name: data.name,
      slug: SlugValue.from(data.name),
      description: data.description ?? null,
      displayOrder: data.displayOrder ?? 0,
    });
  }

  static load(props: ICategoryProps): Category {
    return new Category(props);
  }

  update(data: IUpdateCategoryPayload, userId: string): Category {
    const name = data.name ?? this.props.name;
    const slug = data.name !== undefined ? SlugValue.from(data.name) : this.props.slug;

    return new Category({
      ...this.props,
      name,
      slug,
      description: data.description !== undefined ? (data.description ?? null) : this.props.description,
      displayOrder: data.displayOrder ?? this.props.displayOrder,
      ...BaseCrudEntity.updateTimestamp(userId),
    });
  }

  softDelete(userId: string): Category {
    return new Category({
      ...this.props,
      deletedAt: new Date(),
      deletedById: userId,
      ...BaseCrudEntity.updateTimestamp(userId),
    });
  }

  restore(userId: string): Category {
    return new Category({
      ...this.props,
      deletedAt: null,
      deletedById: null,
      ...BaseCrudEntity.updateTimestamp(userId),
    });
  }

  toProps(): ICategoryProps {
    return { ...this.props };
  }
}
