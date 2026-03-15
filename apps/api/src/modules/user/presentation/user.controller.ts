import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { Request } from 'express';
import { JwtAccessGuard } from '../../auth/application/guards/jwt-access.guard';
import { RoleGuard, Roles } from '../../auth/application/guards/role.guard';
import {
  InviteUserCommand,
  ResendInviteCommand,
  SoftDeleteUserCommand,
  UpdateUserCommand,
} from '../application/commands';
import { GetUserByIdQuery, ListUsersQuery } from '../application/queries';

// user is guaranteed non-null by JwtAccessGuard
interface AuthenticatedRequest extends Request {
  user: { id: string; role: string };
}

@Controller('users')
@UseGuards(JwtAccessGuard, RoleGuard)
export class UserController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(['ADMIN'])
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async invite(@Body() body: unknown) {
    return await this.commandBus.execute(new InviteUserCommand(body));
  }

  @Get()
  @Roles(['ADMIN'])
  async list(@Query() query: unknown) {
    return await this.queryBus.execute(new ListUsersQuery(query));
  }

  @Get(':id')
  async getById(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return await this.queryBus.execute(new GetUserByIdQuery(id, req.user.id, req.user.role));
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: AuthenticatedRequest
  ): Promise<{ success: boolean }> {
    await this.commandBus.execute(new UpdateUserCommand(id, body, req.user.id, req.user.role));
    return { success: true };
  }

  @Delete(':id')
  @Roles(['ADMIN'])
  @HttpCode(HttpStatus.OK)
  async softDelete(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.commandBus.execute(new SoftDeleteUserCommand(id));
    return { success: true };
  }

  @Post(':id/resend-invite')
  @Roles(['ADMIN'])
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async resendInvite(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.commandBus.execute(new ResendInviteCommand(id));
    return { success: true };
  }
}
