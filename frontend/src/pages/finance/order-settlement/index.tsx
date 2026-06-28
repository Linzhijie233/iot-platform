import type { ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormDigit,
  ProFormText,
  ProTable,
} from '@ant-design/pro-components';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { App, Button, DatePicker, Descriptions, Drawer, Input, Space, Tag } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import {
  type OrderItem,
  createOrder,
  listOrders,
  removeOrder,
  updateOrder,
} from '@/services/platform/finance';
import styles from './index.less';

type OrderSettlementRecord = OrderItem;

const OrderSettlementPage: React.FC = () => {
  const { message, modal } = App.useApp();
  const [records, setRecords] = useState<OrderSettlementRecord[]>([]);
  const [keywordCustomer, setKeywordCustomer] = useState('');
  const [keywordIccid, setKeywordIccid] = useState('');
  const [detailRecord, setDetailRecord] = useState<OrderSettlementRecord>();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<OrderSettlementRecord>();

  const refresh = async () => {
    try {
      const res = await listOrders();
      setRecords((res.data as OrderSettlementRecord[]) ?? []);
    } catch {
      /* ignore */
    }
  };
  useEffect(() => {
    refresh();
  }, []);

  const filteredRecords = useMemo(() => {
    const c = keywordCustomer.trim().toLowerCase();
    const i = keywordIccid.trim().toLowerCase();
    return records.filter((item) => (!c || item.customerName.toLowerCase().includes(c)) && (!i || item.iccid.toLowerCase().includes(i)));
  }, [keywordCustomer, keywordIccid, records]);

  const summary = useMemo(
    () => ({
      orderAmount: filteredRecords.reduce((s, i) => s + (i.orderAmount || 0), 0),
      marginAmount: filteredRecords.reduce((s, i) => s + (i.marginAmount || 0), 0),
      commissionAmount: filteredRecords.reduce((s, i) => s + (i.commissionAmount || 0), 0),
    }),
    [filteredRecords],
  );

  const handleDelete = (record: OrderSettlementRecord) => {
    modal.confirm({
      title: '确认删除该订单？',
      content: `订单编号：${record.orderNo}`,
      okType: 'danger',
      onOk: async () => {
        await removeOrder(record.id);
        message.success('已删除');
        refresh();
      },
    });
  };

  const columns: ProColumns<OrderSettlementRecord>[] = [
    { title: '订单编号', dataIndex: 'orderNo', width: 190, fixed: 'left', render: (_, record) => <a className={styles.orderLink} onClick={() => setDetailRecord(record)}>{record.orderNo}</a> },
    { title: '客户名称', dataIndex: 'customerName', width: 120 },
    { title: 'ICCID', dataIndex: 'iccid', width: 180 },
    { title: 'MSISDN', dataIndex: 'msisdn', width: 150 },
    { title: '套餐名称', dataIndex: 'packageName', width: 190 },
    { title: '套餐类型', dataIndex: 'packageType', width: 110 },
    { title: '订单金额（￥）', dataIndex: 'orderAmount', width: 120, render: (_, r) => (r.orderAmount ?? 0).toFixed(2) },
    { title: '成本金额（￥）', dataIndex: 'costAmount', width: 120, render: (_, r) => (r.costAmount ?? 0).toFixed(2) },
    { title: '差价金额（￥）', dataIndex: 'marginAmount', width: 120, render: (_, r) => <span style={{ color: (r.marginAmount ?? 0) < 0 ? '#dc2626' : '#16a34a' }}>{(r.marginAmount ?? 0).toFixed(2)}</span> },
    { title: '可获得佣金（￥）', dataIndex: 'commissionAmount', width: 140, render: (_, r) => (r.commissionAmount ?? 0).toFixed(2) },
    { title: '消费时间', dataIndex: 'consumeTime', width: 160 },
    { title: '账单年月', dataIndex: 'statementMonth', width: 100 },
    {
      title: '操作',
      dataIndex: 'action',
      width: 160,
      fixed: 'right',
      render: (_, record) => (
        <Space size="middle">
          <a onClick={() => setDetailRecord(record)}>详情</a>
          <a onClick={() => { setEditing(record); setFormOpen(true); }}>编辑</a>
          <a onClick={() => handleDelete(record)}>删除</a>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer className={styles.orderSettlementPage} header={{ title: '订单结算', subTitle: '订单流水来自后端 /api/orders，支持新增 / 编辑 / 删除及金额汇总。' }}>
      <div className={styles.filterCard}>
        <div className={styles.searchGrid}>
          <DatePicker picker="month" placeholder="年月" />
          <Input allowClear placeholder="客户名称" value={keywordCustomer} onChange={(e) => setKeywordCustomer(e.target.value)} />
          <Input allowClear placeholder="ICCID" value={keywordIccid} onChange={(e) => setKeywordIccid(e.target.value)} />
          <DatePicker showTime placeholder="订单开始时间" />
          <DatePicker showTime placeholder="订单结束时间" />
          <Button type="primary" icon={<SearchOutlined />} onClick={() => message.success('已按条件筛选')}>搜索</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(undefined); setFormOpen(true); }}>新增订单</Button>
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
          <span>当前结果 <strong>{filteredRecords.length}</strong> 条</span>
          <span>订单流水数据来自后端，支持新增、编辑与删除。</span>
        </div>
        <ProTable<OrderSettlementRecord>
          cardBordered
          className={styles.tableWrap}
          columns={columns}
          dataSource={filteredRecords}
          options={false}
          pagination={{ pageSize: 10, showQuickJumper: true, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
          rowKey="id"
          scroll={{ x: 2050 }}
          search={false}
          tableAlertRender={false}
        />
      </div>

      <ModalForm<OrderSettlementRecord>
        key={editing?.id ?? 'create'}
        title={editing ? `编辑订单 · ${editing.orderNo}` : '新增订单'}
        open={formOpen}
        onOpenChange={setFormOpen}
        grid
        rowProps={{ gutter: 16 }}
        modalProps={{ destroyOnClose: true }}
        initialValues={editing ?? { packageType: '基础套餐', orderAmount: 0, costAmount: 0, marginAmount: 0, commissionAmount: 0, statementMonth: '202606', remark: '续期' }}
        onFinish={async (values) => {
          try {
            if (editing) await updateOrder(editing.id, values);
            else await createOrder(values);
            message.success(editing ? '已保存' : '已新增订单');
            setFormOpen(false);
            refresh();
            return true;
          } catch {
            message.error('提交失败');
            return false;
          }
        }}
      >
        <ProFormText name="orderNo" label="订单编号" colProps={{ span: 12 }} rules={[{ required: true }]} />
        <ProFormText name="customerName" label="客户名称" colProps={{ span: 12 }} rules={[{ required: true }]} />
        <ProFormText name="iccid" label="ICCID" colProps={{ span: 12 }} />
        <ProFormText name="msisdn" label="MSISDN" colProps={{ span: 12 }} />
        <ProFormText name="packageName" label="套餐名称" colProps={{ span: 12 }} />
        <ProFormText name="packageType" label="套餐类型" colProps={{ span: 12 }} />
        <ProFormDigit name="orderAmount" label="订单金额(￥)" colProps={{ span: 12 }} fieldProps={{ precision: 2 }} />
        <ProFormDigit name="costAmount" label="成本金额(￥)" colProps={{ span: 12 }} fieldProps={{ precision: 2 }} />
        <ProFormDigit name="marginAmount" label="差价金额(￥)" colProps={{ span: 12 }} fieldProps={{ precision: 2 }} />
        <ProFormDigit name="commissionAmount" label="可获得佣金(￥)" colProps={{ span: 12 }} fieldProps={{ precision: 2 }} />
        <ProFormText name="consumeTime" label="消费时间" placeholder="YYYY-MM-DD HH:mm:ss" colProps={{ span: 12 }} />
        <ProFormText name="statementMonth" label="账单年月" placeholder="YYYYMM" colProps={{ span: 12 }} />
        <ProFormText name="remark" label="备注" colProps={{ span: 24 }} />
      </ModalForm>

      <Drawer destroyOnHidden onClose={() => setDetailRecord(undefined)} open={Boolean(detailRecord)} title={detailRecord ? `${detailRecord.orderNo} 订单详情` : '订单详情'} width={720}>
        {detailRecord ? (
          <Space direction="vertical" size={16} style={{ display: 'flex' }}>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="订单编号">{detailRecord.orderNo}</Descriptions.Item>
              <Descriptions.Item label="客户名称">{detailRecord.customerName}</Descriptions.Item>
              <Descriptions.Item label="ICCID">{detailRecord.iccid}</Descriptions.Item>
              <Descriptions.Item label="MSISDN">{detailRecord.msisdn}</Descriptions.Item>
              <Descriptions.Item label="套餐名称">{detailRecord.packageName}</Descriptions.Item>
              <Descriptions.Item label="套餐类型">{detailRecord.packageType}</Descriptions.Item>
              <Descriptions.Item label="订单金额">￥{(detailRecord.orderAmount ?? 0).toFixed(2)}</Descriptions.Item>
              <Descriptions.Item label="成本金额">￥{(detailRecord.costAmount ?? 0).toFixed(2)}</Descriptions.Item>
              <Descriptions.Item label="差价金额"><Tag color={(detailRecord.marginAmount ?? 0) < 0 ? 'error' : 'success'}>{(detailRecord.marginAmount ?? 0).toFixed(2)}</Tag></Descriptions.Item>
              <Descriptions.Item label="可获得佣金">￥{(detailRecord.commissionAmount ?? 0).toFixed(2)}</Descriptions.Item>
              <Descriptions.Item label="消费时间">{detailRecord.consumeTime}</Descriptions.Item>
              <Descriptions.Item label="账单年月">{detailRecord.statementMonth}</Descriptions.Item>
            </Descriptions>
          </Space>
        ) : null}
      </Drawer>
    </PageContainer>
  );
};

export default OrderSettlementPage;
