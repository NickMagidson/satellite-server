import * as satellite from 'satellite.js';
import { describe, expect, it } from 'vitest';
import type { NormalizedOmmRecord, SatelliteEntry } from '../types.js';
import { highDragOmm, validOmm } from '../test/fixtures.js';
import { propagateSatellite } from './propagationService.js';

const DAY_MS = 86_400_000;

function createEntry(omm: NormalizedOmmRecord = validOmm): SatelliteEntry {
  return {
    id: String(omm.NORAD_CAT_ID),
    name: omm.OBJECT_NAME ?? 'ISS SAMPLE',
    omm,
    satrec: satellite.json2satrec(omm as satellite.OMMJsonObject),
  };
}

function daysAfterEpoch(omm: NormalizedOmmRecord, days: number): Date {
  return new Date(Date.parse(`${omm.EPOCH}Z`) + days * DAY_MS);
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

  it('propagates high-drag elements normally before they decay', () => {
    const result = propagateSatellite(createEntry(highDragOmm), daysAfterEpoch(highDragOmm, 2));

    expect(result.status).toBe('ok');
  });

  it.each([10, 30, 38])(
    'reports high-drag elements as decayed %i days after epoch instead of a bogus orbit',
    (days) => {
      const result = propagateSatellite(createEntry(highDragOmm), daysAfterEpoch(highDragOmm, days));

      expect(result).toMatchObject({
        status: 'propagation_failed',
        errorCode: satellite.SatRecError.Decayed,
      });
    },
  );
});
