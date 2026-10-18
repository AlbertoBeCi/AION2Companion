# Auditoría técnica de privacidad y cumplimiento

**Proyecto:** AION2Companion
**Revisión del código:** 18/10/2026
**Alcance:** código del repositorio y despliegue previsto en Netlify. Revisión técnica, no asesoramiento jurídico. Los puntos que dependen del titular, de contratos, de licencias o de la configuración de la cuenta se marcan **VERIFICAR**.

## Estado de la revisión

| Área | Norma o política | Estado | Hallazgo |
|---|---|---|---|
| A. Almacenamiento y comunicaciones | RGPD arts. 5, 6, 13 y 25; LOPDGDD; LSSI-CE art. 22.2 | CORREGIDO / VERIFICAR | Se inventariaron IndexedDB y localStorage, se amplió la copia para incluir ajustes y horarios guardados, y “Borrar todos los datos” elimina los registros y claves de la app. La consulta de Gartua comunica el servidor elegido y las peticiones llegan a Netlify. La base jurídica, información del responsable y excepción de almacenamiento local requieren verificación. No hay sesión, analítica ni rastreador encontrado en el código. |
| B. Proveedores y recursos externos | RGPD arts. 13 y 28; SIL OFL 1.1 | CORREGIDO / VERIFICAR | Space Grotesk y DM Sans se sirven desde el paquete local y sus licencias están en `docs/licenses/`. Netlify aloja el sitio y procesa solicitudes. Revisar el DPA, la configuración y la retención efectiva de la cuenta de Netlify. |
| C. Marcas, copyright y fuentes | Derechos de autor, marcas y condiciones de cada fuente | VERIFICAR | El favicon es SVG propio; los iconos UI son de Lucide. No se encontró arte, logo o iconografía oficial de AION 2 en `public/`. Los dos MP3 de alertas necesitan acreditar derechos de redistribución. Verificar también EULA, licencias de datos y condiciones de las webs comunitarias. |
| D. Exactitud y horarios | Información clara y exacta; RGPD art. 5.1.d si se tratan datos personales | CORREGIDO / VERIFICAR | Se retiró la afirmación absoluta de privacidad. Los horarios se etiquetan como comunitarios. La cuenta semanal Global se calcula desde miércoles 16:00 KST y se presenta en hora local; las zonas IANA de los temporizadores aplican los cambios estacionales mediante `Intl`. Los datos de comunidad y su vigencia siguen sujetos a cambios. |
| E. Información del prestador | LSSI-CE art. 10 | PENDIENTE / VERIFICAR | Se añadió “Acerca de / Contacto” con marcadores para el titular y su correo. La aplicación del art. 10 no se da por excluida por ser un proyecto gratuito o sin ánimo de lucro: depende de si la actividad encaja en la definición legal y de cómo se financie. Revisar antes de publicar la identidad final o activar ingresos. |
| F. Menores | RGPD arts. 8 y 13; LOPDGDD art. 7 | CORREGIDO / VERIFICAR | No se solicita cuenta ni identidad real; los nombres de personajes pueden identificar a alguien. Se recomienda no introducir datos reales innecesarios. El umbral de 14 años del art. 7 LOPDGDD se refiere al consentimiento del menor como base de tratamiento y no resuelve por sí solo todos los escenarios. |
| G. Idiomas | RGPD art. 12 | CORREGIDO | Las páginas nuevas existen en español e inglés. No se declara prevalencia entre versiones; se debe mantener su equivalencia al actualizar. |
| H. Accesibilidad y seguridad | Ley 11/2023; OWASP / cabeceras HTTP | CORREGIDO / VERIFICAR | Hay cabeceras CSP, nosniff, Referrer-Policy y protecciones de navegación; el arranque de tema ya no requiere script inline. Se conserva `unsafe-inline` en `style-src` por estilos de animación de la app y debe probarse en producción. La aplicación de Ley 11/2023 depende de actividad, alcance y posible exención; la revisión visual/teclado no sustituye una auditoría WCAG completa. |

## Inventario local

| Almacén / clave | Datos que contiene | Finalidad | ¿Puede ser personal? |
|---|---|---|---|
| IndexedDB `aion2-companion`, `characters` | Nombre de personaje, clase, región, servidor, ID y fecha de alta | Separar el seguimiento por personaje | Sí, si el nombre u otros datos identifican a una persona |
| IndexedDB `trackers` | Nombre, descripción, categoría, límite, ámbito, periodo, hora/zona y procedencia | Definir tareas de seguimiento | Puede contener datos personales si el usuario los escribe |
| IndexedDB `progress` | Contador, propietario/ámbito, periodo y fecha de actualización | Guardar avance manual | Puede asociarse a un personaje |
| IndexedDB `preferences` | Idioma, tema, vista compacta, orden y versión de semillas | Recordar preferencias y orden | Normalmente no identificativo por sí solo |
| IndexedDB `scheduledTimers` y `weeklyReset` | Horarios manuales, nombre, tipo, días y región | Guardar configuración local | Puede contener texto libre identificativo |
| localStorage `aion2-theme` | `light` o `dark` | Restaurar tema | No por sí solo |
| localStorage `aion2-timer-server-zone` | Zona IANA seleccionada | Mostrar horarios en la zona preferida | Puede revelar una preferencia regional |
| localStorage `aion2-gartua-server` | Identificador del servidor seleccionado | Consultar los reportes del servidor | No identifica por sí solo, pero se transmite al solicitar feed |
| localStorage `aion2-timer-sound-alerts` | Mapa de IDs de temporizador a booleano | Recordar avisos elegidos | Preferencias de uso |
| localStorage `aion2-timer-alert-fired:<id>` | Marca temporal de una alerta ya reproducida | Evitar repetir avisos en el mismo evento | No por sí sola |
| sessionStorage y cookies de aplicación | No se encontraron lecturas ni escrituras en el código | — | Verificar el comportamiento final en el navegador y en el hosting |
| Cache Storage / service worker | Archivos estáticos de la app, fuentes, iconos y sonidos para el uso offline | Reabrir el shell sin conexión | No guarda registros de personaje/progreso en esta caché |

La exportación JSON incorpora actualmente tablas locales, preferencias, horarios guardados y las claves locales de la app. La importación limita el tamaño, valida estructura y rangos con Zod y filtra las claves permitidas antes de restaurarlas. El borrado total elimina las tablas y claves AION2Companion y devuelve idioma/tema a valores iniciales; los archivos de la app que el service worker mantiene en caché no son datos de usuario.

## Comunicaciones y dominios

| Destino | Cuándo hay petición | Datos relevantes |
|---|---|---|
| `aion2companion.netlify.app` / Netlify | Carga de la app y sus recursos; cada visita y petición al feed | URL y metadatos técnicos de la petición; Netlify documenta que puede recibir dirección IP y datos del dispositivo. No se conoce desde el repositorio la retención ni la configuración de esta cuenta. |
| `www.aion2timers.com` | Solo al elegir un servidor de Gartua; la función de Netlify consulta el feed y lo renueva aproximadamente cada minuto mientras la sección está abierta | Identificador de servidor y solicitud del feed desde el servidor de la función. La app no envía al feed nombre de personaje ni progreso. La función actúa como proxy de servidor. |
| `ko-fi.com` y proveedor de pago seleccionado por el usuario | Solo al abrir el enlace opcional de apoyo y continuar allí con un pago | La app no integra el formulario ni procesa pagos. Ko-fi y el proveedor de pago tratan datos necesarios para la transacción; si decides aceptar apoyo, completa la información sobre tu papel, las obligaciones aplicables y el tratamiento de los datos que la plataforma te comparta. |
| Fuentes/enlaces que el usuario abre | `aion2.plaync.com`, `api-global-community.plaync.com`, `promotion.plaync.com`, `developers.plaync.com`, `aion2data.com`, `shugo.gg`, `www.aion2timers.com`, `aion2.grimvane.app`, `github.com`, `boe.es`, `www.boe.es`, `eur-lex.europa.eu`, `www.aepd.es`, `www.netlify.com` | Son destinos de enlaces o referencias, no cargas remotas de fuentes, iconos, imágenes ni analítica en la vista normal. Al abrir un enlace, el navegador contacta directamente con ese tercero. |
| Google Fonts / CDN de fuentes | Ninguna desde el código actualizado | Las fuentes se empaquetan localmente. |

No se encontraron `fetch` desde el navegador a una API externa directa, XMLHttpRequest, formularios remotos, envío de copias, analítica, publicidad, píxeles ni `document.cookie`. La única llamada funcional de red iniciada por la aplicación es la consulta same-origin al proxy de Gartua cuando el usuario elige servidor. Además, cualquier visita al sitio genera las peticiones normales al hosting.

No se añade banner de cookies por no detectarse cookies propias, analítica o publicidad en el código. La calificación de localStorage y Cache Storage a efectos del art. 22.2 LSSI-CE debe **VERIFICARSE** con la configuración publicada y asesoría; si se añadiesen cookies o almacenamiento no exento para analítica/publicidad, habría que evaluar consentimiento previo y un rechazo tan visible como la aceptación conforme a la guía AEPD.

## Riesgos y datos que faltan

| Gravedad | Riesgo | Archivo / acción |
|---|---|---|
| Alto | Las páginas legales aún no identifican titular ni contacto; el responsable y canal para derechos no están definidos. | `src/components/LegalPages.tsx`: completar `[COMPLETAR: nombre o identidad del titular]` y `[COMPLETAR: correo de contacto]`; revisar con asesor. |
| Alto | Los MP3 de alertas pueden estar sujetos a copyright y no hay licencia documentada en el repo. | `public/sounds/timer-alert.mp3`, `public/sounds/counter-complete.mp3`: verificar licencia y permiso para alojar/redistribuir antes de mantenerlos en el despliegue público. |
| Medio | La excepción al consentimiento para almacenamiento local y el alcance de LSSI art. 10 dependen del servicio, propósito, financiación y configuración real. | Configuración final + Netlify: revisión jurídica, especialmente ahora que se ofrece apoyo voluntario mediante Ko-fi, o si se añade publicidad, afiliación o analítica. |
| Medio | Los datos de Gartua y los horarios comunitarios dependen de terceros, cobertura e IPs/registros del hosting. | `src/lib/gartuaProxy.ts`, `src/components/TimersPage.tsx`, cuenta Netlify y proveedor del feed: revisar privacidad, condiciones, retención y disponibilidad. |
| Medio | Derechos sobre bases de datos de fuentes y compatibilidad de herramienta con EULA no se determinan desde el código. | `src/lib/sources.ts`: revisar condiciones de Shugo.gg/Aion2Timers/AbyssLogs/AION2Data; comprobar EULA vigente. |
| Medio | `style-src 'unsafe-inline'` continúa permitido por estilos inline que genera la interfaz/animaciones. | `public/_headers`: probar CSP con build desplegada; considerar nonce/hash o eliminar estilos dinámicos si se puede sin romper Motion. |
| Medio | No hay revisión legal externa ni verificación de cumplimiento WCAG o Ley 11/2023 para la situación económica y actividad del titular. | Validar con un profesional y pruebas manuales/automatizadas de teclado, lector de pantalla y contraste. |
| Bajo | La ruta SPA de estas páginas no crea URL independiente ni estado de historial; el botón Atrás del navegador no cambia de página dentro de la app. | `src/stores/uiStore.ts`, `src/App.tsx`: limitación de navegación existente; evaluar router en una mejora aparte. |

## Marcadores `[COMPLETAR]`

- Nombre o identidad pública del titular del proyecto.
- Correo de contacto para consultas y derechos.
- URL pública de Ko-fi configurada en `src/lib/siteConfig.ts`; el enlace abre el proveedor directamente y debe quedar incluido en la información de privacidad como destino externo.

## Verificación requerida por el titular

- Confirmar quién opera el proyecto, su residencia y correo, y revisar con asesoría la LSSI-CE art. 10 y RGPD.
- Revisar con el panel y contrato de la cuenta la configuración, logs, subencargados, región y retención de Netlify; actualizar esta política con esos datos.
- Decidir y documentar la base legal/información sobre preferencias en localStorage conforme a LSSI-CE art. 22.2 y guía AEPD.
- Acreditar licencia o permiso de los MP3 y de cualquier fuente de datos o activo que se distribuya.
- Revisar EULA vigente y condiciones de las fuentes comunitarias; mantener las marcas y nombres con el aviso de no afiliación.
- Completar y revisar la información de privacidad y obligaciones aplicables antes de aceptar pagos voluntarios en Ko-fi; revisar de nuevo antes de activar analítica, anuncios, afiliados o patrocinios.
- Determinar si la Ley 11/2023 de accesibilidad se aplica a la actividad concreta y si existe una exención de microempresa.

## Fuentes oficiales consultadas

- [RGPD, Reglamento (UE) 2016/679](https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32016R0679), en particular arts. 5, 6, 8, 13, 17 y 25.
- [LSSI-CE, Ley 34/2002](https://www.boe.es/buscar/act.php?id=BOE-A-2002-13758), arts. 10 y 22.2.
- [LOPDGDD, Ley Orgánica 3/2018](https://www.boe.es/buscar/act.php?id=BOE-A-2018-16673), art. 7.
- [Ley 11/2023 de accesibilidad](https://www.boe.es/buscar/act.php?id=BOE-A-2023-11022), título I y anexo I.
- [AEPD, Guía sobre el uso de cookies](https://www.aepd.es/guias/guia-cookies.pdf), mayo de 2024.
- [Netlify Privacy Policy](https://www.netlify.com/privacy/) y [documentación de observabilidad](https://docs.netlify.com/manage/monitoring/observability/overview/).
- [Licencia SIL Open Font License 1.1](https://openfontlicense.org/), copias incluidas en `docs/licenses/`.
