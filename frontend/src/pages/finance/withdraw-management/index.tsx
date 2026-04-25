import { SearchOutlined } from '@ant-design/icons';
import type { ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { App, Button, DatePicker, Descriptions, Drawer, Modal, Space } from 'antd';
import React, { useState } from 'react';
import styles from './index.less';

type WithdrawRecord = {
  id: string;
  orderNo: string;
  withdrawAccount: string;
  amount: number;
  applyTime: string;
  processTime: string;
  status: '待审核' | '处理中' | '已到账';
};

const withdrawRecords: WithdrawRecord[] = [];

const WithdrawManagementPage: React.FC = () => {
  const { message } = App.useApp();
  const [applyOpen, setApplyOpen] = useState(false);
  const [detailRecord, setDetailRecord] = useState<WithdrawRecord>();

  const columns: ProColumns<WithdrawRecord>[] = [
    { title: '订单编号', dataIndex: 'orderNo', width: 160 },
    { title: '提现账号', dataIndex: 'withdrawAccount', width: 180 },
    {
      title: '提现金额',
      dataIndex: 'amount',
      width: 120,
      render: (_, record) => `￥${record.amount.toFixed(2)}`,
    },
    { title: '申请时间', dataIndex: 'applyTime', width: 160 },
    { title: '处理时间', dataIndex: 'processTime', width: 160 },
    { title: '审核状态', dataIndex: 'status', width: 120 },
    {
      title: '操作',
      dataIndex: 'action',
      width: 120,
      render: (_, record) => (
        <Button onClick={() => setDetailRecord(record)} type="default">
          查看
        </Button>
      ),
    },
  ];

  return (
    <PageContainer
      className={styles.withdrawManagementPage}
      header={{
        title: '提现管理',
        subTitle: '统一管理提现账户、余额概览、提现申请和提现记录。',
      }}
    >
      <div className={styles.accountCard}>
        <table className={styles.accountTable}>
          <thead>
            <tr>
              <th>客户</th>
              <th>开户银行</th>
              <th>开户人姓名</th>
              <th>提现账号</th>
              <th>更新时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>体验账号</td>
              <td>招商银行科技园支行</td>
              <td>宁建辉</td>
              <td>6224515245158888</td>
              <td>2026-03-19 10:09:00</td>
              <td>
                <Space>
                  <Button size="small">查看</Button>
                  <Button size="small">修改</Button>
                </Space>
              </td>
            </tr>
          </tbody>
        </table>

        <div className={styles.amountRow}>
          <div className={styles.amountItem}>
            余额:
            <strong>￥-12</strong>
          </div>
          <div className={styles.amountItem}>
            已提现金额:
            <strong>￥0</strong>
          </div>
          <div className={styles.amountItem}>
            申请中提现金额:
            <strong>￥0</strong>
          </div>
          <Button type="primary" onClick={() => setApplyOpen(true)}>
            申请提现
          </Button>
        </div>
        <div className={styles.warningText}>
          不同银行到账可能存在时间差，<strong>请以实际凭证及到账时间为准。</strong>
        </div>
      </div>

      <div className={styles.filterCard}>
        <div className={styles.searchGrid}>
          <DatePicker placeholder="申请开始日期" />
          <DatePicker placeholder="申请结束日期" />
          <Button type="primary" icon={<SearchOutlined />} onClick={() => message.success('已按静态条件执行搜索')}>
            搜索
          </Button>
        </div>
      </div>

      <div className={styles.tableCard}>
        <ProTable<WithdrawRecord>
          cardBordered
          className={styles.tableWrap}
          columns={columns}
          dataSource={withdrawRecords}
          locale={{ emptyText: '暂无数据' }}
          options={false}
          pagination={{
            pageSize: 10,
            showQuickJumper: true,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          rowKey="id"
          search={false}
          tableAlertRender={false}
          tableAlertOptionRender={false}
          toolbar={undefined}
        />
      </div>

      <Modal
        destroyOnHidden
        okText="提交申请"
        onCancel={() => setApplyOpen(false)}
        onOk={() => {
          message.success('已触发静态提现申请');
          setApplyOpen(false);
        }}
        open={applyOpen}
        title="申请提现"
        width={720}
      >
        <div className={styles.metricGrid}>
          {[
            ['账户信息', '默认使用当前客户已绑定的提现账号。'],
            ['申请金额', '提现金额需小于等于可提现余额。'],
            ['审核流程', '提交后进入财务审核与到账处理流程。'],
            ['到账说明', '实际到账时间以银行处理结果为准。'],
          ].map(([label, value]) => (
            <div className={styles.metricCard} key={label}>
              <div className={styles.metricLabel}>{label}</div>
              <div className={styles.metricValue}>{value}</div>
            </div>
          ))}
        </div>
      </Modal>

      <Drawer
        destroyOnHidden
        onClose={() => setDetailRecord(undefined)}
        open={Boolean(detailRecord)}
        title={detailRecord ? `${detailRecord.orderNo} 提现详情` : '提现详情'}
        width={720}
      >
        {detailRecord ? (
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="订单编号">{detailRecord.orderNo}</Descriptions.Item>
            <Descriptions.Item label="提现账号">{detailRecord.withdrawAccount}</Descriptions.Item>
            <Descriptions.Item label="提现金额">￥{detailRecord.amount.toFixed(2)}</Descriptions.Item>
            <Descriptions.Item label="审核状态">{detailRecord.status}</Descriptions.Item>
            <Descriptions.Item label="申请时间">{detailRecord.applyTime}</Descriptions.Item>
            <Descriptions.Item label="处理时间">{detailRecord.processTime}</Descriptions.Item>
          </Descriptions>
        ) : null}
      </Drawer>
    </PageContainer>
  );
};

export default WithdrawManagementPage;
