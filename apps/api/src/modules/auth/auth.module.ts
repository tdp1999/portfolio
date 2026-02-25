import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { CqrsModule } from '@nestjs/cqrs';
import { PassportModule } from '@nestjs/passport';
import { UserModule } from '../user';
import { EmailModule } from '../email';
import { AUTH_CONFIG, authConfigFactory } from './application/auth.config';
import { TokenService } from './application/services/token.service';
import { JwtAccessGuard } from './application/guards/jwt-access.guard';
import { CsrfGuard } from './application/guards/csrf.guard';
import { AuthCookieService } from './application/services/auth-cookie.service';
import { GoogleStrategy } from './infrastructure/strategies/google.strategy';
import { LoginHandler } from './application/commands/login.command';
import { GoogleLoginHandler } from './application/commands/google-login.command';
import { LogoutHandler } from './application/commands/logout.command';
import { LogoutAllHandler } from './application/commands/logout-all.command';
import { RefreshTokenHandler } from './application/commands/refresh-token.command';
import { ChangePasswordHandler } from './application/commands/change-password.command';
import { ForgotPasswordHandler } from './application/commands/forgot-password.command';
import { ResetPasswordHandler } from './application/commands/reset-password.command';
import { GetCurrentUserHandler } from './application/queries/get-current-user.query';
import { GoogleOAuthGuard } from './application/guards/google-oauth.guard';
import { AuthController } from './presentation/auth.controller';

const CommandHandlers = [
  LoginHandler,
  GoogleLoginHandler,
  LogoutHandler,
  LogoutAllHandler,
  RefreshTokenHandler,
  ChangePasswordHandler,
  ForgotPasswordHandler,
  ResetPasswordHandler,
];
const QueryHandlers = [GetCurrentUserHandler];

@Module({
  imports: [CqrsModule, JwtModule.register({}), PassportModule, UserModule, EmailModule],
  controllers: [AuthController],
  providers: [
    {
      provide: AUTH_CONFIG,
      useValue: authConfigFactory,
    },
    TokenService,
    JwtAccessGuard,
    CsrfGuard,
    AuthCookieService,
    GoogleStrategy,
    GoogleOAuthGuard,
    ...CommandHandlers,
    ...QueryHandlers,
  ],
  exports: [TokenService, JwtAccessGuard],
})
export class AuthModule {}
