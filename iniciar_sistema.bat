@echo off
title Servidor Local - Academia Pro
echo ===================================================
echo     INICIANDO SERVIDOR LOCAL - ACADEMIA PRO
echo ===================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ALERTA] Node.js no esta instalado en este equipo.
    echo Buscando Python como alternativa segura...
    echo.
    where python >nul 2>nul
    if %errorlevel% equ 0 (
        echo [OK] Python detectado. Iniciando servidor alternativo...
        start "" "http://localhost:8000"
        python server.py
        goto end
    )
    echo [ADVERTENCIA] No se detecto Node.js ni Python en el sistema.
    echo Se abrira el archivo directamente en el navegador.
    echo.
    start "" "index.html"
    pause
    goto end
)

echo [OK] Node.js detectado.
echo Iniciando servidor en http://localhost:8080...
echo (Puedes cerrar esta ventana de la terminal si deseas detener el servidor).
echo.

start "" "http://localhost:8080"
node server.js

:end
