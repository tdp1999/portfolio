import { Module, forwardRef } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { AuthModule } from '../auth';
import { UserModule } from '../user';
import { EmailModule } from '../email';
import { EmailTemplateModule } from '../email-template';

import { CONTACT_MESSAGE_REPOSITORY } from './application/contact-message.token';
import {
  SubmitContactMessageHandler,
  MarkAsReadHandler,
  MarkAsUnreadHandler,
  SetRepliedHandler,
  ArchiveMessageHandler,
  SoftDeleteMessageHandler,
  RestoreMessageHandler,
  PurgeExpiredMessagesHandler,
} from './application/commands';
import { ListMessagesHandler, GetMessageByIdHandler, GetUnreadCountHandler } from './application/queries';
import { MessagePurgeJob } from './application/jobs/message-purge.job';
import { ContactMessageRepository } from './infrastructure/repositories/contact-message.repository';
import { ContactMessageController } from './presentation/contact-message.controller';

const CommandHandlers = [
  SubmitContactMessageHandler,
  MarkAsReadHandler,
  MarkAsUnreadHandler,
  SetRepliedHandler,
  ArchiveMessageHandler,
  SoftDeleteMessageHandler,
  RestoreMessageHandler,
  PurgeExpiredMessagesHandler,
];

const QueryHandlers = [ListMessagesHandler, GetMessageByIdHandler, GetUnreadCountHandler];

@Module({
  imports: [CqrsModule, forwardRef(() => AuthModule), forwardRef(() => UserModule), EmailModule, EmailTemplateModule],
  controllers: [ContactMessageController],
  providers: [
    {
      provide: CONTACT_MESSAGE_REPOSITORY,
      useClass: ContactMessageRepository,
    },
    ...CommandHandlers,
    ...QueryHandlers,
    MessagePurgeJob,
  ],
  exports: [CONTACT_MESSAGE_REPOSITORY],
})
export class ContactMessageModule {}
