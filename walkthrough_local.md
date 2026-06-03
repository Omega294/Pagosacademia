# Guía de Persistencia Local Física - Centro Académico Pro

Hemos configurado de forma completa y segura tu sistema principal de contabilidad académica ubicado en la raíz de **`C:\App\Pagos academia\`** para que funcione de manera local y guarde permanentemente todos tus cambios directamente en tu PC en el archivo `academy_data.json`.

---

## Estructura Local Creada en la Raíz (`C:\App\Pagos academia\`)

1. **Lanzadores Ejecutables (Doble Clic)**:
   - **`iniciar_sistema.bat`**: Tu nuevo archivo principal de inicio en Windows. Busca si tienes Node.js, arranca el servidor en el puerto `8080` y abre automáticamente tu navegador web. Si no tienes Node, buscará Python como alternativa para que el sistema nunca deje de funcionar.
   - **`IniciarServidor.bat`**: Lanzador exclusivo de Python que arranca la aplicación en el puerto `8000`.

2. **Servidores Web de Soporte (Persistencia Física)**:
   - **`server.js` (Node.js)**: Servidor local en JavaScript que lee y escribe tus datos directamente en el archivo `academy_data.json`. Crea un respaldo automático (`academy_data.json.bak`) cada vez que guardas datos para evitar accidentes.
   - **`server.py` (Python)**: Servidor local homólogo con cero dependencias en Python, listo para tomar el relevo de forma transparente si lo necesitas.

3. **Base de Datos Física**:
   - **`academy_data.json`**: El archivo físico real donde se guardarán todos tus alumnos, recibos de caja, métricas de dashboard, tasa de cambio fijada y precios del catálogo maestro. Ya está creado en tu carpeta con la configuración inicial por defecto.

---

## Mejoras en la Interfaz de la Academia (`index.html`)

- **LEDs de Estado en Pantalla**:
  - En la **pantalla de Inicio de Sesión** hemos colocado un indicador LED visual y texto de estado que te avisará si el servidor local de tu PC está encendido y conectado antes de que ingreses tu contraseña.
  - En la **barra lateral de Métricas** (debajo de la tasa de cambio) añadimos un indicador LED "Local PC" que se mantendrá encendido en verde (`Local PC Activo ✓`) indicando que todo lo que registres se está guardando físicamente en tu disco duro.
  - Si por alguna razón el servidor está apagado, el LED pasará a rojo (`Modo Navegador`) y el sistema usará de forma segura el almacenamiento local del navegador para no interrumpir tu trabajo.

- **Migración Automática de Datos**:
  - Si ya tenías alumnos o cobros cargados anteriormente en el navegador, la primera vez que arranques tu servidor local a través del archivo `.bat`, el sistema detectará que el archivo de la PC está vacío y **migrará de forma automática todos tus datos del navegador al disco duro de tu computadora** para que no pierdas ningún registro de trabajo.

---

## Nuevo Módulo: Registro de Egresos y Caja Neta (Mejorado v3.1)

Hemos agregado e integrado de forma completa el control diario de **Egresos (Gastos)**. Este módulo te permite llevar una contabilidad sumamente exacta y transparente con las siguientes características premium:

1. **Pestaña "Egresos"**:
   - En la barra de navegación lateral cuentas con el módulo de **Egresos**.
   - Haz clic en **"NUEVO EGRESO"** para abrir el formulario de registro rápido.
   - **Visual Selector de Chips (Botones de Selección Rápida)**: El selector clásico de lista desplegable ha sido reemplazado por botones (chips) visualmente elegantes con estilo de vidrio rojo.
   - **Distribución en 2 Columnas Estilo Dashboard**: Optimizamos el espacio de pantalla ajustando el modal para que sea **más ancho (760px max) y más bajo**. Colocamos los inputs de datos del gasto del lado izquierdo, la rejilla de selección de chips del lado derecho y los botones de acción cruzando toda la base. Esto aprovecha la pantalla de manera óptima y fluida. En móviles, se adapta automáticamente en formato de una sola columna.
   - **Gasto Variable (Por Defecto)**: Seleccionado por defecto para ingresar de forma manual una descripción, el monto personalizado y la moneda de pago (**USD o BS**).
   - **Gastos Fijos con Multiplicador y Override Manual**: Al presionar cualquier chip de gasto fijo (ej: *Ticket de Estacionamiento*), se activan controles avanzados donde puedes:
     - Indicar la **Cantidad** pagada.
     - **Ajustar Manualmente** el costo unitario directamente en el formulario antes de guardar (por si el precio de ese día varió y requiere un ajuste inmediato).
     - Ver un resumen en tiempo real del cálculo total en USD o BS (según la tasa del día).
   - **Concepto Dinámico "10% Ingresos del Día"**: Hemos añadido un concepto especial inteligente en el catálogo. Cuando seleccionas el chip de **"10% Ingresos del Día"** en el modal, el sistema de forma instantánea suma todos los cobros de caja registrados en la fecha de hoy, calcula de manera exacta el **10% de ese total en USD** y pre-completa el costo unitario con este monto de forma totalmente automática. Aún cuentas con la opción de ajustarlo manualmente si es necesario antes de registrarlo.

2. **Catálogo de Gastos Fijos (Restricción Múltiplos de 5)**:
   - Administra tu catálogo de gastos constantes en la pestaña **Precios**.
   - Para mantener una contabilidad sana y estructurada, el sistema ahora **valida y exige obligatoriamente** que los precios agregados o modificados en el catálogo de gastos fijos sean **números exactos múltiplos de 5 en USD** (ej: $5, $10, $15, $25, $50). El concepto de "10% Ingresos del Día" posee un costo base de `$10.00` en el catálogo para cumplir perfectamente con esta regla, pero calcula tu 10% real al momento del registro.

3. **Caja Neta en Cierres**:
   - Al realizar un **Cierre Diario** o **Cierre Mensual** en la pestaña **Cierres**, el sistema no solo sumará tus ingresos, sino que buscará automáticamente todos los gastos registrados en ese mismo período.
   - En el reporte en pantalla verás un desglose completo:
     - **Ingresos Totales**: Dinero recibido por cobros.
     - **Gastos Totales**: Dinero total restado.
     - **Caja Neta**: La utilidad real restante (**Ingresos - Gastos**). Se mostrará resaltada en color verde premium si tu saldo es positivo o en rojo de advertencia si es negativo.
     - **Desglose Detallado**: Al final del reporte aparecerá una sección llamada **"Desglose de Egresos / Gastos"** listando cada gasto registrado con su respectiva fecha, descripción y monto para que puedas corroborar el cuadre físico de tu caja.

---

## ¿Cómo iniciar el Centro Académico Pro hoy?

1. Abre tu carpeta en la PC: **`C:\App\Pagos academia\`**.
2. Haz doble clic en el archivo **`iniciar_sistema.bat`** (la opción recomendada que utiliza Node.js).
3. Se abrirá la ventana negra de comandos y se iniciará tu navegador automáticamente en la dirección:
   👉 **`http://localhost:8080`**
4. Ingresa con tu clave de siempre (por ejemplo `admin123`).
5. ¡Listo! Verás el LED verde encendido en tu barra lateral y todo cambio (estudiantes, recibos o gastos) se escribirá físicamente en `academy_data.json` de inmediato.
