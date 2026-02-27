import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Body,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Request, Response } from 'express';
import { LoginCommand, LoginResult } from '../application/commands/login.command';
import {
  GoogleLoginCommand,
  GoogleLoginResult,
} from '../application/commands/google-login.command';
import { LogoutCommand } from '../application/commands/logout.command';
import { LogoutAllCommand } from '../application/commands/logout-all.command';
import { ChangePasswordCommand } from '../application/commands/change-password.command';
import { ForgotPasswordCommand } from '../application/commands/forgot-password.command';
import { ResetPasswordCommand } from '../application/commands/reset-password.command';
import {
  RefreshTokenCommand,
  RefreshTokenResult,
} from '../application/commands/refresh-token.command';
import { GetCurrentUserQuery } from '../application/queries/get-current-user.query';
import { JwtAccessGuard } from '../application/guards/jwt-access.guard';
import { CsrfGuard } from '../application/guards/csrf.guard';
import { GoogleOAuthGuard } from '../application/guards/google-oauth.guard';
import { AuthCookieService } from '../application/services/auth-cookie.service';

interface AuthenticatedRequest extends Request {
  user?: { id: string };
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly cookieService: AuthCookieService
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async login(@Body() body: unknown, @Res({ passthrough: true }) res: Response) {
    const result: LoginResult = await this.commandBus.execute(new LoginCommand(body));
    this.cookieService.setRefreshToken(res, result.refreshToken, result.rememberMe);
    this.cookieService.setCsrfToken(res);
    return { accessToken: result.accessToken };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(CsrfGuard)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.['refresh_token'] ?? null;

    const result: RefreshTokenResult = await this.commandBus.execute(
      new RefreshTokenCommand(refreshToken)
    );
    // rememberMe=true: if the user had a session-only cookie, it wouldn't survive
    // browser close, so reaching /refresh implies the cookie was persistent.
    this.cookieService.setRefreshToken(res, result.refreshToken, true);
    this.cookieService.setCsrfToken(res);
    return { accessToken: result.accessToken };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAccessGuard)
  async logout(@Req() req: AuthenticatedRequest, @Res({ passthrough: true }) res: Response) {
    const user = req.user as { id: string };
    await this.commandBus.execute(new LogoutCommand(user.id));
    this.cookieService.clearRefreshToken(res);
    this.cookieService.clearCsrfToken(res);
    return { success: true };
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAccessGuard)
  async logoutAll(@Req() req: AuthenticatedRequest, @Res({ passthrough: true }) res: Response) {
    const user = req.user as { id: string };
    await this.commandBus.execute(new LogoutAllCommand(user.id));
    this.cookieService.clearRefreshToken(res);
    this.cookieService.clearCsrfToken(res);
    return { success: true };
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAccessGuard)
  async changePassword(@Req() req: AuthenticatedRequest, @Body() body: unknown) {
    const user = req.user as { id: string };
    await this.commandBus.execute(new ChangePasswordCommand(user.id, body));
    return { success: true };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() body: unknown) {
    await this.commandBus.execute(new ForgotPasswordCommand(body));
    return { success: true };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() body: unknown) {
    await this.commandBus.execute(new ResetPasswordCommand(body));
    return { success: true };
  }

  @Get('google')
  @UseGuards(GoogleOAuthGuard)
  async googleLogin() {
    // Guard redirects to Google consent screen
  }

  @Get('google/callback')
  @UseGuards(GoogleOAuthGuard)
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const profile = req.user as { email: string; name: string; googleId: string };
    const result: GoogleLoginResult = await this.commandBus.execute(
      new GoogleLoginCommand(profile)
    );
    this.cookieService.setRefreshToken(res, result.refreshToken, true);
    this.cookieService.setCsrfToken(res);
    const frontendUrl = process.env['FRONTEND_URL'] || 'http://localhost:4200';
    res.redirect(`${frontendUrl}/auth/callback#token=${result.accessToken}`);
  }

  @Get('me')
  @UseGuards(JwtAccessGuard)
  async me(@Req() req: AuthenticatedRequest) {
    const user = req.user as { id: string };
    return await this.queryBus.execute(new GetCurrentUserQuery(user.id));
  }
}
