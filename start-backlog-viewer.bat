@echo off
setlocal

cd /d "%~dp0"
title TocaAI Backlog Viewer

set "PORT=3210"
if not "%~1"=="" set "PORT=%~1"

echo.
echo [TocaAI] Backlog Viewer
echo Porta: %PORT%
echo URL: http://localhost:%PORT%/
echo.
echo Para parar o servidor, pressione Ctrl+C nesta janela.
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js nao encontrado no PATH.
  echo Instale o Node ou abra por um terminal onde o comando ^`node^` esteja disponivel.
  echo.
  pause
  exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "try { $response = Invoke-WebRequest -UseBasicParsing ('http://localhost:' + $env:PORT + '/') -TimeoutSec 2; if ($response.StatusCode -eq 200) { exit 10 } else { exit 0 } } catch { exit 0 }"
if "%errorlevel%"=="10" (
  echo Ja existe uma instancia respondendo em http://localhost:%PORT%/
  echo Feche a outra janela ou use outra porta: start-backlog-viewer.bat 4321
  echo.
  pause
  exit /b 0
)

if /i not "%NO_BROWSER%"=="1" (
  start "" powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Sleep -Seconds 2; Start-Process 'http://localhost:%PORT%/'"
)
node ".\backlog-viewer\server.js"
set "EXIT_CODE=%errorlevel%"

echo.
echo Servidor encerrado.
if not "%EXIT_CODE%"=="0" (
  echo Codigo de saida: %EXIT_CODE%
)
echo.
pause
