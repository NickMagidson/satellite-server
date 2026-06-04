import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

interface Config {
  port: number;
  ommFile: string;
  updateIntervalMs: number;
  databaseUrl: string | null;
}

export const config: Config = {
  port: Number(process.env.PORT ?? 3000),
  ommFile: process.env.OMM_FILE ?? path.join(projectRoot, 'data', 'omm.sample.json'),
  updateIntervalMs: Number(process.env.UPDATE_INTERVAL_MS ?? 1000),
  databaseUrl: process.env.DATABASE_URL?.trim() || null,
};
