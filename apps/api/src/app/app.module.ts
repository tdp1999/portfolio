import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaModule } from '../infrastructure/prisma/prisma.module';
import { UserModule } from '../modules/user';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [PrismaModule, CqrsModule, UserModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
