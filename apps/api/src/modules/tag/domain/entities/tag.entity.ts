import { BaseCrudEntity, SlugValue } from '@portfolio/shared/types';
import { ICreateTagPayload, ITagProps, IUpdateTagPayload } from '../tag.types';

export class Tag extends BaseCrudEntity<ITagProps> {
  private constructor(props: ITagProps) {
    super(props);
  }

  get name(): string {
    return this.props.name;
  }

  get slug(): string {
    return this.props.slug;
  }

  static create(data: ICreateTagPayload, userId: string): Tag {
    return new Tag({
      ...BaseCrudEntity.createBaseProps(userId),
      name: data.name,
      slug: SlugValue.from(data.name),
    });
  }

  static load(props: ITagProps): Tag {
    return new Tag(props);
  }

  update(data: IUpdateTagPayload, userId: string): Tag {
    return new Tag({
      ...this.props,
      name: data.name,
      slug: SlugValue.from(data.name),
      ...BaseCrudEntity.updateTimestamp(userId),
    });
  }

  softDelete(userId: string): Tag {
    return new Tag({
      ...this.props,
      deletedAt: new Date(),
      deletedById: userId,
      ...BaseCrudEntity.updateTimestamp(userId),
    });
  }

  restore(userId: string): Tag {
    return new Tag({
      ...this.props,
      deletedAt: null,
      deletedById: null,
      ...BaseCrudEntity.updateTimestamp(userId),
    });
  }

  toProps(): ITagProps {
    return { ...this.props };
  }
}
