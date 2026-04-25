import type { ProColumns } from "@ant-design/pro-components";
import { PageContainer, ProTable } from "@ant-design/pro-components";
import {
  Alert,
  App,
  Button,
  Descriptions,
  Drawer,
  Input,
  Modal,
  Select,
  Space,
  Tabs,
  Tag,
} from "antd";
import React, { useMemo, useState } from "react";
import styles from "./index.less";

type RiskLevel = "high" | "medium" | "low";
type RiskObjectType = "card" | "device" | "customer";
type EntryStatus = "enabled" | "disabled";
type RuleAction = "alert" | "suspend" | "review" | "limit";

type WhiteListRecord = {
  id: string;
  name: string;
  objectName: string;
  objectType: RiskObjectType;
  scope: string;
  validPeriod: string;
  status: EntryStatus;
  creator: string;
  remark: string;
};

type RuleRecord = {
  id: string;
  ruleName: string;
  riskType: string;
  objectType: RiskObjectType;
  conditionSummary: string;
  action: RuleAction;
  status: EntryStatus;
  lastHitTime: string;
  hitCount: number;
  remark: string;
};

type HitRecord = {
  id: string;
  objectName: string;
  objectType: RiskObjectType;
  matchedRule: string;
  riskLevel: RiskLevel;
  eventTime: string;
  handlingStatus: string;
  suggestion: string;
  remark: string;
};

type DetailState =
  | { type: "whitelist"; record: WhiteListRecord }
  | { type: "rule"; record: RuleRecord }
  | { type: "hit"; record: HitRecord };

const riskLevelMeta: Record<RiskLevel, { label: string; color: string; hint: string }> = {
  high: { label: "高风险", color: "error", hint: "建议立即人工介入处理" },
  medium: { label: "中风险", color: "warning", hint: "建议在今日内完成排查" },
  low: { label: "低风险", color: "processing", hint: "可纳入常规巡检" },
};

const objectTypeMeta: Record<RiskObjectType, string> = {
  card: "卡片",
  device: "设备",
  customer: "客户",
};

const actionMeta: Record<RuleAction, string> = {
  alert: "告警提醒",
  suspend: "自动停机",
  review: "人工复核",
  limit: "限制服务",
};

const whiteListRecords: WhiteListRecord[] = [
  {
    id: "wl-1",
    name: "重点客户测试卡放行",
    objectName: "898604A4192191902141",
    objectType: "card",
    scope: "忽略高频上下线与异常流量预警",
    validPeriod: "2026-04-01 至 2026-06-30",
    status: "enabled",
    creator: "运营主管",
    remark: "客户联调期内放行",
  },
  {
    id: "wl-2",
    name: "巡检设备白名单",
    objectName: "巡检终端 A-17",
    objectType: "device",
    scope: "忽略夜间位置漂移风险",
    validPeriod: "长期有效",
    status: "enabled",
    creator: "风控专员",
    remark: "设备在跨区域测试场景中使用",
  },
  {
    id: "wl-3",
    name: "战略客户临时放行",
    objectName: "顺运冷链",
    objectType: "customer",
    scope: "忽略批量换卡 7 日内触发规则",
    validPeriod: "2026-04-01 至 2026-04-20",
    status: "disabled",
    creator: "客户经理",
    remark: "项目切换已完成，待确认是否恢复",
  },
];

const ruleRecords: RuleRecord[] = [
  {
    id: "rule-1",
    ruleName: "单卡短时高频上下线",
    riskType: "连接异常",
    objectType: "card",
    conditionSummary: "30分钟内离在线切换超过10次",
    action: "alert",
    status: "enabled",
    lastHitTime: "2026-04-11 09:20",
    hitCount: 38,
    remark: "用于发现疑似信号异常或设备抖动",
  },
  {
    id: "rule-2",
    ruleName: "设备跨省异常迁移",
    riskType: "位置异常",
    objectType: "device",
    conditionSummary: "24小时内跨省上线且设备未报备",
    action: "review",
    status: "enabled",
    lastHitTime: "2026-04-11 10:05",
    hitCount: 12,
    remark: "用于识别非计划迁移或被盗风险",
  },
  {
    id: "rule-3",
    ruleName: "客户批量停机风险",
    riskType: "经营风险",
    objectType: "customer",
    conditionSummary: "同一客户24小时内停机卡数超过20张",
    action: "suspend",
    status: "disabled",
    lastHitTime: "2026-04-10 18:30",
    hitCount: 4,
    remark: "当前暂停，等待策略复核",
  },
];

const hitRecords: HitRecord[] = [
  {
    id: "hit-1",
    objectName: "898604A4192280313048",
    objectType: "card",
    matchedRule: "单卡短时高频上下线",
    riskLevel: "high",
    eventTime: "2026-04-11 09:20",
    handlingStatus: "待处理",
    suggestion: "建议立即排查设备供电与信号环境",
    remark: "已连续 3 次重复命中",
  },
  {
    id: "hit-2",
    objectName: "水表采集器 N-08",
    objectType: "device",
    matchedRule: "设备跨省异常迁移",
    riskLevel: "medium",
    eventTime: "2026-04-11 10:05",
    handlingStatus: "人工复核中",
    suggestion: "建议联系项目负责人确认是否跨区施工",
    remark: "轨迹变化发生在凌晨 2 点",
  },
  {
    id: "hit-3",
    objectName: "顺运冷链",
    objectType: "customer",
    matchedRule: "客户批量停机风险",
    riskLevel: "low",
    eventTime: "2026-04-10 18:30",
    handlingStatus: "已忽略",
    suggestion: "建议核对白名单是否仍在有效期内",
    remark: "历史项目切换导致批量停机",
  },
];

const staticMessage = (actionName: string) =>
  `${actionName} 为静态演示入口，当前未接入真实接口`;

const RiskControlManagementPage: React.FC = () => {
  const { message } = App.useApp();
  const [activeTab, setActiveTab] = useState("whitelist");
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<"all" | RiskLevel>("all");
  const [detailState, setDetailState] = useState<DetailState>();
  const [keyword, setKeyword] = useState("");
  const [objectType, setObjectType] = useState<"all" | RiskObjectType>("all");
  const [status, setStatus] = useState<"all" | EntryStatus>("all");
  const [actionModal, setActionModal] = useState<{ actionName: string; summary: string }>();

  const overviewStats = useMemo(
    () => [
      { key: "high", value: 6, ...riskLevelMeta.high },
      { key: "medium", value: 14, ...riskLevelMeta.medium },
      { key: "low", value: 27, ...riskLevelMeta.low },
      { key: "today", label: "今日命中", value: 18, color: "cyan", hint: "今日规则累计命中次数" },
      { key: "pending", label: "待处理", value: 9, color: "magenta", hint: "仍需人工跟进的风险记录" },
    ],
    [],
  );

  const filteredWhiteList = useMemo(
    () =>
      whiteListRecords.filter((item) => {
        const matchesKeyword =
          !keyword ||
          [item.name, item.objectName, item.scope, item.remark]
            .join("|")
            .toLowerCase()
            .includes(keyword.trim().toLowerCase());
        const matchesObjectType = objectType === "all" || item.objectType === objectType;
        const matchesStatus = status === "all" || item.status === status;
        return matchesKeyword && matchesObjectType && matchesStatus;
      }),
    [keyword, objectType, status],
  );

  const filteredRules = useMemo(
    () =>
      ruleRecords.filter((item) => {
        const matchesKeyword =
          !keyword ||
          [item.ruleName, item.riskType, item.conditionSummary, item.remark]
            .join("|")
            .toLowerCase()
            .includes(keyword.trim().toLowerCase());
        const matchesObjectType = objectType === "all" || item.objectType === objectType;
        const matchesStatus = status === "all" || item.status === status;
        return matchesKeyword && matchesObjectType && matchesStatus;
      }),
    [keyword, objectType, status],
  );

  const filteredHits = useMemo(
    () =>
      hitRecords.filter((item) => {
        const matchesKeyword =
          !keyword ||
          [item.objectName, item.matchedRule, item.suggestion, item.remark]
            .join("|")
            .toLowerCase()
            .includes(keyword.trim().toLowerCase());
        const matchesObjectType = objectType === "all" || item.objectType === objectType;
        const matchesRiskLevel = selectedRiskLevel === "all" || item.riskLevel === selectedRiskLevel;
        return matchesKeyword && matchesObjectType && matchesRiskLevel;
      }),
    [keyword, objectType, selectedRiskLevel],
  );

  const whitelistColumns: ProColumns<WhiteListRecord>[] = [
    { title: "白名单名称", dataIndex: "name", width: 180 },
    { title: "放行对象", dataIndex: "objectName", width: 180 },
    {
      title: "对象类型",
      dataIndex: "objectType",
      width: 100,
      render: (_, record) => objectTypeMeta[record.objectType],
    },
    { title: "放行范围", dataIndex: "scope", width: 240 },
    { title: "有效期", dataIndex: "validPeriod", width: 180 },
    {
      title: "状态",
      dataIndex: "status",
      width: 100,
      render: (_, record) => (
        <Tag color={record.status === "enabled" ? "success" : "default"}>
          {record.status === "enabled" ? "生效中" : "已停用"}
        </Tag>
      ),
    },
    { title: "创建人", dataIndex: "creator", width: 100 },
    { title: "备注", dataIndex: "remark", width: 180 },
    {
      title: "操作",
      dataIndex: "action",
      width: 170,
      fixed: "right",
      render: (_, record) => (
        <span className={styles.actionLinks}>
          <a onClick={() => setDetailState({ type: "whitelist", record })}>详情</a>
          <a onClick={() => message.info(staticMessage(record.status === "enabled" ? "停用白名单" : "启用白名单"))}>
            {record.status === "enabled" ? "停用" : "启用"}
          </a>
          <a onClick={() => message.info(staticMessage("编辑白名单"))}>编辑</a>
          <a onClick={() => message.info(staticMessage("删除白名单"))}>删除</a>
        </span>
      ),
    },
  ];

  const ruleColumns: ProColumns<RuleRecord>[] = [
    { title: "规则名称", dataIndex: "ruleName", width: 180 },
    { title: "风险类型", dataIndex: "riskType", width: 120 },
    {
      title: "适用对象",
      dataIndex: "objectType",
      width: 100,
      render: (_, record) => objectTypeMeta[record.objectType],
    },
    { title: "触发条件摘要", dataIndex: "conditionSummary", width: 260 },
    {
      title: "处置动作",
      dataIndex: "action",
      width: 120,
      render: (_, record) => actionMeta[record.action],
    },
    {
      title: "状态",
      dataIndex: "status",
      width: 100,
      render: (_, record) => (
        <Tag color={record.status === "enabled" ? "success" : "default"}>
          {record.status === "enabled" ? "已启用" : "已停用"}
        </Tag>
      ),
    },
    { title: "最近命中时间", dataIndex: "lastHitTime", width: 160 },
    {
      title: "命中次数",
      dataIndex: "hitCount",
      width: 110,
      render: (_, record) => <a onClick={() => setActiveTab("hit-records")}>{record.hitCount}</a>,
    },
    { title: "备注", dataIndex: "remark", width: 180 },
    {
      title: "操作",
      dataIndex: "actionArea",
      width: 180,
      fixed: "right",
      render: (_, record) => (
        <span className={styles.actionLinks}>
          <a onClick={() => setDetailState({ type: "rule", record })}>详情</a>
          <a onClick={() => message.info(staticMessage(record.status === "enabled" ? "停用规则" : "启用规则"))}>
            {record.status === "enabled" ? "停用" : "启用"}
          </a>
          <a onClick={() => message.info(staticMessage("复制规则"))}>复制</a>
          <a onClick={() => message.info(staticMessage("编辑规则"))}>编辑</a>
        </span>
      ),
    },
  ];

  const hitColumns: ProColumns<HitRecord>[] = [
    { title: "命中对象", dataIndex: "objectName", width: 180 },
    {
      title: "对象类型",
      dataIndex: "objectType",
      width: 100,
      render: (_, record) => objectTypeMeta[record.objectType],
    },
    { title: "命中规则", dataIndex: "matchedRule", width: 180 },
    {
      title: "风险等级",
      dataIndex: "riskLevel",
      width: 100,
      render: (_, record) => <Tag color={riskLevelMeta[record.riskLevel].color}>{riskLevelMeta[record.riskLevel].label}</Tag>,
    },
    { title: "事件时间", dataIndex: "eventTime", width: 160 },
    { title: "处理状态", dataIndex: "handlingStatus", width: 120 },
    { title: "建议动作", dataIndex: "suggestion", width: 240 },
    { title: "备注", dataIndex: "remark", width: 180 },
    {
      title: "操作",
      dataIndex: "action",
      width: 180,
      fixed: "right",
      render: (_, record) => (
        <span className={styles.actionLinks}>
          <a onClick={() => setDetailState({ type: "hit", record })}>详情</a>
          <a onClick={() => message.info(staticMessage("标记已处理"))}>标记已处理</a>
          <a onClick={() => message.info(staticMessage("发起人工复核"))}>人工复核</a>
        </span>
      ),
    },
  ];

  const detailTitle =
    detailState?.type === "whitelist"
      ? "白名单详情"
      : detailState?.type === "rule"
        ? "风控规则详情"
        : detailState?.type === "hit"
          ? "命中记录详情"
          : "详情";

  return (
    <PageContainer
      className={styles.riskControlPage}
      header={{
        title: "风控管理",
        subTitle: "统一查看风险态势，并管理白名单、风控规则和命中记录。",
      }}
    >
      <div className={styles.overviewGrid}>
        {overviewStats.map((item) => {
          const active = selectedRiskLevel === item.key;
          return (
            <button
              className={`${styles.overviewCard} ${active ? styles.overviewCardActive : ""}`}
              key={item.key}
              onClick={() => {
                if (item.key === "high" || item.key === "medium" || item.key === "low") {
                  setSelectedRiskLevel(active ? "all" : item.key);
                  setActiveTab("hit-records");
                } else {
                  message.info(staticMessage(item.label));
                }
              }}
              style={{ ["--accent-color" as string]: item.color }}
              type="button"
            >
              <div className={styles.overviewHead}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
              <div className={styles.overviewHint}>{item.hint}</div>
            </button>
          );
        })}
      </div>

      <div className={styles.alertCard}>
        <Alert
          banner
          message="当前重点风险：高频上下线与异常跨省迁移命中率上升，建议优先排查 9 条待处理记录。"
          type="warning"
        />
      </div>

      <div className={styles.filterCard}>
        <div className={styles.searchGrid}>
          <Input
            allowClear
            placeholder="搜索名称 / 对象 / 规则 / 备注"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
          <Select
            options={[
              { label: "全部对象类型", value: "all" },
              { label: "卡片", value: "card" },
              { label: "设备", value: "device" },
              { label: "客户", value: "customer" },
            ]}
            value={objectType}
            onChange={setObjectType}
          />
          <Select
            options={[
              { label: "全部状态", value: "all" },
              { label: "已启用", value: "enabled" },
              { label: "已停用", value: "disabled" },
            ]}
            value={status}
            onChange={setStatus}
          />
          <Space>
            <Button type="primary" onClick={() => message.success("已按静态条件执行筛选")}>
              搜索
            </Button>
            <Button
              onClick={() => {
                setKeyword("");
                setObjectType("all");
                setStatus("all");
                setSelectedRiskLevel("all");
              }}
            >
              重置
            </Button>
          </Space>
        </div>
      </div>

      <div className={styles.panelCard}>
        <Tabs
          activeKey={activeTab}
          className={styles.pageTabs}
          items={[
            {
              key: "whitelist",
              label: "白名单管理",
              children: (
                <>
                  <div className={styles.toolbarRow}>
                    <div className={styles.toolbarMeta}>
                      当前白名单 <strong>{filteredWhiteList.length}</strong> 条
                    </div>
                    <Space>
                      <Button onClick={() => message.info(staticMessage("导出白名单"))}>导出</Button>
                      <Button type="primary" onClick={() => message.info(staticMessage("新增白名单"))}>
                        新增白名单
                      </Button>
                    </Space>
                  </div>
                  <ProTable<WhiteListRecord>
                    cardBordered
                    className={styles.tableWrap}
                    columns={whitelistColumns}
                    dataSource={filteredWhiteList}
                    options={false}
                    pagination={{
                      pageSize: 10,
                      showQuickJumper: true,
                      showSizeChanger: true,
                      showTotal: (total) => `共 ${total} 条`,
                    }}
                    rowKey="id"
                    scroll={{ x: 1700 }}
                    search={false}
                    tableAlertRender={false}
                    tableAlertOptionRender={false}
                    toolbar={undefined}
                  />
                </>
              ),
            },
            {
              key: "rules",
              label: "风控规则",
              children: (
                <>
                  <div className={styles.toolbarRow}>
                    <div className={styles.toolbarMeta}>
                      当前规则 <strong>{filteredRules.length}</strong> 条
                    </div>
                    <Space>
                      <Button onClick={() => message.info(staticMessage("导出规则"))}>导出</Button>
                      <Button type="primary" onClick={() => message.info(staticMessage("新增规则"))}>
                        新增规则
                      </Button>
                    </Space>
                  </div>
                  <ProTable<RuleRecord>
                    cardBordered
                    className={styles.tableWrap}
                    columns={ruleColumns}
                    dataSource={filteredRules}
                    options={false}
                    pagination={{
                      pageSize: 10,
                      showQuickJumper: true,
                      showSizeChanger: true,
                      showTotal: (total) => `共 ${total} 条`,
                    }}
                    rowKey="id"
                    scroll={{ x: 1800 }}
                    search={false}
                    tableAlertRender={false}
                    tableAlertOptionRender={false}
                    toolbar={undefined}
                  />
                </>
              ),
            },
            {
              key: "hit-records",
              label: "命中记录",
              children: (
                <>
                  <div className={styles.toolbarRow}>
                    <div className={styles.toolbarMeta}>
                      当前命中记录 <strong>{filteredHits.length}</strong> 条
                      {selectedRiskLevel !== "all" ? `，已按${riskLevelMeta[selectedRiskLevel].label}筛选` : ""}
                    </div>
                    <Space>
                      <Button onClick={() => setActionModal({ actionName: "批量标记已处理", summary: "用于统一关闭已完成核查的风险记录。" })}>
                        批量已处理
                      </Button>
                      <Button onClick={() => message.info(staticMessage("导出命中记录"))}>导出</Button>
                    </Space>
                  </div>
                  <ProTable<HitRecord>
                    cardBordered
                    className={styles.tableWrap}
                    columns={hitColumns}
                    dataSource={filteredHits}
                    options={false}
                    pagination={{
                      pageSize: 10,
                      showQuickJumper: true,
                      showSizeChanger: true,
                      showTotal: (total) => `共 ${total} 条`,
                    }}
                    rowKey="id"
                    scroll={{ x: 1700 }}
                    search={false}
                    tableAlertRender={false}
                    tableAlertOptionRender={false}
                    toolbar={undefined}
                  />
                </>
              ),
            },
          ]}
          onChange={setActiveTab}
        />
      </div>

      <Drawer
        destroyOnHidden
        onClose={() => setDetailState(undefined)}
        open={Boolean(detailState)}
        title={detailTitle}
        width={720}
      >
        {detailState?.type === "whitelist" ? (
          <Space direction="vertical" size={16} style={{ display: "flex" }}>
            <Alert message={detailState.record.remark} showIcon type="info" />
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="白名单名称">{detailState.record.name}</Descriptions.Item>
              <Descriptions.Item label="放行对象">{detailState.record.objectName}</Descriptions.Item>
              <Descriptions.Item label="对象类型">
                {objectTypeMeta[detailState.record.objectType]}
              </Descriptions.Item>
              <Descriptions.Item label="放行范围">{detailState.record.scope}</Descriptions.Item>
              <Descriptions.Item label="有效期">{detailState.record.validPeriod}</Descriptions.Item>
              <Descriptions.Item label="状态">
                {detailState.record.status === "enabled" ? "生效中" : "已停用"}
              </Descriptions.Item>
              <Descriptions.Item label="创建人">{detailState.record.creator}</Descriptions.Item>
              <Descriptions.Item label="备注">{detailState.record.remark}</Descriptions.Item>
            </Descriptions>
          </Space>
        ) : null}

        {detailState?.type === "rule" ? (
          <Space direction="vertical" size={16} style={{ display: "flex" }}>
            <Alert message={detailState.record.remark} showIcon type="warning" />
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="规则名称">{detailState.record.ruleName}</Descriptions.Item>
              <Descriptions.Item label="风险类型">{detailState.record.riskType}</Descriptions.Item>
              <Descriptions.Item label="适用对象">
                {objectTypeMeta[detailState.record.objectType]}
              </Descriptions.Item>
              <Descriptions.Item label="处置动作">{actionMeta[detailState.record.action]}</Descriptions.Item>
              <Descriptions.Item label="状态">
                {detailState.record.status === "enabled" ? "已启用" : "已停用"}
              </Descriptions.Item>
              <Descriptions.Item label="最近命中时间">{detailState.record.lastHitTime}</Descriptions.Item>
              <Descriptions.Item label="命中次数">{detailState.record.hitCount}</Descriptions.Item>
              <Descriptions.Item label="条件摘要">{detailState.record.conditionSummary}</Descriptions.Item>
            </Descriptions>
          </Space>
        ) : null}

        {detailState?.type === "hit" ? (
          <Space direction="vertical" size={16} style={{ display: "flex" }}>
            <Alert message={detailState.record.suggestion} showIcon type="error" />
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="命中对象">{detailState.record.objectName}</Descriptions.Item>
              <Descriptions.Item label="对象类型">
                {objectTypeMeta[detailState.record.objectType]}
              </Descriptions.Item>
              <Descriptions.Item label="命中规则">{detailState.record.matchedRule}</Descriptions.Item>
              <Descriptions.Item label="风险等级">
                {riskLevelMeta[detailState.record.riskLevel].label}
              </Descriptions.Item>
              <Descriptions.Item label="事件时间">{detailState.record.eventTime}</Descriptions.Item>
              <Descriptions.Item label="处理状态">{detailState.record.handlingStatus}</Descriptions.Item>
              <Descriptions.Item label="建议动作">{detailState.record.suggestion}</Descriptions.Item>
              <Descriptions.Item label="备注">{detailState.record.remark}</Descriptions.Item>
            </Descriptions>
          </Space>
        ) : null}
      </Drawer>

      <Modal
        destroyOnHidden
        okText="我知道了"
        onCancel={() => setActionModal(undefined)}
        onOk={() => {
          if (actionModal) {
            message.info(staticMessage(actionModal.actionName));
          }
          setActionModal(undefined);
        }}
        open={Boolean(actionModal)}
        title={actionModal?.actionName}
      >
        <Alert message={actionModal?.summary} showIcon type="info" />
      </Modal>
    </PageContainer>
  );
};

export default RiskControlManagementPage;
