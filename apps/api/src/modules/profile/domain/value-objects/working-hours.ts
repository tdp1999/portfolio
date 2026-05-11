import { BadRequestError, ErrorLayer, ProfileErrorCode } from '@portfolio/shared/errors';

export interface WorkingHoursProps {
  start: string;
  end: string;
}

const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export class WorkingHours {
  private constructor(private readonly props: WorkingHoursProps) {
    Object.freeze(this);
  }

  static create(props: WorkingHoursProps): WorkingHours {
    if (!HHMM.test(props.start)) {
      throw BadRequestError('workingHours.start must be HH:mm (00:00–23:59)', {
        errorCode: ProfileErrorCode.INVALID_INPUT,
        layer: ErrorLayer.DOMAIN,
      });
    }
    if (!HHMM.test(props.end)) {
      throw BadRequestError('workingHours.end must be HH:mm (00:00–23:59)', {
        errorCode: ProfileErrorCode.INVALID_INPUT,
        layer: ErrorLayer.DOMAIN,
      });
    }
    if (toMinutes(props.end) <= toMinutes(props.start)) {
      throw BadRequestError('workingHours.end must be after workingHours.start', {
        errorCode: ProfileErrorCode.INVALID_INPUT,
        layer: ErrorLayer.DOMAIN,
      });
    }
    return new WorkingHours({ ...props });
  }

  static fromPersistence(props: WorkingHoursProps): WorkingHours {
    return new WorkingHours({ ...props });
  }

  get start(): string {
    return this.props.start;
  }

  get end(): string {
    return this.props.end;
  }

  equals(other: WorkingHours): boolean {
    return this.props.start === other.props.start && this.props.end === other.props.end;
  }

  toJSON(): WorkingHoursProps {
    return { ...this.props };
  }

  toProps(): WorkingHoursProps {
    return { ...this.props };
  }
}
