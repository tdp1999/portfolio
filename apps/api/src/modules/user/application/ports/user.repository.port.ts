import { User } from '../../domain/entities/user.entity';

export type IUserRepository = {
  add(user: User): Promise<string>;
  update(id: string, user: User): Promise<boolean>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
};
