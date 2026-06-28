import type { ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import { Alert, App, Button, Descriptions, Drawer, Input, Modal, Select, Space, Tabs, Tag } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import {
  type HitItem,
  type RuleItem,
  type WhiteListItem,
  createRisk,
  listRisk,
  removeRisk,
  updateRisk,
} from '@/services/platform/risk';
import styles from './index.less';

type RiskLevel = 'high' | 'medium' | 'low';
type RiskObjectType = 'card' | 'device' | 'customer';
type EntryStatus = 'enabled' | 'disabled';
type RuleAction = 'alert' | 'suspend' | 'review' | 'limit';

type WhiteListRecord = WhiteListItem;
type RuleRecord = RuleItem;
type HitRecord = HitItem;

type DetailState =
  | { type: 'whitelist'; record: WhiteListRecord }
  | { type: 'rule'; record: RuleRecord }
  | { type: 'hit'; record: HitRecord };

const riskLevelMeta: Record<RiskLevel, { label: string; color: string; hint: string }> = {
  high: { label: '高风险', color: 'error', hint: '建议立即人工介入处理' },
  medium: { label: '中风险', color: 'warning', hint: '建议在今日内完成排查' },
  low: { label: '低风险', color: 'processing', hint: '可纳入常规巡检' },
};
const objectTypeMeta: Record<RiskObjectType, string> = { card: '卡片', device: '设备', customer: '客户' };
const actionMeta: Record<RuleAction, string> = { alert: '告警提醒', suspend: '自动停机', review: '人工复核', limit: '限制服务' };

const objectTypeOptions = (Object.keys(objectTypeMeta) as RiskObjectType[]).map((k) => ({ label: objectTypeMeta[k], value: k }));
const statusOptions = [
  { label: '已启用', value: 'enabled' },
  { label: '已停用', value: 'disabled' },
];

const RiskControlManagementPage: React.FC = () => {
  const { message } = App.useApp();
  const [activeTab, setActiveTab] = useState('whitelist');
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<'all' | RiskLevel>('all');
  const [detailState, setDetailState] = useState<DetailState>();
  const [keyword, setKeyword] = useState('');
  const [objectType, setObjectType] = useState<'all' | RiskObjectType>('all');
  const [status, setStatus] = useState<'all' | EntryStatus>('all');
  const [actionModal, setActionModal] = useState<{ actionName: string; summary: string }>();

  const [whiteListRecords, setWhiteListRecords] = useState<WhiteListRecord[]>([]);
  const [ruleRecords, setRuleRecords] = useState<RuleRecord[]>([]);
  const [hitRecords, setHitRecords] = useState<HitRecord[]>([]);

  const [wlForm, setWlForm] = useState<{ open: boolean; editing?: WhiteListRecord }>({ open: false });
  const [ruleForm, setRuleForm] = useState<{ open: boolean; editing?: RuleRecord }>({ open: false });
  const [hitForm, setHitForm] = useState<{ open: boolean; editing?: HitRecord }>({ open: false });

  const refresh = async () => {
    try {
      const [wl, rl, ht] = await Promise.all([
        listRisk<WhiteListRecord>('whitelist'),
        listRisk<RuleRecord>('rules'),
        listRisk<HitRecord>('hits'),
      ]);
      setWhiteListRecords(wl.data ?? []);
      setRuleRecords(rl.data ?? []);
      setHitRecords(ht.data ?? []);
    } catch {
      /* ignore */
    }
  };
  useEffect(() => {
    refresh();
  }, []);

  const overviewStats = useMemo(() => {
    const count = (lvl: RiskLevel) => hitRecords.filter((h) => h.riskLevel === lvl).length;
    const pending = hitRecords.filter((h) => h.handlingStatus === '待处理').length;
    return [
      { key: 'high', value: count('high'), ...riskLevelMeta.high },
      { key: 'medium', value: count('medium'), ...riskLevelMeta.medium },
      { key: 'low', value: count('low'), ...riskLevelMeta.low },
      { key: 'today', label: '今日命中', value: hitRecords.length, color: 'cyan', hint: '今日规则累计命中次数' },
      { key: 'pending', label: '待处理', value: pending, color: 'magenta', hint: '仍需人工跟进的风险记录' },
    ];
  }, [hitRecords]);

  const filteredWhiteList = useMemo(
    () =>
      whiteListRecords.filter((item) => {
        const matchesKeyword =
          !keyword || [item.name, item.objectName, item.scope, item.remark].join('|').toLowerCase().includes(keyword.trim().toLowerCase());
        const matchesObjectType = objectType === 'all' || item.objectType === objectType;
        const matchesStatus = status === 'all' || item.status === status;
        return matchesKeyword && matchesObjectType && matchesStatus;
      }),
    [keyword, objectType, status, whiteListRecords],
  );

  const filteredRules = useMemo(
    () =>
      ruleRecords.filter((item) => {
        const matchesKeyword =
          !keyword || [item.ruleName, item.riskType, item.conditionSummary, item.remark].join('|').toLowerCase().includes(keyword.trim().toLowerCase());
        const matchesObjectType = objectType === 'all' || item.objectType === objectType;
        const matchesStatus = status === 'all' || item.status === status;
        return matchesKeyword && matchesObjectType && matchesStatus;
      }),
    [keyword, objectType, status, ruleRecords],
  );

  const filteredHits = useMemo(
    () =>
      hitRecords.filter((item) => {
        const matchesKeyword =
          !keyword || [item.objectName, item.matchedRule, item.suggestion, item.remark].join('|').toLowerCase().includes(keyword.trim().toLowerCase());
        const matchesObjectType = objectType === 'all' || item.objectType === objectType;
        const matchesRiskLevel = selectedRiskLevel === 'all' || item.riskLevel === selectedRiskLevel;
        return matchesKeyword && matchesObjectType && matchesRiskLevel;
      }),
    [keyword, objectType, selectedRiskLevel, hitRecords],
  );

  const toggleStatus = async (resource: 'whitelist' | 'rules', record: WhiteListRecord | RuleRecord) => {
    await updateRisk(resource, record.id, { status: record.status === 'enabled' ? 'disabled' : 'enabled' });
    message.success(record.status === 'enabled' ? '已停用' : '已启用');
    refresh();
  };
  const removeRecord = async (resource: 'whitelist' | 'rules', id: string) => {
    await removeRisk(resource, id);
    message.success('已删除');
    refresh();
  };
  const copyRule = async (record: RuleRecord) => {
    const { id: _omit, ...rest } = record;
    void _omit;
    await createRisk('rules', { ...rest, ruleName: `${record.ruleName}（副本）`, hitCount: 0 });
    message.success('已复制规则');
    refresh();
  };
  const markHit = async (record: HitRecord, handlingStatus: string) => {
    await updateRisk('hits', record.id, { handlingStatus });
    message.success(`已${handlingStatus}`);
    refresh();
  };
  const batchHandled = async () => {
    const pending = filteredHits.filter((h) => h.handlingStatus === '待处理');
    await Promise.all(pending.map((h) => updateRisk('hits', h.id, { handlingStatus: '已处理' })));
    message.success(`已批量标记 ${pending.length} 条为已处理`);
    setActionModal(undefined);
    refresh();
  };

  const whitelistColumns: ProColumns<WhiteListRecord>[] = [
    { title: '白名单名称', dataIndex: 'name', width: 180 },
    { title: '放行对象', dataIndex: 'objectName', width: 180 },
    { title: '对象类型', dataIndex: 'objectType', width: 100, render: (_, r) => objectTypeMeta[r.objectType] },
    { title: '放行范围', dataIndex: 'scope', width: 240 },
    { title: '有效期', dataIndex: 'validPeriod', width: 180 },
    { title: '状态', dataIndex: 'status', width: 100, render: (_, r) => <Tag color={r.status === 'enabled' ? 'success' : 'default'}>{r.status === 'enabled' ? '生效中' : '已停用'}</Tag> },
    { title: '创建人', dataIndex: 'creator', width: 100 },
    { title: '备注', dataIndex: 'remark', width: 180 },
    {
      title: '操作',
      dataIndex: 'action',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <span className={styles.actionLinks}>
          <a onClick={() => setDetailState({ type: 'whitelist', record })}>详情</a>
          <a onClick={() => toggleStatus('whitelist', record)}>{record.status === 'enabled' ? '停用' : '启用'}</a>
          <a onClick={() => setWlForm({ open: true, editing: record })}>编辑</a>
          <a onClick={() => removeRecord('whitelist', record.id)}>删除</a>
        </span>
      ),
    },
  ];

  const ruleColumns: ProColumns<RuleRecord>[] = [
    { title: '规则名称', dataIndex: 'ruleName', width: 180 },
    { title: '风险类型', dataIndex: 'riskType', width: 120 },
    { title: '适用对象', dataIndex: 'objectType', width: 100, render: (_, r) => objectTypeMeta[r.objectType] },
    { title: '触发条件摘要', dataIndex: 'conditionSummary', width: 260 },
    { title: '处置动作', dataIndex: 'action', width: 120, render: (_, r) => actionMeta[r.action] },
    { title: '状态', dataIndex: 'status', width: 100, render: (_, r) => <Tag color={r.status === 'enabled' ? 'success' : 'default'}>{r.status === 'enabled' ? '已启用' : '已停用'}</Tag> },
    { title: '最近命中时间', dataIndex: 'lastHitTime', width: 160 },
    { title: '命中次数', dataIndex: 'hitCount', width: 110, render: (_, r) => <a onClick={() => setActiveTab('hit-records')}>{r.hitCount}</a> },
    { title: '备注', dataIndex: 'remark', width: 180 },
    {
      title: '操作',
      dataIndex: 'actionArea',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <span className={styles.actionLinks}>
          <a onClick={() => setDetailState({ type: 'rule', record })}>详情</a>
          <a onClick={() => toggleStatus('rules', record)}>{record.status === 'enabled' ? '停用' : '启用'}</a>
          <a onClick={() => copyRule(record)}>复制</a>
          <a onClick={() => setRuleForm({ open: true, editing: record })}>编辑</a>
          <a onClick={() => removeRecord('rules', record.id)}>删除</a>
        </span>
      ),
    },
  ];

  const hitColumns: ProColumns<HitRecord>[] = [
    { title: '命中对象', dataIndex: 'objectName', width: 180 },
    { title: '对象类型', dataIndex: 'objectType', width: 100, render: (_, r) => objectTypeMeta[r.objectType] },
    { title: '命中规则', dataIndex: 'matchedRule', width: 180 },
    { title: '风险等级', dataIndex: 'riskLevel', width: 100, render: (_, r) => <Tag color={riskLevelMeta[r.riskLevel].color}>{riskLevelMeta[r.riskLevel].label}</Tag> },
    { title: '事件时间', dataIndex: 'eventTime', width: 160 },
    { title: '处理状态', dataIndex: 'handlingStatus', width: 120 },
    { title: '建议动作', dataIndex: 'suggestion', width: 240 },
    { title: '备注', dataIndex: 'remark', width: 180 },
    {
      title: '操作',
      dataIndex: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <span className={styles.actionLinks}>
          <a onClick={() => setDetailState({ type: 'hit', record })}>详情</a>
          <a onClick={() => markHit(record, '已处理')}>标记已处理</a>
          <a onClick={() => markHit(record, '人工复核中')}>人工复核</a>
        </span>
      ),
    },
  ];

  const detailTitle =
    detailState?.type === 'whitelist' ? '白名单详情' : detailState?.type === 'rule' ? '风控规则详情' : detailState?.type === 'hit' ? '命中记录详情' : '详情';

  return (
    <PageContainer
      className={styles.riskControlPage}
      header={{ title: '风控管理', subTitle: '白名单 / 风控规则 / 命中记录均来自后端 /api/risk，支持新增、启用停用、编辑删除与处理。' }}
    >
      <div className={styles.overviewGrid}>
        {overviewStats.map((item) => {
          const active = selectedRiskLevel === item.key;
          return (
            <button
              className={`${styles.overviewCard} ${active ? styles.overviewCardActive : ''}`}
              key={item.key}
              onClick={() => {
                if (item.key === 'high' || item.key === 'medium' || item.key === 'low') {
                  setSelectedRiskLevel(active ? 'all' : (item.key as RiskLevel));
                  setActiveTab('hit-records');
                }
              }}
              style={{ ['--accent-color' as string]: item.color }}
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
        <Alert banner message="当前重点风险：高频上下线与异常跨省迁移命中率上升，建议优先排查待处理记录。" type="warning" />
      </div>

      <div className={styles.filterCard}>
        <div className={styles.searchGrid}>
          <Input allowClear placeholder="搜索名称 / 对象 / 规则 / 备注" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          <Select
            options={[{ label: '全部对象类型', value: 'all' }, ...objectTypeOptions]}
            value={objectType}
            onChange={setObjectType}
          />
          <Select
            options={[{ label: '全部状态', value: 'all' }, { label: '已启用', value: 'enabled' }, { label: '已停用', value: 'disabled' }]}
            value={status}
            onChange={setStatus}
          />
          <Space>
            <Button type="primary" onClick={() => message.success('已按条件筛选')}>搜索</Button>
            <Button
              onClick={() => {
                setKeyword('');
                setObjectType('all');
                setStatus('all');
                setSelectedRiskLevel('all');
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
          onChange={setActiveTab}
          items={[
            {
              key: 'whitelist',
              label: '白名单管理',
              children: (
                <>
                  <div className={styles.toolbarRow}>
                    <div className={styles.toolbarMeta}>当前白名单 <strong>{filteredWhiteList.length}</strong> 条</div>
                    <Space>
                      <Button onClick={() => message.info('白名单导出任务已提交')}>导出</Button>
                      <Button type="primary" onClick={() => setWlForm({ open: true })}>新增白名单</Button>
                    </Space>
                  </div>
                  <ProTable<WhiteListRecord>
                    cardBordered
                    className={styles.tableWrap}
                    columns={whitelistColumns}
                    dataSource={filteredWhiteList}
                    options={false}
                    pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
                    rowKey="id"
                    scroll={{ x: 1700 }}
                    search={false}
                    tableAlertRender={false}
                  />
                </>
              ),
            },
            {
              key: 'rules',
              label: '风控规则',
              children: (
                <>
                  <div className={styles.toolbarRow}>
                    <div className={styles.toolbarMeta}>当前规则 <strong>{filteredRules.length}</strong> 条</div>
                    <Space>
                      <Button onClick={() => message.info('规则导出任务已提交')}>导出</Button>
                      <Button type="primary" onClick={() => setRuleForm({ open: true })}>新增规则</Button>
                    </Space>
                  </div>
                  <ProTable<RuleRecord>
                    cardBordered
                    className={styles.tableWrap}
                    columns={ruleColumns}
                    dataSource={filteredRules}
                    options={false}
                    pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
                    rowKey="id"
                    scroll={{ x: 1900 }}
                    search={false}
                    tableAlertRender={false}
                  />
                </>
              ),
            },
            {
              key: 'hit-records',
              label: '命中记录',
              children: (
                <>
                  <div className={styles.toolbarRow}>
                    <div className={styles.toolbarMeta}>
                      当前命中记录 <strong>{filteredHits.length}</strong> 条
                      {selectedRiskLevel !== 'all' ? `，已按${riskLevelMeta[selectedRiskLevel].label}筛选` : ''}
                    </div>
                    <Space>
                      <Button type="primary" onClick={() => setHitForm({ open: true })}>新增命中记录</Button>
                      <Button onClick={() => setActionModal({ actionName: '批量标记已处理', summary: '将当前列表中所有「待处理」命中记录统一标记为已处理。' })}>
                        批量已处理
                      </Button>
                      <Button onClick={() => message.info('命中记录导出任务已提交')}>导出</Button>
                    </Space>
                  </div>
                  <ProTable<HitRecord>
                    cardBordered
                    className={styles.tableWrap}
                    columns={hitColumns}
                    dataSource={filteredHits}
                    options={false}
                    pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
                    rowKey="id"
                    scroll={{ x: 1700 }}
                    search={false}
                    tableAlertRender={false}
                  />
                </>
              ),
            },
          ]}
        />
      </div>

      {/* 新增/编辑 白名单 */}
      <ModalForm<WhiteListRecord>
        key={`wl-${wlForm.editing?.id ?? 'new'}`}
        title={wlForm.editing ? '编辑白名单' : '新增白名单'}
        open={wlForm.open}
        onOpenChange={(o) => setWlForm((s) => ({ ...s, open: o }))}
        grid
        rowProps={{ gutter: 16 }}
        modalProps={{ destroyOnClose: true }}
        initialValues={wlForm.editing ?? { objectType: 'card', status: 'enabled', validPeriod: '长期有效', creator: '风控专员' }}
        onFinish={async (values) => {
          try {
            if (wlForm.editing) await updateRisk('whitelist', wlForm.editing.id, values);
            else await createRisk('whitelist', values);
            message.success(wlForm.editing ? '已保存' : '已新增白名单');
            setWlForm({ open: false });
            refresh();
            return true;
          } catch {
            message.error('提交失败');
            return false;
          }
        }}
      >
        <ProFormText name="name" label="白名单名称" colProps={{ span: 12 }} rules={[{ required: true }]} />
        <ProFormText name="objectName" label="放行对象" colProps={{ span: 12 }} rules={[{ required: true }]} />
        <ProFormSelect name="objectType" label="对象类型" colProps={{ span: 12 }} options={objectTypeOptions} />
        <ProFormSelect name="status" label="状态" colProps={{ span: 12 }} options={statusOptions} />
        <ProFormText name="scope" label="放行范围" colProps={{ span: 24 }} />
        <ProFormText name="validPeriod" label="有效期" colProps={{ span: 12 }} />
        <ProFormText name="creator" label="创建人" colProps={{ span: 12 }} />
        <ProFormTextArea name="remark" label="备注" colProps={{ span: 24 }} />
      </ModalForm>

      {/* 新增/编辑 规则 */}
      <ModalForm<RuleRecord>
        key={`rule-${ruleForm.editing?.id ?? 'new'}`}
        title={ruleForm.editing ? '编辑风控规则' : '新增风控规则'}
        open={ruleForm.open}
        onOpenChange={(o) => setRuleForm((s) => ({ ...s, open: o }))}
        grid
        rowProps={{ gutter: 16 }}
        modalProps={{ destroyOnClose: true }}
        initialValues={ruleForm.editing ?? { objectType: 'card', action: 'alert', status: 'enabled', hitCount: 0, lastHitTime: '--' }}
        onFinish={async (values) => {
          try {
            if (ruleForm.editing) await updateRisk('rules', ruleForm.editing.id, values);
            else await createRisk('rules', values);
            message.success(ruleForm.editing ? '已保存' : '已新增规则');
            setRuleForm({ open: false });
            refresh();
            return true;
          } catch {
            message.error('提交失败');
            return false;
          }
        }}
      >
        <ProFormText name="ruleName" label="规则名称" colProps={{ span: 12 }} rules={[{ required: true }]} />
        <ProFormText name="riskType" label="风险类型" colProps={{ span: 12 }} />
        <ProFormSelect name="objectType" label="适用对象" colProps={{ span: 12 }} options={objectTypeOptions} />
        <ProFormSelect name="action" label="处置动作" colProps={{ span: 12 }} options={(Object.keys(actionMeta) as RuleAction[]).map((k) => ({ label: actionMeta[k], value: k }))} />
        <ProFormSelect name="status" label="状态" colProps={{ span: 12 }} options={statusOptions} />
        <ProFormDigit name="hitCount" label="命中次数" colProps={{ span: 12 }} min={0} />
        <ProFormTextArea name="conditionSummary" label="触发条件摘要" colProps={{ span: 24 }} rules={[{ required: true }]} />
        <ProFormTextArea name="remark" label="备注" colProps={{ span: 24 }} />
      </ModalForm>

      {/* 新增/编辑 命中记录 */}
      <ModalForm<HitRecord>
        key={`hit-${hitForm.editing?.id ?? 'new'}`}
        title={hitForm.editing ? '编辑命中记录' : '新增命中记录'}
        open={hitForm.open}
        onOpenChange={(o) => setHitForm((s) => ({ ...s, open: o }))}
        grid
        rowProps={{ gutter: 16 }}
        modalProps={{ destroyOnClose: true }}
        initialValues={hitForm.editing ?? { objectType: 'card', riskLevel: 'medium', handlingStatus: '待处理' }}
        onFinish={async (values) => {
          try {
            if (hitForm.editing) await updateRisk('hits', hitForm.editing.id, values);
            else await createRisk('hits', values);
            message.success(hitForm.editing ? '已保存' : '已新增命中记录');
            setHitForm({ open: false });
            refresh();
            return true;
          } catch {
            message.error('提交失败');
            return false;
          }
        }}
      >
        <ProFormText name="objectName" label="命中对象" colProps={{ span: 12 }} rules={[{ required: true }]} />
        <ProFormSelect name="objectType" label="对象类型" colProps={{ span: 12 }} options={objectTypeOptions} />
        <ProFormText name="matchedRule" label="命中规则" colProps={{ span: 12 }} />
        <ProFormSelect name="riskLevel" label="风险等级" colProps={{ span: 12 }} options={(Object.keys(riskLevelMeta) as RiskLevel[]).map((k) => ({ label: riskLevelMeta[k].label, value: k }))} />
        <ProFormText name="eventTime" label="事件时间" placeholder="YYYY-MM-DD HH:mm" colProps={{ span: 12 }} />
        <ProFormSelect name="handlingStatus" label="处理状态" colProps={{ span: 12 }} options={['待处理', '人工复核中', '已处理', '已忽略'].map((s) => ({ label: s, value: s }))} />
        <ProFormTextArea name="suggestion" label="建议动作" colProps={{ span: 24 }} />
        <ProFormTextArea name="remark" label="备注" colProps={{ span: 24 }} />
      </ModalForm>

      <Drawer destroyOnHidden onClose={() => setDetailState(undefined)} open={Boolean(detailState)} title={detailTitle} width={720}>
        {detailState?.type === 'whitelist' ? (
          <Space direction="vertical" size={16} style={{ display: 'flex' }}>
            <Alert message={detailState.record.remark} showIcon type="info" />
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="白名单名称">{detailState.record.name}</Descriptions.Item>
              <Descriptions.Item label="放行对象">{detailState.record.objectName}</Descriptions.Item>
              <Descriptions.Item label="对象类型">{objectTypeMeta[detailState.record.objectType]}</Descriptions.Item>
              <Descriptions.Item label="放行范围">{detailState.record.scope}</Descriptions.Item>
              <Descriptions.Item label="有效期">{detailState.record.validPeriod}</Descriptions.Item>
              <Descriptions.Item label="状态">{detailState.record.status === 'enabled' ? '生效中' : '已停用'}</Descriptions.Item>
              <Descriptions.Item label="创建人">{detailState.record.creator}</Descriptions.Item>
              <Descriptions.Item label="备注">{detailState.record.remark}</Descriptions.Item>
            </Descriptions>
          </Space>
        ) : null}
        {detailState?.type === 'rule' ? (
          <Space direction="vertical" size={16} style={{ display: 'flex' }}>
            <Alert message={detailState.record.remark} showIcon type="warning" />
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="规则名称">{detailState.record.ruleName}</Descriptions.Item>
              <Descriptions.Item label="风险类型">{detailState.record.riskType}</Descriptions.Item>
              <Descriptions.Item label="适用对象">{objectTypeMeta[detailState.record.objectType]}</Descriptions.Item>
              <Descriptions.Item label="处置动作">{actionMeta[detailState.record.action]}</Descriptions.Item>
              <Descriptions.Item label="状态">{detailState.record.status === 'enabled' ? '已启用' : '已停用'}</Descriptions.Item>
              <Descriptions.Item label="最近命中时间">{detailState.record.lastHitTime}</Descriptions.Item>
              <Descriptions.Item label="命中次数">{detailState.record.hitCount}</Descriptions.Item>
              <Descriptions.Item label="条件摘要">{detailState.record.conditionSummary}</Descriptions.Item>
            </Descriptions>
          </Space>
        ) : null}
        {detailState?.type === 'hit' ? (
          <Space direction="vertical" size={16} style={{ display: 'flex' }}>
            <Alert message={detailState.record.suggestion} showIcon type="error" />
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="命中对象">{detailState.record.objectName}</Descriptions.Item>
              <Descriptions.Item label="对象类型">{objectTypeMeta[detailState.record.objectType]}</Descriptions.Item>
              <Descriptions.Item label="命中规则">{detailState.record.matchedRule}</Descriptions.Item>
              <Descriptions.Item label="风险等级">{riskLevelMeta[detailState.record.riskLevel].label}</Descriptions.Item>
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
        okText="确认批量处理"
        onCancel={() => setActionModal(undefined)}
        onOk={batchHandled}
        open={Boolean(actionModal)}
        title={actionModal?.actionName}
      >
        <Alert message={actionModal?.summary} showIcon type="info" />
      </Modal>
    </PageContainer>
  );
};

export default RiskControlManagementPage;
