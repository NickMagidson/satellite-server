import { createApp } from './app.js';
import { config } from './config.js';
import { loadInitialOmms } from './services/initialOmmLoader.js';
import { SatelliteCatalog } from './services/satelliteCatalog.js';
import { createOpenAiChatService } from './services/chatService.js';

const catalog = new SatelliteCatalog({
  updateIntervalMs: config.updateIntervalMs,
  liveRefreshEnabled: config.livePositionRefreshEnabled,
});
const chatService =
  config.chatEnabled &&
  process.env.NODE_ENV !== 'production' &&
  config.openAiApiKey &&
  config.openAiModel
    ? createOpenAiChatService(catalog, {
        apiKey: config.openAiApiKey,
        model: config.openAiModel,
      })
    : null;
const app = createApp({
  catalog,
  databaseUrl: config.databaseUrl,
  corsOrigin: config.corsOrigin,
  chatEnabled: config.chatEnabled,
  chatService,
});

loadInitialOmms({
  catalog,
  databaseUrl: config.databaseUrl,
  ommFile: config.ommFile,
})
  .then(({ count, source }) => {
    if (source === 'database') {
      console.log(`Loaded ${count} satellite OMM record(s) from database`);
    } else if (source === 'seeded-database') {
      console.log(
        `Seeded database from ${config.ommFile}; loaded ${count} satellite OMM record(s)`,
      );
    } else {
      console.log(
        `Loaded ${count} satellite OMM record(s) from ${config.ommFile}`,
      );
    }

    const bindHost =
      process.env.API_BIND_HOST?.trim() ||
      (config.chatEnabled && process.env.NODE_ENV !== 'production'
        ? '127.0.0.1'
        : '0.0.0.0');
    app.listen(config.port, bindHost, () => {
      console.log(
        `Satellite position server running on http://localhost:${config.port}`,
      );
    });
  })
  .catch((error) => {
    console.error('Failed to load initial OMM records');
    console.error(error);
    process.exit(1);
  });
