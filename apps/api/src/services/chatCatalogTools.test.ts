import { describe, expect, it } from 'vitest';
import { highDragOmm, secondValidOmm, validOmm } from '../test/fixtures.js';
import { SatelliteCatalog } from './satelliteCatalog.js';
import {
  getCurrentPosition,
  getSatelliteDetails,
  searchSatellites,
  validateSceneAction,
} from './chatCatalogTools.js';

function fixtureCatalog() {
  const catalog = new SatelliteCatalog({ liveRefreshEnabled: false });
  catalog.loadOmms([validOmm, secondValidOmm]);
  return catalog;
}

describe('chat catalog tools', () => {
  it('searches names, NORAD IDs, and object IDs without case sensitivity and caps results', () => {
    const catalog = fixtureCatalog();
    expect(searchSatellites(catalog, ' iss ', 20).map(({ id }) => id)).toEqual([
      '25544',
    ]);
    expect(searchSatellites(catalog, '25544', 20).map(({ id }) => id)).toEqual([
      '25544',
    ]);
    expect(
      searchSatellites(catalog, '1998-067a', 20).map(({ id }) => id),
    ).toEqual(['25544']);
    expect(searchSatellites(catalog, ' ', 20)).toEqual([]);

    catalog.loadOmms(
      Array.from({ length: 25 }, (_, index) => ({
        ...validOmm,
        NORAD_CAT_ID: index + 100,
        OBJECT_NAME: `TEST ${index}`,
      })),
    );
    expect(searchSatellites(catalog, 'test', 100)).toHaveLength(20);
    expect(searchSatellites(catalog, 'test', -5)).toHaveLength(1);
  });

  it('looks up details only for loaded IDs', () => {
    const catalog = fixtureCatalog();
    expect(getSatelliteDetails(catalog, '25544')).toMatchObject({
      name: 'ISS SAMPLE',
    });
    expect(getSatelliteDetails(catalog, 'missing')).toBeNull();
  });

  it('propagates at the requested time and reports element age even when live refresh is off', () => {
    const catalog = fixtureCatalog();
    const at = new Date('2025-03-27T06:00:00.000Z');
    const before = catalog.getCurrentSnapshot().propagatedAt;
    const result = getCurrentPosition(catalog, '25544', at);
    expect(result).toMatchObject({
      satellite: { id: '25544' },
      position: { propagatedAt: at.toISOString(), status: 'ok' },
      elementEpoch: validOmm.EPOCH,
      elementAgeDays: 1,
    });
    expect(catalog.getCurrentSnapshot().propagatedAt).toBe(before);
    expect(getCurrentPosition(catalog, 'missing', at)).toBeNull();
  });

  it('preserves propagation failure rather than reporting a successful position', () => {
    const catalog = new SatelliteCatalog({ liveRefreshEnabled: false });
    catalog.loadOmms([highDragOmm]);
    const result = getCurrentPosition(
      catalog,
      '64844',
      new Date('2026-08-27T06:00:00.000Z'),
    );
    expect(result?.position.status).toBe('propagation_failed');
  });

  it('accepts only scene actions with loaded IDs and available filter values', () => {
    const catalog = fixtureCatalog();
    expect(
      validateSceneAction(catalog, { type: 'selectSatellite', id: '25544' }),
    ).toEqual({
      type: 'selectSatellite',
      id: '25544',
    });
    expect(
      validateSceneAction(catalog, { type: 'selectSatellite', id: 'missing' }),
    ).toBeNull();
    expect(
      validateSceneAction(catalog, {
        type: 'patchFilters',
        patch: { orbitClasses: ['LEO'], countryCodes: ['US'] },
      }),
    ).toEqual({
      type: 'patchFilters',
      patch: { orbitClasses: ['LEO'], countryCodes: ['US'] },
    });
    expect(
      validateSceneAction(catalog, {
        type: 'patchFilters',
        patch: { countryCodes: ['UNKNOWN'] },
      }),
    ).toBeNull();
    expect(
      validateSceneAction(catalog, {
        type: 'patchFilters',
        patch: { orbitClasses: ['GEO'] },
      }),
    ).toBeNull();
    expect(
      validateSceneAction(catalog, {
        type: 'patchFilters',
        patch: { objectTypes: ['PAYLOAD', 'UNKNOWN'] },
      }),
    ).toBeNull();
    expect(
      validateSceneAction(catalog, {
        type: 'patchFilters',
        patch: { countryCodes: 'US' },
      }),
    ).toBeNull();
    expect(
      validateSceneAction(catalog, {
        type: 'patchFilters',
        patch: { wrong: ['US'] },
      }),
    ).toBeNull();
    expect(validateSceneAction(catalog, { type: 'resetFilters' })).toEqual({
      type: 'resetFilters',
    });
  });
});
