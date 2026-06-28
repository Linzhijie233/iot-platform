@echo off
chcp 65001 >nul
title IoT 物联网卡平台 - 一键启动器
cd /d "%~dp0frontend"

echo ============================================================
echo   物联网卡管理平台 - 前端演示 一键启动
echo   目录: %cd%
echo ============================================================
echo.

REM 1) 先检测 8000 端口是否已有服务在运行
powershell -NoProfile -Command "if(Test-NetConnection localhost -Port 8000 -InformationLevel Quiet){exit 0}else{exit 1}"
if %errorlevel%==0 (
  echo [√] 检测到服务已在运行，直接打开浏览器...
  start "" http://localhost:8000
  echo.
  echo 已为你打开 http://localhost:8000 ，本窗口可关闭。
  timeout /t 5 >nul
  exit /b
)

REM 2) 未运行则启动开发服务器（在新窗口，关闭该窗口即停止服务）
echo [i] 正在启动开发服务器，首次编译约 20-40 秒，请耐心等待...
echo     ^(启动后会自动打开浏览器；那个新弹出的黑窗口请勿关闭^)
echo.
start "IoT 前端服务(请勿关闭此窗口)" cmd /k pnpm start

REM 3) 轮询等待端口就绪，就绪后自动打开浏览器
powershell -NoProfile -Command "Write-Host '等待服务就绪...'; for($i=0;$i -lt 90;$i++){ if(Test-NetConnection localhost -Port 8000 -InformationLevel Quiet){ break }; Start-Sleep -Seconds 1 }; Start-Process 'http://localhost:8000'"

echo.
echo [√] 已打开浏览器 http://localhost:8000
echo     若页面空白，等几秒后刷新即可。
echo     停止服务: 关闭标题为 "IoT 前端服务" 的那个窗口。
timeout /t 8 >nul
exit /b
