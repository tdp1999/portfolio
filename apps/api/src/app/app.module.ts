import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from '../infrastructure/prisma';
import { UserModule } from '../modules/user';
import { AuthModule } from '../modules/auth';
import { EmailModule } from '../modules/email';
import { EmailTemplateModule } from '../modules/email-template';
import { HealthModule } from '../modules/health';
import { TagModule } from '../modules/tag';
import { CategoryModule } from '../modules/category';
import { SkillModule } from '../modules/skill/skill.module';
import { MediaModule } from '../modules/media/media.module';
import { ContactMessageModule } from '../modules/contact-message';
import { ProfileModule } from '../modules/profile';
import { ExperienceModule } from '../modules/experience';
import { ProjectModule } from '../modules/project';
import { AppController } from './app.controller';
import { AppService } from './app.service';

const isProduction = process.env['NODE_ENV'] === 'production';

@Module({
  imports: [
    PrismaModule,
    CqrsModule,
    ScheduleModule.forRoot(),
    EmailModule,
    EmailTemplateModule,
    UserModule,
    AuthModule,
    HealthModule,
    TagModule,
    CategoryModule,
    SkillModule,
    MediaModule,
    ContactMessageModule,
    ProfileModule,
    ExperienceModule,
    ProjectModule,
    ThrottlerModule.forRoot({
      skipIf: () => !isProduction,
      throttlers: [{ ttl: 60000, limit: 60 }],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
