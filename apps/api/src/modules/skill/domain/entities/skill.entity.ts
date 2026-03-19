import { BaseCrudEntity, SlugValue } from '@portfolio/shared/types';
import { BadRequestError } from '@portfolio/shared/errors';
import { SkillErrorCode } from '@portfolio/shared/errors';
import { ISkillProps, ICreateSkillPayload, IUpdateSkillPayload } from '../skill.types';

export class Skill extends BaseCrudEntity<ISkillProps> {
  private constructor(props: ISkillProps) {
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

  get category(): string {
    return this.props.category;
  }

  get isLibrary(): boolean {
    return this.props.isLibrary;
  }

  get parentSkillId(): string | null {
    return this.props.parentSkillId;
  }

  get yearsOfExperience(): number | null {
    return this.props.yearsOfExperience;
  }

  get iconUrl(): string | null {
    return this.props.iconUrl;
  }

  get proficiencyNote(): string | null {
    return this.props.proficiencyNote;
  }

  get isFeatured(): boolean {
    return this.props.isFeatured;
  }

  get displayOrder(): number {
    return this.props.displayOrder;
  }

  static create(data: ICreateSkillPayload, userId: string): Skill {
    return new Skill({
      ...BaseCrudEntity.createBaseProps(userId),
      name: data.name,
      slug: SlugValue.from(data.name),
      description: data.description ?? null,
      category: data.category,
      isLibrary: data.isLibrary ?? false,
      parentSkillId: null,
      yearsOfExperience: data.yearsOfExperience ?? null,
      iconUrl: data.iconUrl ?? null,
      proficiencyNote: data.proficiencyNote ?? null,
      isFeatured: data.isFeatured ?? false,
      displayOrder: data.displayOrder ?? 0,
    });
  }

  static load(props: ISkillProps): Skill {
    return new Skill(props);
  }

  update(data: IUpdateSkillPayload, userId: string): Skill {
    const name = data.name ?? this.props.name;
    const slug = data.name !== undefined ? SlugValue.from(data.name) : this.props.slug;

    return new Skill({
      ...this.props,
      name,
      slug,
      description: data.description !== undefined ? (data.description ?? null) : this.props.description,
      category: data.category ?? this.props.category,
      isLibrary: data.isLibrary ?? this.props.isLibrary,
      yearsOfExperience:
        data.yearsOfExperience !== undefined ? (data.yearsOfExperience ?? null) : this.props.yearsOfExperience,
      iconUrl: data.iconUrl !== undefined ? (data.iconUrl ?? null) : this.props.iconUrl,
      proficiencyNote: data.proficiencyNote !== undefined ? (data.proficiencyNote ?? null) : this.props.proficiencyNote,
      isFeatured: data.isFeatured ?? this.props.isFeatured,
      displayOrder: data.displayOrder ?? this.props.displayOrder,
      ...BaseCrudEntity.updateTimestamp(userId),
    });
  }

  assignParent(parentId: string, parentHasParent: boolean): Skill {
    if (parentId === this.id) {
      throw BadRequestError('Cannot assign skill as its own parent', {
        errorCode: SkillErrorCode.CIRCULAR_REFERENCE,
      });
    }

    if (parentHasParent) {
      throw BadRequestError('Parent skill already has a parent (max 1-level depth)', {
        errorCode: SkillErrorCode.MAX_DEPTH_EXCEEDED,
      });
    }

    return new Skill({
      ...this.props,
      parentSkillId: parentId,
    });
  }

  removeParent(): Skill {
    return new Skill({
      ...this.props,
      parentSkillId: null,
    });
  }

  softDelete(userId: string): Skill {
    return new Skill({
      ...this.props,
      deletedAt: new Date(),
      deletedById: userId,
      ...BaseCrudEntity.updateTimestamp(userId),
    });
  }

  restore(userId: string): Skill {
    return new Skill({
      ...this.props,
      deletedAt: null,
      deletedById: null,
      ...BaseCrudEntity.updateTimestamp(userId),
    });
  }

  toProps(): ISkillProps {
    return { ...this.props };
  }
}
