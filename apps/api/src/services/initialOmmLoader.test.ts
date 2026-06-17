import { describe, expect, it, vi } from 'vitest';
import type { NormalizedOmmRecord } from '../types.js';
import { validOmm } from '../test/fixtures.js';
import { SatelliteCatalog } from './satelliteCatalog.js';
import { loadInitialOmms } from './initialOmmLoader.js';

function createDependencies({
  storedRecords = [],
  starterPayload = [validOmm],
}: {
  storedRecords?: unknown[];
  starterPayload?: unknown;
} = {}) {
  return {
    loadStoredOmms: vi.fn().mockResolvedValue({ records: storedRecords }),
    saveOmms: vi.fn().mockResolvedValue(0),
    readJsonFile: vi.fn().mockResolvedValue(starterPayload),
  };
}

describe('loadInitialOmms', () => {
  it('loads existing records from the database without reading starter data', async () => {
    const catalog = new SatelliteCatalog({ updateIntervalMs: 1000 });
    const dependencies = createDependencies({ storedRecords: [validOmm] });

    const result = await loadInitialOmms({
      catalog,
      databaseUrl: 'postgresql://example',
      ommFile: '/starter/omms.json',
      dependencies,
    });

    expect(result).toEqual({
      count: 1,
      source: 'database',
    });
    expect(dependencies.loadStoredOmms).toHaveBeenCalledTimes(1);
    expect(dependencies.loadStoredOmms).toHaveBeenCalledWith('postgresql://example');
    expect(dependencies.readJsonFile).not.toHaveBeenCalled();
    expect(dependencies.saveOmms).not.toHaveBeenCalled();
    expect(catalog.getCurrentSnapshot()).toMatchObject({
      count: 1,
      positions: [expect.objectContaining({ id: '25544' })],
    });

    catalog.stop();
  });

  it('seeds empty databases from starter data and reloads stored records', async () => {
    const catalog = new SatelliteCatalog({ updateIntervalMs: 1000 });
    const seededOmm: NormalizedOmmRecord = {
      ...validOmm,
      OBJECT_NAME: 'SEEDED ISS',
    };
    const dependencies = createDependencies();
    dependencies.loadStoredOmms
      .mockResolvedValueOnce({ records: [] })
      .mockResolvedValueOnce({ records: [seededOmm] });

    const result = await loadInitialOmms({
      catalog,
      databaseUrl: 'postgresql://example',
      ommFile: '/starter/omms.json',
      dependencies,
    });

    expect(result).toEqual({
      count: 1,
      source: 'seeded-database',
    });
    expect(dependencies.readJsonFile).toHaveBeenCalledWith('/starter/omms.json');
    expect(dependencies.saveOmms).toHaveBeenCalledWith('postgresql://example', [validOmm]);
    expect(dependencies.loadStoredOmms).toHaveBeenCalledTimes(2);
    expect(catalog.getPosition('25544')).toMatchObject({
      name: 'SEEDED ISS',
    });

    catalog.stop();
  });

  it('loads starter data from file when no database is configured', async () => {
    const catalog = new SatelliteCatalog({ updateIntervalMs: 1000 });
    const dependencies = createDependencies();

    const result = await loadInitialOmms({
      catalog,
      databaseUrl: null,
      ommFile: '/starter/omms.json',
      dependencies,
    });

    expect(result).toEqual({
      count: 1,
      source: 'file',
    });
    expect(dependencies.loadStoredOmms).toHaveBeenCalledWith(null);
    expect(dependencies.readJsonFile).toHaveBeenCalledWith('/starter/omms.json');
    expect(dependencies.saveOmms).not.toHaveBeenCalled();
    expect(catalog.getCurrentSnapshot().count).toBe(1);

    catalog.stop();
  });

  it('fails startup when configured database reads fail', async () => {
    const catalog = new SatelliteCatalog({ updateIntervalMs: 1000 });
    const dependencies = createDependencies();
    dependencies.loadStoredOmms.mockRejectedValue(new Error('database unavailable'));

    await expect(
      loadInitialOmms({
        catalog,
        databaseUrl: 'postgresql://example',
        ommFile: '/starter/omms.json',
        dependencies,
      }),
    ).rejects.toThrow('database unavailable');

    expect(dependencies.readJsonFile).not.toHaveBeenCalled();
    expect(dependencies.saveOmms).not.toHaveBeenCalled();
  });
});
