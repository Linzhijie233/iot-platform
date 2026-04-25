import type { ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Alert, App, Button, Descriptions, Drawer, Input, Modal, Select, Space, Tag } from 'antd';
import React, { useMemo, useState } from 'react';
import styles from './index.less';

type SubscriptionStatus = 'active' | 'expiring' | 'paused' | 'expired';

type ServiceSubscriptionRecord = {
  id: string;
  subscriptionNo: string;
  customerName: string;
  productName: string;
  instanceName: string;
  billingMode: string;
  status: SubscriptionStatus;
  startDate: string;
  expireDate: string;
  remainingDays: number;
  renewStatus: '已开启' | '未开启';
  serviceOwner: string;
  latestActionTime: string;
  description: string;
};

const statusMeta: Record<
  SubscriptionStatus,
  { label: string; color: string; hint: string; tagColor: string }
> = {
  active: {
    label: '订阅中',
    color: '#16a34a',
    hint: '服务实例正常生效，可继续订阅与续费',
    tagColor: 'success',
  },
  expiring: {
    label: '即将到期',
    color: '#f59e0b',
    hint: '有效期临近，需要尽快续费或调整服务方案',
    tagColor: 'warning',
  },
  paused: {
    label: '已暂停',
    color: '#ef4444',
    hint: '服务实例已暂停，需要确认恢复或停服策略',
    tagColor: 'error',
  },
  expired: {
    label: '已到期',
    color: '#64748b',
    hint: '订阅实例已结束，待续费、归档或重新开通',
    tagColor: 'default',
  },
};

const subscriptionRecords: ServiceSubscriptionRecord[] = [
  {
    id: 'sub-1',
    subscriptionNo: 'SUB-2026-0001',
    customerName: '顺运冷链',
    productName: '设备在线监测服务',
    instanceName: '冷链监测标准版',
    billingMode: '包年',
    status: 'active',
    startDate: '2026-01-01',
    expireDate: '2026-12-31',
    remainingDays: 263,
    renewStatus: '已开启',
    serviceOwner: '客户成功组',
    latestActionTime: '2026-04-11 10:20',
    description: '用于冷链设备在线率监测和离线预警。',
  },
  {
    id: 'sub-2',
    subscriptionNo: 'SUB-2026-0002',
    customerName: '新零售事业部',
    productName: '设备异常告警服务',
    instanceName: '门店告警协同版',
    billingMode: '包月',
    status: 'expiring',
    startDate: '2026-03-21',
    expireDate: '2026-04-20',
    remainingDays: 8,
    renewStatus: '未开启',
    serviceOwner: '客服支持组',
    latestActionTime: '2026-04-11 17:40',
    description: '用于售货设备异常告警和客服协同跟进。',
  },
  {
    id: 'sub-3',
    subscriptionNo: 'SUB-2026-0003',
    customerName: '城市水务',
    productName: '守护码映射服务',
    instanceName: '水务映射能力试运行',
    billingMode: '按量',
    status: 'paused',
    startDate: '2026-02-15',
    expireDate: '2026-08-14',
    remainingDays: 124,
    renewStatus: '未开启',
    serviceOwner: '平台产品组',
    latestActionTime: '2026-04-10 14:05',
    description: '用于设备编号、ICCID 和守护码映射的内部能力实例。',
  },
  {
    id: 'sub-4',
    subscriptionNo: 'SUB-2026-0004',
    customerName: '车联网项目组',
    productName: '客服协同服务',
    instanceName: '车辆售后支撑版',
    billingMode: '包季',
    status: 'expired',
    startDate: '2025-12-01',
    expireDate: '2026-03-31',
    remainingDays: -12,
    renewStatus: '未开启',
    serviceOwner: '客服支持组',
    latestActionTime: '2026-04-01 09:30',
    description: '用于服务异常流转、客服协同和升级处理。',
  },
];

const billingModeOptions = [
  { label: '全部计费模式', value: 'all' },
  ...Array.from(new Set(subscriptionRecords.map((item) => item.billingMode))).map((item) => ({
    label: item,
    value: item,
  })),
];

const customerOptions = [
  { label: '全部客户', value: 'all' },
  ...Array.from(new Set(subscriptionRecords.map((item) => item.customerName))).map((item) => ({
    label: item,
    value: item,
  })),
];

const ServiceSubscriptionPage: React.FC = () => {
  const { message } = App.useApp();
  const [keyword, setKeyword] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | SubscriptionStatus>('all');
  const [selectedBillingMode, setSelectedBillingMode] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState('all');
  const [detailRecord, setDetailRecord] = useState<ServiceSubscriptionRecord>();
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);

  const overviewStats = useMemo(
    () =>
      (Object.keys(statusMeta) as SubscriptionStatus[]).map((key) => ({
        key,
        count: subscriptionRecords.filter((item) => item.status === key).length,
        ...statusMeta[key],
      })),
    [],
  );

  const filteredRecords = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    return subscriptionRecords.filter((item) => {
      const matchesKeyword =
        !normalizedKeyword ||
        [
          item.subscriptionNo,
          item.customerName,
          item.productName,
          item.instanceName,
          item.serviceOwner,
        ]
          .join('|')
          .toLowerCase()
          .includes(normalizedKeyword);

      const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
      const matchesBillingMode =
        selectedBillingMode === 'all' || item.billingMode === selectedBillingMode;
      const matchesCustomer = selectedCustomer === 'all' || item.customerName === selectedCustomer;

      return matchesKeyword && matchesStatus && matchesBillingMode && matchesCustomer;
    });
  }, [keyword, selectedBillingMode, selectedCustomer, selectedStatus]);

  const columns: ProColumns<ServiceSubscriptionRecord>[] = [
    {
      title: '订阅单号',
      dataIndex: 'subscriptionNo',
      width: 160,
      fixed: 'left',
      render: (_, record) => (
        <a className={styles.subscriptionLink} onClick={() => setDetailRecord(record)}>
          {record.subscriptionNo}
        </a>
      ),
    },
    { title: '客户', dataIndex: 'customerName', width: 140 },
    { title: '服务产品', dataIndex: 'productName', width: 180 },
    { title: '服务实例', dataIndex: 'instanceName', width: 180 },
    { title: '计费模式', dataIndex: 'billingMode', width: 110 },
    {
      title: '订阅状态',
      dataIndex: 'status',
      width: 110,
      render: (_, record) => (
        <Tag color={statusMeta[record.status].tagColor}>{statusMeta[record.status].label}</Tag>
      ),
    },
    { title: '生效时间', dataIndex: 'startDate', width: 120 },
    { title: '到期时间', dataIndex: 'expireDate', width: 120 },
    {
      title: '剩余天数',
      dataIndex: 'remainingDays',
      width: 100,
      render: (_, record) => (
        <span style={{ color: record.remainingDays <= 15 ? '#dc2626' : undefined }}>
          {record.remainingDays}
        </span>
      ),
    },
    { title: '自动续费', dataIndex: 'renewStatus', width: 100 },
    { title: '服务负责人', dataIndex: 'serviceOwner', width: 120 },
    { title: '最近处理时间', dataIndex: 'latestActionTime', width: 160 },
    {
      title: '操作',
      dataIndex: 'action',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <span className={styles.actionLinks}>
          <a onClick={() => setDetailRecord(record)}>详情</a>
          <a onClick={() => setAdjustModalOpen(true)}>调整订阅</a>
          <a
            onClick={() => message.info(`${record.subscriptionNo} 为静态${record.status === 'paused' ? '恢复' : '停服'}入口`)}
          >
            {record.status === 'paused' ? '恢复' : '停服'}
          </a>
        </span>
      ),
    },
  ];

  return (
    <PageContainer
      className={styles.serviceSubscriptionPage}
      header={{
        title: '服务订阅',
        subTitle: '统一管理客户服务实例、有效期、续费状态和订阅调整入口。',
      }}
    >
      <div className={styles.overviewGrid}>
        {overviewStats.map((item) => {
          const active = selectedStatus === item.key;
          return (
            <button
              className={`${styles.overviewCard} ${active ? styles.overviewCardActive : ''}`}
              key={item.key}
              onClick={() => setSelectedStatus(active ? 'all' : item.key)}
              style={{ ['--accent-color' as string]: item.color }}
              type="button"
            >
              <div className={styles.overviewHead}>
                <span>{item.label}</span>
                <strong>{item.count}</strong>
              </div>
              <div className={styles.overviewHint}>{item.hint}</div>
            </button>
          );
        })}
      </div>

      <div className={styles.alertCard}>
        <Alert
          banner
          message="当前有 2 条订阅需要优先跟进：1 条即将到期、1 条已到期，建议先处理新零售和车联网客户。"
          type="warning"
        />
      </div>

      <div className={styles.filterCard}>
        <div className={styles.searchGrid}>
          <Input
            allowClear
            placeholder="搜索订阅单号 / 客户 / 产品 / 服务实例"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
          <Select
            options={[
              { label: '全部订阅状态', value: 'all' },
              ...overviewStats.map((item) => ({ label: item.label, value: item.key })),
            ]}
            value={selectedStatus}
            onChange={setSelectedStatus}
          />
          <Select
            options={billingModeOptions}
            value={selectedBillingMode}
            onChange={setSelectedBillingMode}
          />
          <Select
            options={customerOptions}
            value={selectedCustomer}
            onChange={setSelectedCustomer}
          />
          <Space>
            <Button type="primary" onClick={() => message.success('已按静态条件刷新订阅列表')}>
              搜索
            </Button>
            <Button
              onClick={() => {
                setKeyword('');
                setSelectedStatus('all');
                setSelectedBillingMode('all');
                setSelectedCustomer('all');
              }}
            >
              重置
            </Button>
          </Space>
        </div>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableMeta}>
          <span>
            当前结果 <strong>{filteredRecords.length}</strong> 条
          </span>
          <Space size={12}>
            <span>列表页提供订阅查看与静态处理入口，不承载真实计费、结算和审批流程。</span>
            <Button type="primary" onClick={() => setAdjustModalOpen(true)}>
              新建订阅
            </Button>
          </Space>
        </div>
        <ProTable<ServiceSubscriptionRecord>
          cardBordered
          className={styles.tableWrap}
          columns={columns}
          dataSource={filteredRecords}
          options={false}
          pagination={{
            pageSize: 10,
            showQuickJumper: true,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          rowKey="id"
          scroll={{ x: 1900 }}
          search={false}
          tableAlertRender={false}
          tableAlertOptionRender={false}
          toolbar={undefined}
        />
      </div>

      <Drawer
        destroyOnHidden
        onClose={() => setDetailRecord(undefined)}
        open={Boolean(detailRecord)}
        title={detailRecord ? `${detailRecord.subscriptionNo} 订阅详情` : '订阅详情'}
        width={720}
      >
        {detailRecord ? (
          <Space direction="vertical" size={16} style={{ display: 'flex' }}>
            <Alert message={detailRecord.description} type="info" showIcon />
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="订阅单号">{detailRecord.subscriptionNo}</Descriptions.Item>
              <Descriptions.Item label="客户">{detailRecord.customerName}</Descriptions.Item>
              <Descriptions.Item label="服务产品">{detailRecord.productName}</Descriptions.Item>
              <Descriptions.Item label="服务实例">{detailRecord.instanceName}</Descriptions.Item>
              <Descriptions.Item label="计费模式">{detailRecord.billingMode}</Descriptions.Item>
              <Descriptions.Item label="订阅状态">
                <Tag color={statusMeta[detailRecord.status].tagColor}>
                  {statusMeta[detailRecord.status].label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="生效时间">{detailRecord.startDate}</Descriptions.Item>
              <Descriptions.Item label="到期时间">{detailRecord.expireDate}</Descriptions.Item>
              <Descriptions.Item label="剩余天数">{detailRecord.remainingDays}</Descriptions.Item>
              <Descriptions.Item label="自动续费">{detailRecord.renewStatus}</Descriptions.Item>
              <Descriptions.Item label="服务负责人">{detailRecord.serviceOwner}</Descriptions.Item>
              <Descriptions.Item label="最近处理时间">{detailRecord.latestActionTime}</Descriptions.Item>
            </Descriptions>

            <div>
              <div className={styles.sectionTitle}>订阅摘要</div>
              <div className={styles.metricGrid}>
                {[
                  ['续费状态', detailRecord.renewStatus],
                  ['有效期', `${detailRecord.startDate} ~ ${detailRecord.expireDate}`],
                  ['当前状态', statusMeta[detailRecord.status].label],
                  ['负责人', detailRecord.serviceOwner],
                ].map(([label, value]) => (
                  <div className={styles.metricCard} key={label}>
                    <div className={styles.metricLabel}>{label}</div>
                    <div className={styles.metricValue}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </Space>
        ) : null}
      </Drawer>

      <Modal
        destroyOnHidden
        okText="提交调整"
        onCancel={() => setAdjustModalOpen(false)}
        onOk={() => {
          message.success('已触发静态提交：订阅调整申请已生成');
          setAdjustModalOpen(false);
        }}
        open={adjustModalOpen}
        title="订阅调整"
        width={760}
      >
        <Space direction="vertical" size={16} style={{ display: 'flex' }}>
          <Alert
            message="当前为静态演示流程，用于表达新建订阅、续费、升级或停服调整入口。"
            showIcon
            type="info"
          />
          <div>
            <div className={styles.sectionTitle}>建议操作项</div>
            <div className={styles.metricGrid}>
              {[
                ['新建订阅', '选择服务产品、客户对象、生效时间和计费模式'],
                ['续费处理', '延长有效期、补充续费策略、调整自动续费'],
                ['升级处理', '切换更高版本服务包或增加扩展能力'],
                ['停服处理', '暂停实例、设置停服原因并通知相关责任人'],
              ].map(([label, value]) => (
                <div className={styles.metricCard} key={label}>
                  <div className={styles.metricLabel}>{label}</div>
                  <div className={styles.metricText}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        </Space>
      </Modal>
    </PageContainer>
  );
};

export default ServiceSubscriptionPage;
