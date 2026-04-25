import type { ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import {
  App,
  Button,
  Checkbox,
  Col,
  Drawer,
  Dropdown,
  Input,
  Popover,
  Row,
  Select,
  Space,
  Switch,
  Tabs,
  Tag,
} from 'antd';
import { DownOutlined, ExportOutlined, SearchOutlined } from '@ant-design/icons';
import React, { useState } from 'react';
import styles from './index.less';

type CardTabKey = 'normal' | 'nb' | 'pool';

type CardRecord = {
  id: string;
  iccid: string;
  msisdn: string;
  orderNo: string;
  renewCode: string;
  packageName: string;
  giftTraffic: string;
  usedTraffic: string;
  remainTraffic: string;
  owner: string;
  status: 'online' | 'offline' | 'suspended' | 'cancelled';
  cardStatusText: string;
  apn: string;
  apnType: string;
  mode: string;
  cardType: string;
  poolName: string;
  cardAttr: string;
  effectiveDate: string;
  expireDate: string;
  guaranteedKeepNo: string;
  guaranteedExpireDate: string;
  resource: string;
  region: string;
  smsStatus: string;
  remark: string;
  operator: string;
  project: string;
  esim: string;
  imei: string;
  deviceName: string;
  serviceStatus: boolean;
};

const tabLabels: Record<CardTabKey, string> = {
  normal: '普通权球卡',
  nb: 'NB卡',
  pool: '流量池卡',
};

const tableColumnLabels = [
  { label: 'ICCID', value: 'iccid' },
  { label: 'MSISDN', value: 'msisdn' },
  { label: '服务套餐', value: 'packageName' },
  { label: '卡状态', value: 'cardStatusText' },
  { label: 'APN', value: 'apn' },
  { label: '制式', value: 'mode' },
  { label: '流量池', value: 'poolName' },
  { label: '生效日期', value: 'effectiveDate' },
  { label: '失效日期', value: 'expireDate' },
  { label: '备注', value: 'remark' },
] as const;

const initialRecords: Record<CardTabKey, CardRecord[]> = {
  normal: [
    {
      id: 'normal-1',
      iccid: '898604A4192191902141',
      msisdn: '1441047608141',
      orderNo: '20240816102351131524',
      renewCode: 'XJ-100G-52',
      packageName: '移动专业100GB x52月',
      giftTraffic: '无',
      usedTraffic: '0MB',
      remainTraffic: '100GB',
      owner: '临时测试用户户',
      status: 'offline',
      cardStatusText: '已注销',
      apn: 'CMIOT',
      apnType: '通用',
      mode: '4G',
      cardType: '测试卡',
      poolName: 'C000003-CMPS100G-01',
      cardAttr: '普通卡',
      effectiveDate: '2023/09/01',
      expireDate: '2027/12/31',
      guaranteedKeepNo: '否',
      guaranteedExpireDate: '--',
      resource: '全国通用',
      region: '青岛',
      smsStatus: '已开通',
      remark: '发往青岛，无人机，文琪',
      operator: '中国移动',
      project: '无人机巡检',
      esim: '--',
      imei: '861245078912341',
      deviceName: '巡检终端 A-01',
      serviceStatus: false,
    },
    {
      id: 'normal-2',
      iccid: '898604A4192280313034',
      msisdn: '1441047559658',
      orderNo: '20220516114825176984',
      renewCode: 'XJ-30M-01',
      packageName: '移动专业30MB x1月',
      giftTraffic: '无',
      usedTraffic: '0MB',
      remainTraffic: '30MB',
      owner: '临时测试用户户',
      status: 'cancelled',
      cardStatusText: '已注销（过期三个月注销）',
      apn: 'CMIOT',
      apnType: '通用',
      mode: '4G',
      cardType: '测试卡',
      poolName: '--',
      cardAttr: '普通卡',
      effectiveDate: '2022/05/16',
      expireDate: '2022/10/31',
      guaranteedKeepNo: '否',
      guaranteedExpireDate: '--',
      resource: '全国通用',
      region: '广州',
      smsStatus: '已开通',
      remark: '天河3',
      operator: '中国移动',
      project: '车载监控',
      esim: '--',
      imei: '861245078912342',
      deviceName: '车载终端 B-18',
      serviceStatus: false,
    },
    {
      id: 'normal-3',
      iccid: '898604D5192270879709',
      msisdn: '1441352879709',
      orderNo: '20240819103037978886',
      renewCode: 'XJ-30M-49',
      packageName: '移动专业30MB x49月',
      giftTraffic: '无',
      usedTraffic: '0MB',
      remainTraffic: '0.2929GB',
      owner: '临时测试用户户',
      status: 'online',
      cardStatusText: '已激活',
      apn: 'CMMTMGZYH.GD',
      apnType: '定向',
      mode: '4G',
      cardType: '测试卡',
      poolName: '--',
      cardAttr: '普通卡',
      effectiveDate: '2024/08/19',
      expireDate: '2028/08/31',
      guaranteedKeepNo: '否',
      guaranteedExpireDate: '--',
      resource: '权球专享',
      region: '广东',
      smsStatus: '未开通',
      remark: '2月22日备注，智能驾驶',
      operator: '中国移动',
      project: '智能驾驶',
      esim: '--',
      imei: '861245078912343',
      deviceName: '车规终端 C-07',
      serviceStatus: true,
    },
    {
      id: 'normal-4',
      iccid: '898604D5192270879708',
      msisdn: '1441352879708',
      orderNo: '20240819103037978886',
      renewCode: 'XJ-1G-02',
      packageName: '移动专业1GB x2月',
      giftTraffic: '无',
      usedTraffic: '0MB',
      remainTraffic: '1GB',
      owner: '体验账号',
      status: 'suspended',
      cardStatusText: '停机保号',
      apn: 'CMIOTLENOVO.ZJ',
      apnType: '通用',
      mode: '4G',
      cardType: '体验卡',
      poolName: '--',
      cardAttr: '普通卡',
      effectiveDate: '2021/01/07',
      expireDate: '2021/01/31',
      guaranteedKeepNo: '是',
      guaranteedExpireDate: '2024/11/30',
      resource: '全国通用',
      region: '浙江',
      smsStatus: '未开通',
      remark: '自动零售机',
      operator: '中国联通',
      project: '零售机具',
      esim: '--',
      imei: '861245078912344',
      deviceName: '售货设备 D-03',
      serviceStatus: false,
    },
  ],
  nb: [
    {
      id: 'nb-1',
      iccid: '8986032400000001201',
      msisdn: '1064910093326',
      orderNo: 'NB202501020001',
      renewCode: 'NB-5Y-001',
      packageName: 'NB按量套餐 5年',
      giftTraffic: '短信 50 条',
      usedTraffic: '12MB',
      remainTraffic: '88MB',
      owner: '城市水务项目',
      status: 'online',
      cardStatusText: '在线',
      apn: 'CTNB',
      apnType: '低功耗',
      mode: 'NB-IoT',
      cardType: '表计卡',
      poolName: 'NB-POOL-SZ-01',
      cardAttr: '低功耗卡',
      effectiveDate: '2025/01/02',
      expireDate: '2030/01/01',
      guaranteedKeepNo: '否',
      guaranteedExpireDate: '--',
      resource: '市政专网',
      region: '深圳',
      smsStatus: '未开通',
      remark: '水表采集一期',
      operator: '中国电信',
      project: '水务抄表',
      esim: '--',
      imei: '869876543210001',
      deviceName: '水表采集器 N-01',
      serviceStatus: true,
    },
    {
      id: 'nb-2',
      iccid: '8986032400000001202',
      msisdn: '1064910093327',
      orderNo: 'NB202501020002',
      renewCode: 'NB-3Y-008',
      packageName: 'NB按量套餐 3年',
      giftTraffic: '短信 20 条',
      usedTraffic: '4MB',
      remainTraffic: '46MB',
      owner: '智慧井盖项目',
      status: 'offline',
      cardStatusText: '离线',
      apn: 'CTNB',
      apnType: '低功耗',
      mode: 'NB-IoT',
      cardType: '传感卡',
      poolName: 'NB-POOL-GZ-02',
      cardAttr: '低功耗卡',
      effectiveDate: '2024/10/10',
      expireDate: '2027/10/09',
      guaranteedKeepNo: '否',
      guaranteedExpireDate: '--',
      resource: '市政专网',
      region: '广州',
      smsStatus: '未开通',
      remark: '井盖二期，待排查',
      operator: '中国电信',
      project: '智慧井盖',
      esim: '--',
      imei: '869876543210002',
      deviceName: '井盖传感器 N-02',
      serviceStatus: false,
    },
  ],
  pool: [
    {
      id: 'pool-1',
      iccid: '8986001000000009001',
      msisdn: '1440252886994',
      orderNo: 'POOL202503120001',
      renewCode: 'POOL-10G-01',
      packageName: '共享流量池 10GB',
      giftTraffic: '无',
      usedTraffic: '3.5GB',
      remainTraffic: '6.5GB',
      owner: '体验账号',
      status: 'online',
      cardStatusText: '在池使用中',
      apn: 'UNIOT',
      apnType: '通用',
      mode: '4G/5G',
      cardType: '流量池成员卡',
      poolName: 'POOL-GD-10G-001',
      cardAttr: '共享卡',
      effectiveDate: '2025/03/12',
      expireDate: '2026/03/11',
      guaranteedKeepNo: '否',
      guaranteedExpireDate: '--',
      resource: '全国共享',
      region: '广州',
      smsStatus: '已开通',
      remark: '园区网关共池',
      operator: '中国联通',
      project: '园区网关',
      esim: 'EID-POOL-0001',
      imei: '865432109876001',
      deviceName: '园区网关 P-01',
      serviceStatus: true,
    },
    {
      id: 'pool-2',
      iccid: '8986001000000009002',
      msisdn: '1440252886995',
      orderNo: 'POOL202503120002',
      renewCode: 'POOL-50G-03',
      packageName: '共享流量池 50GB',
      giftTraffic: '无',
      usedTraffic: '27GB',
      remainTraffic: '23GB',
      owner: '物流项目组',
      status: 'suspended',
      cardStatusText: '停机保号',
      apn: 'UNIOT',
      apnType: '定向',
      mode: '4G',
      cardType: '流量池成员卡',
      poolName: 'POOL-SH-50G-003',
      cardAttr: '共享卡',
      effectiveDate: '2024/12/01',
      expireDate: '2025/11/30',
      guaranteedKeepNo: '是',
      guaranteedExpireDate: '2025/12/31',
      resource: '华东共享',
      region: '上海',
      smsStatus: '已开通',
      remark: '仓储定位备用',
      operator: '中国联通',
      project: '仓储定位',
      esim: 'EID-POOL-0002',
      imei: '865432109876002',
      deviceName: '仓储定位器 P-08',
      serviceStatus: false,
    },
  ],
};

const statusOptions = [
  { label: '全部状态', value: 'all' },
  { label: '在线', value: 'online' },
  { label: '离线', value: 'offline' },
  { label: '停机保号', value: 'suspended' },
  { label: '已注销', value: 'cancelled' },
];

const operatorOptions = [
  { label: '全部运营商', value: 'all' },
  { label: '中国移动', value: '中国移动' },
  { label: '中国联通', value: '中国联通' },
  { label: '中国电信', value: '中国电信' },
];

const projectOptions = [
  { label: '全部项目', value: 'all' },
  { label: '无人机巡检', value: '无人机巡检' },
  { label: '智能驾驶', value: '智能驾驶' },
  { label: '水务抄表', value: '水务抄表' },
  { label: '园区网关', value: '园区网关' },
];

const statisticOptions = [
  { label: '全部统计', value: 'all' },
  { label: '近30天到期', value: 'expiring' },
  { label: '流量剩余不足20%', value: 'lowTraffic' },
  { label: '已绑定设备', value: 'boundDevice' },
];

const statusClassNameMap: Record<CardRecord['status'], string> = {
  online: styles.statusOnline,
  offline: styles.statusOffline,
  suspended: styles.statusSuspended,
  cancelled: styles.statusCancelled,
};

const CardIdentifierManagementPage: React.FC = () => {
  const { message } = App.useApp();
  const [activeTab, setActiveTab] = useState<CardTabKey>('normal');
  const [recordsByTab, setRecordsByTab] = useState(initialRecords);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [detailRecord, setDetailRecord] = useState<CardRecord>();
  const [detailOpen, setDetailOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [operatorFilter, setOperatorFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [statisticFilter, setStatisticFilter] = useState('all');
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(
    tableColumnLabels.map((item) => item.value),
  );

  const records = recordsByTab[activeTab];
  const filteredRecords = records.filter((record) => {
    const keywordValue = keyword.trim().toLowerCase();
    const matchesKeyword =
      !keywordValue ||
      [
        record.iccid,
        record.msisdn,
        record.orderNo,
        record.remark,
        record.imei,
        record.esim,
      ].some((field) => field.toLowerCase().includes(keywordValue));
    const matchesStatus =
      statusFilter === 'all' || record.status === statusFilter;
    const matchesOperator =
      operatorFilter === 'all' || record.operator === operatorFilter;
    const matchesProject =
      projectFilter === 'all' || record.project === projectFilter;
    const matchesStatistic =
      statisticFilter === 'all' ||
      (statisticFilter === 'expiring' && record.expireDate <= '2026/03/31') ||
      (statisticFilter === 'lowTraffic' &&
        (record.remainTraffic.includes('MB') || record.remainTraffic === '6.5GB')) ||
      (statisticFilter === 'boundDevice' && record.deviceName !== '--');

    return (
      matchesKeyword &&
      matchesStatus &&
      matchesOperator &&
      matchesProject &&
      matchesStatistic
    );
  });

  const updateRecord = (recordId: string, updater: (record: CardRecord) => CardRecord) => {
    setRecordsByTab((prev) => ({
      ...prev,
      [activeTab]: prev[activeTab].map((record) =>
        record.id === recordId ? updater(record) : record,
      ),
    }));
  };

  const openDetail = (record: CardRecord) => {
    setDetailRecord(record);
    setDetailOpen(true);
  };

  const handleToolbarAction = (actionName: string) => {
    message.info(`${actionName} 为静态演示入口，当前未接入真实接口`);
  };

  const allColumns: ProColumns<CardRecord>[] = [
    {
      title: 'ICCID',
      dataIndex: 'iccid',
      key: 'iccid',
      width: 190,
      fixed: 'left',
      render: (_, record) => <a onClick={() => openDetail(record)}>{record.iccid}</a>,
    },
    {
      title: 'MSISDN',
      dataIndex: 'msisdn',
      key: 'msisdn',
      width: 140,
    },
    {
      title: '服务套餐',
      dataIndex: 'packageName',
      key: 'packageName',
      width: 200,
      ellipsis: true,
    },
    {
      title: '卡状态',
      dataIndex: 'cardStatusText',
      key: 'cardStatusText',
      width: 150,
      render: (_, record) => (
        <span className={`${styles.statusDot} ${statusClassNameMap[record.status]}`}>
          {record.cardStatusText}
        </span>
      ),
    },
    {
      title: 'APN',
      dataIndex: 'apn',
      key: 'apn',
      width: 130,
    },
    {
      title: '制式',
      dataIndex: 'mode',
      key: 'mode',
      width: 100,
      render: (_, record) => <Tag color="blue">{record.mode}</Tag>,
    },
    {
      title: '流量池',
      dataIndex: 'poolName',
      key: 'poolName',
      width: 180,
      ellipsis: true,
    },
    {
      title: '生效日期',
      dataIndex: 'effectiveDate',
      key: 'effectiveDate',
      width: 120,
    },
    {
      title: '失效日期',
      dataIndex: 'expireDate',
      key: 'expireDate',
      width: 120,
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      width: 220,
      ellipsis: true,
    },
    {
      title: '停开机',
      dataIndex: 'serviceStatus',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Switch
          checked={record.serviceStatus}
          checkedChildren="开"
          unCheckedChildren="停"
          onChange={(checked) => {
            updateRecord(record.id, (item) => ({
              ...item,
              serviceStatus: checked,
              status: checked ? 'online' : 'suspended',
              cardStatusText: checked ? '已激活' : '停机保号',
            }));
            message.success(`已切换为静态${checked ? '开机' : '停机'}状态`);
          }}
        />
      ),
    },
    {
      title: '诊断',
      dataIndex: 'diagnosis',
      width: 80,
      fixed: 'right',
      render: (_, record) => <a onClick={() => openDetail(record)}>查看</a>,
    },
    {
      title: '操作',
      dataIndex: 'option',
      valueType: 'option',
      width: 90,
      fixed: 'right',
      render: (_, record) => {
        const items = [
          '续期',
          '加油包',
          '停机保号',
          '自主注销',
          '查看详细',
          '短信发送',
          '申请解绑',
          '省级限定',
          '备注',
        ].map((label) => ({
          key: label,
          label,
        }));

        return [
          <Dropdown
            key="more"
            menu={{
              items,
              onClick: ({ key }) => {
                if (key === '查看详细') {
                  openDetail(record);
                  return;
                }
                handleToolbarAction(`${record.iccid} - ${key}`);
              },
            }}
          >
            <a onClick={(event) => event.preventDefault()}>
              操作 <DownOutlined />
            </a>
          </Dropdown>,
        ];
      },
    },
  ];

  const columns = allColumns.filter((column) => {
    if (!column.key) {
      return true;
    }
    if (!tableColumnLabels.find((item) => item.value === column.key)) {
      return true;
    }
    return visibleColumnKeys.includes(String(column.key));
  });

  return (
    <PageContainer
      className={styles.cardIdentifierPage}
      header={{
        title: '卡标识管理',
        subTitle: '通信管理下的静态卡片管理页，当前包含页签切换、筛选、表格、分页和操作占位。',
      }}
    >
      <div className={styles.pageTabs}>
        <Tabs
          activeKey={activeTab}
          items={[
            { key: 'normal', label: tabLabels.normal },
            { key: 'nb', label: tabLabels.nb },
            { key: 'pool', label: tabLabels.pool },
          ]}
          onChange={(key) => {
            setActiveTab(key as CardTabKey);
            setSelectedRowKeys([]);
          }}
        />
      </div>

      <div className={styles.headerCard}>
        <div className={styles.searchGrid}>
          <Input
            allowClear
            placeholder="iccid、卡号、卡板编号、备注"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
          <Select
            options={statusOptions}
            value={statusFilter}
            onChange={setStatusFilter}
          />
          <Select
            options={operatorOptions}
            value={operatorFilter}
            onChange={setOperatorFilter}
          />
          <Select
            options={projectOptions}
            value={projectFilter}
            onChange={setProjectFilter}
          />
          <Select
            options={statisticOptions}
            value={statisticFilter}
            onChange={setStatisticFilter}
          />
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={() => message.success('已按静态条件刷新列表')}
          >
            搜索
          </Button>
          <Button
            onClick={() => {
              setKeyword('');
              setStatusFilter('all');
              setOperatorFilter('all');
              setProjectFilter('all');
              setStatisticFilter('all');
              message.info('已重置筛选条件');
            }}
          >
            重置
          </Button>
          <Button onClick={() => handleToolbarAction('高级搜索')}>
            高级搜索
          </Button>
        </div>
      </div>

      <div className={styles.toolbarCard}>
        <div className={styles.toolbarRow}>
          <div className={styles.toolbarActions}>
            <Dropdown
              menu={{
                items: ['批量续期', '批量导出', '批量停复机'].map((label) => ({
                  key: label,
                  label,
                })),
                onClick: ({ key }) => handleToolbarAction(String(key)),
              }}
            >
              <Button>
                批量操作 <DownOutlined />
              </Button>
            </Dropdown>
            {[
              '分配卡号',
              '回拨卡号',
              '用卡需求',
              '发送短信',
              '手机绑定',
              '查看到期卡',
            ].map((label) => (
              <Button key={label} onClick={() => handleToolbarAction(label)}>
                {label}
              </Button>
            ))}
            <Dropdown
              menu={{
                items: ['导出当前页', '导出全部结果'].map((label) => ({
                  key: label,
                  label,
                  icon: <ExportOutlined />,
                })),
                onClick: ({ key }) => handleToolbarAction(String(key)),
              }}
            >
              <Button>
                导出 <DownOutlined />
              </Button>
            </Dropdown>
          </div>
          <Space size={12}>
            <span className={styles.toolbarMeta}>
              当前数据：<strong>{filteredRecords.length}</strong> 条；已选择{' '}
              <strong>{selectedRowKeys.length}</strong> 条
            </span>
            <Popover
              trigger="click"
              content={
                <Checkbox.Group
                  className={styles.columnManager}
                  options={tableColumnLabels.map((item) => ({
                    label: item.label,
                    value: item.value,
                  }))}
                  value={visibleColumnKeys}
                  onChange={(values) =>
                    setVisibleColumnKeys(values.map((value) => String(value)))
                  }
                />
              }
            >
              <Button>
                表头管理 <DownOutlined />
              </Button>
            </Popover>
          </Space>
        </div>
      </div>

      <div className={styles.panelCard}>
        <ProTable<CardRecord>
          className={styles.tableWrap}
          rowKey="id"
          search={false}
          cardBordered
          columns={columns}
          dataSource={filteredRecords}
          scroll={{ x: 2200 }}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          tableAlertRender={false}
          tableAlertOptionRender={false}
          options={false}
        />
      </div>

      <Drawer
        width={720}
        open={detailOpen}
        title={detailRecord ? `卡片详情 · ${detailRecord.iccid}` : '卡片详情'}
        onClose={() => setDetailOpen(false)}
      >
        {detailRecord ? (
          <>
            <div className={styles.detailGrid}>
              {[
                ['ICCID', detailRecord.iccid],
                ['MSISDN', detailRecord.msisdn],
                ['IMEI', detailRecord.imei],
                ['eSIM', detailRecord.esim],
                ['卡状态', detailRecord.cardStatusText],
                ['运营商', detailRecord.operator],
                ['关联项目', detailRecord.project],
                ['关联设备', detailRecord.deviceName],
                ['服务套餐', detailRecord.packageName],
                ['流量池', detailRecord.poolName],
                ['生效日期', detailRecord.effectiveDate],
                ['失效日期', detailRecord.expireDate],
                ['短信状态', detailRecord.smsStatus],
                ['当前区域', detailRecord.region],
                ['卡属性', detailRecord.cardAttr],
                ['备注', detailRecord.remark],
              ].map(([label, value]) => (
                <div key={label} className={styles.detailItem}>
                  <div className={styles.detailLabel}>{label}</div>
                  <div className={styles.detailValue}>{value}</div>
                </div>
              ))}
            </div>

            <Row gutter={[12, 12]} style={{ marginTop: 20 }}>
              {[
                '续期',
                '加油包',
                '停机保号',
                '自主注销',
                '短信发送',
                '申请解绑',
              ].map((label) => (
                <Col key={label}>
                  <Button onClick={() => handleToolbarAction(`${label}（详情）`)}>
                    {label}
                  </Button>
                </Col>
              ))}
            </Row>
          </>
        ) : null}
      </Drawer>
    </PageContainer>
  );
};

export default CardIdentifierManagementPage;
