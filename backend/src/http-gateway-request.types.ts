/** 运营商 HTTP JSON 出站网关通用方法签名 */
export type HttpGatewayMethod =
  | 'GET'
  | 'HEAD'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE';

/** 两省网关 `request()` 对齐的公共入参 */
export type HttpGatewayJsonRequestInput = {
  /** 日志与错误信息前缀 */
  operationLabel: string;
  /** 完整请求 URL（含 query；电信 CMP 常为绝对地址，移动可先 `resolveOnelinkUrl`） */
  url: string;
  method?: HttpGatewayMethod;
  /** GET/HEAD 不传 body；签名类网关参与签名的原始串与 body 对齐 */
  rawBody?: string;
  /**
   * 有 body 时默认 `application/json;charset=utf-8`；
   * `false` 表示不显式设置 Content-Type
   */
  contentType?: string | false;
  extraHeaders?: Record<string, string>;
};
