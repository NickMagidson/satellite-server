import { createApp } from '../app.js';
import { SatelliteCatalog } from '../services/satelliteCatalog.js';
import { validOmm } from './fixtures.js';

export function createTestApp() {
  const catalog = new SatelliteCatalog({ updateIntervalMs: 1000 });
  catalog.loadOmms([validOmm]);

  const app = createApp({ catalog, databaseUrl: null });

  return {
    app,
    catalog,
    stop: () => catalog.stop(),
  };
}
