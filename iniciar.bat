@echo off
title Examen Parcial - Servidor
cd /d "%~dp0"
set "PATH=%SystemRoot%\System32;%SystemRoot%;%PATH%"

rem Buscar Node.js (instalacion portable o normal)
set "NODEDIR="
for %%D in ("C:\Herramientas\nodejs" "%ProgramFiles%\nodejs" "%ProgramFiles(x86)%\nodejs" "%LOCALAPPDATA%\Programs\nodejs" "%NVM_SYMLINK%") do (
  if not defined NODEDIR if exist "%%~D\node.exe" set "NODEDIR=%%~D"
)
rem Version portable dentro de una subcarpeta (ej. C:\Herramientas\nodejs\node-v24...-win-x64)
if not defined NODEDIR for /d %%S in ("C:\Herramientas\nodejs\node-*") do (
  if not defined NODEDIR if exist "%%~S\node.exe" set "NODEDIR=%%~S"
)
if defined NODEDIR set "PATH=%NODEDIR%;%PATH%"

node -v
if errorlevel 1 (
  echo.
  echo No se encontro Node.js en este equipo.
  echo Descargue e instale la version LTS desde https://nodejs.org
  pause
  exit /b
)

if not exist node_modules (
  echo Instalando dependencias...
  call npm install
)

start "" /min cmd /c "timeout /t 5 & start http://localhost:3000"
echo.
echo Servidor iniciando en http://localhost:3000  (no cierre esta ventana)
call npm start
pause
