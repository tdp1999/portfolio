import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { Request } from 'express';

import { JwtAccessGuard } from '../../auth/application/guards/jwt-access.guard';
import { Roles, RoleGuard } from '../../auth/application/guards/role.guard';
import {
  SubmitContactMessageCommand,
  MarkAsReadCommand,
  MarkAsUnreadCommand,
  SetRepliedCommand,
  ArchiveMessageCommand,
  RestoreMessageCommand,
  SoftDeleteMessageCommand,
} from '../application/commands';
import { ListMessagesQuery, GetMessageByIdQuery, GetUnreadCountQuery } from '../application/queries';

@Controller('contact-messages')
export class ContactMessageController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  // ── Public ──────────────────────────────────────────────

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 3600000 /* 1 hour in ms */ } })
  async submit(@Body() body: unknown, @Req() req: Request): Promise<{ id: string }> {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? req.ip;
    const userAgent = req.headers['user-agent'];
    return await this.commandBus.execute(new SubmitContactMessageCommand(body, ip, userAgent));
  }

  // ── Admin ───────────────────────────────────────────────

  @Get()
  @UseGuards(JwtAccessGuard, RoleGuard)
  @Roles(['ADMIN'])
  async list(@Query() query: unknown) {
    return await this.queryBus.execute(new ListMessagesQuery(query));
  }

  @Get('unread-count')
  @UseGuards(JwtAccessGuard, RoleGuard)
  @Roles(['ADMIN'])
  async unreadCount() {
    return await this.queryBus.execute(new GetUnreadCountQuery());
  }

  @Get(':id')
  @UseGuards(JwtAccessGuard, RoleGuard)
  @Roles(['ADMIN'])
  async getById(@Param('id') id: string) {
    return await this.queryBus.execute(new GetMessageByIdQuery(id));
  }

  @Patch(':id/read')
  @UseGuards(JwtAccessGuard, RoleGuard)
  @Roles(['ADMIN'])
  async markAsRead(@Param('id') id: string) {
    return await this.commandBus.execute(new MarkAsReadCommand(id));
  }

  @Patch(':id/unread')
  @UseGuards(JwtAccessGuard, RoleGuard)
  @Roles(['ADMIN'])
  async markAsUnread(@Param('id') id: string) {
    return await this.commandBus.execute(new MarkAsUnreadCommand(id));
  }

  @Patch(':id/replied')
  @UseGuards(JwtAccessGuard, RoleGuard)
  @Roles(['ADMIN'])
  async setReplied(@Param('id') id: string) {
    return await this.commandBus.execute(new SetRepliedCommand(id));
  }

  @Patch(':id/archive')
  @UseGuards(JwtAccessGuard, RoleGuard)
  @Roles(['ADMIN'])
  async archive(@Param('id') id: string) {
    return await this.commandBus.execute(new ArchiveMessageCommand(id));
  }

  @Patch(':id/restore')
  @UseGuards(JwtAccessGuard, RoleGuard)
  @Roles(['ADMIN'])
  async restore(@Param('id') id: string) {
    return await this.commandBus.execute(new RestoreMessageCommand(id));
  }

  @Delete(':id')
  @UseGuards(JwtAccessGuard, RoleGuard)
  @Roles(['ADMIN'])
  async softDelete(@Param('id') id: string) {
    return await this.commandBus.execute(new SoftDeleteMessageCommand(id));
  }
}
