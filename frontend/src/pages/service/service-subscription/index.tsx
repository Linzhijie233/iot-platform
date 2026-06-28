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
import { Alert, App, Button, Descriptions, Drawer, Input, Select, Space, Tag } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import {
  type ServiceSubscriptionItem,
  createSubscription,
  listSubscriptions,
  removeSubscription,
  updateSubscription,
} from '@/services/platform/services';
import styles from './index.less';

type SubscriptionStatus = ServiceSubscriptionItem['status'];
type ServiceSubscriptionRecord = ServiceSubscriptionItem;

const statusMeta: Record<SubscriptionStatus, { label: string; color: string; hint: string; tagColor: string }> = {
  active: { label: '订阅中', color: '#16a34a', hint: '服务实例正常生效，可继续订阅与续费', tagColor: 'success' },
  expiring: { label: '即将到期', color: '#f59e0b', hint: '临期订阅需优先续费或调整', tagColor: 'warning' },
  paused: { label: '已停服', color: '#ef4444', hint: '服务已暂停，待恢复或处理', tagColor: 'error' },
  expired: { label: '已到期', color: '#64748b', hint: '订阅周期已结束', tagColor: 'default' },
};

const ServiceSubscriptionPage: React.FC = () => {
  const { message, modal } = App.useApp();
  const [records, setRecords] = useState<ServiceSubscriptionRecord[]>([]);
  const [keyword, setKeyword] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | SubscriptionStatus>('all');
  const [selectedBillingMode, setSelectedBillingMode] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState('all');
  const [detailRecord, setDetailRecord] = useState<ServiceSubscriptionRecord>();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceSubscriptionRecord>();

  const refresh = async () => {
    try {
      const res = await listSubscriptions();
      setRecords((res.data as ServiceSubscriptionRecord[]) ?? []);
    } catch {
      /* ignore */
    }
  };
  useEffect(() => {
    refresh();
  }, []);

  const billingModeOptions = useMemo(
    () => [{ label: '全部计费模式', value: 'all' }, ...Array.from(new Set(records.map((i) => i.billingMode))).map((v) => ({ label: v, value: v }))],
    [records],
  );
  const customerOptions = useMemo(
    () => [{ label: '全部客户', value: 'all' }, ...Array.from(new Set(records.map((i) => i.customerName))).map((v) => ({ label: v, value: v }))],
    [records],
  );
  const overviewStats = useMemo(
    () => (Object.keys(statusMeta) as SubscriptionStatus[]).map((key) => ({ key, count: records.filter((i) => i.status === key).length, ...statusMeta[key] })),
    [records],
  );

  const filteredRecords = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return records.filter((item) => {
      const matchesKeyword = !kw || [item.subscriptionNo, item.customerName, item.productName, item.instanceName, item.serviceOwner].join('|').toLowerCase().includes(kw);
      const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
      const matchesBillingMode = selectedBillingMode === 'all' || item.billingMode === selectedBillingMode;
      const matchesCustomer = selectedCustomer === 'all' || item.customerName === selectedCustomer;
      return matchesKeyword && matchesStatus && matchesBillingMode && matchesCustomer;
    });
  }, [keyword, records, selectedBillingMode, selectedCustomer, selectedStatus]);

  const toggleService = async (record: ServiceSubscriptionRecord) => {
    const next = record.status === 'paused' ? 'active' : 'paused';
    await updateSubscription(record.id, { status: next });
    message.success(next === 'active' ? '已恢复服务' : '已停服');
    refresh();
  };
  const handleDelete = (record: ServiceSubscriptionRecord) => {
    modal.confirm({
      title: '确认删除该订阅？',
      content: `订阅单号：${record.subscriptionNo}`,
      okType: 'danger',
      onOk: async () => {
        await removeSubscription(record.id);
        message.success('已删除');
        refresh();
      },
    });
  };

  const columns: ProColumns<ServiceSubscriptionRecord>[] = [
    { title: '订阅单号', dataIndex: 'subscriptionNo', width: 160, fixed: 'left', render: (_, record) => <a className={styles.subscriptionLink} onClick={() => setDetailRecord(record)}>{record.subscriptionNo}</a> },
    { title: '客户', dataIndex: 'customerName', width: 140 },
    { title: '服务产品', dataIndex: 'productName', width: 180 },
    { title: '服务实例', dataIndex: 'instanceName', width: 180 },
    { title: '计费模式', dataIndex: 'billingMode', width: 110 },
    { title: '订阅状态', dataIndex: 'status', width: 110, render: (_, record) => <Tag color={statusMeta[record.status].tagColor}>{statusMeta[record.status].label}</Tag> },
    { title: '生效时间', dataIndex: 'startDate', width: 120 },
    { title: '到期时间', dataIndex: 'expireDate', width: 120 },
    { title: '剩余天数', dataIndex: 'remainingDays', width: 100, render: (_, record) => <span style={{ color: record.remainingDays <= 15 ? '#dc2626' : undefined }}>{record.remainingDays}</span> },
    { title: '自动续费', dataIndex: 'renewStatus', width: 100 },
    { title: '服务负责人', dataIndex: 'serviceOwner', width: 120 },
    { title: '最近处理时间', dataIndex: 'latestActionTime', width: 160 },
    {
      title: '操作',
      dataIndex: 'action',
      width: 220,
      fixed: 'right',
      render: (_, record) => (
        <span className={styles.actionLinks}>
          <a onClick={() => setDetailRecord(record)}>详情</a>
          <a onClick={() => { setEditing(record); setFormOpen(true); }}>调整订阅</a>
          <a onClick={() => toggleService(record)}>{record.status === 'paused' ? '恢复' : '停服'}</a>
          <a onClick={() => handleDelete(record)}>删除</a>
        </span>
      ),
    },
  ];

  return (
    <PageContainer
      className={styles.serviceSubscriptionPage}
      header={{ title: '服务订阅', subTitle: '服务订阅来自后端 /api/service-subscriptions，支持新建 / 调整 / 停服恢复 / 删除。' }}
    >
      <div className={styles.overviewGrid}>
        {overviewStats.map((item) => {
          const active = selectedStatus === item.key;
          return (
            <button className={`${styles.overviewCard} ${active ? styles.overviewCardActive : ''}`} key={item.key} onClick={() => setSelectedStatus(active ? 'all' : item.key)} style={{ ['--accent-color' as string]: item.color }} type="button">
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
        <Alert banner message="订阅总览：临期与已到期订阅建议优先跟进续费或调整。" type="warning" />
      </div>

      <div className={styles.filterCard}>
        <div className={styles.searchGrid}>
          <Input allowClear placeholder="搜索订阅单号 / 客户 / 产品 / 服务实例" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          <Select options={[{ label: '全部订阅状态', value: 'all' }, ...overviewStats.map((i) => ({ label: i.label, value: i.key }))]} value={selectedStatus} onChange={setSelectedStatus} />
          <Select options={billingModeOptions} value={selectedBillingMode} onChange={setSelectedBillingMode} />
          <Select options={customerOptions} value={selectedCustomer} onChange={setSelectedCustomer} />
          <Space>
            <Button type="primary" onClick={() => message.success('已按条件筛选')}>搜索</Button>
            <Button onClick={() => { setKeyword(''); setSelectedStatus('all'); setSelectedBillingMode('all'); setSelectedCustomer('all'); }}>重置</Button>
          </Space>
        </div>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableMeta}>
          <span>当前结果 <strong>{filteredRecords.length}</strong> 条</span>
          <Space size={12}>
            <span>服务订阅数据来自后端，支持新建、调整、停服恢复与删除。</span>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(undefined); setFormOpen(true); }}>新建订阅</Button>
          </Space>
        </div>
        <ProTable<ServiceSubscriptionRecord>
          cardBordered
          className={styles.tableWrap}
          columns={columns}
          dataSource={filteredRecords}
          options={false}
          pagination={{ pageSize: 10, showQuickJumper: true, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
          rowKey="id"
          scroll={{ x: 1950 }}
          search={false}
          tableAlertRender={false}
        />
      </div>

      <ModalForm<ServiceSubscriptionRecord>
        key={editing?.id ?? 'create'}
        title={editing ? `调整订阅 · ${editing.subscriptionNo}` : '新建订阅'}
        open={formOpen}
        onOpenChange={setFormOpen}
        grid
        rowProps={{ gutter: 16 }}
        modalProps={{ destroyOnClose: true }}
        initialValues={editing ?? { status: 'active', billingMode: '包年', renewStatus: '未开启', remainingDays: 365, serviceOwner: '客户成功组' }}
        onFinish={async (values) => {
          try {
            if (editing) await updateSubscription(editing.id, values);
            else await createSubscription(values);
            message.success(editing ? '已保存' : '已新建订阅');
            setFormOpen(false);
            refresh();
            return true;
          } catch {
            message.error('提交失败');
            return false;
          }
        }}
      >
        <ProFormText name="subscriptionNo" label="订阅单号" colProps={{ span: 12 }} rules={[{ required: true }]} />
        <ProFormText name="customerName" label="客户" colProps={{ span: 12 }} rules={[{ required: true }]} />
        <ProFormText name="productName" label="服务产品" colProps={{ span: 12 }} />
        <ProFormText name="instanceName" label="服务实例" colProps={{ span: 12 }} />
        <ProFormText name="billingMode" label="计费模式" colProps={{ span: 12 }} />
        <ProFormSelect name="status" label="订阅状态" colProps={{ span: 12 }} options={(Object.keys(statusMeta) as SubscriptionStatus[]).map((k) => ({ label: statusMeta[k].label, value: k }))} />
        <ProFormText name="startDate" label="生效时间" placeholder="YYYY-MM-DD" colProps={{ span: 12 }} />
        <ProFormText name="expireDate" label="到期时间" placeholder="YYYY-MM-DD" colProps={{ span: 12 }} />
        <ProFormDigit name="remainingDays" label="剩余天数" colProps={{ span: 12 }} />
        <ProFormSelect name="renewStatus" label="自动续费" colProps={{ span: 12 }} options={['已开启', '未开启'].map((v) => ({ label: v, value: v }))} />
        <ProFormText name="serviceOwner" label="服务负责人" colProps={{ span: 12 }} />
        <ProFormTextArea name="description" label="说明" colProps={{ span: 24 }} />
      </ModalForm>

      <Drawer destroyOnHidden onClose={() => setDetailRecord(undefined)} open={Boolean(detailRecord)} title={detailRecord ? `${detailRecord.subscriptionNo} 订阅详情` : '订阅详情'} width={720}>
        {detailRecord ? (
          <Space direction="vertical" size={16} style={{ display: 'flex' }}>
            <Alert message={detailRecord.description} type="info" showIcon />
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="订阅单号">{detailRecord.subscriptionNo}</Descriptions.Item>
              <Descriptions.Item label="客户">{detailRecord.customerName}</Descriptions.Item>
              <Descriptions.Item label="服务产品">{detailRecord.productName}</Descriptions.Item>
              <Descriptions.Item label="服务实例">{detailRecord.instanceName}</Descriptions.Item>
              <Descriptions.Item label="计费模式">{detailRecord.billingMode}</Descriptions.Item>
              <Descriptions.Item label="订阅状态"><Tag color={statusMeta[detailRecord.status].tagColor}>{statusMeta[detailRecord.status].label}</Tag></Descriptions.Item>
              <Descriptions.Item label="生效时间">{detailRecord.startDate}</Descriptions.Item>
              <Descriptions.Item label="到期时间">{detailRecord.expireDate}</Descriptions.Item>
              <Descriptions.Item label="剩余天数">{detailRecord.remainingDays}</Descriptions.Item>
              <Descriptions.Item label="自动续费">{detailRecord.renewStatus}</Descriptions.Item>
              <Descriptions.Item label="服务负责人">{detailRecord.serviceOwner}</Descriptions.Item>
              <Descriptions.Item label="最近处理时间">{detailRecord.latestActionTime}</Descriptions.Item>
            </Descriptions>
          </Space>
        ) : null}
      </Drawer>
    </PageContainer>
  );
};

export default ServiceSubscriptionPage;
