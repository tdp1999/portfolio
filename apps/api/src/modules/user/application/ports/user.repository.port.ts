import { User } from '../../domain/entities/user.entity';

export type FindAllOptions = {
  page: number;
  limit: number;
  search?: string;
};

export type FindAllResult = {
  data: User[];
  total: number;
};

export type IUserRepository = {
  add(user: User): Promise<string>;
  update(id: string, user: User): Promise<boolean>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(options: FindAllOptions): Promise<FindAllResult>;
};
