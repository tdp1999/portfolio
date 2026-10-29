import { BaseCrudEntity } from '@portfolio/shared/types';
import type { MedicalItemKind } from '@portfolio/shared/types';
import { ICreateMedicalItemPayload, IMedicalItemProps, IUpdateMedicalItemPayload } from '../medicine-cabinet.types';

export class MedicalItem extends BaseCrudEntity<IMedicalItemProps> {
  private constructor(props: IMedicalItemProps) {
    super(props);
  }

  get profileId(): string {
    return this.props.profileId;
  }

  get kind(): MedicalItemKind {
    return this.props.kind;
  }

  get name(): string {
    return this.props.name;
  }

  get dose(): string | null {
    return this.props.dose;
  }

  static create(data: ICreateMedicalItemPayload, userId: string): MedicalItem {
    return new MedicalItem({
      ...BaseCrudEntity.createBaseProps(userId),
      ...data,
    });
  }

  static load(props: IMedicalItemProps): MedicalItem {
    return new MedicalItem(props);
  }

  /** `kind` is not accepted: it cannot change after creation (R2.4). */
  update(data: IUpdateMedicalItemPayload, userId: string): MedicalItem {
    return new MedicalItem({
      ...this.props,
      ...data,
      ...BaseCrudEntity.updateTimestamp(userId),
    });
  }

  softDelete(userId: string): MedicalItem {
    return new MedicalItem({
      ...this.props,
      deletedAt: new Date(),
      deletedById: userId,
      ...BaseCrudEntity.updateTimestamp(userId),
    });
  }

  toProps(): IMedicalItemProps {
    return { ...this.props };
  }
}
