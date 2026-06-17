import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpError } from '../errors.js';
import { validOmm } from '../test/fixtures.js';
import { SatelliteCatalog } from './satelliteCatalog.js';

describe('SatelliteCatalog', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('loads OMM records and exposes satellite metadata', () => {
    const catalog = new SatelliteCatalog({ updateIntervalMs: 1000 });

    expect(catalog.loadOmms([validOmm])).toBe(1);

    expect(catalog.getSatellites()).toEqual([
      expect.objectContaining({
        id: '25544',
        name: 'ISS SAMPLE',
        noradCatId: 25544,
        objectId: '1998-067A',
        classification: 'U',
      }),
    ]);
  });

  it('updates and returns the current position snapshot', () => {
    const catalog = new SatelliteCatalog({ updateIntervalMs: 5000 });
    const date = new Date(validOmm.EPOCH);

    catalog.loadOmms([validOmm]);
    catalog.updateCurrentPositions(date);

    const snapshot = catalog.getCurrentSnapshot();
    expect(snapshot).toMatchObject({
      propagatedAt: date.toISOString(),
      updateIntervalMs: 5000,
      count: 1,
    });
    expect(snapshot.positions[0]).toMatchObject({
      id: '25544',
      status: 'ok',
    });
  });

  it('propagates positions at a requested date without changing the live snapshot', () => {
    const catalog = new SatelliteCatalog({ updateIntervalMs: 1000 });
    const liveDate = new Date(validOmm.EPOCH);
    const requestedDate = new Date('2025-03-26T06:05:00.000Z');

    catalog.loadOmms([validOmm]);
    catalog.updateCurrentPositions(liveDate);

    const requestedSnapshot = catalog.getPositionsAt(requestedDate);

    expect(requestedSnapshot).toMatchObject({
      propagatedAt: requestedDate.toISOString(),
      count: 1,
    });
    expect(catalog.getCurrentSnapshot().propagatedAt).toBe(liveDate.toISOString());
  });

  it('returns a single current or requested position by id', () => {
    const catalog = new SatelliteCatalog({ updateIntervalMs: 1000 });
    const requestedDate = new Date('2025-03-26T06:10:00.000Z');

    catalog.loadOmms([validOmm]);

    expect(catalog.getPosition('25544')).toMatchObject({
      id: '25544',
      status: 'ok',
    });
    expect(catalog.getPosition('25544', requestedDate)).toMatchObject({
      id: '25544',
      propagatedAt: requestedDate.toISOString(),
    });
  });

  it('throws a 404 HttpError for unknown satellites', () => {
    const catalog = new SatelliteCatalog({ updateIntervalMs: 1000 });

    catalog.loadOmms([validOmm]);

    expect(() => catalog.getPosition('missing')).toThrow(HttpError);
    expect(() => catalog.getPosition('missing')).toThrow('No satellite found for id missing');
  });

  it('refreshes current positions on the configured interval', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(validOmm.EPOCH));

    const catalog = new SatelliteCatalog({ updateIntervalMs: 1000 });
    catalog.loadOmms([validOmm]);
    catalog.start();

    const firstPropagatedAt = catalog.getCurrentSnapshot().propagatedAt;
    vi.setSystemTime(new Date('2025-03-26T06:00:01.000Z'));
    vi.advanceTimersByTime(1000);

    expect(catalog.getCurrentSnapshot().propagatedAt).not.toBe(firstPropagatedAt);

    catalog.stop();
  });
});
