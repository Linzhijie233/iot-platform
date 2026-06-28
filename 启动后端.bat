@echo off
chcp 65001 >nul
title IoT 后端服务 - 一键启动器
cd /d "%~dp0backend"

echo ============================================================
echo   物联网卡平台 - 后端(NestJS) 一键启动
echo   目录: %cd%
echo ============================================================
echo.

REM 1) 已在运行则直接打开接口文档
powershell -NoProfile -Command "if(Test-NetConnection localhost -Port 3000 -InformationLevel Quiet){exit 0}else{exit 1}"
if %errorlevel%==0 (
  echo [√] 后端已在运行，打开接口文档...
  start "" http://localhost:3000/docs
  timeout /t 4 >nul
  exit /b
)

REM 2) 首次缺依赖则安装
if not exist node_modules (
  echo [i] 首次运行，安装后端依赖（约 1-3 分钟）...
  call pnpm install
)

REM 3) 启动后端（新窗口，关闭即停止；无 MongoDB 会自动用内存存储）
echo [i] 正在启动后端（端口 3000），首次编译约 10-30 秒...
echo     ^(新弹出的黑窗口请勿关闭；无需安装 MongoDB 也能演示^)
echo.
start "IoT 后端服务(请勿关闭此窗口)" cmd /k pnpm run dev

REM 4) 等端口就绪后打开 Swagger 接口文档
powershell -NoProfile -Command "Write-Host '等待后端就绪...'; for($i=0;$i -lt 90;$i++){ if(Test-NetConnection localhost -Port 3000 -InformationLevel Quiet){break}; Start-Sleep -Seconds 1 }; Start-Process 'http://localhost:3000/docs'"

echo.
echo [√] 已打开接口文档 http://localhost:3000/docs
echo     停止后端: 关闭标题为 "IoT 后端服务" 的那个窗口。
timeout /t 6 >nul
exit /b
