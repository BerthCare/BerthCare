export interface BaseRepository<TEntity, TCreate, TUpdate, TFind = unknown> {
  create(data: TCreate): Promise<TEntity>;
  findById(id: string): Promise<TEntity | null>;
  findMany(filter?: TFind): Promise<TEntity[]>;
  update(id: string, data: TUpdate): Promise<TEntity>;
  softDelete(id: string): Promise<void>;
}
