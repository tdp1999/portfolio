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
  UsePipes,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateUserCommand } from '../application/commands';
import { UpdateUserCommand } from '../application/commands';
import { GetUserByIdQuery } from '../application/queries';
import {
  CreateUserDto,
  CreateUserSchema,
  UpdateUserDto,
  UpdateUserSchema,
} from '../application/user.dto';
import { ZodValidationPipe } from '../../../shared/pipes/zod-validation.pipe';

@Controller('users')
export class UserController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(new ZodValidationPipe(CreateUserSchema)) dto: CreateUserDto
  ): Promise<{ id: string }> {
    const id = await this.commandBus.execute(
      new CreateUserCommand(dto.email, dto.password, dto.name)
    );
    return { id };
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const user = await this.queryBus.execute(new GetUserByIdQuery(id));
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateUserSchema)) dto: UpdateUserDto
  ): Promise<{ success: boolean }> {
    await this.commandBus.execute(new UpdateUserCommand(id, dto));
    return { success: true };
  }
}
