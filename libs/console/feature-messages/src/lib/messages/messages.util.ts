import type { ContactMessageListItem } from '../message.types';
import { PURPOSE_OPTIONS } from './messages.data';

/** A message as one table row shows it: classes, label and unread flag computed once per load. */
export type MessageRow = ContactMessageListItem & {
  statusDotClass: string;
  purposeLabel: string;
  purposeClass: string;
  unread: boolean;
};

const STATUS_DOT_CLASSES: Record<string, string> = {
  UNREAD: 'dot-unread',
  READ: 'dot-read',
  REPLIED: 'dot-replied',
  ARCHIVED: 'dot-archived',
};

const PURPOSE_CLASSES: Record<string, string> = {
  JOB_OPPORTUNITY: 'badge-job',
  FREELANCE: 'badge-freelance',
  COLLABORATION: 'badge-collab',
  BUG_REPORT: 'badge-bug',
  PRESS: 'badge-press',
};

export function toMessageRow(message: ContactMessageListItem): MessageRow {
  return {
    ...message,
    statusDotClass: message.isSpam ? 'dot-spam' : (STATUS_DOT_CLASSES[message.status] ?? 'dot-read'),
    purposeLabel: PURPOSE_OPTIONS.find((o) => o.value === message.purpose)?.label ?? message.purpose,
    purposeClass: PURPOSE_CLASSES[message.purpose] ?? 'badge-default',
    unread: message.status === 'UNREAD' && !message.isSpam,
  };
}
