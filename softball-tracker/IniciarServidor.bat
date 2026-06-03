@echo off
title Servidor Softball Tracker
echo ========================================================
echo   Torneo De Laurentis - Iniciar Servidor Local de Pagos
echo ========================================================
echo.
echo Verificando instalacion de Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python no esta instalado en este sistema o no esta en el PATH.
    echo Por favor instala Python para poder correr el servidor local.
    echo Mientras tanto, puedes seguir usando el sistema abriendo 'index.html' directamente,
    echo pero los cambios se guardaran solo en el navegador.
    echo.
    pause
    exit /b
)

echo.
echo Iniciando el servidor local de base de datos...
echo Este comando mantendra la ventana abierta. 
echo Para detener el servidor, simplemente cierra esta ventana o presiona Ctrl+C.
echo.
echo Abriendo aplicacion en el navegador...
start "" "http://localhost:8000"
echo.

cd /d "%~dp0"
python server.py

if %errorlevel% neq 0 (
    echo.
    echo Hubo un error al iniciar el servidor local. 
    echo Verifica que no haya otra ventana de este servidor abierta.
    pause
)
