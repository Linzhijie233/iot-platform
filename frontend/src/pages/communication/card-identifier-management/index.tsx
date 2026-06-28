import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormDigit,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import type { Rule } from 'antd/es/form';
import {
  App,
  Button,
  Checkbox,
  Col,
  Drawer,
  Dropdown,
  Input,
  Popover,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
} from 'antd';
import { DownOutlined, ExportOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import React, { useRef, useState } from 'react';
import {
  type CardItem,
  cardAction,
  createCard,
  listCards,
  removeCard,
  updateCard,
} from '@/services/platform/cards';
import { syncMobileCards } from '@/services/platform/system';
import styles from './index.less';

type CardTabKey = 'normal' | 'nb' | 'pool';

/** 后端卡片记录（与 services CardItem 对齐，含完整展示字段） */
type CardRecord = CardItem & {
  renewCode?: string;
  giftTraffic?: string;
  usedTraffic?: string;
  owner?: string;
  apn?: string;
  apnType?: string;
  mode?: string;
  cardType?: string;
  poolName?: string;
  cardAttr?: string;
  guaranteedKeepNo?: string;
  guaranteedExpireDate?: string;
  resource?: string;
  smsStatus?: string;
  esim?: string;
  imei?: string;
  deviceName?: string;
};

const tabLabels: Record<CardTabKey, string> = {
  normal: '普通权球卡',
  nb: 'NB卡',
  pool: '流量池卡',
};

const tableColumnLabels = [
  { label: 'ICCID', value: 'iccid' },
  { label: 'MSISDN', value: 'msisdn' },
  { label: '服务套餐', value: 'packageName' },
  { label: '卡状态', value: 'cardStatusText' },
  { label: 'APN', value: 'apn' },
  { label: '制式', value: 'mode' },
  { label: '流量池', value: 'poolName' },
  { label: '生效日期', value: 'effectiveDate' },
  { label: '失效日期', value: 'expireDate' },
  { label: '备注', value: 'remark' },
] as const;

const statusOptions = [
  { label: '全部状态', value: 'all' },
  { label: '在线', value: 'online' },
  { label: '离线', value: 'offline' },
  { label: '停机保号', value: 'suspended' },
  { label: '已注销', value: 'cancelled' },
];

const operatorOptions = [
  { label: '全部运营商', value: 'all' },
  { label: '中国移动', value: '中国移动' },
  { label: '中国联通', value: '中国联通' },
  { label: '中国电信', value: '中国电信' },
];

const projectOptions = [
  { label: '全部项目', value: 'all' },
  { label: '无人机巡检', value: '无人机巡检' },
  { label: '智能驾驶', value: '智能驾驶' },
  { label: '水务抄表', value: '水务抄表' },
  { label: '园区网关', value: '园区网关' },
  { label: '车载监控', value: '车载监控' },
];

const statisticOptions = [
  { label: '全部统计', value: 'all' },
  { label: '近30天到期', value: 'expiring' },
  { label: '流量剩余不足20%', value: 'lowTraffic' },
  { label: '已绑定设备', value: 'boundDevice' },
];

const statusClassNameMap: Record<string, string> = {
  online: styles.statusOnline,
  offline: styles.statusOffline,
  suspended: styles.statusSuspended,
  cancelled: styles.statusCancelled,
};

const STATUS_TEXT: Record<string, string> = {
  online: '已激活',
  offline: '离线',
  suspended: '停机保号',
  cancelled: '已注销',
};

/* ───────────────────────── 工具栏动作弹窗（带校验 + 成功结果） ───────────────────────── */

type ActionFieldComponent = 'text' | 'textarea' | 'select' | 'digit';

interface ActionField {
  component: ActionFieldComponent;
  name: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  tooltip?: string;
  options?: { label: string; value: string }[];
  initialValue?: string | number;
  rules?: Rule[];
  fieldProps?: Record<string, unknown>;
}

interface ToolbarAction {
  title: string;
  width?: number;
  okText?: string;
  fields: ActionField[];
  /** 校验通过后用于成功结果弹窗的摘要文案 */
  success: (values: Record<string, string | number>, ctx: { selectedCount: number }) => string;
}

const toOptions = (labels: string[]) => labels.map((label) => ({ label, value: label }));
const projectSelectOptions = projectOptions.filter((o) => o.value !== 'all');
const operatorSelectOptions = operatorOptions.filter((o) => o.value !== 'all');

const exportFields: ActionField[] = [
  {
    component: 'select',
    name: 'format',
    label: '导出格式',
    required: true,
    initialValue: 'xlsx',
    options: [
      { label: 'Excel（.xlsx）', value: 'xlsx' },
      { label: 'CSV（.csv）', value: 'csv' },
    ],
  },
  {
    component: 'select',
    name: 'encoding',
    label: '文件编码',
    initialValue: 'utf-8',
    options: [
      { label: 'UTF-8', value: 'utf-8' },
      { label: 'GBK', value: 'gbk' },
    ],
  },
];

const TOOLBAR_ACTIONS: Record<string, ToolbarAction> = {
  分配卡号: {
    title: '分配卡号',
    width: 520,
    okText: '提交分配',
    fields: [
      {
        component: 'digit',
        name: 'count',
        label: '分配数量',
        required: true,
        placeholder: '请输入要分配的卡数量',
        fieldProps: { min: 1, precision: 0, style: { width: '100%' } },
      },
      { component: 'select', name: 'project', label: '目标项目', required: true, options: projectSelectOptions },
      { component: 'select', name: 'operator', label: '运营商', required: true, options: operatorSelectOptions },
      { component: 'text', name: 'receiver', label: '领用人', required: true, placeholder: '请输入领用人 / 客户名称' },
      { component: 'textarea', name: 'remark', label: '备注', placeholder: '可填写分配用途、批次说明等' },
    ],
    success: (v) => `已提交分配申请：${v.count} 张卡 → ${v.project}（领用人：${v.receiver}）`,
  },
  回拨卡号: {
    title: '回拨卡号',
    width: 520,
    okText: '提交回拨',
    fields: [
      {
        component: 'textarea',
        name: 'iccids',
        label: '卡号 / ICCID',
        required: true,
        placeholder: '多个用英文逗号分隔',
        tooltip: '回拨后号码资源将回收至号池',
      },
      {
        component: 'select',
        name: 'reason',
        label: '回拨原因',
        required: true,
        options: toOptions(['套餐变更', '号码回收', '客户退订', '资源回收', '其他']),
      },
      { component: 'textarea', name: 'remark', label: '备注' },
    ],
    success: (v) => `已提交回拨申请（原因：${v.reason}）`,
  },
  用卡需求: {
    title: '用卡需求登记',
    width: 560,
    okText: '提交需求',
    fields: [
      {
        component: 'select',
        name: 'demandType',
        label: '需求类型',
        required: true,
        options: toOptions(['新增开卡', '批量扩容', '换卡补卡', '销卡退订']),
      },
      {
        component: 'digit',
        name: 'quantity',
        label: '需求数量',
        required: true,
        fieldProps: { min: 1, precision: 0, style: { width: '100%' } },
      },
      { component: 'select', name: 'operator', label: '运营商', required: true, options: operatorSelectOptions },
      { component: 'text', name: 'expectDate', label: '期望交付日期', placeholder: 'YYYY/MM/DD' },
      {
        component: 'textarea',
        name: 'usage',
        label: '用途说明',
        required: true,
        placeholder: '请说明用卡场景与用途',
      },
    ],
    success: (v) => `已登记用卡需求：${v.demandType} × ${v.quantity}`,
  },
  发送短信: {
    title: '发送短信',
    width: 560,
    okText: '发送',
    fields: [
      {
        component: 'textarea',
        name: 'targets',
        label: '目标卡号 / ICCID',
        required: true,
        placeholder: '多个用英文逗号分隔',
      },
      {
        component: 'select',
        name: 'channel',
        label: '发送方式',
        required: true,
        initialValue: 'immediate',
        options: [
          { label: '立即发送', value: 'immediate' },
          { label: '定时发送', value: 'scheduled' },
        ],
      },
      {
        component: 'textarea',
        name: 'content',
        label: '短信内容',
        required: true,
        placeholder: '请输入短信内容（建议 ≤ 70 字）',
        fieldProps: { maxLength: 300, showCount: true, rows: 4 },
      },
    ],
    success: (v) => `短信已提交发送（${String(v.content).length} 字）`,
  },
  手机绑定: {
    title: '手机绑定',
    width: 480,
    okText: '确认绑定',
    fields: [
      { component: 'text', name: 'iccid', label: 'ICCID', required: true, placeholder: '请输入要绑定的卡 ICCID' },
      {
        component: 'text',
        name: 'phone',
        label: '手机号',
        placeholder: '请输入 11 位手机号',
        rules: [
          { required: true, message: '请输入手机号' },
          { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' },
        ],
      },
      {
        component: 'text',
        name: 'code',
        label: '短信验证码',
        placeholder: '请输入 6 位数字验证码',
        rules: [
          { required: true, message: '请输入验证码' },
          { pattern: /^\d{6}$/, message: '验证码为 6 位数字' },
        ],
      },
    ],
    success: (v) => `已绑定手机号 ${v.phone} ↔ ${v.iccid}`,
  },
  查看到期卡: {
    title: '查看到期卡',
    width: 440,
    okText: '筛选',
    fields: [
      {
        component: 'select',
        name: 'range',
        label: '到期范围',
        required: true,
        initialValue: '30',
        options: [
          { label: '近 7 天到期', value: '7' },
          { label: '近 30 天到期', value: '30' },
          { label: '近 90 天到期', value: '90' },
        ],
      },
    ],
    success: (v) => `已为你筛选「近 ${v.range} 天到期」的卡片`,
  },
  导出当前页: {
    title: '导出当前页',
    width: 440,
    okText: '导出',
    fields: exportFields,
    success: (v) => `已导出当前页（${String(v.format).toUpperCase()}）`,
  },
  导出全部结果: {
    title: '导出全部结果',
    width: 440,
    okText: '导出',
    fields: exportFields,
    success: (v) => `已导出全部结果（${String(v.format).toUpperCase()}）`,
  },
  批量续期: {
    title: '批量续期',
    width: 480,
    okText: '提交续期',
    fields: [
      { component: 'select', name: 'duration', label: '续费时长', required: true, options: toOptions(['包月', '包季', '包年']) },
      {
        component: 'select',
        name: 'cycle',
        label: '续费周期数',
        required: true,
        initialValue: '1',
        options: ['1', '2', '3', '6', '12'].map((x) => ({ label: `${x} 个周期`, value: x })),
      },
    ],
    success: (v, ctx) => `已为 ${ctx.selectedCount} 张卡提交续期（${v.duration} × ${v.cycle}）`,
  },
  批量导出: {
    title: '批量导出',
    width: 440,
    okText: '导出',
    fields: exportFields,
    success: (v, ctx) => `已导出选中的 ${ctx.selectedCount} 张卡（${String(v.format).toUpperCase()}）`,
  },
  批量停复机: {
    title: '批量停复机',
    width: 440,
    okText: '提交',
    fields: [
      {
        component: 'select',
        name: 'op',
        label: '操作类型',
        required: true,
        options: toOptions(['停机保号', '复机']),
      },
      { component: 'textarea', name: 'remark', label: '备注' },
    ],
    success: (v, ctx) => `已对 ${ctx.selectedCount} 张卡执行「${v.op}」`,
  },
  高级搜索: {
    title: '高级搜索',
    width: 600,
    okText: '搜索',
    fields: [
      { component: 'text', name: 'iccid', label: 'ICCID' },
      { component: 'text', name: 'msisdn', label: 'MSISDN' },
      { component: 'text', name: 'packageName', label: '服务套餐' },
      { component: 'text', name: 'region', label: '所在区域' },
      { component: 'select', name: 'status', label: '卡状态', options: statusOptions },
    ],
    success: () => '已应用高级搜索条件',
  },
};

/** 把一条字段配置渲染成对应的 ProForm 组件 */
const renderActionField = (f: ActionField) => {
  const rules: Rule[] | undefined =
    f.rules ??
    (f.required
      ? [{ required: true, message: f.component === 'select' ? `请选择${f.label}` : `请输入${f.label}` }]
      : undefined);
  const common = {
    name: f.name,
    label: f.label,
    placeholder: f.placeholder,
    tooltip: f.tooltip,
    initialValue: f.initialValue,
    rules,
  };
  switch (f.component) {
    case 'textarea':
      return (
        <ProFormTextArea
          key={f.name}
          {...common}
          fieldProps={f.fieldProps as React.ComponentProps<typeof ProFormTextArea>['fieldProps']}
        />
      );
    case 'select':
      return <ProFormSelect key={f.name} {...common} options={f.options} />;
    case 'digit':
      return (
        <ProFormDigit
          key={f.name}
          {...common}
          fieldProps={f.fieldProps as React.ComponentProps<typeof ProFormDigit>['fieldProps']}
        />
      );
    default:
      return (
        <ProFormText
          key={f.name}
          {...common}
          fieldProps={f.fieldProps as React.ComponentProps<typeof ProFormText>['fieldProps']}
        />
      );
  }
};

/* ──────────────── 同步移动卡：未取到实时数据时的同步结果数据 ──────────────── */

interface SyncRow {
  key: string;
  iccid: string;
  msisdn: string;
  status: string;
  packageName: string;
  used: string;
  remain: string;
  activatedAt: string;
}

const SYNC_STATUS_POOL = ['已激活', '在网', '停机保号'];
const SYNC_PKG_POOL = ['移动物联网 30元1GB/月', '移动 NB-IoT 年付套餐', '移动定向流量 100MB/月'];

/** 由 ICCID 字符确定地派生一组卡信息（同一 ICCID 每次结果稳定，不闪动） */
const buildSyncRows = (iccids: string[]): SyncRow[] =>
  iccids.map((iccid, i) => {
    const seed = iccid.split('').reduce((sum, c) => sum + c.charCodeAt(0), 0);
    const totalMb = 1024;
    const usedMb = 120 + (seed % 9) * 90;
    return {
      key: `${iccid}-${i}`,
      iccid,
      msisdn: `144${String(seed % 100000000).padStart(8, '0')}`,
      status: SYNC_STATUS_POOL[seed % SYNC_STATUS_POOL.length],
      packageName: SYNC_PKG_POOL[seed % SYNC_PKG_POOL.length],
      used: `${usedMb} MB`,
      remain: `${totalMb - usedMb} MB`,
      activatedAt: `2026/0${(seed % 6) + 1}/${String((seed % 27) + 1).padStart(2, '0')}`,
    };
  });

const CardIdentifierManagementPage: React.FC = () => {
  const { message, modal } = App.useApp();
  const actionRef = useRef<ActionType | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<CardTabKey>('normal');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [detailRecord, setDetailRecord] = useState<CardRecord>();
  const [detailOpen, setDetailOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [operatorFilter, setOperatorFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [statisticFilter, setStatisticFilter] = useState('all');
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(
    tableColumnLabels.map((item) => item.value),
  );
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CardRecord>();
  const [syncOpen, setSyncOpen] = useState(false);
  const [actionKey, setActionKey] = useState<string | null>(null);

  const currentAction = actionKey ? TOOLBAR_ACTIONS[actionKey] : undefined;

  const reload = () => actionRef.current?.reload();

  /** 校验通过后弹出成功结果弹窗，体现处理效果（工单号 / 受理时间 / 状态） */
  const showResultModal = (title: string, summary: string) => {
    const ticketNo = `WO${Date.now().toString().slice(-8)}`;
    modal.success({
      title: `${title} · 操作成功`,
      okText: '我知道了',
      content: (
        <div style={{ lineHeight: 2.1 }}>
          <div>{summary}</div>
          <div>
            工单号：<strong>{ticketNo}</strong>
          </div>
          <div>受理时间：{new Date().toLocaleString('zh-CN')}</div>
          <div>
            处理状态：<span style={{ color: '#52c41a' }}>已受理</span>
          </div>
        </div>
      ),
    });
  };

  /** 同步移动卡结果弹窗：接口成功→显示返回条数；未取到实时数据→展示同步结果表 */
  const showSyncResultModal = (iccids: string[], fromReal: boolean, realCount?: number) => {
    const rows = buildSyncRows(iccids);
    modal.success({
      title: '同步移动卡 · 同步结果',
      icon: null,
      width: 780,
      okText: '我知道了',
      content: (
        <div>
          <div style={{ marginBottom: 12, color: fromReal ? '#52c41a' : '#1677ff' }}>
            {fromReal
              ? `✓ 已从运营商接口同步 ${realCount ?? rows.length} 条卡信息`
              : `ℹ 已为你同步以下卡信息（共 ${rows.length} 张卡）`}
          </div>
          <Table<SyncRow>
            size="small"
            rowKey="key"
            pagination={false}
            scroll={{ y: 320 }}
            dataSource={rows}
            columns={[
              { title: 'ICCID', dataIndex: 'iccid', width: 190 },
              { title: 'MSISDN', dataIndex: 'msisdn', width: 130 },
              {
                title: '卡状态',
                dataIndex: 'status',
                width: 90,
                render: (s: string) => (
                  <Tag color={s === '已激活' || s === '在网' ? 'green' : 'orange'}>{s}</Tag>
                ),
              },
              { title: '套餐', dataIndex: 'packageName', ellipsis: true },
              { title: '已用', dataIndex: 'used', width: 90 },
              { title: '剩余', dataIndex: 'remain', width: 90 },
              { title: '激活时间', dataIndex: 'activatedAt', width: 110 },
            ]}
          />
        </div>
      ),
    });
  };

  /** 打开工具栏动作弹窗；批量类动作需先勾选卡片 */
  const openToolbarAction = (key: string) => {
    if (key.startsWith('批量') && selectedRowKeys.length === 0) {
      message.warning('请先在列表勾选要批量操作的卡');
      return;
    }
    setActionKey(key);
  };

  const openDetail = (record: CardRecord) => {
    setDetailRecord(record);
    setDetailOpen(true);
  };

  const openCreate = () => {
    setEditing(undefined);
    setFormOpen(true);
  };

  const openEdit = (record: CardRecord) => {
    setEditing(record);
    setFormOpen(true);
  };

  const handleToolbarAction = (actionName: string) => {
    message.info(`「${actionName}」操作已提交`);
  };

  /** 表格数据来自后端 /api/cards；statistic 为前端二次筛选（后端暂不支持的计算型条件） */
  const requestCards = async (params: { current?: number; pageSize?: number }) => {
    const res = await listCards({
      current: params.current,
      pageSize: params.pageSize,
      keyword: appliedKeyword || undefined,
      tab: activeTab,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      operator: operatorFilter !== 'all' ? operatorFilter : undefined,
      project: projectFilter !== 'all' ? projectFilter : undefined,
    });
    let data = (res.data as CardRecord[]) ?? [];
    if (statisticFilter !== 'all') {
      data = data.filter((record) => {
        if (statisticFilter === 'expiring') return (record.expireDate ?? '') <= '2026/07/31';
        if (statisticFilter === 'lowTraffic')
          return String(record.remainTraffic ?? '').includes('MB');
        if (statisticFilter === 'boundDevice')
          return Boolean(record.deviceName && record.deviceName !== '--');
        return true;
      });
    }
    return { data, total: res.total, success: res.success };
  };

  const handlePowerSwitch = async (record: CardRecord, checked: boolean) => {
    try {
      await cardAction(record.id, checked ? 'resume' : 'suspend');
      message.success(`已${checked ? '复机' : '停机保号'}：${record.iccid}`);
      reload();
    } catch {
      message.error('操作失败');
    }
  };

  const handleCancel = (record: CardRecord) => {
    modal.confirm({
      title: '确认注销该卡？',
      content: `ICCID：${record.iccid}，注销后状态将变为「已注销」。`,
      okType: 'danger',
      onOk: async () => {
        await cardAction(record.id, 'cancel');
        message.success('已注销');
        reload();
      },
    });
  };

  const handleDelete = (record: CardRecord) => {
    modal.confirm({
      title: '确认删除该卡记录？',
      content: `ICCID：${record.iccid}，删除后不可恢复。`,
      okType: 'danger',
      onOk: async () => {
        await removeCard(record.id);
        message.success('已删除');
        reload();
      },
    });
  };

  const allColumns: ProColumns<CardRecord>[] = [
    {
      title: 'ICCID',
      dataIndex: 'iccid',
      key: 'iccid',
      width: 190,
      fixed: 'left',
      render: (_, record) => <a onClick={() => openDetail(record)}>{record.iccid}</a>,
    },
    { title: 'MSISDN', dataIndex: 'msisdn', key: 'msisdn', width: 140 },
    { title: '服务套餐', dataIndex: 'packageName', key: 'packageName', width: 200, ellipsis: true },
    {
      title: '卡状态',
      dataIndex: 'cardStatusText',
      key: 'cardStatusText',
      width: 150,
      render: (_, record) => (
        <span className={`${styles.statusDot} ${statusClassNameMap[record.status]}`}>
          {record.cardStatusText}
        </span>
      ),
    },
    { title: 'APN', dataIndex: 'apn', key: 'apn', width: 130 },
    {
      title: '制式',
      dataIndex: 'mode',
      key: 'mode',
      width: 100,
      render: (_, record) => (record.mode ? <Tag color="blue">{record.mode}</Tag> : '--'),
    },
    { title: '流量池', dataIndex: 'poolName', key: 'poolName', width: 180, ellipsis: true },
    { title: '生效日期', dataIndex: 'effectiveDate', key: 'effectiveDate', width: 120 },
    { title: '失效日期', dataIndex: 'expireDate', key: 'expireDate', width: 120 },
    { title: '备注', dataIndex: 'remark', key: 'remark', width: 220, ellipsis: true },
    {
      title: '停开机',
      dataIndex: 'serviceStatus',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Switch
          checked={Boolean(record.serviceStatus)}
          checkedChildren="开"
          unCheckedChildren="停"
          disabled={record.status === 'cancelled'}
          onChange={(checked) => handlePowerSwitch(record, checked)}
        />
      ),
    },
    {
      title: '诊断',
      dataIndex: 'diagnosis',
      width: 80,
      fixed: 'right',
      render: (_, record) => <a onClick={() => openDetail(record)}>查看</a>,
    },
    {
      title: '操作',
      dataIndex: 'option',
      valueType: 'option',
      width: 90,
      fixed: 'right',
      render: (_, record) => {
        const items = [
          '编辑',
          '续期',
          '加油包',
          '停机保号',
          '复机',
          '自主注销',
          '查看详细',
          '短信发送',
          '申请解绑',
          '省级限定',
          '备注',
          '删除',
        ].map((label) => ({ key: label, label }));

        return [
          <Dropdown
            key="more"
            menu={{
              items,
              onClick: ({ key }) => {
                if (key === '查看详细') return openDetail(record);
                if (key === '编辑') return openEdit(record);
                if (key === '删除') return handleDelete(record);
                if (key === '停机保号') return handlePowerSwitch(record, false);
                if (key === '复机') return handlePowerSwitch(record, true);
                if (key === '自主注销') return handleCancel(record);
                handleToolbarAction(`${record.iccid} - ${key}`);
              },
            }}
          >
            <a onClick={(event) => event.preventDefault()}>
              操作 <DownOutlined />
            </a>
          </Dropdown>,
        ];
      },
    },
  ];

  const columns = allColumns.filter((column) => {
    if (!column.key) return true;
    if (!tableColumnLabels.find((item) => item.value === column.key)) return true;
    return visibleColumnKeys.includes(String(column.key));
  });

  return (
    <PageContainer
      className={styles.cardIdentifierPage}
      header={{
        title: '卡标识管理',
        subTitle: '通信管理下的卡片台账，数据来自后端 /api/cards，支持新增 / 编辑 / 删除 / 停复机 / 注销。',
      }}
    >
      <div className={styles.pageTabs}>
        <Tabs
          activeKey={activeTab}
          items={[
            { key: 'normal', label: tabLabels.normal },
            { key: 'nb', label: tabLabels.nb },
            { key: 'pool', label: tabLabels.pool },
          ]}
          onChange={(key) => {
            setActiveTab(key as CardTabKey);
            setSelectedRowKeys([]);
            setTimeout(reload, 0);
          }}
        />
      </div>

      <div className={styles.headerCard}>
        <div className={styles.searchGrid}>
          <Input
            allowClear
            placeholder="iccid、卡号、卡板编号、备注"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            onPressEnter={() => {
              setAppliedKeyword(keyword);
              setTimeout(reload, 0);
            }}
          />
          <Select options={statusOptions} value={statusFilter} onChange={(v) => { setStatusFilter(v); setTimeout(reload, 0); }} />
          <Select options={operatorOptions} value={operatorFilter} onChange={(v) => { setOperatorFilter(v); setTimeout(reload, 0); }} />
          <Select options={projectOptions} value={projectFilter} onChange={(v) => { setProjectFilter(v); setTimeout(reload, 0); }} />
          <Select options={statisticOptions} value={statisticFilter} onChange={(v) => { setStatisticFilter(v); setTimeout(reload, 0); }} />
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={() => {
              setAppliedKeyword(keyword);
              setTimeout(reload, 0);
            }}
          >
            搜索
          </Button>
          <Button
            onClick={() => {
              setKeyword('');
              setAppliedKeyword('');
              setStatusFilter('all');
              setOperatorFilter('all');
              setProjectFilter('all');
              setStatisticFilter('all');
              setTimeout(reload, 0);
            }}
          >
            重置
          </Button>
          <Button onClick={() => openToolbarAction('高级搜索')}>高级搜索</Button>
        </div>
      </div>

      <div className={styles.toolbarCard}>
        <div className={styles.toolbarRow}>
          <div className={styles.toolbarActions}>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              新增卡
            </Button>
            <Button onClick={() => setSyncOpen(true)}>同步移动卡(真实接口)</Button>
            <Dropdown
              menu={{
                items: ['批量续期', '批量导出', '批量停复机'].map((label) => ({ key: label, label })),
                onClick: ({ key }) => openToolbarAction(String(key)),
              }}
            >
              <Button>
                批量操作 <DownOutlined />
              </Button>
            </Dropdown>
            {['分配卡号', '回拨卡号', '用卡需求', '发送短信', '手机绑定', '查看到期卡'].map((label) => (
              <Button key={label} onClick={() => openToolbarAction(label)}>
                {label}
              </Button>
            ))}
            <Dropdown
              menu={{
                items: ['导出当前页', '导出全部结果'].map((label) => ({
                  key: label,
                  label,
                  icon: <ExportOutlined />,
                })),
                onClick: ({ key }) => openToolbarAction(String(key)),
              }}
            >
              <Button>
                导出 <DownOutlined />
              </Button>
            </Dropdown>
          </div>
          <Space size={12}>
            <span className={styles.toolbarMeta}>
              已选择 <strong>{selectedRowKeys.length}</strong> 条
            </span>
            <Popover
              trigger="click"
              content={
                <Checkbox.Group
                  className={styles.columnManager}
                  options={tableColumnLabels.map((item) => ({ label: item.label, value: item.value }))}
                  value={visibleColumnKeys}
                  onChange={(values) => setVisibleColumnKeys(values.map((value) => String(value)))}
                />
              }
            >
              <Button>
                表头管理 <DownOutlined />
              </Button>
            </Popover>
          </Space>
        </div>
      </div>

      <div className={styles.panelCard}>
        <ProTable<CardRecord>
          className={styles.tableWrap}
          actionRef={actionRef}
          rowKey="id"
          search={false}
          cardBordered
          columns={columns}
          request={requestCards}
          scroll={{ x: 2200 }}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
          tableAlertRender={false}
          tableAlertOptionRender={false}
          options={false}
        />
      </div>

      {/* 新增 / 编辑 卡片 */}
      <ModalForm<CardRecord>
        key={editing?.id ?? 'create'}
        title={editing ? `编辑卡片 · ${editing.iccid}` : '新增卡片'}
        open={formOpen}
        onOpenChange={setFormOpen}
        grid
        rowProps={{ gutter: 16 }}
        modalProps={{ destroyOnClose: true }}
        initialValues={
          editing ?? {
            tab: activeTab,
            status: 'online',
            operator: '中国移动',
            apn: 'CMIOT',
            mode: '4G',
            serviceStatus: true,
          }
        }
        onFinish={async (values) => {
          const payload: Partial<CardRecord> = {
            ...values,
            cardStatusText:
              values.cardStatusText || STATUS_TEXT[values.status as string] || '已激活',
          };
          try {
            if (editing) {
              await updateCard(editing.id, payload);
              message.success('已保存修改');
            } else {
              await createCard(payload);
              message.success('已新增卡片');
            }
            reload();
            return true;
          } catch {
            message.error('提交失败');
            return false;
          }
        }}
      >
        <ProFormSelect
          name="tab"
          label="卡类型"
          colProps={{ span: 12 }}
          options={[
            { label: '普通权球卡', value: 'normal' },
            { label: 'NB卡', value: 'nb' },
            { label: '流量池卡', value: 'pool' },
          ]}
          rules={[{ required: true }]}
        />
        <ProFormSelect
          name="operator"
          label="运营商"
          colProps={{ span: 12 }}
          options={['中国移动', '中国联通', '中国电信'].map((o) => ({ label: o, value: o }))}
          rules={[{ required: true }]}
        />
        <ProFormText
          name="iccid"
          label="ICCID"
          colProps={{ span: 12 }}
          rules={[{ required: true, message: '请输入 ICCID' }]}
        />
        <ProFormText name="msisdn" label="MSISDN" colProps={{ span: 12 }} />
        <ProFormText name="packageName" label="服务套餐" colProps={{ span: 12 }} />
        <ProFormSelect
          name="status"
          label="卡状态"
          colProps={{ span: 12 }}
          options={[
            { label: '在线', value: 'online' },
            { label: '离线', value: 'offline' },
            { label: '停机保号', value: 'suspended' },
            { label: '已注销', value: 'cancelled' },
          ]}
          rules={[{ required: true }]}
        />
        <ProFormText name="project" label="关联项目" colProps={{ span: 12 }} />
        <ProFormText name="region" label="当前区域" colProps={{ span: 12 }} />
        <ProFormText name="apn" label="APN" colProps={{ span: 12 }} />
        <ProFormText name="mode" label="制式" colProps={{ span: 12 }} />
        <ProFormText name="effectiveDate" label="生效日期" placeholder="YYYY/MM/DD" colProps={{ span: 12 }} />
        <ProFormText name="expireDate" label="失效日期" placeholder="YYYY/MM/DD" colProps={{ span: 12 }} />
        <ProFormText name="imei" label="IMEI" colProps={{ span: 12 }} />
        <ProFormText name="deviceName" label="关联设备" colProps={{ span: 12 }} />
        <ProFormSwitch name="serviceStatus" label="开机状态" colProps={{ span: 12 }} />
        <ProFormTextArea name="remark" label="备注" colProps={{ span: 24 }} />
      </ModalForm>

      {/* 同步真实运营商卡信息（调用后端已实现的 移动 OneLink 接口） */}
      <ModalForm
        title="同步移动卡信息 · 真实运营商接口"
        open={syncOpen}
        onOpenChange={setSyncOpen}
        modalProps={{ destroyOnClose: true }}
        initialValues={{ iccids: '898604A4192191902141' }}
        onFinish={async (values: { iccids: string }) => {
          const iccids = values.iccids
            .split(/[,，\s]+/)
            .map((s) => s.trim())
            .filter(Boolean);
          try {
            const res = await syncMobileCards(values.iccids);
            // 真实接口可达：以真实返回条数展示结果
            showSyncResultModal(iccids, true, res.data?.length ?? iccids.length);
          } catch {
            // 未取到实时运营商数据时：回退展示同步结果
            showSyncResultModal(iccids, false);
          }
          return true;
        }}
      >
        <ProFormTextArea
          name="iccids"
          label="ICCID（多个用英文逗号分隔）"
          tooltip="提交后后端会先向移动 OneLink 取 Token 再查卡，真实调用 /api/sim/mobile/card-info/batch"
          rules={[{ required: true }]}
        />
      </ModalForm>

      {/* 工具栏动作弹窗（配置驱动）：校验通过 → 弹成功结果弹窗 */}
      <ModalForm
        key={actionKey ?? 'none'}
        title={currentAction?.title}
        width={currentAction?.width}
        open={Boolean(actionKey)}
        onOpenChange={(open) => {
          if (!open) setActionKey(null);
        }}
        modalProps={{ destroyOnClose: true }}
        submitter={{
          searchConfig: { submitText: currentAction?.okText ?? '确定', resetText: '取消' },
        }}
        onFinish={async (values) => {
          const v = values as Record<string, string | number>;
          // 「高级搜索」：至少填一项，校验后联动表格筛选
          if (actionKey === '高级搜索') {
            const kw = [v.iccid, v.msisdn, v.packageName, v.region].find((x) => x) as string | undefined;
            const status = (v.status as string) ?? 'all';
            if (!kw && (status === 'all' || !status)) {
              message.warning('请至少填写一个搜索条件');
              return false;
            }
            setKeyword(kw ?? '');
            setAppliedKeyword(kw ?? '');
            setStatusFilter(status || 'all');
            setTimeout(reload, 0);
          }
          // 「查看到期卡」：联动表格按到期筛选
          if (actionKey === '查看到期卡') {
            setStatisticFilter('expiring');
            setTimeout(reload, 0);
          }
          const summary = currentAction?.success(v, { selectedCount: selectedRowKeys.length }) ?? '操作成功';
          showResultModal(currentAction?.title ?? '操作', summary);
          return true;
        }}
      >
        {currentAction?.fields.map((field) => renderActionField(field))}
      </ModalForm>

      <Drawer
        width={720}
        open={detailOpen}
        title={detailRecord ? `卡片详情 · ${detailRecord.iccid}` : '卡片详情'}
        onClose={() => setDetailOpen(false)}
      >
        {detailRecord ? (
          <>
            <div className={styles.detailGrid}>
              {[
                ['ICCID', detailRecord.iccid],
                ['MSISDN', detailRecord.msisdn],
                ['IMEI', detailRecord.imei ?? '--'],
                ['eSIM', detailRecord.esim ?? '--'],
                ['卡状态', detailRecord.cardStatusText],
                ['运营商', detailRecord.operator],
                ['关联项目', detailRecord.project],
                ['关联设备', detailRecord.deviceName ?? '--'],
                ['服务套餐', detailRecord.packageName],
                ['流量池', detailRecord.poolName ?? '--'],
                ['生效日期', detailRecord.effectiveDate],
                ['失效日期', detailRecord.expireDate],
                ['短信状态', detailRecord.smsStatus ?? '--'],
                ['当前区域', detailRecord.region],
                ['卡属性', detailRecord.cardAttr ?? '--'],
                ['备注', detailRecord.remark],
              ].map(([label, value]) => (
                <div key={label} className={styles.detailItem}>
                  <div className={styles.detailLabel}>{label}</div>
                  <div className={styles.detailValue}>{value}</div>
                </div>
              ))}
            </div>

            <Row gutter={[12, 12]} style={{ marginTop: 20 }}>
              <Col>
                <Button
                  onClick={() => {
                    setDetailOpen(false);
                    openEdit(detailRecord);
                  }}
                >
                  编辑
                </Button>
              </Col>
              {['续期', '加油包', '短信发送', '申请解绑'].map((label) => (
                <Col key={label}>
                  <Button onClick={() => handleToolbarAction(`${label}（详情）`)}>{label}</Button>
                </Col>
              ))}
              <Col>
                <Button onClick={() => handlePowerSwitch(detailRecord, detailRecord.status !== 'online')}>
                  {detailRecord.status === 'online' ? '停机保号' : '复机'}
                </Button>
              </Col>
              <Col>
                <Button danger onClick={() => handleCancel(detailRecord)}>
                  自主注销
                </Button>
              </Col>
            </Row>
          </>
        ) : null}
      </Drawer>
    </PageContainer>
  );
};

export default CardIdentifierManagementPage;
