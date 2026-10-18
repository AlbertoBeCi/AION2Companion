# AION 2 Companion

![AION 2 Companion — Track, Plan, Play](docs/assets/aion2-companion-banner.png)

**Compañero local para seguir actividades, temporizadores y progreso de AION 2.** Funciona sin conectar una cuenta de juego. Crear personajes o elegir servidor es opcional para los contadores personales.

> Proyecto comunitario independiente, no afiliado ni respaldado por NCSOFT.

## Funciones

- Registra actividades diarias y semanales con contadores de progreso.
- Usa contadores sin crear personajes ni añadir servidores; ambos son opcionales.
- Consulta horarios comunitarios de eventos y la cuenta atrás del reinicio semanal en la zona horaria elegida.
- Sigue los reportes de Gartua Eterno e Inmortal por servidor Global. La cobertura depende de los reportes de jugadores; si no hay un dato utilizable, la app no inventa una cuenta atrás.
- Activa avisos sonoros individualmente para los temporizadores que quieras.
- Guarda preferencias y progreso en el navegador con IndexedDB y permite exportar o restaurar una copia versionada.
- Instala la versión de producción como PWA. El shell de la app puede abrirse sin conexión tras una carga correcta; los feeds comunitarios requieren internet.
- Interfaz en español e inglés.

## Datos y transparencia de fuentes

La app diferencia las **reglas oficiales del juego** de las **referencias comunitarias**. El [catálogo de reglas y fuentes](docs/official-rules-catalog.json) registra alcance, región, fecha de revisión y limitaciones.

Las actividades preconfiguradas y los horarios de reinicio diarios y semanales se basan actualmente en datos comunitarios, identificados como tales; no se presentan como reglas oficiales de NCSOFT. Los horarios recurrentes de eventos proceden de [Shugo.GG](https://shugo.gg/timers). Los datos de última muerte y reaparición de Gartua vienen del feed comunitario de [Aion2Timers](https://www.aion2timers.com/world-boss-timer/) y AbyssLogs, no de una API oficial de NCSOFT. Los reportes y estimaciones pueden estar incompletos o variar según el servidor.

La app no se conecta a cuentas del juego ni sube el progreso personal de los contadores. El panel de Gartua consulta el feed comunitario por servidor mediante una función del mismo origen; no requiere API key.

## Empezar

### Requisitos

- Node.js **20.19+** o **22.12+**
- npm

### Ejecutar en local

```sh
npm install
npm run dev
```

Abre la dirección local que indique Vite (normalmente `http://localhost:5173`). El proxy de desarrollo para el feed de Gartua está configurado en `vite.config.ts`.

### Comprobaciones

```sh
npm test
npm run build
```

La compilación de producción se genera en `dist/`.

## Privacidad y datos locales

Las preferencias y el progreso se guardan en el navegador mediante Dexie e IndexedDB. La exportación crea una copia versionada; la importación la valida y permite fusionar por identificador o reemplazar los datos locales. Si borras los datos del sitio en el navegador, perderás el progreso que no hayas exportado.

## Publicación

El proyecto genera un sitio estático en `dist/` e incluye configuración para Netlify (`netlify.toml`) y Cloudflare Pages. En Netlify, `netlify/functions/gartua-feed.mts` sirve el proxy de Gartua en la ruta que consulta la app. Conecta el repositorio Git o despliega desde la raíz para que Netlify publique tanto los archivos estáticos como la función. En Cloudflare Pages, el proxy está en `functions/fbapi/api/fieldboss.php.ts`. El comando de compilación es `npm run build` y el directorio de publicación es `dist`.

GitHub Actions ejecuta pruebas y compilación en pull requests y al enviar cambios a `main` (`.github/workflows/ci.yml`). La app aún no ha pasado una auditoría legal independiente ni una verificación exhaustiva de accesibilidad e instalación offline en todos los navegadores objetivo.

## Documentación

- [Auditoría de la referencia Kalandra](docs/kalandra-audit.md)
- [Inventario funcional](docs/functional-inventory.md)
- [Matriz de paridad y evidencias](docs/feature-parity-matrix.md)
- [Catálogo de reglas y fuentes](docs/official-rules-catalog.json)

---

# AION 2 Companion

**A local-first companion for tracking AION 2 activities, timers, and progress.** It works without a game account. Creating characters or selecting a server is optional for personal counters.

> This is an independent community project. It is not affiliated with or endorsed by NCSOFT.

## Features

- Track daily and weekly activities with progress counters.
- Use counters without creating characters or adding servers; both are optional.
- View community event schedules and weekly reset countdowns in your selected time zone.
- Follow Eternal and Immortal Gartua reports by Global server. Coverage depends on player submissions; when no usable report is available, the app does not invent a countdown.
- Enable sound alerts individually for the timers you choose.
- Keep preferences and progress in the browser with IndexedDB; export or restore a versioned backup.
- Install the production app as a PWA. Its app shell can be available offline after a successful load; community feeds require an internet connection.
- Interface available in Spanish and English.

## Data and source transparency

The app distinguishes **official game rules** from **community references**. The [rules and sources catalogue](docs/official-rules-catalog.json) records each source's scope, region, review date, and limitations.

Preset activities and daily/weekly reset schedules currently rely on community-maintained data and are labeled accordingly; they are not presented as official NCSOFT rules. Recurring event schedules use [Shugo.GG](https://shugo.gg/timers). Gartua last-kill and respawn information comes from the community feed provided by [Aion2Timers](https://www.aion2timers.com/world-boss-timer/) and AbyssLogs, not an official NCSOFT API. Reports and estimates may be incomplete or vary by server.

The app does not connect to game accounts or upload personal counter progress. The Gartua panel requests the community feed by server through a same-origin function; no API key is required.

## Getting started

### Requirements

- Node.js **20.19+** or **22.12+**
- npm

### Run locally

```sh
npm install
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`). The development proxy for the Gartua feed is configured in `vite.config.ts`.

### Checks

```sh
npm test
npm run build
```

The production build is generated in `dist/`.

## Privacy and local data

Preferences and progress are stored in the browser using Dexie and IndexedDB. Export creates a versioned backup; import validates it and supports merging by identifier or replacing local data. Clearing browser site data removes progress that has not been exported.

## Deployment

The project builds to `dist/` and includes configuration for both Netlify (`netlify.toml`) and Cloudflare Pages. On Netlify, `netlify/functions/gartua-feed.mts` serves the Gartua proxy at the route used by the app. Connect the Git repository or deploy from the project root so Netlify publishes both the static site and its function. The Cloudflare Pages proxy is at `functions/fbapi/api/fieldboss.php.ts`. Use `npm run build` as the build command and `dist` as the publish directory.

GitHub Actions runs tests and builds for pull requests and pushes to `main` (`.github/workflows/ci.yml`). The app has not had an independent legal review or exhaustive accessibility and offline-installation testing across all target browsers.

## Documentation

- [Kalandra reference audit](docs/kalandra-audit.md)
- [Functional inventory](docs/functional-inventory.md)
- [Feature parity and evidence matrix](docs/feature-parity-matrix.md)
- [Rules and sources catalogue](docs/official-rules-catalog.json)
