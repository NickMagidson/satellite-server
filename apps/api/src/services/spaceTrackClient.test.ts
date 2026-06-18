import { describe, expect, it, vi } from 'vitest';
import { buildGpQueryPath, fetchSpaceTrackGpOmms } from './spaceTrackClient.js';

describe('buildGpQueryPath', () => {
  it('builds a current propagable GP JSON query with optional limits', () => {
    expect(
      buildGpQueryPath({
        epochDaysBack: 7,
        limit: 10,
      }),
    ).toBe(
      '/basicspacedata/query/class/gp/format/json/decay_date/null-val/epoch/%3Enow-7/limit/10/orderby/norad_cat_id%20asc/',
    );
  });

  it('rejects invalid numeric query options', () => {
    expect(() => buildGpQueryPath({ epochDaysBack: 0 })).toThrow('epochDaysBack must be a positive integer.');
    expect(() => buildGpQueryPath({ limit: -1 })).toThrow('limit must be a positive integer.');
  });
});

describe('fetchSpaceTrackGpOmms', () => {
  it('logs in and fetches GP records with the session cookie', async () => {
    const payload = [{ NORAD_CAT_ID: '25544' }];
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        new Response('', {
          status: 200,
          headers: {
            'set-cookie': 'chocolate=chip; Path=/; HttpOnly',
          },
        }),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify(payload), { status: 200 }));

    const result = await fetchSpaceTrackGpOmms({
      baseUrl: 'https://example.test',
      credentials: {
        identity: 'user@example.com',
        password: 'secret',
      },
      epochDaysBack: 7,
      limit: 10,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(result).toEqual(payload);
    expect(fetchImpl).toHaveBeenNthCalledWith(
      1,
      'https://example.test/ajaxauth/login',
      expect.objectContaining({
        method: 'POST',
        body: expect.any(URLSearchParams),
      }),
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      2,
      'https://example.test/basicspacedata/query/class/gp/format/json/decay_date/null-val/epoch/%3Enow-7/limit/10/orderby/norad_cat_id%20asc/',
      {
        headers: {
          cookie: 'chocolate=chip',
        },
      },
    );
  });

  it('fails when login does not return a session cookie', async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(new Response('', { status: 200 }));

    await expect(
      fetchSpaceTrackGpOmms({
        credentials: {
          identity: 'user@example.com',
          password: 'secret',
        },
        fetchImpl: fetchImpl as unknown as typeof fetch,
      }),
    ).rejects.toThrow('Space-Track login did not return a session cookie.');
  });
});
