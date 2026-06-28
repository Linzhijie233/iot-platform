import { request } from '@umijs/max';

/** 系统管理 + 运营商接口 */

/** 一键重置数据（清空所有业务集合并重灌种子） */
export async function resetDemoData() {
  return request<{ success: boolean; data: { cleared: number; reseeded: number; backend: string } }>(
    '/api/admin/reset-demo',
    { method: 'POST' },
  );
}

/**
 * 移动 OneLink：批量查询码号信息（真实运营商接口，iccids 英文逗号分隔）。
 * 该接口返回 `{traceId,msg,data}`（无 success 字段），故用原生 fetch 绕开
 * umi 全局 errorThrower（它会把「无 success」误判为失败）。
 */
export async function syncMobileCards(iccids: string) {
  const resp = await fetch('/api/sim/mobile/card-info/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ iccids }),
  });
  const text = await resp.text();
  let body: { traceId?: string; msg?: string; data?: unknown[]; message?: string };
  try {
    body = JSON.parse(text);
  } catch {
    body = { msg: text };
  }
  if (!resp.ok) {
    throw new Error(body?.message || body?.msg || `HTTP ${resp.status}`);
  }
  return body;
}
