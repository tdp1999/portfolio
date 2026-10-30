import { BaseCrudEntity } from '@portfolio/shared/types';
import { ICreateHealthProfilePayload, IHealthProfileProps } from '../medicine-cabinet.types';

export class HealthProfile extends BaseCrudEntity<IHealthProfileProps> {
  private constructor(props: IHealthProfileProps) {
    super(props);
  }

  get name(): string {
    return this.props.name;
  }

  static create(data: ICreateHealthProfilePayload, userId: string): HealthProfile {
    return new HealthProfile({
      ...BaseCrudEntity.createBaseProps(userId),
      name: data.name,
    });
  }

  static load(props: IHealthProfileProps): HealthProfile {
    return new HealthProfile(props);
  }

  rename(name: string, userId: string): HealthProfile {
    return new HealthProfile({
      ...this.props,
      name,
      ...BaseCrudEntity.updateTimestamp(userId),
    });
  }

  softDelete(userId: string): HealthProfile {
    return new HealthProfile({
      ...this.props,
      deletedAt: new Date(),
      deletedById: userId,
      ...BaseCrudEntity.updateTimestamp(userId),
    });
  }

  toProps(): IHealthProfileProps {
    return { ...this.props };
  }
}
