# 物联网卡管理平台 · 前端

多运营商（移动 / 联通 / 电信）物联网卡 + 设备 + 服务 + 财务统一管理平台的前端工程。

- 技术栈：UmiJS Max 4 + React 19 + Ant Design 5
- 包管理：pnpm（Node ≥ 20）
- 端口：`8000`（开发服务器）
- 后端：同仓库 `../backend`（端口 `3000`，接口前缀 `/api`，开发时经代理转发）

## 安装依赖

```bash
pnpm install
```

## 启动开发服务器

```bash
pnpm start
```

启动后访问 http://localhost:8000 （默认进入「数据看板」）。

## 构建生产包

```bash
pnpm build
```

## 代码检查

```bash
pnpm lint        # 代码风格检查
pnpm tsc         # 类型检查
pnpm test        # 单元测试
```
