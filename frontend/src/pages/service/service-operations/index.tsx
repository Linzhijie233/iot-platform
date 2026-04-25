import type { ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Alert, App, Button, Descriptions, Drawer, Input, Modal, Select, Space, Tag } from 'antd';
import React, { useMemo, useState } from 'react';
import styles from './index.less';

type OperationStatus = 'pending' | 'processing' | 'completed' | 'blocked';

type ServiceOperationRecord = {
  id: string;
  orderNo: string;
  customerName: string;
  productName: string;
  operationType: '续费' | '升级' | '停服' | '恢复';
  status: OperationStatus;
  submitTime: string;
  targetDate: string;
  owner: string;
  impactScope: string;
  remark: string;
};

const statusMeta: Record<OperationStatus, { label: string; color: string; hint: string; tagColor: string }> = {
  pending: { label: '待处理', color: '#f59e0b', hint: '申请已提交，等待运营处理', tagColor: 'warning' },
  processing: { label: '处理中', color: '#1677ff', hint: '正在处理流程中，需持续跟进', tagColor: 'processing' },
  completed: { label: '已完成', color: '#16a34a', hint: '运营处理已完成并已回执', tagColor: 'success' },
  blocked: { label: '已阻塞', color: '#ef4444', hint: '存在前置条件缺失或审核阻塞', tagColor: 'error' },
};

const records: ServiceOperationRecord[] = [
  { id: 'op-1', orderNo: 'OPS-2026-0001', customerName: '顺运冷链', productName: '设备在线监测服务', operationType: '续费', status: 'pending', submitTime: '2026-04-12 09:10', targetDate: '2026-04-15', owner: '服务运营组', impactScope: '冷链监测标准版', remark: '客户要求续费 1 年并保留现有 SLA。' },
  { id: 'op-2', orderNo: 'OPS-2026-0002', customerName: '新零售事业部', productName: '设备异常告警服务', operationType: '升级', status: 'processing', submitTime: '2026-04-11 14:20', targetDate: '2026-04-13', owner: '客户成功组', impactScope: '门店告警协同版', remark: '升级到增强告警版本并追加短信通知能力。' },
  { id: 'op-3', orderNo: 'OPS-2026-0003', customerName: '城市水务', productName: '守护码映射服务', operationType: '恢复', status: 'completed', submitTime: '2026-04-10 11:05', targetDate: '2026-04-10', owner: '平台产品组', impactScope: '映射能力试运行', remark: '测试环境配置完成，已恢复实例调用。' },
  { id: 'op-4', orderNo: 'OPS-2026-0004', customerName: '车联网项目组', productName: '客服协同服务', operationType: '停服', status: 'blocked', submitTime: '2026-04-09 16:30', targetDate: '2026-04-12', owner: '客服支持组', impactScope: '车辆售后支撑版', remark: '存在未关闭工单，暂不允许直接停服。' },
];

const ServiceOperationsPage: React.FC = () => {
  const { message } = App.useApp();
  const [keyword, setKeyword] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | OperationStatus>('all');
  const [selectedType, setSelectedType] = useState('all');
  const [detailRecord, setDetailRecord] = useState<ServiceOperationRecord>();
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const overviewStats = useMemo(
    () => (Object.keys(statusMeta) as OperationStatus[]).map((key) => ({
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
        [item.orderNo, item.customerName, item.productName, item.impactScope, item.owner]
          .join('|')
          .toLowerCase()
          .includes(normalizedKeyword);
      const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
      const matchesType = selectedType === 'all' || item.operationType === selectedType;
      return matchesKeyword && matchesStatus && matchesType;
    });
  }, [keyword, selectedStatus, selectedType]);

  const columns: ProColumns<ServiceOperationRecord>[] = [
    {
      title: '运营单号',
      dataIndex: 'orderNo',
      width: 160,
      fixed: 'left',
      render: (_, record) => (
        <a className={styles.recordLink} onClick={() => setDetailRecord(record)}>
          {record.orderNo}
        </a>
      ),
    },
    { title: '客户', dataIndex: 'customerName', width: 140 },
    { title: '服务产品', dataIndex: 'productName', width: 180 },
    { title: '操作类型', dataIndex: 'operationType', width: 100 },
    {
      title: '处理状态',
      dataIndex: 'status',
      width: 110,
      render: (_, record) => <Tag color={statusMeta[record.status].tagColor}>{statusMeta[record.status].label}</Tag>,
    },
    { title: '提交时间', dataIndex: 'submitTime', width: 160 },
    { title: '目标完成日', dataIndex: 'targetDate', width: 120 },
    { title: '影响范围', dataIndex: 'impactScope', width: 180 },
    { title: '负责人', dataIndex: 'owner', width: 120 },
    {
      title: '操作',
      dataIndex: 'action',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <span className={styles.actionLinks}>
          <a onClick={() => setDetailRecord(record)}>详情</a>
          <a onClick={() => message.info(`${record.orderNo} 为静态转派入口`)}>转派</a>
          <a onClick={() => message.info(`${record.orderNo} 为静态关闭入口`)}>关闭</a>
        </span>
      ),
    },
  ];

  return (
    <PageContainer className={styles.serviceOperationsPage} header={{ title: '服务运营', subTitle: '统一处理续费、升级、停服、恢复等服务运营动作。' }}>
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
        <Alert banner message="当前有 2 条运营单需要优先处理：1 条升级处理中、1 条停服阻塞，建议先检查新零售和车联网客户。" type="warning" />
      </div>

      <div className={styles.filterCard}>
        <div className={styles.searchGrid}>
          <Input allowClear placeholder="搜索运营单号 / 客户 / 产品 / 负责人" value={keyword} onChange={(event) => setKeyword(event.target.value)} />
          <Select
            options={[{ label: '全部状态', value: 'all' }, ...overviewStats.map((item) => ({ label: item.label, value: item.key }))]}
            value={selectedStatus}
            onChange={setSelectedStatus}
          />
          <Select
            options={[{ label: '全部操作类型', value: 'all' }, { label: '续费', value: '续费' }, { label: '升级', value: '升级' }, { label: '停服', value: '停服' }, { label: '恢复', value: '恢复' }]}
            value={selectedType}
            onChange={setSelectedType}
          />
          <div />
          <Space>
            <Button type="primary" onClick={() => message.success('已按静态条件刷新运营列表')}>搜索</Button>
            <Button onClick={() => { setKeyword(''); setSelectedStatus('all'); setSelectedType('all'); }}>重置</Button>
          </Space>
        </div>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableMeta}>
          <span>当前结果 <strong>{filteredRecords.length}</strong> 条</span>
          <Space size={12}>
            <span>列表页提供运营工单查看与静态处理入口，不承载真实审批与执行链路。</span>
            <Button type="primary" onClick={() => setCreateModalOpen(true)}>新建运营单</Button>
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
          scroll={{ x: 1700 }}
          search={false}
          tableAlertRender={false}
          tableAlertOptionRender={false}
          toolbar={undefined}
        />
      </div>

      <Drawer destroyOnHidden onClose={() => setDetailRecord(undefined)} open={Boolean(detailRecord)} title={detailRecord ? `${detailRecord.orderNo} 运营详情` : '运营详情'} width={720}>
        {detailRecord ? (
          <Space direction="vertical" size={16} style={{ display: 'flex' }}>
            <Alert message={detailRecord.remark} type={detailRecord.status === 'blocked' ? 'warning' : 'info'} showIcon />
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="运营单号">{detailRecord.orderNo}</Descriptions.Item>
              <Descriptions.Item label="客户">{detailRecord.customerName}</Descriptions.Item>
              <Descriptions.Item label="服务产品">{detailRecord.productName}</Descriptions.Item>
              <Descriptions.Item label="操作类型">{detailRecord.operationType}</Descriptions.Item>
              <Descriptions.Item label="处理状态"><Tag color={statusMeta[detailRecord.status].tagColor}>{statusMeta[detailRecord.status].label}</Tag></Descriptions.Item>
              <Descriptions.Item label="负责人">{detailRecord.owner}</Descriptions.Item>
              <Descriptions.Item label="提交时间">{detailRecord.submitTime}</Descriptions.Item>
              <Descriptions.Item label="目标完成日">{detailRecord.targetDate}</Descriptions.Item>
              <Descriptions.Item label="影响范围">{detailRecord.impactScope}</Descriptions.Item>
              <Descriptions.Item label="备注">{detailRecord.remark}</Descriptions.Item>
            </Descriptions>
          </Space>
        ) : null}
      </Drawer>

      <Modal destroyOnHidden okText="提交运营单" onCancel={() => setCreateModalOpen(false)} onOk={() => { message.success('已触发静态提交：运营处理单已创建'); setCreateModalOpen(false); }} open={createModalOpen} title="新建运营单" width={760}>
        <Space direction="vertical" size={16} style={{ display: 'flex' }}>
          <Alert message="当前为静态演示流程，用于表达续费、升级、停服、恢复等运营申请入口。" showIcon type="info" />
          <div>
            <div className={styles.sectionTitle}>建议表单项</div>
            <div className={styles.metricGrid}>
              {[
                ['基础信息', '客户、产品、操作类型、负责人'],
                ['执行窗口', '目标完成时间、影响范围、执行方式'],
                ['前置校验', '未结事项、账务状态、实例状态检查'],
                ['处理说明', '原因备注、通知对象、回执要求'],
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

export default ServiceOperationsPage;
