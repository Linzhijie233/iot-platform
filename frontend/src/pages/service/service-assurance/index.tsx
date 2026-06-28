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
  type AssuranceItem,
  createAssurance,
  listAssurances,
  removeAssurance,
  updateAssurance,
} from '@/services/platform/services';
import styles from './index.less';

type AssuranceStatus = AssuranceItem['status'];
type AssuranceRecord = AssuranceItem;

const statusMeta: Record<AssuranceStatus, { label: string; color: string; hint: string; tagColor: string }> = {
  open: { label: '待响应', color: '#f59e0b', hint: '事件已产生，等待客服或保障团队响应', tagColor: 'warning' },
  responding: { label: '处理中', color: '#1677ff', hint: '事件正在跟进中，需持续观察处理时效', tagColor: 'processing' },
  resolved: { label: '已解决', color: '#16a34a', hint: '问题已闭环并已通知相关方', tagColor: 'success' },
  'breach-risk': { label: 'SLA风险', color: '#ef4444', hint: '存在超时风险，需要优先升级处理', tagColor: 'error' },
};

const assuranceTypeOptions = ['异常通知', '客服协同', 'SLA跟踪'];

const ServiceAssurancePage: React.FC = () => {
  const { message, modal } = App.useApp();
  const [records, setRecords] = useState<AssuranceRecord[]>([]);
  const [keyword, setKeyword] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | AssuranceStatus>('all');
  const [selectedType, setSelectedType] = useState('all');
  const [detailRecord, setDetailRecord] = useState<AssuranceRecord>();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AssuranceRecord>();

  const refresh = async () => {
    try {
      const res = await listAssurances();
      setRecords((res.data as AssuranceRecord[]) ?? []);
    } catch {
      /* ignore */
    }
  };
  useEffect(() => {
    refresh();
  }, []);

  const overviewStats = useMemo(
    () => (Object.keys(statusMeta) as AssuranceStatus[]).map((key) => ({ key, count: records.filter((i) => i.status === key).length, ...statusMeta[key] })),
    [records],
  );

  const filteredRecords = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return records.filter((item) => {
      const matchesKeyword = !kw || [item.ticketNo, item.customerName, item.productName, item.owner, item.channel].join('|').toLowerCase().includes(kw);
      const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
      const matchesType = selectedType === 'all' || item.assuranceType === selectedType;
      return matchesKeyword && matchesStatus && matchesType;
    });
  }, [keyword, records, selectedStatus, selectedType]);

  const escalate = async (record: AssuranceRecord) => {
    await updateAssurance(record.id, { priority: '高', status: 'breach-risk' });
    message.success('已升级');
    refresh();
  };
  const closeTicket = async (record: AssuranceRecord) => {
    await updateAssurance(record.id, { status: 'resolved' });
    message.success('已关闭（已解决）');
    refresh();
  };
  const handleDelete = (record: AssuranceRecord) => {
    modal.confirm({
      title: '确认删除该保障单？',
      content: `保障单号：${record.ticketNo}`,
      okType: 'danger',
      onOk: async () => {
        await removeAssurance(record.id);
        message.success('已删除');
        refresh();
      },
    });
  };

  const columns: ProColumns<AssuranceRecord>[] = [
    { title: '保障单号', dataIndex: 'ticketNo', width: 160, fixed: 'left', render: (_, record) => <a className={styles.recordLink} onClick={() => setDetailRecord(record)}>{record.ticketNo}</a> },
    { title: '客户', dataIndex: 'customerName', width: 140 },
    { title: '服务产品', dataIndex: 'productName', width: 180 },
    { title: '保障类型', dataIndex: 'assuranceType', width: 110 },
    { title: '状态', dataIndex: 'status', width: 110, render: (_, record) => <Tag color={statusMeta[record.status].tagColor}>{statusMeta[record.status].label}</Tag> },
    { title: '优先级', dataIndex: 'priority', width: 90 },
    { title: '创建时间', dataIndex: 'createTime', width: 160 },
    { title: '截止时间', dataIndex: 'deadline', width: 160 },
    { title: '负责人', dataIndex: 'owner', width: 120 },
    { title: '触达渠道', dataIndex: 'channel', width: 140 },
    {
      title: '操作',
      dataIndex: 'action',
      width: 250,
      fixed: 'right',
      render: (_, record) => (
        <span className={styles.actionLinks}>
          <a onClick={() => setDetailRecord(record)}>详情</a>
          <a onClick={() => { setEditing(record); setFormOpen(true); }}>编辑</a>
          <a onClick={() => escalate(record)}>升级</a>
          <a onClick={() => closeTicket(record)}>关闭</a>
          <a onClick={() => handleDelete(record)}>删除</a>
        </span>
      ),
    },
  ];

  return (
    <PageContainer className={styles.serviceAssurancePage} header={{ title: '服务保障', subTitle: '保障事件来自后端 /api/service-assurances，支持新建 / 编辑 / 升级 / 关闭 / 删除。' }}>
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
        <Alert banner message="保障事件总览：待响应与 SLA 风险事件建议优先升级处理。" type="warning" />
      </div>

      <div className={styles.filterCard}>
        <div className={styles.searchGrid}>
          <Input allowClear placeholder="搜索保障单号 / 客户 / 产品 / 渠道" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          <Select options={[{ label: '全部状态', value: 'all' }, ...overviewStats.map((i) => ({ label: i.label, value: i.key }))]} value={selectedStatus} onChange={setSelectedStatus} />
          <Select options={[{ label: '全部保障类型', value: 'all' }, ...assuranceTypeOptions.map((v) => ({ label: v, value: v }))]} value={selectedType} onChange={setSelectedType} />
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
            <span>保障事件数据来自后端，支持新建、编辑、升级、关闭与删除。</span>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(undefined); setFormOpen(true); }}>新建保障单</Button>
          </Space>
        </div>
        <ProTable<AssuranceRecord>
          cardBordered
          className={styles.tableWrap}
          columns={columns}
          dataSource={filteredRecords}
          options={false}
          pagination={{ pageSize: 10, showQuickJumper: true, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
          rowKey="id"
          scroll={{ x: 1800 }}
          search={false}
          tableAlertRender={false}
        />
      </div>

      <ModalForm<AssuranceRecord>
        key={editing?.id ?? 'create'}
        title={editing ? `编辑保障单 · ${editing.ticketNo}` : '新建保障单'}
        open={formOpen}
        onOpenChange={setFormOpen}
        grid
        rowProps={{ gutter: 16 }}
        modalProps={{ destroyOnClose: true }}
        initialValues={editing ?? { assuranceType: '异常通知', status: 'open', priority: '中', owner: '客服支持组', channel: '工单系统' }}
        onFinish={async (values) => {
          try {
            if (editing) await updateAssurance(editing.id, values);
            else await createAssurance(values);
            message.success(editing ? '已保存' : '已新建保障单');
            setFormOpen(false);
            refresh();
            return true;
          } catch {
            message.error('提交失败');
            return false;
          }
        }}
      >
        <ProFormText name="ticketNo" label="保障单号" colProps={{ span: 12 }} rules={[{ required: true }]} />
        <ProFormText name="customerName" label="客户" colProps={{ span: 12 }} rules={[{ required: true }]} />
        <ProFormText name="productName" label="服务产品" colProps={{ span: 12 }} />
        <ProFormSelect name="assuranceType" label="保障类型" colProps={{ span: 12 }} options={assuranceTypeOptions.map((v) => ({ label: v, value: v }))} />
        <ProFormSelect name="status" label="状态" colProps={{ span: 12 }} options={(Object.keys(statusMeta) as AssuranceStatus[]).map((k) => ({ label: statusMeta[k].label, value: k }))} />
        <ProFormSelect name="priority" label="优先级" colProps={{ span: 12 }} options={['高', '中', '低'].map((v) => ({ label: v, value: v }))} />
        <ProFormText name="createTime" label="创建时间" placeholder="YYYY-MM-DD HH:mm" colProps={{ span: 12 }} />
        <ProFormText name="deadline" label="截止时间" placeholder="YYYY-MM-DD HH:mm" colProps={{ span: 12 }} />
        <ProFormText name="owner" label="负责人" colProps={{ span: 12 }} />
        <ProFormText name="channel" label="触达渠道" colProps={{ span: 12 }} />
        <ProFormTextArea name="remark" label="备注" colProps={{ span: 24 }} />
      </ModalForm>

      <Drawer destroyOnHidden onClose={() => setDetailRecord(undefined)} open={Boolean(detailRecord)} title={detailRecord ? `${detailRecord.ticketNo} 保障单详情` : '保障单详情'} width={680}>
        {detailRecord ? (
          <Space direction="vertical" size={16} style={{ display: 'flex' }}>
            <Alert message={detailRecord.remark} type="info" showIcon />
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="保障单号">{detailRecord.ticketNo}</Descriptions.Item>
              <Descriptions.Item label="客户">{detailRecord.customerName}</Descriptions.Item>
              <Descriptions.Item label="服务产品">{detailRecord.productName}</Descriptions.Item>
              <Descriptions.Item label="保障类型">{detailRecord.assuranceType}</Descriptions.Item>
              <Descriptions.Item label="状态"><Tag color={statusMeta[detailRecord.status].tagColor}>{statusMeta[detailRecord.status].label}</Tag></Descriptions.Item>
              <Descriptions.Item label="优先级">{detailRecord.priority}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{detailRecord.createTime}</Descriptions.Item>
              <Descriptions.Item label="截止时间">{detailRecord.deadline}</Descriptions.Item>
              <Descriptions.Item label="负责人">{detailRecord.owner}</Descriptions.Item>
              <Descriptions.Item label="触达渠道">{detailRecord.channel}</Descriptions.Item>
            </Descriptions>
          </Space>
        ) : null}
      </Drawer>
    </PageContainer>
  );
};

export default ServiceAssurancePage;
