import { createApp } from './app.js';
import { config } from './config.js';
import { SatelliteCatalog } from './services/satelliteCatalog.js';
import { readJsonFile } from './utils/jsonFile.js';

const catalog = new SatelliteCatalog({ updateIntervalMs: config.updateIntervalMs });
const app = createApp({ catalog });

async function loadInitialOmms(): Promise<void> {
  const payload = await readJsonFile(config.ommFile);
  const count = catalog.loadOmms(payload);
  catalog.start();
  console.log(`Loaded ${count} satellite OMM record(s) from ${config.ommFile}`);
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
