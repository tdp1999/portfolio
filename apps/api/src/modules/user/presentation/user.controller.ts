import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateUserCommand, UpdateUserCommand } from '../application/commands';
import { GetUserByIdQuery } from '../application/queries';

@Controller('users')
export class UserController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: unknown): Promise<{ id: string }> {
    const id = await this.commandBus.execute(new CreateUserCommand(body));
    return { id };
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const user = await this.queryBus.execute(new GetUserByIdQuery(id));
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: unknown): Promise<{ success: boolean }> {
    await this.commandBus.execute(new UpdateUserCommand(id, body));
    return { success: true };
  }
}
