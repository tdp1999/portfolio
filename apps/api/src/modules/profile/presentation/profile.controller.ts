import { Controller, Get, Query, UseGuards, Body, Patch, Req } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtAccessGuard } from '../../auth/application/guards/jwt-access.guard';
import { RoleGuard, Roles } from '../../auth/application/guards/role.guard';
import { AuthenticatedRequest } from '../../../shared/types';
import {
  UpdateAvatarCommand,
  UpdateOgImageCommand,
  UpdateProfileIdentityCommand,
  UpdateProfileWorkAvailabilityCommand,
  UpdateProfileContactCommand,
  UpdateProfileLocationCommand,
  UpdateProfileSocialLinksCommand,
  UpdateProfileSeoOgCommand,
} from '../application/commands';
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

  @Patch('identity')
  async updateIdentity(@Body() body: unknown, @Req() req: AuthenticatedRequest): Promise<void> {
    return await this.commandBus.execute(new UpdateProfileIdentityCommand(body, req.user.id));
  }

  @Patch('work-availability')
  async updateWorkAvailability(@Body() body: unknown, @Req() req: AuthenticatedRequest): Promise<void> {
    return await this.commandBus.execute(new UpdateProfileWorkAvailabilityCommand(body, req.user.id));
  }

  @Patch('contact')
  async updateContact(@Body() body: unknown, @Req() req: AuthenticatedRequest): Promise<void> {
    return await this.commandBus.execute(new UpdateProfileContactCommand(body, req.user.id));
  }

  @Patch('location')
  async updateLocation(@Body() body: unknown, @Req() req: AuthenticatedRequest): Promise<void> {
    return await this.commandBus.execute(new UpdateProfileLocationCommand(body, req.user.id));
  }

  @Patch('social-links')
  async updateSocialLinks(@Body() body: unknown, @Req() req: AuthenticatedRequest): Promise<void> {
    return await this.commandBus.execute(new UpdateProfileSocialLinksCommand(body, req.user.id));
  }

  @Patch('seo-og')
  async updateSeoOg(@Body() body: unknown, @Req() req: AuthenticatedRequest): Promise<void> {
    return await this.commandBus.execute(new UpdateProfileSeoOgCommand(body, req.user.id));
  }

  @Patch('avatar')
  async updateAvatar(@Body() body: unknown, @Req() req: AuthenticatedRequest): Promise<{ avatarUrl: string | null }> {
    return await this.commandBus.execute(new UpdateAvatarCommand(body, req.user.id));
  }

  @Patch('og-image')
  async updateOgImage(@Body() body: unknown, @Req() req: AuthenticatedRequest): Promise<{ ogImageUrl: string | null }> {
    return await this.commandBus.execute(new UpdateOgImageCommand(body, req.user.id));
  }
}
