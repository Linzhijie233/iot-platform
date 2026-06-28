import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import type { ProColumns } from '@ant-design/pro-components';
import { ModalForm, PageContainer, ProFormDigit, ProFormText, ProTable } from '@ant-design/pro-components';
import { App, Button, DatePicker, Descriptions, Drawer, Space, Tag } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import {
  type WithdrawItem,
  createWithdrawal,
  listWithdrawals,
  removeWithdrawal,
  updateWithdrawal,
} from '@/services/platform/finance';
import styles from './index.less';

type WithdrawRecord = WithdrawItem;

const STATUS_COLOR: Record<string, string> = { 待审核: 'warning', 处理中: 'processing', 已到账: 'success' };

const WithdrawManagementPage: React.FC = () => {
  const { message, modal } = App.useApp();
  const [records, setRecords] = useState<WithdrawRecord[]>([]);
  const [applyOpen, setApplyOpen] = useState(false);
  const [editing, setEditing] = useState<WithdrawRecord>();
  const [detailRecord, setDetailRecord] = useState<WithdrawRecord>();

  const refresh = async () => {
    try {
      const res = await listWithdrawals();
      setRecords((res.data as WithdrawRecord[]) ?? []);
    } catch {
      /* ignore */
    }
  };
  useEffect(() => {
    refresh();
  }, []);

  const amounts = useMemo(() => {
    const withdrawn = records.filter((r) => r.status === '已到账').reduce((s, r) => s + (r.amount || 0), 0);
    const applying = records.filter((r) => r.status !== '已到账').reduce((s, r) => s + (r.amount || 0), 0);
    return { withdrawn, applying };
  }, [records]);

  const advance = async (record: WithdrawRecord) => {
    const next = record.status === '待审核' ? '处理中' : '已到账';
    await updateWithdrawal(record.id, {
      status: next,
      ...(next === '已到账' ? { processTime: '2026-06-24 21:00' } : {}),
    });
    message.success(next === '处理中' ? '已通过审核' : '已标记到账');
    refresh();
  };
  const handleDelete = (record: WithdrawRecord) => {
    modal.confirm({
      title: '确认删除该提现记录？',
      content: `订单编号：${record.orderNo}`,
      okType: 'danger',
      onOk: async () => {
        await removeWithdrawal(record.id);
        message.success('已删除');
        refresh();
      },
    });
  };

  const columns: ProColumns<WithdrawRecord>[] = [
    { title: '订单编号', dataIndex: 'orderNo', width: 160 },
    { title: '提现账号', dataIndex: 'withdrawAccount', width: 180 },
    { title: '提现金额', dataIndex: 'amount', width: 120, render: (_, r) => `￥${(r.amount ?? 0).toFixed(2)}` },
    { title: '申请时间', dataIndex: 'applyTime', width: 160 },
    { title: '处理时间', dataIndex: 'processTime', width: 160 },
    { title: '审核状态', dataIndex: 'status', width: 110, render: (_, r) => <Tag color={STATUS_COLOR[r.status]}>{r.status}</Tag> },
    {
      title: '操作',
      dataIndex: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="middle">
          <a onClick={() => setDetailRecord(record)}>查看</a>
          {record.status !== '已到账' && <a onClick={() => advance(record)}>{record.status === '待审核' ? '审核' : '到账'}</a>}
          <a onClick={() => { setEditing(record); setApplyOpen(true); }}>编辑</a>
          <a onClick={() => handleDelete(record)}>删除</a>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer className={styles.withdrawManagementPage} header={{ title: '提现管理', subTitle: '提现记录来自后端 /api/withdrawals，支持申请提现 / 审核 / 到账 / 编辑 / 删除。' }}>
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
          <div className={styles.amountItem}>余额:<strong>￥{(1000 - amounts.withdrawn - amounts.applying).toFixed(2)}</strong></div>
          <div className={styles.amountItem}>已提现金额:<strong>￥{amounts.withdrawn.toFixed(2)}</strong></div>
          <div className={styles.amountItem}>申请中提现金额:<strong>￥{amounts.applying.toFixed(2)}</strong></div>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(undefined); setApplyOpen(true); }}>申请提现</Button>
        </div>
        <div className={styles.warningText}>不同银行到账可能存在时间差，<strong>请以实际凭证及到账时间为准。</strong></div>
      </div>

      <div className={styles.filterCard}>
        <div className={styles.searchGrid}>
          <DatePicker placeholder="申请开始日期" />
          <DatePicker placeholder="申请结束日期" />
          <Button type="primary" icon={<SearchOutlined />} onClick={() => message.success('已按条件筛选')}>搜索</Button>
        </div>
      </div>

      <div className={styles.tableCard}>
        <ProTable<WithdrawRecord>
          cardBordered
          className={styles.tableWrap}
          columns={columns}
          dataSource={records}
          locale={{ emptyText: '暂无数据' }}
          options={false}
          pagination={{ pageSize: 10, showQuickJumper: true, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
          rowKey="id"
          search={false}
          tableAlertRender={false}
        />
      </div>

      <ModalForm<WithdrawRecord>
        key={editing?.id ?? 'create'}
        title={editing ? `编辑提现 · ${editing.orderNo}` : '申请提现'}
        open={applyOpen}
        onOpenChange={setApplyOpen}
        grid
        rowProps={{ gutter: 16 }}
        modalProps={{ destroyOnClose: true }}
        initialValues={editing ?? { withdrawAccount: '6224515245158888', amount: 100, applyTime: '2026-06-24 21:00', status: '待审核' }}
        onFinish={async (values) => {
          try {
            if (editing) await updateWithdrawal(editing.id, values);
            else await createWithdrawal({ ...values, orderNo: `WD${Date.now()}` });
            message.success(editing ? '已保存' : '已提交提现申请');
            setApplyOpen(false);
            refresh();
            return true;
          } catch {
            message.error('提交失败');
            return false;
          }
        }}
      >
        {editing && <ProFormText name="orderNo" label="订单编号" colProps={{ span: 12 }} disabled />}
        <ProFormText name="withdrawAccount" label="提现账号" colProps={{ span: 12 }} rules={[{ required: true }]} />
        <ProFormDigit name="amount" label="提现金额(￥)" colProps={{ span: 12 }} min={0} fieldProps={{ precision: 2 }} rules={[{ required: true }]} />
        <ProFormText name="applyTime" label="申请时间" placeholder="YYYY-MM-DD HH:mm" colProps={{ span: 12 }} />
      </ModalForm>

      <Drawer destroyOnHidden onClose={() => setDetailRecord(undefined)} open={Boolean(detailRecord)} title={detailRecord ? `${detailRecord.orderNo} 提现详情` : '提现详情'} width={680}>
        {detailRecord ? (
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="订单编号">{detailRecord.orderNo}</Descriptions.Item>
            <Descriptions.Item label="提现账号">{detailRecord.withdrawAccount}</Descriptions.Item>
            <Descriptions.Item label="提现金额">￥{(detailRecord.amount ?? 0).toFixed(2)}</Descriptions.Item>
            <Descriptions.Item label="审核状态"><Tag color={STATUS_COLOR[detailRecord.status]}>{detailRecord.status}</Tag></Descriptions.Item>
            <Descriptions.Item label="申请时间">{detailRecord.applyTime}</Descriptions.Item>
            <Descriptions.Item label="处理时间">{detailRecord.processTime}</Descriptions.Item>
          </Descriptions>
        ) : null}
      </Drawer>
    </PageContainer>
  );
};

export default WithdrawManagementPage;
