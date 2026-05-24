import { BadRequestError, ErrorLayer, AboutFailureErrorCode } from '@portfolio/shared/errors';
import { IdentifierValue } from '@portfolio/shared/types';
import { FailureContext } from '../value-objects/failure-context.value';
import { FailureNarrative } from '../value-objects/failure-narrative.value';
import { FailureYear } from '../value-objects/failure-year.value';
import { IAboutFailureProps, ICreateAboutFailurePayload, IUpdateAboutFailurePayload } from '../about-failure.types';

export class AboutFailure {
  private constructor(private readonly props: IAboutFailureProps) {
    Object.freeze(this);
  }

  get id(): string {
    return this.props.id;
  }

  get order(): number {
    return this.props.order;
  }

  get year(): number {
    return this.props.year;
  }

  get context(): FailureContext {
    return FailureContext.fromPersistence(this.props.context);
  }

  get decision(): FailureNarrative {
    return FailureNarrative.fromPersistence(this.props.decision, 'decision');
  }

  get consequence(): FailureNarrative {
    return FailureNarrative.fromPersistence(this.props.consequence, 'consequence');
  }

  get lesson(): FailureNarrative {
    return FailureNarrative.fromPersistence(this.props.lesson, 'lesson');
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

  static create(data: ICreateAboutFailurePayload): AboutFailure {
    const order = data.order ?? 0;
    AboutFailure.assertOrder(order);

    const year = FailureYear.create(data.year).value;
    const context = FailureContext.create(data.context);
    const decision = FailureNarrative.create(data.decision, 'decision');
    const consequence = FailureNarrative.create(data.consequence, 'consequence');
    const lesson = FailureNarrative.create(data.lesson, 'lesson');

    const now = new Date();
    return new AboutFailure({
      id: IdentifierValue.v7(),
      order,
      year,
      context: context.toProps(),
      decision: decision.toProps(),
      consequence: consequence.toProps(),
      lesson: lesson.toProps(),
      isPublished: data.isPublished ?? true,
      createdAt: now,
      updatedAt: now,
    });
  }

  static load(props: IAboutFailureProps): AboutFailure {
    return new AboutFailure(props);
  }

  update(data: IUpdateAboutFailurePayload): AboutFailure {
    const nextOrder = data.order ?? this.props.order;
    AboutFailure.assertOrder(nextOrder);

    const nextYear = data.year !== undefined ? FailureYear.create(data.year).value : this.props.year;
    const nextContext = data.context ? FailureContext.create(data.context).toProps() : this.props.context;
    const nextDecision = data.decision
      ? FailureNarrative.create(data.decision, 'decision').toProps()
      : this.props.decision;
    const nextConsequence = data.consequence
      ? FailureNarrative.create(data.consequence, 'consequence').toProps()
      : this.props.consequence;
    const nextLesson = data.lesson ? FailureNarrative.create(data.lesson, 'lesson').toProps() : this.props.lesson;

    return new AboutFailure({
      ...this.props,
      order: nextOrder,
      year: nextYear,
      context: nextContext,
      decision: nextDecision,
      consequence: nextConsequence,
      lesson: nextLesson,
      isPublished: data.isPublished ?? this.props.isPublished,
      updatedAt: new Date(),
    });
  }

  withOrder(order: number): AboutFailure {
    AboutFailure.assertOrder(order);
    if (order === this.props.order) return this;
    return new AboutFailure({ ...this.props, order, updatedAt: new Date() });
  }

  private static assertOrder(order: number): void {
    if (!Number.isInteger(order) || order < 0) {
      throw BadRequestError('order must be a non-negative integer', {
        errorCode: AboutFailureErrorCode.INVALID_INPUT,
        layer: ErrorLayer.DOMAIN,
      });
    }
  }

  toProps(): IAboutFailureProps {
    return { ...this.props };
  }
}
