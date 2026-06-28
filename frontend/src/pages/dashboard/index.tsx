import {
  AlertOutlined,
  ApiOutlined,
  ArrowUpOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DollarOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  PoweroffOutlined,
  ReloadOutlined,
  RiseOutlined,
  ShoppingCartOutlined,
  SyncOutlined,
  ThunderboltOutlined,
  WifiOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { history } from '@umijs/max';
import {
  App,
  Button,
  Card,
  Col,
  Divider,
  Form,
  InputNumber,
  Progress,
  Result,
  Row,
  Select,
  Space,
  Statistic,
  Steps,
  Switch,
  Tag,
  Timeline,
  Tooltip,
} from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useMemo, useState } from 'react';
import { cardAction, createCard } from '@/services/platform/cards';
import { createOrder } from '@/services/platform/finance';
import { getOverview } from '@/services/platform/stats';
import { resetDemoData } from '@/services/platform/system';
import styles from './index.less';

/** 看板基础数据 */
const SEED = {
  totalActive: 1280,
  online: 1140,
  offline: 80,
  suspended: 36,
  cancelled: 24,
  renewed: 998,
  arpu: 12.4,
  alerts: 7,
  monthNew: 156,
};

type Stats = typeof SEED;

const OPERATOR_DIST = [
  { label: '中国移动', value: 620, color: '#1677ff' },
  { label: '中国联通', value: 360, color: '#fa541c' },
  { label: '中国电信', value: 300, color: '#52c41a' },
];

const TREND = {
  labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
  added: [180, 210, 160, 240, 200, 260],
  renew: [120, 150, 110, 180, 160, 210],
};

const PROJECTS = [
  { name: '无人机巡检', value: 320, color: '#1677ff' },
  { name: '智能驾驶', value: 280, color: '#13c2c2' },
  { name: '水务抄表', value: 240, color: '#52c41a' },
  { name: '园区网关', value: 220, color: '#722ed1' },
  { name: '车载监控', value: 220, color: '#fa8c16' },
];

const OPERATOR_COLORS: Record<string, string> = {
  中国移动: '#1677ff',
  中国联通: '#fa541c',
  中国电信: '#52c41a',
};
const PROJECT_COLORS = ['#1677ff', '#13c2c2', '#52c41a', '#722ed1', '#fa8c16'];

const PACKAGES: Record<string, { label: string; total: number; fee: number }[]> = {
  中国移动: [
    { label: '移动专业 1GB x12月', total: 1024, fee: 6 },
    { label: '移动专业 30GB x12月', total: 30720, fee: 19 },
    { label: '移动专业 100GB x12月', total: 102400, fee: 39 },
  ],
  中国联通: [
    { label: '联通共享 10GB 池', total: 10240, fee: 12 },
    { label: '联通定向 5GB x12月', total: 5120, fee: 9 },
  ],
  中国电信: [
    { label: 'NB 按量 5年套餐', total: 100, fee: 5 },
    { label: '电信 50GB x12月', total: 51200, fee: 25 },
  ],
};

/** 开卡向导初始卡 */
type DemoCard = {
  iccid: string;
  operator: string;
  packageName: string;
  status: string;
  statusColor: string;
  orderNo: string;
  used: number;
  total: number;
  fee: number;
  expire: string;
};

const INIT_CARD: DemoCard = {
  iccid: '898604D5192270880001',
  operator: '中国移动',
  packageName: '—',
  status: '未开通',
  statusColor: 'default',
  orderNo: '—',
  used: 0,
  total: 1024,
  fee: 0,
  expire: '—',
};

type LogItem = { time: string; text: string; color: string };

/** 环形图（conic-gradient 实现，无图表库依赖） */
const Donut: React.FC<{ data: { label: string; value: number; color: string }[] }> = ({
  data,
}) => {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let acc = 0;
  const stops = data
    .map((d) => {
      const start = (acc / total) * 360;
      acc += d.value;
      const end = (acc / total) * 360;
      return `${d.color} ${start}deg ${end}deg`;
    })
    .join(', ');
  return (
    <div className={styles.donutWrap}>
      <div className={styles.donut} style={{ background: `conic-gradient(${stops})` }}>
        <div className={styles.donutHole}>
          <div className={styles.donutTotal}>{total}</div>
          <div className={styles.donutSub}>张在网</div>
        </div>
      </div>
      <div className={styles.legend}>
        {data.map((d) => (
          <div key={d.label} className={styles.legendItem}>
            <span className={styles.dot} style={{ background: d.color }} />
            <span className={styles.legendName}>{d.label}</span>
            <span className={styles.legendVal}>
              {d.value} · {Math.round((d.value / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/** 双列趋势柱状图（纯 CSS） */
const TrendBars: React.FC = () => {
  const max = Math.max(...TREND.added, ...TREND.renew) || 1;
  return (
    <div>
      <div className={styles.trend}>
        {TREND.labels.map((label, i) => (
          <div key={label} className={styles.trendCol}>
            <div className={styles.trendBars}>
              <Tooltip title={`新增 ${TREND.added[i]}`}>
                <div
                  className={styles.barAdded}
                  style={{ height: `${(TREND.added[i] / max) * 100}%` }}
                />
              </Tooltip>
              <Tooltip title={`续费 ${TREND.renew[i]}`}>
                <div
                  className={styles.barRenew}
                  style={{ height: `${(TREND.renew[i] / max) * 100}%` }}
                />
              </Tooltip>
            </div>
            <div className={styles.trendLabel}>{label}</div>
          </div>
        ))}
      </div>
      <div className={styles.trendLegend}>
        <span>
          <i className={styles.barAdded} /> 新增开卡
        </span>
        <span>
          <i className={styles.barRenew} /> 续费
        </span>
      </div>
    </div>
  );
};

const DashboardPage: React.FC = () => {
  const { message, modal } = App.useApp();
  const [stats, setStats] = useState<Stats>({ ...SEED });
  const [card, setCard] = useState<DemoCard>({ ...INIT_CARD });
  const [current, setCurrent] = useState(0);
  const [finished, setFinished] = useState(false);
  const [logs, setLogs] = useState<LogItem[]>([
    { time: dayjs().format('HH:mm:ss'), text: '已就绪，等待发起开卡订单', color: 'gray' },
  ]);
  const [orderForm] = Form.useForm();
  const [renewMonths, setRenewMonths] = useState(12);
  const [powerOn, setPowerOn] = useState(true);
  const [cardId, setCardId] = useState<string>();
  const selectedOperator = Form.useWatch('operator', orderForm) || '中国移动';

  const [operatorDist, setOperatorDist] = useState(OPERATOR_DIST);
  const [projects, setProjects] = useState(PROJECTS);

  // 看板 KPI / 运营商分布 / 项目分布 实时读后端聚合（任何业务页新增数据后回看板即更新）
  const loadOverview = () => {
    getOverview()
      .then((o) => {
        setStats((prev) => ({
          ...prev,
          totalActive: o.totalActive,
          online: o.online,
          offline: o.offline,
          suspended: o.suspended,
          cancelled: o.cancelled,
          renewed: o.renewed,
          arpu: o.arpu,
          alerts: o.alerts,
          monthNew: o.monthNew,
        }));
        if (o.operatorDist?.length)
          setOperatorDist(o.operatorDist.map((d) => ({ label: d.label, value: d.value, color: OPERATOR_COLORS[d.label] ?? '#8c8c8c' })));
        if (o.projectDist?.length)
          setProjects(o.projectDist.map((d, i) => ({ name: d.name, value: d.value, color: PROJECT_COLORS[i % PROJECT_COLORS.length] })));
      })
      .catch(() => {});
  };
  useEffect(() => {
    loadOverview();
  }, []);

  const onlineRate = useMemo(
    () => (stats.totalActive ? (stats.online / stats.totalActive) * 100 : 0),
    [stats],
  );
  const renewRate = useMemo(
    () => (stats.totalActive ? (stats.renewed / stats.totalActive) * 100 : 0),
    [stats],
  );

  const pushLog = (text: string, color = 'blue') =>
    setLogs((prev) => [{ time: dayjs().format('HH:mm:ss'), text, color }, ...prev]);

  /** 步骤 0 → 1：提交订购（真实建卡入后端） */
  const handleOrder = async (values: { operator: string; pkg: string }) => {
    const pkg = PACKAGES[values.operator].find((p) => p.label === values.pkg);
    if (!pkg) return;
    const orderNo = `ORD${dayjs().format('YYYYMMDDHHmmss')}`;
    const iccid = `8986${dayjs().format('YYMMDDHHmmss')}`;
    const msisdn = `144${dayjs().format('HHmmssSSS')}`;
    try {
      const res = await createCard({
        tab: 'normal',
        iccid,
        msisdn,
        operator: values.operator,
        packageName: pkg.label,
        status: 'offline',
        cardStatusText: '待开通',
        project: '园区网关',
        region: '华东',
        remark: `开卡向导 ${orderNo}`,
        serviceStatus: false,
        remainTraffic: `${pkg.total}MB`,
        effectiveDate: '--',
        expireDate: '--',
      });
      setCardId(res.data.id);
      setCard((c) => ({ ...c, iccid, operator: values.operator, packageName: pkg.label, total: pkg.total, fee: pkg.fee, orderNo, status: '待开通', statusColor: 'gold' }));
      setCurrent(1);
      loadOverview();
      message.success('订单已提交并在后端建卡（待开通）');
      pushLog(`提交开卡订单 ${orderNo} → 后端已建卡 ${iccid}（看板在网数 +1）`, 'blue');
    } catch {
      message.error('建卡失败（请确认后端已启动）');
    }
  };

  /** 步骤 1 → 2：开通激活（后端置为在线） */
  const handleActivate = async () => {
    if (!cardId) return;
    await cardAction(cardId, 'resume');
    setCard((c) => ({ ...c, status: '在线', statusColor: 'green', expire: dayjs().add(12, 'month').format('YYYY-MM-DD') }));
    setPowerOn(true);
    setCurrent(2);
    loadOverview();
    message.success('开通成功，卡片已上线（看板在线数 +1）');
    pushLog('开通激活 → 后端置为在线，看板在线 +1', 'green');
  };

  /** 步骤 2：刷新用量 */
  const handleRefreshUsage = () => {
    setCard((c) => ({ ...c, used: Math.min(c.total, c.used + Math.round(c.total * 0.18)) }));
    pushLog('采集到新的用量数据', 'cyan');
  };

  /** 步骤 2 → 3 */
  const gotoRenew = () => {
    setCurrent(3);
    pushLog('进入续费环节', 'gray');
  };

  /** 步骤 3 → 4：续费（后端生成真实订单） */
  const handleRenew = async () => {
    const amount = Math.round(card.fee * renewMonths * 100) / 100;
    const commission = Math.round(amount * 0.3 * 100) / 100;
    try {
      await createOrder({
        orderNo: `ORD${dayjs().format('YYYYMMDDHHmmss')}`,
        customerName: '华东物联科技有限公司',
        iccid: card.iccid,
        msisdn: '',
        packageName: card.packageName,
        packageType: '周期套餐',
        orderAmount: amount,
        costAmount: Math.round(amount * 0.6 * 100) / 100,
        marginAmount: Math.round(amount * 0.4 * 100) / 100,
        commissionAmount: commission,
        consumeTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        statementMonth: dayjs().format('YYYYMM'),
        remark: '续费',
      });
      setCard((c) => ({ ...c, expire: dayjs(c.expire === '—' ? undefined : c.expire).add(renewMonths, 'month').format('YYYY-MM-DD') }));
      setCurrent(4);
      loadOverview();
      message.success(`续费 ${renewMonths} 个月成功，已在后端生成订单 ¥${amount}`);
      pushLog(`续费 ${renewMonths} 个月 → 后端生成订单 ¥${amount}（看板 ARPU 上升）`, 'green');
    } catch {
      message.error('续费下单失败');
    }
  };

  /** 步骤 4：停 / 复机（后端动作） */
  const handlePower = async (checked: boolean) => {
    if (!cardId) return;
    setPowerOn(checked);
    await cardAction(cardId, checked ? 'resume' : 'suspend');
    setCard((c) => ({ ...c, status: checked ? '在线' : '停机保号', statusColor: checked ? 'green' : 'orange' }));
    loadOverview();
    pushLog(checked ? '复机 → 后端在线 +1 / 停机 -1' : '停机保号 → 后端在线 -1 / 停机 +1', checked ? 'green' : 'orange');
  };

  /** 步骤 4 → 5：注销（后端置为已注销），闭环结束 */
  const handleCancel = async () => {
    if (!cardId) return;
    await cardAction(cardId, 'cancel');
    setCard((c) => ({ ...c, status: '已注销', statusColor: 'red' }));
    setCurrent(5);
    setFinished(true);
    loadOverview();
    message.success('已注销，全生命周期闭环完成');
    pushLog('自主注销 → 后端置为已注销，看板在网 -1 / 累计注销 +1，闭环完成 ✅', 'red');
  };

  /** 重置向导（拉取后端最新聚合，开始新一轮） */
  const handleReset = () => {
    loadOverview();
    setCard({ ...INIT_CARD });
    setCardId(undefined);
    setCurrent(0);
    setFinished(false);
    setPowerOn(true);
    setRenewMonths(12);
    orderForm.resetFields();
    setLogs([{ time: dayjs().format('HH:mm:ss'), text: '已开始新一轮开卡流程', color: 'gray' }]);
    message.info('向导已重置');
  };

  const statusSegments = [
    { label: '在线', value: stats.online, color: '#52c41a' },
    { label: '离线', value: stats.offline, color: '#bfbfbf' },
    { label: '停机保号', value: stats.suspended, color: '#fa8c16' },
    { label: '已注销', value: stats.cancelled, color: '#f5222d' },
  ];
  const statusTotal = statusSegments.reduce((s, d) => s + d.value, 0) || 1;

  const stepItems = [
    { title: '订购套餐', icon: <ShoppingCartOutlined /> },
    { title: '开通激活', icon: <ThunderboltOutlined /> },
    { title: '查看用量', icon: <ApiOutlined /> },
    { title: '续费', icon: <RiseOutlined /> },
    { title: '停复机', icon: <PauseCircleOutlined /> },
    { title: '注销', icon: <PoweroffOutlined /> },
  ];

  return (
    <PageContainer
      header={{
        title: '运营数据看板',
        subTitle: '物联网卡运营驾驶舱 + 一键开卡全生命周期闭环',
        extra: [
          <Tag key="mode" color="green">
            后端实时数据
          </Tag>,
          <Button
            key="resetData"
            danger
            icon={<ReloadOutlined />}
            onClick={() =>
              modal.confirm({
                title: '确认重置数据？',
                content: '将清空所有手动新增的数据，并恢复到初始种子状态（影响全部业务页面）。',
                okType: 'danger',
                onOk: async () => {
                  await resetDemoData();
                  message.success('数据已重置');
                  loadOverview();
                },
              })
            }
          >
            重置数据
          </Button>,
          <Button key="reset" icon={<ReloadOutlined />} onClick={handleReset}>
            重置向导
          </Button>,
        ],
      }}
    >
      {/* ===== KPI 总览 ===== */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={8} lg={4}>
          <Card className={styles.kpiCard} variant="borderless">
            <Statistic
              title="在网卡总数"
              value={stats.totalActive}
              prefix={<WifiOutlined className={styles.kpiIconBlue} />}
            />
            <div className={styles.kpiFoot}>
              本月新增 <span className={styles.up}>+{stats.monthNew}</span>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card className={styles.kpiCard} variant="borderless">
            <Statistic
              title="在线率"
              value={onlineRate}
              precision={1}
              suffix="%"
              valueStyle={{ color: '#52c41a' }}
            />
            <Progress
              percent={Math.round(onlineRate)}
              showInfo={false}
              strokeColor="#52c41a"
              size="small"
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card className={styles.kpiCard} variant="borderless">
            <Statistic
              title="续费率"
              value={renewRate}
              precision={1}
              suffix="%"
              valueStyle={{ color: '#1677ff' }}
            />
            <Progress
              percent={Math.round(renewRate)}
              showInfo={false}
              strokeColor="#1677ff"
              size="small"
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card className={styles.kpiCard} variant="borderless">
            <Statistic
              title="ARPU（元/月）"
              value={stats.arpu}
              precision={1}
              prefix={<DollarOutlined className={styles.kpiIconGold} />}
              valueStyle={{ color: '#fa8c16' }}
            />
            <div className={styles.kpiFoot}>
              环比 <span className={styles.up}>↑ 2.4%</span>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card
            className={`${styles.kpiCard} ${styles.kpiClickable}`}
            variant="borderless"
            onClick={() => history.push('/alert-center')}
          >
            <Statistic
              title="活跃告警"
              value={stats.alerts}
              prefix={<AlertOutlined className={styles.kpiIconRed} />}
              valueStyle={{ color: '#f5222d' }}
            />
            <div className={styles.kpiFoot}>点击进入告警中心处理 →</div>
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card className={styles.kpiCard} variant="borderless">
            <Statistic
              title="累计注销"
              value={stats.cancelled}
              prefix={<CloseCircleOutlined className={styles.kpiIconGray} />}
            />
            <div className={styles.kpiFoot}>生命周期终态</div>
          </Card>
        </Col>
      </Row>

      {/* ===== 可视化 ===== */}
      <Row gutter={[16, 16]} className={styles.rowGap}>
        <Col xs={24} lg={8}>
          <Card title="运营商在网分布" variant="borderless" className={styles.panel}>
            <Donut data={operatorDist} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="卡状态分布" variant="borderless" className={styles.panel}>
            <div className={styles.statusBar}>
              {statusSegments.map((seg) => (
                <Tooltip key={seg.label} title={`${seg.label} ${seg.value}`}>
                  <div
                    className={styles.statusSeg}
                    style={{
                      width: `${(seg.value / statusTotal) * 100}%`,
                      background: seg.color,
                    }}
                  />
                </Tooltip>
              ))}
            </div>
            <div className={styles.statusList}>
              {statusSegments.map((seg) => (
                <div key={seg.label} className={styles.statusItem}>
                  <span className={styles.dot} style={{ background: seg.color }} />
                  <span className={styles.legendName}>{seg.label}</span>
                  <span className={styles.legendVal}>{seg.value}</span>
                </div>
              ))}
            </div>
            <Divider className={styles.thinDivider} />
            <div className={styles.projectTitle}>项目用卡分布 Top5</div>
            {projects.map((p) => {
              const pmax = projects[0]?.value || 1;
              return (
                <div key={p.name} className={styles.projectRow}>
                  <span className={styles.projectName}>{p.name}</span>
                  <div className={styles.projectTrack}>
                    <div
                      className={styles.projectFill}
                      style={{ width: `${(p.value / pmax) * 100}%`, background: p.color }}
                    />
                  </div>
                  <span className={styles.projectVal}>{p.value}</span>
                </div>
              );
            })}
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="近 6 月 新增 / 续费 趋势" variant="borderless" className={styles.panel}>
            <TrendBars />
          </Card>
        </Col>
      </Row>

      {/* ===== 一键开卡闭环 ===== */}
      <Card
        className={styles.rowGap}
        variant="borderless"
        title={
          <Space>
            <ThunderboltOutlined style={{ color: '#1677ff' }} />
            一键开卡 · 全生命周期闭环
          </Space>
        }
        extra={
          <Tag color={finished ? 'success' : 'processing'}>
            {finished ? '闭环已完成' : `进行中 · 第 ${current + 1} / 6 步`}
          </Tag>
        }
      >
        <Steps current={current} items={stepItems} className={styles.steps} />

        <Row gutter={24} className={styles.rowGap}>
          {/* 左：当前步骤操作面板 */}
          <Col xs={24} lg={15}>
            <Card type="inner" title="操作面板" className={styles.innerCard}>
              {/* 开卡概要 */}
              <div className={styles.cardSummary}>
                <div>
                  <span className={styles.sumLabel}>ICCID</span>
                  <span className={styles.sumValue}>{card.iccid}</span>
                </div>
                <div>
                  <span className={styles.sumLabel}>运营商</span>
                  <span className={styles.sumValue}>{card.operator}</span>
                </div>
                <div>
                  <span className={styles.sumLabel}>套餐</span>
                  <span className={styles.sumValue}>{card.packageName}</span>
                </div>
                <div>
                  <span className={styles.sumLabel}>状态</span>
                  <Tag color={card.statusColor}>{card.status}</Tag>
                </div>
                <div>
                  <span className={styles.sumLabel}>订单号</span>
                  <span className={styles.sumValue}>{card.orderNo}</span>
                </div>
                <div>
                  <span className={styles.sumLabel}>到期</span>
                  <span className={styles.sumValue}>{card.expire}</span>
                </div>
              </div>

              <Divider className={styles.thinDivider} />

              {current === 0 && (
                <Form
                  form={orderForm}
                  layout="vertical"
                  initialValues={{ operator: '中国移动' }}
                  onFinish={handleOrder}
                >
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="operator" label="运营商" rules={[{ required: true }]}>
                        <Select
                          options={Object.keys(PACKAGES).map((o) => ({ label: o, value: o }))}
                          onChange={() => orderForm.setFieldValue('pkg', undefined)}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="pkg" label="套餐" rules={[{ required: true }]}>
                        <Select
                          placeholder="请选择套餐"
                          options={(PACKAGES[selectedOperator] || []).map((p) => ({
                            label: `${p.label}（¥${p.fee}/月）`,
                            value: p.label,
                          }))}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<ShoppingCartOutlined />}
                  >
                    提交开卡订单
                  </Button>
                </Form>
              )}

              {current === 1 && (
                <div className={styles.stepPanel}>
                  <p className={styles.hint}>
                    订单 <b>{card.orderNo}</b> 已生成，点击下方按钮向运营商发起开通激活。
                  </p>
                  <Button type="primary" icon={<ThunderboltOutlined />} onClick={handleActivate}>
                    开通激活（在线数 +1）
                  </Button>
                </div>
              )}

              {current === 2 && (
                <div className={styles.stepPanel}>
                  <div className={styles.usageRow}>
                    <Progress
                      type="dashboard"
                      percent={Math.round((card.used / card.total) * 100)}
                      strokeColor={{ '0%': '#52c41a', '100%': '#1677ff' }}
                    />
                    <div className={styles.usageMeta}>
                      <div>
                        已用 <b>{(card.used / 1024).toFixed(2)} GB</b>
                      </div>
                      <div>
                        总量 <b>{(card.total / 1024).toFixed(2)} GB</b>
                      </div>
                      <div className={styles.muted}>套餐：{card.packageName}</div>
                    </div>
                  </div>
                  <Space>
                    <Button icon={<SyncOutlined />} onClick={handleRefreshUsage}>
                      刷新用量
                    </Button>
                    <Button type="primary" onClick={gotoRenew}>
                      下一步：续费
                    </Button>
                  </Space>
                </div>
              )}

              {current === 3 && (
                <div className={styles.stepPanel}>
                  <Space align="end">
                    <div>
                      <div className={styles.hint}>续费时长（月）</div>
                      <InputNumber
                        min={1}
                        max={60}
                        value={renewMonths}
                        onChange={(v) => setRenewMonths(v || 12)}
                      />
                    </div>
                    <Button type="primary" icon={<RiseOutlined />} onClick={handleRenew}>
                      确认续费
                    </Button>
                  </Space>
                  <p className={styles.muted}>续费将提升看板「续费率」与「ARPU」。</p>
                </div>
              )}

              {current === 4 && (
                <div className={styles.stepPanel}>
                  <Space size="large">
                    <span>
                      停 / 复机：
                      <Switch
                        className={styles.powerSwitch}
                        checked={powerOn}
                        checkedChildren="开机"
                        unCheckedChildren="停机"
                        onChange={handlePower}
                      />
                    </span>
                    <Button danger icon={<PoweroffOutlined />} onClick={handleCancel}>
                      自主注销（闭环结束）
                    </Button>
                  </Space>
                  <p className={styles.muted}>
                    停复机会实时改变看板「在线 / 停机」分布；注销将完成整个生命周期闭环。
                  </p>
                </div>
              )}

              {current === 5 && finished && (
                <Result
                  status="success"
                  icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                  title="开卡全生命周期闭环已完成"
                  subTitle="订购 → 开通 → 用量 → 续费 → 停复机 → 注销，看板数据已同步联动。"
                  extra={
                    <Button type="primary" icon={<ReloadOutlined />} onClick={handleReset}>
                      再来一次
                    </Button>
                  }
                />
              )}
            </Card>
          </Col>

          {/* 右：操作时间线 */}
          <Col xs={24} lg={9}>
            <Card
              type="inner"
              title="操作时间线"
              className={styles.innerCard}
              extra={<PlayCircleOutlined style={{ color: '#1677ff' }} />}
            >
              <Timeline
                className={styles.timeline}
                items={logs.map((l) => ({
                  color: l.color,
                  children: (
                    <div>
                      <div className={styles.logText}>{l.text}</div>
                      <div className={styles.logTime}>{l.time}</div>
                    </div>
                  ),
                }))}
              />
            </Card>
          </Col>
        </Row>
        <div className={styles.linkTip}>
          <ArrowUpOutlined /> 闭环中的每一步操作都会实时联动上方看板的「在网总数 / 在线率 /
          续费率 / ARPU / 注销」等指标。
        </div>
      </Card>
    </PageContainer>
  );
};

export default DashboardPage;
