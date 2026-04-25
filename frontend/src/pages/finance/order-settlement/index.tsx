import { SearchOutlined } from '@ant-design/icons';
import type { ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { App, Button, DatePicker, Descriptions, Drawer, Input, Space, Tag } from 'antd';
import React, { useMemo, useState } from 'react';
import styles from './index.less';

type OrderSettlementRecord = {
  id: string;
  orderNo: string;
  customerName: string;
  iccid: string;
  msisdn: string;
  packageName: string;
  packageType: string;
  orderAmount: number;
  costAmount: number;
  marginAmount: number;
  commissionAmount: number;
  consumeTime: string;
  statementMonth: string;
  remark: string;
};

const orderRecords: OrderSettlementRecord[] = [
  {
    id: 'ord-1',
    orderNo: '20260319100849248902',
    customerName: '体验账号',
    iccid: '898604D5192290320478',
    msisdn: '1441354220478',
    packageName: '移动专业500MB续期1月',
    packageType: '基础套餐',
    orderAmount: 0.1,
    costAmount: 12.1,
    marginAmount: -12.0,
    commissionAmount: 0,
    consumeTime: '2026-03-19 10:08:50',
    statementMonth: '202603',
    remark: '续期',
  },
  {
    id: 'ord-2',
    orderNo: '20251215095915098977',
    customerName: '体验账号',
    iccid: '898604D5192290320478',
    msisdn: '1441354220478',
    packageName: '移动专业500MB续期1月',
    packageType: '基础套餐',
    orderAmount: 0.1,
    costAmount: 12.1,
    marginAmount: -12.0,
    commissionAmount: 0,
    consumeTime: '2025-12-15 09:59:15',
    statementMonth: '202512',
    remark: '续期',
  },
  {
    id: 'ord-3',
    orderNo: '20251213184833540213',
    customerName: '临时测试用户',
    iccid: '898604D5192270879709',
    msisdn: '1441352879709',
    packageName: '移动专业30MB续期12月',
    packageType: '基础套餐',
    orderAmount: 43.2,
    costAmount: 33.15,
    marginAmount: 10.05,
    commissionAmount: 3.06,
    consumeTime: '2025-12-13 18:45:27',
    statementMonth: '202512',
    remark: '续期',
  },
  {
    id: 'ord-4',
    orderNo: '20250627105234301741',
    customerName: '体验账号',
    iccid: '898604D5192290321565',
    msisdn: '1441354221565',
    packageName: '移动专业100MB续期x1月',
    packageType: '基础套餐',
    orderAmount: 0.88,
    costAmount: 106.48,
    marginAmount: -105.6,
    commissionAmount: 0,
    consumeTime: '2025-06-27 10:52:35',
    statementMonth: '202506',
    remark: '续期',
  },
];

const OrderSettlementPage: React.FC = () => {
  const { message } = App.useApp();
  const [keywordCustomer, setKeywordCustomer] = useState('');
  const [keywordIccid, setKeywordIccid] = useState('');
  const [detailRecord, setDetailRecord] = useState<OrderSettlementRecord>();

  const filteredRecords = useMemo(() => {
    const customerKeyword = keywordCustomer.trim().toLowerCase();
    const iccidKeyword = keywordIccid.trim().toLowerCase();
    return orderRecords.filter((item) => {
      const matchesCustomer =
        !customerKeyword || item.customerName.toLowerCase().includes(customerKeyword);
      const matchesIccid = !iccidKeyword || item.iccid.toLowerCase().includes(iccidKeyword);
      return matchesCustomer && matchesIccid;
    });
  }, [keywordCustomer, keywordIccid]);

  const summary = useMemo(() => {
    const orderAmount = filteredRecords.reduce((sum, item) => sum + item.orderAmount, 0);
    const marginAmount = filteredRecords.reduce((sum, item) => sum + item.marginAmount, 0);
    const commissionAmount = filteredRecords.reduce((sum, item) => sum + item.commissionAmount, 0);
    return { orderAmount, marginAmount, commissionAmount };
  }, [filteredRecords]);

  const columns: ProColumns<OrderSettlementRecord>[] = [
    {
      title: '订单编号',
      dataIndex: 'orderNo',
      width: 190,
      fixed: 'left',
      render: (_, record) => (
        <a className={styles.orderLink} onClick={() => setDetailRecord(record)}>
          {record.orderNo}
        </a>
      ),
    },
    { title: '客户名称', dataIndex: 'customerName', width: 120 },
    { title: 'ICCID', dataIndex: 'iccid', width: 180 },
    { title: 'MSISDN', dataIndex: 'msisdn', width: 150 },
    { title: '套餐名称', dataIndex: 'packageName', width: 190 },
    { title: '套餐类型', dataIndex: 'packageType', width: 110 },
    {
      title: '订单金额（￥）',
      dataIndex: 'orderAmount',
      width: 120,
      render: (_, record) => record.orderAmount.toFixed(2),
    },
    {
      title: '成本金额（￥）',
      dataIndex: 'costAmount',
      width: 120,
      render: (_, record) => record.costAmount.toFixed(2),
    },
    {
      title: '差价金额（￥）',
      dataIndex: 'marginAmount',
      width: 120,
      render: (_, record) => (
        <span style={{ color: record.marginAmount < 0 ? '#dc2626' : '#16a34a' }}>
          {record.marginAmount.toFixed(2)}
        </span>
      ),
    },
    {
      title: '可获得佣金（￥）',
      dataIndex: 'commissionAmount',
      width: 140,
      render: (_, record) => record.commissionAmount.toFixed(2),
    },
    { title: '消费时间', dataIndex: 'consumeTime', width: 160 },
    { title: '账单年月', dataIndex: 'statementMonth', width: 100 },
    { title: '备注', dataIndex: 'remark', width: 80 },
  ];

  return (
    <PageContainer
      className={styles.orderSettlementPage}
      header={{
        title: '订单结算',
        subTitle: '统一查看客户订单流水、金额统计和差价佣金情况。',
      }}
    >
      <div className={styles.filterCard}>
        <div className={styles.searchGrid}>
          <DatePicker picker="month" placeholder="年月" />
          <Input
            allowClear
            placeholder="客户名称"
            value={keywordCustomer}
            onChange={(event) => setKeywordCustomer(event.target.value)}
          />
          <Input
            allowClear
            placeholder="ICCID"
            value={keywordIccid}
            onChange={(event) => setKeywordIccid(event.target.value)}
          />
          <DatePicker showTime placeholder="订单开始时间" />
          <DatePicker showTime placeholder="订单结束时间" />
          <Button type="primary" icon={<SearchOutlined />} onClick={() => message.success('已按静态条件执行搜索')}>
            搜索
          </Button>
          <Button onClick={() => message.info('静态演示：导出订单结算数据')}>导出</Button>
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
            当前结果 <strong>{filteredRecords.length}</strong> 条
          </span>
          <span>列表页仅提供订单金额、差价与佣金的静态展示，不承载真实结算流程。</span>
        </div>
        <ProTable<OrderSettlementRecord>
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
        title={detailRecord ? `${detailRecord.orderNo} 订单详情` : '订单详情'}
        width={720}
      >
        {detailRecord ? (
          <Space direction="vertical" size={16} style={{ display: 'flex' }}>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="订单编号">{detailRecord.orderNo}</Descriptions.Item>
              <Descriptions.Item label="客户名称">{detailRecord.customerName}</Descriptions.Item>
              <Descriptions.Item label="ICCID">{detailRecord.iccid}</Descriptions.Item>
              <Descriptions.Item label="MSISDN">{detailRecord.msisdn}</Descriptions.Item>
              <Descriptions.Item label="套餐名称">{detailRecord.packageName}</Descriptions.Item>
              <Descriptions.Item label="套餐类型">{detailRecord.packageType}</Descriptions.Item>
              <Descriptions.Item label="订单金额">￥{detailRecord.orderAmount.toFixed(2)}</Descriptions.Item>
              <Descriptions.Item label="成本金额">￥{detailRecord.costAmount.toFixed(2)}</Descriptions.Item>
              <Descriptions.Item label="差价金额">
                <Tag color={detailRecord.marginAmount < 0 ? 'error' : 'success'}>
                  {detailRecord.marginAmount.toFixed(2)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="可获得佣金">￥{detailRecord.commissionAmount.toFixed(2)}</Descriptions.Item>
              <Descriptions.Item label="消费时间">{detailRecord.consumeTime}</Descriptions.Item>
              <Descriptions.Item label="账单年月">{detailRecord.statementMonth}</Descriptions.Item>
            </Descriptions>

            <div>
              <div className={styles.sectionTitle}>金额摘要</div>
              <div className={styles.metricGrid}>
                {[
                  ['订单金额', `￥${detailRecord.orderAmount.toFixed(2)}`],
                  ['成本金额', `￥${detailRecord.costAmount.toFixed(2)}`],
                  ['差价金额', `￥${detailRecord.marginAmount.toFixed(2)}`],
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

export default OrderSettlementPage;
