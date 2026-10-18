import { afterEach, describe, expect, it, vi } from 'vitest';
import { handleGartuaFeedRequest } from './gartuaProxy';

describe('Gartua feed server proxy', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('rejects unsupported requests without contacting the upstream feed', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const response = await handleGartuaFeedRequest(new Request('https://app.example/fbapi/api/fieldboss.php?action=feed&server=bad/server'));

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ ok: false });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('forwards only Gartua entries from the selected server feed', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      ok: true,
      now: 1_797_000_000,
      kills: {
        elyos24: { st: 'dead', ns: 1_797_043_200 },
        asmo24: { st: 'up' },
        elyos03: { st: 'dead' },
      },
    }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const response = await handleGartuaFeedRequest(new Request('https://app.example/fbapi/api/fieldboss.php?action=feed&server=eu-siel'));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ok: true,
      now: 1_797_000_000,
      kills: { elyos24: { st: 'dead', ns: 1_797_043_200 }, asmo24: { st: 'up' } },
    });
    expect(response.headers.get('cache-control')).toContain('max-age=20');
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe('https://www.aion2timers.com/api/fieldboss.php?action=feed&server=eu-siel');
  });

  it('returns a gateway error when the community feed is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('offline', { status: 503 })));

    const response = await handleGartuaFeedRequest(new Request('https://app.example/fbapi/api/fieldboss.php?action=feed&server=eu-siel'));

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ ok: false, error: 'Community feed unavailable' });
  });
});
