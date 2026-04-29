export interface PaginatedQuery {
  page: number;
  limit: number;
  search?: string;
  includeDeleted?: boolean;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
}

export interface ICrudRepository<TEntity> {
  add(entity: TEntity): Promise<string>;
  findById(id: string): Promise<TEntity | null>;
  findAll(options: PaginatedQuery): Promise<PaginatedResult<TEntity>>;
}
