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
  type ServiceProductItem,
  createProduct,
  listProducts,
  removeProduct,
  updateProduct,
} from '@/services/platform/services';
import styles from './index.less';

type ProductStatus = ServiceProductItem['status'];
type ServiceProductRecord = ServiceProductItem;

const statusMeta: Record<ProductStatus, { label: string; color: string; hint: string; tagColor: string }> = {
  enabled: { label: '已上架', color: '#16a34a', hint: '服务产品可正常订阅与续费', tagColor: 'success' },
  draft: { label: '草稿中', color: '#64748b', hint: '产品配置未发布，仅供内部编辑', tagColor: 'default' },
  paused: { label: '已暂停', color: '#ef4444', hint: '暂停新订阅，历史实例待进一步处理', tagColor: 'error' },
  expiring: { label: '待调整', color: '#f59e0b', hint: '资费或有效期策略即将到达调整窗口', tagColor: 'warning' },
};

const ServiceProductPage: React.FC = () => {
  const { message, modal } = App.useApp();
  const [records, setRecords] = useState<ServiceProductRecord[]>([]);
  const [keyword, setKeyword] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | ProductStatus>('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedBillingMode, setSelectedBillingMode] = useState('all');
  const [detailRecord, setDetailRecord] = useState<ServiceProductRecord>();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceProductRecord>();

  const refresh = async () => {
    try {
      const res = await listProducts();
      setRecords((res.data as ServiceProductRecord[]) ?? []);
    } catch {
      /* ignore */
    }
  };
  useEffect(() => {
    refresh();
  }, []);

  const productTypeOptions = useMemo(
    () => [{ label: '全部产品类型', value: 'all' }, ...Array.from(new Set(records.map((i) => i.productType))).map((v) => ({ label: v, value: v }))],
    [records],
  );
  const billingModeOptions = useMemo(
    () => [{ label: '全部计费模式', value: 'all' }, ...Array.from(new Set(records.map((i) => i.billingMode))).map((v) => ({ label: v, value: v }))],
    [records],
  );

  const overviewStats = useMemo(
    () => (Object.keys(statusMeta) as ProductStatus[]).map((key) => ({ key, count: records.filter((i) => i.status === key).length, ...statusMeta[key] })),
    [records],
  );

  const filteredRecords = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return records.filter((item) => {
      const matchesKeyword = !kw || [item.productCode, item.productName, item.productType, item.targetCustomer, item.owner].join('|').toLowerCase().includes(kw);
      const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
      const matchesType = selectedType === 'all' || item.productType === selectedType;
      const matchesBillingMode = selectedBillingMode === 'all' || item.billingMode === selectedBillingMode;
      return matchesKeyword && matchesStatus && matchesType && matchesBillingMode;
    });
  }, [keyword, records, selectedBillingMode, selectedStatus, selectedType]);

  const toggleStatus = async (record: ServiceProductRecord) => {
    const next = record.status === 'enabled' ? 'paused' : 'enabled';
    await updateProduct(record.id, { status: next });
    message.success(next === 'enabled' ? '已上架' : '已暂停');
    refresh();
  };
  const handleDelete = (record: ServiceProductRecord) => {
    modal.confirm({
      title: '确认删除该服务产品？',
      content: `产品编码：${record.productCode}`,
      okType: 'danger',
      onOk: async () => {
        await removeProduct(record.id);
        message.success('已删除');
        refresh();
      },
    });
  };

  const columns: ProColumns<ServiceProductRecord>[] = [
    { title: '产品编码', dataIndex: 'productCode', width: 180, fixed: 'left', render: (_, record) => <a className={styles.productLink} onClick={() => setDetailRecord(record)}>{record.productCode}</a> },
    { title: '产品名称', dataIndex: 'productName', width: 180 },
    { title: '产品类型', dataIndex: 'productType', width: 120 },
    { title: '目标客户', dataIndex: 'targetCustomer', width: 120 },
    { title: '计费模式', dataIndex: 'billingMode', width: 110 },
    { title: '产品状态', dataIndex: 'status', width: 110, render: (_, record) => <Tag color={statusMeta[record.status].tagColor}>{statusMeta[record.status].label}</Tag> },
    { title: '标准价格', dataIndex: 'price', width: 120 },
    { title: '有效期', dataIndex: 'validPeriod', width: 120 },
    { title: '订阅中实例', dataIndex: 'activeSubscriptions', width: 120 },
    { title: '续费率', dataIndex: 'renewRate', width: 100 },
    { title: '归属团队', dataIndex: 'owner', width: 120 },
    { title: '最近更新时间', dataIndex: 'latestUpdateTime', width: 160 },
    {
      title: '操作',
      dataIndex: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <span className={styles.actionLinks}>
          <a onClick={() => setDetailRecord(record)}>详情</a>
          <a onClick={() => { setEditing(record); setFormOpen(true); }}>编辑</a>
          <a onClick={() => toggleStatus(record)}>{record.status === 'enabled' ? '暂停' : '上架'}</a>
          <a onClick={() => handleDelete(record)}>删除</a>
        </span>
      ),
    },
  ];

  return (
    <PageContainer
      className={styles.serviceProductPage}
      header={{ title: '服务产品', subTitle: '服务产品来自后端 /api/service-products，支持新增 / 编辑 / 上架暂停 / 删除。' }}
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
        <Alert banner message="服务产品状态总览：草稿待发布与暂停产品建议优先梳理计费与订阅策略。" type="warning" />
      </div>

      <div className={styles.filterCard}>
        <div className={styles.searchGrid}>
          <Input allowClear placeholder="搜索产品编码 / 名称 / 类型 / 团队" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          <Select options={[{ label: '全部产品状态', value: 'all' }, ...overviewStats.map((i) => ({ label: i.label, value: i.key }))]} value={selectedStatus} onChange={setSelectedStatus} />
          <Select options={productTypeOptions} value={selectedType} onChange={setSelectedType} />
          <Select options={billingModeOptions} value={selectedBillingMode} onChange={setSelectedBillingMode} />
          <Space>
            <Button type="primary" onClick={() => message.success('已按条件筛选')}>搜索</Button>
            <Button onClick={() => { setKeyword(''); setSelectedStatus('all'); setSelectedType('all'); setSelectedBillingMode('all'); }}>重置</Button>
          </Space>
        </div>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableMeta}>
          <span>当前结果 <strong>{filteredRecords.length}</strong> 条</span>
          <Space size={12}>
            <span>服务产品数据来自后端，支持新增、编辑、上架暂停与删除。</span>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(undefined); setFormOpen(true); }}>新建服务产品</Button>
          </Space>
        </div>
        <ProTable<ServiceProductRecord>
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

      <ModalForm<ServiceProductRecord>
        key={editing?.id ?? 'create'}
        title={editing ? `编辑服务产品 · ${editing.productCode}` : '新建服务产品'}
        open={formOpen}
        onOpenChange={setFormOpen}
        grid
        rowProps={{ gutter: 16 }}
        modalProps={{ destroyOnClose: true }}
        initialValues={editing ?? { status: 'draft', billingMode: '包年', activeSubscriptions: 0, renewRate: '--', slaLevel: 'SLA-L2', owner: '服务运营组' }}
        onFinish={async (values) => {
          try {
            if (editing) await updateProduct(editing.id, values);
            else await createProduct(values);
            message.success(editing ? '已保存修改' : '已新建服务产品');
            setFormOpen(false);
            refresh();
            return true;
          } catch {
            message.error('提交失败');
            return false;
          }
        }}
      >
        <ProFormText name="productCode" label="产品编码" colProps={{ span: 12 }} rules={[{ required: true }]} />
        <ProFormText name="productName" label="产品名称" colProps={{ span: 12 }} rules={[{ required: true }]} />
        <ProFormText name="productType" label="产品类型" colProps={{ span: 12 }} />
        <ProFormText name="targetCustomer" label="目标客户" colProps={{ span: 12 }} />
        <ProFormText name="billingMode" label="计费模式" colProps={{ span: 12 }} />
        <ProFormSelect name="status" label="产品状态" colProps={{ span: 12 }} options={(Object.keys(statusMeta) as ProductStatus[]).map((k) => ({ label: statusMeta[k].label, value: k }))} />
        <ProFormText name="price" label="标准价格" colProps={{ span: 12 }} />
        <ProFormText name="validPeriod" label="有效期" colProps={{ span: 12 }} />
        <ProFormDigit name="activeSubscriptions" label="订阅中实例" colProps={{ span: 12 }} min={0} />
        <ProFormText name="renewRate" label="续费率" colProps={{ span: 12 }} />
        <ProFormText name="owner" label="归属团队" colProps={{ span: 12 }} />
        <ProFormText name="slaLevel" label="SLA 等级" colProps={{ span: 12 }} />
        <ProFormTextArea name="description" label="产品描述" colProps={{ span: 24 }} />
      </ModalForm>

      <Drawer destroyOnHidden onClose={() => setDetailRecord(undefined)} open={Boolean(detailRecord)} title={detailRecord ? `${detailRecord.productCode} 服务产品详情` : '服务产品详情'} width={720}>
        {detailRecord ? (
          <Space direction="vertical" size={16} style={{ display: 'flex' }}>
            <Alert message={detailRecord.description} type="info" showIcon />
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="产品编码">{detailRecord.productCode}</Descriptions.Item>
              <Descriptions.Item label="产品名称">{detailRecord.productName}</Descriptions.Item>
              <Descriptions.Item label="产品类型">{detailRecord.productType}</Descriptions.Item>
              <Descriptions.Item label="目标客户">{detailRecord.targetCustomer}</Descriptions.Item>
              <Descriptions.Item label="计费模式">{detailRecord.billingMode}</Descriptions.Item>
              <Descriptions.Item label="产品状态"><Tag color={statusMeta[detailRecord.status].tagColor}>{statusMeta[detailRecord.status].label}</Tag></Descriptions.Item>
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
    </PageContainer>
  );
};

export default ServiceProductPage;
