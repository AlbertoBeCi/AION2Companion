# Auditoría funcional y técnica de Kalandra

**Referencia:** [kalandra.pages.dev](https://kalandra.pages.dev/)  
**Revisión:** 16 de octubre de 2026  
**Método:** navegación del sitio público, estados accesibles, controles de formularios, observación de cambios y recarga, y lectura de recursos servidos públicamente. No se copiaron código ni recursos gráficos.

## Alcance y cautelas

La referencia es una aplicación de seguimiento manual. Los nombres de actividades, topes, horarios, valores de Odyle y cálculos descritos abajo son **lo observado en Kalandra**, no reglas de juego confirmadas por NC. El sitio no prueba por sí mismo que esos datos sean oficiales. La página también declara que ciertos horarios, como la grieta espacial, son estimados comunitarios.

La inspección cubrió las pantallas de resumen/lista, cuadrícula, personajes, configuración, recursos, creación y edición de actividades, preferencias, filtros, acciones de progreso, exportación y flujo de importación. Algunas pruebas destructivas de reinicio global y borrado de fábrica no se ejecutaron. La instalación PWA, el uso real sin conexión y las fronteras temporales durante cambios de horario no se confirmaron mediante una sesión instalada/offline.

## Interfaz y rutas observadas

- La raíz `/` presenta el tablero y alterna entre lista y matriz.
- `/#settings` abre la configuración. Los paneles de actividades, personajes y recursos se muestran en diálogos.
- El primer estado observado tenía un Ranger principal, cinco actividades diarias y siete semanales.
- La navegación y los controles cambian entre español e inglés. El tema oscuro y claro, el modo compacto, la escala de texto y una preferencia de comodidad se guardan localmente.
- La vista móvil apila los paneles y no mostró desbordamiento horizontal del documento a 390 px ni 768 px. En escritorio las columnas diaria y semanal se sitúan en paralelo.
- La cuadrícula de varias filas de personajes conserva desplazamiento horizontal intencionado; esa variante no se midió en todas las anchuras.

## Funciones observadas

### Progreso y actividades

Cada actividad puede tener nombre, descripción, cantidad objetivo, etiquetas, ámbito de cuenta o personaje, y asignación a todos, al principal o a personajes concretos. Hay controles para ocultar una actividad en un personaje, restaurarla, reordenarla y eliminarla. Los contadores pequeños se muestran como puntos hasta seis unidades y con botones más/menos por encima; el valor uno se muestra como casilla.

Se modificó una actividad diaria de 0/5 a 5/5: la recarga conservó el valor; el filtro “Hechas” la mostró; el panel reflejó progreso de cuenta y el principal. Al cambiar a un personaje de prueba, el progreso de cuenta se compartió y se contó una vez. Una actividad personalizada se creó, incrementó, reordenó con teclado, editó y eliminó. Se probó ocultar/restaurar una tarea solo para el personaje seleccionado.

Completar el ciclo diario cambió el total visible y la acción de deshacer restauró el anterior. No se forzó el reinicio global ni el borrado de fábrica.

### Personajes

El diálogo permite crear, editar y eliminar; ofrece ocho clases y nombre limitado. Un personaje puede estar activo o inactivo; el primero es principal, puede moverse al principio y se puede seleccionar como contexto. El progreso asignado a personajes y el progreso compartido de cuenta se muestran de forma distinta.

### Recursos

La interfaz de Odyle permite registrar un saldo y una reserva, y representa una proyección temporal. La inspección del código público indicó parámetros locales de 15 unidades/3 horas, tope 560 o 840 con membresía y una reserva introducida por el usuario. Un control de membresía altera la proyección. Estas cifras proceden de la implementación de Kalandra y **no se cargan como datos de este proyecto**. No se encontró lectura de saldo desde el cliente del juego.

### Estadísticas y reinicios

La revisión del código servido atribuye el mismo peso a cada actividad completada, calcula fracciones de las columnas diaria/semanal, excluye objetivos de cuenta de los totales personales y cuenta un objetivo de cuenta una sola vez. Mantiene historial local de 30 días, racha de días con todas las tareas diarias y media sobre hasta los últimos siete días cerrados. El flujo de reinicio se revisó en el código; no se ensayaron todas las transiciones de calendario en un navegador suspendido.

La vista de configuración expone un reinicio diario 07:00 UTC y semanal miércoles 07:00 UTC; el horario local mostrado en Madrid era 09:00 en la fecha de inspección. No se confirmó que sean horarios globales oficiales de AION 2.

### Exportar, importar y guardar

El almacenamiento activo observado usa `localStorage` con claves de estado y preferencias y escucha cambios entre pestañas. El código menciona IndexedDB para la eliminación de fábrica, pero no se verificó persistencia activa mediante IndexedDB.

La exportación descargó un JSON válido de 3.919 bytes con personaje, actividades, progreso, recursos e historial; no contenía preferencias. Al intentar importar ese mismo archivo, la UI respondió “Archivo no válido: no es JSON”. El flujo mostró un mensaje genérico y no se determinó si la causa fue la selección de archivo automatizada o el propio importador. Por ello se registra como fallo observado pendiente de reproducir, no como diagnóstico confirmado.

### Atajos, PWA y seguridad observable

Hay nueve atajos configurables, con posibilidad de restaurarlos individualmente o todos. La reordenación mediante teclado se probó; el guardado de bindings no se ensayó.

El manifiesto declara una PWA standalone y el service worker precarga el shell y recursos locales, evita caché de `/api/` y usa la aplicación como fallback de navegación. El código actualiza el service worker y recarga cuando cambia el controlador, tras cerrar diálogos. Esta inspección estática no demuestra instalación ni operación offline efectivas.

El sitio marca `noindex`, `nofollow`, `noai` y `noimageai`; la CSP observada restringe scripts y conexiones al mismo origen. No se observaron pantallas de inicio de sesión ni telemetría de analítica en las rutas visitadas. El servicio se entrega desde Cloudflare; sus registros de infraestructura quedan fuera de esta auditoría.

## Arquitectura pública observable

El cliente servido es JavaScript por módulos, con lógica repartida entre archivos equivalentes a `main`, `dom`, `i18n`, `schema`, `clock`, `stats`, `store`, `settings`, `resources`, `shortcuts` y `vault`, además de hojas de estilo. No se identificó una aplicación React; el proyecto usa módulos JavaScript sin un bundle de build de aplicación declarado en el sitio inspeccionado.

Hay código para consultar `api/state`, `api/history` y `api/settings`, pero en el sitio público las llamadas se desactivan salvo cuando el hostname es localhost/loopback. La UI pública auditada es local; la presencia del código no demuestra sincronización activa.

Los estilos responden a cortes aproximados en 1.180, 900 y 640 px. Se detectaron fuentes Barlow, Barlow Semi Condensed y Marcellus con archivos de licencia OFL servidos por el sitio. No se reutilizan en Companion.

## Límites de la evidencia

1. Comportamiento verificado de Kalandra y veracidad del juego son estados independientes.
2. Las estimaciones observadas no se convierten en reglas del Companion.
3. Instalación, operación offline real, migración de almacenamiento, reinicios al cambiar de zona horaria y las fronteras suspendidas requieren comprobación adicional.
4. El error de importación necesita una reproducción manual para atribuir la causa.

Véase [inventario funcional](functional-inventory.md) y [matriz de paridad](feature-parity-matrix.md).
