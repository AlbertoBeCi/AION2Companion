import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchGartuaFeed, gartuaFeedServers, isSupportedGartuaServer, parseGartuaFeed } from './gartuaFeed';

describe('Gartua community feed', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('accepts known global server ids only', () => {
    expect(isSupportedGartuaServer('eu-siel')).toBe(true);
    expect(isSupportedGartuaServer('nae-triniel')).toBe(true);
    expect(isSupportedGartuaServer('made-up-server')).toBe(false);
    expect(gartuaFeedServers.flatMap((region) => region.servers)).toHaveLength(28);
  });

  it('keeps only the two Gartua states and validates timestamps', () => {
    expect(parseGartuaFeed({
      ok: true,
      now: 1_797_000_000,
      kills: {
        elyos24: { st: 'dead', ns: 1_797_043_200, est: true },
        asmo24: { st: 'up', us: 1_796_900_000 },
        elyos01: { st: 'dead', ns: 1_797_043_200 },
      },
    })).toEqual({
      now: 1_797_000_000,
      kills: {
        elyos24: { st: 'dead', ns: 1_797_043_200, est: true },
        asmo24: { st: 'up', us: 1_796_900_000 },
      },
    });
  });

  it('rejects malformed feeds and unsupported server ids', async () => {
    expect(() => parseGartuaFeed({ ok: true, kills: [] })).toThrow('Invalid field boss feed');
    await expect(fetchGartuaFeed('not-a-server')).rejects.toThrow('Unsupported server');
  });

  it('requests the selected server through the same-origin proxy', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true, now: 1_797_000_000, kills: { elyos24: { st: 'dead', ns: 1_797_043_200 } } }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(fetchGartuaFeed('eu-siel')).resolves.toMatchObject({ kills: { elyos24: { st: 'dead', ns: 1_797_043_200 } } });
    expect(fetchMock).toHaveBeenCalledWith('/fbapi/api/fieldboss.php?action=feed&server=eu-siel', { signal: undefined, cache: 'no-store' });
  });
});
