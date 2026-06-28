import type { ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormDigit,
  ProFormText,
  ProTable,
} from '@ant-design/pro-components';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { App, Button, DatePicker, Descriptions, Drawer, Space } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import {
  type CommissionItem,
  createCommission,
  listCommissions,
  removeCommission,
  updateCommission,
} from '@/services/platform/finance';
import styles from './index.less';

type CommissionSummaryRecord = CommissionItem;

const CommissionManagementPage: React.FC = () => {
  const { message, modal } = App.useApp();
  const [records, setRecords] = useState<CommissionSummaryRecord[]>([]);
  const [detailRecord, setDetailRecord] = useState<CommissionSummaryRecord>();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CommissionSummaryRecord>();

  const refresh = async () => {
    try {
      const res = await listCommissions();
      setRecords((res.data as CommissionSummaryRecord[]) ?? []);
    } catch {
      /* ignore */
    }
  };
  useEffect(() => {
    refresh();
  }, []);

  const summary = useMemo(
    () => ({
      orderAmount: records.reduce((s, i) => s + (i.orderTotalAmount || 0), 0),
      marginAmount: records.reduce((s, i) => s + (i.marginTotalAmount || 0), 0),
      commissionAmount: records.reduce((s, i) => s + (i.commissionAmount || 0), 0),
    }),
    [records],
  );

  const handleDelete = (record: CommissionSummaryRecord) => {
    modal.confirm({
      title: '确认删除该分佣记录？',
      content: `周期：${record.period}`,
      okType: 'danger',
      onOk: async () => {
        await removeCommission(record.id);
        message.success('已删除');
        refresh();
      },
    });
  };

  const columns: ProColumns<CommissionSummaryRecord>[] = [
    { title: '计算周期类型', dataIndex: 'settlementType', width: 180 },
    { title: '周期', dataIndex: 'period', width: 120 },
    { title: '订单总金额（￥）', dataIndex: 'orderTotalAmount', width: 140, render: (_, r) => (r.orderTotalAmount ?? 0).toFixed(2) },
    { title: '成本总金额（￥）', dataIndex: 'costTotalAmount', width: 140, render: (_, r) => (r.costTotalAmount ?? 0).toFixed(2) },
    { title: '差价总金额（￥）', dataIndex: 'marginTotalAmount', width: 140, render: (_, r) => (r.marginTotalAmount ?? 0).toFixed(2) },
    { title: '佣金比例', dataIndex: 'commissionRatio', width: 120 },
    { title: '佣金（￥）', dataIndex: 'commissionAmount', width: 120, render: (_, r) => (r.commissionAmount ?? 0).toFixed(2) },
    {
      title: '操作',
      dataIndex: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="middle">
          <a onClick={() => setDetailRecord(record)}>查看详细</a>
          <a onClick={() => { setEditing(record); setFormOpen(true); }}>编辑</a>
          <a onClick={() => handleDelete(record)}>删除</a>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer className={styles.commissionManagementPage} header={{ title: '分佣管理', subTitle: '分佣汇总来自后端 /api/commissions，支持新增 / 编辑 / 删除及金额汇总。' }}>
      <div className={styles.filterCard}>
        <div className={styles.searchGrid}>
          <DatePicker picker="month" placeholder="开始年月" />
          <span>~</span>
          <DatePicker picker="month" placeholder="结束年月" />
          <Button type="primary" icon={<SearchOutlined />} onClick={() => message.success('已按条件筛选')}>搜索</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(undefined); setFormOpen(true); }}>新增分佣记录</Button>
        </div>
      </div>

      <div className={styles.summaryCard}>
        <div className={styles.summaryRow}>
          <div className={styles.summaryItem}>累计订单金额:<strong>{summary.orderAmount.toFixed(2)}</strong></div>
          <div className={styles.summaryItem}>累计差价金额:<strong>{summary.marginAmount.toFixed(2)}</strong></div>
          <div className={styles.summaryItem}>累计佣金:<strong>{summary.commissionAmount.toFixed(2)}</strong></div>
        </div>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableMeta}>
          <span>当前结果 <strong>{records.length}</strong> 条</span>
          <span>分佣汇总数据来自后端，支持新增、编辑与删除。</span>
        </div>
        <ProTable<CommissionSummaryRecord>
          cardBordered
          className={styles.tableWrap}
          columns={columns}
          dataSource={records}
          options={false}
          pagination={{ pageSize: 10, showQuickJumper: true, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
          rowKey="id"
          scroll={{ x: 1280 }}
          search={false}
          tableAlertRender={false}
        />
      </div>

      <ModalForm<CommissionSummaryRecord>
        key={editing?.id ?? 'create'}
        title={editing ? `编辑分佣 · ${editing.period}` : '新增分佣记录'}
        open={formOpen}
        onOpenChange={setFormOpen}
        grid
        rowProps={{ gutter: 16 }}
        modalProps={{ destroyOnClose: true }}
        initialValues={editing ?? { settlementType: '每 1 个月/次', orderTotalAmount: 0, costTotalAmount: 0, marginTotalAmount: 0, commissionRatio: '30%', commissionAmount: 0 }}
        onFinish={async (values) => {
          try {
            if (editing) await updateCommission(editing.id, values);
            else await createCommission(values);
            message.success(editing ? '已保存' : '已新增分佣记录');
            setFormOpen(false);
            refresh();
            return true;
          } catch {
            message.error('提交失败');
            return false;
          }
        }}
      >
        <ProFormText name="settlementType" label="计算周期类型" colProps={{ span: 12 }} />
        <ProFormText name="period" label="周期" placeholder="YYYYMM" colProps={{ span: 12 }} rules={[{ required: true }]} />
        <ProFormDigit name="orderTotalAmount" label="订单总金额(￥)" colProps={{ span: 12 }} fieldProps={{ precision: 2 }} />
        <ProFormDigit name="costTotalAmount" label="成本总金额(￥)" colProps={{ span: 12 }} fieldProps={{ precision: 2 }} />
        <ProFormDigit name="marginTotalAmount" label="差价总金额(￥)" colProps={{ span: 12 }} fieldProps={{ precision: 2 }} />
        <ProFormText name="commissionRatio" label="佣金比例" placeholder="如 30%" colProps={{ span: 12 }} />
        <ProFormDigit name="commissionAmount" label="佣金(￥)" colProps={{ span: 12 }} fieldProps={{ precision: 2 }} />
      </ModalForm>

      <Drawer destroyOnHidden onClose={() => setDetailRecord(undefined)} open={Boolean(detailRecord)} title={detailRecord ? `${detailRecord.period} 分佣详情` : '分佣详情'} width={720}>
        {detailRecord ? (
          <Space direction="vertical" size={16} style={{ display: 'flex' }}>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="结算周期类型">{detailRecord.settlementType}</Descriptions.Item>
              <Descriptions.Item label="周期">{detailRecord.period}</Descriptions.Item>
              <Descriptions.Item label="订单总金额">￥{(detailRecord.orderTotalAmount ?? 0).toFixed(2)}</Descriptions.Item>
              <Descriptions.Item label="成本总金额">￥{(detailRecord.costTotalAmount ?? 0).toFixed(2)}</Descriptions.Item>
              <Descriptions.Item label="差价总金额">￥{(detailRecord.marginTotalAmount ?? 0).toFixed(2)}</Descriptions.Item>
              <Descriptions.Item label="佣金比例">{detailRecord.commissionRatio}</Descriptions.Item>
              <Descriptions.Item label="佣金金额">￥{(detailRecord.commissionAmount ?? 0).toFixed(2)}</Descriptions.Item>
            </Descriptions>
          </Space>
        ) : null}
      </Drawer>
    </PageContainer>
  );
};

export default CommissionManagementPage;
