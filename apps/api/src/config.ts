import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

interface Config {
  port: number;
  ommFile: string;
  updateIntervalMs: number;
  livePositionRefreshEnabled: boolean;
  databaseUrl: string | null;
  corsOrigin: string;
  chatEnabled: boolean;
  openAiApiKey: string | null;
  openAiModel: string | null;
}

function readBooleanEnv(name: string, defaultValue: boolean): boolean {
  const value = process.env[name];

  if (value === undefined) {
    return defaultValue;
  }

  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
}

export const config: Config = {
  port: Number(process.env.PORT ?? 3000),
  ommFile:
    process.env.OMM_FILE ?? path.join(projectRoot, 'data', 'omm.sample.json'),
  updateIntervalMs: Number(process.env.UPDATE_INTERVAL_MS ?? 1000),
  livePositionRefreshEnabled: readBooleanEnv(
    'LIVE_POSITION_REFRESH_ENABLED',
    true,
  ),
  databaseUrl: process.env.DATABASE_URL?.trim() || null,
  corsOrigin: process.env.CORS_ORIGIN?.trim() || 'http://localhost:5173',
  chatEnabled: readBooleanEnv('LYNX_CHAT_ENABLED', false),
  openAiApiKey: process.env.OPENAI_API_KEY?.trim() || null,
  openAiModel: process.env.OPENAI_MODEL?.trim() || null,
};
