import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { validOmm } from '../test/fixtures.js';
import { createTestApp } from '../test/createTestApp.js';

describe('satellite routes', () => {
  const apps: Array<ReturnType<typeof createTestApp>> = [];

  afterEach(() => {
    for (const app of apps) {
      app.stop();
    }
    apps.length = 0;
  });

  function createTrackedTestApp() {
    const testApp = createTestApp();
    apps.push(testApp);
    return testApp;
  }

  it('returns health status with the loaded satellite count', async () => {
    const { app } = createTrackedTestApp();

    const response = await request(app).get('/health').expect(200);

    expect(response.body).toMatchObject({
      ok: true,
      satellitesLoaded: 1,
    });
    expect(response.body.updatedAt).toEqual(expect.any(String));
  });

  it('returns satellite metadata', async () => {
    const { app } = createTrackedTestApp();

    const response = await request(app).get('/api/satellites').expect(200);

    expect(response.body).toMatchObject({
      count: 1,
      satellites: [
        expect.objectContaining({
          id: '25544',
          name: 'ISS SAMPLE',
          noradCatId: 25544,
        }),
      ],
    });
  });

  it('returns the current satellite position snapshot', async () => {
    const { app } = createTrackedTestApp();

    const response = await request(app).get('/api/satellites/positions').expect(200);

    expect(response.body).toMatchObject({
      updateIntervalMs: 1000,
      count: 1,
      positions: [
        expect.objectContaining({
          id: '25544',
          status: 'ok',
        }),
      ],
    });
  });

  it('returns positions for a requested timestamp', async () => {
    const { app } = createTrackedTestApp();
    const at = '2025-03-26T06:05:00.000Z';

    const response = await request(app)
      .get('/api/satellites/positions')
      .query({ at })
      .expect(200);

    expect(response.body).toMatchObject({
      propagatedAt: at,
      count: 1,
    });
    expect(response.body.positions[0]).toMatchObject({
      id: '25544',
      propagatedAt: at,
    });
  });

  it('returns a single satellite position', async () => {
    const { app } = createTrackedTestApp();

    const response = await request(app).get('/api/satellites/25544/position').expect(200);

    expect(response.body).toMatchObject({
      id: '25544',
      status: 'ok',
    });
  });

  it('returns 404 for unknown satellites', async () => {
    const { app } = createTrackedTestApp();

    const response = await request(app).get('/api/satellites/missing/position').expect(404);

    expect(response.body).toMatchObject({
      error: 'No satellite found for id missing',
    });
  });

  it('returns 400 for invalid requested timestamps', async () => {
    const { app } = createTrackedTestApp();

    const response = await request(app)
      .get('/api/satellites/positions')
      .query({ at: 'not-a-date' })
      .expect(400);

    expect(response.body).toMatchObject({
      error: 'at must be a valid ISO timestamp.',
    });
  });

  it('loads replacement OMM records without a configured database', async () => {
    const { app } = createTrackedTestApp();

    const response = await request(app)
      .post('/api/satellites/omms')
      .send([{ ...validOmm, OBJECT_NAME: 'UPDATED ISS SAMPLE' }])
      .expect(202);

    expect(response.body).toMatchObject({
      message: 'Loaded 1 satellite OMM record(s) (database not configured).',
      count: 1,
      positions: [
        expect.objectContaining({
          id: '25544',
          name: 'UPDATED ISS SAMPLE',
        }),
      ],
    });
  });

  it('returns structured validation details for invalid OMM payloads', async () => {
    const { app } = createTrackedTestApp();
    const { NORAD_CAT_ID, ...invalidOmm } = validOmm;

    const response = await request(app)
      .post('/api/satellites/omms')
      .send(invalidOmm)
      .expect(400);

    expect(response.body).toMatchObject({
      error: 'Invalid OMM payload.',
      details: [
        expect.objectContaining({
          field: 'NORAD_CAT_ID',
        }),
      ],
    });
  });
});
