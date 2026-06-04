import { createApp } from './app.js';
import { config } from './config.js';
import { loadStoredOmms } from './services/ommRecordStore.js';
import { SatelliteCatalog } from './services/satelliteCatalog.js';
import { readJsonFile } from './utils/jsonFile.js';

const catalog = new SatelliteCatalog({ updateIntervalMs: config.updateIntervalMs });
const app = createApp({ catalog, databaseUrl: config.databaseUrl });

async function loadInitialOmms(): Promise<void> {
  const storedOmms = await loadStoredOmms(config.databaseUrl).catch((error: unknown) => {
    console.warn('Unable to load OMM records from database; falling back to OMM_FILE');
    console.warn(error);
    return { records: [] };
  });
  const hasStoredOmms = storedOmms.records.length > 0;
  const payload = hasStoredOmms ? storedOmms.records : await readJsonFile(config.ommFile);
  const count = catalog.loadOmms(payload);

  catalog.start();

  if (hasStoredOmms) {
    console.log(`Loaded ${count} satellite OMM record(s) from database`);
    return;
  }

  console.log(`No database OMM records found; loaded ${count} satellite OMM record(s) from ${config.ommFile}`);
}

loadInitialOmms()
  .then(() => {
    app.listen(config.port, () => {
      console.log(`Satellite position server running on http://localhost:${config.port}`);
    });
  })
  .catch((error) => {
    console.error(`Failed to load OMM JSON from ${config.ommFile}`);
    console.error(error);
    process.exit(1);
  });
