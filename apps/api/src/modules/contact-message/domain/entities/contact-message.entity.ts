import { createHash } from 'crypto';

import { ContactMessageStatus, ContactPurpose } from '@prisma/client';

import { BadRequestError, ContactMessageErrorCode, ErrorLayer } from '@portfolio/shared/errors';
import { IdentifierValue, TemporalValue } from '@portfolio/shared/types';

import { IContactMessageProps, ICreateContactMessagePayload } from '../contact-message.types';

const TWELVE_MONTHS_MS = 365 * 24 * 60 * 60 * 1000;

export class ContactMessage {
  private constructor(private readonly props: IContactMessageProps) {}

  // --- Getters ---

  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get email(): string {
    return this.props.email;
  }

  get purpose(): ContactPurpose {
    return this.props.purpose;
  }

  get subject(): string | null {
    return this.props.subject;
  }

  get message(): string {
    return this.props.message;
  }

  get status(): ContactMessageStatus {
    return this.props.status;
  }

  get isSpam(): boolean {
    return this.props.isSpam;
  }

  get ipAddress(): string | null {
    return this.props.ipAddress;
  }

  get userAgent(): string | null {
    return this.props.userAgent;
  }

  get locale(): string {
    return this.props.locale;
  }

  get consentGivenAt(): Date {
    return this.props.consentGivenAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get readAt(): Date | null {
    return this.props.readAt;
  }

  get repliedAt(): Date | null {
    return this.props.repliedAt;
  }

  get archivedAt(): Date | null {
    return this.props.archivedAt;
  }

  get expiresAt(): Date {
    return this.props.expiresAt;
  }

  get deletedAt(): Date | null {
    return this.props.deletedAt;
  }

  get isDeleted(): boolean {
    return this.props.deletedAt !== null;
  }

  // --- Factory Methods ---

  static create(data: ICreateContactMessagePayload): ContactMessage {
    const now = TemporalValue.now();

    return new ContactMessage({
      id: IdentifierValue.v7(),
      name: data.name,
      email: data.email,
      purpose: data.purpose ?? ContactPurpose.GENERAL,
      subject: data.subject ?? null,
      message: data.message,
      status: ContactMessageStatus.UNREAD,
      isSpam: false,
      ipAddress: data.ipAddress ? hashIp(data.ipAddress) : null,
      userAgent: data.userAgent ?? null,
      locale: data.locale ?? 'en',
      consentGivenAt: data.consentGivenAt,
      createdAt: now,
      readAt: null,
      repliedAt: null,
      archivedAt: null,
      expiresAt: new Date(now.getTime() + TWELVE_MONTHS_MS),
      deletedAt: null,
    });
  }

  static load(props: IContactMessageProps): ContactMessage {
    return new ContactMessage(props);
  }

  // --- Status Transitions ---

  markAsRead(): ContactMessage {
    return new ContactMessage({
      ...this.props,
      status: ContactMessageStatus.READ,
      readAt: TemporalValue.now(),
    });
  }

  markAsUnread(): ContactMessage {
    return new ContactMessage({
      ...this.props,
      status: ContactMessageStatus.UNREAD,
      readAt: null,
    });
  }

  setReplied(): ContactMessage {
    if (this.props.status !== ContactMessageStatus.READ) {
      throw BadRequestError('Cannot reply to a message that has not been read', {
        errorCode: ContactMessageErrorCode.INVALID_TRANSITION,
        layer: ErrorLayer.DOMAIN,
      });
    }

    return new ContactMessage({
      ...this.props,
      status: ContactMessageStatus.REPLIED,
      repliedAt: TemporalValue.now(),
    });
  }

  archive(): ContactMessage {
    if (this.props.status === ContactMessageStatus.ARCHIVED) {
      throw BadRequestError('Message is already archived', {
        errorCode: ContactMessageErrorCode.ALREADY_ARCHIVED,
        layer: ErrorLayer.DOMAIN,
      });
    }

    return new ContactMessage({
      ...this.props,
      status: ContactMessageStatus.ARCHIVED,
      archivedAt: TemporalValue.now(),
    });
  }

  softDelete(): ContactMessage {
    if (this.props.deletedAt !== null) {
      throw BadRequestError('Message is already deleted', {
        errorCode: ContactMessageErrorCode.ALREADY_DELETED,
        layer: ErrorLayer.DOMAIN,
      });
    }

    return new ContactMessage({
      ...this.props,
      deletedAt: TemporalValue.now(),
    });
  }

  restore(): ContactMessage {
    if (this.props.deletedAt === null) {
      throw BadRequestError('Message is not deleted', {
        errorCode: ContactMessageErrorCode.INVALID_TRANSITION,
        layer: ErrorLayer.DOMAIN,
      });
    }

    return new ContactMessage({
      ...this.props,
      deletedAt: null,
    });
  }

  markAsSpam(): ContactMessage {
    return new ContactMessage({
      ...this.props,
      isSpam: true,
    });
  }

  clearSpam(): ContactMessage {
    return new ContactMessage({
      ...this.props,
      isSpam: false,
    });
  }

  toProps(): IContactMessageProps {
    return { ...this.props };
  }
}

function hashIp(ip: string): string {
  return createHash('sha256').update(ip).digest('hex');
}
