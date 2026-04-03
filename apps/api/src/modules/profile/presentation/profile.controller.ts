import { Controller, Get, Query, UseGuards, Body, Patch, Put, Req } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtAccessGuard } from '../../auth/application/guards/jwt-access.guard';
import { RoleGuard, Roles } from '../../auth/application/guards/role.guard';
import { AuthenticatedRequest } from '../../../shared/types';
import { UpsertProfileCommand, UpdateAvatarCommand, UpdateOgImageCommand } from '../application/commands';
import { GetProfileQuery, GetPublicProfileQuery, GetJsonLdQuery } from '../application/queries';

// ── Public ──────────────────────────────────────────────────────────────────

@Controller('profile')
export class ProfileController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  async getPublicProfile() {
    return await this.queryBus.execute(new GetPublicProfileQuery());
  }

  @Get('json-ld')
  async getJsonLd(@Query('locale') locale: string) {
    const safeLocale = locale === 'vi' ? 'vi' : 'en';
    return await this.queryBus.execute(new GetJsonLdQuery(safeLocale));
  }
}

// ── Admin ────────────────────────────────────────────────────────────────────

@Controller('admin/profile')
@UseGuards(JwtAccessGuard, RoleGuard)
@Roles(['ADMIN'])
export class AdminProfileController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  @Get()
  async getProfile(@Req() req: AuthenticatedRequest) {
    return await this.queryBus.execute(new GetProfileQuery(req.user.id));
  }

  @Put()
  async upsert(@Body() body: unknown, @Req() req: AuthenticatedRequest): Promise<{ id: string }> {
    return await this.commandBus.execute(new UpsertProfileCommand(body, req.user.id));
  }

  @Patch('avatar')
  async updateAvatar(@Body() body: unknown, @Req() req: AuthenticatedRequest): Promise<void> {
    return await this.commandBus.execute(new UpdateAvatarCommand(body, req.user.id));
  }

  @Patch('og-image')
  async updateOgImage(@Body() body: unknown, @Req() req: AuthenticatedRequest): Promise<void> {
    return await this.commandBus.execute(new UpdateOgImageCommand(body, req.user.id));
  }
}
