import type { ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { App, Button, Select } from 'antd';
import React, { useMemo, useState } from 'react';
import AutoRenewPoolModal from './components/AutoRenewPoolModal';
import DailyVoiceModal from './components/DailyVoiceModal';
import OrderVoicePackageModal from './components/OrderVoicePackageModal';
import styles from './index.less';

type VoicePoolRecord = {
  id: string;
  poolNo: string;
  category: string;
  operator: string;
  basePackage: string;
  totalMinutes: string;
  giftedMinutes: string;
  addOnPackage: string;
  usedMinutes: string;
  remainingMinutes: string;
  remainingRatio: string;
  simCount: number;
};

const voicePoolRecords: VoicePoolRecord[] = [
  {
    id: 'pool-1',
    poolNo: 'C000003-CMPS100M-01',
    category: '共享池',
    operator: '中国移动',
    basePackage: '移动专业100分钟',
    totalMinutes: '0分钟',
    giftedMinutes: '2.92分钟',
    addOnPackage: '-2.92分钟',
    usedMinutes: '0分钟',
    remainingMinutes: '0分钟',
    remainingRatio: '--',
    simCount: 0,
  },
  {
    id: 'pool-2',
    poolNo: 'C000003-CMPS1M-01',
    category: '共享池',
    operator: '中国移动',
    basePackage: '移动专业1分钟',
    totalMinutes: '51.75分钟',
    giftedMinutes: '100.58分钟',
    addOnPackage: '200分钟',
    usedMinutes: '0分钟',
    remainingMinutes: '51.75分钟',
    remainingRatio: '100%',
    simCount: 0,
  },
];

const VoicePoolPage: React.FC = () => {
  const { message } = App.useApp();
  const [category, setCategory] = useState<string>('all');
  const [activeRecord, setActiveRecord] = useState<VoicePoolRecord>();
  const [orderOpen, setOrderOpen] = useState(false);
  const [autoRenewOpen, setAutoRenewOpen] = useState(false);
  const [dailyOpen, setDailyOpen] = useState(false);

  const filteredRecords = useMemo(() => {
    if (category === 'all') return voicePoolRecords;
    return voicePoolRecords.filter((item) => item.category === category);
  }, [category]);

  const openModal = (
    type: 'order' | 'autoRenew' | 'daily',
    record: VoicePoolRecord,
  ) => {
    setActiveRecord(record);
    if (type === 'order') setOrderOpen(true);
    if (type === 'autoRenew') setAutoRenewOpen(true);
    if (type === 'daily') setDailyOpen(true);
  };

  const columns: ProColumns<VoicePoolRecord>[] = [
    {
      title: '语音池编号',
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
    { title: '总通话时长', dataIndex: 'totalMinutes', width: 110 },
    { title: '赠送时长', dataIndex: 'giftedMinutes', width: 130 },
    { title: '加油包', dataIndex: 'addOnPackage', width: 120 },
    { title: '已使用时长', dataIndex: 'usedMinutes', width: 120 },
    { title: '剩余时长', dataIndex: 'remainingMinutes', width: 120 },
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
          <a onClick={() => openModal('daily', record)}>日通话</a>
        </span>
      ),
    },
  ];

  return (
    <PageContainer
      className={styles.voicePoolPage}
      header={{
        title: '语音池',
        subTitle: '通信管理下的静态语音池页面，包含列表与三个静态弹层。',
      }}
    >
      <div className={styles.headerCard}>
        <div className={styles.searchRow}>
          <Select
            options={[
              { label: '全部', value: 'all' },
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
        <ProTable<VoicePoolRecord>
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

      <OrderVoicePackageModal
        open={orderOpen}
        poolName={activeRecord?.poolNo}
        onClose={() => setOrderOpen(false)}
      />
      <AutoRenewPoolModal
        open={autoRenewOpen}
        poolName={activeRecord?.poolNo}
        onClose={() => setAutoRenewOpen(false)}
      />
      <DailyVoiceModal
        open={dailyOpen}
        poolName={activeRecord?.poolNo}
        onClose={() => setDailyOpen(false)}
      />
    </PageContainer>
  );
};

export default VoicePoolPage;
