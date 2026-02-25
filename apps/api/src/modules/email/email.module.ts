import { Global, Module } from '@nestjs/common';

import { EMAIL_SERVICE } from './application/email.token';
import { ResendEmailService } from './infrastructure/resend-email.service';

@Global()
@Module({
  providers: [
    {
      provide: EMAIL_SERVICE,
      useClass: ResendEmailService,
    },
  ],
  exports: [EMAIL_SERVICE],
})
export class EmailModule {}
