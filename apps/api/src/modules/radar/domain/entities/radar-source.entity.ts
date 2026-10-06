import { RadarPlatform } from '@prisma/client';

import { BadRequestError, ErrorLayer, RadarErrorCode } from '@portfolio/shared/errors';
import { IdentifierValue, TemporalValue } from '@portfolio/shared/types';

export interface RadarSourceProps {
  id: string;
  platform: RadarPlatform;
  url: string;
  displayName: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRadarSourcePayload {
  platform: RadarPlatform;
  url: string;
  displayName: string;
}

/** A page Radar follows. Deactivating keeps it and its items; it only blocks new captures. */
export class RadarSource {
  private constructor(private readonly props: RadarSourceProps) {}

  // --- Factory Methods ---

  static create(data: CreateRadarSourcePayload): RadarSource {
    const now = TemporalValue.now();
    return new RadarSource({ id: IdentifierValue.v7(), ...data, isActive: true, createdAt: now, updatedAt: now });
  }

  static load(props: RadarSourceProps): RadarSource {
    return new RadarSource(props);
  }

  // --- Getters ---

  get id(): string {
    return this.props.id;
  }

  get platform(): RadarPlatform {
    return this.props.platform;
  }

  get url(): string {
    return this.props.url;
  }

  get displayName(): string {
    return this.props.displayName;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // --- Rules ---

  setActive(isActive: boolean): RadarSource {
    return new RadarSource({ ...this.props, isActive });
  }

  /** A run or an upload brings new items; a paused source takes none. */
  ensureCanCapture(): void {
    if (!this.props.isActive) {
      throw BadRequestError('Radar source is inactive', {
        errorCode: RadarErrorCode.SOURCE_INACTIVE,
        layer: ErrorLayer.DOMAIN,
      });
    }
  }

  toProps(): RadarSourceProps {
    return { ...this.props };
  }
}
