import type { ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Alert, App, Button, Descriptions, Drawer, Input, Modal, Select, Space, Tag } from 'antd';
import React, { useMemo, useState } from 'react';
import styles from './index.less';

type ProductStatus = 'enabled' | 'draft' | 'paused' | 'expiring';

type ServiceProductRecord = {
  id: string;
  productCode: string;
  productName: string;
  productType: string;
  targetCustomer: string;
  billingMode: string;
  status: ProductStatus;
  price: string;
  validPeriod: string;
  activeSubscriptions: number;
  renewRate: string;
  latestUpdateTime: string;
  owner: string;
  slaLevel: string;
  description: string;
};

const statusMeta: Record<
  ProductStatus,
  { label: string; color: string; hint: string; tagColor: string }
> = {
  enabled: {
    label: '已上架',
    color: '#16a34a',
    hint: '服务产品可正常订阅与续费',
    tagColor: 'success',
  },
  draft: {
    label: '草稿中',
    color: '#64748b',
    hint: '产品配置未发布，仅供内部编辑',
    tagColor: 'default',
  },
  paused: {
    label: '已暂停',
    color: '#ef4444',
    hint: '暂停新订阅，历史实例待进一步处理',
    tagColor: 'error',
  },
  expiring: {
    label: '待调整',
    color: '#f59e0b',
    hint: '资费或有效期策略即将到达调整窗口',
    tagColor: 'warning',
  },
};

const serviceProducts: ServiceProductRecord[] = [
  {
    id: 'svc-1',
    productCode: 'SVP-IOT-MONITOR-001',
    productName: '设备在线监测服务',
    productType: '监控服务',
    targetCustomer: '企业客户',
    billingMode: '包年',
    status: 'enabled',
    price: '199 元/年',
    validPeriod: '12 个月',
    activeSubscriptions: 128,
    renewRate: '81%',
    latestUpdateTime: '2026-04-11 16:20',
    owner: '服务运营组',
    slaLevel: 'SLA-L2',
    description: '提供设备在线率统计、离线预警和基础报表能力。',
  },
  {
    id: 'svc-2',
    productCode: 'SVP-IOT-ALERT-003',
    productName: '设备异常告警服务',
    productType: '告警服务',
    targetCustomer: '企业客户',
    billingMode: '包月',
    status: 'enabled',
    price: '39 元/月',
    validPeriod: '1 个月',
    activeSubscriptions: 246,
    renewRate: '74%',
    latestUpdateTime: '2026-04-10 09:40',
    owner: '服务运营组',
    slaLevel: 'SLA-L1',
    description: '提供多阈值规则告警、通知触达和异常跟踪。',
  },
  {
    id: 'svc-3',
    productCode: 'SVP-IOT-GUARD-008',
    productName: '守护码映射服务',
    productType: '基础服务',
    targetCustomer: '平台内部',
    billingMode: '按量',
    status: 'draft',
    price: '0.08 元/次',
    validPeriod: '按调用周期',
    activeSubscriptions: 0,
    renewRate: '--',
    latestUpdateTime: '2026-04-09 13:15',
    owner: '平台产品组',
    slaLevel: 'SLA-L3',
    description: '提供设备守护码、ICCID 和设备编号的映射能力。',
  },
  {
    id: 'svc-4',
    productCode: 'SVP-IOT-CS-012',
    productName: '客服协同服务',
    productType: '协同服务',
    targetCustomer: '企业客户',
    billingMode: '包季',
    status: 'paused',
    price: '299 元/季',
    validPeriod: '3 个月',
    activeSubscriptions: 32,
    renewRate: '55%',
    latestUpdateTime: '2026-04-08 18:05',
    owner: '客服支持组',
    slaLevel: 'SLA-L2',
    description: '统一管理服务异常通知、客服工单协同和升级处理。',
  },
];

const productTypeOptions = [
  { label: '全部产品类型', value: 'all' },
  ...Array.from(new Set(serviceProducts.map((item) => item.productType))).map((item) => ({
    label: item,
    value: item,
  })),
];

const billingModeOptions = [
  { label: '全部计费模式', value: 'all' },
  ...Array.from(new Set(serviceProducts.map((item) => item.billingMode))).map((item) => ({
    label: item,
    value: item,
  })),
];

const ServiceProductPage: React.FC = () => {
  const { message } = App.useApp();
  const [keyword, setKeyword] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | ProductStatus>('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedBillingMode, setSelectedBillingMode] = useState('all');
  const [detailRecord, setDetailRecord] = useState<ServiceProductRecord>();
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const overviewStats = useMemo(
    () =>
      (Object.keys(statusMeta) as ProductStatus[]).map((key) => ({
        key,
        count: serviceProducts.filter((item) => item.status === key).length,
        ...statusMeta[key],
      })),
    [],
  );

  const filteredRecords = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    return serviceProducts.filter((item) => {
      const matchesKeyword =
        !normalizedKeyword ||
        [
          item.productCode,
          item.productName,
          item.productType,
          item.targetCustomer,
          item.owner,
        ]
          .join('|')
          .toLowerCase()
          .includes(normalizedKeyword);

      const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
      const matchesType = selectedType === 'all' || item.productType === selectedType;
      const matchesBillingMode =
        selectedBillingMode === 'all' || item.billingMode === selectedBillingMode;

      return matchesKeyword && matchesStatus && matchesType && matchesBillingMode;
    });
  }, [keyword, selectedBillingMode, selectedStatus, selectedType]);

  const columns: ProColumns<ServiceProductRecord>[] = [
    {
      title: '产品编码',
      dataIndex: 'productCode',
      width: 180,
      fixed: 'left',
      render: (_, record) => (
        <a className={styles.productLink} onClick={() => setDetailRecord(record)}>
          {record.productCode}
        </a>
      ),
    },
    { title: '产品名称', dataIndex: 'productName', width: 180 },
    { title: '产品类型', dataIndex: 'productType', width: 120 },
    { title: '目标客户', dataIndex: 'targetCustomer', width: 120 },
    { title: '计费模式', dataIndex: 'billingMode', width: 110 },
    {
      title: '产品状态',
      dataIndex: 'status',
      width: 110,
      render: (_, record) => (
        <Tag color={statusMeta[record.status].tagColor}>{statusMeta[record.status].label}</Tag>
      ),
    },
    { title: '标准价格', dataIndex: 'price', width: 120 },
    { title: '有效期', dataIndex: 'validPeriod', width: 120 },
    { title: '订阅中实例', dataIndex: 'activeSubscriptions', width: 120 },
    { title: '续费率', dataIndex: 'renewRate', width: 100 },
    { title: '归属团队', dataIndex: 'owner', width: 120 },
    { title: '最近更新时间', dataIndex: 'latestUpdateTime', width: 160 },
    {
      title: '操作',
      dataIndex: 'action',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <span className={styles.actionLinks}>
          <a onClick={() => setDetailRecord(record)}>详情</a>
          <a onClick={() => message.info(`${record.productCode} 为静态编辑入口`)}>编辑</a>
          <a
            onClick={() =>
              message.info(
                `${record.productCode} 为静态${record.status === 'enabled' ? '暂停' : '上架'}入口`,
              )
            }
          >
            {record.status === 'enabled' ? '暂停' : '上架'}
          </a>
        </span>
      ),
    },
  ];

  return (
    <PageContainer
      className={styles.serviceProductPage}
      header={{
        title: '服务产品',
        subTitle: '统一管理服务包定义、计费模式、有效期策略和产品状态。',
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
          message="当前有 2 个服务产品需要重点关注：1 个草稿待发布、1 个协同服务已暂停，建议先梳理计费与订阅策略。"
          type="warning"
        />
      </div>

      <div className={styles.filterCard}>
        <div className={styles.searchGrid}>
          <Input
            allowClear
            placeholder="搜索产品编码 / 名称 / 类型 / 团队"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
          <Select
            options={[
              { label: '全部产品状态', value: 'all' },
              ...overviewStats.map((item) => ({ label: item.label, value: item.key })),
            ]}
            value={selectedStatus}
            onChange={setSelectedStatus}
          />
          <Select options={productTypeOptions} value={selectedType} onChange={setSelectedType} />
          <Select
            options={billingModeOptions}
            value={selectedBillingMode}
            onChange={setSelectedBillingMode}
          />
          <Space>
            <Button type="primary" onClick={() => message.success('已按静态条件刷新服务产品列表')}>
              搜索
            </Button>
            <Button
              onClick={() => {
                setKeyword('');
                setSelectedStatus('all');
                setSelectedType('all');
                setSelectedBillingMode('all');
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
            <span>列表页提供产品查看与静态操作入口，不承载真实定价、审批和发布流程。</span>
            <Button type="primary" onClick={() => setCreateModalOpen(true)}>
              新建服务产品
            </Button>
          </Space>
        </div>
        <ProTable<ServiceProductRecord>
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
        title={detailRecord ? `${detailRecord.productCode} 服务产品详情` : '服务产品详情'}
        width={720}
      >
        {detailRecord ? (
          <Space direction="vertical" size={16} style={{ display: 'flex' }}>
            <Alert message={detailRecord.description} type="info" showIcon />
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="产品编码">{detailRecord.productCode}</Descriptions.Item>
              <Descriptions.Item label="产品名称">{detailRecord.productName}</Descriptions.Item>
              <Descriptions.Item label="产品类型">{detailRecord.productType}</Descriptions.Item>
              <Descriptions.Item label="目标客户">{detailRecord.targetCustomer}</Descriptions.Item>
              <Descriptions.Item label="计费模式">{detailRecord.billingMode}</Descriptions.Item>
              <Descriptions.Item label="产品状态">
                <Tag color={statusMeta[detailRecord.status].tagColor}>
                  {statusMeta[detailRecord.status].label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="标准价格">{detailRecord.price}</Descriptions.Item>
              <Descriptions.Item label="有效期">{detailRecord.validPeriod}</Descriptions.Item>
              <Descriptions.Item label="归属团队">{detailRecord.owner}</Descriptions.Item>
              <Descriptions.Item label="SLA 等级">{detailRecord.slaLevel}</Descriptions.Item>
              <Descriptions.Item label="订阅中实例">{detailRecord.activeSubscriptions}</Descriptions.Item>
              <Descriptions.Item label="续费率">{detailRecord.renewRate}</Descriptions.Item>
            </Descriptions>

            <div>
              <div className={styles.sectionTitle}>产品摘要</div>
              <div className={styles.metricGrid}>
                {[
                  ['价格策略', detailRecord.price],
                  ['有效期策略', detailRecord.validPeriod],
                  ['续费表现', detailRecord.renewRate],
                  ['最近更新时间', detailRecord.latestUpdateTime],
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
        okText="创建产品"
        onCancel={() => setCreateModalOpen(false)}
        onOk={() => {
          message.success('已触发静态创建：服务产品草稿已生成');
          setCreateModalOpen(false);
        }}
        open={createModalOpen}
        title="新建服务产品"
        width={760}
      >
        <Space direction="vertical" size={16} style={{ display: 'flex' }}>
          <Alert
            message="当前为静态演示流程，用于表达服务产品创建入口和配置要点。"
            showIcon
            type="info"
          />
          <div>
            <div className={styles.sectionTitle}>建议配置项</div>
            <div className={styles.metricGrid}>
              {[
                ['产品基础', '产品编码、产品名称、目标客户、归属团队'],
                ['服务定义', '服务项清单、默认开通能力、交付方式'],
                ['计费策略', '包月、包季、包年、按量或组合计费'],
                ['有效期与 SLA', '默认有效期、续费规则、服务保障等级'],
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

export default ServiceProductPage;
