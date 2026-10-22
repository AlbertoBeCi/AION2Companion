const allowedServerPattern = /^(eu|nae|naw|sa)-[a-z0-9]{2,20}$/;
const gartuaIds = ['elyos24', 'asmo24'] as const;
const browserUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

function json(body: Record<string, unknown>, status: number, cache = 'no-store'): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': cache },
  });
}

/** Shared same-origin proxy handler for Netlify Functions and Cloudflare Pages. */
export async function handleGartuaFeedRequest(request: Request): Promise<Response> {
  if (request.method !== 'GET') return json({ ok: false, error: 'Method not allowed' }, 405);

  const incoming = new URL(request.url);
  const server = incoming.searchParams.get('server') ?? '';
  if (incoming.searchParams.get('action') !== 'feed' || !allowedServerPattern.test(server)) {
    return json({ ok: false, error: 'Invalid feed request' }, 400);
  }

  const upstream = new URL('https://www.aion2timers.com/api/fieldboss.php');
  upstream.searchParams.set('action', 'feed');
  upstream.searchParams.set('server', server);

  try {
    const response = await fetch(upstream, {
      headers: {
        accept: 'application/json, */*',
        'accept-language': 'en-US,en;q=0.9',
        origin: 'https://www.aion2timers.com',
        referer: 'https://www.aion2timers.com/world-boss-timer/',
        'user-agent': browserUserAgent,
      },
    });
    if (!response.ok) return json({ ok: false, error: 'Community feed unavailable' }, 502);

    const payload: unknown = await response.json();
    if (typeof payload !== 'object' || payload === null || !('ok' in payload) || payload.ok !== true || !('kills' in payload) || typeof payload.kills !== 'object' || payload.kills === null) {
      return json({ ok: false, error: 'Invalid community feed response' }, 502);
    }

    const payloadRecord = payload as { now?: unknown; kills: Record<string, unknown> };
    const kills = Object.fromEntries(gartuaIds.flatMap((id) => {
      const entry = payloadRecord.kills[id];
      return typeof entry === 'object' && entry !== null ? [[id, entry]] : [];
    }));
    return json({ ok: true, ...(typeof payloadRecord.now === 'number' ? { now: payloadRecord.now } : {}), kills }, 200, 'public, max-age=20, s-maxage=20');
  } catch {
    return json({ ok: false, error: 'Community feed request failed' }, 502);
  }
}
