import {
  AlertOutlined,
  CheckCircleOutlined,
  EnvironmentOutlined,
  FireOutlined,
  PlusOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  StopOutlined,
  ThunderboltOutlined,
  WifiOutlined,
} from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import {
  App,
  Button,
  Card,
  Col,
  Drawer,
  Input,
  Popconfirm,
  Row,
  Segmented,
  Select,
  Space,
  Statistic,
  Tag,
} from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useRef, useState } from 'react';
import {
  type AlertItem,
  type AlertStats,
  alertStats,
  batchAlerts,
  createAlert,
  handleAlert,
  ignoreAlert,
  listAlerts,
} from '@/services/platform/alerts';
import styles from './index.less';

type AlertRow = AlertItem;
type AlertLevel = AlertItem['level'];
type AlertStatus = AlertItem['status'];
type AlertType = AlertItem['type'];

const LEVEL_COLOR: Record<AlertLevel, string> = { 高: 'red', 中: 'orange', 低: 'blue' };
const STATUS_COLOR: Record<AlertStatus, string> = {
  待处理: 'processing',
  已处理: 'success',
  已忽略: 'default',
};
const TYPE_ICON: Record<AlertType, React.ReactNode> = {
  流量超额: <ThunderboltOutlined style={{ color: '#fa8c16' }} />,
  设备离线: <WifiOutlined style={{ color: '#bfbfbf' }} />,
  欠费停机: <StopOutlined style={{ color: '#f5222d' }} />,
  异常位置: <EnvironmentOutlined style={{ color: '#722ed1' }} />,
  风控拦截: <SafetyCertificateOutlined style={{ color: '#f5222d' }} />,
};
const ALERT_TYPES: AlertType[] = ['流量超额', '设备离线', '欠费停机', '异常位置', '风控拦截'];

const AlertCenterPage: React.FC = () => {
  const { message } = App.useApp();
  const actionRef = useRef<ActionType | undefined>(undefined);
  const [stats, setStats] = useState<AlertStats>({ total: 0, pending: 0, handled: 0, high: 0 });
  const [levelFilter, setLevelFilter] = useState('全部');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState('待处理');
  const [keyword, setKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  const [detail, setDetail] = useState<AlertRow>();
  const [detailOpen, setDetailOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const refreshStats = async () => {
    try {
      setStats(await alertStats());
    } catch {
      /* ignore */
    }
  };
  useEffect(() => {
    refreshStats();
  }, []);

  const reload = () => {
    actionRef.current?.reload();
    refreshStats();
    setSelectedKeys([]);
  };

  const requestAlerts = async (params: { current?: number; pageSize?: number }) => {
    const res = await listAlerts({
      current: params.current,
      pageSize: params.pageSize,
      keyword: appliedKeyword || undefined,
      type: typeFilter !== 'all' ? typeFilter : undefined,
      level: levelFilter !== '全部' ? levelFilter : undefined,
      status: statusFilter !== '全部' ? statusFilter : undefined,
    });
    return { data: res.data ?? [], total: res.total, success: res.success };
  };

  const doHandle = async (row: AlertRow) => {
    await handleAlert(row.id);
    message.success('已处理');
    reload();
  };
  const doIgnore = async (row: AlertRow) => {
    await ignoreAlert(row.id);
    message.success('已忽略');
    reload();
  };
  const doBatch = async (action: 'handle' | 'ignore') => {
    await batchAlerts(selectedKeys.map(String), action);
    message.success(`已${action === 'handle' ? '处理' : '忽略'} ${selectedKeys.length} 条`);
    reload();
  };

  const openDetail = (row: AlertRow) => {
    setDetail(row);
    setDetailOpen(true);
  };

  const columns: ProColumns<AlertRow>[] = [
    { title: '告警ID', dataIndex: 'id', width: 150, render: (_, row) => <a onClick={() => openDetail(row)}>{row.id}</a> },
    { title: '时间', dataIndex: 'time', width: 150 },
    {
      title: '对象',
      dataIndex: 'target',
      width: 200,
      ellipsis: true,
      render: (_, row) => (
        <Space size={4}>
          {TYPE_ICON[row.type]}
          <span>{row.target}</span>
        </Space>
      ),
    },
    { title: '运营商', dataIndex: 'operator', width: 100 },
    { title: '类型', dataIndex: 'type', width: 110, render: (_, row) => <Tag>{row.type}</Tag> },
    {
      title: '级别',
      dataIndex: 'level',
      width: 80,
      render: (_, row) => <Tag color={LEVEL_COLOR[row.level]}>{row.level}危</Tag>,
    },
    { title: '描述', dataIndex: 'desc', ellipsis: true },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (_, row) => <Tag color={STATUS_COLOR[row.status]}>{row.status}</Tag>,
    },
    {
      title: '操作',
      width: 170,
      fixed: 'right',
      render: (_, row) =>
        row.status === '待处理' ? (
          <Space size={4}>
            <Popconfirm title="确认处理该告警？" onConfirm={() => doHandle(row)}>
              <Button type="link" size="small">
                处理
              </Button>
            </Popconfirm>
            <Button type="link" size="small" onClick={() => doIgnore(row)}>
              忽略
            </Button>
            <Button type="link" size="small" onClick={() => openDetail(row)}>
              详情
            </Button>
          </Space>
        ) : (
          <Button type="link" size="small" onClick={() => openDetail(row)}>
            详情
          </Button>
        ),
    },
  ];

  return (
    <PageContainer
      header={{
        title: '告警 / 风控中心',
        subTitle: '告警数据来自后端 /api/alerts，支持新增 / 处理 / 忽略（单条+批量），KPI 实时统计。',
        extra: [
          <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
            新增告警
          </Button>,
          <Button key="reset" icon={<ReloadOutlined />} onClick={reload}>
            刷新
          </Button>,
        ],
      }}
    >
      <Row gutter={[16, 16]}>
        <Col xs={12} lg={6}>
          <Card variant="borderless" className={styles.kpi}>
            <Statistic title="告警总数" value={stats.total} prefix={<AlertOutlined style={{ color: '#1677ff' }} />} />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card variant="borderless" className={styles.kpi}>
            <Statistic title="待处理" value={stats.pending} valueStyle={{ color: '#fa8c16' }} prefix={<ThunderboltOutlined style={{ color: '#fa8c16' }} />} />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card variant="borderless" className={styles.kpi}>
            <Statistic title="高危待处理" value={stats.high} valueStyle={{ color: '#f5222d' }} prefix={<FireOutlined style={{ color: '#f5222d' }} />} />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card variant="borderless" className={styles.kpi}>
            <Statistic title="已处理 / 已忽略" value={stats.handled} valueStyle={{ color: '#52c41a' }} prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />} />
          </Card>
        </Col>
      </Row>

      <Card variant="borderless" className={styles.tableCard}>
        <div className={styles.toolbar}>
          <Space wrap>
            <Input.Search
              allowClear
              placeholder="告警ID / 对象 / 描述"
              style={{ width: 240 }}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onSearch={(v) => {
                setAppliedKeyword(v);
                setTimeout(reload, 0);
              }}
            />
            <Select
              value={typeFilter}
              style={{ width: 140 }}
              onChange={(v) => {
                setTypeFilter(v);
                setTimeout(reload, 0);
              }}
              options={[
                { label: '全部类型', value: 'all' },
                ...ALERT_TYPES.map((t) => ({ label: t, value: t })),
              ]}
            />
            <Segmented
              value={levelFilter}
              onChange={(v) => {
                setLevelFilter(v as string);
                setTimeout(reload, 0);
              }}
              options={['全部', '高', '中', '低']}
            />
            <Segmented
              value={statusFilter}
              onChange={(v) => {
                setStatusFilter(v as string);
                setTimeout(reload, 0);
              }}
              options={['待处理', '已处理', '已忽略', '全部']}
            />
          </Space>
          <Space>
            <Popconfirm
              title={`确认批量处理选中的 ${selectedKeys.length} 条告警？`}
              disabled={!selectedKeys.length}
              onConfirm={() => doBatch('handle')}
            >
              <Button type="primary" disabled={!selectedKeys.length}>
                批量处理
              </Button>
            </Popconfirm>
            <Button disabled={!selectedKeys.length} onClick={() => doBatch('ignore')}>
              批量忽略
            </Button>
          </Space>
        </div>

        <ProTable<AlertRow>
          rowKey="id"
          actionRef={actionRef}
          search={false}
          options={false}
          columns={columns}
          request={requestAlerts}
          scroll={{ x: 1200 }}
          rowSelection={{
            selectedRowKeys: selectedKeys,
            onChange: setSelectedKeys,
            getCheckboxProps: (row) => ({ disabled: row.status !== '待处理' }),
          }}
          tableAlertRender={false}
          tableAlertOptionRender={false}
          pagination={{ pageSize: 8, showTotal: (t) => `共 ${t} 条` }}
        />
      </Card>

      {/* 新增告警 */}
      <ModalForm
        title="新增告警"
        open={createOpen}
        onOpenChange={setCreateOpen}
        grid
        rowProps={{ gutter: 16 }}
        modalProps={{ destroyOnClose: true }}
        initialValues={{
          time: dayjs().format('YYYY-MM-DD HH:mm'),
          operator: '中国移动',
          type: '流量超额',
          level: '中',
          status: '待处理',
        }}
        onFinish={async (values) => {
          try {
            await createAlert(values as Partial<AlertItem>);
            message.success('已新增告警');
            reload();
            return true;
          } catch {
            message.error('提交失败');
            return false;
          }
        }}
      >
        <ProFormText name="target" label="告警对象" placeholder="ICCID / 设备名" colProps={{ span: 12 }} rules={[{ required: true }]} />
        <ProFormText name="time" label="触发时间" colProps={{ span: 12 }} />
        <ProFormSelect
          name="operator"
          label="运营商"
          colProps={{ span: 12 }}
          options={['中国移动', '中国联通', '中国电信'].map((o) => ({ label: o, value: o }))}
        />
        <ProFormSelect
          name="type"
          label="告警类型"
          colProps={{ span: 12 }}
          options={ALERT_TYPES.map((t) => ({ label: t, value: t }))}
          rules={[{ required: true }]}
        />
        <ProFormSelect
          name="level"
          label="级别"
          colProps={{ span: 12 }}
          options={['高', '中', '低'].map((l) => ({ label: `${l}危`, value: l }))}
          rules={[{ required: true }]}
        />
        <ProFormSelect
          name="status"
          label="状态"
          colProps={{ span: 12 }}
          options={['待处理', '已处理', '已忽略'].map((s) => ({ label: s, value: s }))}
        />
        <ProFormTextArea name="desc" label="告警描述" colProps={{ span: 24 }} rules={[{ required: true }]} />
      </ModalForm>

      <Drawer
        width={520}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title={detail ? `告警详情 · ${detail.id}` : '告警详情'}
      >
        {detail && (
          <div className={styles.detail}>
            {[
              ['告警级别', <Tag key="l" color={LEVEL_COLOR[detail.level]}>{detail.level}危</Tag>],
              ['当前状态', <Tag key="s" color={STATUS_COLOR[detail.status]}>{detail.status}</Tag>],
              ['告警类型', detail.type],
              ['触发时间', detail.time],
              ['关联对象', detail.target],
              ['所属运营商', detail.operator],
              ['告警描述', detail.desc],
              ['处置建议', detail.type === '风控拦截' ? '建议立即停机并核实持卡人身份' : '建议核实业务后处理或忽略'],
            ].map(([label, value]) => (
              <div key={String(label)} className={styles.detailItem}>
                <div className={styles.detailLabel}>{label}</div>
                <div className={styles.detailValue}>{value}</div>
              </div>
            ))}
            {detail.status === '待处理' && (
              <Space style={{ marginTop: 16 }}>
                <Button type="primary" onClick={() => { doHandle(detail); setDetailOpen(false); }}>
                  处理
                </Button>
                <Button onClick={() => { doIgnore(detail); setDetailOpen(false); }}>忽略</Button>
              </Space>
            )}
          </div>
        )}
      </Drawer>
    </PageContainer>
  );
};

export default AlertCenterPage;
