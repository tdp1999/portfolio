import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { Request } from 'express';
import { JwtAccessGuard } from '../../auth/application/guards/jwt-access.guard';
import { RoleGuard, Roles } from '../../auth/application/guards/role.guard';
import { CreateUserCommand, UpdateUserCommand } from '../application/commands';
import { GetUserByIdQuery } from '../application/queries';

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
  async create(@Body() body: unknown): Promise<{ id: string }> {
    const id = await this.commandBus.execute(new CreateUserCommand(body));
    return { id };
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
}
