# Inventario funcional

El inventario describe el comportamiento que se vio en Kalandra y el alcance de la primera implementación de Companion. **“Referencia verificada” no significa “regla oficial del juego”.** La matriz enlazada registra ambos estados.

## Funciones de Kalandra observadas

| Función | Entradas | Salidas y comportamiento | Evidencia y persistencia |
|---|---|---|---|
| Resumen | Contexto de personaje, actividades y progreso | Totales, barras, estado completado y tarjetas | Se varió un contador y se observó el cambio. Se conserva tras recarga. |
| Lista/matriz | Selector de vista | Dos presentaciones del mismo conjunto | Alternancia de la raíz; sin ruta propia. |
| Actividades diarias/semanales | Nombre, descripción, objetivo, etiquetas, ámbito, asignación | Tarea manual con estado de progreso | CRUD y contador comprobados; estado en localStorage. Los límites mostrados en Kalandra no son fuente oficial. |
| Ámbito de cuenta/personaje | Selector de ámbito y lista de personajes | Progreso compartido o separado | Mismo progreso de cuenta visible al cambiar personaje; cuenta una vez en total. |
| Ocultar/restaurar | Acción por personaje | Actividad oculta en ese personaje y restaurable | Probado en personaje temporal. |
| Reordenar | Flechas/teclado y controles de arrastre | Cambia el orden de visualización | Movimiento por teclado comprobado. |
| Personajes | Nombre, clase, activo/principal | CRUD, selección y orden | Creación, selección, asignación y eliminación de personaje de prueba. |
| Recursos Odyle | Saldo, reserva, membresía | Estimación del saldo futuro | UI y fórmula pública observadas; cifras solo de Kalandra, no verificadas oficialmente. |
| Estadísticas | Historial de progreso | Totales, racha, historial y medias | Fórmulas revisadas en JavaScript; no todos los estados históricos se reprodujeron. |
| Reinicios | Hora diaria/semanal, día semanal, auto reinicio | Limpia ciclo en el borde configurado | Hora visible y lógica revisada; no prueba completa de DST/suspensión. |
| Idioma y apariencia | Idioma, tema, densidad, escala | Cambio de UI y guardado | ES/EN, claro/oscuro/compacto comprobados; tipografía global observada. |
| Atajos | Binding, activo/inactivo | Navegación y acciones con teclado | Diálogo y reordenación probados; edición de bindings pendiente. |
| Backup JSON | Exportar/importar archivo | Descarga de estado e importación | Export válido; import del mismo archivo falló con mensaje genérico, causa pendiente. |
| PWA | Manifest y service worker | Instalable y shell cacheable según configuración | Archivos públicos revisados; instalación y offline real pendientes. |

## ALCANCE IMPLEMENTADO EN AION 2 COMPANION

- **Contadores manuales propios:** el usuario define nombre, categoría, límite y ámbito; incrementa/decrementa progreso con tope. Se etiquetan como definidos por el usuario y sin sincronización con el juego.
- **Separación:** registros por cuenta, servidor (incluida región) o personaje. El valor se asocia al período vigente configurado por el propio usuario.
- **Temporizadores Global:** calendarios recurrentes de Shugo Festival, Dimensional Invasion, Spacetime Rift, sieges y reinicio semanal basados en Shugo.GG. Se muestran como horarios comunitarios no oficiales, en la zona horaria elegida; el reinicio semanal usa el instante comunitario miércoles 16:00 KST. Gartua Eterno e Inmortal aparecen en una tarjeta separada que pide seleccionar un servidor y consulta los reportes comunitarios de Aion2Timers/AbyssLogs cada minuto. Sin muerte reciente reportada, no se inventa cuenta atrás. Esta consulta requiere conexión; el desarrollo usa el proxy de Vite, Netlify usa `netlify/functions/gartua-feed.mts` y Cloudflare Pages usa `functions/fbapi/api/fieldboss.php.ts`.
- **Contadores Diarias/Semanales:** primera instalación precarga una selección de actividades Global extraídas por Aion2Data del cliente 2.0.6.0 hotfix 1 (build 25800038, 2026-10-09). La procedencia se marca comunitaria; los requisitos de nivel aparecen en la descripción. El progreso se marca manualmente; personaje y servidor son opcionales. Conquest aparece como un único contador diario general con objetivo local de 2; no representa la suma de cargas separadas que el juego pudiera mantener por modalidad. Sin personaje ni servidor, el progreso se guarda en el perfil local predeterminado.
- **Contadores personales:** no se lee progreso del juego ni de una API. Los contadores que cree el usuario permanecen manuales; ningún dato de Kalandra se carga como regla.
- **Personajes:** alias, región, servidor y clase libre. Los nombres de servidores/clases no se presentan como lista oficial exhaustiva.
- **Almacenamiento:** Dexie/IndexedDB, preferencias, contadores, personajes y progreso; exportación e importación validadas; importación para añadir/actualizar o reemplazar.
- **Fuentes:** catálogo público de publicaciones NC, catálogo oficial de desarrolladores, endpoints internos observados y referencias comunitarias con estado distinguible.
- **Idiomas:** español e inglés. **Apariencia:** tema claro/oscuro y vista compacta.
- **PWA:** manifiesto, precache de recursos del build y fallback offline configurados. La instalación/offline final sigue pendiente de verificar en navegador.

## Exclusiones deliberadas

- No se carga progreso personal desde Kalandra ni desde una API. Las listas recomendadas y los temporizadores se basan en fuentes comunitarias [Aion2Data](https://aion2data.com/checklist) y [Shugo.GG](https://shugo.gg/timers), identificadas como no oficiales.
- No se leen contadores personales desde el juego; no se requieren credenciales, cuenta, sincronización o API key.
- Los JSON del sitio oficial de NC se marcaron como endpoints internos no documentados. Las promociones se interpretan como fechas de promoción, no como temporizadores recurrentes.
- La API de personajes observada devuelve datos de perfil, estadísticas, títulos, ranking y Daevanion; no se encontró una API documentada para contadores o tareas personales.

## Próximas comprobaciones

Instalación y operación offline en navegador real; cambio de huso y horario de verano; transacciones/importación tras recarga; limpieza selectiva; persistencia de progreso al cambiar de personaje/servidor; y accesibilidad con lector de pantalla. Las pruebas automatizadas locales cubren funciones temporales y ámbito; no sustituyen estas comprobaciones de navegador.
