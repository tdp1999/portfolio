import { IdentifierValue } from '../value-objects/identifier.value';
import { TemporalValue } from '../value-objects/temporal.value';

export interface IBaseAuditProps {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  createdById: string;
  updatedById: string;
  deletedAt: Date | null;
  deletedById: string | null;
}

export interface IBaseCreateInput {
  createdById: string;
}

export abstract class BaseCrudEntity<TProps extends IBaseAuditProps> {
  protected constructor(readonly props: TProps) {}

  get id(): string {
    return this.props.id;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get createdById(): string {
    return this.props.createdById;
  }

  get updatedById(): string {
    return this.props.updatedById;
  }

  get deletedAt(): Date | null {
    return this.props.deletedAt;
  }

  get deletedById(): string | null {
    return this.props.deletedById;
  }

  get isDeleted(): boolean {
    return this.props.deletedAt !== null;
  }

  protected static createBaseProps(userId: string): IBaseAuditProps {
    const now = TemporalValue.now();
    return {
      id: IdentifierValue.v7(),
      createdAt: now,
      updatedAt: now,
      createdById: userId,
      updatedById: userId,
      deletedAt: null,
      deletedById: null,
    };
  }

  protected static updateTimestamp(userId: string): Pick<IBaseAuditProps, 'updatedAt' | 'updatedById'> {
    return {
      updatedAt: TemporalValue.now(),
      updatedById: userId,
    };
  }
}
