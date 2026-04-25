import type { ProColumns } from "@ant-design/pro-components";
import { PageContainer, ProTable } from "@ant-design/pro-components";
import {
  Alert,
  App,
  Button,
  DatePicker,
  Descriptions,
  Drawer,
  Input,
  Modal,
  Select,
  Space,
  Tag,
  Timeline,
} from "antd";
import dayjs, { type Dayjs } from "dayjs";
import React, { useMemo, useState } from "react";
import styles from "./index.less";

type LifecycleStage =
  | "pending"
  | "active"
  | "expiring"
  | "grace"
  | "suspended"
  | "expired";
type AutoRenewStatus = "enabled" | "disabled";
type ServiceStatus = "running" | "suspended";
type OperationType = "renew" | "change" | "suspend" | "resume";

type LifecycleEvent = {
  time: string;
  title: string;
  description: string;
  color?: "blue" | "green" | "red" | "gray" | "orange";
};

type PackageLifecycleRecord = {
  id: string;
  iccid: string;
  cardNo: string;
  operator: string;
  packageName: string;
  packageType: string;
  deviceName: string;
  customerName: string;
  lifecycleStage: LifecycleStage;
  effectiveDate: string;
  expireDate: string;
  remainingDays: number;
  autoRenewStatus: AutoRenewStatus;
  serviceStatus: ServiceStatus;
  lastActionTime: string;
  riskNote: string;
  timeline: LifecycleEvent[];
};

const stageMeta: Record<
  LifecycleStage,
  { label: string; color: string; hint: string; tagColor: string }
> = {
  pending: {
    label: "待生效",
    color: "#2563eb",
    hint: "已绑定套餐，等待到达生效时间",
    tagColor: "processing",
  },
  active: {
    label: "生效中",
    color: "#16a34a",
    hint: "当前套餐正常在网，可继续服务",
    tagColor: "success",
  },
  expiring: {
    label: "即将到期",
    color: "#f59e0b",
    hint: "临期风险需要优先续费或变更",
    tagColor: "warning",
  },
  grace: {
    label: "宽限期",
    color: "#f97316",
    hint: "套餐已过期但仍处于缓冲处理窗口",
    tagColor: "orange",
  },
  suspended: {
    label: "已停机",
    color: "#ef4444",
    hint: "服务已受限，需复机或补齐资源",
    tagColor: "error",
  },
  expired: {
    label: "已失效",
    color: "#64748b",
    hint: "套餐周期已结束",
    tagColor: "default",
  },
};

const stageOrder: LifecycleStage[] = [
  "pending",
  "active",
  "expiring",
  "grace",
  "suspended",
  "expired",
];

const lifecycleRecords: PackageLifecycleRecord[] = [
  {
    id: "pkg-1",
    iccid: "898604A4192191902141",
    cardNo: "CARD-2024-0001",
    operator: "中国移动",
    packageName: "移动专业100GB x12月",
    packageType: "周期套餐",
    deviceName: "冷链终端 A-17",
    customerName: "顺运冷链",
    lifecycleStage: "active",
    effectiveDate: "2026-03-01",
    expireDate: "2027-02-28",
    remainingDays: 323,
    autoRenewStatus: "enabled",
    serviceStatus: "running",
    lastActionTime: "2026-03-01 08:30",
    riskNote: "当前服务稳定，已开启自动续费。",
    timeline: [
      {
        time: "2026-02-26 15:10",
        title: "套餐绑定成功",
        description: "套餐已关联到卡片，等待生效。",
        color: "blue",
      },
      {
        time: "2026-03-01 08:30",
        title: "套餐正式生效",
        description: "系统切换到生效中阶段。",
        color: "green",
      },
    ],
  },
  {
    id: "pkg-2",
    iccid: "898604A4192280313034",
    cardNo: "CARD-2024-0002",
    operator: "中国联通",
    packageName: "联通共享流量池 20GB",
    packageType: "共享池套餐",
    deviceName: "零售机终端 B-03",
    customerName: "新零售事业部",
    lifecycleStage: "expiring",
    effectiveDate: "2025-05-01",
    expireDate: "2026-04-20",
    remainingDays: 9,
    autoRenewStatus: "disabled",
    serviceStatus: "running",
    lastActionTime: "2026-04-10 14:20",
    riskNote: "9 天后到期，尚未开启自动续费。",
    timeline: [
      {
        time: "2025-05-01 00:00",
        title: "套餐生效",
        description: "进入生效中阶段。",
        color: "green",
      },
      {
        time: "2026-04-10 14:20",
        title: "临期预警生成",
        description: "剩余天数低于 10 天，建议立即处理。",
        color: "orange",
      },
    ],
  },
  {
    id: "pkg-3",
    iccid: "898604D5192270879709",
    cardNo: "CARD-2024-0003",
    operator: "中国电信",
    packageName: "NB 按量套餐 3年",
    packageType: "NB 套餐",
    deviceName: "水表采集器 N-08",
    customerName: "城市水务",
    lifecycleStage: "pending",
    effectiveDate: "2026-04-15",
    expireDate: "2029-04-14",
    remainingDays: 1098,
    autoRenewStatus: "enabled",
    serviceStatus: "running",
    lastActionTime: "2026-04-09 11:00",
    riskNote: "套餐已购买，等待设备批量启用后自动生效。",
    timeline: [
      {
        time: "2026-04-09 11:00",
        title: "套餐已创建",
        description: "等待统一生效时间到达。",
        color: "blue",
      },
    ],
  },
  {
    id: "pkg-4",
    iccid: "898604D5192270879708",
    cardNo: "CARD-2024-0004",
    operator: "中国移动",
    packageName: "移动专业1GB x1月",
    packageType: "周期套餐",
    deviceName: "车载终端 C-11",
    customerName: "车联网项目组",
    lifecycleStage: "grace",
    effectiveDate: "2026-03-01",
    expireDate: "2026-04-05",
    remainingDays: -6,
    autoRenewStatus: "disabled",
    serviceStatus: "running",
    lastActionTime: "2026-04-07 09:40",
    riskNote: "已进入宽限期，需要续费或切换套餐。",
    timeline: [
      {
        time: "2026-03-01 09:00",
        title: "套餐生效",
        description: "按月套餐开始计费。",
        color: "green",
      },
      {
        time: "2026-04-06 00:05",
        title: "进入宽限期",
        description: "套餐到期后进入宽限处理窗口。",
        color: "orange",
      },
      {
        time: "2026-04-07 09:40",
        title: "客服跟进",
        description: "已提醒客户尽快续费。",
        color: "blue",
      },
    ],
  },
  {
    id: "pkg-5",
    iccid: "898604A4192280313048",
    cardNo: "CARD-2024-0005",
    operator: "中国联通",
    packageName: "联通视频监控 5GB",
    packageType: "定向套餐",
    deviceName: "监控终端 M-02",
    customerName: "安防事业部",
    lifecycleStage: "suspended",
    effectiveDate: "2026-02-01",
    expireDate: "2026-03-31",
    remainingDays: -11,
    autoRenewStatus: "disabled",
    serviceStatus: "suspended",
    lastActionTime: "2026-04-08 18:10",
    riskNote: "套餐过期且已停机，需先续费或切换资费。",
    timeline: [
      {
        time: "2026-02-01 08:00",
        title: "套餐生效",
        description: "监控套餐开始服务。",
        color: "green",
      },
      {
        time: "2026-04-01 00:10",
        title: "到期未续费",
        description: "系统开始限制服务能力。",
        color: "orange",
      },
      {
        time: "2026-04-08 18:10",
        title: "停机执行",
        description: "当前记录进入已停机阶段。",
        color: "red",
      },
    ],
  },
  {
    id: "pkg-6",
    iccid: "8986032400000001202",
    cardNo: "CARD-2024-0006",
    operator: "中国电信",
    packageName: "电信基础定位 100MB",
    packageType: "周期套餐",
    deviceName: "定位器 L-20",
    customerName: "资产定位组",
    lifecycleStage: "expired",
    effectiveDate: "2025-01-01",
    expireDate: "2026-03-15",
    remainingDays: -27,
    autoRenewStatus: "disabled",
    serviceStatus: "suspended",
    lastActionTime: "2026-04-01 10:00",
    riskNote: "生命周期已结束，建议归档或重新订购。",
    timeline: [
      {
        time: "2025-01-01 09:00",
        title: "套餐生效",
        description: "套餐开始使用。",
        color: "green",
      },
      {
        time: "2026-03-15 23:59",
        title: "套餐到期",
        description: "宽限期结束前未完成续费。",
        color: "orange",
      },
      {
        time: "2026-04-01 10:00",
        title: "生命周期归档",
        description: "记录进入已失效阶段。",
        color: "gray",
      },
    ],
  },
];

const operationMeta: Record<
  OperationType,
  { title: string; summary: string; actionText: string }
> = {
  renew: {
    title: "续费处理",
    summary: "用于延长当前套餐周期，避免进入宽限期或停机阶段。",
    actionText: "提交静态续费",
  },
  change: {
    title: "套餐变更",
    summary: "用于升级、降级或切换当前套餐方案。",
    actionText: "提交静态变更",
  },
  suspend: {
    title: "停机处理",
    summary: "用于执行停机保号或主动暂停服务。",
    actionText: "提交静态停机",
  },
  resume: {
    title: "复机处理",
    summary: "用于在完成续费或恢复条件后重新启用服务。",
    actionText: "提交静态复机",
  },
};

const PackageListPage: React.FC = () => {
  const { message } = App.useApp();
  const [keyword, setKeyword] = useState("");
  const [selectedStage, setSelectedStage] = useState<"all" | LifecycleStage>(
    "all"
  );
  const [selectedOperator, setSelectedOperator] = useState<"all" | string>(
    "all"
  );
  const [selectedPackageType, setSelectedPackageType] = useState<
    "all" | string
  >("all");
  const [selectedAutoRenew, setSelectedAutoRenew] = useState<
    "all" | AutoRenewStatus
  >("all");
  const [expireRange, setExpireRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [detailRecord, setDetailRecord] = useState<PackageLifecycleRecord>();
  const [operationState, setOperationState] = useState<{
    type: OperationType;
    record: PackageLifecycleRecord;
  }>();

  const operatorOptions = useMemo(
    () => [
      { label: "全部运营商", value: "all" },
      ...Array.from(new Set(lifecycleRecords.map((item) => item.operator))).map(
        (item) => ({
          label: item,
          value: item,
        })
      ),
    ],
    []
  );

  const packageTypeOptions = useMemo(
    () => [
      { label: "全部套餐类型", value: "all" },
      ...Array.from(
        new Set(lifecycleRecords.map((item) => item.packageType))
      ).map((item) => ({
        label: item,
        value: item,
      })),
    ],
    []
  );

  const overviewStats = useMemo(
    () =>
      stageOrder.map((stage) => ({
        stage,
        count: lifecycleRecords.filter((item) => item.lifecycleStage === stage)
          .length,
      })),
    []
  );

  const filteredRecords = useMemo(() => {
    return lifecycleRecords.filter((item) => {
      const matchesKeyword =
        !keyword ||
        [
          item.iccid,
          item.cardNo,
          item.deviceName,
          item.customerName,
          item.packageName,
        ]
          .join("|")
          .toLowerCase()
          .includes(keyword.trim().toLowerCase());

      const matchesStage =
        selectedStage === "all" || item.lifecycleStage === selectedStage;
      const matchesOperator =
        selectedOperator === "all" || item.operator === selectedOperator;
      const matchesPackageType =
        selectedPackageType === "all" ||
        item.packageType === selectedPackageType;
      const matchesAutoRenew =
        selectedAutoRenew === "all" ||
        item.autoRenewStatus === selectedAutoRenew;
      const matchesExpireRange =
        !expireRange ||
        (dayjs(item.expireDate).isAfter(expireRange[0].startOf("day")) &&
          dayjs(item.expireDate).isBefore(expireRange[1].endOf("day")));

      return (
        matchesKeyword &&
        matchesStage &&
        matchesOperator &&
        matchesPackageType &&
        matchesAutoRenew &&
        matchesExpireRange
      );
    });
  }, [
    expireRange,
    keyword,
    selectedAutoRenew,
    selectedOperator,
    selectedPackageType,
    selectedStage,
  ]);

  const riskSummary = useMemo(() => {
    const expiring = lifecycleRecords.filter(
      (item) => item.lifecycleStage === "expiring"
    ).length;
    const grace = lifecycleRecords.filter(
      (item) => item.lifecycleStage === "grace"
    ).length;
    const suspended = lifecycleRecords.filter(
      (item) => item.lifecycleStage === "suspended"
    ).length;

    return { expiring, grace, suspended };
  }, []);

  const resetFilters = () => {
    setKeyword("");
    setSelectedStage("all");
    setSelectedOperator("all");
    setSelectedPackageType("all");
    setSelectedAutoRenew("all");
    setExpireRange(null);
  };

  const openOperationModal = (
    type: OperationType,
    record: PackageLifecycleRecord
  ) => {
    setOperationState({ type, record });
  };

  const columns: ProColumns<PackageLifecycleRecord>[] = [
    {
      title: "ICCID",
      dataIndex: "iccid",
      width: 180,
      fixed: "left",
      render: (_, record) => (
        <a onClick={() => setDetailRecord(record)}>{record.iccid}</a>
      ),
    },
    { title: "卡号", dataIndex: "cardNo", width: 140 },
    { title: "运营商", dataIndex: "operator", width: 110 },
    { title: "套餐名称", dataIndex: "packageName", width: 220 },
    { title: "套餐类型", dataIndex: "packageType", width: 120 },
    { title: "关联设备", dataIndex: "deviceName", width: 150 },
    { title: "客户", dataIndex: "customerName", width: 140 },
    {
      title: "当前阶段",
      dataIndex: "lifecycleStage",
      width: 120,
      render: (_, record) => (
        <Tag color={stageMeta[record.lifecycleStage].tagColor}>
          {stageMeta[record.lifecycleStage].label}
        </Tag>
      ),
    },
    { title: "生效时间", dataIndex: "effectiveDate", width: 120 },
    { title: "到期时间", dataIndex: "expireDate", width: 120 },
    {
      title: "剩余天数",
      dataIndex: "remainingDays",
      width: 110,
      render: (_, record) => (
        <span
          className={record.remainingDays <= 10 ? styles.riskValue : undefined}
        >
          {record.remainingDays}
        </span>
      ),
    },
    {
      title: "自动续费",
      dataIndex: "autoRenewStatus",
      width: 110,
      render: (_, record) => (
        <Tag
          color={record.autoRenewStatus === "enabled" ? "success" : "default"}
        >
          {record.autoRenewStatus === "enabled" ? "已开启" : "未开启"}
        </Tag>
      ),
    },
    {
      title: "停复机状态",
      dataIndex: "serviceStatus",
      width: 120,
      render: (_, record) => (
        <Tag color={record.serviceStatus === "running" ? "blue" : "red"}>
          {record.serviceStatus === "running" ? "服务中" : "已停机"}
        </Tag>
      ),
    },
    { title: "最近处理时间", dataIndex: "lastActionTime", width: 160 },
    {
      title: "操作",
      dataIndex: "action",
      width: 220,
      fixed: "right",
      render: (_, record) => (
        <span className={styles.actionLinks}>
          <a onClick={() => openOperationModal("renew", record)}>续费</a>
          <a onClick={() => openOperationModal("change", record)}>套餐变更</a>
          <a onClick={() => openOperationModal("suspend", record)}>停机</a>
          <a onClick={() => openOperationModal("resume", record)}>复机</a>
          <a onClick={() => setDetailRecord(record)}>详情</a>
        </span>
      ),
    },
  ];

  return (
    <PageContainer
      className={styles.packageLifecyclePage}
      header={{
        title: "套餐列表",
        subTitle:
          "展示套餐实例、当前阶段和处理入口，支持续费、变更、停复机等操作。",
      }}
    >
      <div className={styles.overviewGrid}>
        {overviewStats.map(({ stage, count }) => {
          const active = selectedStage === stage;
          return (
            <button
              className={`${styles.stageCard} ${
                active ? styles.stageCardActive : ""
              }`}
              key={stage}
              onClick={() => setSelectedStage(active ? "all" : stage)}
              style={{ ["--accent-color" as string]: stageMeta[stage].color }}
              type="button"
            >
              <div className={styles.stageCardHead}>
                <span>{stageMeta[stage].label}</span>
                <strong>{count}</strong>
              </div>
              <div className={styles.stageCardHint}>
                {stageMeta[stage].hint}
              </div>
            </button>
          );
        })}
      </div>

      <div className={styles.riskCard}>
        <Alert
          banner
          message={`当前共有 ${riskSummary.expiring} 条即将到期、${riskSummary.grace} 条宽限期、${riskSummary.suspended} 条已停机记录，需要优先处理。`}
          type="warning"
        />
      </div>

      <div className={styles.filterCard}>
        <div className={styles.searchGrid}>
          <Input
            allowClear
            placeholder="搜索 ICCID / 卡号 / 设备 / 客户 / 套餐"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
          <Select
            options={[
              { label: "全部阶段", value: "all" },
              ...stageOrder.map((stage) => ({
                label: stageMeta[stage].label,
                value: stage,
              })),
            ]}
            value={selectedStage}
            onChange={setSelectedStage}
          />
          <Select
            options={operatorOptions}
            value={selectedOperator}
            onChange={setSelectedOperator}
          />
          <Select
            options={packageTypeOptions}
            value={selectedPackageType}
            onChange={setSelectedPackageType}
          />
          <Select
            options={[
              { label: "自动续费状态", value: "all" },
              { label: "已开启", value: "enabled" },
              { label: "未开启", value: "disabled" },
            ]}
            value={selectedAutoRenew}
            onChange={setSelectedAutoRenew}
          />
          <DatePicker.RangePicker
            value={expireRange}
            onChange={(value) =>
              setExpireRange(value?.[0] && value?.[1] ? [value[0], value[1]] : null)
            }
          />
          <Space>
            <Button
              type="primary"
              onClick={() => message.success("已按静态条件执行筛选")}
            >
              搜索
            </Button>
            <Button onClick={resetFilters}>重置</Button>
          </Space>
        </div>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableMeta}>
          <span>
            当前结果 <strong>{filteredRecords.length}</strong> 条
          </span>
          <span>列表页仅提供查询与处理入口，不承担完整办理流程。</span>
        </div>
        <ProTable<PackageLifecycleRecord>
          className={styles.tableWrap}
          cardBordered
          columns={columns}
          dataSource={filteredRecords}
          options={false}
          pagination={{
            pageSize: 10,
            showQuickJumper: true,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          rowKey="id"
          scroll={{ x: 2200 }}
          search={false}
          tableAlertRender={false}
          tableAlertOptionRender={false}
          toolbar={undefined}
        />
      </div>

      <Drawer
        destroyOnHidden
        onClose={() => setDetailRecord(undefined)}
        open={Boolean(detailRecord)}
        title={
          detailRecord ? `${detailRecord.iccid} 套餐详情` : "套餐详情"
        }
        width={720}
      >
        {detailRecord ? (
          <Space direction="vertical" size={16} style={{ display: "flex" }}>
            <Alert
              message={detailRecord.riskNote}
              type={
                detailRecord.lifecycleStage === "active" ||
                detailRecord.lifecycleStage === "pending"
                  ? "info"
                  : "warning"
              }
              showIcon
            />
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="ICCID">
                {detailRecord.iccid}
              </Descriptions.Item>
              <Descriptions.Item label="卡号">
                {detailRecord.cardNo}
              </Descriptions.Item>
              <Descriptions.Item label="套餐名称">
                {detailRecord.packageName}
              </Descriptions.Item>
              <Descriptions.Item label="套餐类型">
                {detailRecord.packageType}
              </Descriptions.Item>
              <Descriptions.Item label="当前阶段">
                <Tag color={stageMeta[detailRecord.lifecycleStage].tagColor}>
                  {stageMeta[detailRecord.lifecycleStage].label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="自动续费">
                {detailRecord.autoRenewStatus === "enabled"
                  ? "已开启"
                  : "未开启"}
              </Descriptions.Item>
              <Descriptions.Item label="生效时间">
                {detailRecord.effectiveDate}
              </Descriptions.Item>
              <Descriptions.Item label="到期时间">
                {detailRecord.expireDate}
              </Descriptions.Item>
              <Descriptions.Item label="剩余天数">
                {detailRecord.remainingDays}
              </Descriptions.Item>
              <Descriptions.Item label="停复机状态">
                {detailRecord.serviceStatus === "running" ? "服务中" : "已停机"}
              </Descriptions.Item>
              <Descriptions.Item label="关联设备">
                {detailRecord.deviceName}
              </Descriptions.Item>
              <Descriptions.Item label="客户">
                {detailRecord.customerName}
              </Descriptions.Item>
            </Descriptions>

            <div>
              <div className={styles.sectionTitle}>阶段时间线</div>
              <Timeline
                items={detailRecord.timeline.map((item) => ({
                  color: item.color,
                  children: (
                    <div className={styles.timelineItem}>
                      <div className={styles.timelineTime}>{item.time}</div>
                      <div className={styles.timelineTitle}>{item.title}</div>
                      <div className={styles.timelineDesc}>
                        {item.description}
                      </div>
                    </div>
                  ),
                }))}
              />
            </div>

            <div>
              <div className={styles.sectionTitle}>建议动作</div>
              <div className={styles.suggestionList}>
                <button
                  onClick={() => openOperationModal("renew", detailRecord)}
                  type="button"
                >
                  发起续费处理
                </button>
                <button
                  onClick={() => openOperationModal("change", detailRecord)}
                  type="button"
                >
                  发起套餐变更
                </button>
                <button
                  onClick={() => openOperationModal("suspend", detailRecord)}
                  type="button"
                >
                  发起停机处理
                </button>
                <button
                  onClick={() => openOperationModal("resume", detailRecord)}
                  type="button"
                >
                  发起复机处理
                </button>
              </div>
            </div>
          </Space>
        ) : null}
      </Drawer>

      <Modal
        destroyOnHidden
        okText={
          operationState
            ? operationMeta[operationState.type].actionText
            : "提交"
        }
        onCancel={() => setOperationState(undefined)}
        onOk={() => {
          if (operationState) {
            message.success(
              `${operationMeta[operationState.type].title}已触发静态提交：${
                operationState.record.iccid
              }`
            );
          }
          setOperationState(undefined);
        }}
        open={Boolean(operationState)}
        title={
          operationState ? operationMeta[operationState.type].title : "处理"
        }
      >
        {operationState ? (
          <Space direction="vertical" size={12} style={{ display: "flex" }}>
            <Alert
              message={operationMeta[operationState.type].summary}
              type="info"
              showIcon
            />
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="ICCID">
                {operationState.record.iccid}
              </Descriptions.Item>
              <Descriptions.Item label="套餐名称">
                {operationState.record.packageName}
              </Descriptions.Item>
              <Descriptions.Item label="当前阶段">
                {stageMeta[operationState.record.lifecycleStage].label}
              </Descriptions.Item>
              <Descriptions.Item label="处理建议">
                {operationState.record.riskNote}
              </Descriptions.Item>
            </Descriptions>
          </Space>
        ) : null}
      </Modal>
    </PageContainer>
  );
};

export default PackageListPage;
