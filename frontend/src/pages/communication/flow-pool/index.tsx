import type { ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { App, Button, Select } from 'antd';
import React, { useMemo, useState } from 'react';
import AutoRenewPoolModal from './components/AutoRenewPoolModal';
import DailyTrafficModal from './components/DailyTrafficModal';
import OrderTrafficPackageModal from './components/OrderTrafficPackageModal';
import styles from './index.less';

type FlowPoolRecord = {
  id: string;
  poolNo: string;
  category: string;
  operator: string;
  basePackage: string;
  totalTraffic: string;
  giftedTraffic: string;
  fuelPackage: string;
  usedTraffic: string;
  remainingTraffic: string;
  remainingRatio: string;
  simCount: number;
};

const flowPoolRecords: FlowPoolRecord[] = [
  {
    id: 'pool-1',
    poolNo: 'C000003-CMPS100G-01',
    category: '共享池',
    operator: '中国移动',
    basePackage: '移动专业100GB',
    totalTraffic: '0GB',
    giftedTraffic: '0.0292GB',
    fuelPackage: '-0.0292GB',
    usedTraffic: '0GB',
    remainingTraffic: '0GB',
    remainingRatio: '--',
    simCount: 0,
  },
  {
    id: 'pool-2',
    poolNo: 'C000003-CMPS1G-01',
    category: '共享池',
    operator: '中国移动',
    basePackage: '移动专业1GB',
    totalTraffic: '0.5175GB',
    giftedTraffic: '1.0058GB',
    fuelPackage: '2GB',
    usedTraffic: '0GB',
    remainingTraffic: '0.5175GB',
    remainingRatio: '100%',
    simCount: 0,
  },
];

const FlowPoolPage: React.FC = () => {
  const { message } = App.useApp();
  const [category, setCategory] = useState<string>('all');
  const [activeRecord, setActiveRecord] = useState<FlowPoolRecord>();
  const [orderOpen, setOrderOpen] = useState(false);
  const [autoRenewOpen, setAutoRenewOpen] = useState(false);
  const [dailyOpen, setDailyOpen] = useState(false);

  const filteredRecords = useMemo(() => {
    if (category === 'all') return flowPoolRecords;
    return flowPoolRecords.filter((item) => item.category === category);
  }, [category]);

  const openModal = (
    type: 'order' | 'autoRenew' | 'daily',
    record: FlowPoolRecord,
  ) => {
    setActiveRecord(record);
    if (type === 'order') setOrderOpen(true);
    if (type === 'autoRenew') setAutoRenewOpen(true);
    if (type === 'daily') setDailyOpen(true);
  };

  const columns: ProColumns<FlowPoolRecord>[] = [
    {
      title: '流量池编号',
      dataIndex: 'poolNo',
      width: 180,
      render: (_, record) => (
        <a
          className={styles.poolIdLink}
          onClick={() => message.info(`${record.poolNo} 为静态详情入口`)}
        >
          {record.poolNo}
        </a>
      ),
    },
    { title: '类别', dataIndex: 'category', width: 120 },
    { title: '运营商', dataIndex: 'operator', width: 120 },
    { title: '基础套餐', dataIndex: 'basePackage', width: 180 },
    { title: '总流量', dataIndex: 'totalTraffic', width: 110 },
    { title: '赠送流量', dataIndex: 'giftedTraffic', width: 130 },
    { title: '加油包', dataIndex: 'fuelPackage', width: 120 },
    { title: '已使用流量', dataIndex: 'usedTraffic', width: 120 },
    { title: '剩余流量', dataIndex: 'remainingTraffic', width: 120 },
    { title: '剩余比例', dataIndex: 'remainingRatio', width: 110 },
    { title: 'SIM卡数量', dataIndex: 'simCount', width: 110 },
    {
      title: '操作',
      dataIndex: 'action',
      width: 190,
      fixed: 'right',
      render: (_, record) => (
        <span className={styles.actionLinks}>
          <a onClick={() => openModal('order', record)}>续池</a>
          <a onClick={() => openModal('autoRenew', record)}>自动续池</a>
          <a onClick={() => openModal('daily', record)}>日流量</a>
        </span>
      ),
    },
  ];

  return (
    <PageContainer
      className={styles.flowPoolPage}
      header={{
        title: '流量池',
        subTitle: '通信管理下的静态流量池页面，包含列表与三个静态弹层。',
      }}
    >
      <div className={styles.headerCard}>
        <div className={styles.searchRow}>
          <Select
            options={[
              { label: '类别', value: 'all' },
              { label: '共享池', value: '共享池' },
            ]}
            style={{ width: 240 }}
            value={category}
            onChange={setCategory}
          />
          <Button type="primary" onClick={() => message.success('已按静态条件执行搜索')}>
            搜索
          </Button>
        </div>
      </div>

      <div className={styles.panelCard}>
        <ProTable<FlowPoolRecord>
          className={styles.tableWrap}
          cardBordered
          columns={columns}
          dataSource={filteredRecords}
          options={false}
          pagination={{
            pageSize: 20,
            showQuickJumper: true,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          rowKey="id"
          scroll={{ x: 1600 }}
          search={false}
          tableAlertRender={false}
          tableAlertOptionRender={false}
          toolbar={undefined}
        />
      </div>

      <OrderTrafficPackageModal
        open={orderOpen}
        poolName={activeRecord?.poolNo}
        onClose={() => setOrderOpen(false)}
      />
      <AutoRenewPoolModal
        open={autoRenewOpen}
        poolName={activeRecord?.poolNo}
        onClose={() => setAutoRenewOpen(false)}
      />
      <DailyTrafficModal
        open={dailyOpen}
        poolName={activeRecord?.poolNo}
        onClose={() => setDailyOpen(false)}
      />
    </PageContainer>
  );
};

export default FlowPoolPage;
