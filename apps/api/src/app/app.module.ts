import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaModule } from '../infrastructure/prisma';
import { UserModule } from '../modules/user';
import { AuthModule } from '../modules/auth';
import { EmailModule } from '../modules/email';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [PrismaModule, CqrsModule, EmailModule, UserModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
