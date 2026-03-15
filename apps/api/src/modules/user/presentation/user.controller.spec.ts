import { Test } from '@nestjs/testing';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { UserController } from './user.controller';
import {
  InviteUserCommand,
  ResendInviteCommand,
  SoftDeleteUserCommand,
  UpdateUserCommand,
} from '../application/commands';
import { GetUserByIdQuery, ListUsersQuery } from '../application/queries';
import { ThrottlerGuard } from '@nestjs/throttler';
import { JwtAccessGuard } from '../../auth/application/guards/jwt-access.guard';
import { RoleGuard } from '../../auth/application/guards/role.guard';

describe('UserController', () => {
  let controller: UserController;
  let commandBus: jest.Mocked<CommandBus>;
  let queryBus: jest.Mocked<QueryBus>;

  const mockReq = (id: string, role = 'USER') => ({ user: { id, role } }) as any;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: CommandBus,
          useValue: { execute: jest.fn() },
        },
        {
          provide: QueryBus,
          useValue: { execute: jest.fn() },
        },
      ],
    })
      .overrideGuard(JwtAccessGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RoleGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(UserController);
    commandBus = module.get(CommandBus);
    queryBus = module.get(QueryBus);
  });

  describe('POST /users (invite)', () => {
    it('should invite a user and return public props', async () => {
      const publicProps = { id: 'user-123', email: 'test@example.com', name: 'Test User' };
      commandBus.execute.mockResolvedValue(publicProps);

      const dto = { email: 'test@example.com', name: 'Test User' };
      const result = await controller.invite(dto);

      expect(result).toEqual(publicProps);
      expect(commandBus.execute).toHaveBeenCalledWith(expect.any(InviteUserCommand));
    });
  });

  describe('GET /users (list)', () => {
    it('should return paginated users', async () => {
      const response = { data: [], total: 0, page: 1, limit: 20 };
      queryBus.execute.mockResolvedValue(response);

      const result = await controller.list({ page: '1', limit: '20' });

      expect(result).toEqual(response);
      expect(queryBus.execute).toHaveBeenCalledWith(expect.any(ListUsersQuery));
    });
  });

  describe('GET /users/:id', () => {
    it('should return user when found', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com', name: 'Test User' };
      queryBus.execute.mockResolvedValue(mockUser);

      const result = await controller.getById('user-123', mockReq('user-123'));

      expect(result).toEqual(mockUser);
      expect(queryBus.execute).toHaveBeenCalledWith(expect.any(GetUserByIdQuery));
    });
  });

  describe('PATCH /users/:id', () => {
    it('should update user and return success', async () => {
      commandBus.execute.mockResolvedValue(undefined);

      const dto = { name: 'Updated Name' };
      const result = await controller.update('user-123', dto, mockReq('user-123'));

      expect(result).toEqual({ success: true });
      expect(commandBus.execute).toHaveBeenCalledWith(expect.any(UpdateUserCommand));
    });
  });

  describe('DELETE /users/:id (soft-delete)', () => {
    it('should soft-delete user and return success', async () => {
      commandBus.execute.mockResolvedValue(undefined);

      const result = await controller.softDelete('user-123');

      expect(result).toEqual({ success: true });
      expect(commandBus.execute).toHaveBeenCalledWith(expect.any(SoftDeleteUserCommand));
    });
  });

  describe('POST /users/:id/resend-invite', () => {
    it('should resend invite and return success', async () => {
      commandBus.execute.mockResolvedValue(undefined);

      const result = await controller.resendInvite('user-123');

      expect(result).toEqual({ success: true });
      expect(commandBus.execute).toHaveBeenCalledWith(expect.any(ResendInviteCommand));
    });
  });
});
