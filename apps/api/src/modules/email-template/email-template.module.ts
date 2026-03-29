import { Global, Module } from '@nestjs/common';

import { EMAIL_TEMPLATE_REPOSITORY } from './application/email-template.token';
import { HardcodedEmailTemplateRepository } from './infrastructure/repositories/hardcoded-email-template.repository';

@Global()
@Module({
  providers: [
    {
      provide: EMAIL_TEMPLATE_REPOSITORY,
      useClass: HardcodedEmailTemplateRepository,
    },
  ],
  exports: [EMAIL_TEMPLATE_REPOSITORY],
})
export class EmailTemplateModule {}
