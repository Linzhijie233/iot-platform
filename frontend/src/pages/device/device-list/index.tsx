import type { ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Alert, App, Button, Descriptions, Drawer, Input, Modal, Select, Space, Tag } from 'antd';
import React, { useMemo, useState } from 'react';
import styles from './index.less';

type DeviceStatus = 'online' | 'offline' | 'alarm' | 'pending';

type DeviceRecord = {
  id: string;
  deviceNo: string;
  deviceName: string;
  productModel: string;
  projectName: string;
  customerName: string;
  status: DeviceStatus;
  onlineRate: string;
  cardNo: string;
  iccid: string;
  imei: string;
  installArea: string;
  shipStatus: '待发货' | '已发货' | '已签收';
  activateStatus: '未激活' | '激活中' | '已激活';
  lastHeartbeat: string;
  alertCount: number;
  firmwareVersion: string;
  guardianCode: string;
  remark: string;
};

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

const deviceRecords: DeviceRecord[] = [
  {
    id: 'device-1',
    deviceNo: 'DEV-2026-0001',
    deviceName: '冷链网关 A-17',
    productModel: 'QL-IOT-GW-4G',
    projectName: '顺运冷链',
    customerName: '顺运冷链',
    status: 'online',
    onlineRate: '99.6%',
    cardNo: 'CARD-2024-0001',
    iccid: '898604A4192191902141',
    imei: '861245078912341',
    installArea: '上海',
    shipStatus: '已签收',
    activateStatus: '已激活',
    lastHeartbeat: '2026-04-11 09:12',
    alertCount: 0,
    firmwareVersion: 'v3.2.1',
    guardianCode: 'GD-10017',
    remark: '冷链主仓网关，运行稳定',
  },
  {
    id: 'device-2',
    deviceNo: 'DEV-2026-0002',
    deviceName: '车载终端 C-11',
    productModel: 'QL-CAR-4G-PRO',
    projectName: '车联网项目组',
    customerName: '车联网项目组',
    status: 'alarm',
    onlineRate: '71.4%',
    cardNo: 'CARD-2024-0004',
    iccid: '898604D5192270879708',
    imei: '861245078912344',
    installArea: '杭州',
    shipStatus: '已签收',
    activateStatus: '已激活',
    lastHeartbeat: '2026-04-10 22:40',
    alertCount: 3,
    firmwareVersion: 'v2.8.4',
    guardianCode: 'GD-20811',
    remark: '近 24 小时多次离线，需要排查供电',
  },
  {
    id: 'device-3',
    deviceNo: 'DEV-2026-0003',
    deviceName: '水表采集器 N-08',
    productModel: 'QL-NB-METER',
    projectName: '城市水务',
    customerName: '城市水务',
    status: 'pending',
    onlineRate: '--',
    cardNo: 'CARD-2024-0003',
    iccid: '898604D5192270879709',
    imei: '869876543210008',
    installArea: '苏州',
    shipStatus: '已发货',
    activateStatus: '激活中',
    lastHeartbeat: '--',
    alertCount: 0,
    firmwareVersion: 'v1.0.0',
    guardianCode: 'GD-30008',
    remark: '现场批量安装中，等待首包激活',
  },
  {
    id: 'device-4',
    deviceNo: 'DEV-2026-0004',
    deviceName: '售货设备 D-03',
    productModel: 'QL-VM-EDGE',
    projectName: '零售机具',
    customerName: '新零售事业部',
    status: 'offline',
    onlineRate: '48.2%',
    cardNo: 'CARD-2024-0002',
    iccid: '898604A4192280313034',
    imei: '861245078912342',
    installArea: '广州',
    shipStatus: '已签收',
    activateStatus: '已激活',
    lastHeartbeat: '2026-04-08 15:22',
    alertCount: 1,
    firmwareVersion: 'v2.1.9',
    guardianCode: 'GD-41003',
    remark: '门店断网后未恢复上报',
  },
];

const modelOptions = [
  { label: '全部型号', value: 'all' },
  ...Array.from(new Set(deviceRecords.map((item) => item.productModel))).map((item) => ({
    label: item,
    value: item,
  })),
];

const projectOptions = [
  { label: '全部项目', value: 'all' },
  ...Array.from(new Set(deviceRecords.map((item) => item.projectName))).map((item) => ({
    label: item,
    value: item,
  })),
];

const shipOptions = [
  { label: '全部发货状态', value: 'all' },
  { label: '待发货', value: '待发货' },
  { label: '已发货', value: '已发货' },
  { label: '已签收', value: '已签收' },
];

const DeviceListPage: React.FC = () => {
  const { message } = App.useApp();
  const [keyword, setKeyword] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | DeviceStatus>('all');
  const [selectedModel, setSelectedModel] = useState('all');
  const [selectedProject, setSelectedProject] = useState('all');
  const [selectedShipStatus, setSelectedShipStatus] = useState('all');
  const [detailRecord, setDetailRecord] = useState<DeviceRecord>();
  const [batchStockInOpen, setBatchStockInOpen] = useState(false);

  const overviewStats = useMemo(
    () =>
      (Object.keys(statusMeta) as DeviceStatus[]).map((key) => ({
        key,
        count: deviceRecords.filter((item) => item.status === key).length,
        ...statusMeta[key],
      })),
    [],
  );

  const filteredRecords = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    return deviceRecords.filter((item) => {
      const matchesKeyword =
        !normalizedKeyword ||
        [
          item.deviceNo,
          item.deviceName,
          item.projectName,
          item.customerName,
          item.cardNo,
          item.iccid,
          item.imei,
          item.guardianCode,
        ]
          .join('|')
          .toLowerCase()
          .includes(normalizedKeyword);

      const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
      const matchesModel = selectedModel === 'all' || item.productModel === selectedModel;
      const matchesProject = selectedProject === 'all' || item.projectName === selectedProject;
      const matchesShipStatus =
        selectedShipStatus === 'all' || item.shipStatus === selectedShipStatus;

      return (
        matchesKeyword &&
        matchesStatus &&
        matchesModel &&
        matchesProject &&
        matchesShipStatus
      );
    });
  }, [keyword, selectedModel, selectedProject, selectedShipStatus, selectedStatus]);

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
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <span className={styles.actionLinks}>
          <a onClick={() => setDetailRecord(record)}>详情</a>
          <a onClick={() => message.info(`${record.deviceNo} 为静态发货入口`)}>发货</a>
          <a onClick={() => message.info(`${record.deviceNo} 为静态激活入口`)}>激活</a>
          <a onClick={() => message.info(`${record.deviceNo} 为静态参数下发入口`)}>参数下发</a>
        </span>
      ),
    },
  ];

  return (
    <PageContainer
      className={styles.deviceListPage}
      header={{
        title: '设备列表',
        subTitle: '统一查看设备台账、发货激活状态、在线表现和设备告警。',
      }}
    >
      <div className={styles.overviewGrid}>
        {overviewStats.map((item) => {
          const active = selectedStatus === item.key;
          return (
            <button
              className={`${styles.overviewCard} ${active ? styles.overviewCardActive : ''}`}
              key={item.key}
              onClick={() => setSelectedStatus(active ? 'all' : item.key)}
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
          message="当前有 3 台设备需要优先处理：1 台待激活、1 台离线、1 台告警，建议先检查车联网与零售项目。"
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
          />
          <Select
            options={[{ label: '全部设备状态', value: 'all' }, ...overviewStats.map((item) => ({
              label: item.label,
              value: item.key,
            }))]}
            value={selectedStatus}
            onChange={setSelectedStatus}
          />
          <Select options={modelOptions} value={selectedModel} onChange={setSelectedModel} />
          <Select
            options={projectOptions}
            value={selectedProject}
            onChange={setSelectedProject}
          />
          <Select
            options={shipOptions}
            value={selectedShipStatus}
            onChange={setSelectedShipStatus}
          />
          <Space>
            <Button type="primary" onClick={() => message.success('已按静态条件刷新设备列表')}>
              搜索
            </Button>
            <Button
              onClick={() => {
                setKeyword('');
                setSelectedStatus('all');
                setSelectedModel('all');
                setSelectedProject('all');
                setSelectedShipStatus('all');
              }}
            >
              重置
            </Button>
          </Space>
        </div>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableMeta}>
          <span>
            当前结果 <strong>{filteredRecords.length}</strong> 条
          </span>
          <Space size={12}>
            <span>列表页提供台账查看与静态操作入口，不承载真实发货、激活和远控流程。</span>
            <Button type="primary" onClick={() => setBatchStockInOpen(true)}>
              批量入库
            </Button>
          </Space>
        </div>
        <ProTable<DeviceRecord>
          cardBordered
          className={styles.tableWrap}
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
        title={detailRecord ? `${detailRecord.deviceNo} 设备详情` : '设备详情'}
        width={720}
      >
        {detailRecord ? (
          <Space direction="vertical" size={16} style={{ display: 'flex' }}>
            <Alert message={detailRecord.remark} type={detailRecord.alertCount > 0 ? 'warning' : 'info'} showIcon />
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
        destroyOnHidden
        okText="确认入库"
        onCancel={() => setBatchStockInOpen(false)}
        onOk={() => {
          message.success('已触发静态批量入库：导入 24 台设备，成功 22 台，失败 2 台');
          setBatchStockInOpen(false);
        }}
        open={batchStockInOpen}
        title="批量入库"
        width={760}
      >
        <Space direction="vertical" size={16} style={{ display: 'flex' }}>
          <Alert
            message="支持按模板批量导入设备台账信息，当前为静态演示流程。"
            showIcon
            type="info"
          />

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
              <div className={styles.uploadTitle}>device-batch-import-2026-04.xlsx</div>
              <div className={styles.uploadMeta}>
                文件大小 248 KB，预计导入 24 条设备记录，其中 2 条存在格式异常。
              </div>
              <div className={styles.uploadActions}>
                <Button onClick={() => message.info('静态演示：下载 Excel 模板')}>下载模板</Button>
                <Button onClick={() => message.info('静态演示：重新选择文件')}>重新选择文件</Button>
              </div>
            </div>
          </div>

          <div>
            <div className={styles.sectionTitle}>预校验结果</div>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="待导入数量">24</Descriptions.Item>
              <Descriptions.Item label="校验通过">22</Descriptions.Item>
              <Descriptions.Item label="校验失败">2</Descriptions.Item>
              <Descriptions.Item label="失败原因摘要">1 条设备编号重复，1 条 ICCID 长度异常</Descriptions.Item>
            </Descriptions>
          </div>
        </Space>
      </Modal>
    </PageContainer>
  );
};

export default DeviceListPage;
