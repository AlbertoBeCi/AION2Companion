# AION 2 Companion

**A local-first companion for tracking AION 2 activities, timers and progress.** The app works without a game account, and creating characters or selecting a server is optional for personal counters.

> This is an independent, community project. It is not affiliated with or endorsed by NCSOFT.

## Features

- Track daily and weekly activities with configurable progress counters.
- Use counters without creating characters or adding a server; character and server organization is optional.
- View recurring community event schedules and weekly reset countdowns in your selected time zone.
- Follow Eternal and Immortal Gartua reports by Global server. Live coverage depends on community submissions; when there is no usable report, the app does not invent a countdown.
- Enable an optional sound alert per timer.
- Keep preferences and progress in the browser with IndexedDB; export or restore a versioned backup.
- Install the production app as a PWA. Its app shell can be available offline after it has loaded successfully; live community feeds need an internet connection.
- Use the interface in Spanish or English.

## Data and source transparency

The app distinguishes **official game rules** from **community references**. See the [rule and source catalogue](docs/official-rules-catalog.json) for each source's scope, region, review date and limitations.

Daily and weekly preset activities and reset schedules currently rely on community-maintained data and are labeled accordingly; they are not presented as official NCSOFT rules. Recurring event schedules use [Shugo.GG](https://shugo.gg/timers). Gartua's last-kill and respawn information is provided by the community feed from [Aion2Timers](https://www.aion2timers.com/world-boss-timer/) and AbyssLogs, rather than an official NCSOFT API. Reports and estimates may be incomplete or vary by server.

The app does not connect to game accounts or upload personal counter progress. The Gartua panel makes a server-specific request to its public community feed through a same-origin proxy; no API key is required.

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

### Quality checks

```sh
npm test
npm run build
```

The production-ready static site is generated in `dist/`.

## Privacy and local data

Preferences and progress are stored in the browser using Dexie and IndexedDB. Export creates a versioned backup; import validates it and supports merging by identifier or replacing local data. Clearing browser site data removes the locally stored progress unless you have exported a backup.

## Deployment

The project builds as a static site and includes a Cloudflare Pages Function for the same-origin Gartua feed proxy at `functions/fbapi/api/fieldboss.php.ts`. Deploy the project to Cloudflare Pages with the standard build command `npm run build` and output directory `dist`.

GitHub Actions runs the project checks for pull requests and changes to `main` (`.github/workflows/ci.yml`). The app has not been independently audited for legal compliance or fully verified for offline installation and assistive-technology behavior in every target browser.

## Project documentation

- [Kalandra reference audit](docs/kalandra-audit.md)
- [Functional inventory](docs/functional-inventory.md)
- [Feature parity and evidence matrix](docs/feature-parity-matrix.md)
- [Rules and source catalogue](docs/official-rules-catalog.json)

---

# AION 2 Companion

**A local-first companion for tracking AION 2 activities, timers, and progress.** It works without a game account, and creating characters or selecting a server is optional for personal counters.

> This is an independent community project. It is not affiliated with or endorsed by NCSOFT.

## Features

- Track daily and weekly activities with configurable progress counters.
- Use counters without creating characters or adding a server; character and server organization is optional.
- View recurring community event schedules and weekly reset countdowns in your selected time zone.
- Follow Eternal and Immortal Gartua reports by Global server. Live coverage depends on community submissions; when no usable report is available, the app does not invent a countdown.
- Enable an optional sound alert for each timer.
- Keep preferences and progress in the browser with IndexedDB; export or restore a versioned backup.
- Install the production app as a PWA. Its app shell can be available offline after it has loaded successfully; live community feeds require an internet connection.
- Use the interface in Spanish or English.

## Data and source transparency

The app distinguishes **official game rules** from **community references**. The [rules and sources catalogue](docs/official-rules-catalog.json) documents each source's scope, region, review date, and limitations.

Daily and weekly preset activities and reset schedules currently rely on community-maintained data and are labeled accordingly; they are not presented as official NCSOFT rules. Recurring event schedules use [Shugo.GG](https://shugo.gg/timers). Gartua last-kill and respawn information comes from the community feed provided by [Aion2Timers](https://www.aion2timers.com/world-boss-timer/) and AbyssLogs, not an official NCSOFT API. Reports and estimates may be incomplete or vary by server.

The app does not connect to game accounts or upload personal counter progress. The Gartua panel makes a server-specific request to its public community feed through a same-origin proxy; no API key is required.

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

### Quality checks

```sh
npm test
npm run build
```

The production-ready static site is generated in `dist/`.

## Privacy and local data

Preferences and progress are stored in the browser using Dexie and IndexedDB. Export creates a versioned backup; import validates it and supports merging by identifier or replacing local data. Clearing browser site data removes locally stored progress unless you have exported a backup.

## Deployment

The project builds as a static site and includes a Cloudflare Pages Function for the same-origin Gartua feed proxy at `functions/fbapi/api/fieldboss.php.ts`. Deploy the project to Cloudflare Pages with the standard build command `npm run build` and output directory `dist`.

GitHub Actions runs project checks for pull requests and changes to `main` (`.github/workflows/ci.yml`). The app has not been independently audited for legal compliance or fully verified for offline installation and assistive-technology behavior in every target browser.

## Project documentation

- [Kalandra reference audit](docs/kalandra-audit.md)
- [Functional inventory](docs/functional-inventory.md)
- [Feature parity and evidence matrix](docs/feature-parity-matrix.md)
- [Rules and source catalogue](docs/official-rules-catalog.json)
