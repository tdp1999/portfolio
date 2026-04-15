import { BadRequestError, ErrorLayer, ProfileErrorCode } from '@portfolio/shared/errors';
import type { TranslatableJson } from '@portfolio/shared/types';

export interface IdentityProps {
  fullName: TranslatableJson;
  title: TranslatableJson;
  bioShort: TranslatableJson;
  bioLong: TranslatableJson | null;
  avatarId: string | null;
}

export class Identity {
  private constructor(private readonly props: IdentityProps) {
    Object.freeze(this);
  }

  static create(props: IdentityProps): Identity {
    if (!props.fullName.en?.trim()) {
      throw BadRequestError('fullName.en is required', {
        errorCode: ProfileErrorCode.INVALID_INPUT,
        layer: ErrorLayer.DOMAIN,
      });
    }
    if (!props.title.en?.trim()) {
      throw BadRequestError('title.en is required', {
        errorCode: ProfileErrorCode.INVALID_INPUT,
        layer: ErrorLayer.DOMAIN,
      });
    }
    if (!props.bioShort.en?.trim()) {
      throw BadRequestError('bioShort.en is required', {
        errorCode: ProfileErrorCode.INVALID_INPUT,
        layer: ErrorLayer.DOMAIN,
      });
    }
    return new Identity({ ...props });
  }

  static fromPersistence(props: IdentityProps): Identity {
    return new Identity({ ...props });
  }

  get fullName(): TranslatableJson {
    return this.props.fullName;
  }

  get title(): TranslatableJson {
    return this.props.title;
  }

  get bioShort(): TranslatableJson {
    return this.props.bioShort;
  }

  get bioLong(): TranslatableJson | null {
    return this.props.bioLong;
  }

  get avatarId(): string | null {
    return this.props.avatarId;
  }

  equals(other: Identity): boolean {
    return (
      this.props.fullName.en === other.props.fullName.en &&
      this.props.fullName.vi === other.props.fullName.vi &&
      this.props.title.en === other.props.title.en &&
      this.props.title.vi === other.props.title.vi &&
      this.props.bioShort.en === other.props.bioShort.en &&
      this.props.bioShort.vi === other.props.bioShort.vi &&
      this.props.bioLong?.en === other.props.bioLong?.en &&
      this.props.bioLong?.vi === other.props.bioLong?.vi &&
      this.props.avatarId === other.props.avatarId
    );
  }

  toProps(): IdentityProps {
    return { ...this.props };
  }
}
