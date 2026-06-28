import type { ListResult, StoreService } from '../persistence/store.service';

export interface ListQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
  filter?: Record<string, unknown>;
  sort?: Record<string, 1 | -1>;
}

/**
 * 通用 CRUD 基类：子类只需指定 `collection` 与 `searchFields`，并注入 StoreService。
 * 各业务模块据此叠加自己的生命周期动作（停复机/续费等）。
 */
export abstract class BaseCrudService {
  protected abstract readonly collection: string;
  protected readonly searchFields: string[] = [];

  protected constructor(protected readonly store: StoreService) {}

  list<T = Record<string, unknown>>(query: ListQuery): Promise<ListResult<T>> {
    return this.store.list<T>(this.collection, {
      page: query.page,
      pageSize: query.pageSize,
      filter: query.filter,
      search: query.keyword
        ? { keyword: query.keyword, fields: this.searchFields }
        : undefined,
      sort: query.sort,
    });
  }

  get<T = Record<string, unknown>>(id: string): Promise<T | null> {
    return this.store.get<T>(this.collection, id);
  }

  create<T = Record<string, unknown>>(
    input: Record<string, unknown>,
  ): Promise<T> {
    return this.store.create<T>(this.collection, input);
  }

  update<T = Record<string, unknown>>(
    id: string,
    patch: Record<string, unknown>,
  ): Promise<T | null> {
    return this.store.update<T>(this.collection, id, patch);
  }

  remove(id: string): Promise<boolean> {
    return this.store.remove(this.collection, id);
  }

  count(filter?: Record<string, unknown>): Promise<number> {
    return this.store.count(this.collection, filter);
  }

  all<T = Record<string, unknown>>(): Promise<T[]> {
    return this.store.all<T>(this.collection);
  }

  clear(): Promise<void> {
    return this.store.clear(this.collection);
  }
}
