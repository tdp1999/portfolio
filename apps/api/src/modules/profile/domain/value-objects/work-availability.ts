import { BadRequestError, ErrorLayer, ProfileErrorCode } from '@portfolio/shared/errors';
import type { OpenToValue } from '@portfolio/shared/types';
import type { Availability } from '../profile.types';

export interface WorkAvailabilityProps {
  yearsOfExperience: number;
  availability: Availability;
  openTo: OpenToValue[];
  timezones: string[];
}

export class WorkAvailability {
  private constructor(private readonly props: WorkAvailabilityProps) {
    Object.freeze(this);
  }

  static create(props: WorkAvailabilityProps): WorkAvailability {
    if (props.yearsOfExperience < 0) {
      throw BadRequestError('yearsOfExperience must be >= 0', {
        errorCode: ProfileErrorCode.INVALID_INPUT,
        layer: ErrorLayer.DOMAIN,
      });
    }
    if (!Number.isInteger(props.yearsOfExperience)) {
      throw BadRequestError('yearsOfExperience must be an integer', {
        errorCode: ProfileErrorCode.INVALID_INPUT,
        layer: ErrorLayer.DOMAIN,
      });
    }
    return new WorkAvailability({ ...props, timezones: [...props.timezones] });
  }

  static fromPersistence(props: WorkAvailabilityProps): WorkAvailability {
    return new WorkAvailability({ ...props, timezones: [...props.timezones] });
  }

  get yearsOfExperience(): number {
    return this.props.yearsOfExperience;
  }

  get availability(): Availability {
    return this.props.availability;
  }

  get openTo(): OpenToValue[] {
    return this.props.openTo;
  }

  get timezones(): string[] {
    return this.props.timezones;
  }

  get isOpenToWork(): boolean {
    return (
      this.props.availability === 'OPEN_TO_WORK' ||
      (this.props.availability === 'EMPLOYED' && this.props.openTo.length > 0)
    );
  }

  equals(other: WorkAvailability): boolean {
    return (
      this.props.yearsOfExperience === other.props.yearsOfExperience &&
      this.props.availability === other.props.availability &&
      this.props.openTo.length === other.props.openTo.length &&
      this.props.openTo.every((v, i) => v === other.props.openTo[i]) &&
      this.props.timezones.length === other.props.timezones.length &&
      this.props.timezones.every((v, i) => v === other.props.timezones[i])
    );
  }

  toProps(): WorkAvailabilityProps {
    return { ...this.props, timezones: [...this.props.timezones] };
  }
}
