import type { AlertRecord } from './alerts.types';

/** 告警种子数据（集合为空时写入） */
export const ALERT_SEED: Omit<AlertRecord, 'createdAt' | 'updatedAt'>[] = [
  { id: 'alert-seed-1', time: '2026-06-24 09:12', target: '898604A4192191902141', operator: '中国移动', type: '流量超额', level: '高', desc: '本月流量已使用 98%，即将触发限速', status: '待处理' },
  { id: 'alert-seed-2', time: '2026-06-24 08:47', target: '898604D5192270879709', operator: '中国移动', type: '风控拦截', level: '高', desc: '检测到异地高频流量，疑似卡被盗用', status: '待处理' },
  { id: 'alert-seed-3', time: '2026-06-24 07:30', target: '井盖传感器 N-02', operator: '中国电信', type: '设备离线', level: '中', desc: '设备心跳丢失超过 24 小时', status: '待处理' },
  { id: 'alert-seed-4', time: '2026-06-23 23:05', target: '898604D5192270879708', operator: '中国联通', type: '欠费停机', level: '中', desc: '账户余额不足，已自动停机保号', status: '待处理' },
  { id: 'alert-seed-5', time: '2026-06-23 21:18', target: '8986001000000009002', operator: '中国联通', type: '流量超额', level: '高', desc: '流量池剩余不足 10%，需及时扩容', status: '待处理' },
  { id: 'alert-seed-6', time: '2026-06-23 18:42', target: '898604A4192280313034', operator: '中国移动', type: '异常位置', level: '低', desc: '位置漂移超出设定地理围栏', status: '待处理' },
  { id: 'alert-seed-7', time: '2026-06-23 16:09', target: '车载终端 B-18', operator: '中国移动', type: '设备离线', level: '中', desc: '车载终端连续 3 次心跳超时', status: '待处理' },
  { id: 'alert-seed-8', time: '2026-06-22 14:55', target: '8986032400000001201', operator: '中国电信', type: '异常位置', level: '低', desc: '短时间内跨省移动，已确认为正常巡检', status: '已处理' },
  { id: 'alert-seed-9', time: '2026-06-22 10:21', target: '8986001000000009001', operator: '中国联通', type: '风控拦截', level: '中', desc: '夜间异常流量，已人工核实放行', status: '已处理' },
];
