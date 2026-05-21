import { BadRequestError, ErrorLayer, ProfileErrorCode } from '@portfolio/shared/errors';
import type { SocialPlatform } from '@portfolio/shared/types';

export interface ContactProps {
  email: string;
  phone: string | null;
  /** Zalo is a phone number (not a URL), surfaced as a public contact channel on `/contact`. */
  phoneZalo: string | null;
  preferredContactPlatform: SocialPlatform;
  preferredContactValue: string;
}

export class Contact {
  private constructor(private readonly props: ContactProps) {
    Object.freeze(this);
  }

  static create(props: ContactProps): Contact {
    if (!props.email?.trim()) {
      throw BadRequestError('email is required', {
        errorCode: ProfileErrorCode.INVALID_INPUT,
        layer: ErrorLayer.DOMAIN,
      });
    }
    if (!props.preferredContactValue?.trim()) {
      throw BadRequestError('preferredContactValue is required', {
        errorCode: ProfileErrorCode.INVALID_INPUT,
        layer: ErrorLayer.DOMAIN,
      });
    }
    return new Contact({ ...props });
  }

  static fromPersistence(props: ContactProps): Contact {
    return new Contact({ ...props });
  }

  get email(): string {
    return this.props.email;
  }

  get phone(): string | null {
    return this.props.phone;
  }

  get phoneZalo(): string | null {
    return this.props.phoneZalo;
  }

  get preferredContactPlatform(): SocialPlatform {
    return this.props.preferredContactPlatform;
  }

  get preferredContactValue(): string {
    return this.props.preferredContactValue;
  }

  equals(other: Contact): boolean {
    return (
      this.props.email === other.props.email &&
      this.props.phone === other.props.phone &&
      this.props.phoneZalo === other.props.phoneZalo &&
      this.props.preferredContactPlatform === other.props.preferredContactPlatform &&
      this.props.preferredContactValue === other.props.preferredContactValue
    );
  }

  toProps(): ContactProps {
    return { ...this.props };
  }
}
