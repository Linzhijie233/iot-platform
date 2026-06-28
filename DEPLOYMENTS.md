# 部署说明（DEPLOYMENTS.md）

物联网卡管理平台（NestJS 后端单进程托管 UmiJS/AntDesignPro 前端 + `/api`；Mongo 连不上自动回退内存；`backend/src/main.ts` 读 `process.env.PORT` 并绑定 `0.0.0.0`）部署到**速桥云 GPU 云主机**实例 `Internet-of-Things`。

> 维护约定：本文件记录可复用的部署方法与平台坑，每次部署更新顶部「当前实例 / 状态」。

## 当前实例 / 状态（2026-06-29）

- **Pod**：`lease-26cb9613`（主机名 `lease-26cb9613-cb769669b-vx25v`），节点 worker01
- **Namespace**：`gpelease-user-0457d26d`
- **资源**：16 核 / 32Gi 内存 / 100Gi 存储 / 无 GPU
- **服务端口**：`30749` ｜ **SSH**：`219.133.7.139:32617`
- **状态**：✅ **容器内部署成功**（pm2 进程 `iot` online，`127.0.0.1:30749` → HTTP 200）；⚠️ **公网 `http://219.133.7.139:30749` 仍超时不通**——平台未把公网流量路由进本 Pod，待平台客服修复。

历史实例：第一个 Pod `lease-d9d074ad-…`，端口 30672，SSH 30899（已废）。

## 架构

- **单进程**：NestJS（`dist/main.js`）在 `$PORT` 同时托管前端构建产物（`frontend/dist`）与 `/api` 接口，无需 nginx / 额外端口。
- **进程管理**：pm2，进程名 `iot`。
- **构建/启动**：项目自带 `deploy.sh`（装 Node→pnpm 装+构建前后端→pm2 启动；接受 `PORT` 环境变量）。

## 仓库

- **源码仓库（干净）**：`https://github.com/Linzhijie233/iot-platform`
- **部署脚手架仓库**：`https://github.com/Linzhijie233/iot-platform-main`
  - `run.sh` —— 引导脚本（python3 强制 IPv4 装 Node v20.18.0 → 下载解压源码 → 跑 `deploy.sh`，端口 30749）
  - `iot-src-nosecret.tar.gz` —— 无密钥源码包（剔除 `node_modules`/`dist`/`.git`/`backend/.env`/项目资料，约 0.34MB / 341 文件）
  - `README.md` —— 一键命令

## 平台坑（务必知晓）

1. **公网端口常不转发进 Pod**：公网 IP 的服务口与 SSH 口 **TCP 能连（边缘网关接受），但流量不进容器** —— 表现为 SSH「banner exchange 超时」、HTTP 超时或 502。**纯平台侧路由问题，外部（SSH/HTTP）都进不去**，必须找客服修或重建实例。
2. **唯一可靠部署通道 = 浏览器「容器终端」**（平台控制台直连 Pod，绕过坏掉的公网代理）。SSH 不可用时只能用它。
3. **网页终端有粘贴 bug**：长命令/多段 `&&` 易被截断或重复，**只粘单行命令**最稳。
4. **容器是最小化镜像**：有 `python3`/`bash`/`tar`，**无 `curl`/`wget`/`git`/`ss`**；**无 IPv6 路由**（直连 npmmirror 会 `ENETUNREACH`，必须强制 IPv4）；仅可访问白名单（npmmirror、raw.githubusercontent、jsdelivr、gitee、aliyun、pypi）。
   - 因此 `run.sh` 用 python3 下载（强制 IPv4）并 `export NODE_OPTIONS=--dns-result-order=ipv4first` 让 npm/pnpm 走 IPv4。
   - `deploy.sh` 末尾的 `curl` 自测会报 `curl: command not found`，**无害**（有 `|| true` 兜底）。

## 一键（重新）部署

在平台的「容器终端」里粘**这一行**回车（自动：下载 `run.sh` → 后台运行）：

```
python3 -c "import socket,ssl,os,urllib.request as u;_o=socket.getaddrinfo;socket.getaddrinfo=lambda *a,**k:[x for x in _o(*a,**k) if x[0]==socket.AF_INET];c=ssl._create_unverified_context();open('/root/run.sh','wb').write(u.urlopen(u.Request('https://raw.githubusercontent.com/Linzhijie233/iot-platform-main/main/run.sh',headers={'User-Agent':'M'}),timeout=90,context=c).read());os.system('nohup bash /root/run.sh >/root/run.log 2>&1 &');print('STARTED')"
```

- 看进度：`tail -n 25 /root/run.log`（整体约 3–8 分钟；前端构建最慢）
- 完成标志：日志出现 `部署完成` + `[PM2] Done`，`pm2 status` 里 `iot` 为 `online`
- 容器内自测（返回 `200` 即成功）：

```
python3 -c "import urllib.request as u;print('HTTP', u.urlopen('http://127.0.0.1:30749/',timeout=5).status)"
```

### 换端口

平台分配的服务端口若变化：部署前 `export PORT=新端口` 再跑，或改 `run.sh` 顶部 `PORT=` 并重推脚手架仓库。

## 运维

- **日志**：`/root/run.log`（部署引导）、`pm2 logs iot`（应用）
- **进程**：`pm2 status` / `pm2 restart iot` / `pm2 delete iot`
- **源码路径**：`/root/iot-platform`；**Node**：`/opt/node-v20.18.0-linux-x64`
- **运营商真实密钥**：源码包已剔除 `backend/.env`（含 OneLink/CMP 密钥）。如需对接真实运营商接口，另把 `.env` 私密贴入 `/root/iot-platform/backend/.env` 后 `pm2 restart iot`。

## 公网不可用排查

容器内 200、公网超时/502 = 平台反向代理未指向本 Pod。**容器内无需任何操作**，找速桥云客服：

> 实例 Internet-of-Things，Pod `lease-26cb9613`，服务端口 `30749`：公网 `http://219.133.7.139:30749` TCP 可连但请求超时，容器内 `127.0.0.1:30749` 正常返回 200，确认是端口转发/反向代理未指向本 Pod，请修复路由。
