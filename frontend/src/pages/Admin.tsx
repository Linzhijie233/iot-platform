import type { ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import { PlusOutlined } from '@ant-design/icons';
import { App, Button, Card, Col, Input, Row, Select, Space, Statistic, Tag } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import {
  type UserItem,
  createUser,
  listUsers,
  removeUser,
  updateUser,
} from '@/services/platform/users';

type Role = UserItem['role'];

const ROLE_COLOR: Record<Role, string> = {
  超级管理员: 'red',
  运营: 'blue',
  财务: 'green',
  只读: 'default',
};
const ROLES: Role[] = ['超级管理员', '运营', '财务', '只读'];

const AdminPage: React.FC = () => {
  const { message, modal } = App.useApp();
  const [records, setRecords] = useState<UserItem[]>([]);
  const [keyword, setKeyword] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<UserItem>();

  const refresh = async () => {
    try {
      const res = await listUsers();
      setRecords((res.data as UserItem[]) ?? []);
    } catch {
      /* ignore */
    }
  };
  useEffect(() => {
    refresh();
  }, []);

  const stats = useMemo(
    () => ({
      total: records.length,
      enabled: records.filter((u) => u.status === '启用').length,
      disabled: records.filter((u) => u.status === '停用').length,
      admins: records.filter((u) => u.role === '超级管理员').length,
    }),
    [records],
  );

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return records.filter((u) => {
      const matchKw = !kw || [u.username, u.name, u.email, u.phone].join('|').toLowerCase().includes(kw);
      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      const matchStatus = statusFilter === 'all' || u.status === statusFilter;
      return matchKw && matchRole && matchStatus;
    });
  }, [keyword, records, roleFilter, statusFilter]);

  const toggleStatus = async (u: UserItem) => {
    await updateUser(u.id, { status: u.status === '启用' ? '停用' : '启用' });
    message.success(u.status === '启用' ? '已停用' : '已启用');
    refresh();
  };
  const handleDelete = (u: UserItem) => {
    if (u.username === 'admin') {
      message.warning('超级管理员 admin 不可删除');
      return;
    }
    modal.confirm({
      title: '确认删除该用户？',
      content: `用户名：${u.username}（${u.name}）`,
      okType: 'danger',
      onOk: async () => {
        await removeUser(u.id);
        message.success('已删除');
        refresh();
      },
    });
  };

  const columns: ProColumns<UserItem>[] = [
    { title: '用户名', dataIndex: 'username', width: 130 },
    { title: '姓名', dataIndex: 'name', width: 120 },
    { title: '角色', dataIndex: 'role', width: 120, render: (_, u) => <Tag color={ROLE_COLOR[u.role]}>{u.role}</Tag> },
    { title: '状态', dataIndex: 'status', width: 90, render: (_, u) => <Tag color={u.status === '启用' ? 'success' : 'default'}>{u.status}</Tag> },
    { title: '手机号', dataIndex: 'phone', width: 130 },
    { title: '邮箱', dataIndex: 'email', width: 220, ellipsis: true },
    { title: '最近登录', dataIndex: 'lastLoginTime', width: 160 },
    { title: '备注', dataIndex: 'remark', ellipsis: true },
    {
      title: '操作',
      width: 180,
      fixed: 'right',
      render: (_, u) => (
        <Space size={4}>
          <a onClick={() => { setEditing(u); setFormOpen(true); }}>编辑</a>
          <a onClick={() => toggleStatus(u)}>{u.status === '启用' ? '停用' : '启用'}</a>
          <a onClick={() => handleDelete(u)}>删除</a>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer
      header={{
        title: '用户管理',
        subTitle: '平台账号、角色与状态管理（数据来自后端 /api/v1/users，支持新增 / 编辑 / 启停 / 删除）。',
        extra: [
          <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(undefined); setFormOpen(true); }}>
            新增用户
          </Button>,
        ],
      }}
    >
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} lg={6}><Card variant="borderless"><Statistic title="用户总数" value={stats.total} /></Card></Col>
        <Col xs={12} lg={6}><Card variant="borderless"><Statistic title="启用" value={stats.enabled} valueStyle={{ color: '#52c41a' }} /></Card></Col>
        <Col xs={12} lg={6}><Card variant="borderless"><Statistic title="停用" value={stats.disabled} valueStyle={{ color: '#8c8c8c' }} /></Card></Col>
        <Col xs={12} lg={6}><Card variant="borderless"><Statistic title="管理员" value={stats.admins} valueStyle={{ color: '#f5222d' }} /></Card></Col>
      </Row>

      <Card variant="borderless">
        <Space wrap style={{ marginBottom: 16 }}>
          <Input.Search allowClear placeholder="用户名 / 姓名 / 邮箱 / 手机号" style={{ width: 240 }} value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          <Select
            value={roleFilter}
            style={{ width: 140 }}
            onChange={setRoleFilter}
            options={[{ label: '全部角色', value: 'all' }, ...ROLES.map((r) => ({ label: r, value: r }))]}
          />
          <Select
            value={statusFilter}
            style={{ width: 120 }}
            onChange={setStatusFilter}
            options={[{ label: '全部状态', value: 'all' }, { label: '启用', value: '启用' }, { label: '停用', value: '停用' }]}
          />
        </Space>
        <ProTable<UserItem>
          rowKey="id"
          search={false}
          options={false}
          columns={columns}
          dataSource={filtered}
          scroll={{ x: 1300 }}
          pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 个用户` }}
          tableAlertRender={false}
        />
      </Card>

      <ModalForm<UserItem>
        key={editing?.id ?? 'create'}
        title={editing ? `编辑用户 · ${editing.username}` : '新增用户'}
        open={formOpen}
        onOpenChange={setFormOpen}
        grid
        rowProps={{ gutter: 16 }}
        modalProps={{ destroyOnClose: true }}
        initialValues={editing ?? { role: '运营', status: '启用', lastLoginTime: '--' }}
        onFinish={async (values) => {
          try {
            if (editing) await updateUser(editing.id, values);
            else await createUser(values);
            message.success(editing ? '已保存' : '已新增用户');
            setFormOpen(false);
            refresh();
            return true;
          } catch {
            message.error('提交失败');
            return false;
          }
        }}
      >
        <ProFormText name="username" label="用户名" colProps={{ span: 12 }} rules={[{ required: true }]} disabled={Boolean(editing)} />
        <ProFormText name="name" label="姓名" colProps={{ span: 12 }} rules={[{ required: true }]} />
        <ProFormSelect name="role" label="角色" colProps={{ span: 12 }} options={ROLES.map((r) => ({ label: r, value: r }))} rules={[{ required: true }]} />
        <ProFormSelect name="status" label="状态" colProps={{ span: 12 }} options={[{ label: '启用', value: '启用' }, { label: '停用', value: '停用' }]} />
        <ProFormText name="phone" label="手机号" colProps={{ span: 12 }} />
        <ProFormText name="email" label="邮箱" colProps={{ span: 12 }} />
        <ProFormTextArea name="remark" label="备注" colProps={{ span: 24 }} />
      </ModalForm>
    </PageContainer>
  );
};

export default AdminPage;
