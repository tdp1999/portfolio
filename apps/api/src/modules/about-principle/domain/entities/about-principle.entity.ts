import { BadRequestError, ErrorLayer, AboutPrincipleErrorCode } from '@portfolio/shared/errors';
import { IdentifierValue } from '@portfolio/shared/types';
import { PrincipleClaim } from '../value-objects/principle-claim.value';
import { PrincipleExpansion } from '../value-objects/principle-expansion.value';
import {
  IAboutPrincipleProps,
  ICreateAboutPrinciplePayload,
  IUpdateAboutPrinciplePayload,
} from '../about-principle.types';

export class AboutPrinciple {
  private constructor(private readonly props: IAboutPrincipleProps) {
    Object.freeze(this);
  }

  get id(): string {
    return this.props.id;
  }

  get order(): number {
    return this.props.order;
  }

  get claim(): PrincipleClaim {
    return PrincipleClaim.fromPersistence(this.props.claim);
  }

  get expansion(): PrincipleExpansion {
    return PrincipleExpansion.fromPersistence(this.props.expansion);
  }

  get isPublished(): boolean {
    return this.props.isPublished;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  static create(data: ICreateAboutPrinciplePayload): AboutPrinciple {
    const order = data.order ?? 0;
    AboutPrinciple.assertOrder(order);

    const claim = PrincipleClaim.create(data.claim);
    const expansion = PrincipleExpansion.create(data.expansion);

    const now = new Date();
    return new AboutPrinciple({
      id: IdentifierValue.v7(),
      order,
      claim: claim.toProps(),
      expansion: expansion.toProps(),
      isPublished: data.isPublished ?? true,
      createdAt: now,
      updatedAt: now,
    });
  }

  static load(props: IAboutPrincipleProps): AboutPrinciple {
    return new AboutPrinciple(props);
  }

  update(data: IUpdateAboutPrinciplePayload): AboutPrinciple {
    const nextOrder = data.order ?? this.props.order;
    AboutPrinciple.assertOrder(nextOrder);

    const nextClaim = data.claim ? PrincipleClaim.create(data.claim).toProps() : this.props.claim;
    const nextExpansion = data.expansion ? PrincipleExpansion.create(data.expansion).toProps() : this.props.expansion;

    return new AboutPrinciple({
      ...this.props,
      order: nextOrder,
      claim: nextClaim,
      expansion: nextExpansion,
      isPublished: data.isPublished ?? this.props.isPublished,
      updatedAt: new Date(),
    });
  }

  withOrder(order: number): AboutPrinciple {
    AboutPrinciple.assertOrder(order);
    if (order === this.props.order) return this;
    return new AboutPrinciple({ ...this.props, order, updatedAt: new Date() });
  }

  private static assertOrder(order: number): void {
    if (!Number.isInteger(order) || order < 0) {
      throw BadRequestError('order must be a non-negative integer', {
        errorCode: AboutPrincipleErrorCode.INVALID_INPUT,
        layer: ErrorLayer.DOMAIN,
      });
    }
  }

  toProps(): IAboutPrincipleProps {
    return { ...this.props };
  }
}
