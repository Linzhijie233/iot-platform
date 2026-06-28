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
  type VoicePoolItem,
  createVoicePool,
  listVoicePools,
  removeVoicePool,
  updateVoicePool,
} from '@/services/platform/pools';
import AutoRenewPoolModal from './components/AutoRenewPoolModal';
import DailyVoiceModal from './components/DailyVoiceModal';
import OrderVoicePackageModal from './components/OrderVoicePackageModal';
import styles from './index.less';

type VoicePoolRecord = VoicePoolItem;

const VoicePoolPage: React.FC = () => {
  const { message, modal } = App.useApp();
  const actionRef = useRef<ActionType | undefined>(undefined);
  const [category, setCategory] = useState<string>('all');
  const [activeRecord, setActiveRecord] = useState<VoicePoolRecord>();
  const [orderOpen, setOrderOpen] = useState(false);
  const [autoRenewOpen, setAutoRenewOpen] = useState(false);
  const [dailyOpen, setDailyOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<VoicePoolRecord>();

  const reload = () => actionRef.current?.reload();

  const requestPools = async (params: { current?: number; pageSize?: number }) => {
    const res = await listVoicePools({
      current: params.current,
      pageSize: params.pageSize,
      category: category !== 'all' ? category : undefined,
    });
    return { data: res.data ?? [], total: res.total, success: res.success };
  };

  const openModal = (type: 'order' | 'autoRenew' | 'daily', record: VoicePoolRecord) => {
    setActiveRecord(record);
    if (type === 'order') setOrderOpen(true);
    if (type === 'autoRenew') setAutoRenewOpen(true);
    if (type === 'daily') setDailyOpen(true);
  };

  const handleDelete = (record: VoicePoolRecord) => {
    modal.confirm({
      title: '确认删除该语音池？',
      content: `编号：${record.poolNo}`,
      okType: 'danger',
      onOk: async () => {
        await removeVoicePool(record.id);
        message.success('已删除');
        reload();
      },
    });
  };

  const columns: ProColumns<VoicePoolRecord>[] = [
    {
      title: '语音池编号',
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
      width: 280,
      fixed: 'right',
      render: (_, record) => (
        <span className={styles.actionLinks}>
          <a onClick={() => openModal('order', record)}>续池</a>
          <a onClick={() => openModal('autoRenew', record)}>自动续池</a>
          <a onClick={() => openModal('daily', record)}>日通话</a>
          <a onClick={() => { setEditing(record); setFormOpen(true); }}>编辑</a>
          <a onClick={() => handleDelete(record)}>删除</a>
        </span>
      ),
    },
  ];

  return (
    <PageContainer
      className={styles.voicePoolPage}
      header={{
        title: '语音池',
        subTitle: '语音池数据来自后端 /api/voice-pools，支持新增 / 编辑 / 删除及续池等操作。',
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
            新增语音池
          </Button>
        </div>
      </div>

      <div className={styles.panelCard}>
        <ProTable<VoicePoolRecord>
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

      <ModalForm<VoicePoolRecord>
        key={editing?.id ?? 'create'}
        title={editing ? `编辑语音池 · ${editing.poolNo}` : '新增语音池'}
        open={formOpen}
        onOpenChange={setFormOpen}
        grid
        rowProps={{ gutter: 16 }}
        modalProps={{ destroyOnClose: true }}
        initialValues={
          editing ?? {
            category: '共享池',
            operator: '中国移动',
            giftedMinutes: '0分钟',
            addOnPackage: '0分钟',
            usedMinutes: '0分钟',
            remainingRatio: '100%',
            simCount: 0,
          }
        }
        onFinish={async (values) => {
          try {
            if (editing) {
              await updateVoicePool(editing.id, values);
              message.success('已保存修改');
            } else {
              await createVoicePool(values);
              message.success('已新增语音池');
            }
            reload();
            return true;
          } catch {
            message.error('提交失败');
            return false;
          }
        }}
      >
        <ProFormText name="poolNo" label="语音池编号" colProps={{ span: 12 }} rules={[{ required: true }]} />
        <ProFormSelect name="category" label="类别" colProps={{ span: 12 }} options={[{ label: '共享池', value: '共享池' }]} />
        <ProFormSelect name="operator" label="运营商" colProps={{ span: 12 }} options={['中国移动', '中国联通', '中国电信'].map((o) => ({ label: o, value: o }))} />
        <ProFormText name="basePackage" label="基础套餐" colProps={{ span: 12 }} />
        <ProFormText name="totalMinutes" label="总通话时长" placeholder="如 1000分钟" colProps={{ span: 12 }} />
        <ProFormText name="remainingMinutes" label="剩余时长" placeholder="如 680分钟" colProps={{ span: 12 }} />
        <ProFormText name="usedMinutes" label="已使用时长" colProps={{ span: 12 }} />
        <ProFormText name="remainingRatio" label="剩余比例" placeholder="如 68%" colProps={{ span: 12 }} />
        <ProFormDigit name="simCount" label="SIM卡数量" colProps={{ span: 12 }} min={0} />
      </ModalForm>

      <OrderVoicePackageModal open={orderOpen} poolName={activeRecord?.poolNo} onClose={() => setOrderOpen(false)} />
      <AutoRenewPoolModal open={autoRenewOpen} poolName={activeRecord?.poolNo} onClose={() => setAutoRenewOpen(false)} />
      <DailyVoiceModal open={dailyOpen} poolName={activeRecord?.poolNo} onClose={() => setDailyOpen(false)} />
    </PageContainer>
  );
};

export default VoicePoolPage;
