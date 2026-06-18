import { importSpaceTrackGpOmms } from '../services/spaceTrackImport.js';
import type { ImportSpaceTrackGpOptions } from '../services/spaceTrackImport.js';

function readRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}

function readOptionalPositiveIntegerEnv(name: string): number | undefined {
  const value = process.env[name];

  if (!value) {
    return undefined;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer when set.`);
  }

  return parsed;
}

async function main(): Promise<void> {
  const options: ImportSpaceTrackGpOptions = {
    credentials: {
      identity: readRequiredEnv('SPACE_TRACK_IDENTITY'),
      password: readRequiredEnv('SPACE_TRACK_PASSWORD'),
    },
    databaseUrl: readRequiredEnv('DATABASE_URL'),
  };
  const limit = readOptionalPositiveIntegerEnv('SPACE_TRACK_GP_LIMIT');
  const epochDaysBack = readOptionalPositiveIntegerEnv('SPACE_TRACK_GP_EPOCH_DAYS_BACK');
  const batchSize = readOptionalPositiveIntegerEnv('SPACE_TRACK_GP_BATCH_SIZE');

  if (limit !== undefined) {
    options.limit = limit;
  }

  if (epochDaysBack !== undefined) {
    options.epochDaysBack = epochDaysBack;
  }

  if (batchSize !== undefined) {
    options.batchSize = batchSize;
  }

  const result = await importSpaceTrackGpOmms(options);

  console.log(
    `Imported ${result.savedCount} Space-Track GP OMM record(s) from ${result.fetchedCount} fetched record(s).`,
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
