import { BadRequestError, ErrorLayer, ProfileErrorCode } from '@portfolio/shared/errors';
import type { OpenToValue } from '@portfolio/shared/types';
import type { Availability } from '../profile.types';
import { WorkingHours, type WorkingHoursProps } from './working-hours';

export interface WorkAvailabilityProps {
  yearsOfExperience: number;
  availability: Availability;
  openTo: OpenToValue[];
  timezones: string[];
  workingHours: WorkingHoursProps | null;
}

export class WorkAvailability {
  private readonly workingHoursVo: WorkingHours | null;

  private constructor(private readonly props: WorkAvailabilityProps) {
    this.workingHoursVo = props.workingHours ? WorkingHours.fromPersistence(props.workingHours) : null;
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
    // Run WorkingHours validation when present so invalid persistence input is rejected at create time.
    const workingHours = props.workingHours ? WorkingHours.create(props.workingHours).toProps() : null;
    return new WorkAvailability({ ...props, timezones: [...props.timezones], workingHours });
  }

  static fromPersistence(props: WorkAvailabilityProps): WorkAvailability {
    return new WorkAvailability({
      ...props,
      timezones: [...props.timezones],
      workingHours: props.workingHours ? { ...props.workingHours } : null,
    });
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

  get workingHours(): WorkingHours | null {
    return this.workingHoursVo;
  }

  get isOpenToWork(): boolean {
    return (
      this.props.availability === 'OPEN_TO_WORK' ||
      (this.props.availability === 'EMPLOYED' && this.props.openTo.length > 0)
    );
  }

  equals(other: WorkAvailability): boolean {
    const wh = this.props.workingHours;
    const ow = other.props.workingHours;
    const workingHoursEqual = wh === ow || (!!wh && !!ow && wh.start === ow.start && wh.end === ow.end);
    return (
      this.props.yearsOfExperience === other.props.yearsOfExperience &&
      this.props.availability === other.props.availability &&
      this.props.openTo.length === other.props.openTo.length &&
      this.props.openTo.every((v, i) => v === other.props.openTo[i]) &&
      this.props.timezones.length === other.props.timezones.length &&
      this.props.timezones.every((v, i) => v === other.props.timezones[i]) &&
      workingHoursEqual
    );
  }

  toProps(): WorkAvailabilityProps {
    return {
      ...this.props,
      timezones: [...this.props.timezones],
      workingHours: this.props.workingHours ? { ...this.props.workingHours } : null,
    };
  }
}
