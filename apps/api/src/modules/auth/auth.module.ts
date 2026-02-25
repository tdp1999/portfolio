import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { CqrsModule } from '@nestjs/cqrs';
import { UserModule } from '../user';
import { AUTH_CONFIG, authConfigFactory } from './application/auth.config';
import { TokenService } from './application/services/token.service';
import { JwtAccessGuard } from './application/guards/jwt-access.guard';

@Module({
  imports: [CqrsModule, JwtModule.register({}), UserModule],
  providers: [
    {
      provide: AUTH_CONFIG,
      useValue: authConfigFactory,
    },
    TokenService,
    JwtAccessGuard,
  ],
  exports: [TokenService, JwtAccessGuard],
})
export class AuthModule {}
