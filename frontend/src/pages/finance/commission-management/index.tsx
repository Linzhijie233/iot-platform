import { SearchOutlined } from '@ant-design/icons';
import type { ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { App, Button, DatePicker, Descriptions, Drawer, Space } from 'antd';
import React, { useMemo, useState } from 'react';
import styles from './index.less';

type CommissionSummaryRecord = {
  id: string;
  settlementType: string;
  period: string;
  orderTotalAmount: number;
  costTotalAmount: number;
  marginTotalAmount: number;
  commissionRatio: string;
  commissionAmount: number;
};

const commissionRecords: CommissionSummaryRecord[] = [
  {
    id: 'com-1',
    settlementType: '每 1 个月/次',
    period: '202603',
    orderTotalAmount: 12.14,
    costTotalAmount: 9.14,
    marginTotalAmount: 3.0,
    commissionRatio: '70%',
    commissionAmount: 2.85,
  },
  {
    id: 'com-2',
    settlementType: '每 1 个月/次',
    period: '202512',
    orderTotalAmount: 44.22,
    costTotalAmount: 34.17,
    marginTotalAmount: 10.05,
    commissionRatio: '30%',
    commissionAmount: 3.06,
  },
];

const CommissionManagementPage: React.FC = () => {
  const { message } = App.useApp();
  const [detailRecord, setDetailRecord] = useState<CommissionSummaryRecord>();

  const summary = useMemo(() => {
    const orderAmount = commissionRecords.reduce((sum, item) => sum + item.orderTotalAmount, 0);
    const marginAmount = commissionRecords.reduce((sum, item) => sum + item.marginTotalAmount, 0);
    const commissionAmount = commissionRecords.reduce((sum, item) => sum + item.commissionAmount, 0);
    return { orderAmount, marginAmount, commissionAmount };
  }, []);

  const columns: ProColumns<CommissionSummaryRecord>[] = [
    { title: '计算周期类型', dataIndex: 'settlementType', width: 180 },
    { title: '周期', dataIndex: 'period', width: 120 },
    {
      title: '订单总金额（￥）',
      dataIndex: 'orderTotalAmount',
      width: 140,
      render: (_, record) => record.orderTotalAmount.toFixed(2),
    },
    {
      title: '成本总金额（￥）',
      dataIndex: 'costTotalAmount',
      width: 140,
      render: (_, record) => record.costTotalAmount.toFixed(2),
    },
    {
      title: '差价总金额（￥）',
      dataIndex: 'marginTotalAmount',
      width: 140,
      render: (_, record) => record.marginTotalAmount.toFixed(2),
    },
    { title: '佣金比例', dataIndex: 'commissionRatio', width: 120 },
    {
      title: '佣金（￥）',
      dataIndex: 'commissionAmount',
      width: 120,
      render: (_, record) => record.commissionAmount.toFixed(2),
    },
    {
      title: '操作',
      dataIndex: 'action',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Button onClick={() => setDetailRecord(record)} type="default">
          查看详细
        </Button>
      ),
    },
  ];

  return (
    <PageContainer
      className={styles.commissionManagementPage}
      header={{
        title: '分佣管理',
        subTitle: '统一查看周期汇总、佣金比例和分佣金额，支持进入结算详情。',
      }}
    >
      <div className={styles.filterCard}>
        <div className={styles.searchGrid}>
          <DatePicker picker="month" placeholder="开始年月" />
          <span>~</span>
          <DatePicker picker="month" placeholder="结束年月" />
          <Button type="primary" icon={<SearchOutlined />} onClick={() => message.success('已按静态条件执行搜索')}>
            搜索
          </Button>
          <Button onClick={() => message.info('静态演示：导出分佣汇总数据')}>导出</Button>
        </div>
      </div>

      <div className={styles.summaryCard}>
        <div className={styles.summaryRow}>
          <div className={styles.summaryItem}>
            累计订单金额:
            <strong>{summary.orderAmount.toFixed(2)}</strong>
          </div>
          <div className={styles.summaryItem}>
            累计差价金额:
            <strong>{summary.marginAmount.toFixed(2)}</strong>
          </div>
          <div className={styles.summaryItem}>
            累计佣金:
            <strong>{summary.commissionAmount.toFixed(2)}</strong>
          </div>
        </div>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableMeta}>
          <span>
            当前结果 <strong>{commissionRecords.length}</strong> 条
          </span>
          <span>列表页仅提供周期汇总和静态查看入口，不承载真实结算发放流程。</span>
        </div>
        <ProTable<CommissionSummaryRecord>
          cardBordered
          className={styles.tableWrap}
          columns={columns}
          dataSource={commissionRecords}
          options={false}
          pagination={{
            pageSize: 10,
            showQuickJumper: true,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          rowKey="id"
          scroll={{ x: 1200 }}
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
        title={detailRecord ? `${detailRecord.period} 分佣详情` : '分佣详情'}
        width={720}
      >
        {detailRecord ? (
          <Space direction="vertical" size={16} style={{ display: 'flex' }}>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="结算周期类型">{detailRecord.settlementType}</Descriptions.Item>
              <Descriptions.Item label="周期">{detailRecord.period}</Descriptions.Item>
              <Descriptions.Item label="订单总金额">￥{detailRecord.orderTotalAmount.toFixed(2)}</Descriptions.Item>
              <Descriptions.Item label="成本总金额">￥{detailRecord.costTotalAmount.toFixed(2)}</Descriptions.Item>
              <Descriptions.Item label="差价总金额">￥{detailRecord.marginTotalAmount.toFixed(2)}</Descriptions.Item>
              <Descriptions.Item label="佣金比例">{detailRecord.commissionRatio}</Descriptions.Item>
              <Descriptions.Item label="佣金金额">￥{detailRecord.commissionAmount.toFixed(2)}</Descriptions.Item>
              <Descriptions.Item label="状态">静态汇总数据</Descriptions.Item>
            </Descriptions>

            <div>
              <div className={styles.sectionTitle}>结算摘要</div>
              <div className={styles.metricGrid}>
                {[
                  ['订单总金额', `￥${detailRecord.orderTotalAmount.toFixed(2)}`],
                  ['成本总金额', `￥${detailRecord.costTotalAmount.toFixed(2)}`],
                  ['差价总金额', `￥${detailRecord.marginTotalAmount.toFixed(2)}`],
                  ['佣金金额', `￥${detailRecord.commissionAmount.toFixed(2)}`],
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

export default CommissionManagementPage;
