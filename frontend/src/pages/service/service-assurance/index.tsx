import type { ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Alert, App, Button, Descriptions, Drawer, Input, Modal, Select, Space, Tag } from 'antd';
import React, { useMemo, useState } from 'react';
import styles from './index.less';

type AssuranceStatus = 'open' | 'responding' | 'resolved' | 'breach-risk';

type AssuranceRecord = {
  id: string;
  ticketNo: string;
  customerName: string;
  productName: string;
  assuranceType: '异常通知' | '客服协同' | 'SLA跟踪';
  status: AssuranceStatus;
  priority: '高' | '中' | '低';
  createTime: string;
  deadline: string;
  owner: string;
  channel: string;
  remark: string;
};

const statusMeta: Record<AssuranceStatus, { label: string; color: string; hint: string; tagColor: string }> = {
  open: { label: '待响应', color: '#f59e0b', hint: '事件已产生，等待客服或保障团队响应', tagColor: 'warning' },
  responding: { label: '处理中', color: '#1677ff', hint: '事件正在跟进中，需持续观察处理时效', tagColor: 'processing' },
  resolved: { label: '已解决', color: '#16a34a', hint: '问题已闭环并已通知相关方', tagColor: 'success' },
  'breach-risk': { label: 'SLA风险', color: '#ef4444', hint: '存在超时风险，需要优先升级处理', tagColor: 'error' },
};

const records: AssuranceRecord[] = [
  { id: 'as-1', ticketNo: 'AST-2026-0001', customerName: '顺运冷链', productName: '设备在线监测服务', assuranceType: '异常通知', status: 'open', priority: '高', createTime: '2026-04-12 08:40', deadline: '2026-04-12 10:40', owner: '客服支持组', channel: '短信 + 站内信', remark: '客户反馈批量离线告警未按约定发送。' },
  { id: 'as-2', ticketNo: 'AST-2026-0002', customerName: '新零售事业部', productName: '设备异常告警服务', assuranceType: '客服协同', status: 'responding', priority: '中', createTime: '2026-04-11 15:20', deadline: '2026-04-12 15:20', owner: '客户成功组', channel: '工单系统', remark: '门店多次误报，需要客服协同确认阈值配置。' },
  { id: 'as-3', ticketNo: 'AST-2026-0003', customerName: '城市水务', productName: '守护码映射服务', assuranceType: 'SLA跟踪', status: 'resolved', priority: '低', createTime: '2026-04-10 09:00', deadline: '2026-04-10 18:00', owner: '平台产品组', channel: '邮件', remark: '接口抖动已恢复，SLA记录已补齐。' },
  { id: 'as-4', ticketNo: 'AST-2026-0004', customerName: '车联网项目组', productName: '客服协同服务', assuranceType: 'SLA跟踪', status: 'breach-risk', priority: '高', createTime: '2026-04-12 07:30', deadline: '2026-04-12 09:30', owner: '客服支持组', channel: '电话 + 工单', remark: '存在未在 SLA 时限内响应的风险，需要立即升级。' },
];

const ServiceAssurancePage: React.FC = () => {
  const { message } = App.useApp();
  const [keyword, setKeyword] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | AssuranceStatus>('all');
  const [selectedType, setSelectedType] = useState('all');
  const [detailRecord, setDetailRecord] = useState<AssuranceRecord>();
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const overviewStats = useMemo(
    () => (Object.keys(statusMeta) as AssuranceStatus[]).map((key) => ({
      key,
      count: records.filter((item) => item.status === key).length,
      ...statusMeta[key],
    })),
    [],
  );

  const filteredRecords = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    return records.filter((item) => {
      const matchesKeyword =
        !normalizedKeyword ||
        [item.ticketNo, item.customerName, item.productName, item.owner, item.channel]
          .join('|')
          .toLowerCase()
          .includes(normalizedKeyword);
      const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
      const matchesType = selectedType === 'all' || item.assuranceType === selectedType;
      return matchesKeyword && matchesStatus && matchesType;
    });
  }, [keyword, selectedStatus, selectedType]);

  const columns: ProColumns<AssuranceRecord>[] = [
    {
      title: '保障单号',
      dataIndex: 'ticketNo',
      width: 160,
      fixed: 'left',
      render: (_, record) => (
        <a className={styles.recordLink} onClick={() => setDetailRecord(record)}>
          {record.ticketNo}
        </a>
      ),
    },
    { title: '客户', dataIndex: 'customerName', width: 140 },
    { title: '服务产品', dataIndex: 'productName', width: 180 },
    { title: '保障类型', dataIndex: 'assuranceType', width: 110 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 110,
      render: (_, record) => <Tag color={statusMeta[record.status].tagColor}>{statusMeta[record.status].label}</Tag>,
    },
    { title: '优先级', dataIndex: 'priority', width: 90 },
    { title: '创建时间', dataIndex: 'createTime', width: 160 },
    { title: '截止时间', dataIndex: 'deadline', width: 160 },
    { title: '负责人', dataIndex: 'owner', width: 120 },
    { title: '触达渠道', dataIndex: 'channel', width: 140 },
    {
      title: '操作',
      dataIndex: 'action',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <span className={styles.actionLinks}>
          <a onClick={() => setDetailRecord(record)}>详情</a>
          <a onClick={() => message.info(`${record.ticketNo} 为静态升级入口`)}>升级</a>
          <a onClick={() => message.info(`${record.ticketNo} 为静态关闭入口`)}>关闭</a>
        </span>
      ),
    },
  ];

  return (
    <PageContainer className={styles.serviceAssurancePage} header={{ title: '服务保障', subTitle: '统一查看异常通知、客服协同和 SLA 风险跟踪情况。' }}>
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
        <Alert banner message="当前有 2 条保障事件需优先处理：1 条待响应、1 条 SLA 风险，建议先升级车联网项目单据。" type="warning" />
      </div>

      <div className={styles.filterCard}>
        <div className={styles.searchGrid}>
          <Input allowClear placeholder="搜索保障单号 / 客户 / 产品 / 渠道" value={keyword} onChange={(event) => setKeyword(event.target.value)} />
          <Select
            options={[{ label: '全部状态', value: 'all' }, ...overviewStats.map((item) => ({ label: item.label, value: item.key }))]}
            value={selectedStatus}
            onChange={setSelectedStatus}
          />
          <Select
            options={[{ label: '全部保障类型', value: 'all' }, { label: '异常通知', value: '异常通知' }, { label: '客服协同', value: '客服协同' }, { label: 'SLA跟踪', value: 'SLA跟踪' }]}
            value={selectedType}
            onChange={setSelectedType}
          />
          <div />
          <Space>
            <Button type="primary" onClick={() => message.success('已按静态条件刷新保障列表')}>搜索</Button>
            <Button onClick={() => { setKeyword(''); setSelectedStatus('all'); setSelectedType('all'); }}>重置</Button>
          </Space>
        </div>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableMeta}>
          <span>当前结果 <strong>{filteredRecords.length}</strong> 条</span>
          <Space size={12}>
            <span>列表页提供保障事件查看与静态处置入口，不承载真实消息通知与工单联动。</span>
            <Button type="primary" onClick={() => setCreateModalOpen(true)}>新建保障单</Button>
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
          scroll={{ x: 1750 }}
          search={false}
          tableAlertRender={false}
          tableAlertOptionRender={false}
          toolbar={undefined}
        />
      </div>

      <Drawer destroyOnHidden onClose={() => setDetailRecord(undefined)} open={Boolean(detailRecord)} title={detailRecord ? `${detailRecord.ticketNo} 保障详情` : '保障详情'} width={720}>
        {detailRecord ? (
          <Space direction="vertical" size={16} style={{ display: 'flex' }}>
            <Alert message={detailRecord.remark} type={detailRecord.status === 'breach-risk' ? 'warning' : 'info'} showIcon />
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

      <Modal destroyOnHidden okText="提交保障单" onCancel={() => setCreateModalOpen(false)} onOk={() => { message.success('已触发静态提交：保障事件单已创建'); setCreateModalOpen(false); }} open={createModalOpen} title="新建保障单" width={760}>
        <Space direction="vertical" size={16} style={{ display: 'flex' }}>
          <Alert message="当前为静态演示流程，用于表达异常通知、客服协同和 SLA 风险跟踪入口。" showIcon type="info" />
          <div>
            <div className={styles.sectionTitle}>建议表单项</div>
            <div className={styles.metricGrid}>
              {[
                ['事件信息', '客户、产品、保障类型、优先级'],
                ['处置要求', '响应时限、截止时间、升级策略'],
                ['触达方式', '短信、邮件、站内信、电话、工单'],
                ['处理说明', '异常现象、影响范围、备注'],
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

export default ServiceAssurancePage;
