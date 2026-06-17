import { createApp } from './app.js';
import { config } from './config.js';
import { loadInitialOmms } from './services/initialOmmLoader.js';
import { SatelliteCatalog } from './services/satelliteCatalog.js';

const catalog = new SatelliteCatalog({ updateIntervalMs: config.updateIntervalMs });
const app = createApp({ catalog, databaseUrl: config.databaseUrl });

loadInitialOmms({
  catalog,
  databaseUrl: config.databaseUrl,
  ommFile: config.ommFile,
})
  .then(({ count, source }) => {
    if (source === 'database') {
      console.log(`Loaded ${count} satellite OMM record(s) from database`);
    } else if (source === 'seeded-database') {
      console.log(`Seeded database from ${config.ommFile}; loaded ${count} satellite OMM record(s)`);
    } else {
      console.log(`Loaded ${count} satellite OMM record(s) from ${config.ommFile}`);
    }

    app.listen(config.port, () => {
      console.log(`Satellite position server running on http://localhost:${config.port}`);
    });
  })
  .catch((error) => {
    console.error('Failed to load initial OMM records');
    console.error(error);
    process.exit(1);
  });
