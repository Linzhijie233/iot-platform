import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import mongoose from 'mongoose';

/** 列表查询参数（前端分页/筛选/搜索/排序统一走这里） */
export interface ListParams {
  page?: number;
  pageSize?: number;
  /** 精确匹配筛选，如 { operator: '中国移动', status: 'online' } */
  filter?: Record<string, unknown>;
  /** 关键字模糊搜索：在 fields 指定字段上做不区分大小写包含匹配 */
  search?: { keyword?: string; fields?: string[] };
  /** 排序，如 { createdAt: -1 } */
  sort?: Record<string, 1 | -1>;
}

export interface ListResult<T> {
  data: T[];
  total: number;
}

export type StoreBackend = 'mongo' | 'memory';

/**
 * 通用持久层：优先连 MongoDB，连不上自动回退「进程内存」（演示模式，重启清空）。
 * 对各业务模块透明——统一以「集合名 + 普通 JSON 文档」操作，文档主键统一用字符串字段 `id`。
 */
@Injectable()
export class StoreService implements OnModuleInit {
  private readonly logger = new Logger(StoreService.name);
  private mode: StoreBackend = 'memory';
  private conn?: mongoose.Connection;
  private readonly mem = new Map<string, Record<string, unknown>[]>();
  private seq = 0;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const uri =
      this.config.get<string>('MONGODB_URI') ||
      'mongodb://localhost:27017/iot-platform';
    try {
      this.conn = await mongoose
        .createConnection(uri, {
          serverSelectionTimeoutMS: 2000,
          bufferCommands: false,
        })
        .asPromise();
      this.mode = 'mongo';
      this.logger.log(`持久层：已连接 MongoDB（${uri}）`);
    } catch (e) {
      this.mode = 'memory';
      this.logger.warn(
        `持久层：MongoDB 不可用，已回退「内存存储」（演示模式，重启清空）。原因：${(e as Error).message}`,
      );
    }
  }

  get backend(): StoreBackend {
    return this.mode;
  }

  private genId(name: string): string {
    this.seq += 1;
    return `${name}_${Date.now().toString(36)}${this.seq.toString(36)}`;
  }

  private memCol(name: string): Record<string, unknown>[] {
    if (!this.mem.has(name)) this.mem.set(name, []);
    return this.mem.get(name) as Record<string, unknown>[];
  }

  private static stripMongoId<T>(doc: Record<string, unknown> | null): T | null {
    if (!doc) return null;
    const { _id, __v, ...rest } = doc;
    void _id;
    void __v;
    return rest as T;
  }

  /** 分页/筛选/搜索/排序列表 */
  async list<T = Record<string, unknown>>(
    name: string,
    params: ListParams = {},
  ): Promise<ListResult<T>> {
    const page = Math.max(1, Number(params.page) || 1);
    const pageSize = Math.min(500, Math.max(1, Number(params.pageSize) || 20));
    const filter = params.filter ?? {};
    const kw = params.search?.keyword?.trim();
    const fields = params.search?.fields ?? [];
    const sort = params.sort ?? { createdAt: -1 };

    if (this.mode === 'mongo') {
      const query: Record<string, unknown> = { ...filter };
      if (kw && fields.length) {
        const rx = new RegExp(StoreService.escapeRegExp(kw), 'i');
        query.$or = fields.map((f) => ({ [f]: rx }));
      }
      const col = this.conn!.db!.collection(name);
      const total = await col.countDocuments(query);
      const docs = await col
        .find(query, { projection: { _id: 0, __v: 0 } })
        .sort(sort as Record<string, 1 | -1>)
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .toArray();
      return { data: docs as T[], total };
    }

    // memory
    let rows = this.memCol(name).slice();
    rows = rows.filter((row) =>
      Object.entries(filter).every(([k, v]) => v === undefined || row[k] === v),
    );
    if (kw && fields.length) {
      const low = kw.toLowerCase();
      rows = rows.filter((row) =>
        fields.some((f) =>
          String(row[f] ?? '')
            .toLowerCase()
            .includes(low),
        ),
      );
    }
    const [sf, so] = Object.entries(sort)[0] ?? ['createdAt', -1];
    rows.sort((a, b) => {
      const av = a[sf] as string | number;
      const bv = b[sf] as string | number;
      if (av === bv) return 0;
      return (av > bv ? 1 : -1) * (so as number);
    });
    const total = rows.length;
    const data = rows.slice((page - 1) * pageSize, page * pageSize);
    return { data: data as T[], total };
  }

  async get<T = Record<string, unknown>>(
    name: string,
    id: string,
  ): Promise<T | null> {
    if (this.mode === 'mongo') {
      const doc = await this.conn!.db!.collection(name).findOne(
        { id },
        { projection: { _id: 0, __v: 0 } },
      );
      return (doc as T) ?? null;
    }
    return (this.memCol(name).find((r) => r.id === id) as T) ?? null;
  }

  async create<T = Record<string, unknown>>(
    name: string,
    input: Record<string, unknown>,
  ): Promise<T> {
    const now = new Date().toISOString();
    const doc: Record<string, unknown> = {
      id: (input.id as string) || this.genId(name),
      ...input,
      createdAt: input.createdAt ?? now,
      updatedAt: now,
    };
    if (this.mode === 'mongo') {
      await this.conn!.db!.collection(name).insertOne({ ...doc });
      return StoreService.stripMongoId<T>(doc) as T;
    }
    this.memCol(name).unshift(doc);
    return doc as T;
  }

  async update<T = Record<string, unknown>>(
    name: string,
    id: string,
    patch: Record<string, unknown>,
  ): Promise<T | null> {
    const now = new Date().toISOString();
    const { id: _omit, ...rest } = patch;
    void _omit;
    if (this.mode === 'mongo') {
      await this.conn!.db!.collection(name).updateOne(
        { id },
        { $set: { ...rest, updatedAt: now } },
      );
      return this.get<T>(name, id);
    }
    const col = this.memCol(name);
    const idx = col.findIndex((r) => r.id === id);
    if (idx < 0) return null;
    col[idx] = { ...col[idx], ...rest, updatedAt: now };
    return col[idx] as T;
  }

  async remove(name: string, id: string): Promise<boolean> {
    if (this.mode === 'mongo') {
      const r = await this.conn!.db!.collection(name).deleteOne({ id });
      return r.deletedCount > 0;
    }
    const col = this.memCol(name);
    const idx = col.findIndex((r) => r.id === id);
    if (idx < 0) return false;
    col.splice(idx, 1);
    return true;
  }

  async count(name: string, filter: Record<string, unknown> = {}): Promise<number> {
    if (this.mode === 'mongo') {
      return this.conn!.db!.collection(name).countDocuments(filter);
    }
    return this.memCol(name).filter((row) =>
      Object.entries(filter).every(([k, v]) => row[k] === v),
    ).length;
  }

  /** 取整个集合（用于看板聚合统计） */
  async all<T = Record<string, unknown>>(name: string): Promise<T[]> {
    if (this.mode === 'mongo') {
      const docs = await this.conn!.db!.collection(name)
        .find({}, { projection: { _id: 0, __v: 0 } })
        .toArray();
      return docs as T[];
    }
    return this.memCol(name).slice() as T[];
  }

  /** 集合为空时写入种子数据（演示一启动就有内容） */
  async seedIfEmpty(
    name: string,
    items: Record<string, unknown>[],
  ): Promise<void> {
    const existing = await this.count(name);
    if (existing > 0) return;
    for (const item of items) {
      await this.create(name, item);
    }
    this.logger.log(`种子数据：集合 ${name} 写入 ${items.length} 条（${this.mode}）`);
  }

  /** 清空集合（演示重置用） */
  async clear(name: string): Promise<void> {
    if (this.mode === 'mongo') {
      await this.conn!.db!.collection(name).deleteMany({});
    } else {
      this.mem.set(name, []);
    }
  }

  private static escapeRegExp(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
