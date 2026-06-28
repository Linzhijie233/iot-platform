/** 统一响应信封：列表带 total，单条不带。与前端 ProTable request 期望对齐。 */
export interface ApiListResponse<T> {
  success: true;
  data: T[];
  total: number;
}

export interface ApiItemResponse<T> {
  success: true;
  data: T;
}

export function okList<T>(data: T[], total: number): ApiListResponse<T> {
  return { success: true, data, total };
}

export function okItem<T>(data: T): ApiItemResponse<T> {
  return { success: true, data };
}

/** 从查询对象里挑出真正用于精确筛选的字段（值为空串/undefined 的忽略） */
export function pickFilter(
  query: Record<string, unknown>,
  keys: string[],
): Record<string, unknown> {
  const filter: Record<string, unknown> = {};
  for (const k of keys) {
    const v = query[k];
    if (v !== undefined && v !== '' && v !== 'all') filter[k] = v;
  }
  return filter;
}
