@echo off
title Servidor Local - Softball Tracker
echo ===================================================
echo     INICIANDO SERVIDOR LOCAL - SOFTBALL TRACKER
echo ===================================================
echo.

:: Verificar si Node.js está instalado en el sistema
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ALERTA] Node.js no esta instalado en este equipo.
    echo Para que todas las funciones de seguridad (como las contrasenias)
    echo funcionen correctamente, se requiere un servidor web local.
    echo.
    echo Intentando buscar Python como alternativa...
    where python >nul 2>nul
    if %errorlevel% equ 0 (
        echo [OK] Python detectado. Iniciando servidor alternativo seguro...
        start "" "http://localhost:8000"
        python server.py
        goto end
    )
    
    echo [ADVERTENCIA] No se detecto Node.js ni Python en el sistema.
    echo Se abrira el archivo directamente en el navegador.
    echo Nota: Algunas funciones de contrasenia podrian no funcionar sobre file://
    echo.
    start "" "index.html"
    pause
    goto end
)

echo [OK] Node.js detectado.
echo Iniciando servidor en http://localhost:8080...
echo (Puedes cerrar esta ventana de la terminal si deseas detener el servidor).
echo.

:: Abrir el navegador por defecto directamente en la dirección local
start "" "http://localhost:8080"

:: Correr nuestro archivo de servidor local de Node.js
node server.js

:end
