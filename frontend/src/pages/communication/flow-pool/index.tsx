import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
  ProTable,
} from '@ant-design/pro-components';
import { PlusOutlined } from '@ant-design/icons';
import { App, Button, Select } from 'antd';
import React, { useRef, useState } from 'react';
import {
  type FlowPoolItem,
  createFlowPool,
  listFlowPools,
  removeFlowPool,
  updateFlowPool,
} from '@/services/platform/pools';
import AutoRenewPoolModal from './components/AutoRenewPoolModal';
import DailyTrafficModal from './components/DailyTrafficModal';
import OrderTrafficPackageModal from './components/OrderTrafficPackageModal';
import styles from './index.less';

type FlowPoolRecord = FlowPoolItem;

const FlowPoolPage: React.FC = () => {
  const { message, modal } = App.useApp();
  const actionRef = useRef<ActionType | undefined>(undefined);
  const [category, setCategory] = useState<string>('all');
  const [activeRecord, setActiveRecord] = useState<FlowPoolRecord>();
  const [orderOpen, setOrderOpen] = useState(false);
  const [autoRenewOpen, setAutoRenewOpen] = useState(false);
  const [dailyOpen, setDailyOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<FlowPoolRecord>();

  const reload = () => actionRef.current?.reload();

  const requestPools = async (params: { current?: number; pageSize?: number }) => {
    const res = await listFlowPools({
      current: params.current,
      pageSize: params.pageSize,
      category: category !== 'all' ? category : undefined,
    });
    return { data: res.data ?? [], total: res.total, success: res.success };
  };

  const openModal = (type: 'order' | 'autoRenew' | 'daily', record: FlowPoolRecord) => {
    setActiveRecord(record);
    if (type === 'order') setOrderOpen(true);
    if (type === 'autoRenew') setAutoRenewOpen(true);
    if (type === 'daily') setDailyOpen(true);
  };

  const handleDelete = (record: FlowPoolRecord) => {
    modal.confirm({
      title: '确认删除该流量池？',
      content: `编号：${record.poolNo}`,
      okType: 'danger',
      onOk: async () => {
        await removeFlowPool(record.id);
        message.success('已删除');
        reload();
      },
    });
  };

  const columns: ProColumns<FlowPoolRecord>[] = [
    {
      title: '流量池编号',
      dataIndex: 'poolNo',
      width: 180,
      render: (_, record) => (
        <a className={styles.poolIdLink} onClick={() => message.info(`${record.poolNo} 详情`)}>
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
      width: 280,
      fixed: 'right',
      render: (_, record) => (
        <span className={styles.actionLinks}>
          <a onClick={() => openModal('order', record)}>续池</a>
          <a onClick={() => openModal('autoRenew', record)}>自动续池</a>
          <a onClick={() => openModal('daily', record)}>日流量</a>
          <a onClick={() => { setEditing(record); setFormOpen(true); }}>编辑</a>
          <a onClick={() => handleDelete(record)}>删除</a>
        </span>
      ),
    },
  ];

  return (
    <PageContainer
      className={styles.flowPoolPage}
      header={{
        title: '流量池',
        subTitle: '流量池数据来自后端 /api/flow-pools，支持新增 / 编辑 / 删除及续池等操作。',
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
            onChange={(v) => {
              setCategory(v);
              setTimeout(reload, 0);
            }}
          />
          <Button type="primary" onClick={reload}>
            搜索
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditing(undefined);
              setFormOpen(true);
            }}
          >
            新增流量池
          </Button>
        </div>
      </div>

      <div className={styles.panelCard}>
        <ProTable<FlowPoolRecord>
          className={styles.tableWrap}
          actionRef={actionRef}
          cardBordered
          columns={columns}
          request={requestPools}
          options={false}
          pagination={{ pageSize: 20, showQuickJumper: true, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
          rowKey="id"
          scroll={{ x: 1700 }}
          search={false}
          tableAlertRender={false}
          tableAlertOptionRender={false}
        />
      </div>

      <ModalForm<FlowPoolRecord>
        key={editing?.id ?? 'create'}
        title={editing ? `编辑流量池 · ${editing.poolNo}` : '新增流量池'}
        open={formOpen}
        onOpenChange={setFormOpen}
        grid
        rowProps={{ gutter: 16 }}
        modalProps={{ destroyOnClose: true }}
        initialValues={
          editing ?? {
            category: '共享池',
            operator: '中国移动',
            giftedTraffic: '0GB',
            fuelPackage: '0GB',
            usedTraffic: '0GB',
            remainingRatio: '100%',
            simCount: 0,
          }
        }
        onFinish={async (values) => {
          try {
            if (editing) {
              await updateFlowPool(editing.id, values);
              message.success('已保存修改');
            } else {
              await createFlowPool(values);
              message.success('已新增流量池');
            }
            reload();
            return true;
          } catch {
            message.error('提交失败');
            return false;
          }
        }}
      >
        <ProFormText name="poolNo" label="流量池编号" colProps={{ span: 12 }} rules={[{ required: true }]} />
        <ProFormSelect name="category" label="类别" colProps={{ span: 12 }} options={[{ label: '共享池', value: '共享池' }]} />
        <ProFormSelect name="operator" label="运营商" colProps={{ span: 12 }} options={['中国移动', '中国联通', '中国电信'].map((o) => ({ label: o, value: o }))} />
        <ProFormText name="basePackage" label="基础套餐" colProps={{ span: 12 }} />
        <ProFormText name="totalTraffic" label="总流量" placeholder="如 100GB" colProps={{ span: 12 }} />
        <ProFormText name="remainingTraffic" label="剩余流量" placeholder="如 96.5GB" colProps={{ span: 12 }} />
        <ProFormText name="usedTraffic" label="已使用流量" colProps={{ span: 12 }} />
        <ProFormText name="remainingRatio" label="剩余比例" placeholder="如 96%" colProps={{ span: 12 }} />
        <ProFormDigit name="simCount" label="SIM卡数量" colProps={{ span: 12 }} min={0} />
      </ModalForm>

      <OrderTrafficPackageModal open={orderOpen} poolName={activeRecord?.poolNo} onClose={() => setOrderOpen(false)} />
      <AutoRenewPoolModal open={autoRenewOpen} poolName={activeRecord?.poolNo} onClose={() => setAutoRenewOpen(false)} />
      <DailyTrafficModal open={dailyOpen} poolName={activeRecord?.poolNo} onClose={() => setDailyOpen(false)} />
    </PageContainer>
  );
};

export default FlowPoolPage;
