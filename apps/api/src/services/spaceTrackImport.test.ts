import { describe, expect, it, vi } from 'vitest';
import type { NormalizedOmmRecord } from '../types.js';
import { validOmm } from '../test/fixtures.js';
import { importSpaceTrackGpOmms } from './spaceTrackImport.js';

function createOmm(noradCatId: number): NormalizedOmmRecord {
  return {
    ...validOmm,
    NORAD_CAT_ID: noradCatId,
  };
}

describe('importSpaceTrackGpOmms', () => {
  it('validates fetched GP records and saves them in batches', async () => {
    const fetchedOmms = [createOmm(25544), createOmm(28492), createOmm(33591)];
    const fetchGpOmms = vi.fn().mockResolvedValue(fetchedOmms);
    const saveOmms = vi.fn().mockImplementation(async (_databaseUrl: string | null, omms: NormalizedOmmRecord[]) => omms.length);

    const result = await importSpaceTrackGpOmms({
      databaseUrl: 'postgresql://example',
      credentials: {
        identity: 'user@example.com',
        password: 'secret',
      },
      batchSize: 2,
      dependencies: {
        fetchGpOmms,
        saveOmms,
      },
    });

    expect(result).toEqual({
      fetchedCount: 3,
      savedCount: 3,
      batchSize: 2,
    });
    expect(saveOmms).toHaveBeenCalledTimes(2);
    expect(saveOmms).toHaveBeenNthCalledWith(1, 'postgresql://example', fetchedOmms.slice(0, 2));
    expect(saveOmms).toHaveBeenNthCalledWith(2, 'postgresql://example', fetchedOmms.slice(2));
  });

  it('requires a configured database URL', async () => {
    await expect(
      importSpaceTrackGpOmms({
        databaseUrl: null,
        credentials: {
          identity: 'user@example.com',
          password: 'secret',
        },
        dependencies: {
          fetchGpOmms: vi.fn(),
          saveOmms: vi.fn(),
        },
      }),
    ).rejects.toThrow('DATABASE_URL is not configured');
  });

  it('rejects invalid fetched OMM records before saving', async () => {
    const fetchGpOmms = vi.fn().mockResolvedValue([{ ...validOmm, MEAN_MOTION: 'not-a-number' }]);
    const saveOmms = vi.fn();

    await expect(
      importSpaceTrackGpOmms({
        databaseUrl: 'postgresql://example',
        credentials: {
          identity: 'user@example.com',
          password: 'secret',
        },
        dependencies: {
          fetchGpOmms,
          saveOmms,
        },
      }),
    ).rejects.toThrow('Invalid OMM payload.');

    expect(saveOmms).not.toHaveBeenCalled();
  });
});
