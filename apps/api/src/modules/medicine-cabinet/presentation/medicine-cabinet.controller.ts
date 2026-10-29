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
import { AuthenticatedRequest } from '../../../shared/types';
import { JwtAccessGuard } from '../../auth/application/guards/jwt-access.guard';
import { RoleGuard, Roles } from '../../auth/application/guards/role.guard';
import {
  CreateHealthProfileCommand,
  CreateMedicalItemCommand,
  DeleteHealthProfileCommand,
  DeleteMedicalItemCommand,
  RenameHealthProfileCommand,
  UpdateMedicalItemCommand,
} from '../application/commands';
import {
  GetMedicalItemQuery,
  ListHealthProfilesQuery,
  ListLookupItemsQuery,
  ListMedicalItemsQuery,
} from '../application/queries';

/** Private data of the Owner: every route needs an ADMIN session ('DT-3 Phân quyền'). */
@Controller('medicine-cabinet')
@UseGuards(JwtAccessGuard, RoleGuard)
@Roles(['ADMIN'])
export class MedicineCabinetController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  @Get('items')
  async listItems(@Query() query: unknown) {
    return this.queryBus.execute(new ListMedicalItemsQuery(query));
  }

  @Post('items')
  @HttpCode(HttpStatus.CREATED)
  async createItem(@Body() body: unknown, @Req() req: AuthenticatedRequest) {
    const id = await this.commandBus.execute(new CreateMedicalItemCommand(body, req.user.id));
    return { id };
  }

  @Get('items/:id')
  async getItem(@Param('id') id: string) {
    return this.queryBus.execute(new GetMedicalItemQuery(id));
  }

  @Patch('items/:id')
  async updateItem(@Param('id') id: string, @Body() body: unknown, @Req() req: AuthenticatedRequest) {
    await this.commandBus.execute(new UpdateMedicalItemCommand(id, body, req.user.id));
    return { success: true };
  }

  @Delete('items/:id')
  @HttpCode(HttpStatus.OK)
  async deleteItem(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    await this.commandBus.execute(new DeleteMedicalItemCommand(id, req.user.id));
    return { success: true };
  }

  @Get('lookup')
  async lookup() {
    return this.queryBus.execute(new ListLookupItemsQuery());
  }

  @Get('profiles')
  async listProfiles() {
    return this.queryBus.execute(new ListHealthProfilesQuery());
  }

  @Post('profiles')
  @HttpCode(HttpStatus.CREATED)
  async createProfile(@Body() body: unknown, @Req() req: AuthenticatedRequest) {
    const id = await this.commandBus.execute(new CreateHealthProfileCommand(body, req.user.id));
    return { id };
  }

  @Patch('profiles/:id')
  async renameProfile(@Param('id') id: string, @Body() body: unknown, @Req() req: AuthenticatedRequest) {
    await this.commandBus.execute(new RenameHealthProfileCommand(id, body, req.user.id));
    return { success: true };
  }

  @Delete('profiles/:id')
  @HttpCode(HttpStatus.OK)
  async deleteProfile(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    await this.commandBus.execute(new DeleteHealthProfileCommand(id, req.user.id));
    return { success: true };
  }
}
