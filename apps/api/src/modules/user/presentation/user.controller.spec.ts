import { Test } from '@nestjs/testing';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { UserController } from './user.controller';
import { CreateUserCommand } from '../application/commands';
import { GetUserByIdQuery } from '../application/queries';
import { UpdateUserCommand } from '../application/commands';

describe('UserController', () => {
  let controller: UserController;
  let commandBus: jest.Mocked<CommandBus>;
  let queryBus: jest.Mocked<QueryBus>;

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
    }).compile();

    controller = module.get(UserController);
    commandBus = module.get(CommandBus);
    queryBus = module.get(QueryBus);
  });

  describe('POST /users', () => {
    it('should create a user and return id', async () => {
      commandBus.execute.mockResolvedValue('user-123');

      const dto = {
        email: 'test@example.com',
        password: 'Strong#Pass1',
        name: 'Test User',
      };
      const result = await controller.create(dto);

      expect(result).toEqual({ id: 'user-123' });
      expect(commandBus.execute).toHaveBeenCalledWith(expect.any(CreateUserCommand));
    });
  });

  describe('GET /users/:id', () => {
    it('should return user when found', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
      };
      queryBus.execute.mockResolvedValue(mockUser);

      const result = await controller.getById('user-123');

      expect(result).toEqual(mockUser);
      expect(queryBus.execute).toHaveBeenCalledWith(expect.any(GetUserByIdQuery));
    });
  });

  describe('PATCH /users/:id', () => {
    it('should update user and return success', async () => {
      commandBus.execute.mockResolvedValue(undefined);

      const dto = { name: 'Updated Name' };
      const result = await controller.update('user-123', dto);

      expect(result).toEqual({ success: true });
      expect(commandBus.execute).toHaveBeenCalledWith(expect.any(UpdateUserCommand));
    });
  });
});
