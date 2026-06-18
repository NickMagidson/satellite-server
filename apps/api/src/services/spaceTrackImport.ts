import type { NormalizedOmmRecord } from '../types.js';
import { validateAndNormalizeOmms } from '../validation/ommValidation.js';
import { saveOmms } from './ommRecordStore.js';
import { fetchSpaceTrackGpOmms, type SpaceTrackCredentials, type SpaceTrackGpQueryOptions } from './spaceTrackClient.js';

const DEFAULT_BATCH_SIZE = 500;

interface ImportSpaceTrackGpDependencies {
  fetchGpOmms: typeof fetchSpaceTrackGpOmms;
  saveOmms: typeof saveOmms;
}

export interface ImportSpaceTrackGpOptions extends SpaceTrackGpQueryOptions {
  credentials: SpaceTrackCredentials;
  databaseUrl: string | null;
  batchSize?: number;
  dependencies?: ImportSpaceTrackGpDependencies;
}

export interface ImportSpaceTrackGpResult {
  fetchedCount: number;
  savedCount: number;
  batchSize: number;
}

const defaultDependencies: ImportSpaceTrackGpDependencies = {
  fetchGpOmms: fetchSpaceTrackGpOmms,
  saveOmms,
};

function assertBatchSize(batchSize: number): void {
  if (!Number.isInteger(batchSize) || batchSize <= 0) {
    throw new Error('batchSize must be a positive integer.');
  }
}

async function saveOmmsInBatches(
  databaseUrl: string,
  omms: NormalizedOmmRecord[],
  batchSize: number,
  saveBatch: typeof saveOmms,
): Promise<number> {
  let savedCount = 0;

  for (let index = 0; index < omms.length; index += batchSize) {
    const batch = omms.slice(index, index + batchSize);
    savedCount += await saveBatch(databaseUrl, batch);
  }

  return savedCount;
}

export async function importSpaceTrackGpOmms({
  credentials,
  databaseUrl,
  batchSize = DEFAULT_BATCH_SIZE,
  dependencies = defaultDependencies,
  ...queryOptions
}: ImportSpaceTrackGpOptions): Promise<ImportSpaceTrackGpResult> {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not configured');
  }

  assertBatchSize(batchSize);

  const payload = await dependencies.fetchGpOmms({
    credentials,
    ...queryOptions,
  });
  const omms = validateAndNormalizeOmms(payload);
  const savedCount = await saveOmmsInBatches(databaseUrl, omms, batchSize, dependencies.saveOmms);

  return {
    fetchedCount: omms.length,
    savedCount,
    batchSize,
  };
}
