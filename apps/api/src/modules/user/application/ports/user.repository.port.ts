import { User } from '../../domain/entities/user.entity';
import { IUserProps } from '../../domain/user.types';

export type UserUpdateData = Partial<Omit<IUserProps, 'id' | 'createdAt'>>;

export type FindAllOptions = {
  page: number;
  limit: number;
  search?: string;
  includeDeleted?: boolean;
  status?: 'active' | 'invited' | 'deleted';
};

export type FindAllResult = {
  data: User[];
  total: number;
};

export type IUserRepository = {
  add(user: User): Promise<string>;
  update(id: string, data: UserUpdateData): Promise<void>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByEmailIncludingDeleted(email: string): Promise<User | null>;
  findAll(options: FindAllOptions): Promise<FindAllResult>;
};
