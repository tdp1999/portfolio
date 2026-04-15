import { BadRequestError, ErrorLayer, ProfileErrorCode } from '@portfolio/shared/errors';

export interface LocationProps {
  country: string;
  city: string;
  postalCode: string | null;
  address1: string | null;
  address2: string | null;
}

export class Location {
  private constructor(private readonly props: LocationProps) {
    Object.freeze(this);
  }

  static create(props: LocationProps): Location {
    if (!props.country?.trim()) {
      throw BadRequestError('country is required', {
        errorCode: ProfileErrorCode.INVALID_INPUT,
        layer: ErrorLayer.DOMAIN,
      });
    }
    if (!props.city?.trim()) {
      throw BadRequestError('city is required', {
        errorCode: ProfileErrorCode.INVALID_INPUT,
        layer: ErrorLayer.DOMAIN,
      });
    }
    return new Location({ ...props });
  }

  static fromPersistence(props: LocationProps): Location {
    return new Location({ ...props });
  }

  get country(): string {
    return this.props.country;
  }

  get city(): string {
    return this.props.city;
  }

  get postalCode(): string | null {
    return this.props.postalCode;
  }

  get address1(): string | null {
    return this.props.address1;
  }

  get address2(): string | null {
    return this.props.address2;
  }

  equals(other: Location): boolean {
    return (
      this.props.country === other.props.country &&
      this.props.city === other.props.city &&
      this.props.postalCode === other.props.postalCode &&
      this.props.address1 === other.props.address1 &&
      this.props.address2 === other.props.address2
    );
  }

  toProps(): LocationProps {
    return { ...this.props };
  }
}
