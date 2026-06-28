import type { ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import { PlusOutlined } from '@ant-design/icons';
import { Alert, App, Button, Descriptions, Drawer, Input, Select, Space, Tag } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import {
  type ServiceOperationItem,
  createOperation,
  listOperations,
  removeOperation,
  updateOperation,
} from '@/services/platform/services';
import styles from './index.less';

type OperationStatus = ServiceOperationItem['status'];
type ServiceOperationRecord = ServiceOperationItem;

const statusMeta: Record<OperationStatus, { label: string; color: string; hint: string; tagColor: string }> = {
  pending: { label: '待处理', color: '#f59e0b', hint: '申请已提交，等待运营处理', tagColor: 'warning' },
  processing: { label: '处理中', color: '#1677ff', hint: '正在处理流程中，需持续跟进', tagColor: 'processing' },
  completed: { label: '已完成', color: '#16a34a', hint: '运营处理已完成并已回执', tagColor: 'success' },
  blocked: { label: '已阻塞', color: '#ef4444', hint: '存在前置条件缺失或审核阻塞', tagColor: 'error' },
};

const operationTypeOptions = ['续费', '升级', '停服', '恢复'];

const ServiceOperationsPage: React.FC = () => {
  const { message, modal } = App.useApp();
  const [records, setRecords] = useState<ServiceOperationRecord[]>([]);
  const [keyword, setKeyword] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | OperationStatus>('all');
  const [selectedType, setSelectedType] = useState('all');
  const [detailRecord, setDetailRecord] = useState<ServiceOperationRecord>();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceOperationRecord>();

  const refresh = async () => {
    try {
      const res = await listOperations();
      setRecords((res.data as ServiceOperationRecord[]) ?? []);
    } catch {
      /* ignore */
    }
  };
  useEffect(() => {
    refresh();
  }, []);

  const overviewStats = useMemo(
    () => (Object.keys(statusMeta) as OperationStatus[]).map((key) => ({ key, count: records.filter((i) => i.status === key).length, ...statusMeta[key] })),
    [records],
  );

  const filteredRecords = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return records.filter((item) => {
      const matchesKeyword = !kw || [item.orderNo, item.customerName, item.productName, item.impactScope, item.owner].join('|').toLowerCase().includes(kw);
      const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
      const matchesType = selectedType === 'all' || item.operationType === selectedType;
      return matchesKeyword && matchesStatus && matchesType;
    });
  }, [keyword, records, selectedStatus, selectedType]);

  const closeOrder = async (record: ServiceOperationRecord) => {
    await updateOperation(record.id, { status: 'completed' });
    message.success('已关闭运营单');
    refresh();
  };
  const handleDelete = (record: ServiceOperationRecord) => {
    modal.confirm({
      title: '确认删除该运营单？',
      content: `运营单号：${record.orderNo}`,
      okType: 'danger',
      onOk: async () => {
        await removeOperation(record.id);
        message.success('已删除');
        refresh();
      },
    });
  };

  const columns: ProColumns<ServiceOperationRecord>[] = [
    { title: '运营单号', dataIndex: 'orderNo', width: 160, fixed: 'left', render: (_, record) => <a className={styles.recordLink} onClick={() => setDetailRecord(record)}>{record.orderNo}</a> },
    { title: '客户', dataIndex: 'customerName', width: 140 },
    { title: '服务产品', dataIndex: 'productName', width: 180 },
    { title: '操作类型', dataIndex: 'operationType', width: 100 },
    { title: '处理状态', dataIndex: 'status', width: 110, render: (_, record) => <Tag color={statusMeta[record.status].tagColor}>{statusMeta[record.status].label}</Tag> },
    { title: '提交时间', dataIndex: 'submitTime', width: 160 },
    { title: '目标完成日', dataIndex: 'targetDate', width: 120 },
    { title: '影响范围', dataIndex: 'impactScope', width: 180 },
    { title: '负责人', dataIndex: 'owner', width: 120 },
    {
      title: '操作',
      dataIndex: 'action',
      width: 230,
      fixed: 'right',
      render: (_, record) => (
        <span className={styles.actionLinks}>
          <a onClick={() => setDetailRecord(record)}>详情</a>
          <a onClick={() => { setEditing(record); setFormOpen(true); }}>转派/编辑</a>
          <a onClick={() => closeOrder(record)}>关闭</a>
          <a onClick={() => handleDelete(record)}>删除</a>
        </span>
      ),
    },
  ];

  return (
    <PageContainer className={styles.serviceOperationsPage} header={{ title: '服务运营', subTitle: '运营工单来自后端 /api/service-operations，支持新建 / 编辑 / 关闭 / 删除。' }}>
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
        <Alert banner message="运营工单总览：处理中与阻塞工单建议优先跟进。" type="warning" />
      </div>

      <div className={styles.filterCard}>
        <div className={styles.searchGrid}>
          <Input allowClear placeholder="搜索运营单号 / 客户 / 产品 / 负责人" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          <Select options={[{ label: '全部状态', value: 'all' }, ...overviewStats.map((i) => ({ label: i.label, value: i.key }))]} value={selectedStatus} onChange={setSelectedStatus} />
          <Select options={[{ label: '全部操作类型', value: 'all' }, ...operationTypeOptions.map((v) => ({ label: v, value: v }))]} value={selectedType} onChange={setSelectedType} />
          <div />
          <Space>
            <Button type="primary" onClick={() => message.success('已按条件筛选')}>搜索</Button>
            <Button onClick={() => { setKeyword(''); setSelectedStatus('all'); setSelectedType('all'); }}>重置</Button>
          </Space>
        </div>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableMeta}>
          <span>当前结果 <strong>{filteredRecords.length}</strong> 条</span>
          <Space size={12}>
            <span>运营工单数据来自后端，支持新建、编辑、关闭与删除。</span>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(undefined); setFormOpen(true); }}>新建运营单</Button>
          </Space>
        </div>
        <ProTable<ServiceOperationRecord>
          cardBordered
          className={styles.tableWrap}
          columns={columns}
          dataSource={filteredRecords}
          options={false}
          pagination={{ pageSize: 10, showQuickJumper: true, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
          rowKey="id"
          scroll={{ x: 1750 }}
          search={false}
          tableAlertRender={false}
        />
      </div>

      <ModalForm<ServiceOperationRecord>
        key={editing?.id ?? 'create'}
        title={editing ? `编辑运营单 · ${editing.orderNo}` : '新建运营单'}
        open={formOpen}
        onOpenChange={setFormOpen}
        grid
        rowProps={{ gutter: 16 }}
        modalProps={{ destroyOnClose: true }}
        initialValues={editing ?? { operationType: '续费', status: 'pending', owner: '服务运营组' }}
        onFinish={async (values) => {
          try {
            if (editing) await updateOperation(editing.id, values);
            else await createOperation(values);
            message.success(editing ? '已保存' : '已新建运营单');
            setFormOpen(false);
            refresh();
            return true;
          } catch {
            message.error('提交失败');
            return false;
          }
        }}
      >
        <ProFormText name="orderNo" label="运营单号" colProps={{ span: 12 }} rules={[{ required: true }]} />
        <ProFormText name="customerName" label="客户" colProps={{ span: 12 }} rules={[{ required: true }]} />
        <ProFormText name="productName" label="服务产品" colProps={{ span: 12 }} />
        <ProFormSelect name="operationType" label="操作类型" colProps={{ span: 12 }} options={operationTypeOptions.map((v) => ({ label: v, value: v }))} />
        <ProFormSelect name="status" label="处理状态" colProps={{ span: 12 }} options={(Object.keys(statusMeta) as OperationStatus[]).map((k) => ({ label: statusMeta[k].label, value: k }))} />
        <ProFormText name="submitTime" label="提交时间" placeholder="YYYY-MM-DD HH:mm" colProps={{ span: 12 }} />
        <ProFormText name="targetDate" label="目标完成日" placeholder="YYYY-MM-DD" colProps={{ span: 12 }} />
        <ProFormText name="owner" label="负责人" colProps={{ span: 12 }} />
        <ProFormText name="impactScope" label="影响范围" colProps={{ span: 24 }} />
        <ProFormTextArea name="remark" label="备注" colProps={{ span: 24 }} />
      </ModalForm>

      <Drawer destroyOnHidden onClose={() => setDetailRecord(undefined)} open={Boolean(detailRecord)} title={detailRecord ? `${detailRecord.orderNo} 运营单详情` : '运营单详情'} width={680}>
        {detailRecord ? (
          <Space direction="vertical" size={16} style={{ display: 'flex' }}>
            <Alert message={detailRecord.remark} type="info" showIcon />
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="运营单号">{detailRecord.orderNo}</Descriptions.Item>
              <Descriptions.Item label="客户">{detailRecord.customerName}</Descriptions.Item>
              <Descriptions.Item label="服务产品">{detailRecord.productName}</Descriptions.Item>
              <Descriptions.Item label="操作类型">{detailRecord.operationType}</Descriptions.Item>
              <Descriptions.Item label="处理状态"><Tag color={statusMeta[detailRecord.status].tagColor}>{statusMeta[detailRecord.status].label}</Tag></Descriptions.Item>
              <Descriptions.Item label="提交时间">{detailRecord.submitTime}</Descriptions.Item>
              <Descriptions.Item label="目标完成日">{detailRecord.targetDate}</Descriptions.Item>
              <Descriptions.Item label="负责人">{detailRecord.owner}</Descriptions.Item>
              <Descriptions.Item label="影响范围">{detailRecord.impactScope}</Descriptions.Item>
            </Descriptions>
          </Space>
        ) : null}
      </Drawer>
    </PageContainer>
  );
};

export default ServiceOperationsPage;
