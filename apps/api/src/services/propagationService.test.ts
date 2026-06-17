import * as satellite from 'satellite.js';
import { describe, expect, it } from 'vitest';
import type { SatelliteEntry } from '../types.js';
import { validOmm } from '../test/fixtures.js';
import { propagateSatellite } from './propagationService.js';

function createEntry(): SatelliteEntry {
  return {
    id: String(validOmm.NORAD_CAT_ID),
    name: validOmm.OBJECT_NAME ?? 'ISS SAMPLE',
    omm: validOmm,
    satrec: satellite.json2satrec(validOmm as satellite.OMMJsonObject),
  };
}

describe('propagateSatellite', () => {
  it('returns geodetic, ECI, ECF, and velocity data for a valid OMM', () => {
    const result = propagateSatellite(createEntry(), new Date(validOmm.EPOCH));

    expect(result).toMatchObject({
      id: '25544',
      name: 'ISS SAMPLE',
      status: 'ok',
      propagatedAt: new Date(validOmm.EPOCH).toISOString(),
    });

    expect(result.status).toBe('ok');
    if (result.status !== 'ok') {
      throw new Error('Expected propagation to succeed.');
    }

    expect(result.geodetic.latitudeDeg).toBeGreaterThanOrEqual(-90);
    expect(result.geodetic.latitudeDeg).toBeLessThanOrEqual(90);
    expect(result.geodetic.longitudeDeg).toBeGreaterThanOrEqual(-180);
    expect(result.geodetic.longitudeDeg).toBeLessThanOrEqual(180);
    expect(result.geodetic.altitudeKm).toBeGreaterThan(100);
    expect(result.geodetic.altitudeKm).toBeLessThan(2000);
    expect(result.eci.xKm).toEqual(expect.any(Number));
    expect(result.ecf.zKm).toEqual(expect.any(Number));
    expect(result.velocityEci?.xKmPerSec).toEqual(expect.any(Number));
  });
});
