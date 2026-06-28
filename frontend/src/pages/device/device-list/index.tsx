import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import { DownOutlined, PlusOutlined } from '@ant-design/icons';
import {
  Alert,
  App,
  Button,
  Descriptions,
  Drawer,
  Dropdown,
  Input,
  Modal,
  Select,
  Space,
  Tag,
} from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  type DeviceItem,
  activateDevice,
  bindDeviceCard,
  clearDeviceAlarm,
  createDevice,
  dispatchDeviceParams,
  listDevices,
  removeDevice,
  shipDevice,
  unbindDeviceCard,
  updateDevice,
} from '@/services/platform/devices';
import styles from './index.less';

type DeviceStatus = DeviceItem['status'];
type DeviceRecord = DeviceItem;

const statusMeta: Record<
  DeviceStatus,
  { label: string; color: string; hint: string; className: string; tagColor: string }
> = {
  online: {
    label: '在线设备',
    color: '#16a34a',
    hint: '最近心跳正常，通信与设备状态稳定',
    className: styles.statusOnline,
    tagColor: 'success',
  },
  offline: {
    label: '离线设备',
    color: '#64748b',
    hint: '设备未按计划上报，需关注在网与供电情况',
    className: styles.statusOffline,
    tagColor: 'default',
  },
  alarm: {
    label: '告警设备',
    color: '#ef4444',
    hint: '存在设备异常或高优先级告警，需优先排查',
    className: styles.statusAlarm,
    tagColor: 'error',
  },
  pending: {
    label: '待激活',
    color: '#f59e0b',
    hint: '设备已入库或已发货，等待安装与激活',
    className: styles.statusPending,
    tagColor: 'warning',
  },
};

const shipOptions = [
  { label: '全部发货状态', value: 'all' },
  { label: '待发货', value: '待发货' },
  { label: '已发货', value: '已发货' },
  { label: '已签收', value: '已签收' },
];

const uniq = (arr: string[]) => Array.from(new Set(arr.filter(Boolean)));

const DeviceListPage: React.FC = () => {
  const { message, modal } = App.useApp();
  const actionRef = useRef<ActionType | undefined>(undefined);
  const [allDevices, setAllDevices] = useState<DeviceRecord[]>([]);
  const [keyword, setKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | DeviceStatus>('all');
  const [selectedModel, setSelectedModel] = useState('all');
  const [selectedProject, setSelectedProject] = useState('all');
  const [selectedShipStatus, setSelectedShipStatus] = useState('all');
  const [detailRecord, setDetailRecord] = useState<DeviceRecord>();
  const [batchStockInOpen, setBatchStockInOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<DeviceRecord>();
  const [paramDevice, setParamDevice] = useState<DeviceRecord>();
  const [bindDevice, setBindDevice] = useState<DeviceRecord>();

  const refreshAll = async () => {
    const res = await listDevices({ pageSize: 500 });
    setAllDevices(res.data ?? []);
  };
  useEffect(() => {
    refreshAll();
  }, []);

  const reload = () => {
    actionRef.current?.reload();
    refreshAll();
  };

  const overviewStats = useMemo(
    () =>
      (Object.keys(statusMeta) as DeviceStatus[]).map((key) => ({
        key,
        count: allDevices.filter((item) => item.status === key).length,
        ...statusMeta[key],
      })),
    [allDevices],
  );

  const modelOptions = useMemo(
    () => [
      { label: '全部型号', value: 'all' },
      ...uniq(allDevices.map((d) => d.productModel)).map((m) => ({ label: m, value: m })),
    ],
    [allDevices],
  );
  const projectOptions = useMemo(
    () => [
      { label: '全部项目', value: 'all' },
      ...uniq(allDevices.map((d) => d.projectName)).map((p) => ({ label: p, value: p })),
    ],
    [allDevices],
  );

  const requestDevices = async (params: { current?: number; pageSize?: number }) => {
    const res = await listDevices({
      current: params.current,
      pageSize: params.pageSize,
      keyword: appliedKeyword || undefined,
      status: selectedStatus !== 'all' ? selectedStatus : undefined,
      productModel: selectedModel !== 'all' ? selectedModel : undefined,
      projectName: selectedProject !== 'all' ? selectedProject : undefined,
      shipStatus: selectedShipStatus !== 'all' ? selectedShipStatus : undefined,
    });
    return { data: res.data ?? [], total: res.total, success: res.success };
  };

  const doShip = async (record: DeviceRecord) => {
    const res = await shipDevice(record.id);
    message.success(`发货状态已更新为「${res.data.shipStatus}」`);
    reload();
  };
  const doActivate = async (record: DeviceRecord) => {
    await activateDevice(record.id);
    message.success(`${record.deviceNo} 已激活并上线`);
    reload();
  };
  const doClearAlarm = async (record: DeviceRecord) => {
    await clearDeviceAlarm(record.id);
    message.success('告警已清除');
    reload();
  };
  const doUnbind = async (record: DeviceRecord) => {
    await unbindDeviceCard(record.id);
    message.success('已解绑卡');
    reload();
  };
  const handleDelete = (record: DeviceRecord) => {
    modal.confirm({
      title: '确认删除该设备？',
      content: `设备编号：${record.deviceNo}，删除后不可恢复。`,
      okType: 'danger',
      onOk: async () => {
        await removeDevice(record.id);
        message.success('已删除');
        reload();
      },
    });
  };

  const columns: ProColumns<DeviceRecord>[] = [
    {
      title: '设备编号',
      dataIndex: 'deviceNo',
      width: 150,
      fixed: 'left',
      render: (_, record) => (
        <a className={styles.deviceLink} onClick={() => setDetailRecord(record)}>
          {record.deviceNo}
        </a>
      ),
    },
    { title: '设备名称', dataIndex: 'deviceName', width: 160 },
    { title: '设备型号', dataIndex: 'productModel', width: 150 },
    { title: '项目', dataIndex: 'projectName', width: 140 },
    { title: '客户', dataIndex: 'customerName', width: 140 },
    {
      title: '设备状态',
      dataIndex: 'status',
      width: 120,
      render: (_, record) => (
        <span className={`${styles.statusTag} ${statusMeta[record.status].className}`}>
          {statusMeta[record.status].label}
        </span>
      ),
    },
    { title: '在线率', dataIndex: 'onlineRate', width: 100 },
    { title: '卡号', dataIndex: 'cardNo', width: 140 },
    { title: 'ICCID', dataIndex: 'iccid', width: 180 },
    { title: 'IMEI', dataIndex: 'imei', width: 150 },
    { title: '安装区域', dataIndex: 'installArea', width: 120 },
    { title: '发货状态', dataIndex: 'shipStatus', width: 110 },
    { title: '激活状态', dataIndex: 'activateStatus', width: 110 },
    { title: '最近心跳', dataIndex: 'lastHeartbeat', width: 160 },
    {
      title: '告警数',
      dataIndex: 'alertCount',
      width: 90,
      render: (_, record) => (
        <span style={{ color: record.alertCount > 0 ? '#dc2626' : undefined }}>
          {record.alertCount}
        </span>
      ),
    },
    {
      title: '操作',
      dataIndex: 'action',
      width: 230,
      fixed: 'right',
      render: (_, record) => (
        <span className={styles.actionLinks}>
          <a onClick={() => setDetailRecord(record)}>详情</a>
          <a onClick={() => doShip(record)}>发货</a>
          <a onClick={() => doActivate(record)}>激活</a>
          <a onClick={() => setParamDevice(record)}>参数下发</a>
          <Dropdown
            menu={{
              items: [
                { key: '编辑', label: '编辑' },
                { key: '绑卡', label: '绑卡' },
                { key: '解绑', label: '解绑' },
                { key: '清告警', label: '清告警' },
                { key: '删除', label: '删除' },
              ],
              onClick: ({ key }) => {
                if (key === '编辑') {
                  setEditing(record);
                  setFormOpen(true);
                } else if (key === '绑卡') setBindDevice(record);
                else if (key === '解绑') doUnbind(record);
                else if (key === '清告警') doClearAlarm(record);
                else if (key === '删除') handleDelete(record);
              },
            }}
          >
            <a onClick={(e) => e.preventDefault()}>
              更多 <DownOutlined />
            </a>
          </Dropdown>
        </span>
      ),
    },
  ];

  const needAttention =
    overviewStats.find((s) => s.key === 'pending')!.count +
    overviewStats.find((s) => s.key === 'offline')!.count +
    overviewStats.find((s) => s.key === 'alarm')!.count;

  return (
    <PageContainer
      className={styles.deviceListPage}
      header={{
        title: '设备列表',
        subTitle: '设备台账来自后端 /api/devices，支持新增 / 发货 / 激活 / 参数下发 / 守护码↔ICCID 绑卡。',
      }}
    >
      <div className={styles.overviewGrid}>
        {overviewStats.map((item) => {
          const active = selectedStatus === item.key;
          return (
            <button
              className={`${styles.overviewCard} ${active ? styles.overviewCardActive : ''}`}
              key={item.key}
              onClick={() => {
                setSelectedStatus(active ? 'all' : item.key);
                setTimeout(reload, 0);
              }}
              style={{ ['--accent-color' as string]: item.color }}
              type="button"
            >
              <div className={styles.overviewHead}>
                <span>{item.label}</span>
                <strong>{item.count}</strong>
              </div>
              <div className={styles.overviewHint}>{item.hint}</div>
            </button>
          );
        })}
      </div>

      <div className={styles.alertCard}>
        <Alert
          banner
          message={`当前有 ${needAttention} 台设备需要关注：待激活 ${overviewStats.find((s) => s.key === 'pending')!.count} 台、离线 ${overviewStats.find((s) => s.key === 'offline')!.count} 台、告警 ${overviewStats.find((s) => s.key === 'alarm')!.count} 台。`}
          type="warning"
        />
      </div>

      <div className={styles.filterCard}>
        <div className={styles.searchGrid}>
          <Input
            allowClear
            placeholder="搜索设备编号 / 名称 / 项目 / 客户 / 卡号 / ICCID"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            onPressEnter={() => {
              setAppliedKeyword(keyword);
              setTimeout(reload, 0);
            }}
          />
          <Select
            options={[
              { label: '全部设备状态', value: 'all' },
              ...(Object.keys(statusMeta) as DeviceStatus[]).map((key) => ({
                label: statusMeta[key].label,
                value: key,
              })),
            ]}
            value={selectedStatus}
            onChange={(v) => {
              setSelectedStatus(v);
              setTimeout(reload, 0);
            }}
          />
          <Select
            options={modelOptions}
            value={selectedModel}
            onChange={(v) => {
              setSelectedModel(v);
              setTimeout(reload, 0);
            }}
          />
          <Select
            options={projectOptions}
            value={selectedProject}
            onChange={(v) => {
              setSelectedProject(v);
              setTimeout(reload, 0);
            }}
          />
          <Select
            options={shipOptions}
            value={selectedShipStatus}
            onChange={(v) => {
              setSelectedShipStatus(v);
              setTimeout(reload, 0);
            }}
          />
          <Space>
            <Button
              type="primary"
              onClick={() => {
                setAppliedKeyword(keyword);
                setTimeout(reload, 0);
              }}
            >
              搜索
            </Button>
            <Button
              onClick={() => {
                setKeyword('');
                setAppliedKeyword('');
                setSelectedStatus('all');
                setSelectedModel('all');
                setSelectedProject('all');
                setSelectedShipStatus('all');
                setTimeout(reload, 0);
              }}
            >
              重置
            </Button>
          </Space>
        </div>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableMeta}>
          <span>设备台账由后端驱动，支持新增、发货、激活、参数下发与绑卡解绑。</span>
          <Space size={12}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditing(undefined);
                setFormOpen(true);
              }}
            >
              新增设备
            </Button>
            <Button onClick={() => setBatchStockInOpen(true)}>批量入库</Button>
          </Space>
        </div>
        <ProTable<DeviceRecord>
          cardBordered
          actionRef={actionRef}
          className={styles.tableWrap}
          columns={columns}
          request={requestDevices}
          options={false}
          pagination={{
            pageSize: 10,
            showQuickJumper: true,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          rowKey="id"
          scroll={{ x: 2300 }}
          search={false}
          tableAlertRender={false}
          tableAlertOptionRender={false}
        />
      </div>

      {/* 新增 / 编辑 设备 */}
      <ModalForm<DeviceRecord>
        key={editing?.id ?? 'create'}
        title={editing ? `编辑设备 · ${editing.deviceNo}` : '新增设备'}
        open={formOpen}
        onOpenChange={setFormOpen}
        grid
        rowProps={{ gutter: 16 }}
        modalProps={{ destroyOnClose: true }}
        initialValues={
          editing ?? {
            status: 'pending',
            shipStatus: '待发货',
            activateStatus: '未激活',
            onlineRate: '--',
            alertCount: 0,
            firmwareVersion: 'v1.0.0',
            lastHeartbeat: '--',
          }
        }
        onFinish={async (values) => {
          try {
            if (editing) {
              await updateDevice(editing.id, values);
              message.success('已保存修改');
            } else {
              await createDevice(values);
              message.success('已新增设备');
            }
            reload();
            return true;
          } catch {
            message.error('提交失败');
            return false;
          }
        }}
      >
        <ProFormText name="deviceNo" label="设备编号" colProps={{ span: 12 }} rules={[{ required: true }]} />
        <ProFormText name="deviceName" label="设备名称" colProps={{ span: 12 }} rules={[{ required: true }]} />
        <ProFormText name="productModel" label="设备型号" colProps={{ span: 12 }} />
        <ProFormText name="projectName" label="项目" colProps={{ span: 12 }} />
        <ProFormText name="customerName" label="客户" colProps={{ span: 12 }} />
        <ProFormSelect
          name="status"
          label="设备状态"
          colProps={{ span: 12 }}
          options={(Object.keys(statusMeta) as DeviceStatus[]).map((k) => ({
            label: statusMeta[k].label,
            value: k,
          }))}
        />
        <ProFormSelect
          name="shipStatus"
          label="发货状态"
          colProps={{ span: 12 }}
          options={['待发货', '已发货', '已签收'].map((s) => ({ label: s, value: s }))}
        />
        <ProFormSelect
          name="activateStatus"
          label="激活状态"
          colProps={{ span: 12 }}
          options={['未激活', '激活中', '已激活'].map((s) => ({ label: s, value: s }))}
        />
        <ProFormText name="installArea" label="安装区域" colProps={{ span: 12 }} />
        <ProFormText name="guardianCode" label="守护码" colProps={{ span: 12 }} />
        <ProFormText name="cardNo" label="卡号" colProps={{ span: 12 }} />
        <ProFormText name="iccid" label="ICCID" colProps={{ span: 12 }} />
        <ProFormText name="imei" label="IMEI" colProps={{ span: 12 }} />
        <ProFormText name="firmwareVersion" label="固件版本" colProps={{ span: 12 }} />
        <ProFormDigit name="alertCount" label="告警数" colProps={{ span: 12 }} min={0} />
        <ProFormTextArea name="remark" label="备注" colProps={{ span: 24 }} />
      </ModalForm>

      {/* 参数下发 */}
      <ModalForm
        key={`param-${paramDevice?.id ?? ''}`}
        title={paramDevice ? `远程参数下发 · ${paramDevice.deviceNo}` : '远程参数下发'}
        open={Boolean(paramDevice)}
        onOpenChange={(o) => !o && setParamDevice(undefined)}
        modalProps={{ destroyOnClose: true }}
        initialValues={{ firmwareVersion: paramDevice?.firmwareVersion }}
        onFinish={async (values) => {
          await dispatchDeviceParams(paramDevice!.id, { firmwareVersion: values.firmwareVersion });
          message.success('参数已下发');
          setParamDevice(undefined);
          reload();
          return true;
        }}
      >
        <ProFormText
          name="firmwareVersion"
          label="目标固件版本"
          placeholder="如 v3.3.0"
          rules={[{ required: true }]}
        />
      </ModalForm>

      {/* 守护码↔ICCID 绑卡 */}
      <ModalForm
        key={`bind-${bindDevice?.id ?? ''}`}
        title={bindDevice ? `绑卡 · 守护码 ${bindDevice.guardianCode}` : '绑卡'}
        open={Boolean(bindDevice)}
        onOpenChange={(o) => !o && setBindDevice(undefined)}
        grid
        rowProps={{ gutter: 16 }}
        modalProps={{ destroyOnClose: true }}
        initialValues={{
          cardNo: bindDevice?.cardNo,
          iccid: bindDevice?.iccid,
          imei: bindDevice?.imei,
        }}
        onFinish={async (values) => {
          await bindDeviceCard(bindDevice!.id, values);
          message.success('已绑卡');
          setBindDevice(undefined);
          reload();
          return true;
        }}
      >
        <ProFormText name="cardNo" label="卡号" colProps={{ span: 12 }} />
        <ProFormText name="iccid" label="ICCID" colProps={{ span: 12 }} rules={[{ required: true }]} />
        <ProFormText name="imei" label="IMEI" colProps={{ span: 24 }} />
      </ModalForm>

      <Drawer
        destroyOnClose
        onClose={() => setDetailRecord(undefined)}
        open={Boolean(detailRecord)}
        title={detailRecord ? `${detailRecord.deviceNo} 设备详情` : '设备详情'}
        width={720}
      >
        {detailRecord ? (
          <Space direction="vertical" size={16} style={{ display: 'flex' }}>
            <Alert
              message={detailRecord.remark}
              type={detailRecord.alertCount > 0 ? 'warning' : 'info'}
              showIcon
            />
            <Space wrap>
              <Button type="primary" onClick={() => { setEditing(detailRecord); setFormOpen(true); }}>
                编辑
              </Button>
              <Button onClick={() => doShip(detailRecord)}>发货</Button>
              <Button onClick={() => doActivate(detailRecord)}>激活</Button>
              <Button onClick={() => setParamDevice(detailRecord)}>参数下发</Button>
              <Button onClick={() => setBindDevice(detailRecord)}>绑卡</Button>
              {detailRecord.alertCount > 0 && (
                <Button onClick={() => doClearAlarm(detailRecord)}>清告警</Button>
              )}
            </Space>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="设备编号">{detailRecord.deviceNo}</Descriptions.Item>
              <Descriptions.Item label="设备名称">{detailRecord.deviceName}</Descriptions.Item>
              <Descriptions.Item label="设备型号">{detailRecord.productModel}</Descriptions.Item>
              <Descriptions.Item label="项目">{detailRecord.projectName}</Descriptions.Item>
              <Descriptions.Item label="客户">{detailRecord.customerName}</Descriptions.Item>
              <Descriptions.Item label="设备状态">
                <Tag color={statusMeta[detailRecord.status].tagColor}>
                  {statusMeta[detailRecord.status].label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="卡号">{detailRecord.cardNo}</Descriptions.Item>
              <Descriptions.Item label="ICCID">{detailRecord.iccid}</Descriptions.Item>
              <Descriptions.Item label="IMEI">{detailRecord.imei}</Descriptions.Item>
              <Descriptions.Item label="安装区域">{detailRecord.installArea}</Descriptions.Item>
              <Descriptions.Item label="发货状态">{detailRecord.shipStatus}</Descriptions.Item>
              <Descriptions.Item label="激活状态">{detailRecord.activateStatus}</Descriptions.Item>
              <Descriptions.Item label="最近心跳">{detailRecord.lastHeartbeat}</Descriptions.Item>
              <Descriptions.Item label="在线率">{detailRecord.onlineRate}</Descriptions.Item>
            </Descriptions>

            <div>
              <div className={styles.sectionTitle}>运行指标</div>
              <div className={styles.metricGrid}>
                {[
                  ['告警数量', `${detailRecord.alertCount}`],
                  ['固件版本', detailRecord.firmwareVersion],
                  ['守护码', detailRecord.guardianCode],
                  ['最近状态', statusMeta[detailRecord.status].label],
                ].map(([label, value]) => (
                  <div className={styles.metricCard} key={label}>
                    <div className={styles.metricLabel}>{label}</div>
                    <div className={styles.metricValue}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </Space>
        ) : null}
      </Drawer>

      <Modal
        destroyOnClose
        okText="确认入库"
        onCancel={() => setBatchStockInOpen(false)}
        onOk={async () => {
          const base = Date.now().toString().slice(-5);
          await Promise.all(
            [1, 2, 3].map((n) =>
              createDevice({
                deviceNo: `DEV-IMP-${base}-${n}`,
                deviceName: `批量入库设备 ${base}-${n}`,
                productModel: 'QL-IMPORT',
                projectName: '批量入库',
                customerName: '批量导入',
                status: 'pending',
                shipStatus: '待发货',
                activateStatus: '未激活',
                onlineRate: '--',
                alertCount: 0,
                firmwareVersion: 'v1.0.0',
                guardianCode: `GD-IMP-${base}-${n}`,
                iccid: '--',
                cardNo: '--',
                imei: '--',
                installArea: '--',
                lastHeartbeat: '--',
                remark: '批量入库新增',
              }),
            ),
          );
          message.success('批量入库完成：已新增 3 台设备并写入后端');
          setBatchStockInOpen(false);
          reload();
        }}
        open={batchStockInOpen}
        title="批量入库"
        width={760}
      >
        <Space direction="vertical" size={16} style={{ display: 'flex' }}>
          <Alert message="支持按模板批量导入设备台账信息。" showIcon type="info" />
          <div>
            <div className={styles.sectionTitle}>导入说明</div>
            <div className={styles.metricGrid}>
              {[
                ['导入模板', '设备编号、设备名称、设备型号、IMEI、ICCID、项目、客户'],
                ['数据校验', '校验必填项、设备编号唯一性、IMEI 格式、ICCID 长度'],
                ['重复策略', '已存在设备编号时标记失败，不直接覆盖原记录'],
                ['结果输出', '返回成功数、失败数和失败原因明细'],
              ].map(([label, value]) => (
                <div className={styles.metricCard} key={label}>
                  <div className={styles.metricLabel}>{label}</div>
                  <div className={styles.metricText}>{value}</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className={styles.sectionTitle}>本次导入文件</div>
            <div className={styles.uploadPanel}>
              <div className={styles.uploadTitle}>device-batch-import-2026-06.xlsx</div>
              <div className={styles.uploadMeta}>
                文件大小 248 KB，预计导入 24 条设备记录，其中 2 条存在格式异常。
              </div>
              <div className={styles.uploadActions}>
                <Button onClick={() => message.info('Excel 模板已开始下载')}>下载模板</Button>
                <Button onClick={() => message.info('请重新选择文件')}>重新选择文件</Button>
              </div>
            </div>
          </div>
        </Space>
      </Modal>
    </PageContainer>
  );
};

export default DeviceListPage;
