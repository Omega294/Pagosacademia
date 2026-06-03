@echo off
title Servidor Local - Academia Pro (Python)
echo ========================================================
echo   Academia Pro - Iniciar Servidor Local de Pagos (Python)
echo ========================================================
echo.
echo Verificando instalacion de Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python no esta instalado o no esta en el PATH.
    pause
    exit /b
)

echo.
echo Iniciando el servidor local de base de datos...
echo Abriendo aplicacion en el navegador...
start "" "http://localhost:8000"
echo.

cd /d "%~dp0"
python server.py

if %errorlevel% neq 0 (
    echo.
    echo Hubo un error al iniciar el servidor local.
    pause
)
