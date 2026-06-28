import type { ProColumns } from '@ant-design/pro-components';
import { ModalForm, PageContainer, ProFormText, ProFormTextArea, ProTable } from '@ant-design/pro-components';
import { PlusOutlined } from '@ant-design/icons';
import { App, Button, Drawer, Space, Tag } from 'antd';
import React, { useEffect, useState } from 'react';
import {
  type MerchantRiskItem,
  createMerchant,
  listMerchants,
  removeMerchant,
  updateMerchant,
} from '@/services/platform/finance';
import styles from './index.less';

type MerchantRecord = MerchantRiskItem;

const MerchantRiskPage: React.FC = () => {
  const { message, modal } = App.useApp();
  const [records, setRecords] = useState<MerchantRecord[]>([]);
  const [detailRecord, setDetailRecord] = useState<MerchantRecord>();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MerchantRecord>();

  const refresh = async () => {
    try {
      const res = await listMerchants();
      setRecords((res.data as MerchantRecord[]) ?? []);
    } catch {
      /* ignore */
    }
  };
  useEffect(() => {
    refresh();
  }, []);

  const handleDelete = (record: MerchantRecord) => {
    modal.confirm({
      title: '确认删除该商户？',
      content: `商户名称：${record.merchantName}`,
      okType: 'danger',
      onOk: async () => {
        await removeMerchant(record.id);
        message.success('已删除');
        refresh();
      },
    });
  };

  const columns: ProColumns<MerchantRecord>[] = [
    { title: '商户名称', dataIndex: 'merchantName', width: 280, render: (_, record) => <a onClick={() => setDetailRecord(record)}>{record.merchantName}</a> },
    { title: '826商户号', dataIndex: 'merchantNo', width: 160 },
    { title: '注册状态', dataIndex: 'registerStatus', width: 100, render: (_, r) => <Tag color={r.registerStatus === '已注册' ? 'success' : 'default'}>{r.registerStatus}</Tag> },
    { title: '支付方式', dataIndex: 'payMethodStatus', width: 110 },
    { title: '支付宝', dataIndex: 'alipayStatus', width: 90 },
    { title: '微信', dataIndex: 'wechatStatus', width: 90 },
    { title: '交易风控', dataIndex: 'riskControl', width: 200, ellipsis: true },
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

  const infoGrid = (record: MerchantRecord) => (
    <Space direction="vertical" size={20} style={{ display: 'flex' }}>
      <div>
        <div className={styles.sectionTitle}>商户资料</div>
        <div className={styles.infoGrid}>
          {[
            ['商户注册状态', record.registerStatus],
            ['支付方式开通', record.payMethodStatus],
            ['支付宝开通状态', record.alipayStatus],
            ['微信开通状态', record.wechatStatus],
            ['服务有效期', record.serviceValidity],
            ['优惠时间段', record.promotionPeriod],
          ].map(([label, value]) => (
            <div className={styles.infoItem} key={label}>
              <div className={styles.infoLabel}>{label}</div>
              <div className={styles.infoValue}>{value}</div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className={styles.sectionTitle}>银盛账号信息</div>
        <div className={styles.infoGrid}>
          {[
            ['826商户号', record.merchantNo],
            ['商户名称', record.merchantName],
            ['价格策略', record.priceStrategy],
            ['交易风控', record.riskControl],
          ].map(([label, value]) => (
            <div className={styles.infoItem} key={label}>
              <div className={styles.infoLabel}>{label}</div>
              <div className={styles.infoValue}>{value}</div>
            </div>
          ))}
        </div>
      </div>
    </Space>
  );

  return (
    <PageContainer className={styles.merchantRiskPage} header={{ title: '商户与风控', subTitle: '商户支付注册、渠道开通与风控信息来自后端 /api/merchant-risks，支持新增 / 编辑 / 删除。' }}>
      <div className={styles.heroCard}>
        <div className={styles.heroTitle}>开始支付商户注册验证流程</div>
        <div className={styles.heroDesc}>
          独立支付功能需要完成第三方支付平台的认证，认证审核通过后还需要完善资料，完善资料后即可使用完整的独立支付功能。
        </div>
      </div>

      <div className={styles.contentCard}>
        <div className={styles.tableMeta} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div className={styles.sectionTitle} style={{ margin: 0 }}>商户列表（共 {records.length} 个）</div>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(undefined); setFormOpen(true); }}>新增商户</Button>
        </div>
        <ProTable<MerchantRecord>
          cardBordered
          columns={columns}
          dataSource={records}
          options={false}
          pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条` }}
          rowKey="id"
          scroll={{ x: 1200 }}
          search={false}
          tableAlertRender={false}
        />
      </div>

      <ModalForm<MerchantRecord>
        key={editing?.id ?? 'create'}
        title={editing ? `编辑商户 · ${editing.merchantName}` : '新增商户'}
        open={formOpen}
        onOpenChange={setFormOpen}
        grid
        rowProps={{ gutter: 16 }}
        modalProps={{ destroyOnClose: true }}
        initialValues={editing ?? { registerStatus: '已注册', payMethodStatus: '等待开通', alipayStatus: '未开通', wechatStatus: '未开通', serviceValidity: '未开通', promotionPeriod: '未开通', priceStrategy: '标准价格策略', riskControl: '正常' }}
        onFinish={async (values) => {
          try {
            if (editing) await updateMerchant(editing.id, values);
            else await createMerchant(values);
            message.success(editing ? '已保存' : '已新增商户');
            setFormOpen(false);
            refresh();
            return true;
          } catch {
            message.error('提交失败');
            return false;
          }
        }}
      >
        <ProFormText name="merchantName" label="商户名称" colProps={{ span: 12 }} rules={[{ required: true }]} />
        <ProFormText name="merchantNo" label="826商户号" colProps={{ span: 12 }} />
        <ProFormText name="registerStatus" label="商户注册状态" colProps={{ span: 12 }} />
        <ProFormText name="payMethodStatus" label="支付方式开通" colProps={{ span: 12 }} />
        <ProFormText name="alipayStatus" label="支付宝开通状态" colProps={{ span: 12 }} />
        <ProFormText name="wechatStatus" label="微信开通状态" colProps={{ span: 12 }} />
        <ProFormText name="serviceValidity" label="服务有效期" colProps={{ span: 12 }} />
        <ProFormText name="promotionPeriod" label="优惠时间段" colProps={{ span: 12 }} />
        <ProFormText name="priceStrategy" label="价格策略" colProps={{ span: 12 }} />
        <ProFormText name="riskControl" label="交易风控" colProps={{ span: 12 }} />
        <ProFormTextArea name="remark" label="备注" colProps={{ span: 24 }} />
      </ModalForm>

      <Drawer destroyOnHidden onClose={() => setDetailRecord(undefined)} open={Boolean(detailRecord)} title={detailRecord ? detailRecord.merchantName : '商户详情'} width={720}>
        {detailRecord ? infoGrid(detailRecord) : null}
      </Drawer>
    </PageContainer>
  );
};

export default MerchantRiskPage;
