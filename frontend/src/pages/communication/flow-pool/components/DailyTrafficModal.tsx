import { App, Button, DatePicker, Modal, Table } from 'antd';
import React from 'react';
import styles from '../index.less';

type Props = {
  open: boolean;
  poolName?: string;
  onClose: () => void;
};

const dailyData = Array.from({ length: 10 }).map((_, index) => ({
  key: `${index + 1}`,
  date: `2026-04-${String(index + 1).padStart(2, '0')}`,
  poolName: 'C000003-CMPS100G-01',
  usage: 0,
  fee: '--',
}));

const DailyTrafficModal: React.FC<Props> = ({ open, poolName, onClose }) => {
  const { message } = App.useApp();

  return (
    <Modal
      destroyOnHidden
      footer={null}
      open={open}
      title="日流量"
      width={1100}
      onCancel={onClose}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <DatePicker picker="month" placeholder="选择月" />
          <a>切换</a>
          {poolName ? <span style={{ color: '#64748b' }}>当前池：{poolName}</span> : null}
        </div>
        <Button type="primary" onClick={() => message.info('导出为静态演示，未生成真实文件')}>
          导出
        </Button>
      </div>

      <div className={styles.chartPlaceholder}>
        <div className={styles.chartAxisY}>
          <span>1 GB</span>
          <span>0.8 GB</span>
          <span>0.6 GB</span>
          <span>0.4 GB</span>
          <span>0.2 GB</span>
          <span>0 GB</span>
        </div>
        <div className={styles.chartLine}>
          {[8, 56, 108, 160, 212, 264, 316, 368, 420, 472, 524, 576].map((left) => (
            <span
              key={left}
              className={styles.chartDot}
              style={{ left, top: Math.max(8, (left % 5) * 10) }}
            />
          ))}
        </div>
        <div className={styles.chartAxisX}>
          {Array.from({ length: 30 }).map((_, index) => (
            <span key={index}>{String(index + 1).padStart(2, '0')}</span>
          ))}
          <span>日</span>
        </div>
      </div>

      <Table
        columns={[
          { title: '日期', dataIndex: 'date' },
          { title: '流量池', dataIndex: 'poolName' },
          { title: '数据用量(G)', dataIndex: 'usage' },
          { title: '费用预估(累计，仅参考)', dataIndex: 'fee' },
        ]}
        dataSource={dailyData}
        pagination={false}
        rowKey="key"
        scroll={{ y: 260 }}
      />
    </Modal>
  );
};

export default DailyTrafficModal;
