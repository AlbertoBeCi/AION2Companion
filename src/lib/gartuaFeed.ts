export const gartuaFeedServers = [
  { region: 'Europe', servers: ['Siel', 'Israphel', 'Nezekan', 'Zikel', 'Vaizel', 'Triniel', 'Kaisinel', 'Lumiel', 'Yustiel', 'Marchutan', 'Ariel', 'Azphel', 'Fregion', 'Ereshkigal', 'Beritra'].map((name) => ({ id: `eu-${name.toLowerCase()}`, name })) },
  { region: 'North America East', servers: ['Siel', 'Israphel', 'Nezekan', 'Zikel', 'Triniel'].map((name) => ({ id: `nae-${name.toLowerCase()}`, name })) },
  { region: 'North America West', servers: ['Siel', 'Israphel', 'Nezekan', 'Zikel'].map((name) => ({ id: `naw-${name.toLowerCase()}`, name })) },
  { region: 'South America', servers: ['Siel', 'Israphel', 'Nezekan', 'Zikel'].map((name) => ({ id: `sa-${name.toLowerCase()}`, name })) },
] as const;

const validServerIds: ReadonlySet<string> = new Set(gartuaFeedServers.flatMap((region) => region.servers.map((server) => server.id)));

export interface GartuaFeedEntry {
  st?: 'up' | 'dead';
  us?: number;
  mu?: number;
  ns?: number;
  est?: boolean;
}

export interface GartuaFeed {
  now?: number;
  kills: Partial<Record<'elyos24' | 'asmo24', GartuaFeedEntry>>;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseBossEntry(value: unknown): GartuaFeedEntry | undefined {
  if (!isObject(value)) return undefined;
  const entry: GartuaFeedEntry = {};
  if (value.st === 'up' || value.st === 'dead') entry.st = value.st;
  for (const key of ['us', 'mu', 'ns'] as const) {
    if (typeof value[key] === 'number' && Number.isFinite(value[key]) && value[key] > 0) entry[key] = value[key];
  }
  if (typeof value.est === 'boolean') entry.est = value.est;
  return Object.keys(entry).length ? entry : undefined;
}

export function parseGartuaFeed(value: unknown): GartuaFeed {
  if (!isObject(value) || value.ok !== true || !isObject(value.kills)) throw new Error('Invalid field boss feed');
  const kills: GartuaFeed['kills'] = {};
  for (const id of ['elyos24', 'asmo24'] as const) {
    const entry = parseBossEntry(value.kills[id]);
    if (entry) kills[id] = entry;
  }
  return {
    ...(typeof value.now === 'number' && Number.isFinite(value.now) ? { now: value.now } : {}),
    kills,
  };
}

export async function fetchGartuaFeed(serverId: string, signal?: AbortSignal): Promise<GartuaFeed> {
  if (!validServerIds.has(serverId)) throw new Error('Unsupported server');
  const query = new URLSearchParams({ action: 'feed', server: serverId });
  const response = await fetch(`/fbapi/api/fieldboss.php?${query.toString()}`, { ...(signal ? { signal } : {}), cache: 'no-store' });
  if (!response.ok) throw new Error(`Field boss feed returned ${response.status}`);
  return parseGartuaFeed(await response.json());
}

export function isSupportedGartuaServer(serverId: string): boolean {
  return validServerIds.has(serverId);
}
