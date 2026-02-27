import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from '../infrastructure/prisma';
import { UserModule } from '../modules/user';
import { AuthModule } from '../modules/auth';
import { EmailModule } from '../modules/email';
import { AppController } from './app.controller';
import { AppService } from './app.service';

const isProduction = process.env['NODE_ENV'] === 'production';

@Module({
  imports: [
    PrismaModule,
    CqrsModule,
    EmailModule,
    UserModule,
    AuthModule,
    ThrottlerModule.forRoot({
      skipIf: () => !isProduction,
      throttlers: [{ ttl: 60000, limit: 60 }],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
