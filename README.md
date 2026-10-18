<div align="center">

![AION2Companion · panel de seguimiento](docs/assets/aion2-companion-banner-v2.png)

# AION2Companion

### Organiza tus tareas, temporizadores y progreso desde un solo lugar.

[🌐 Abrir aplicación](https://aion2companion.netlify.app/) · [📚 Documentación](#-documentación) · [🛠️ Ejecutar en local](#-ejecutar-en-local)

**Español** · [English](#english)

</div>

> Proyecto independiente de fans. No está afiliado ni respaldado por NC ni por los titulares de AION 2.

## ✨ Qué puedes hacer

- ✅ Llevar contadores diarios y semanales y registrar el progreso a mano.
- 👤 Usar un perfil local sin crear personajes ni seleccionar servidor.
- ⏱️ Consultar horarios comunitarios de jefes y eventos, y la cuenta atrás semanal.
- 🔔 Activar avisos de sonido solo para los temporizadores que elijas.
- 🌗 Cambiar idioma (ES/EN) y tema claro u oscuro.
- 💾 Guardar los datos en este dispositivo, exportar una copia JSON e importarla después.
- 📲 Instalar la versión publicada como PWA. Tras cargar sus recursos, el shell puede abrirse sin conexión; los feeds requieren internet.

## 🧭 Fuentes y precisión

La app diferencia las publicaciones oficiales de NC de las referencias comunitarias. Los horarios recurrentes de eventos se basan en [Shugo.GG](https://shugo.gg/timers). Los reportes de Gartua proceden de un feed comunitario de [Aion2Timers](https://www.aion2timers.com/world-boss-timer/) y AbyssLogs. No son datos oficiales de NC y pueden variar según la región, el servidor y las actualizaciones.

El reinicio semanal Global se representa desde el **miércoles a las 16:00 KST** y se convierte a la hora local del navegador. Comprueba siempre los anuncios y el estado del juego. Consulta el [catálogo de reglas y fuentes](docs/official-rules-catalog.json) para conocer procedencia, región, revisión y limitaciones.

## 🔒 Datos y privacidad

Los perfiles, contadores, progreso y preferencias se guardan localmente en el navegador. No se sincronizan con una cuenta del juego. Al consultar Gartua, se envía el servidor seleccionado a una función de Netlify que solicita el feed comunitario; no se envían los nombres de personaje ni el progreso personal.

El enlace opcional de apoyo abre [Ko-fi](https://ko-fi.com/S0U1291G5B) en otra pestaña. AION2Companion no integra el formulario ni procesa pagos. Consulta la [política de privacidad](https://aion2companion.netlify.app/#privacy) y la [auditoría técnica](docs/compliance-audit.md) para ver el inventario de almacenamiento y comunicaciones.

## 🚀 Ejecutar en local

**Requisitos:** Node.js 20.19+ o 22.12+, y npm.

```sh
git clone https://github.com/AlbertoBeCi/AION2Companion.git
cd AION2Companion
npm install
npm run dev
```

Abre la URL local indicada por Vite, normalmente `http://localhost:5173`. El comando `npm run dev` usa el proxy local del feed de Gartua configurado en `vite.config.ts`.

### 🧪 Comprobaciones

```sh
npm test
npm run build
```

La compilación de producción queda en `dist/`. GitHub Actions también ejecuta pruebas y compilación en cambios dirigidos a `main` y en pull requests.

## 🧰 Stack

React · TypeScript · Vite · Dexie/IndexedDB · Zustand · i18next · Lucide · Motion · PWA/Workbox · Netlify Functions.

## 📚 Documentación

- [Auditoría funcional de referencia](docs/reference-audit.md)
- [Inventario funcional](docs/functional-inventory.md)
- [Matriz de paridad y evidencias](docs/feature-parity-matrix.md)
- [Catálogo de reglas y fuentes](docs/official-rules-catalog.json)
- [Auditoría técnica de privacidad y cumplimiento](docs/compliance-audit.md)
- Licencias SIL OFL 1.1: [DM Sans](docs/licenses/DM-Sans-OFL.txt) y [Space Grotesk](docs/licenses/Space-Grotesk-OFL.txt).

## ☕ Apoyar el proyecto

Si te resulta útil, puedes [invitarme a un café en Ko-fi](https://ko-fi.com/S0U1291G5B). ¡Gracias por apoyar el desarrollo! 💛

---

<a id="english"></a>

<div align="center">

![AION2Companion · tracking dashboard](docs/assets/aion2-companion-banner-v2.png)

# AION2Companion

### Keep your tasks, timers, and progress in one place.

[🌐 Open the app](https://aion2companion.netlify.app/) · [📚 Documentation](#-documentation-1) · [🛠️ Run locally](#-run-locally)

[Español](#aion2companion) · **English**

</div>

> Independent fan project. Not affiliated with or endorsed by NC or the AION 2 rights holders.

## ✨ What you can do

- ✅ Track daily and weekly counters and record progress manually.
- 👤 Use a local profile without creating characters or selecting a server.
- ⏱️ View community schedules for bosses and events, plus the weekly countdown.
- 🔔 Enable sound alerts only for the timers you choose.
- 🌗 Switch between Spanish and English and light or dark themes.
- 💾 Keep data on this device, export a JSON backup, and import it later.
- 📲 Install the production app as a PWA. After its resources load, the app shell can open offline; community feeds need internet access.

## 🧭 Sources and accuracy

The app distinguishes NC publications from community references. Recurring event schedules are based on [Shugo.GG](https://shugo.gg/timers). Gartua reports come from a community feed provided by [Aion2Timers](https://www.aion2timers.com/world-boss-timer/) and AbyssLogs. These are not official NC data and can vary by region, server, and game update.

The Global weekly reset is shown as **Wednesday at 16:00 KST** and converted to the browser's local time. Always check in-game notices and status. The [rules and sources catalogue](docs/official-rules-catalog.json) records provenance, region, review date, and limitations.

## 🔒 Data and privacy

Profiles, trackers, progress, and preferences are stored locally in the browser. They are not synced to a game account. When you check Gartua, the selected server is sent to a Netlify function that requests the community feed; character names and personal progress are not sent.

The optional support link opens [Ko-fi](https://ko-fi.com/S0U1291G5B) in a new tab. AION2Companion does not embed its form or process payments. See the [privacy policy](https://aion2companion.netlify.app/#privacy) and [technical audit](docs/compliance-audit.md) for the storage and communication inventory.

## 🚀 Run locally

**Requirements:** Node.js 20.19+ or 22.12+, and npm.

```sh
git clone https://github.com/AlbertoBeCi/AION2Companion.git
cd AION2Companion
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`. `npm run dev` uses the local Gartua feed proxy configured in `vite.config.ts`.

### 🧪 Checks

```sh
npm test
npm run build
```

The production build is written to `dist/`. GitHub Actions also runs tests and builds for changes targeting `main` and for pull requests.

## 🧰 Tech stack

React · TypeScript · Vite · Dexie/IndexedDB · Zustand · i18next · Lucide · Motion · PWA/Workbox · Netlify Functions.

## 📚 Documentation

- [Reference functional audit](docs/reference-audit.md)
- [Functional inventory](docs/functional-inventory.md)
- [Parity and evidence matrix](docs/feature-parity-matrix.md)
- [Rules and sources catalogue](docs/official-rules-catalog.json)
- [Technical privacy and compliance audit](docs/compliance-audit.md)
- SIL OFL 1.1 licenses: [DM Sans](docs/licenses/DM-Sans-OFL.txt) and [Space Grotesk](docs/licenses/Space-Grotesk-OFL.txt).

## ☕ Support the project

If you find it useful, you can [buy me a coffee on Ko-fi](https://ko-fi.com/S0U1291G5B). Thanks for supporting development! 💛
