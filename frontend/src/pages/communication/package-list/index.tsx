import type { ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import { PlusOutlined } from '@ant-design/icons';
import {
  Alert,
  App,
  Button,
  DatePicker,
  Descriptions,
  Drawer,
  Input,
  Modal,
  Select,
  Space,
  Tag,
  Timeline,
} from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import React, { useEffect, useMemo, useState } from 'react';
import {
  type PackageItem,
  createPackage,
  listPackages,
  removePackage,
  updatePackage,
} from '@/services/platform/packages';
import styles from './index.less';

type LifecycleStage = PackageItem['lifecycleStage'];
type AutoRenewStatus = PackageItem['autoRenewStatus'];
type OperationType = 'renew' | 'change' | 'suspend' | 'resume';
type PackageLifecycleRecord = PackageItem;

const stageMeta: Record<LifecycleStage, { label: string; color: string; hint: string; tagColor: string }> = {
  pending: { label: '待生效', color: '#2563eb', hint: '已绑定套餐，等待到达生效时间', tagColor: 'processing' },
  active: { label: '生效中', color: '#16a34a', hint: '当前套餐正常在网，可继续服务', tagColor: 'success' },
  expiring: { label: '即将到期', color: '#f59e0b', hint: '临期风险需要优先续费或变更', tagColor: 'warning' },
  grace: { label: '宽限期', color: '#f97316', hint: '套餐已过期但仍处于缓冲处理窗口', tagColor: 'orange' },
  suspended: { label: '已停机', color: '#ef4444', hint: '服务已受限，需复机或补齐资源', tagColor: 'error' },
  expired: { label: '已失效', color: '#64748b', hint: '套餐周期已结束', tagColor: 'default' },
};

const stageOrder: LifecycleStage[] = ['pending', 'active', 'expiring', 'grace', 'suspended', 'expired'];

const operationMeta: Record<OperationType, { title: string; summary: string; actionText: string }> = {
  renew: { title: '续费处理', summary: '用于延长当前套餐周期，避免进入宽限期或停机阶段。', actionText: '提交续费' },
  change: { title: '套餐变更', summary: '用于升级、降级或切换当前套餐方案。', actionText: '提交变更' },
  suspend: { title: '停机处理', summary: '用于执行停机保号或主动暂停服务。', actionText: '提交停机' },
  resume: { title: '复机处理', summary: '用于在完成续费或恢复条件后重新启用服务。', actionText: '提交复机' },
};

const PackageListPage: React.FC = () => {
  const { message, modal } = App.useApp();
  const [lifecycleRecords, setLifecycleRecords] = useState<PackageLifecycleRecord[]>([]);
  const [keyword, setKeyword] = useState('');
  const [selectedStage, setSelectedStage] = useState<'all' | LifecycleStage>('all');
  const [selectedOperator, setSelectedOperator] = useState<'all' | string>('all');
  const [selectedPackageType, setSelectedPackageType] = useState<'all' | string>('all');
  const [selectedAutoRenew, setSelectedAutoRenew] = useState<'all' | AutoRenewStatus>('all');
  const [expireRange, setExpireRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [detailRecord, setDetailRecord] = useState<PackageLifecycleRecord>();
  const [operationState, setOperationState] = useState<{ type: OperationType; record: PackageLifecycleRecord }>();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PackageLifecycleRecord>();

  const refresh = async () => {
    try {
      const res = await listPackages({ pageSize: 500 });
      setLifecycleRecords((res.data as PackageLifecycleRecord[]) ?? []);
    } catch {
      /* ignore */
    }
  };
  useEffect(() => {
    refresh();
  }, []);

  const operatorOptions = useMemo(
    () => [
      { label: '全部运营商', value: 'all' },
      ...Array.from(new Set(lifecycleRecords.map((item) => item.operator))).map((item) => ({ label: item, value: item })),
    ],
    [lifecycleRecords],
  );

  const packageTypeOptions = useMemo(
    () => [
      { label: '全部套餐类型', value: 'all' },
      ...Array.from(new Set(lifecycleRecords.map((item) => item.packageType))).map((item) => ({ label: item, value: item })),
    ],
    [lifecycleRecords],
  );

  const overviewStats = useMemo(
    () => stageOrder.map((stage) => ({ stage, count: lifecycleRecords.filter((item) => item.lifecycleStage === stage).length })),
    [lifecycleRecords],
  );

  const filteredRecords = useMemo(() => {
    return lifecycleRecords.filter((item) => {
      const matchesKeyword =
        !keyword ||
        [item.iccid, item.cardNo, item.deviceName, item.customerName, item.packageName]
          .join('|')
          .toLowerCase()
          .includes(keyword.trim().toLowerCase());
      const matchesStage = selectedStage === 'all' || item.lifecycleStage === selectedStage;
      const matchesOperator = selectedOperator === 'all' || item.operator === selectedOperator;
      const matchesPackageType = selectedPackageType === 'all' || item.packageType === selectedPackageType;
      const matchesAutoRenew = selectedAutoRenew === 'all' || item.autoRenewStatus === selectedAutoRenew;
      const matchesExpireRange =
        !expireRange ||
        (dayjs(item.expireDate).isAfter(expireRange[0].startOf('day')) &&
          dayjs(item.expireDate).isBefore(expireRange[1].endOf('day')));
      return matchesKeyword && matchesStage && matchesOperator && matchesPackageType && matchesAutoRenew && matchesExpireRange;
    });
  }, [expireRange, keyword, lifecycleRecords, selectedAutoRenew, selectedOperator, selectedPackageType, selectedStage]);

  const riskSummary = useMemo(
    () => ({
      expiring: lifecycleRecords.filter((item) => item.lifecycleStage === 'expiring').length,
      grace: lifecycleRecords.filter((item) => item.lifecycleStage === 'grace').length,
      suspended: lifecycleRecords.filter((item) => item.lifecycleStage === 'suspended').length,
    }),
    [lifecycleRecords],
  );

  const resetFilters = () => {
    setKeyword('');
    setSelectedStage('all');
    setSelectedOperator('all');
    setSelectedPackageType('all');
    setSelectedAutoRenew('all');
    setExpireRange(null);
  };

  const openOperationModal = (type: OperationType, record: PackageLifecycleRecord) => setOperationState({ type, record });

  const handleDelete = (record: PackageLifecycleRecord) => {
    modal.confirm({
      title: '确认删除该套餐记录？',
      content: `ICCID：${record.iccid}`,
      okType: 'danger',
      onOk: async () => {
        await removePackage(record.id);
        message.success('已删除');
        refresh();
      },
    });
  };

  const columns: ProColumns<PackageLifecycleRecord>[] = [
    { title: 'ICCID', dataIndex: 'iccid', width: 180, fixed: 'left', render: (_, record) => <a onClick={() => setDetailRecord(record)}>{record.iccid}</a> },
    { title: '卡号', dataIndex: 'cardNo', width: 140 },
    { title: '运营商', dataIndex: 'operator', width: 110 },
    { title: '套餐名称', dataIndex: 'packageName', width: 220 },
    { title: '套餐类型', dataIndex: 'packageType', width: 120 },
    { title: '关联设备', dataIndex: 'deviceName', width: 150 },
    { title: '客户', dataIndex: 'customerName', width: 140 },
    {
      title: '当前阶段',
      dataIndex: 'lifecycleStage',
      width: 120,
      render: (_, record) => <Tag color={stageMeta[record.lifecycleStage].tagColor}>{stageMeta[record.lifecycleStage].label}</Tag>,
    },
    { title: '生效时间', dataIndex: 'effectiveDate', width: 120 },
    { title: '到期时间', dataIndex: 'expireDate', width: 120 },
    {
      title: '剩余天数',
      dataIndex: 'remainingDays',
      width: 110,
      render: (_, record) => <span className={record.remainingDays <= 10 ? styles.riskValue : undefined}>{record.remainingDays}</span>,
    },
    {
      title: '自动续费',
      dataIndex: 'autoRenewStatus',
      width: 110,
      render: (_, record) => <Tag color={record.autoRenewStatus === 'enabled' ? 'success' : 'default'}>{record.autoRenewStatus === 'enabled' ? '已开启' : '未开启'}</Tag>,
    },
    {
      title: '停复机状态',
      dataIndex: 'serviceStatus',
      width: 120,
      render: (_, record) => <Tag color={record.serviceStatus === 'running' ? 'blue' : 'red'}>{record.serviceStatus === 'running' ? '服务中' : '已停机'}</Tag>,
    },
    { title: '最近处理时间', dataIndex: 'lastActionTime', width: 160 },
    {
      title: '操作',
      dataIndex: 'action',
      width: 280,
      fixed: 'right',
      render: (_, record) => (
        <span className={styles.actionLinks}>
          <a onClick={() => openOperationModal('renew', record)}>续费</a>
          <a onClick={() => openOperationModal('change', record)}>套餐变更</a>
          <a onClick={() => openOperationModal('suspend', record)}>停机</a>
          <a onClick={() => openOperationModal('resume', record)}>复机</a>
          <a onClick={() => setDetailRecord(record)}>详情</a>
          <a onClick={() => { setEditing(record); setFormOpen(true); }}>编辑</a>
          <a onClick={() => handleDelete(record)}>删除</a>
        </span>
      ),
    },
  ];

  return (
    <PageContainer
      className={styles.packageLifecyclePage}
      header={{
        title: '套餐列表',
        subTitle: '套餐实例来自后端 /api/packages，支持新增 / 编辑 / 删除及续费、变更、停复机等操作。',
      }}
    >
      <div className={styles.overviewGrid}>
        {overviewStats.map(({ stage, count }) => {
          const active = selectedStage === stage;
          return (
            <button
              className={`${styles.stageCard} ${active ? styles.stageCardActive : ''}`}
              key={stage}
              onClick={() => setSelectedStage(active ? 'all' : stage)}
              style={{ ['--accent-color' as string]: stageMeta[stage].color }}
              type="button"
            >
              <div className={styles.stageCardHead}>
                <span>{stageMeta[stage].label}</span>
                <strong>{count}</strong>
              </div>
              <div className={styles.stageCardHint}>{stageMeta[stage].hint}</div>
            </button>
          );
        })}
      </div>

      <div className={styles.riskCard}>
        <Alert
          banner
          message={`当前共有 ${riskSummary.expiring} 条即将到期、${riskSummary.grace} 条宽限期、${riskSummary.suspended} 条已停机记录，需要优先处理。`}
          type="warning"
        />
      </div>

      <div className={styles.filterCard}>
        <div className={styles.searchGrid}>
          <Input allowClear placeholder="搜索 ICCID / 卡号 / 设备 / 客户 / 套餐" value={keyword} onChange={(event) => setKeyword(event.target.value)} />
          <Select
            options={[{ label: '全部阶段', value: 'all' }, ...stageOrder.map((stage) => ({ label: stageMeta[stage].label, value: stage }))]}
            value={selectedStage}
            onChange={setSelectedStage}
          />
          <Select options={operatorOptions} value={selectedOperator} onChange={setSelectedOperator} />
          <Select options={packageTypeOptions} value={selectedPackageType} onChange={setSelectedPackageType} />
          <Select
            options={[{ label: '自动续费状态', value: 'all' }, { label: '已开启', value: 'enabled' }, { label: '未开启', value: 'disabled' }]}
            value={selectedAutoRenew}
            onChange={setSelectedAutoRenew}
          />
          <DatePicker.RangePicker
            value={expireRange}
            onChange={(value) => setExpireRange(value?.[0] && value?.[1] ? [value[0], value[1]] : null)}
          />
          <Space>
            <Button type="primary" onClick={() => message.success('已按条件筛选')}>搜索</Button>
            <Button onClick={resetFilters}>重置</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(undefined); setFormOpen(true); }}>
              新增套餐
            </Button>
          </Space>
        </div>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableMeta}>
          <span>当前结果 <strong>{filteredRecords.length}</strong> 条</span>
          <span>套餐实例数据来自后端，支持新增、编辑、删除与处理入口。</span>
        </div>
        <ProTable<PackageLifecycleRecord>
          className={styles.tableWrap}
          cardBordered
          columns={columns}
          dataSource={filteredRecords}
          options={false}
          pagination={{ pageSize: 10, showQuickJumper: true, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
          rowKey="id"
          scroll={{ x: 2300 }}
          search={false}
          tableAlertRender={false}
          tableAlertOptionRender={false}
        />
      </div>

      {/* 新增 / 编辑 套餐 */}
      <ModalForm<PackageLifecycleRecord>
        key={editing?.id ?? 'create'}
        title={editing ? `编辑套餐 · ${editing.iccid}` : '新增套餐'}
        open={formOpen}
        onOpenChange={setFormOpen}
        grid
        rowProps={{ gutter: 16 }}
        modalProps={{ destroyOnClose: true }}
        initialValues={
          editing ?? {
            operator: '中国移动',
            packageType: '周期套餐',
            lifecycleStage: 'pending',
            autoRenewStatus: 'disabled',
            serviceStatus: 'running',
            remainingDays: 365,
          }
        }
        onFinish={async (values) => {
          try {
            if (editing) {
              await updatePackage(editing.id, values);
              message.success('已保存修改');
            } else {
              await createPackage({
                ...values,
                lastActionTime: dayjs().format('YYYY-MM-DD HH:mm'),
                timeline: [{ time: dayjs().format('YYYY-MM-DD HH:mm'), title: '套餐已创建', description: '界面手动新增。', color: 'blue' }],
              });
              message.success('已新增套餐');
            }
            refresh();
            return true;
          } catch {
            message.error('提交失败');
            return false;
          }
        }}
      >
        <ProFormText name="iccid" label="ICCID" colProps={{ span: 12 }} rules={[{ required: true }]} />
        <ProFormText name="cardNo" label="卡号" colProps={{ span: 12 }} />
        <ProFormSelect name="operator" label="运营商" colProps={{ span: 12 }} options={['中国移动', '中国联通', '中国电信'].map((o) => ({ label: o, value: o }))} />
        <ProFormText name="packageName" label="套餐名称" colProps={{ span: 12 }} rules={[{ required: true }]} />
        <ProFormText name="packageType" label="套餐类型" colProps={{ span: 12 }} />
        <ProFormText name="deviceName" label="关联设备" colProps={{ span: 12 }} />
        <ProFormText name="customerName" label="客户" colProps={{ span: 12 }} />
        <ProFormSelect
          name="lifecycleStage"
          label="当前阶段"
          colProps={{ span: 12 }}
          options={stageOrder.map((s) => ({ label: stageMeta[s].label, value: s }))}
        />
        <ProFormText name="effectiveDate" label="生效时间" placeholder="YYYY-MM-DD" colProps={{ span: 12 }} />
        <ProFormText name="expireDate" label="到期时间" placeholder="YYYY-MM-DD" colProps={{ span: 12 }} />
        <ProFormDigit name="remainingDays" label="剩余天数" colProps={{ span: 12 }} />
        <ProFormSelect name="autoRenewStatus" label="自动续费" colProps={{ span: 12 }} options={[{ label: '已开启', value: 'enabled' }, { label: '未开启', value: 'disabled' }]} />
        <ProFormSelect name="serviceStatus" label="停复机状态" colProps={{ span: 12 }} options={[{ label: '服务中', value: 'running' }, { label: '已停机', value: 'suspended' }]} />
        <ProFormTextArea name="riskNote" label="风险/备注" colProps={{ span: 24 }} />
      </ModalForm>

      <Drawer
        destroyOnHidden
        onClose={() => setDetailRecord(undefined)}
        open={Boolean(detailRecord)}
        title={detailRecord ? `${detailRecord.iccid} 套餐详情` : '套餐详情'}
        width={720}
      >
        {detailRecord ? (
          <Space direction="vertical" size={16} style={{ display: 'flex' }}>
            <Alert
              message={detailRecord.riskNote}
              type={detailRecord.lifecycleStage === 'active' || detailRecord.lifecycleStage === 'pending' ? 'info' : 'warning'}
              showIcon
            />
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="ICCID">{detailRecord.iccid}</Descriptions.Item>
              <Descriptions.Item label="卡号">{detailRecord.cardNo}</Descriptions.Item>
              <Descriptions.Item label="套餐名称">{detailRecord.packageName}</Descriptions.Item>
              <Descriptions.Item label="套餐类型">{detailRecord.packageType}</Descriptions.Item>
              <Descriptions.Item label="当前阶段">
                <Tag color={stageMeta[detailRecord.lifecycleStage].tagColor}>{stageMeta[detailRecord.lifecycleStage].label}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="自动续费">{detailRecord.autoRenewStatus === 'enabled' ? '已开启' : '未开启'}</Descriptions.Item>
              <Descriptions.Item label="生效时间">{detailRecord.effectiveDate}</Descriptions.Item>
              <Descriptions.Item label="到期时间">{detailRecord.expireDate}</Descriptions.Item>
              <Descriptions.Item label="剩余天数">{detailRecord.remainingDays}</Descriptions.Item>
              <Descriptions.Item label="停复机状态">{detailRecord.serviceStatus === 'running' ? '服务中' : '已停机'}</Descriptions.Item>
              <Descriptions.Item label="关联设备">{detailRecord.deviceName}</Descriptions.Item>
              <Descriptions.Item label="客户">{detailRecord.customerName}</Descriptions.Item>
            </Descriptions>

            <div>
              <div className={styles.sectionTitle}>阶段时间线</div>
              <Timeline
                items={(detailRecord.timeline ?? []).map((item) => ({
                  color: item.color,
                  children: (
                    <div className={styles.timelineItem}>
                      <div className={styles.timelineTime}>{item.time}</div>
                      <div className={styles.timelineTitle}>{item.title}</div>
                      <div className={styles.timelineDesc}>{item.description}</div>
                    </div>
                  ),
                }))}
              />
            </div>

            <div>
              <div className={styles.sectionTitle}>建议动作</div>
              <div className={styles.suggestionList}>
                <button onClick={() => openOperationModal('renew', detailRecord)} type="button">发起续费处理</button>
                <button onClick={() => openOperationModal('change', detailRecord)} type="button">发起套餐变更</button>
                <button onClick={() => openOperationModal('suspend', detailRecord)} type="button">发起停机处理</button>
                <button onClick={() => openOperationModal('resume', detailRecord)} type="button">发起复机处理</button>
              </div>
            </div>
          </Space>
        ) : null}
      </Drawer>

      <Modal
        destroyOnHidden
        okText={operationState ? operationMeta[operationState.type].actionText : '提交'}
        onCancel={() => setOperationState(undefined)}
        onOk={async () => {
          if (operationState) {
            const { type, record } = operationState;
            const patch: Partial<PackageItem> =
              type === 'suspend'
                ? { serviceStatus: 'suspended', lifecycleStage: 'suspended' }
                : type === 'resume'
                  ? { serviceStatus: 'running', lifecycleStage: 'active' }
                  : type === 'renew'
                    ? { lifecycleStage: 'active', autoRenewStatus: 'enabled' }
                    : {};
            try {
              if (Object.keys(patch).length) {
                await updatePackage(record.id, { ...patch, lastActionTime: dayjs().format('YYYY-MM-DD HH:mm') });
              }
              message.success(`${operationMeta[type].title}已提交：${record.iccid}`);
              refresh();
            } catch {
              message.error('提交失败');
            }
          }
          setOperationState(undefined);
        }}
        open={Boolean(operationState)}
        title={operationState ? operationMeta[operationState.type].title : '处理'}
      >
        {operationState ? (
          <Space direction="vertical" size={12} style={{ display: 'flex' }}>
            <Alert message={operationMeta[operationState.type].summary} type="info" showIcon />
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="ICCID">{operationState.record.iccid}</Descriptions.Item>
              <Descriptions.Item label="套餐名称">{operationState.record.packageName}</Descriptions.Item>
              <Descriptions.Item label="当前阶段">{stageMeta[operationState.record.lifecycleStage].label}</Descriptions.Item>
              <Descriptions.Item label="处理建议">{operationState.record.riskNote}</Descriptions.Item>
            </Descriptions>
          </Space>
        ) : null}
      </Modal>
    </PageContainer>
  );
};

export default PackageListPage;
