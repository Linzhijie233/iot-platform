#!/usr/bin/env bash
# 物联网卡管理平台 · 云主机一键部署
# 架构：后端 NestJS 单进程在 $PORT 同时托管前端静态页面 + /api 接口
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
PORT="${PORT:-30672}"
NODE_VER="v20.18.0"
MIRROR="https://registry.npmmirror.com"

echo "================ IoT 平台部署开始 ================"
echo "项目目录: $ROOT   监听端口: $PORT"

# ---- 1) Node ----
if ! command -v node >/dev/null 2>&1; then
  echo "[1/6] 下载安装 Node ${NODE_VER}（国内镜像）..."
  cd /opt
  curl -fL -o node.tar.gz "${MIRROR}/-/binary/node/${NODE_VER}/node-${NODE_VER}-linux-x64.tar.gz"
  tar -xzf node.tar.gz
  NODE_DIR="/opt/node-${NODE_VER}-linux-x64"
  for b in node npm npx; do ln -sf "$NODE_DIR/bin/$b" "/usr/local/bin/$b"; done
  export PATH="$NODE_DIR/bin:$PATH"
else
  echo "[1/6] Node 已存在: $(node -v)"
fi
echo "    node $(node -v)"

# ---- 2) pnpm + pm2 ----
echo "[2/6] 安装 pnpm / pm2 ..."
npm config set registry "${MIRROR}" >/dev/null 2>&1 || true
npm i -g pnpm pm2 --silent
# 把全局 bin 软链到 /usr/local/bin，确保 pnpm/pm2 在 PATH 中
NPMBIN="$(npm prefix -g)/bin"
for b in pnpm pm2; do [ -f "$NPMBIN/$b" ] && ln -sf "$NPMBIN/$b" "/usr/local/bin/$b" || true; done
export PATH="$NPMBIN:$PATH"
pnpm config set registry "${MIRROR}" >/dev/null 2>&1 || true
echo "    pnpm $(pnpm -v)"

export HUSKY=0

# ---- 3) 后端 ----
echo "[3/6] 安装+构建 后端 ..."
cd "${ROOT}/backend"
pnpm install
pnpm build

# ---- 4) 前端 ----
echo "[4/6] 安装+构建 前端（较慢，请耐心 2-5 分钟）..."
cd "${ROOT}/frontend"
pnpm install
NODE_OPTIONS=--max-old-space-size=4096 pnpm build

# ---- 5) 启动 ----
echo "[5/6] 启动服务（pm2，端口 ${PORT}）..."
cd "${ROOT}/backend"
pm2 delete iot >/dev/null 2>&1 || true
PORT=${PORT} pm2 start dist/main.js --name iot
pm2 save >/dev/null 2>&1 || true

# ---- 6) 自测 ----
echo "[6/6] 自测 ..."
sleep 4
curl -s -o /dev/null -w "    本地自测 http://localhost:${PORT}/ -> HTTP %{http_code}\n" "http://localhost:${PORT}/" || true
curl -s -o /dev/null -w "    接口自测 /api/cards -> HTTP %{http_code}\n" "http://localhost:${PORT}/api/cards" || true
echo "================ 部署完成 ================"
echo "外网访问: http://219.133.7.139:${PORT}"
pm2 status || true
