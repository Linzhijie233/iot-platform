import { PlusOutlined } from '@ant-design/icons';
import {
  App,
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Switch,
  Table,
} from 'antd';
import React, { useState } from 'react';
import styles from '../index.less';

type Props = {
  open: boolean;
  poolName?: string;
  onClose: () => void;
};

type ConfigRecord = {
  key: string;
  type: string;
  usageRate: number;
  relation: string;
  remainMinutes: number;
  quantity: number;
  packageName: string;
  price: string;
  enabled: boolean;
};

const baseRows: ConfigRecord[] = [
  {
    key: 'default',
    type: '通用配置（日常）',
    usageRate: 70,
    relation: '无',
    remainMinutes: 0,
    quantity: 1,
    packageName: '100分钟语音池加油包',
    price: '￥ 100',
    enabled: true,
  },
];

const AutoRenewPoolModal: React.FC<Props> = ({ open, poolName, onClose }) => {
  const { message } = App.useApp();
  const [enabled, setEnabled] = useState(false);
  const [rows, setRows] = useState(baseRows);

  const columns = [
    {
      title: '类型',
      dataIndex: 'type',
      width: 180,
      render: (value: string) => value,
    },
    {
      title: '已使用率（%）',
      dataIndex: 'usageRate',
      width: 180,
      render: (_: number, record: ConfigRecord) => (
        <InputNumber
          controls={false}
          min={0}
          style={{ width: 140 }}
          value={record.usageRate}
          onChange={(value) =>
            setRows((list) =>
              list.map((item) =>
                item.key === record.key ? { ...item, usageRate: Number(value || 0) } : item,
              ),
            )
          }
        />
      ),
    },
    {
      title: '关系',
      dataIndex: 'relation',
      width: 140,
      render: (_: string, record: ConfigRecord) => (
        <Select
          options={[
            { label: '无', value: '无' },
            { label: '并且', value: '并且' },
            { label: '或者', value: '或者' },
          ]}
          style={{ width: 110 }}
          value={record.relation}
          onChange={(value) =>
            setRows((list) =>
              list.map((item) => (item.key === record.key ? { ...item, relation: value } : item)),
            )
          }
        />
      ),
    },
    {
      title: '剩余时长≤（分钟）',
      dataIndex: 'remainMinutes',
      width: 180,
      render: (_: number, record: ConfigRecord) => (
        <InputNumber
          controls={false}
          min={0}
          style={{ width: 140 }}
          value={record.remainMinutes}
          onChange={(value) =>
            setRows((list) =>
              list.map((item) =>
                item.key === record.key
                  ? { ...item, remainMinutes: Number(value || 0) }
                  : item,
              ),
            )
          }
        />
      ),
    },
    {
      title: '语音池增加',
      dataIndex: 'packageName',
      render: (_: string, record: ConfigRecord) => (
        <Space>
          <InputNumber
            controls={false}
            min={1}
            style={{ width: 76 }}
            value={record.quantity}
            onChange={(value) =>
              setRows((list) =>
                list.map((item) =>
                  item.key === record.key ? { ...item, quantity: Number(value || 1) } : item,
                ),
              )
            }
          />
          <span>*</span>
          <Select
            options={[
              { label: '100分钟语音池加油包', value: '100分钟语音池加油包' },
              { label: '500分钟语音池加油包', value: '500分钟语音池加油包' },
              { label: '1000分钟语音池加油包', value: '1000分钟语音池加油包' },
            ]}
            style={{ width: 220 }}
            value={record.packageName}
            onChange={(value) =>
              setRows((list) =>
                list.map((item) =>
                  item.key === record.key ? { ...item, packageName: value } : item,
                ),
              )
            }
          />
        </Space>
      ),
    },
    {
      title: '续池价格参考',
      dataIndex: 'price',
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      width: 100,
      render: (_: boolean, record: ConfigRecord) => (
        <Switch
          checked={record.enabled}
          onChange={(checked) =>
            setRows((list) =>
              list.map((item) => (item.key === record.key ? { ...item, enabled: checked } : item)),
            )
          }
        />
      ),
    },
    {
      title: '操作',
      dataIndex: 'action',
      width: 100,
      render: () => <a onClick={() => message.info('删除操作为静态演示')}>删除</a>,
    },
  ];

  return (
    <Modal
      destroyOnHidden
      footer={null}
      open={open}
      title="自动续池"
      width={1280}
      onCancel={onClose}
    >
      <div className={styles.autoRenewTop}>
        <span>自动续语音池加油包</span>
        <Switch checked={enabled} onChange={setEnabled} />
        {poolName ? <span style={{ color: '#64748b' }}>当前池：{poolName}</span> : null}
      </div>

      <div className={styles.noticeBox}>
        <div>注意：</div>
        <ol style={{ margin: '12px 0 0 18px', padding: 0 }}>
          <li>
            开启本功能后，语音池使用量达到所设置的条件时，会自动续费所配置的语音池叠加包，以保证所有语音池卡正常使用，不会停机；
          </li>
          <li style={{ marginTop: 8 }}>
            账户余额为负时，可能无法自动续费（按约定进行计费），因此请保证您的账户余额充足；
          </li>
        </ol>
      </div>

      <h3 className={styles.sectionTitle}>续池配置</h3>
      <div className={styles.autoRenewTable}>
        <div style={{ marginBottom: 12, textAlign: 'right' }}>
          <Button
            icon={<PlusOutlined />}
            type="primary"
            onClick={() =>
              setRows((list) => [
                ...list,
                {
                  key: `${Date.now()}`,
                  type: '新增配置',
                  usageRate: 80,
                  relation: '无',
                  remainMinutes: 0,
                  quantity: 1,
                  packageName: '100分钟语音池加油包',
                  price: '￥ 100',
                  enabled: true,
                },
              ])
            }
          >
            添加配置
          </Button>
        </div>
        <Table
          columns={columns}
          dataSource={rows}
          pagination={false}
          rowKey="key"
          scroll={{ x: 1120 }}
        />
      </div>

      <h3 className={styles.sectionTitle}>身份校验</h3>
      <Form className={styles.verifyBlock} layout="vertical">
        <Form.Item label="接收号码">
          <Space.Compact style={{ width: '100%' }}>
            <Input disabled value="13828409829" />
            <Button onClick={() => message.info('验证码发送为静态演示')}>获取验证码</Button>
          </Space.Compact>
        </Form.Item>
        <Form.Item label="验证码">
          <Input placeholder="请输入验证码" />
        </Form.Item>
      </Form>

      <div style={{ textAlign: 'right' }}>
        <Button style={{ marginRight: 12 }} onClick={onClose}>
          取消
        </Button>
        <Button
          type="primary"
          onClick={() => message.success('自动续池配置保存为静态演示')}
        >
          确定
        </Button>
      </div>
    </Modal>
  );
};

export default AutoRenewPoolModal;